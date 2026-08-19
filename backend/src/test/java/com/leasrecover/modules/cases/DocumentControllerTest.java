package com.leasrecover.modules.cases;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.leasrecover.modules.cases.dto.DocumentResponse;
import com.leasrecover.modules.tenant.Tenant;
import com.leasrecover.modules.tenant.TenantRepository;
import com.leasrecover.modules.users.AppUser;
import com.leasrecover.modules.users.AppUserRepository;
import com.leasrecover.modules.superadmin.SuperAdminRepository;
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
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(DocumentController.class)
@Import({
    com.leasrecover.config.SecurityConfig.class,
    com.leasrecover.modules.auth.JwtAuthenticationFilter.class,
    com.leasrecover.config.tenant.TenantFilter.class
})
@org.springframework.security.test.context.support.WithMockUser(roles = "GESTIONNAIRE")
class DocumentControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private DocumentUploadService documentUploadService;

    @MockitoBean
    private com.leasrecover.modules.auth.JwtService jwtService;

    @MockitoBean
    private TenantRepository tenantRepository;

    @MockitoBean
    private AppUserRepository appUserRepository;

    @MockitoBean
    private SuperAdminRepository superAdminRepository;

    private UUID tenantId;

    @BeforeEach
    void setUp() {
        tenantId = UUID.randomUUID();

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
    void testUploadEntityDocument_Success() throws Exception {
        UUID clientId = UUID.randomUUID();
        DocumentResponse docResponse = new DocumentResponse();
        docResponse.setId(UUID.randomUUID());
        docResponse.setFileName("kbis.pdf");
        docResponse.setFileUrl("/api/v1/documents/" + docResponse.getId() + "/download");
        docResponse.setUploaderName("Jean Dupont");
        docResponse.setCreatedAt(ZonedDateTime.now());

        when(documentUploadService.storeEntityDocument(any(), eq("client"), eq(clientId), eq("gestionnaire@example.com")))
                .thenReturn(docResponse);

        mockMvc.perform(multipart("/api/v1/documents")
                        .file(new org.springframework.mock.web.MockMultipartFile(
                                "file", "kbis.pdf", "application/pdf", "PDF content".getBytes()))
                        .param("entityType", "client")
                        .param("entityId", clientId.toString())
                        .with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user("gestionnaire@example.com").roles("GESTIONNAIRE"))
                        .header("X-Tenant-ID", tenantId.toString())
                        .header("X-User-Email", "gestionnaire@example.com"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("success"))
                .andExpect(jsonPath("$.data.fileName").value("kbis.pdf"));
    }

    @Test
    void testGetEntityDocuments_Success() throws Exception {
        UUID contractId = UUID.randomUUID();
        DocumentResponse docResponse = new DocumentResponse();
        docResponse.setId(UUID.randomUUID());
        docResponse.setFileName("contract.pdf");
        docResponse.setFileUrl("/api/v1/documents/" + docResponse.getId() + "/download");
        docResponse.setUploaderName("Jean Dupont");
        docResponse.setCreatedAt(ZonedDateTime.now());

        when(documentUploadService.getDocumentsForEntity("contract", contractId))
                .thenReturn(List.of(docResponse));

        mockMvc.perform(get("/api/v1/documents")
                        .param("entityType", "contract")
                        .param("entityId", contractId.toString())
                        .with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user("gestionnaire@example.com").roles("GESTIONNAIRE"))
                        .header("X-Tenant-ID", tenantId.toString())
                        .header("X-User-Email", "gestionnaire@example.com"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("success"))
                .andExpect(jsonPath("$.data[0].fileName").value("contract.pdf"));
    }

    @Test
    void testDownloadEntityDocument_Success() throws Exception {
        UUID docId = UUID.randomUUID();
        byte[] fileContent = "PDF content".getBytes();
        org.springframework.core.io.ByteArrayResource resource =
                new org.springframework.core.io.ByteArrayResource(fileContent);

        when(documentUploadService.loadDocumentAsResource(eq(docId))).thenReturn(resource);
        when(documentUploadService.getDocumentOriginalFileName(eq(docId))).thenReturn("kbis.pdf");

        mockMvc.perform(get("/api/v1/documents/" + docId + "/download")
                        .with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user("gestionnaire@example.com").roles("GESTIONNAIRE"))
                        .header("X-Tenant-ID", tenantId.toString())
                        .header("X-User-Email", "gestionnaire@example.com"))
                .andExpect(status().isOk())
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.content().contentType(MediaType.APPLICATION_PDF))
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.header().string(
                        "Content-Disposition", "attachment; filename=\"kbis.pdf\""));
    }
}
