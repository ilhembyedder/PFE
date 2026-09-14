package com.leasrecover.modules.cases;

import com.leasrecover.core.tenant.TenantContextHolder;
import com.leasrecover.modules.tenant.TenantConfig;
import com.leasrecover.modules.tenant.TenantConfigRepository;
import com.leasrecover.modules.notification.ValuationProgressService;
import com.leasrecover.modules.notification.AiProgressPayload;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.leasrecover._common.util.UuidCreator;
import com.leasrecover.modules.cases.dto.CaseValuationResponse;
import com.leasrecover.modules.users.AppUser;
import com.leasrecover.modules.users.AppUserRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.ZonedDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
public class AIValuationService {

    private static final Logger log = LoggerFactory.getLogger(AIValuationService.class);

    private final AIValuationRepository aiValuationRepository;
    private final TenantConfigRepository tenantConfigRepository;
    private final ValuationProgressService valuationProgressService;
    private final AppUserRepository appUserRepository;
    private final VehicleRepository vehicleRepository;
    private final CaseAlertRepository caseAlertRepository;

    public AIValuationService(
            AIValuationRepository aiValuationRepository,
            TenantConfigRepository tenantConfigRepository,
            ValuationProgressService valuationProgressService,
            AppUserRepository appUserRepository,
            VehicleRepository vehicleRepository,
            CaseAlertRepository caseAlertRepository) {
        this.aiValuationRepository = aiValuationRepository;
        this.tenantConfigRepository = tenantConfigRepository;
        this.valuationProgressService = valuationProgressService;
        this.appUserRepository = appUserRepository;
        this.vehicleRepository = vehicleRepository;
        this.caseAlertRepository = caseAlertRepository;
    }

    @Transactional
    public void processWebhookCallback(AiProgressPayload payload) {
        UUID caseId = payload.getCaseId();
        String status = payload.getStatus();

        log.info("Processing AI valuation webhook callback for caseId: {}, status: {}", caseId, status);

        if ("SUCCESS".equalsIgnoreCase(status)) {
            processSuccessCallback(payload);
        } else if ("FAILED".equalsIgnoreCase(status)) {
            processFailedCallback(payload);
        } else {
            // Just pass intermediate progress updates directly to the client via SSE
            valuationProgressService.sendProgress(caseId, payload);
        }
    }

    private void processSuccessCallback(AiProgressPayload payload) {
        UUID caseId = payload.getCaseId();

        // 1. Retrieve latest AIValuation for case
        AIValuation valuation = aiValuationRepository.findFirstByRecoveryCaseIdOrderByCreatedAtDesc(caseId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No AI valuation found for case " + caseId));

        RecoveryCase recoveryCase = valuation.getRecoveryCase();
        if (recoveryCase == null) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Associated recovery case not found for AI valuation");
        }

        // 2. Retrieve TenantConfig
        UUID tenantUuid = TenantContextHolder.getTenantUuid();
        if (tenantUuid == null) {
            tenantUuid = valuation.getTenantId();
        }
        TenantConfig tenantConfig = tenantConfigRepository.findById(tenantUuid).orElse(null);

        double moderate = 10.0;
        double critical = 20.0;
        if (tenantConfig != null) {
            if (tenantConfig.getAiDeviationModerate() != null) {
                moderate = tenantConfig.getAiDeviationModerate().doubleValue();
            }
            if (tenantConfig.getAiDeviationCritical() != null) {
                critical = tenantConfig.getAiDeviationCritical().doubleValue();
            }
        }

        // 3. Extract payload data
        @SuppressWarnings("unchecked")
        Map<String, Object> data = (Map<String, Object>) payload.getData();
        if (data == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "FastAPI success payload is missing data object");
        }

        String brand = data.get("brand") != null ? data.get("brand").toString() : null;
        String model = data.get("model") != null ? data.get("model").toString() : null;
        Integer year = null;
        if (data.get("year") != null) {
            year = ((Number) data.get("year")).intValue();
        }
        Integer mileage = null;
        if (data.get("mileage") != null) {
            mileage = ((Number) data.get("mileage")).intValue();
        }
        String condition = data.get("condition") != null ? data.get("condition").toString() : null;
        Long marketValueCents = 0L;
        if (data.get("marketValueCents") != null) {
            marketValueCents = ((Number) data.get("marketValueCents")).longValue();
        }
        String currencyCode = data.get("currencyCode") != null ? data.get("currencyCode").toString() : null;

