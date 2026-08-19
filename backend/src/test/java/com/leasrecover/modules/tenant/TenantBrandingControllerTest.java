package com.leasrecover.modules.tenant;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.leasrecover.modules.tenant.dto.TenantBrandingRequest;
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

import java.util.Optional;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(TenantBrandingController.class)
@Import({
    com.leasrecover.config.SecurityConfig.class,
    com.leasrecover.modules.auth.JwtAuthenticationFilter.class,
    com.leasrecover.config.tenant.TenantFilter.class
})
class TenantBrandingControllerTest {

    @Autowired
    private MockMvc mockMvc;

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

    private UUID tenantId;
    private Tenant tenant;
    private AppUser adminUser;
    private AppUser nonAdminUser;

    @BeforeEach
    void setUp() {
        tenantId = UUID.randomUUID();

        tenant = new Tenant();
        tenant.setId(tenantId);
        tenant.setName("Test Tenant");
        tenant.setLogoUrl("https://example.com/logo.png");
        tenant.setStatus("ACTIVE");

        adminUser = new AppUser();
        adminUser.setId(UUID.randomUUID());
        adminUser.setTenantId(tenantId);
        adminUser.setEmail("admin@example.com");
        adminUser.setRole("ADMIN");
        adminUser.setStatus("ACTIVE");

        nonAdminUser = new AppUser();
        nonAdminUser.setId(UUID.randomUUID());
        nonAdminUser.setTenantId(tenantId);
        nonAdminUser.setEmail("user@example.com");
        nonAdminUser.setRole("GESTIONNAIRE");
        nonAdminUser.setStatus("ACTIVE");
    }

    @Test
    void testGetTenantBranding_Success() throws Exception {
        when(tenantRepository.findById(tenantId)).thenReturn(Optional.of(tenant));
        when(appUserRepository.findByEmailAndIsDeletedFalse("admin@example.com")).thenReturn(Optional.of(adminUser));

        mockMvc.perform(get("/api/v1/admin/tenant")
                        .with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user("admin").roles("ADMIN"))
                        .header("X-Tenant-ID", tenantId.toString())
                        .header("X-User-Email", "admin@example.com"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("success"))
                .andExpect(jsonPath("$.data.name").value("Test Tenant"))
                .andExpect(jsonPath("$.data.logoUrl").value("https://example.com/logo.png"));
    }

    @Test
    void testGetTenantBranding_AccessDenied_NonAdmin() throws Exception {
        when(tenantRepository.findById(tenantId)).thenReturn(Optional.of(tenant));
        when(appUserRepository.findByEmailAndIsDeletedFalse("user@example.com")).thenReturn(Optional.of(nonAdminUser));

        mockMvc.perform(get("/api/v1/admin/tenant")
                        .with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user("user").roles("GESTIONNAIRE"))
                        .header("X-Tenant-ID", tenantId.toString())
                        .header("X-User-Email", "user@example.com"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value("error"))
                .andExpect(jsonPath("$.message").value("Access denied: Admin role required"));
    }

    @Test
    void testUpdateTenantBranding_Success() throws Exception {
        TenantBrandingRequest request = new TenantBrandingRequest("New Name", "https://example.com/new-logo.png");

        when(tenantRepository.findById(tenantId)).thenReturn(Optional.of(tenant));
        when(appUserRepository.findByEmailAndIsDeletedFalse("admin@example.com")).thenReturn(Optional.of(adminUser));
        when(tenantRepository.save(any(Tenant.class))).thenAnswer(invocation -> invocation.getArgument(0));

        mockMvc.perform(put("/api/v1/admin/tenant/branding")
                        .with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user("admin").roles("ADMIN"))
                        .header("X-Tenant-ID", tenantId.toString())
                        .header("X-User-Email", "admin@example.com")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("success"))
                .andExpect(jsonPath("$.data.name").value("New Name"))
                .andExpect(jsonPath("$.data.logoUrl").value("https://example.com/new-logo.png"));
    }

    @Test
    void testUpdateTenantBranding_ValidationFailure_BlankName() throws Exception {
        TenantBrandingRequest request = new TenantBrandingRequest("", "https://example.com/logo.png");

        when(tenantRepository.findById(tenantId)).thenReturn(Optional.of(tenant));
        when(appUserRepository.findByEmailAndIsDeletedFalse("admin@example.com")).thenReturn(Optional.of(adminUser));

        mockMvc.perform(put("/api/v1/admin/tenant/branding")
                        .with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user("admin").roles("ADMIN"))
                        .header("X-Tenant-ID", tenantId.toString())
                        .header("X-User-Email", "admin@example.com")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value("fail"))
                .andExpect(jsonPath("$.data.name").exists());
    }

    @Test
    void testUpdateTenantBranding_ValidationFailure_InvalidUrl() throws Exception {
        TenantBrandingRequest request = new TenantBrandingRequest("New Name", "invalid-url");

        when(tenantRepository.findById(tenantId)).thenReturn(Optional.of(tenant));
        when(appUserRepository.findByEmailAndIsDeletedFalse("admin@example.com")).thenReturn(Optional.of(adminUser));

        mockMvc.perform(put("/api/v1/admin/tenant/branding")
                        .with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user("admin").roles("ADMIN"))
                        .header("X-Tenant-ID", tenantId.toString())
                        .header("X-User-Email", "admin@example.com")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value("fail"))
                .andExpect(jsonPath("$.data.logoUrl").exists());
    }
}
