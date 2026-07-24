package com.leasrecover.modules.cases;

import com.leasrecover.core.tenant.TenantContextHolder;
import com.leasrecover.modules.cases.dto.PriorityAlertResponse;
import com.leasrecover.modules.users.AppUser;
import com.leasrecover.modules.users.AppUserRepository;
import com.leasrecover.modules.client.ClientRepository;
import com.leasrecover.modules.contract.ContractRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.time.ZonedDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class CaseAlertServiceTest {

    @Mock
    private CaseAlertRepository caseAlertRepository;

    @Mock
    private RecoveryCaseRepository recoveryCaseRepository;

    @Mock
    private AppUserRepository appUserRepository;

    @Mock
    private ClientRepository clientRepository;

    @Mock
    private ContractRepository contractRepository;

    @Mock
    private VehicleRepository vehicleRepository;

    @Mock
    private NoteRepository noteRepository;

    @Mock
    private CasePrerequisiteService casePrerequisiteService;

    @Mock
    private AIValuationRepository aiValuationRepository;

    @Mock
    private CaseAlertService caseAlertService;

    @InjectMocks
    private CaseService caseService;

    private UUID tenantId;
    private AppUser user;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        tenantId = UUID.randomUUID();
        TenantContextHolder.setTenantUuid(tenantId);
        TenantContextHolder.setTenantId("tenant_" + tenantId.toString().replace("-", ""));

        user = new AppUser();
        user.setId(UUID.randomUUID());
        user.setTenantId(tenantId);
        user.setEmail("gestionnaire@example.com");
        user.setRole("GESTIONNAIRE");
        user.setStatus("ACTIVE");
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    @Test
    void testGetPriorityAlerts_SortsCriticalBeforeWarning() {
        // Arrange
        String email = "gestionnaire@example.com";
        when(appUserRepository.findByEmailAndIsDeletedFalse(email)).thenReturn(Optional.of(user));

        ZonedDateTime now = ZonedDateTime.now();

        // alert1: WARNING, created 5 days ago
        CaseAlert alert1 = new CaseAlert();
        alert1.setId(UUID.randomUUID());
        alert1.setCaseId(UUID.randomUUID());
        alert1.setCriticality("WARNING");
        alert1.setCreatedAt(now.minusDays(5));
        alert1.setIsResolved(false);

        // alert2: CRITICAL, created 1 day ago
        CaseAlert alert2 = new CaseAlert();
        alert2.setId(UUID.randomUUID());
        alert2.setCaseId(UUID.randomUUID());
        alert2.setCriticality("CRITICAL");
        alert2.setCreatedAt(now.minusDays(1));
        alert2.setIsResolved(false);

        // alert3: CRITICAL, created 10 days ago
        CaseAlert alert3 = new CaseAlert();
        alert3.setId(UUID.randomUUID());
        alert3.setCaseId(UUID.randomUUID());
        alert3.setCriticality("CRITICAL");
        alert3.setCreatedAt(now.minusDays(10));
        alert3.setIsResolved(false);

        // alert4: WARNING, created 15 days ago
        CaseAlert alert4 = new CaseAlert();
        alert4.setId(UUID.randomUUID());
        alert4.setCaseId(UUID.randomUUID());
        alert4.setCriticality("WARNING");
        alert4.setCreatedAt(now.minusDays(15));
        alert4.setIsResolved(false);

        List<CaseAlert> rawAlerts = Arrays.asList(alert1, alert2, alert3, alert4);
        when(caseAlertRepository.findAllByTenantIdAndIsResolvedFalse(tenantId)).thenReturn(rawAlerts);
        when(recoveryCaseRepository.findById(any())).thenReturn(Optional.empty());

        // Act
        List<PriorityAlertResponse> results = caseService.getPriorityAlerts(email);

        // Assert
        assertEquals(4, results.size());
        assertEquals(alert3.getId(), results.get(0).getAlertId());
        assertEquals(alert2.getId(), results.get(1).getAlertId());
        assertEquals(alert4.getId(), results.get(2).getAlertId());
        assertEquals(alert1.getId(), results.get(3).getAlertId());
    }

    @Test
    void testGetPriorityAlerts_IgnoresResolvedAlertsAndLimitsToFive() {
        // Arrange
        String email = "gestionnaire@example.com";
        when(appUserRepository.findByEmailAndIsDeletedFalse(email)).thenReturn(Optional.of(user));

        ZonedDateTime now = ZonedDateTime.now();

        // Create 7 active alerts
        List<CaseAlert> activeAlerts = new java.util.ArrayList<>();
        for (int i = 0; i < 7; i++) {
            CaseAlert alert = new CaseAlert();
            alert.setId(UUID.randomUUID());
            alert.setCaseId(UUID.randomUUID());
            alert.setCriticality("CRITICAL");
            alert.setCreatedAt(now.minusDays(i));
            alert.setIsResolved(false);
            activeAlerts.add(alert);
        }

        when(caseAlertRepository.findAllByTenantIdAndIsResolvedFalse(tenantId)).thenReturn(activeAlerts);
        when(recoveryCaseRepository.findById(any())).thenReturn(Optional.empty());

        // Act
        List<PriorityAlertResponse> results = caseService.getPriorityAlerts(email);

        // Assert
        assertEquals(5, results.size());
    }
}