        // 4. Calculate Deviation Value
        Long initialResidual = recoveryCase.getInitialResidualValueCents();
        long initialResidualVal = initialResidual != null ? initialResidual : 0L;
        long deviationValueCents = marketValueCents - initialResidualVal;

        // 5. Calculate Deviation Percentage
        double deviationPercentage = 0.0;
        if (initialResidualVal > 0) {
            deviationPercentage = ((double) Math.abs(deviationValueCents) / initialResidualVal) * 100.0;
        }

        // 6. Determine Reliability Indicator
        String reliabilityIndicator;
        if (deviationPercentage < moderate) {
            reliabilityIndicator = "RELIABLE";
        } else if (deviationPercentage >= moderate && deviationPercentage < critical) {
            reliabilityIndicator = "MODERATE_RISK";
        } else {
            reliabilityIndicator = "CRITICAL_RISK";
        }

        // 7. Populate and Persist Entity
        valuation.setExtractedBrand(brand);
        valuation.setExtractedModel(model);
        valuation.setExtractedYear(year);
        valuation.setExtractedMileage(mileage);
        valuation.setExtractedCondition(condition);
        valuation.setEstimatedMarketValueCents(marketValueCents);
        valuation.setCurrencyCode(currencyCode);
        valuation.setDeviationValueCents(deviationValueCents);
        
        // Safety cap for percentage in NUMERIC(5,2) i.e. max 999.99
        double storedPercentage = Math.min(deviationPercentage, 999.99);
        valuation.setDeviationPercentage(BigDecimal.valueOf(storedPercentage).setScale(2, RoundingMode.HALF_UP));
        valuation.setReliabilityIndicator(reliabilityIndicator);
        valuation.setStatus("SUCCESS");
        valuation.setProcessedAt(ZonedDateTime.now());

        // Fuzzy comparison checks for vehicle discrepancy
        Vehicle vehicle = vehicleRepository.findByContract(recoveryCase.getContract()).orElse(null);
        if (vehicle != null) {
            String cleanExtBrand = brand != null ? brand.toLowerCase().replaceAll("\\s+", "") : "";
            String cleanVehBrand = vehicle.getBrand() != null ? vehicle.getBrand().toLowerCase().replaceAll("\\s+", "") : "";
            
            String cleanExtModel = model != null ? model.toLowerCase().replaceAll("\\s+", "") : "";
            String cleanVehModel = vehicle.getModel() != null ? vehicle.getModel().toLowerCase().replaceAll("\\s+", "") : "";
            
            boolean brandMatch = cleanExtBrand.equals(cleanVehBrand);
            boolean modelMatch = cleanExtModel.equals(cleanVehModel);
            boolean yearMatch = (year != null && vehicle.getYear() != null && year.equals(vehicle.getYear()));
            
            if (!brandMatch || !modelMatch || !yearMatch) {
                String alertMsg = String.format(
                    "Écart détecté: L'expertise indique %s %s (%s) alors que le contrat spécifie %s %s (%s).",
                    brand != null ? brand : "N/A",
                    model != null ? model : "N/A",
                    year != null ? year.toString() : "N/A",
                    vehicle.getBrand() != null ? vehicle.getBrand() : "N/A",
                    vehicle.getModel() != null ? vehicle.getModel() : "N/A",
                    vehicle.getYear() != null ? vehicle.getYear().toString() : "N/A"
                );
                
                Optional<CaseAlert> existingAlertOpt = caseAlertRepository.findByCaseIdAndAlertTypeAndIsResolvedFalse(caseId, "VEHICLE_DISCREPANCY");
                if (existingAlertOpt.isPresent()) {
                    CaseAlert existingAlert = existingAlertOpt.get();
                    existingAlert.setMessage(alertMsg);
                    existingAlert.setUpdatedAt(ZonedDateTime.now());
                    caseAlertRepository.save(existingAlert);
                } else {
                    CaseAlert newAlert = new CaseAlert();
                    newAlert.setId(UuidCreator.createUuidV7());
                    newAlert.setTenantId(tenantUuid);
                    newAlert.setCaseId(caseId);
                    newAlert.setAlertType("VEHICLE_DISCREPANCY");
                    newAlert.setCriticality("WARNING");
                    newAlert.setMessage(alertMsg);
                    newAlert.setIsResolved(false);
                    newAlert.setCreatedAt(ZonedDateTime.now());
                    newAlert.setUpdatedAt(ZonedDateTime.now());
                    caseAlertRepository.save(newAlert);
                }
            } else {
                Optional<CaseAlert> existingAlertOpt = caseAlertRepository.findByCaseIdAndAlertTypeAndIsResolvedFalse(caseId, "VEHICLE_DISCREPANCY");
                if (existingAlertOpt.isPresent()) {
                    CaseAlert existingAlert = existingAlertOpt.get();
                    existingAlert.setIsResolved(true);
                    existingAlert.setResolvedAt(ZonedDateTime.now());
                    existingAlert.setUpdatedAt(ZonedDateTime.now());
                    caseAlertRepository.save(existingAlert);
                }
            }
        }

