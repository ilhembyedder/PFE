package com.leasrecover.modules.cases;

import com.leasrecover.core.tenant.TenantContextHolder;
import com.leasrecover.modules.tenant.TenantConfig;
import com.leasrecover.modules.tenant.TenantConfigRepository;
import com.leasrecover.modules.notification.ValuationProgressService;
import com.leasrecover.modules.notification.AiProgressPayload;
import com.leasrecover.modules.contract.Contract;
import com.leasrecover._common.util.UuidCreator;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class AIValuationServiceTest {

    @Mock
    private AIValuationRepository aiValuationRepository;

    @Mock
    private TenantConfigRepository tenantConfigRepository;

    @Mock
    private ValuationProgressService valuationProgressService;

    @Mock
    private VehicleRepository vehicleRepository;

    @Mock
    private CaseAlertRepository caseAlertRepository;

    @InjectMocks
    private AIValuationService aiValuationService;

    private UUID tenantId;
    private UUID caseId;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        tenantId = UUID.randomUUID();
        caseId = UUID.randomUUID();
        TenantContextHolder.setTenantUuid(tenantId);
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    @Test
    void testProcessWebhookCallback_Success_CalculatesReliable() {
        // Arrange
        AIValuation valuation = new AIValuation();
        valuation.setId(UUID.randomUUID());
        valuation.setTenantId(tenantId);
        valuation.setStatus("PENDING");

        RecoveryCase recoveryCase = new RecoveryCase();
        recoveryCase.setId(caseId);
        recoveryCase.setInitialResidualValueCents(100000L); // 1000.00
        valuation.setRecoveryCase(recoveryCase);

        when(aiValuationRepository.findFirstByRecoveryCaseIdAndStatusOrderByCreatedAtDesc(caseId, "PENDING"))
                .thenReturn(Optional.of(valuation));

        TenantConfig tenantConfig = new TenantConfig();
        tenantConfig.setTenantId(tenantId);
        tenantConfig.setAiDeviationModerate(new BigDecimal("10.00"));
        tenantConfig.setAiDeviationCritical(new BigDecimal("20.00"));
        when(tenantConfigRepository.findById(tenantId)).thenReturn(Optional.of(tenantConfig));

        Map<String, Object> data = new HashMap<>();
        data.put("brand", "Audi");
        data.put("model", "A4");
        data.put("year", 2021);
        data.put("mileage", 45000);
        data.put("condition", "Excellent");
        data.put("marketValueCents", 95000L); // 950.00 (deviation = -50.00 i.e. 5% depreciation)
        data.put("currencyCode", "EUR");

        AiProgressPayload payload = new AiProgressPayload();
        payload.setCaseId(caseId);
        payload.setTenantId(tenantId);
        payload.setStatus("SUCCESS");
        payload.setData(data);

        // Act
        aiValuationService.processWebhookCallback(payload);

        // Assert
        verify(aiValuationRepository).saveAndFlush(valuation);
        assertEquals("SUCCESS", valuation.getStatus());
        assertEquals("Audi", valuation.getExtractedBrand());
        assertEquals("A4", valuation.getExtractedModel());
        assertEquals(2021, valuation.getExtractedYear());
        assertEquals(45000, valuation.getExtractedMileage());
        assertEquals("Excellent", valuation.getExtractedCondition());
        assertEquals(95000L, valuation.getEstimatedMarketValueCents());
        assertEquals("EUR", valuation.getCurrencyCode());
        assertEquals(-5000L, valuation.getDeviationValueCents()); // 95000 - 100000
        assertEquals(new BigDecimal("5.00"), valuation.getDeviationPercentage());
        assertEquals("RELIABLE", valuation.getReliabilityIndicator());

        @SuppressWarnings("unchecked")
        ArgumentCaptor<Map<String, Object>> sseCaptor = ArgumentCaptor.forClass(Map.class);
        verify(valuationProgressService).sendProgress(eq(caseId), sseCaptor.capture());
        verify(valuationProgressService).completeEmitter(caseId);

        Map<String, Object> sseData = sseCaptor.getValue();
        assertEquals("SUCCESS", sseData.get("status"));
        assertEquals("Audi", sseData.get("brand"));
        assertEquals(95000L, sseData.get("marketValueCents"));
        assertEquals(-5000L, sseData.get("deviationValueCents"));
        assertEquals(new BigDecimal("5.00"), sseData.get("deviationPercentage"));
        assertEquals("RELIABLE", sseData.get("reliabilityIndicator"));
    }

    @Test
    void testProcessWebhookCallback_Success_CalculatesModerateRisk() {
        // Arrange
        AIValuation valuation = new AIValuation();
        valuation.setTenantId(tenantId);
        valuation.setStatus("PENDING");

        RecoveryCase recoveryCase = new RecoveryCase();
        recoveryCase.setId(caseId);
        recoveryCase.setInitialResidualValueCents(100000L); // 1000.00
        valuation.setRecoveryCase(recoveryCase);

        when(aiValuationRepository.findFirstByRecoveryCaseIdAndStatusOrderByCreatedAtDesc(caseId, "PENDING"))
                .thenReturn(Optional.of(valuation));

        TenantConfig tenantConfig = new TenantConfig();
        tenantConfig.setTenantId(tenantId);
        tenantConfig.setAiDeviationModerate(new BigDecimal("10.00"));
        tenantConfig.setAiDeviationCritical(new BigDecimal("20.00"));
        when(tenantConfigRepository.findById(tenantId)).thenReturn(Optional.of(tenantConfig));

        Map<String, Object> data = new HashMap<>();
        data.put("brand", "Audi");
        data.put("model", "A4");
        data.put("marketValueCents", 115000L); // 1150.00 (+15.00% deviation)

        AiProgressPayload payload = new AiProgressPayload();
        payload.setCaseId(caseId);
        payload.setStatus("SUCCESS");
        payload.setData(data);

        // Act
        aiValuationService.processWebhookCallback(payload);

        // Assert
        verify(aiValuationRepository).saveAndFlush(valuation);
        assertEquals(15000L, valuation.getDeviationValueCents());
        assertEquals(new BigDecimal("15.00"), valuation.getDeviationPercentage());
        assertEquals("MODERATE_RISK", valuation.getReliabilityIndicator());
    }

    @Test
    void testProcessWebhookCallback_Success_CalculatesCriticalRisk() {
        // Arrange
        AIValuation valuation = new AIValuation();
        valuation.setTenantId(tenantId);
        valuation.setStatus("PENDING");

        RecoveryCase recoveryCase = new RecoveryCase();
        recoveryCase.setId(caseId);
        recoveryCase.setInitialResidualValueCents(100000L); // 1000.00
        valuation.setRecoveryCase(recoveryCase);

        when(aiValuationRepository.findFirstByRecoveryCaseIdAndStatusOrderByCreatedAtDesc(caseId, "PENDING"))
                .thenReturn(Optional.of(valuation));

        TenantConfig tenantConfig = new TenantConfig();
        tenantConfig.setTenantId(tenantId);
        tenantConfig.setAiDeviationModerate(new BigDecimal("10.00"));
        tenantConfig.setAiDeviationCritical(new BigDecimal("20.00"));
        when(tenantConfigRepository.findById(tenantId)).thenReturn(Optional.of(tenantConfig));

        Map<String, Object> data = new HashMap<>();
        data.put("brand", "Audi");
        data.put("model", "A4");
        data.put("marketValueCents", 75000L); // 750.00 (-25.00% deviation)

        AiProgressPayload payload = new AiProgressPayload();
        payload.setCaseId(caseId);
        payload.setStatus("SUCCESS");
        payload.setData(data);

        // Act
        aiValuationService.processWebhookCallback(payload);

        // Assert
        verify(aiValuationRepository).saveAndFlush(valuation);
        assertEquals(-25000L, valuation.getDeviationValueCents());
        assertEquals(new BigDecimal("25.00"), valuation.getDeviationPercentage());
        assertEquals("CRITICAL_RISK", valuation.getReliabilityIndicator());
    }

    @Test
    void testProcessWebhookCallback_Success_ResilientToZeroInitialResidual() {
        // Arrange
        AIValuation valuation = new AIValuation();
        valuation.setTenantId(tenantId);
        valuation.setStatus("PENDING");

        RecoveryCase recoveryCase = new RecoveryCase();
        recoveryCase.setId(caseId);
        recoveryCase.setInitialResidualValueCents(0L); // division-by-zero risk
        valuation.setRecoveryCase(recoveryCase);

        when(aiValuationRepository.findFirstByRecoveryCaseIdAndStatusOrderByCreatedAtDesc(caseId, "PENDING"))
                .thenReturn(Optional.of(valuation));

        Map<String, Object> data = new HashMap<>();
        data.put("brand", "Audi");
        data.put("model", "A4");
        data.put("marketValueCents", 50000L);

        AiProgressPayload payload = new AiProgressPayload();
        payload.setCaseId(caseId);
        payload.setStatus("SUCCESS");
        payload.setData(data);

        // Act
        aiValuationService.processWebhookCallback(payload);

        // Assert
        verify(aiValuationRepository).saveAndFlush(valuation);
        assertEquals(50000L, valuation.getDeviationValueCents());
        assertEquals(BigDecimal.ZERO.setScale(2), valuation.getDeviationPercentage());
        assertEquals("RELIABLE", valuation.getReliabilityIndicator());
    }

    @Test
    void testProcessWebhookCallback_Success_ResilientToNullInitialResidual() {
        // Arrange
        AIValuation valuation = new AIValuation();
        valuation.setTenantId(tenantId);
        valuation.setStatus("PENDING");

        RecoveryCase recoveryCase = new RecoveryCase();
        recoveryCase.setId(caseId);
        recoveryCase.setInitialResidualValueCents(null);
        valuation.setRecoveryCase(recoveryCase);

        when(aiValuationRepository.findFirstByRecoveryCaseIdAndStatusOrderByCreatedAtDesc(caseId, "PENDING"))
                .thenReturn(Optional.of(valuation));

        Map<String, Object> data = new HashMap<>();
        data.put("brand", "Audi");
        data.put("model", "A4");
        data.put("marketValueCents", 50000L);

        AiProgressPayload payload = new AiProgressPayload();
        payload.setCaseId(caseId);
        payload.setStatus("SUCCESS");
        payload.setData(data);

        // Act
        aiValuationService.processWebhookCallback(payload);

        // Assert
        verify(aiValuationRepository).saveAndFlush(valuation);
        assertEquals(50000L, valuation.getDeviationValueCents());
        assertEquals(BigDecimal.ZERO.setScale(2), valuation.getDeviationPercentage());
        assertEquals("RELIABLE", valuation.getReliabilityIndicator());
    }

    @Test
    void testProcessWebhookCallback_Failed_HandlesFailure() {
        // Arrange
        AiProgressPayload payload = new AiProgressPayload();
        payload.setCaseId(caseId);
        payload.setStatus("FAILED");
        payload.setMessage("FastAPI failed processing");

        // Act
        aiValuationService.processWebhookCallback(payload);

        // Assert
        verify(valuationProgressService).updateValuationStatus(caseId, "FAILED");
        @SuppressWarnings("unchecked")
        ArgumentCaptor<Map<String, Object>> sseCaptor = ArgumentCaptor.forClass(Map.class);
        verify(valuationProgressService).sendProgress(eq(caseId), sseCaptor.capture());
        verify(valuationProgressService).completeEmitter(caseId);

        Map<String, Object> sseData = sseCaptor.getValue();
        assertEquals("FAILED", sseData.get("status"));
        assertEquals("FastAPI failed processing", sseData.get("message"));
    }

    @Test
    void testProcessWebhookCallback_NotFound_ThrowsException() {
        // Arrange
        when(aiValuationRepository.findFirstByRecoveryCaseIdAndStatusOrderByCreatedAtDesc(caseId, "PENDING"))
                .thenReturn(Optional.empty());

        AiProgressPayload payload = new AiProgressPayload();
        payload.setCaseId(caseId);
        payload.setStatus("SUCCESS");
        payload.setData(new HashMap<>());

        // Act & Assert
        assertThrows(ResponseStatusException.class, () -> aiValuationService.processWebhookCallback(payload));
    }

    @Test
    void testProcessWebhookCallback_DiscrepancyGeneratesAlert() {
        // Arrange
        AIValuation valuation = new AIValuation();
        valuation.setId(UUID.randomUUID());
        valuation.setTenantId(tenantId);
        valuation.setStatus("PENDING");

        Contract contract = new Contract();
        contract.setId(UUID.randomUUID());

        RecoveryCase recoveryCase = new RecoveryCase();
        recoveryCase.setId(caseId);
        recoveryCase.setContract(contract);
        recoveryCase.setInitialResidualValueCents(100000L);
        valuation.setRecoveryCase(recoveryCase);

        Vehicle vehicle = new Vehicle();
        vehicle.setBrand("Peugeot");
        vehicle.setModel("3008");
        vehicle.setYear(2020);

        when(aiValuationRepository.findFirstByRecoveryCaseIdAndStatusOrderByCreatedAtDesc(caseId, "PENDING"))
                .thenReturn(Optional.of(valuation));
        when(vehicleRepository.findByContract(contract)).thenReturn(Optional.of(vehicle));
        when(caseAlertRepository.findByCaseIdAndAlertTypeAndIsResolvedFalse(caseId, "VEHICLE_DISCREPANCY"))
                .thenReturn(Optional.empty());

        Map<String, Object> data = new HashMap<>();
        data.put("brand", "Renault"); // mismatch
        data.put("model", "3008");
        data.put("year", 2020);
        data.put("marketValueCents", 90000L);

        AiProgressPayload payload = new AiProgressPayload();
        payload.setCaseId(caseId);
        payload.setTenantId(tenantId);
        payload.setStatus("SUCCESS");
        payload.setData(data);

        // Act
        aiValuationService.processWebhookCallback(payload);

        // Assert
        ArgumentCaptor<CaseAlert> alertCaptor = ArgumentCaptor.forClass(CaseAlert.class);
        verify(caseAlertRepository).save(alertCaptor.capture());
        CaseAlert savedAlert = alertCaptor.getValue();
        assertEquals("VEHICLE_DISCREPANCY", savedAlert.getAlertType());
        assertEquals("WARNING", savedAlert.getCriticality());
        assertFalse(savedAlert.getIsResolved());
        assertTrue(savedAlert.getMessage().contains("Peugeot"));
    }

    @Test
    void testProcessWebhookCallback_NoDiscrepancyResolvesAlert() {
        // Arrange
        AIValuation valuation = new AIValuation();
        valuation.setId(UUID.randomUUID());
        valuation.setTenantId(tenantId);
        valuation.setStatus("PENDING");

        Contract contract = new Contract();
        contract.setId(UUID.randomUUID());

        RecoveryCase recoveryCase = new RecoveryCase();
        recoveryCase.setId(caseId);
        recoveryCase.setContract(contract);
        recoveryCase.setInitialResidualValueCents(100000L);
        valuation.setRecoveryCase(recoveryCase);

        Vehicle vehicle = new Vehicle();
        vehicle.setBrand("Peugeot");
        vehicle.setModel("3008");
        vehicle.setYear(2020);

        CaseAlert existingAlert = new CaseAlert();
        existingAlert.setId(UUID.randomUUID());
        existingAlert.setAlertType("VEHICLE_DISCREPANCY");
        existingAlert.setIsResolved(false);

        when(aiValuationRepository.findFirstByRecoveryCaseIdAndStatusOrderByCreatedAtDesc(caseId, "PENDING"))
                .thenReturn(Optional.of(valuation));
        when(vehicleRepository.findByContract(contract)).thenReturn(Optional.of(vehicle));
        when(caseAlertRepository.findByCaseIdAndAlertTypeAndIsResolvedFalse(caseId, "VEHICLE_DISCREPANCY"))
                .thenReturn(Optional.of(existingAlert));

        Map<String, Object> data = new HashMap<>();
        data.put("brand", "peugeot"); // match (case-insensitive)
        data.put("model", " 3008 "); // match (whitespace-insensitive)
        data.put("year", 2020);
        data.put("marketValueCents", 90000L);

        AiProgressPayload payload = new AiProgressPayload();
        payload.setCaseId(caseId);
        payload.setTenantId(tenantId);
        payload.setStatus("SUCCESS");
        payload.setData(data);

        // Act
        aiValuationService.processWebhookCallback(payload);

        // Assert
        verify(caseAlertRepository).save(existingAlert);
        assertTrue(existingAlert.getIsResolved());
        assertNotNull(existingAlert.getResolvedAt());
    }
}
