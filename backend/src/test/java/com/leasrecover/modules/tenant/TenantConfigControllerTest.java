package com.leasrecover.modules.tenant;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.leasrecover.modules.tenant.dto.TenantConfigRequest;
import com.leasrecover.modules.tenant.dto.ThresholdResponse;
import com.leasrecover.modules.tenant.dto.ThresholdUpdateRequest;
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

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(TenantConfigController.class)
@Import({
    com.leasrecover.config.SecurityConfig.class,
    com.leasrecover.modules.auth.JwtAuthenticationFilter.class,
    com.leasrecover.config.tenant.TenantFilter.class
})
class TenantConfigControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private com.leasrecover.modules.auth.JwtService jwtService;

    @MockitoBean
    private TenantConfigRepository tenantConfigRepository;

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
    private TenantConfig tenantConfig;
    private AppUser adminUser;
    private AppUser nonAdminUser;

    @BeforeEach
    void setUp() {
        tenantId = UUID.randomUUID();

        tenant = new Tenant();
        tenant.setId(tenantId);
        tenant.setName("Test Tenant");
        tenant.setStatus("ACTIVE");

        tenantConfig = new TenantConfig();
        tenantConfig.setTenantId(tenantId);
        tenantConfig.setDormancyThresholdDays(30);
        tenantConfig.setAiDeviationModerate(new BigDecimal("10.00"));
        tenantConfig.setAiDeviationCritical(new BigDecimal("20.00"));
        
        Map<String, Integer> delays = new HashMap<>();
        delays.put("PRE_CONTENTIEUX", 15);
        delays.put("MISE_EN_DEMEURE", 30);
        delays.put("SAISIE", 45);
        delays.put("VENTE", 60);
        tenantConfig.setPhaseLegalDelays(delays);

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
    void testGetTenantConfig_Success() throws Exception {
        when(tenantRepository.findById(tenantId)).thenReturn(Optional.of(tenant));
        when(appUserRepository.findByEmailAndIsDeletedFalse("admin@example.com")).thenReturn(Optional.of(adminUser));
        when(tenantConfigRepository.findById(tenantId)).thenReturn(Optional.of(tenantConfig));

        mockMvc.perform(get("/api/v1/admin/tenant/config")
                        .with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user("admin").roles("ADMIN"))
                        .header("X-Tenant-ID", tenantId.toString())
                        .header("X-User-Email", "admin@example.com"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("success"))
                .andExpect(jsonPath("$.data.dormancyThresholdDays").value(30))
                .andExpect(jsonPath("$.data.phaseLegalDelays.PRE_CONTENTIEUX").value(15))
                .andExpect(jsonPath("$.data.phaseLegalDelays.MISE_EN_DEMEURE").value(30));
    }

    @Test
    void testGetTenantConfig_LazyInitialization() throws Exception {
        when(tenantRepository.findById(tenantId)).thenReturn(Optional.of(tenant));
        when(appUserRepository.findByEmailAndIsDeletedFalse("admin@example.com")).thenReturn(Optional.of(adminUser));
        when(tenantConfigRepository.findById(tenantId)).thenReturn(Optional.empty());
        when(tenantConfigRepository.save(any(TenantConfig.class))).thenAnswer(invocation -> invocation.getArgument(0));

        mockMvc.perform(get("/api/v1/admin/tenant/config")
                        .with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user("admin").roles("ADMIN"))
                        .header("X-Tenant-ID", tenantId.toString())
                        .header("X-User-Email", "admin@example.com"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("success"))
                .andExpect(jsonPath("$.data.dormancyThresholdDays").value(30))
                .andExpect(jsonPath("$.data.phaseLegalDelays.PRE_CONTENTIEUX").value(15));
    }

    @Test
    void testGetTenantConfig_AccessDenied_NonAdmin() throws Exception {
        when(tenantRepository.findById(tenantId)).thenReturn(Optional.of(tenant));
        when(appUserRepository.findByEmailAndIsDeletedFalse("user@example.com")).thenReturn(Optional.of(nonAdminUser));

        mockMvc.perform(get("/api/v1/admin/tenant/config")
                        .with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user("user").roles("GESTIONNAIRE"))
                        .header("X-Tenant-ID", tenantId.toString())
                        .header("X-User-Email", "user@example.com"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value("error"))
                .andExpect(jsonPath("$.message").value("Access denied: Admin role required"));
    }

    @Test
    void testUpdateTenantConfig_Success() throws Exception {
        Map<String, Integer> newDelays = new HashMap<>();
        newDelays.put("PRE_CONTENTIEUX", 20);
        newDelays.put("MISE_EN_DEMEURE", 40);
        newDelays.put("SAISIE", 50);
        newDelays.put("VENTE", 70);

        TenantConfigRequest request = new TenantConfigRequest(45, newDelays);

        when(tenantRepository.findById(tenantId)).thenReturn(Optional.of(tenant));
        when(appUserRepository.findByEmailAndIsDeletedFalse("admin@example.com")).thenReturn(Optional.of(adminUser));
        when(tenantConfigRepository.findById(tenantId)).thenReturn(Optional.of(tenantConfig));
        when(tenantConfigRepository.save(any(TenantConfig.class))).thenAnswer(invocation -> invocation.getArgument(0));

        mockMvc.perform(put("/api/v1/admin/tenant/config")
                        .with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user("admin").roles("ADMIN"))
                        .header("X-Tenant-ID", tenantId.toString())
                        .header("X-User-Email", "admin@example.com")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("success"))
                .andExpect(jsonPath("$.data.dormancyThresholdDays").value(45))
                .andExpect(jsonPath("$.data.phaseLegalDelays.PRE_CONTENTIEUX").value(20))
                .andExpect(jsonPath("$.data.phaseLegalDelays.MISE_EN_DEMEURE").value(40));
    }

    @Test
    void testUpdateTenantConfig_ValidationFailure_NegativeDormancy() throws Exception {
        Map<String, Integer> newDelays = new HashMap<>();
        newDelays.put("PRE_CONTENTIEUX", 20);
        newDelays.put("MISE_EN_DEMEURE", 40);

        TenantConfigRequest request = new TenantConfigRequest(-5, newDelays);

        when(tenantRepository.findById(tenantId)).thenReturn(Optional.of(tenant));
        when(appUserRepository.findByEmailAndIsDeletedFalse("admin@example.com")).thenReturn(Optional.of(adminUser));

        mockMvc.perform(put("/api/v1/admin/tenant/config")
                        .with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user("admin").roles("ADMIN"))
                        .header("X-Tenant-ID", tenantId.toString())
                        .header("X-User-Email", "admin@example.com")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value("fail"))
                .andExpect(jsonPath("$.data.dormancyThresholdDays").exists());
    }

    @Test
    void testUpdateTenantConfig_ValidationFailure_InvalidDelays() throws Exception {
        Map<String, Integer> newDelays = new HashMap<>();
        newDelays.put("PRE_CONTENTIEUX", -10);
        newDelays.put("MISE_EN_DEMEURE", 0);

        TenantConfigRequest request = new TenantConfigRequest(30, newDelays);

        when(tenantRepository.findById(tenantId)).thenReturn(Optional.of(tenant));
        when(appUserRepository.findByEmailAndIsDeletedFalse("admin@example.com")).thenReturn(Optional.of(adminUser));

        mockMvc.perform(put("/api/v1/admin/tenant/config")
                        .with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user("admin").roles("ADMIN"))
                        .header("X-Tenant-ID", tenantId.toString())
                        .header("X-User-Email", "admin@example.com")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value("fail"))
                .andExpect(jsonPath("$.data.phaseLegalDelaysValid").exists());
    }

    @Test
    void testGetThresholds_Success() throws Exception {
        when(tenantRepository.findById(tenantId)).thenReturn(Optional.of(tenant));
        when(appUserRepository.findByEmailAndIsDeletedFalse("admin@example.com")).thenReturn(Optional.of(adminUser));
        when(tenantConfigRepository.findById(tenantId)).thenReturn(Optional.of(tenantConfig));

        mockMvc.perform(get("/api/v1/admin/tenant/config/thresholds")
                        .with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user("admin").roles("ADMIN"))
                        .header("X-Tenant-ID", tenantId.toString())
                        .header("X-User-Email", "admin@example.com"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("success"))
                .andExpect(jsonPath("$.data.aiDeviationModerate").value(10.00))
                .andExpect(jsonPath("$.data.aiDeviationCritical").value(20.00));
    }

    @Test
    void testUpdateThresholds_Success() throws Exception {
        ThresholdUpdateRequest request = new ThresholdUpdateRequest(new BigDecimal("15.50"), new BigDecimal("25.50"));

        when(tenantRepository.findById(tenantId)).thenReturn(Optional.of(tenant));
        when(appUserRepository.findByEmailAndIsDeletedFalse("admin@example.com")).thenReturn(Optional.of(adminUser));
        when(tenantConfigRepository.findById(tenantId)).thenReturn(Optional.of(tenantConfig));
        when(tenantConfigRepository.save(any(TenantConfig.class))).thenAnswer(invocation -> invocation.getArgument(0));

        mockMvc.perform(put("/api/v1/admin/tenant/config/thresholds")
                        .with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user("admin").roles("ADMIN"))
                        .header("X-Tenant-ID", tenantId.toString())
                        .header("X-User-Email", "admin@example.com")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("success"))
                .andExpect(jsonPath("$.data.aiDeviationModerate").value(15.50))
                .andExpect(jsonPath("$.data.aiDeviationCritical").value(25.50));
    }

    @Test
    void testUpdateThresholds_ValidationFailure_ModerateGreaterThanCritical() throws Exception {
        ThresholdUpdateRequest request = new ThresholdUpdateRequest(new BigDecimal("30.00"), new BigDecimal("20.00"));

        when(tenantRepository.findById(tenantId)).thenReturn(Optional.of(tenant));
        when(appUserRepository.findByEmailAndIsDeletedFalse("admin@example.com")).thenReturn(Optional.of(adminUser));

        mockMvc.perform(put("/api/v1/admin/tenant/config/thresholds")
                        .with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user("admin").roles("ADMIN"))
                        .header("X-Tenant-ID", tenantId.toString())
                        .header("X-User-Email", "admin@example.com")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value("fail"))
                .andExpect(jsonPath("$.data.thresholdRangeValid").exists());
    }

    @Test
    void testUpdateThresholds_ValidationFailure_NegativeAndOutofBounds() throws Exception {
        ThresholdUpdateRequest request = new ThresholdUpdateRequest(new BigDecimal("-5.00"), new BigDecimal("105.00"));

        when(tenantRepository.findById(tenantId)).thenReturn(Optional.of(tenant));
        when(appUserRepository.findByEmailAndIsDeletedFalse("admin@example.com")).thenReturn(Optional.of(adminUser));

        mockMvc.perform(put("/api/v1/admin/tenant/config/thresholds")
                        .with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user("admin").roles("ADMIN"))
                        .header("X-Tenant-ID", tenantId.toString())
                        .header("X-User-Email", "admin@example.com")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value("fail"))
                .andExpect(jsonPath("$.data.aiDeviationModerate").exists())
                .andExpect(jsonPath("$.data.aiDeviationCritical").exists());
    }

    @Test
    void testGetThresholds_AccessDenied_NonAdmin() throws Exception {
        when(tenantRepository.findById(tenantId)).thenReturn(Optional.of(tenant));
        when(appUserRepository.findByEmailAndIsDeletedFalse("user@example.com")).thenReturn(Optional.of(nonAdminUser));

        mockMvc.perform(get("/api/v1/admin/tenant/config/thresholds")
                        .with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user("user").roles("GESTIONNAIRE"))
                        .header("X-Tenant-ID", tenantId.toString())
                        .header("X-User-Email", "user@example.com"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value("error"))
                .andExpect(jsonPath("$.message").value("Access denied: Admin role required"));
    }
}
