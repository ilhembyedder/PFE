package com.leasrecover.modules.cases;

import com.leasrecover.config.FileStorageConfig;
import com.leasrecover.core.tenant.TenantContextHolder;
import com.leasrecover.modules.cases.dto.DocumentResponse;
import com.leasrecover.modules.client.Client;
import com.leasrecover.modules.client.ClientRepository;
import com.leasrecover.modules.contract.Contract;
import com.leasrecover.modules.contract.ContractRepository;
import com.leasrecover.modules.users.AppUser;
import com.leasrecover.modules.users.AppUserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.io.TempDir;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class DocumentUploadServiceTest {

    @TempDir
    Path tempDir;

    @Mock
    private FileStorageConfig fileStorageConfig;

    @Mock
    private DocumentRepository documentRepository;

    @Mock
    private RecoveryCaseRepository recoveryCaseRepository;

    @Mock
    private AppUserRepository appUserRepository;

    @Mock
    private AIValuationRepository aiValuationRepository;

    @Mock
    private CaseAlertService caseAlertService;

    @Mock
    private ClientRepository clientRepository;

    @Mock
    private ContractRepository contractRepository;

    @Mock
    private VehicleRepository vehicleRepository;

    @InjectMocks
    private DocumentUploadService documentUploadService;

    private UUID tenantId;
    private AppUser gestionnaire;
    private RecoveryCase recoveryCase;

    @BeforeEach
    void setUp() {
        tenantId = UUID.randomUUID();
        TenantContextHolder.setTenantUuid(tenantId);
        TenantContextHolder.setTenantId("tenant_" + tenantId.toString().replace("-", ""));

        gestionnaire = new AppUser();
        gestionnaire.setId(UUID.randomUUID());
        gestionnaire.setTenantId(tenantId);
        gestionnaire.setEmail("gestionnaire@example.com");
        gestionnaire.setRole("GESTIONNAIRE");
        gestionnaire.setFirstName("Jean");
        gestionnaire.setLastName("Dupont");
        gestionnaire.setStatus("ACTIVE");

        recoveryCase = new RecoveryCase();
        recoveryCase.setId(UUID.randomUUID());
        recoveryCase.setTenantId(tenantId);

        when(fileStorageConfig.getUploadDir()).thenReturn(tempDir.toString());
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    // -------------------------------------------------------------------------
    // storeDocument — success cases
    // -------------------------------------------------------------------------

    @Test
    void testStoreDocument_PDF_Success() {
        UUID caseId = recoveryCase.getId();
        MockMultipartFile file = new MockMultipartFile(
                "file", "test-report.pdf", "application/pdf", "PDF content bytes".getBytes()
        );

        when(appUserRepository.findByEmailAndIsDeletedFalse("gestionnaire@example.com"))
                .thenReturn(Optional.of(gestionnaire));
        when(recoveryCaseRepository.findById(caseId)).thenReturn(Optional.of(recoveryCase));
        when(documentRepository.save(any(Document.class))).thenAnswer(invocation -> {
            Document doc = invocation.getArgument(0);
            // Give the saved document an ID
            if (doc.getId() == null) doc.setId(UUID.randomUUID());
            return doc;
        });

        DocumentResponse response = documentUploadService.storeDocument(
                caseId, file, "PRE_CONTENTIEUX", "gestionnaire@example.com");

        assertNotNull(response);
        assertEquals("test-report.pdf", response.getFileName());
        assertEquals("PRE_CONTENTIEUX", response.getPhaseUploadedIn());
        // Verify file was physically saved on disk under the tenant sub-directory
        Path tenantDir = tempDir.resolve(tenantId.toString());
        assertTrue(Files.exists(tenantDir), "Tenant directory should be created");
        try {
            long fileCount = Files.list(tenantDir).count();
            assertEquals(1, fileCount, "Exactly one file should be stored in tenant dir");
        } catch (IOException e) {
            fail("Could not list tenant directory: " + e.getMessage());
        }
        verify(documentRepository).save(any(Document.class));
    }

    @Test
    void testStoreDocument_JPEG_Success() {
        UUID caseId = recoveryCase.getId();
        MockMultipartFile file = new MockMultipartFile(
                "file", "vehicle-photo.jpg", "image/jpeg", "JPEG bytes".getBytes()
        );

        when(appUserRepository.findByEmailAndIsDeletedFalse("gestionnaire@example.com"))
                .thenReturn(Optional.of(gestionnaire));
        when(recoveryCaseRepository.findById(caseId)).thenReturn(Optional.of(recoveryCase));
        when(documentRepository.save(any(Document.class))).thenAnswer(invocation -> invocation.getArgument(0));

        DocumentResponse response = documentUploadService.storeDocument(
                caseId, file, "SAISIE", "gestionnaire@example.com");

        assertNotNull(response);
        assertEquals("vehicle-photo.jpg", response.getFileName());
        assertEquals("SAISIE", response.getPhaseUploadedIn());
    }

    // -------------------------------------------------------------------------
    // storeDocument — validation failures
    // -------------------------------------------------------------------------

    @Test
    void testStoreDocument_Rejects_ExecutableFile() {
        UUID caseId = recoveryCase.getId();
        MockMultipartFile file = new MockMultipartFile(
                "file", "malware.exe", "application/octet-stream", "EXE bytes".getBytes()
        );

        when(appUserRepository.findByEmailAndIsDeletedFalse("gestionnaire@example.com"))
                .thenReturn(Optional.of(gestionnaire));
        when(recoveryCaseRepository.findById(caseId)).thenReturn(Optional.of(recoveryCase));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () ->
                documentUploadService.storeDocument(caseId, file, "PRE_CONTENTIEUX", "gestionnaire@example.com"));

        assertEquals(415, ex.getStatusCode().value(), "Should return 415 Unsupported Media Type");
        verify(documentRepository, never()).save(any(Document.class));
    }

    @Test
    void testStoreDocument_Rejects_FileTooLarge() {
        UUID caseId = recoveryCase.getId();
        // Create a file that is just over 10MB
        byte[] largeContent = new byte[10 * 1024 * 1024 + 1];
        MockMultipartFile file = new MockMultipartFile(
                "file", "large-file.pdf", "application/pdf", largeContent
        );

        when(appUserRepository.findByEmailAndIsDeletedFalse("gestionnaire@example.com"))
                .thenReturn(Optional.of(gestionnaire));
        when(recoveryCaseRepository.findById(caseId)).thenReturn(Optional.of(recoveryCase));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () ->
                documentUploadService.storeDocument(caseId, file, "VENTE", "gestionnaire@example.com"));

        assertEquals(413, ex.getStatusCode().value(), "Should return 413 Payload Too Large");
        verify(documentRepository, never()).save(any(Document.class));
    }

    @Test
    void testStoreDocument_Rejects_EmptyFile() {
        UUID caseId = recoveryCase.getId();
        MockMultipartFile file = new MockMultipartFile(
                "file", "empty.pdf", "application/pdf", new byte[0]
        );

        when(appUserRepository.findByEmailAndIsDeletedFalse("gestionnaire@example.com"))
                .thenReturn(Optional.of(gestionnaire));
        when(recoveryCaseRepository.findById(caseId)).thenReturn(Optional.of(recoveryCase));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () ->
                documentUploadService.storeDocument(caseId, file, "PRE_CONTENTIEUX", "gestionnaire@example.com"));

        assertEquals(400, ex.getStatusCode().value(), "Should return 400 Bad Request for empty file");
        verify(documentRepository, never()).save(any(Document.class));
    }

    @Test
    void testStoreDocument_Rejects_NonGestionnaire() {
        UUID caseId = recoveryCase.getId();
        MockMultipartFile file = new MockMultipartFile(
                "file", "doc.pdf", "application/pdf", "content".getBytes()
        );

        gestionnaire.setRole("USER");
        when(appUserRepository.findByEmailAndIsDeletedFalse("gestionnaire@example.com"))
                .thenReturn(Optional.of(gestionnaire));
        when(recoveryCaseRepository.findById(caseId)).thenReturn(Optional.of(recoveryCase));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () ->
                documentUploadService.storeDocument(caseId, file, "PRE_CONTENTIEUX", "gestionnaire@example.com"));

        assertEquals(403, ex.getStatusCode().value(), "Should return 403 Forbidden for non-GESTIONNAIRE");
        verify(documentRepository, never()).save(any(Document.class));
    }

    @Test
    void testStoreDocument_TenantIsolation_WrongTenant() {
        UUID caseId = recoveryCase.getId();
        recoveryCase.setTenantId(UUID.randomUUID()); // Different tenant than TenantContextHolder
        MockMultipartFile file = new MockMultipartFile(
                "file", "doc.pdf", "application/pdf", "content".getBytes()
        );

        when(appUserRepository.findByEmailAndIsDeletedFalse("gestionnaire@example.com"))
                .thenReturn(Optional.of(gestionnaire));
        when(recoveryCaseRepository.findById(caseId)).thenReturn(Optional.of(recoveryCase));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () ->
                documentUploadService.storeDocument(caseId, file, "PRE_CONTENTIEUX", "gestionnaire@example.com"));

        assertEquals(403, ex.getStatusCode().value(), "Should return 403 for cross-tenant access");
        verify(documentRepository, never()).save(any(Document.class));
    }

    // -------------------------------------------------------------------------
    // storeDocument — transactional safety: orphan cleanup on DB failure
    // -------------------------------------------------------------------------

    @Test
    void testStoreDocument_CleansUpDiskFile_OnDbFailure() {
        UUID caseId = recoveryCase.getId();
        MockMultipartFile file = new MockMultipartFile(
                "file", "report.pdf", "application/pdf", "PDF content".getBytes()
        );

        when(appUserRepository.findByEmailAndIsDeletedFalse("gestionnaire@example.com"))
                .thenReturn(Optional.of(gestionnaire));
        when(recoveryCaseRepository.findById(caseId)).thenReturn(Optional.of(recoveryCase));
        when(documentRepository.save(any(Document.class)))
                .thenThrow(new RuntimeException("DB commit failed"));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () ->
                documentUploadService.storeDocument(caseId, file, "MISE_EN_DEMEURE", "gestionnaire@example.com"));

        assertEquals(500, ex.getStatusCode().value());
        // The tenant directory may exist but there should be no orphaned file
        Path tenantDir = tempDir.resolve(tenantId.toString());
        if (Files.exists(tenantDir)) {
            try {
                long remainingFiles = Files.list(tenantDir).count();
                assertEquals(0, remainingFiles, "Orphaned disk file should have been cleaned up");
            } catch (IOException e) {
                fail("Could not list tenant directory: " + e.getMessage());
            }
        }
    }

    // -------------------------------------------------------------------------
    // getDocumentsForCase
    // -------------------------------------------------------------------------

    @Test
    void testGetDocumentsForCase_Success() {
        UUID caseId = recoveryCase.getId();

        Document doc = new Document();
        doc.setId(UUID.randomUUID());
        doc.setFileName("doc.pdf");
        doc.setFileUrl(tenantId + "/uuid-generated.pdf");
        doc.setPhaseUploadedIn("VENTE");
        doc.setUploader(gestionnaire);
        doc.setRecoveryCase(recoveryCase);

        when(recoveryCaseRepository.findById(caseId)).thenReturn(Optional.of(recoveryCase));
        when(documentRepository.findAllByRecoveryCaseIdAndIsDeletedFalseOrderByCreatedAtAsc(caseId))
                .thenReturn(List.of(doc));

        List<DocumentResponse> result = documentUploadService.getDocumentsForCase(caseId);

        assertEquals(1, result.size());
        assertEquals("doc.pdf", result.get(0).getFileName());
        assertEquals("VENTE", result.get(0).getPhaseUploadedIn());
        // Verify download URL is constructed correctly
        assertTrue(result.get(0).getFileUrl().contains("/download"),
                "fileUrl in response should point to download endpoint");
    }

    @Test
    void testGetDocumentsForCase_TenantViolation() {
        UUID caseId = UUID.randomUUID();
        recoveryCase.setTenantId(UUID.randomUUID()); // different tenant
        when(recoveryCaseRepository.findById(caseId)).thenReturn(Optional.of(recoveryCase));

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () ->
                documentUploadService.getDocumentsForCase(caseId));

        assertEquals(403, ex.getStatusCode().value());
    }

    @Test
    void testStoreDocument_ExpertiseReport_TriggersAIValuation() {
        UUID caseId = recoveryCase.getId();
        recoveryCase.setCurrentPhase(RecoveryPhase.SAISIE);
        MockMultipartFile file = new MockMultipartFile(
                "file", "expertise-report.pdf", "application/pdf", "PDF content bytes".getBytes()
        );

        // Mock RestTemplate
        RestTemplate mockRestTemplate = mock(RestTemplate.class);
        documentUploadService.setRestTemplate(mockRestTemplate);

        when(appUserRepository.findByEmailAndIsDeletedFalse("gestionnaire@example.com"))
                .thenReturn(Optional.of(gestionnaire));
        when(recoveryCaseRepository.findById(caseId)).thenReturn(Optional.of(recoveryCase));
        when(documentRepository.save(any(Document.class))).thenAnswer(invocation -> {
            Document doc = invocation.getArgument(0);
            if (doc.getId() == null) doc.setId(UUID.randomUUID());
            return doc;
        });

        // Mock AIValuationRepository
        when(aiValuationRepository.save(any(AIValuation.class))).thenAnswer(invocation -> {
            AIValuation val = invocation.getArgument(0);
            if (val.getId() == null) val.setId(UUID.randomUUID());
            return val;
        });

        // We upload document under the "SAISIE" phase and check if AIValuation is created
        DocumentResponse response = documentUploadService.storeDocument(
                caseId, file, "SAISIE", "EXPERTISE_REPORT", "gestionnaire@example.com");

        assertNotNull(response);
        assertEquals("expertise-report.pdf", response.getFileName());
        assertEquals("SAISIE", response.getPhaseUploadedIn());

        // Verify that the AIValuation entity was saved in PENDING state
        verify(aiValuationRepository, times(1)).save(any(AIValuation.class));

        // Verify that the async call to RestTemplate was made
        verify(mockRestTemplate, timeout(2000)).postForEntity(
                anyString(), any(org.springframework.http.HttpEntity.class), eq(String.class)
        );
    }

    @Test
    void testStoreEntityDocument_Client_Success() {
        UUID clientId = UUID.randomUUID();
        Client client = new Client();
        client.setId(clientId);
        client.setTenantId(tenantId);
        client.setFullNameOrCompany("Client Company");

        MockMultipartFile file = new MockMultipartFile(
                "file", "kbis.pdf", "application/pdf", "Client KBIS".getBytes()
        );

        when(appUserRepository.findByEmailAndIsDeletedFalse("gestionnaire@example.com"))
                .thenReturn(Optional.of(gestionnaire));
        when(clientRepository.findById(clientId)).thenReturn(Optional.of(client));
        when(documentRepository.save(any(Document.class))).thenAnswer(invocation -> {
            Document doc = invocation.getArgument(0);
            if (doc.getId() == null) doc.setId(UUID.randomUUID());
            return doc;
        });

        DocumentResponse response = documentUploadService.storeEntityDocument(
                file, "client", clientId, "gestionnaire@example.com");

        assertNotNull(response);
        assertEquals("kbis.pdf", response.getFileName());
        assertNull(response.getPhaseUploadedIn());
        // Verify download URL uses general endpoint
        assertTrue(response.getFileUrl().startsWith("/api/v1/documents/"));
    }

    @Test
    void testGetDocumentsForEntity_Contract_Success() {
        UUID contractId = UUID.randomUUID();
        Contract contract = new Contract();
        contract.setId(contractId);
        contract.setTenantId(tenantId);

        Document doc = new Document();
        doc.setId(UUID.randomUUID());
        doc.setFileName("contract.pdf");
        doc.setContract(contract);
        doc.setTenantId(tenantId);

        when(contractRepository.findById(contractId)).thenReturn(Optional.of(contract));
        when(documentRepository.findAllByContractIdAndIsDeletedFalseOrderByCreatedAtAsc(contractId))
                .thenReturn(List.of(doc));

        List<DocumentResponse> responses = documentUploadService.getDocumentsForEntity("contract", contractId);
        assertNotNull(responses);
        assertEquals(1, responses.size());
        assertEquals("contract.pdf", responses.get(0).getFileName());
    }

    @Test
    void testStoreEntityDocument_WrongTenant_ThrowsForbidden() {
        UUID clientId = UUID.randomUUID();
        Client client = new Client();
        client.setId(clientId);
        client.setTenantId(UUID.randomUUID()); // different tenant

        MockMultipartFile file = new MockMultipartFile(
                "file", "kbis.pdf", "application/pdf", "Client KBIS".getBytes()
        );

        when(appUserRepository.findByEmailAndIsDeletedFalse("gestionnaire@example.com"))
                .thenReturn(Optional.of(gestionnaire));
        when(clientRepository.findById(clientId)).thenReturn(Optional.of(client));

        assertThrows(ResponseStatusException.class, () ->
                documentUploadService.storeEntityDocument(file, "client", clientId, "gestionnaire@example.com"));
    }
}
