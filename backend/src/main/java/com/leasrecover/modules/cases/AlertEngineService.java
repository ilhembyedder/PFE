package com.leasrecover.modules.cases;

import com.leasrecover._common.util.UuidCreator;
import com.leasrecover.modules.tenant.TenantConfig;
import com.leasrecover.modules.tenant.TenantConfigRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.ZonedDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
public class AlertEngineService {

    private static final Logger log = LoggerFactory.getLogger(AlertEngineService.class);

    private final TenantConfigRepository tenantConfigRepository;
    private final RecoveryCaseRepository recoveryCaseRepository;
    private final CaseAlertRepository caseAlertRepository;

    public AlertEngineService(
            TenantConfigRepository tenantConfigRepository,
            RecoveryCaseRepository recoveryCaseRepository,
            CaseAlertRepository caseAlertRepository) {
        this.tenantConfigRepository = tenantConfigRepository;
        this.recoveryCaseRepository = recoveryCaseRepository;
        this.caseAlertRepository = caseAlertRepository;
    }

    @Transactional
    public void processAlertsForTenant(UUID tenantId) {
        log.info("Processing alerts for tenant UUID: {}", tenantId);

        Optional<TenantConfig> configOpt = tenantConfigRepository.findById(tenantId);
        if (configOpt.isEmpty()) {
            log.warn("Tenant config not found for tenant: {}. Skipping alert generation.", tenantId);
            return;
        }

        TenantConfig config = configOpt.get();
        Integer dormancyThresholdDays = config.getDormancyThresholdDays();
        Map<String, Integer> phaseLegalDelays = config.getPhaseLegalDelays();

        List<RecoveryCase> cases = recoveryCaseRepository.findAll();
        ZonedDateTime now = ZonedDateTime.now();

        for (RecoveryCase rcase : cases) {
            // Only process cases belonging to this tenant
            if (!tenantId.equals(rcase.getTenantId())) {
                continue;
            }

            // If case is deleted or inactive, resolve any active alerts and skip alert generation
            if ((rcase.getIsDeleted() != null && rcase.getIsDeleted()) || !"ACTIVE".equalsIgnoreCase(rcase.getStatus())) {
                resolveExistingAlert(rcase.getId(), "DORMANCY", now);
                resolveExistingAlert(rcase.getId(), "DEADLINE", now);
                continue;
            }

            // 1. Dormancy Check
            processDormancyAlert(rcase, dormancyThresholdDays, now, tenantId);

            // 2. Deadline Check
            processDeadlineAlert(rcase, phaseLegalDelays, now, tenantId);
        }
    }

    private void processDormancyAlert(RecoveryCase rcase, Integer dormancyThresholdDays, ZonedDateTime now, UUID tenantId) {
        if (dormancyThresholdDays == null || dormancyThresholdDays <= 0) {
            resolveExistingAlert(rcase.getId(), "DORMANCY", now);
            return;
        }

        ZonedDateTime lastAction = rcase.getLastActionAt();
        if (lastAction == null) {
            lastAction = rcase.getCreatedAt();
        }

        if (lastAction != null) {
            ZonedDateTime dormancyLimit = lastAction.plusDays(dormancyThresholdDays);
            if (now.isAfter(dormancyLimit)) {
                String message = String.format("Le dossier est dormant. Aucune action n'a été enregistrée depuis plus de %d jours.", dormancyThresholdDays);
                createOrUpdateAlert(rcase.getId(), "DORMANCY", "CRITICAL", message, tenantId, now);
            } else {
                resolveExistingAlert(rcase.getId(), "DORMANCY", now);
            }
        }
    }

    private void processDeadlineAlert(RecoveryCase rcase, Map<String, Integer> phaseLegalDelays, ZonedDateTime now, UUID tenantId) {
        if (phaseLegalDelays == null || rcase.getCurrentPhase() == null) {
            resolveExistingAlert(rcase.getId(), "DEADLINE", now);
            return;
        }

        String phaseName = rcase.getCurrentPhase().name();
        Integer legalDelayDays = phaseLegalDelays.get(phaseName);

        if (legalDelayDays == null || legalDelayDays <= 0) {
            resolveExistingAlert(rcase.getId(), "DEADLINE", now);
            return;
        }

        ZonedDateTime phaseStarted = rcase.getPhaseStartedAt();
        if (phaseStarted == null) {
            phaseStarted = rcase.getCreatedAt();
        }

        if (phaseStarted != null) {
            ZonedDateTime expirationTime = phaseStarted.plusDays(legalDelayDays);
            ZonedDateTime warningTime = expirationTime.minusDays(2);

            if (now.isAfter(expirationTime)) {
                String message = String.format("Échéance dépassée pour la phase %s (limite de %d jours dépassée).", phaseName, legalDelayDays);
                createOrUpdateAlert(rcase.getId(), "DEADLINE", "CRITICAL", message, tenantId, now);
            } else if (now.isAfter(warningTime)) {
                String message = String.format("Échéance proche pour la phase %s (limite de %d jours, expiration dans moins de 2 jours).", phaseName, legalDelayDays);
                createOrUpdateAlert(rcase.getId(), "DEADLINE", "WARNING", message, tenantId, now);
            } else {
                resolveExistingAlert(rcase.getId(), "DEADLINE", now);
            }
        }
    }

    private void createOrUpdateAlert(UUID caseId, String alertType, String criticality, String message, UUID tenantId, ZonedDateTime now) {
        Optional<CaseAlert> existingAlertOpt = caseAlertRepository.findByCaseIdAndAlertTypeAndIsResolvedFalse(caseId, alertType);

        if (existingAlertOpt.isPresent()) {
            CaseAlert alert = existingAlertOpt.get();
            if (!criticality.equals(alert.getCriticality()) || !message.equals(alert.getMessage())) {
                alert.setCriticality(criticality);
                alert.setMessage(message);
                alert.setUpdatedAt(now);
                caseAlertRepository.save(alert);
            }
        } else {
            CaseAlert alert = new CaseAlert();
            alert.setId(UuidCreator.createUuidV7());
            alert.setTenantId(tenantId);
            alert.setCaseId(caseId);
            alert.setAlertType(alertType);
            alert.setCriticality(criticality);
            alert.setMessage(message);
            alert.setIsResolved(false);
            alert.setCreatedAt(now);
            alert.setUpdatedAt(now);
            caseAlertRepository.save(alert);
        }
    }

    private void resolveExistingAlert(UUID caseId, String alertType, ZonedDateTime now) {
        Optional<CaseAlert> existingAlertOpt = caseAlertRepository.findByCaseIdAndAlertTypeAndIsResolvedFalse(caseId, alertType);
        if (existingAlertOpt.isPresent()) {
            CaseAlert alert = existingAlertOpt.get();
            alert.setIsResolved(true);
            alert.setResolvedAt(now);
            alert.setUpdatedAt(now);
            caseAlertRepository.save(alert);
        }
    }
}
