package com.leasrecover.modules.cases;

import com.leasrecover.core.tenant.TenantContextHolder;
import com.leasrecover.modules.cases.dto.NoteCreateRequest;
import com.leasrecover.modules.tenant.TenantConfig;
import com.leasrecover.modules.tenant.TenantConfigRepository;
import com.leasrecover.modules.client.ClientRepository;
import com.leasrecover.modules.contract.ContractRepository;
import com.leasrecover.modules.users.AppUser;
import com.leasrecover.modules.users.AppUserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import com.leasrecover.modules.tenant.TenantRepository;
import com.leasrecover.modules.notification.EmailService;

import java.time.ZonedDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class CaseAlertHealingTest {

    @Mock
    private CaseAlertRepository caseAlertRepository;

    @Mock
    private RecoveryCaseRepository recoveryCaseRepository;

    @Mock
    private TenantConfigRepository tenantConfigRepository;

    @Mock
    private AppUserRepository appUserRepository;

    @Mock
    private NoteRepository noteRepository;

    @Mock
    private CasePrerequisiteService casePrerequisiteService;

    @Mock
    private ClientRepository clientRepository;

    @Mock
    private ContractRepository contractRepository;

    @Mock
    private VehicleRepository vehicleRepository;

    @Mock
    private AIValuationRepository aiValuationRepository;

    @InjectMocks
    private CaseAlertService caseAlertService;

    @Mock
    private TenantRepository tenantRepository;

    @Mock
    private EmailService emailService;

    private CaseService caseService;
    private AlertEngineService alertEngineService;

    private UUID tenantId;
    private UUID caseId;
    private RecoveryCase recoveryCase;
    private AppUser gestionnaire;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        tenantId = UUID.randomUUID();
        caseId = UUID.randomUUID();
        TenantContextHolder.setTenantUuid(tenantId);
        TenantContextHolder.setTenantId("tenant_" + tenantId.toString().replace("-", ""));

        gestionnaire = new AppUser();
        gestionnaire.setId(UUID.randomUUID());
        gestionnaire.setTenantId(tenantId);
        gestionnaire.setEmail("gestionnaire@example.com");
        gestionnaire.setRole("GESTIONNAIRE");
        gestionnaire.setStatus("ACTIVE");

        recoveryCase = new RecoveryCase();
        recoveryCase.setId(caseId);
        recoveryCase.setTenantId(tenantId);
        recoveryCase.setStatus("ACTIVE");
        recoveryCase.setIsDeleted(false);
        recoveryCase.setCurrentPhase(RecoveryPhase.PRE_CONTENTIEUX);
        recoveryCase.setPhaseStartedAt(ZonedDateTime.now().minusDays(5));
        recoveryCase.setLastActionAt(ZonedDateTime.now().minusDays(5));

        // Instantiate CaseService manually to inject the mock dependencies + caseAlertService
        caseService = new CaseService(
                clientRepository,
                contractRepository,
                vehicleRepository,
                recoveryCaseRepository,
                appUserRepository,
                noteRepository,
                casePrerequisiteService,
                caseAlertRepository,
                aiValuationRepository,
                caseAlertService,
                tenantRepository,
                emailService
        );

        when(recoveryCaseRepository.save(any(RecoveryCase.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Instantiate AlertEngineService
        alertEngineService = new AlertEngineService(
                tenantConfigRepository,
                recoveryCaseRepository,
                caseAlertRepository
        );
    }

    @Test
    void testDormancyHealing_WhenNoteAdded_ResolvesAlert() {
        // Arrange
        when(recoveryCaseRepository.findById(caseId)).thenReturn(Optional.of(recoveryCase));
        when(appUserRepository.findByEmailAndIsDeletedFalse("gestionnaire@example.com")).thenReturn(Optional.of(gestionnaire));
        when(noteRepository.save(any(Note.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Mock that there is an active dormancy alert
        CaseAlert dormancyAlert = new CaseAlert();
        dormancyAlert.setId(UUID.randomUUID());
        dormancyAlert.setCaseId(caseId);
        dormancyAlert.setAlertType("DORMANCY");
        dormancyAlert.setIsResolved(false);

        when(caseAlertRepository.findAllByCaseIdAndAlertTypeAndIsResolvedFalse(caseId, "DORMANCY"))
                .thenReturn(List.of(dormancyAlert));

        NoteCreateRequest request = new NoteCreateRequest();
        request.setContent("This is a healing note");

        // Act
        caseService.addNote(caseId, request, "gestionnaire@example.com");

        // Assert
        assertTrue(dormancyAlert.getIsResolved());
        assertNotNull(dormancyAlert.getResolvedAt());
        verify(caseAlertRepository).save(dormancyAlert);
        assertNotEquals(ZonedDateTime.now().minusDays(5).toLocalDate(), recoveryCase.getLastActionAt().toLocalDate());
    }

    @Test
    void testDeadlineHealing_WhenPhaseAdvanced_ResolvesAlert() {
        // Arrange
        when(recoveryCaseRepository.findById(caseId)).thenReturn(Optional.of(recoveryCase));
        when(appUserRepository.findByEmailAndIsDeletedFalse("gestionnaire@example.com")).thenReturn(Optional.of(gestionnaire));
        when(casePrerequisiteService.checkPrerequisites(any(), any())).thenReturn(Collections.emptyList());

        // Mock that there is an active deadline alert
        CaseAlert deadlineAlert = new CaseAlert();
        deadlineAlert.setId(UUID.randomUUID());
        deadlineAlert.setCaseId(caseId);
        deadlineAlert.setAlertType("DEADLINE");
        deadlineAlert.setIsResolved(false);

        when(caseAlertRepository.findAllByCaseIdAndAlertTypeAndIsResolvedFalse(caseId, "DEADLINE"))
                .thenReturn(List.of(deadlineAlert));

        // Act
        caseService.advancePhase(caseId, "gestionnaire@example.com");

        // Assert
        assertTrue(deadlineAlert.getIsResolved());
        assertNotNull(deadlineAlert.getResolvedAt());
        verify(caseAlertRepository).save(deadlineAlert);
    }

    @Test
    void testUrgencyEscalation_UpgradesWarningToCritical() {
        // Arrange
        TenantConfig config = new TenantConfig();
        config.setTenantId(tenantId);
        config.setDormancyThresholdDays(30);
        Map<String, Integer> phaseLegalDelays = new HashMap<>();
        phaseLegalDelays.put("PRE_CONTENTIEUX", 10);
        config.setPhaseLegalDelays(phaseLegalDelays);

        when(tenantConfigRepository.findById(tenantId)).thenReturn(Optional.of(config));

        // Backdate phase started at so that it has expired (11 days ago with limit of 10 days)
        recoveryCase.setPhaseStartedAt(ZonedDateTime.now().minusDays(11));

        // Mock that there is an active warning alert
        CaseAlert warningAlert = new CaseAlert();
        warningAlert.setId(UUID.randomUUID());
        warningAlert.setCaseId(caseId);
        warningAlert.setAlertType("DEADLINE");
        warningAlert.setCriticality("WARNING");
        warningAlert.setIsResolved(false);

        when(recoveryCaseRepository.findAll()).thenReturn(List.of(recoveryCase));
        when(caseAlertRepository.findByCaseIdAndAlertTypeAndIsResolvedFalse(caseId, "DEADLINE"))
                .thenReturn(Optional.of(warningAlert));

        // Act
        alertEngineService.processAlertsForTenant(tenantId);

        // Assert
        assertEquals("CRITICAL", warningAlert.getCriticality());
        verify(caseAlertRepository).save(warningAlert);
    }

    @Test
    void testDormancyHealing_WhenMultipleDuplicateAlertsExist_ResolvesAll() {
        // Arrange
        CaseAlert alert1 = new CaseAlert();
        alert1.setId(UUID.randomUUID());
        alert1.setCaseId(caseId);
        alert1.setAlertType("DORMANCY");
        alert1.setIsResolved(false);

        CaseAlert alert2 = new CaseAlert();
        alert2.setId(UUID.randomUUID());
        alert2.setCaseId(caseId);
        alert2.setAlertType("DORMANCY");
        alert2.setIsResolved(false);

        when(caseAlertRepository.findAllByCaseIdAndAlertTypeAndIsResolvedFalse(caseId, "DORMANCY"))
                .thenReturn(List.of(alert1, alert2));

        // Act
        caseAlertService.resolveDormancyAlert(caseId);

        // Assert
        assertTrue(alert1.getIsResolved());
        assertTrue(alert2.getIsResolved());
        verify(caseAlertRepository).save(alert1);
        verify(caseAlertRepository).save(alert2);
    }
}
