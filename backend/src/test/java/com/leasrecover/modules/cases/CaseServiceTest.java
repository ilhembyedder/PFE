package com.leasrecover.modules.cases;

import com.leasrecover.core.tenant.TenantContextHolder;
import com.leasrecover.modules.cases.dto.*;
import com.leasrecover.modules.client.Client;
import com.leasrecover.modules.client.ClientRepository;
import com.leasrecover.modules.contract.Contract;
import com.leasrecover.modules.contract.ContractRepository;
import com.leasrecover.modules.users.AppUser;
import com.leasrecover.modules.users.AppUserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import com.leasrecover.modules.tenant.TenantRepository;
import com.leasrecover.modules.tenant.Tenant;
import com.leasrecover.modules.notification.EmailService;
import org.springframework.web.server.ResponseStatusException;
import java.time.ZonedDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class CaseServiceTest {

    @Mock
    private ClientRepository clientRepository;

    @Mock
    private ContractRepository contractRepository;

    @Mock
    private VehicleRepository vehicleRepository;

    @Mock
    private RecoveryCaseRepository recoveryCaseRepository;

    @Mock
    private AppUserRepository appUserRepository;

    @Mock
    private NoteRepository noteRepository;

    @Mock
    private CasePrerequisiteService casePrerequisiteService;

    @Mock
    private CaseAlertService caseAlertService;

    @Mock
    private TenantRepository tenantRepository;

    @Mock
    private EmailService emailService;

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
    void testCreateCase_Success() {
        CaseCreateRequest request = new CaseCreateRequest();
        request.setClientFullName("Client Name");
        request.setClientRegistrationNumber("123456A");
        request.setClientContactEmail("client@example.com");
        request.setClientContactPhone("555-1234");
        request.setClientAddress("123 Street");
        request.setContractReferenceNumber("REF-123");
        request.setContractStartDate(ZonedDateTime.now());
        request.setContractEndDate(ZonedDateTime.now().plusYears(1));
        request.setContractStatus("ACTIVE");
        request.setVehicleVin("VIN123456789");
        request.setVehicleLicensePlate("ABC-123");
        request.setVehicleBrand("Brand");
        request.setVehicleModel("Model");
        request.setVehicleYear(2025);
        request.setInitialResidualValueCents(1500000L);

        when(appUserRepository.findByEmailAndIsDeletedFalse("gestionnaire@example.com")).thenReturn(Optional.of(user));

        when(clientRepository.save(any(Client.class))).thenAnswer(i -> i.getArgument(0));
        when(contractRepository.save(any(Contract.class))).thenAnswer(i -> i.getArgument(0));
        when(vehicleRepository.save(any(Vehicle.class))).thenAnswer(i -> i.getArgument(0));
        when(recoveryCaseRepository.save(any(RecoveryCase.class))).thenAnswer(i -> i.getArgument(0));

        CaseResponse response = caseService.createCase(request, "gestionnaire@example.com");

        assertNotNull(response);
        assertEquals(tenantId, response.getTenantId());
        assertEquals("ACTIVE", response.getStatus());
        assertEquals("PRE_CONTENTIEUX", response.getCurrentPhase());
        assertEquals(1500000L, response.getInitialResidualValueCents());
        assertEquals("TND", response.getCurrencyCode());
        assertEquals(user.getId(), response.getAssigneeId());
        assertEquals("Client Name", response.getClient().getFullNameOrCompany());
        assertEquals("REF-123", response.getContract().getReferenceNumber());
        assertEquals("VIN123456789", response.getVehicle().getVin());

        verify(clientRepository).save(any(Client.class));
        verify(contractRepository).save(any(Contract.class));
        verify(vehicleRepository).save(any(Vehicle.class));
        verify(recoveryCaseRepository).save(any(RecoveryCase.class));
    }

    @Test
    void testCreateCase_ReuseExistingClientAndContract() {
        CaseCreateRequest request = new CaseCreateRequest();
        request.setClientFullName("Client Name");
        request.setClientRegistrationNumber("123456A");
        request.setClientContactEmail("client@example.com");
        request.setClientContactPhone("555-1234");
        request.setClientAddress("123 Street");
        request.setContractReferenceNumber("REF-123");
        request.setContractStartDate(ZonedDateTime.now());
        request.setContractEndDate(ZonedDateTime.now().plusYears(1));
        request.setContractStatus("ACTIVE");
        request.setVehicleVin("VIN123456789");
        request.setVehicleLicensePlate("ABC-123");
        request.setVehicleBrand("Brand");
        request.setVehicleModel("Model");
        request.setVehicleYear(2025);
        request.setInitialResidualValueCents(1500000L);

        Client existingClient = new Client();
        existingClient.setId(UUID.randomUUID());
        existingClient.setTenantId(tenantId);
        existingClient.setFullNameOrCompany("Client Name");
        existingClient.setRegistrationNumber("123456A");

        Contract existingContract = new Contract();
        existingContract.setId(UUID.randomUUID());
        existingContract.setTenantId(tenantId);
        existingContract.setClient(existingClient);
        existingContract.setReferenceNumber("REF-123");

        Vehicle existingVehicle = new Vehicle();
        existingVehicle.setId(UUID.randomUUID());
        existingVehicle.setTenantId(tenantId);
        existingVehicle.setContract(existingContract);
        existingVehicle.setVin("VIN123456789");

        when(appUserRepository.findByEmailAndIsDeletedFalse("gestionnaire@example.com")).thenReturn(Optional.of(user));
        when(clientRepository.findFirstByRegistrationNumberAndIsDeletedFalse("123456A")).thenReturn(Optional.of(existingClient));
        when(contractRepository.findByReferenceNumberAndTenantIdAndIsDeletedFalse("REF-123", tenantId)).thenReturn(Optional.of(existingContract));
        when(vehicleRepository.findByContract(existingContract)).thenReturn(Optional.of(existingVehicle));

        when(clientRepository.save(any(Client.class))).thenAnswer(i -> i.getArgument(0));
        when(contractRepository.save(any(Contract.class))).thenAnswer(i -> i.getArgument(0));
        when(vehicleRepository.save(any(Vehicle.class))).thenAnswer(i -> i.getArgument(0));
        when(recoveryCaseRepository.save(any(RecoveryCase.class))).thenAnswer(i -> i.getArgument(0));

        CaseResponse response = caseService.createCase(request, "gestionnaire@example.com");

        assertNotNull(response);
        assertEquals(existingClient.getId(), response.getClient().getId());
        assertEquals(existingContract.getId(), response.getContract().getId());
        assertEquals(existingVehicle.getId(), response.getVehicle().getId());

        verify(clientRepository).save(any(Client.class));
        verify(contractRepository).save(any(Contract.class));
        verify(vehicleRepository).save(any(Vehicle.class));
        verify(recoveryCaseRepository).save(any(RecoveryCase.class));
    }

    @Test
    void testCreateCase_AccessDenied_NonGestionnaire() {
        user.setRole("USER");
        CaseCreateRequest request = new CaseCreateRequest();

        when(appUserRepository.findByEmailAndIsDeletedFalse("gestionnaire@example.com")).thenReturn(Optional.of(user));

        assertThrows(ResponseStatusException.class, () -> caseService.createCase(request, "gestionnaire@example.com"));
        verify(recoveryCaseRepository, never()).save(any(RecoveryCase.class));
    }

    @Test
    void testCreateCase_RollbackOnVehicleFailure() {
        CaseCreateRequest request = new CaseCreateRequest();
        request.setClientFullName("Client Name");
        request.setContractReferenceNumber("REF-123");
        request.setVehicleVin("VIN123");
        request.setVehicleYear(2025);
        request.setInitialResidualValueCents(1000L);

        when(appUserRepository.findByEmailAndIsDeletedFalse("gestionnaire@example.com")).thenReturn(Optional.of(user));

        when(clientRepository.save(any(Client.class))).thenAnswer(i -> i.getArgument(0));
        when(contractRepository.save(any(Contract.class))).thenAnswer(i -> i.getArgument(0));
        
        when(vehicleRepository.save(any(Vehicle.class))).thenThrow(new RuntimeException("Database error saving vehicle"));

        assertThrows(RuntimeException.class, () -> caseService.createCase(request, "gestionnaire@example.com"));
        verify(recoveryCaseRepository, never()).save(any(RecoveryCase.class));
    }

    @Test
    void testGetCase_Success() {
        UUID caseId = UUID.randomUUID();
        RecoveryCase rcase = new RecoveryCase();
        rcase.setId(caseId);
        rcase.setTenantId(tenantId);
        
        Contract contract = new Contract();
        rcase.setContract(contract);

        when(recoveryCaseRepository.findById(caseId)).thenReturn(Optional.of(rcase));
        when(vehicleRepository.findByContract(contract)).thenReturn(Optional.empty());

        CaseResponse response = caseService.getCase(caseId);

        assertNotNull(response);
        assertEquals(caseId, response.getId());
    }

    @Test
    void testGetCase_TenantScopeViolation() {
        UUID caseId = UUID.randomUUID();
        RecoveryCase rcase = new RecoveryCase();
        rcase.setId(caseId);
        rcase.setTenantId(UUID.randomUUID()); // Different tenant

        when(recoveryCaseRepository.findById(caseId)).thenReturn(Optional.of(rcase));

        assertThrows(ResponseStatusException.class, () -> caseService.getCase(caseId));
    }

    @Test
    void testUpdateCase_Success() {
        UUID caseId = UUID.randomUUID();
        RecoveryCase rcase = new RecoveryCase();
        rcase.setId(caseId);
        rcase.setTenantId(tenantId);
        
        Client client = new Client();
        client.setTenantId(tenantId);
        client.setFullNameOrCompany("Old Client Name");

        Contract contract = new Contract();
        contract.setTenantId(tenantId);
        contract.setClient(client);
        contract.setReferenceNumber("OLD-REF");
        
        rcase.setContract(contract);

        CaseUpdateRequest request = new CaseUpdateRequest();
        request.setClientFullName("New Client Name");
        request.setContractReferenceNumber("NEW-REF");
        request.setInitialResidualValueCents(9000L);
        request.setCurrencyCode("EUR");

        when(recoveryCaseRepository.findById(caseId)).thenReturn(Optional.of(rcase));
        when(recoveryCaseRepository.save(any(RecoveryCase.class))).thenAnswer(i -> i.getArgument(0));

        CaseResponse response = caseService.updateCase(caseId, request);

        assertNotNull(response);
        assertEquals(9000L, response.getInitialResidualValueCents());
        assertEquals("EUR", response.getCurrencyCode());
        assertEquals("New Client Name", response.getClient().getFullNameOrCompany());
        assertEquals("NEW-REF", response.getContract().getReferenceNumber());
    }

    @Test
    void testAssignCase_Success() {
        UUID caseId = UUID.randomUUID();
        RecoveryCase rcase = new RecoveryCase();
        rcase.setId(caseId);
        rcase.setTenantId(tenantId);

        AppUser assignee = new AppUser();
        UUID assigneeId = UUID.randomUUID();
        assignee.setId(assigneeId);
        assignee.setTenantId(tenantId);
        assignee.setRole("GESTIONNAIRE");

        when(recoveryCaseRepository.findById(caseId)).thenReturn(Optional.of(rcase));
        when(appUserRepository.findById(assigneeId)).thenReturn(Optional.of(assignee));
        when(recoveryCaseRepository.save(any(RecoveryCase.class))).thenAnswer(i -> i.getArgument(0));

        CaseResponse response = caseService.assignCase(caseId, assigneeId);

        assertNotNull(response);
        assertEquals(assigneeId, response.getAssigneeId());
    }

    @Test
    void testAssignCase_InvalidRole() {
        UUID caseId = UUID.randomUUID();
        RecoveryCase rcase = new RecoveryCase();
        rcase.setId(caseId);
        rcase.setTenantId(tenantId);

        AppUser assignee = new AppUser();
        UUID assigneeId = UUID.randomUUID();
        assignee.setId(assigneeId);
        assignee.setTenantId(tenantId);
        assignee.setRole("ADMIN"); // Not GESTIONNAIRE

        when(recoveryCaseRepository.findById(caseId)).thenReturn(Optional.of(rcase));
        when(appUserRepository.findById(assigneeId)).thenReturn(Optional.of(assignee));

        assertThrows(ResponseStatusException.class, () -> caseService.assignCase(caseId, assigneeId));
    }

    @Test
    void testGetAssignees_Success() {
        AppUser assignee = new AppUser();
        assignee.setId(UUID.randomUUID());
        assignee.setTenantId(tenantId);
        assignee.setRole("GESTIONNAIRE");
        assignee.setFirstName("Jane");

        when(appUserRepository.findAllByTenantIdAndRoleAndIsDeletedFalse(tenantId, "GESTIONNAIRE")).thenReturn(List.of(assignee));

        List<AssigneeResponse> response = caseService.getAssignees();

        assertEquals(1, response.size());
        assertEquals("Jane", response.get(0).getFirstName());
    }

    @Test
    void testAddNote_Success() {
        UUID caseId = UUID.randomUUID();
        RecoveryCase rcase = new RecoveryCase();
        rcase.setId(caseId);
        rcase.setTenantId(tenantId);

        AppUser author = new AppUser();
        author.setId(UUID.randomUUID());
        author.setTenantId(tenantId);
        author.setEmail("author@example.com");

        NoteCreateRequest request = new NoteCreateRequest();
        request.setContent("Note content text");

        Note note = new Note();
        note.setId(UUID.randomUUID());
        note.setRecoveryCase(rcase);
        note.setAuthor(author);
        note.setContent("Note content text");

        when(recoveryCaseRepository.findById(caseId)).thenReturn(Optional.of(rcase));
        when(appUserRepository.findByEmailAndIsDeletedFalse("author@example.com")).thenReturn(Optional.of(author));
        when(noteRepository.save(any(Note.class))).thenReturn(note);

        NoteResponse response = caseService.addNote(caseId, request, "author@example.com");

        assertNotNull(response);
        assertEquals("Note content text", response.getContent());
    }

    @Test
    void testGetNotes_Success() {
        UUID caseId = UUID.randomUUID();
        RecoveryCase rcase = new RecoveryCase();
        rcase.setId(caseId);
        rcase.setTenantId(tenantId);

        Note note = new Note();
        note.setId(UUID.randomUUID());
        note.setContent("First Note");

        when(recoveryCaseRepository.findById(caseId)).thenReturn(Optional.of(rcase));
        when(noteRepository.findAllByRecoveryCaseIdAndIsDeletedFalseOrderByCreatedAtAsc(caseId)).thenReturn(List.of(note));

        List<NoteResponse> response = caseService.getNotes(caseId);

        assertEquals(1, response.size());
        assertEquals("First Note", response.get(0).getContent());
    }

    @Test
    void testAdvancePhase_Success() {
        UUID caseId = UUID.randomUUID();
        RecoveryCase rcase = new RecoveryCase();
        rcase.setId(caseId);
        rcase.setTenantId(tenantId);
        rcase.setCurrentPhase(RecoveryPhase.PRE_CONTENTIEUX);
 
        Contract contract = new Contract();
        rcase.setContract(contract);
 
        when(appUserRepository.findByEmailAndIsDeletedFalse("gestionnaire@example.com")).thenReturn(Optional.of(user));
        when(recoveryCaseRepository.findById(caseId)).thenReturn(Optional.of(rcase));
        when(recoveryCaseRepository.save(any(RecoveryCase.class))).thenAnswer(i -> i.getArgument(0));
        when(vehicleRepository.findByContract(contract)).thenReturn(Optional.empty());
 
        CaseResponse response = caseService.advancePhase(caseId, "gestionnaire@example.com");
 
        assertNotNull(response);
        assertEquals("MISE_EN_DEMEURE", response.getCurrentPhase());
        assertNotNull(response.getPhaseStartedAt());
        assertNotNull(response.getLastActionAt());
        verify(recoveryCaseRepository).save(rcase);
    }

    @Test
    void testAdvancePhase_MiseEnDemeure_SendsEmail() {
        UUID caseId = UUID.randomUUID();
        RecoveryCase rcase = new RecoveryCase();
        rcase.setId(caseId);
        rcase.setTenantId(tenantId);
        rcase.setCurrentPhase(RecoveryPhase.PRE_CONTENTIEUX);

        Client client = new Client();
        client.setFullNameOrCompany("John Doe");
        client.setContactEmail("john.doe@example.com");

        Contract contract = new Contract();
        contract.setReferenceNumber("REF-TEST-123");
        contract.setClient(client);
        rcase.setContract(contract);

        Tenant tenant = new Tenant();
        tenant.setName("Sesame Leasing");

        AppUser adminUser = new AppUser();
        adminUser.setEmail("admin@sesame.com");
        adminUser.setRole("ADMIN");

        when(appUserRepository.findByEmailAndIsDeletedFalse("gestionnaire@example.com")).thenReturn(Optional.of(user));
        when(recoveryCaseRepository.findById(caseId)).thenReturn(Optional.of(rcase));
        when(recoveryCaseRepository.save(any(RecoveryCase.class))).thenAnswer(i -> i.getArgument(0));
        when(vehicleRepository.findByContract(contract)).thenReturn(Optional.empty());
        when(tenantRepository.findById(tenantId)).thenReturn(Optional.of(tenant));
        when(appUserRepository.findAllByTenantIdAndRoleAndIsDeletedFalse(tenantId, "ADMIN")).thenReturn(List.of(adminUser));

        CaseResponse response = caseService.advancePhase(caseId, "gestionnaire@example.com");

        assertNotNull(response);
        assertEquals("MISE_EN_DEMEURE", response.getCurrentPhase());

        verify(emailService, times(1)).sendEmail(
                eq("admin@sesame.com"),
                eq("john.doe@example.com"),
                contains("Mise en demeure"),
                contains("Mise en demeure")
        );
    }
 
    @Test
    void testAdvancePhase_Forbidden_NonGestionnaire() {
        user.setRole("USER");
        UUID caseId = UUID.randomUUID();
 
        when(appUserRepository.findByEmailAndIsDeletedFalse("gestionnaire@example.com")).thenReturn(Optional.of(user));
 
        assertThrows(ResponseStatusException.class, () -> caseService.advancePhase(caseId, "gestionnaire@example.com"));
        verify(recoveryCaseRepository, never()).save(any(RecoveryCase.class));
    }
 
    @Test
    void testAdvancePhase_NotFound() {
        UUID caseId = UUID.randomUUID();
        when(appUserRepository.findByEmailAndIsDeletedFalse("gestionnaire@example.com")).thenReturn(Optional.of(user));
        when(recoveryCaseRepository.findById(caseId)).thenReturn(Optional.empty());
 
        assertThrows(ResponseStatusException.class, () -> caseService.advancePhase(caseId, "gestionnaire@example.com"));
    }
 
    @Test
    void testAdvancePhase_TenantScopeViolation() {
        UUID caseId = UUID.randomUUID();
        RecoveryCase rcase = new RecoveryCase();
        rcase.setId(caseId);
        rcase.setTenantId(UUID.randomUUID()); // different tenant
 
        when(appUserRepository.findByEmailAndIsDeletedFalse("gestionnaire@example.com")).thenReturn(Optional.of(user));
        when(recoveryCaseRepository.findById(caseId)).thenReturn(Optional.of(rcase));
 
        assertThrows(ResponseStatusException.class, () -> caseService.advancePhase(caseId, "gestionnaire@example.com"));
    }
 
    @Test
    void testAdvancePhase_IllegalState_Cloture() {
        UUID caseId = UUID.randomUUID();
        RecoveryCase rcase = new RecoveryCase();
        rcase.setId(caseId);
        rcase.setTenantId(tenantId);
        rcase.setCurrentPhase(RecoveryPhase.CLOTURE);
 
        when(appUserRepository.findByEmailAndIsDeletedFalse("gestionnaire@example.com")).thenReturn(Optional.of(user));
        when(recoveryCaseRepository.findById(caseId)).thenReturn(Optional.of(rcase));
 
        assertThrows(IllegalStateException.class, () -> caseService.advancePhase(caseId, "gestionnaire@example.com"));
    }

    @Test
    void testAdvancePhase_PrerequisiteNotMet() {
        UUID caseId = UUID.randomUUID();
        RecoveryCase rcase = new RecoveryCase();
        rcase.setId(caseId);
        rcase.setTenantId(tenantId);
        rcase.setCurrentPhase(RecoveryPhase.PRE_CONTENTIEUX);

        when(appUserRepository.findByEmailAndIsDeletedFalse("gestionnaire@example.com")).thenReturn(Optional.of(user));
        when(recoveryCaseRepository.findById(caseId)).thenReturn(Optional.of(rcase));
        when(casePrerequisiteService.checkPrerequisites(any(), any()))
                .thenReturn(List.of("Missing document"));

        assertThrows(PrerequisiteNotMetException.class, () -> caseService.advancePhase(caseId, "gestionnaire@example.com"));
    }

    @Test
    void testGetPrerequisites_Success() {
        UUID caseId = UUID.randomUUID();
        RecoveryCase rcase = new RecoveryCase();
        rcase.setId(caseId);
        rcase.setTenantId(tenantId);
        rcase.setCurrentPhase(RecoveryPhase.PRE_CONTENTIEUX);

        when(recoveryCaseRepository.findById(caseId)).thenReturn(Optional.of(rcase));
        when(casePrerequisiteService.checkPrerequisites(any(), any()))
                .thenReturn(List.of("Missing document"));

        CasePrerequisitesResponse response = caseService.getPrerequisites(caseId);

        assertNotNull(response);
        assertEquals("MISE_EN_DEMEURE", response.getNextPhase());
        assertTrue(response.isBlocked());
        assertEquals(1, response.getMissingPrerequisites().size());
        assertEquals("Missing document", response.getMissingPrerequisites().get(0));
    }
}
