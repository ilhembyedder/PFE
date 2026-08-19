package com.leasrecover.modules.cases;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.leasrecover.modules.cases.dto.*;
import com.leasrecover.modules.tenant.Tenant;
import com.leasrecover.modules.tenant.TenantRepository;
import com.leasrecover.modules.users.AppUser;
import com.leasrecover.modules.users.AppUserRepository;
import com.leasrecover.modules.superadmin.SuperAdminRepository;
import com.leasrecover.modules.notification.ValuationProgressService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import java.time.ZonedDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest({CaseController.class, InternalWebhookController.class, DashboardAlertController.class})
@Import({
    com.leasrecover.config.SecurityConfig.class,
    com.leasrecover.modules.auth.JwtAuthenticationFilter.class,
    com.leasrecover.config.tenant.TenantFilter.class
})
@org.springframework.security.test.context.support.WithMockUser(roles = "GESTIONNAIRE")
class CaseControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private CaseService caseService;

    @MockitoBean
    private CaseHistoryService caseHistoryService;

    @MockitoBean
    private PdfExportService pdfExportService;

    @MockitoBean
    private DocumentUploadService documentUploadService;

    @MockitoBean
    private ValuationProgressService valuationProgressService;

    @MockitoBean
    private AIValuationService aiValuationService;

    @MockitoBean
    private com.leasrecover.modules.auth.JwtService jwtService;

    @MockitoBean
    private TenantRepository tenantRepository;

    @MockitoBean
    private AppUserRepository appUserRepository;

    @MockitoBean
    private SuperAdminRepository superAdminRepository;

    @Autowired
    private ObjectMapper objectMapper;

    private CaseResponse caseResponse;
    private UUID caseId;
    private UUID tenantId;

    @BeforeEach
    void setUp() {
        caseId = UUID.randomUUID();
        tenantId = UUID.randomUUID();

        caseResponse = new CaseResponse();
        caseResponse.setId(caseId);
        caseResponse.setTenantId(tenantId);
        caseResponse.setStatus("ACTIVE");
        caseResponse.setCurrentPhase("PRE_CONTENTIEUX");
        caseResponse.setInitialResidualValueCents(10000L);
        caseResponse.setCurrencyCode("TND");

        // Mock tenant for TenantFilter
        Tenant tenant = new Tenant();
        tenant.setId(tenantId);
        tenant.setStatus("ACTIVE");
        when(tenantRepository.findById(any(UUID.class))).thenReturn(Optional.of(tenant));

        // Mock user for TenantFilter
        AppUser user = new AppUser();
        user.setId(UUID.randomUUID());
        user.setEmail("gestionnaire@example.com");
        user.setRole("GESTIONNAIRE");
        user.setStatus("ACTIVE");
        user.setTenantId(tenantId);
        when(appUserRepository.findByEmailAndIsDeletedFalse("gestionnaire@example.com")).thenReturn(Optional.of(user));
    }

    @Test
    void testCreateCase_Success() throws Exception {
        CaseCreateRequest request = new CaseCreateRequest();
        request.setClientFullName("Client Company");
        request.setClientRegistrationNumber("123REG");
        request.setContractReferenceNumber("REF123");
        request.setContractStartDate(ZonedDateTime.now());
        request.setContractEndDate(ZonedDateTime.now().plusYears(1));
        request.setContractStatus("ACTIVE");
        request.setVehicleVin("VIN123456789");
        request.setVehicleBrand("Brand");
        request.setVehicleModel("Model");
        request.setVehicleYear(2024);
        request.setInitialResidualValueCents(10000L);

        when(caseService.createCase(any(CaseCreateRequest.class), eq("gestionnaire@example.com"))).thenReturn(caseResponse);

        mockMvc.perform(post("/api/v1/cases")
                        .with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user("gestionnaire@example.com").roles("GESTIONNAIRE"))
                        .header("X-Tenant-ID", tenantId.toString())
                        .header("X-User-Email", "gestionnaire@example.com")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("success"))
                .andExpect(jsonPath("$.data.status").value("ACTIVE"))
                .andExpect(jsonPath("$.data.currentPhase").value("PRE_CONTENTIEUX"));
    }

    @Test
    void testCreateCase_ValidationFailure() throws Exception {
        CaseCreateRequest request = new CaseCreateRequest(); // Blank fields
        request.setClientRegistrationNumber("invalid-reg-number!"); // Invalid characters

        mockMvc.perform(post("/api/v1/cases")
                        .with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user("gestionnaire@example.com").roles("GESTIONNAIRE"))
                        .header("X-Tenant-ID", tenantId.toString())
                        .header("X-User-Email", "gestionnaire@example.com")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value("fail"));
    }

    @Test
    void testGetCase_Success() throws Exception {
        when(caseService.getCase(caseId)).thenReturn(caseResponse);

        mockMvc.perform(get("/api/v1/cases/" + caseId)
                        .with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user("gestionnaire@example.com").roles("GESTIONNAIRE"))
                        .header("X-Tenant-ID", tenantId.toString())
                        .header("X-User-Email", "gestionnaire@example.com"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("success"))
                .andExpect(jsonPath("$.data.id").value(caseId.toString()));
    }

    @Test
    void testGetCases_Success() throws Exception {
        CaseListResponse listResponse = new CaseListResponse();
        listResponse.setId(caseId);
        listResponse.setClientName("Client Company");
        listResponse.setContractReference("REF123");
        listResponse.setCurrentPhase("PRE_CONTENTIEUX");
        listResponse.setAssigneeName("John Doe");
        listResponse.setReliabilityIndicator("RELIABLE");
        listResponse.setLastActionAt(ZonedDateTime.now());
        listResponse.setCreatedAt(ZonedDateTime.now());

        org.springframework.data.domain.Page<CaseListResponse> page =
                new org.springframework.data.domain.PageImpl<>(List.of(listResponse));

        when(caseService.getCases(any(org.springframework.data.domain.Pageable.class), any(), any(), any(), any()))
                .thenReturn(page);

        mockMvc.perform(get("/api/v1/cases")
                        .with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user("gestionnaire@example.com").roles("GESTIONNAIRE"))
                        .header("X-Tenant-ID", tenantId.toString())
                        .header("X-User-Email", "gestionnaire@example.com")
                        .param("page", "0")
                        .param("size", "10")
                        .param("sortBy", "createdAt,desc"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("success"))
                .andExpect(jsonPath("$.data.content[0].clientName").value("Client Company"))
                .andExpect(jsonPath("$.data.content[0].reliabilityIndicator").value("RELIABLE"));
    }

    @Test
    void testGetCases_ForbiddenForUser() throws Exception {
        AppUser regularUser = new AppUser();
        regularUser.setId(UUID.randomUUID());
        regularUser.setEmail("user@example.com");
        regularUser.setRole("USER");
        regularUser.setStatus("ACTIVE");
        regularUser.setTenantId(tenantId);
        when(appUserRepository.findByEmailAndIsDeletedFalse("user@example.com")).thenReturn(Optional.of(regularUser));

        when(caseService.getCases(any(org.springframework.data.domain.Pageable.class), any(), any(), any(), eq("user@example.com")))
                .thenThrow(new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.FORBIDDEN, "Access denied"));

        mockMvc.perform(get("/api/v1/cases")
                        .with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user("user@example.com").roles("USER"))
                        .header("X-Tenant-ID", tenantId.toString())
                        .header("X-User-Email", "user@example.com"))
                .andExpect(status().isForbidden());
    }

    @Test
    void testUpdateCase_Success() throws Exception {
        CaseUpdateRequest request = new CaseUpdateRequest();
        request.setClientFullName("New Client Name");
        request.setContractReferenceNumber("NEW-REF-123");
        request.setInitialResidualValueCents(25000L);
        request.setCurrencyCode("EUR");

        CaseResponse updatedResponse = new CaseResponse();
        updatedResponse.setId(caseId);
        updatedResponse.setInitialResidualValueCents(25000L);
        updatedResponse.setCurrencyCode("EUR");

        when(caseService.updateCase(eq(caseId), any(CaseUpdateRequest.class))).thenReturn(updatedResponse);

        mockMvc.perform(put("/api/v1/cases/" + caseId)
                        .with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user("gestionnaire@example.com").roles("GESTIONNAIRE"))
                        .header("X-Tenant-ID", tenantId.toString())
                        .header("X-User-Email", "gestionnaire@example.com")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("success"))
                .andExpect(jsonPath("$.data.initialResidualValueCents").value(25000L))
                .andExpect(jsonPath("$.data.currencyCode").value("EUR"));
    }

    @Test
    void testAssignCase_Success() throws Exception {
        UUID newAssigneeId = UUID.randomUUID();
        AssignCaseRequest request = new AssignCaseRequest();
        request.setAssigneeId(newAssigneeId);

        CaseResponse assignedResponse = new CaseResponse();
        assignedResponse.setId(caseId);
        assignedResponse.setAssigneeId(newAssigneeId);

        when(caseService.assignCase(eq(caseId), eq(newAssigneeId))).thenReturn(assignedResponse);

        mockMvc.perform(put("/api/v1/cases/" + caseId + "/assign")
                        .with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user("gestionnaire@example.com").roles("GESTIONNAIRE"))
                        .header("X-Tenant-ID", tenantId.toString())
                        .header("X-User-Email", "gestionnaire@example.com")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("success"))
                .andExpect(jsonPath("$.data.assigneeId").value(newAssigneeId.toString()));
    }

    @Test
    void testGetAssignees_Success() throws Exception {
        AssigneeResponse assignee = new AssigneeResponse();
        assignee.setId(UUID.randomUUID());
        assignee.setFirstName("John");
        assignee.setLastName("Doe");
        assignee.setEmail("john.doe@example.com");

        when(caseService.getAssignees()).thenReturn(List.of(assignee));

        mockMvc.perform(get("/api/v1/cases/assignees")
                        .with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user("gestionnaire@example.com").roles("GESTIONNAIRE"))
                        .header("X-Tenant-ID", tenantId.toString())
                        .header("X-User-Email", "gestionnaire@example.com"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("success"))
                .andExpect(jsonPath("$.data[0].firstName").value("John"));
    }

    @Test
    void testAddNote_Success() throws Exception {
        NoteCreateRequest request = new NoteCreateRequest();
        request.setContent("This is a case comment.");

        NoteResponse noteResponse = new NoteResponse();
        noteResponse.setId(UUID.randomUUID());
        noteResponse.setCaseId(caseId);
        noteResponse.setAuthorName("Jane Doe");
        noteResponse.setContent("This is a case comment.");
        noteResponse.setCreatedAt(ZonedDateTime.now());

        when(caseService.addNote(eq(caseId), any(NoteCreateRequest.class), eq("gestionnaire@example.com"))).thenReturn(noteResponse);

        mockMvc.perform(post("/api/v1/cases/" + caseId + "/notes")
                        .with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user("gestionnaire@example.com").roles("GESTIONNAIRE"))
                        .header("X-Tenant-ID", tenantId.toString())
                        .header("X-User-Email", "gestionnaire@example.com")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("success"))
                .andExpect(jsonPath("$.data.content").value("This is a case comment."));
    }

    @Test
    void testGetNotes_Success() throws Exception {
        NoteResponse noteResponse = new NoteResponse();
        noteResponse.setId(UUID.randomUUID());
        noteResponse.setCaseId(caseId);
        noteResponse.setContent("Chronological note");

        when(caseService.getNotes(caseId)).thenReturn(List.of(noteResponse));

        mockMvc.perform(get("/api/v1/cases/" + caseId + "/notes")
                        .with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user("gestionnaire@example.com").roles("GESTIONNAIRE"))
                        .header("X-Tenant-ID", tenantId.toString())
                        .header("X-User-Email", "gestionnaire@example.com"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("success"))
                .andExpect(jsonPath("$.data[0].content").value("Chronological note"));
    }

    @Test
    void testAdminEndpoint_AccessDeniedForGestionnaire() throws Exception {
        mockMvc.perform(get("/api/v1/admin/tenant")
                        .with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user("gestionnaire@example.com").roles("GESTIONNAIRE"))
                        .header("X-Tenant-ID", tenantId.toString())
                        .header("X-User-Email", "gestionnaire@example.com"))
                .andExpect(status().isForbidden());
    }

    @Test
    void testGetCaseHistory_Success() throws Exception {
        HistoryEventResponse event = new HistoryEventResponse();
        event.setEventType("CASE_CREATED");
        event.setTimestamp(ZonedDateTime.now());
        event.setActor("system");
        event.setDescription("Dossier créé");

        when(caseHistoryService.getCaseHistory(caseId)).thenReturn(List.of(event));

        mockMvc.perform(get("/api/v1/cases/" + caseId + "/history")
                        .with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user("gestionnaire@example.com").roles("GESTIONNAIRE"))
                        .header("X-Tenant-ID", tenantId.toString())
                        .header("X-User-Email", "gestionnaire@example.com"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("success"))
                .andExpect(jsonPath("$.data[0].eventType").value("CASE_CREATED"))
                .andExpect(jsonPath("$.data[0].description").value("Dossier créé"));
    }

    @Test
    void testExportCasePdf_Success() throws Exception {
        byte[] pdfBytes = "PDF content".getBytes();
        when(pdfExportService.generateCasePdf(caseId)).thenReturn(pdfBytes);

        mockMvc.perform(get("/api/v1/cases/" + caseId + "/export")
                        .with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user("gestionnaire@example.com").roles("GESTIONNAIRE"))
                        .header("X-Tenant-ID", tenantId.toString())
                        .header("X-User-Email", "gestionnaire@example.com"))
                .andExpect(status().isOk())
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.content().contentType(MediaType.APPLICATION_PDF))
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.header().string("Content-Disposition", "attachment; filename=\"dossier-history-" + caseId + ".pdf\""))
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.content().bytes(pdfBytes));
    }

    @Test
    void testAdvanceCasePhase_Success() throws Exception {
        CaseResponse advancedResponse = new CaseResponse();
        advancedResponse.setId(caseId);
        advancedResponse.setTenantId(tenantId);
        advancedResponse.setStatus("ACTIVE");
        advancedResponse.setCurrentPhase("MISE_EN_DEMEURE");

        when(caseService.advancePhase(eq(caseId), eq("gestionnaire@example.com"))).thenReturn(advancedResponse);

        mockMvc.perform(post("/api/v1/cases/" + caseId + "/next-phase")
                        .with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user("gestionnaire@example.com").roles("GESTIONNAIRE"))
                        .header("X-Tenant-ID", tenantId.toString())
                        .header("X-User-Email", "gestionnaire@example.com"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("success"))
                .andExpect(jsonPath("$.data.currentPhase").value("MISE_EN_DEMEURE"));
    }

    @Test
    void testAdvanceCasePhase_PrerequisiteNotMet() throws Exception {
        when(caseService.advancePhase(eq(caseId), eq("gestionnaire@example.com")))
                .thenThrow(new PrerequisiteNotMetException(List.of("Missing document")));

        mockMvc.perform(post("/api/v1/cases/" + caseId + "/next-phase")
                        .with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user("gestionnaire@example.com").roles("GESTIONNAIRE"))
                        .header("X-Tenant-ID", tenantId.toString())
                        .header("X-User-Email", "gestionnaire@example.com"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value("error"))
                .andExpect(jsonPath("$.message").value("Missing document"));
    }

    @Test
    void testGetCasePrerequisites_Success() throws Exception {
        CasePrerequisitesResponse prerequisitesResponse = new CasePrerequisitesResponse();
        prerequisitesResponse.setNextPhase("MISE_EN_DEMEURE");
        prerequisitesResponse.setBlocked(true);
        prerequisitesResponse.setMissingPrerequisites(List.of("Missing document"));

        when(caseService.getPrerequisites(caseId)).thenReturn(prerequisitesResponse);

        mockMvc.perform(get("/api/v1/cases/" + caseId + "/prerequisites")
                        .with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user("gestionnaire@example.com").roles("GESTIONNAIRE"))
                        .header("X-Tenant-ID", tenantId.toString())
                        .header("X-User-Email", "gestionnaire@example.com"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("success"))
                .andExpect(jsonPath("$.data.nextPhase").value("MISE_EN_DEMEURE"))
                .andExpect(jsonPath("$.data.blocked").value(true))
                .andExpect(jsonPath("$.data.missingPrerequisites[0]").value("Missing document"));
    }

    // -------------------------------------------------------------------------
    // Document Vault Controller Tests (Story 4.4)
    // -------------------------------------------------------------------------

    @Test
    void testUploadDocument_Success() throws Exception {
        DocumentResponse docResponse = new DocumentResponse();
        docResponse.setId(UUID.randomUUID());
        docResponse.setFileName("contract.pdf");
        docResponse.setFileUrl("/api/v1/cases/" + caseId + "/documents/" + docResponse.getId() + "/download");
        docResponse.setPhaseUploadedIn("PRE_CONTENTIEUX");
        docResponse.setUploaderName("Jean Dupont");
        docResponse.setCreatedAt(ZonedDateTime.now());

        when(documentUploadService.storeDocument(
                eq(caseId), any(), eq("PRE_CONTENTIEUX"), any(), eq("gestionnaire@example.com")))
                .thenReturn(docResponse);

        mockMvc.perform(multipart("/api/v1/cases/" + caseId + "/documents")
                        .file(new org.springframework.mock.web.MockMultipartFile(
                                "file", "contract.pdf", "application/pdf", "PDF content".getBytes()))
                        .param("phase", "PRE_CONTENTIEUX")
                        .with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user("gestionnaire@example.com").roles("GESTIONNAIRE"))
                        .header("X-Tenant-ID", tenantId.toString())
                        .header("X-User-Email", "gestionnaire@example.com"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("success"))
                .andExpect(jsonPath("$.data.fileName").value("contract.pdf"))
                .andExpect(jsonPath("$.data.phaseUploadedIn").value("PRE_CONTENTIEUX"));
    }

    @Test
    void testGetDocuments_Success() throws Exception {
        DocumentResponse docResponse = new DocumentResponse();
        docResponse.setId(UUID.randomUUID());
        docResponse.setFileName("invoice.pdf");
        docResponse.setFileUrl("/api/v1/cases/" + caseId + "/documents/" + docResponse.getId() + "/download");
        docResponse.setPhaseUploadedIn("VENTE");
        docResponse.setUploaderName("Jean Dupont");
        docResponse.setCreatedAt(ZonedDateTime.now());

        when(documentUploadService.getDocumentsForCase(caseId)).thenReturn(List.of(docResponse));

        mockMvc.perform(get("/api/v1/cases/" + caseId + "/documents")
                        .with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user("gestionnaire@example.com").roles("GESTIONNAIRE"))
                        .header("X-Tenant-ID", tenantId.toString())
                        .header("X-User-Email", "gestionnaire@example.com"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("success"))
                .andExpect(jsonPath("$.data[0].fileName").value("invoice.pdf"))
                .andExpect(jsonPath("$.data[0].phaseUploadedIn").value("VENTE"));
    }

    @Test
    void testDownloadDocument_Success() throws Exception {
        UUID docId = UUID.randomUUID();
        byte[] fileContent = "PDF binary content".getBytes();
        org.springframework.core.io.ByteArrayResource resource =
                new org.springframework.core.io.ByteArrayResource(fileContent);

        when(documentUploadService.loadDocumentAsResource(eq(caseId), eq(docId)))
                .thenReturn(resource);
        when(documentUploadService.getDocumentOriginalFileName(eq(docId)))
                .thenReturn("contract.pdf");

        mockMvc.perform(get("/api/v1/cases/" + caseId + "/documents/" + docId + "/download")
                        .with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user("gestionnaire@example.com").roles("GESTIONNAIRE"))
                        .header("X-Tenant-ID", tenantId.toString())
                        .header("X-User-Email", "gestionnaire@example.com"))
                .andExpect(status().isOk())
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.content().contentType(MediaType.APPLICATION_PDF))
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.header().string(
                        "Content-Disposition", "attachment; filename=\"contract.pdf\""));
    }

    @Test
    void testGetValuationProgress_Success() throws Exception {
        when(valuationProgressService.registerEmitter(caseId)).thenReturn(new org.springframework.web.servlet.mvc.method.annotation.SseEmitter());

        mockMvc.perform(get("/api/v1/cases/" + caseId + "/valuation-progress")
                        .with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user("gestionnaire@example.com").roles("GESTIONNAIRE"))
                        .header("X-Tenant-ID", tenantId.toString())
                        .header("X-User-Email", "gestionnaire@example.com"))
                .andExpect(status().isOk());
    }

    @Test
    void testHandleAiProgressWebhook_Success() throws Exception {
        com.leasrecover.modules.notification.AiProgressPayload payload = new com.leasrecover.modules.notification.AiProgressPayload();
        payload.setCaseId(caseId);
        payload.setTenantId(tenantId);
        payload.setStatus("SUCCESS");
        payload.setStage("CALCULATION");
        payload.setProgress(100);
        payload.setMessage("Calcul complété");

        mockMvc.perform(post("/api/v1/internal/webhooks/ai-progress")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isOk());

        org.mockito.Mockito.verify(aiValuationService, org.mockito.Mockito.times(1))
                .processWebhookCallback(any(com.leasrecover.modules.notification.AiProgressPayload.class));
    }

    @Test
    void testHandleAiProgressWebhook_Failed() throws Exception {
        com.leasrecover.modules.notification.AiProgressPayload payload = new com.leasrecover.modules.notification.AiProgressPayload();
        payload.setCaseId(caseId);
        payload.setTenantId(tenantId);
        payload.setStatus("FAILED");
        payload.setStage("EXTRACTION");
        payload.setProgress(100);
        payload.setMessage("Le document est illisible ou n'est pas un rapport d'expertise valide.");

        mockMvc.perform(post("/api/v1/internal/webhooks/ai-progress")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isOk());

        org.mockito.Mockito.verify(aiValuationService, org.mockito.Mockito.times(1))
                .processWebhookCallback(any(com.leasrecover.modules.notification.AiProgressPayload.class));
    }

    @Test
    void testGetValuation_Success() throws Exception {
        CaseValuationResponse valuationResponse = new CaseValuationResponse();
        valuationResponse.setCaseId(caseId);
        valuationResponse.setMarketValueCents(1500000L);
        valuationResponse.setInitialResidualValueCents(1200000L);
        valuationResponse.setDeviationValueCents(300000L);
        valuationResponse.setDeviationPercentage(new java.math.BigDecimal("25.00"));
        valuationResponse.setReliabilityIndicator("MODERATE_RISK");
        valuationResponse.setCurrencyCode("TND");

        when(aiValuationService.getValuationByCaseId(eq(caseId), eq("gestionnaire@example.com"))).thenReturn(valuationResponse);

        mockMvc.perform(get("/api/v1/cases/" + caseId + "/valuation")
                        .with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user("gestionnaire@example.com").roles("GESTIONNAIRE"))
                        .header("X-Tenant-ID", tenantId.toString())
                        .header("X-User-Email", "gestionnaire@example.com"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("success"))
                .andExpect(jsonPath("$.data.marketValueCents").value(1500000L))
                .andExpect(jsonPath("$.data.deviationPercentage").value(25.00))
                .andExpect(jsonPath("$.data.reliabilityIndicator").value("MODERATE_RISK"));
    }

    @Test
    void testGetValuation_ForbiddenForUser() throws Exception {
        AppUser regularUser = new AppUser();
        regularUser.setId(UUID.randomUUID());
        regularUser.setEmail("user@example.com");
        regularUser.setRole("USER");
        regularUser.setStatus("ACTIVE");
        regularUser.setTenantId(tenantId);
        when(appUserRepository.findByEmailAndIsDeletedFalse("user@example.com")).thenReturn(Optional.of(regularUser));

        when(aiValuationService.getValuationByCaseId(eq(caseId), eq("user@example.com")))
                .thenThrow(new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.FORBIDDEN, "Access denied"));

        mockMvc.perform(get("/api/v1/cases/" + caseId + "/valuation")
                        .with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user("user@example.com").roles("USER"))
                        .header("X-Tenant-ID", tenantId.toString())
                        .header("X-User-Email", "user@example.com"))
                .andExpect(status().isForbidden());
    }

    @Test
    void testGetPriorityAlerts_Success() throws Exception {
        PriorityAlertResponse alert = new PriorityAlertResponse();
        alert.setAlertId(UUID.randomUUID());
        alert.setCaseId(caseId);
        alert.setClientName("Client Company");
        alert.setContractReference("REF123");
        alert.setAlertType("DEADLINE");
        alert.setCriticality("CRITICAL");
        alert.setMessage("Écheance dépassée");
        alert.setCreatedAt(ZonedDateTime.now());

        when(caseService.getPriorityAlerts("gestionnaire@example.com")).thenReturn(List.of(alert));

        mockMvc.perform(get("/api/v1/dashboard/alerts/priority")
                        .with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user("gestionnaire@example.com").roles("GESTIONNAIRE"))
                        .header("X-Tenant-ID", tenantId.toString())
                        .header("X-User-Email", "gestionnaire@example.com"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("success"))
                .andExpect(jsonPath("$.data[0].clientName").value("Client Company"))
                .andExpect(jsonPath("$.data[0].criticality").value("CRITICAL"));
    }

    @Test
    void testGetPriorityAlerts_ForbiddenForUser() throws Exception {
        AppUser regularUser = new AppUser();
        regularUser.setId(UUID.randomUUID());
        regularUser.setEmail("user@example.com");
        regularUser.setRole("USER");
        regularUser.setStatus("ACTIVE");
        regularUser.setTenantId(tenantId);
        when(appUserRepository.findByEmailAndIsDeletedFalse("user@example.com")).thenReturn(Optional.of(regularUser));

        when(caseService.getPriorityAlerts("user@example.com"))
                .thenThrow(new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.FORBIDDEN, "Access denied"));

        mockMvc.perform(get("/api/v1/dashboard/alerts/priority")
                        .with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user("user@example.com").roles("USER"))
                        .header("X-Tenant-ID", tenantId.toString())
                        .header("X-User-Email", "user@example.com"))
                .andExpect(status().isForbidden());
    }
}
