package com.leasrecover.modules.cases;

import com.leasrecover.modules.tenant.TenantConfig;
import com.leasrecover.modules.tenant.TenantConfigRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.time.ZonedDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class AlertEngineServiceTest {

    @Mock
    private TenantConfigRepository tenantConfigRepository;

    @Mock
    private RecoveryCaseRepository recoveryCaseRepository;

    @Mock
    private CaseAlertRepository caseAlertRepository;

    @InjectMocks
    private AlertEngineService alertEngineService;

    private UUID tenantId;
    private TenantConfig tenantConfig;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        tenantId = UUID.randomUUID();
        tenantConfig = new TenantConfig();
        tenantConfig.setTenantId(tenantId);
        tenantConfig.setDormancyThresholdDays(30);

        Map<String, Integer> phaseLegalDelays = new HashMap<>();
        phaseLegalDelays.put("PRE_CONTENTIEUX", 10);
        phaseLegalDelays.put("MISE_EN_DEMEURE", 20);
        tenantConfig.setPhaseLegalDelays(phaseLegalDelays);

        when(tenantConfigRepository.findById(tenantId)).thenReturn(Optional.of(tenantConfig));
    }

    @Test
    void testProcessAlerts_DormancyTriggered() {
        RecoveryCase rcase = new RecoveryCase();
        rcase.setId(UUID.randomUUID());
        rcase.setTenantId(tenantId);
        rcase.setStatus("ACTIVE");
        rcase.setIsDeleted(false);
        rcase.setLastActionAt(ZonedDateTime.now().minusDays(35));

        when(recoveryCaseRepository.findAll()).thenReturn(List.of(rcase));
        when(caseAlertRepository.findByCaseIdAndAlertTypeAndIsResolvedFalse(rcase.getId(), "DORMANCY"))
                .thenReturn(Optional.empty());

        alertEngineService.processAlertsForTenant(tenantId);

        ArgumentCaptor<CaseAlert> alertCaptor = ArgumentCaptor.forClass(CaseAlert.class);
        verify(caseAlertRepository, atLeastOnce()).save(alertCaptor.capture());
        
        CaseAlert savedAlert = alertCaptor.getAllValues().stream()
                .filter(a -> "DORMANCY".equals(a.getAlertType()))
                .findFirst().orElse(null);

        assertNotNull(savedAlert);
        assertEquals("CRITICAL", savedAlert.getCriticality());
        assertFalse(savedAlert.getIsResolved());
        assertTrue(savedAlert.getMessage().contains("dormant"));
    }

    @Test
    void testProcessAlerts_DormancyResolved() {
        RecoveryCase rcase = new RecoveryCase();
        rcase.setId(UUID.randomUUID());
        rcase.setTenantId(tenantId);
        rcase.setStatus("ACTIVE");
        rcase.setIsDeleted(false);
        rcase.setLastActionAt(ZonedDateTime.now().minusDays(5));

        CaseAlert existingAlert = new CaseAlert();
        existingAlert.setId(UUID.randomUUID());
        existingAlert.setCaseId(rcase.getId());
        existingAlert.setAlertType("DORMANCY");
        existingAlert.setIsResolved(false);

        when(recoveryCaseRepository.findAll()).thenReturn(List.of(rcase));
        when(caseAlertRepository.findByCaseIdAndAlertTypeAndIsResolvedFalse(rcase.getId(), "DORMANCY"))
                .thenReturn(Optional.of(existingAlert));

        alertEngineService.processAlertsForTenant(tenantId);

        assertTrue(existingAlert.getIsResolved());
        assertNotNull(existingAlert.getResolvedAt());
        verify(caseAlertRepository).save(existingAlert);
    }

    @Test
    void testProcessAlerts_DeadlineWarning_Within2Days() {
        RecoveryCase rcase = new RecoveryCase();
        rcase.setId(UUID.randomUUID());
        rcase.setTenantId(tenantId);
        rcase.setStatus("ACTIVE");
        rcase.setIsDeleted(false);
        rcase.setCurrentPhase(RecoveryPhase.PRE_CONTENTIEUX);
        rcase.setPhaseStartedAt(ZonedDateTime.now().minusDays(9));

        when(recoveryCaseRepository.findAll()).thenReturn(List.of(rcase));
        when(caseAlertRepository.findByCaseIdAndAlertTypeAndIsResolvedFalse(rcase.getId(), "DEADLINE"))
                .thenReturn(Optional.empty());

        alertEngineService.processAlertsForTenant(tenantId);

        ArgumentCaptor<CaseAlert> alertCaptor = ArgumentCaptor.forClass(CaseAlert.class);
        verify(caseAlertRepository, atLeastOnce()).save(alertCaptor.capture());
        
        CaseAlert savedAlert = alertCaptor.getAllValues().stream()
                .filter(a -> "DEADLINE".equals(a.getAlertType()))
                .findFirst().orElse(null);

        assertNotNull(savedAlert);
        assertEquals("WARNING", savedAlert.getCriticality());
        assertFalse(savedAlert.getIsResolved());
        assertTrue(savedAlert.getMessage().contains("proche"));
    }

    @Test
    void testProcessAlerts_DeadlineCritical_Expired() {
        RecoveryCase rcase = new RecoveryCase();
        rcase.setId(UUID.randomUUID());
        rcase.setTenantId(tenantId);
        rcase.setStatus("ACTIVE");
        rcase.setIsDeleted(false);
        rcase.setCurrentPhase(RecoveryPhase.PRE_CONTENTIEUX);
        rcase.setPhaseStartedAt(ZonedDateTime.now().minusDays(11));

        when(recoveryCaseRepository.findAll()).thenReturn(List.of(rcase));
        when(caseAlertRepository.findByCaseIdAndAlertTypeAndIsResolvedFalse(rcase.getId(), "DEADLINE"))
                .thenReturn(Optional.empty());

        alertEngineService.processAlertsForTenant(tenantId);

        ArgumentCaptor<CaseAlert> alertCaptor = ArgumentCaptor.forClass(CaseAlert.class);
        verify(caseAlertRepository, atLeastOnce()).save(alertCaptor.capture());
        
        CaseAlert savedAlert = alertCaptor.getAllValues().stream()
                .filter(a -> "DEADLINE".equals(a.getAlertType()))
                .findFirst().orElse(null);

        assertNotNull(savedAlert);
        assertEquals("CRITICAL", savedAlert.getCriticality());
        assertFalse(savedAlert.getIsResolved());
        assertTrue(savedAlert.getMessage().contains("dépassée"));
    }

    @Test
    void testProcessAlerts_DeadlineSafe_NoAlert() {
        RecoveryCase rcase = new RecoveryCase();
        rcase.setId(UUID.randomUUID());
        rcase.setTenantId(tenantId);
        rcase.setStatus("ACTIVE");
        rcase.setIsDeleted(false);
        rcase.setCurrentPhase(RecoveryPhase.PRE_CONTENTIEUX);
        rcase.setPhaseStartedAt(ZonedDateTime.now().minusDays(5));

        when(recoveryCaseRepository.findAll()).thenReturn(List.of(rcase));
        when(caseAlertRepository.findByCaseIdAndAlertTypeAndIsResolvedFalse(rcase.getId(), "DEADLINE"))
                .thenReturn(Optional.empty());

        alertEngineService.processAlertsForTenant(tenantId);

        verify(caseAlertRepository, never()).save(argThat(alert -> "DEADLINE".equals(alert.getAlertType())));
    }

    @Test
    void testProcessAlerts_CaseInactive_ResolvesAlerts() {
        RecoveryCase rcase = new RecoveryCase();
        rcase.setId(UUID.randomUUID());
        rcase.setTenantId(tenantId);
        rcase.setStatus("CLOTURE"); // Inactive case
        rcase.setIsDeleted(false);

        CaseAlert existingDormancyAlert = new CaseAlert();
        existingDormancyAlert.setId(UUID.randomUUID());
        existingDormancyAlert.setCaseId(rcase.getId());
        existingDormancyAlert.setAlertType("DORMANCY");
        existingDormancyAlert.setIsResolved(false);

        CaseAlert existingDeadlineAlert = new CaseAlert();
        existingDeadlineAlert.setId(UUID.randomUUID());
        existingDeadlineAlert.setCaseId(rcase.getId());
        existingDeadlineAlert.setAlertType("DEADLINE");
        existingDeadlineAlert.setIsResolved(false);

        when(recoveryCaseRepository.findAll()).thenReturn(List.of(rcase));
        when(caseAlertRepository.findByCaseIdAndAlertTypeAndIsResolvedFalse(rcase.getId(), "DORMANCY"))
                .thenReturn(Optional.of(existingDormancyAlert));
        when(caseAlertRepository.findByCaseIdAndAlertTypeAndIsResolvedFalse(rcase.getId(), "DEADLINE"))
                .thenReturn(Optional.of(existingDeadlineAlert));

        alertEngineService.processAlertsForTenant(tenantId);

        assertTrue(existingDormancyAlert.getIsResolved());
        assertNotNull(existingDormancyAlert.getResolvedAt());
        assertTrue(existingDeadlineAlert.getIsResolved());
        assertNotNull(existingDeadlineAlert.getResolvedAt());

        verify(caseAlertRepository).save(existingDormancyAlert);
        verify(caseAlertRepository).save(existingDeadlineAlert);
    }

    @Test
    void testProcessAlerts_CaseDeleted_ResolvesAlerts() {
        RecoveryCase rcase = new RecoveryCase();
        rcase.setId(UUID.randomUUID());
        rcase.setTenantId(tenantId);
        rcase.setStatus("ACTIVE");
        rcase.setIsDeleted(true); // Deleted case

        CaseAlert existingDormancyAlert = new CaseAlert();
        existingDormancyAlert.setId(UUID.randomUUID());
        existingDormancyAlert.setCaseId(rcase.getId());
        existingDormancyAlert.setAlertType("DORMANCY");
        existingDormancyAlert.setIsResolved(false);

        CaseAlert existingDeadlineAlert = new CaseAlert();
        existingDeadlineAlert.setId(UUID.randomUUID());
        existingDeadlineAlert.setCaseId(rcase.getId());
        existingDeadlineAlert.setAlertType("DEADLINE");
        existingDeadlineAlert.setIsResolved(false);

        when(recoveryCaseRepository.findAll()).thenReturn(List.of(rcase));
        when(caseAlertRepository.findByCaseIdAndAlertTypeAndIsResolvedFalse(rcase.getId(), "DORMANCY"))
                .thenReturn(Optional.of(existingDormancyAlert));
        when(caseAlertRepository.findByCaseIdAndAlertTypeAndIsResolvedFalse(rcase.getId(), "DEADLINE"))
                .thenReturn(Optional.of(existingDeadlineAlert));

        alertEngineService.processAlertsForTenant(tenantId);

        assertTrue(existingDormancyAlert.getIsResolved());
        assertNotNull(existingDormancyAlert.getResolvedAt());
        assertTrue(existingDeadlineAlert.getIsResolved());
        assertNotNull(existingDeadlineAlert.getResolvedAt());

        verify(caseAlertRepository).save(existingDormancyAlert);
        verify(caseAlertRepository).save(existingDeadlineAlert);
    }
}
