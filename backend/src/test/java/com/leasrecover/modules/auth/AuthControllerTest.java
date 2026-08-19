package com.leasrecover.modules.auth;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.leasrecover._common.dto.JSendResponse;
import com.leasrecover.modules.auth.dto.AuthRequest;
import com.leasrecover.modules.superadmin.SuperAdmin;
import com.leasrecover.modules.superadmin.SuperAdminRepository;
import com.leasrecover.modules.tenant.Tenant;
import com.leasrecover.modules.tenant.TenantRepository;
import com.leasrecover.modules.users.AppUser;
import com.leasrecover.modules.users.AppUserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Optional;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AuthController.class)
@Import({com.leasrecover.config.SecurityConfig.class, com.leasrecover.modules.auth.JwtAuthenticationFilter.class})
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private JwtService jwtService;

    @MockitoBean
    private PasswordEncoder passwordEncoder;

    @MockitoBean
    private TenantRepository tenantRepository;

    @MockitoBean
    private AppUserRepository appUserRepository;

    @MockitoBean
    private SuperAdminRepository superAdminRepository;

    @Autowired
    private ObjectMapper objectMapper;

    private SuperAdmin superAdmin;
    private Tenant tenant;
    private AppUser appUser;

    @BeforeEach
    void setUp() {
        superAdmin = new SuperAdmin();
        superAdmin.setId(UUID.randomUUID());
        superAdmin.setEmail("superadmin@example.com");
        superAdmin.setPasswordHash("hashed_superadmin_password");
        superAdmin.setStatus("ACTIVE");

        tenant = new Tenant();
        tenant.setId(UUID.randomUUID());
        tenant.setName("Tenant A");
        tenant.setStatus("ACTIVE");

        appUser = new AppUser();
        appUser.setId(UUID.randomUUID());
        appUser.setTenantId(tenant.getId());
        appUser.setEmail("user@example.com");
        appUser.setPasswordHash("hashed_user_password");
        appUser.setFirstName("John");
        appUser.setLastName("Doe");
        appUser.setRole("GESTIONNAIRE");
        appUser.setStatus("ACTIVE");
    }

    @Test
    void testSuperAdminLogin_Success() throws Exception {
        AuthRequest request = new AuthRequest();
        request.setEmail("superadmin@example.com");
        request.setPassword("password123");

        when(superAdminRepository.findByEmailAndIsDeletedFalse("superadmin@example.com"))
                .thenReturn(Optional.of(superAdmin));
        when(passwordEncoder.matches("password123", "hashed_superadmin_password"))
                .thenReturn(true);
        when(jwtService.generateToken(anyString(), anyString(), any(), anyString(), anyString()))
                .thenReturn("mocked_superadmin_jwt_token");

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("success"))
                .andExpect(jsonPath("$.data.token").value("mocked_superadmin_jwt_token"))
                .andExpect(jsonPath("$.data.role").value("SUPER_ADMIN"));
    }

    @Test
    void testSuperAdminLogin_InvalidPassword() throws Exception {
        AuthRequest request = new AuthRequest();
        request.setEmail("superadmin@example.com");
        request.setPassword("wrongpassword");

        when(superAdminRepository.findByEmailAndIsDeletedFalse("superadmin@example.com"))
                .thenReturn(Optional.of(superAdmin));
        when(passwordEncoder.matches("wrongpassword", "hashed_superadmin_password"))
                .thenReturn(false);

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value("error"))
                .andExpect(jsonPath("$.message").value("Invalid email or password"));
    }

    @Test
    void testTenantUserLogin_Success() throws Exception {
        AuthRequest request = new AuthRequest();
        request.setEmail("user@example.com");
        request.setPassword("userpassword");
        request.setTenantId(tenant.getId().toString());

        when(tenantRepository.findById(tenant.getId())).thenReturn(Optional.of(tenant));
        when(appUserRepository.findByEmailAndIsDeletedFalse("user@example.com")).thenReturn(Optional.of(appUser));
        when(passwordEncoder.matches("userpassword", "hashed_user_password")).thenReturn(true);
        when(jwtService.generateToken(anyString(), anyString(), anyString(), anyString(), anyString()))
                .thenReturn("mocked_user_jwt_token");

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("success"))
                .andExpect(jsonPath("$.data.token").value("mocked_user_jwt_token"))
                .andExpect(jsonPath("$.data.role").value("GESTIONNAIRE"));
    }

    @Test
    void testTenantUserLogin_SuspendedAccount() throws Exception {
        AuthRequest request = new AuthRequest();
        request.setEmail("user@example.com");
        request.setPassword("userpassword");
        request.setTenantId(tenant.getId().toString());

        appUser.setStatus("INACTIVE"); // Suspended user

        when(tenantRepository.findById(tenant.getId())).thenReturn(Optional.of(tenant));
        when(appUserRepository.findByEmailAndIsDeletedFalse("user@example.com")).thenReturn(Optional.of(appUser));

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value("error"))
                .andExpect(jsonPath("$.message").value("Account Suspended"));
    }

    @Test
    void testTenantUserLogin_InactiveTenant() throws Exception {
        AuthRequest request = new AuthRequest();
        request.setEmail("user@example.com");
        request.setPassword("userpassword");
        request.setTenantId(tenant.getId().toString());

        tenant.setStatus("INACTIVE"); // Inactive tenant

        when(tenantRepository.findById(tenant.getId())).thenReturn(Optional.of(tenant));

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value("error"))
                .andExpect(jsonPath("$.message").value("Tenant not found or is inactive"));
    }
}