        aiValuationRepository.saveAndFlush(valuation);
        log.info("Saved AIValuation with deviation percentage: {}, reliability: {}", valuation.getDeviationPercentage(), reliabilityIndicator);

        // 8. Fire final SSE event
        Map<String, Object> ssePayload = new HashMap<>();
        ssePayload.put("caseId", caseId);
        ssePayload.put("status", "SUCCESS");
        ssePayload.put("brand", brand);
        ssePayload.put("model", model);
        ssePayload.put("year", year);
        ssePayload.put("marketValueCents", marketValueCents);
        ssePayload.put("deviationValueCents", deviationValueCents);
        ssePayload.put("deviationPercentage", valuation.getDeviationPercentage());
        ssePayload.put("reliabilityIndicator", reliabilityIndicator);

        valuationProgressService.sendProgress(caseId, ssePayload);
        valuationProgressService.completeEmitter(caseId);
    }

    private void processFailedCallback(AiProgressPayload payload) {
        UUID caseId = payload.getCaseId();
        valuationProgressService.updateValuationStatus(caseId, "FAILED");
        
        Map<String, Object> ssePayload = new HashMap<>();
        ssePayload.put("caseId", caseId);
        ssePayload.put("status", "FAILED");
        ssePayload.put("message", payload.getMessage());

        valuationProgressService.sendProgress(caseId, ssePayload);
        valuationProgressService.completeEmitter(caseId);
    }

    @Transactional(readOnly = true)
    public CaseValuationResponse getValuationByCaseId(UUID caseId, String userEmail) {
        UUID tenantId = TenantContextHolder.getTenantUuid();
        if (tenantId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No active tenant context found");
        }

        if (userEmail == null || userEmail.trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User email is missing");
        }

        AppUser user = appUserRepository.findByEmailAndIsDeletedFalse(userEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));

        if (!"GESTIONNAIRE".equals(user.getRole()) && !"ADMIN".equals(user.getRole())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied: GESTIONNAIRE or ADMIN role required");
        }

        Optional<AIValuation> valuationOpt = aiValuationRepository.findFirstByRecoveryCaseIdAndStatusOrderByCreatedAtDesc(caseId, "SUCCESS");
        if (valuationOpt.isEmpty()) {
            Optional<AIValuation> failedOpt = aiValuationRepository.findFirstByRecoveryCaseIdAndStatusOrderByCreatedAtDesc(caseId, "FAILED");
            if (failedOpt.isPresent()) {
                throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "Le document est illisible ou n'est pas un rapport d'expertise valide.");
            }
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "No successful AI valuation found for case " + caseId);
        }
        AIValuation valuation = valuationOpt.get();

        if (!tenantId.equals(valuation.getTenantId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied: Valuation does not belong to active tenant");
        }

        RecoveryCase recoveryCase = valuation.getRecoveryCase();
        Long initialResidualValueCents = recoveryCase != null ? recoveryCase.getInitialResidualValueCents() : 0L;

        CaseValuationResponse response = new CaseValuationResponse();
        response.setCaseId(caseId);
        response.setMarketValueCents(valuation.getEstimatedMarketValueCents());
        response.setInitialResidualValueCents(initialResidualValueCents);
        response.setDeviationValueCents(valuation.getDeviationValueCents());
        response.setDeviationPercentage(valuation.getDeviationPercentage());
        response.setReliabilityIndicator(valuation.getReliabilityIndicator());
        response.setCurrencyCode(valuation.getCurrencyCode());
        response.setExtractedBrand(valuation.getExtractedBrand());
        response.setExtractedModel(valuation.getExtractedModel());
        response.setExtractedYear(valuation.getExtractedYear());
        response.setExtractedMileage(valuation.getExtractedMileage());
        response.setExtractedCondition(valuation.getExtractedCondition());

        return response;
    }
}
