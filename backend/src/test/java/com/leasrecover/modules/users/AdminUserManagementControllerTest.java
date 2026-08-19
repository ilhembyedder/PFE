package com.leasrecover.modules.users;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.leasrecover.modules.users.dto.UserCreateRequest;
import com.leasrecover.modules.users.dto.UserResponse;
import com.leasrecover.modules.users.dto.UserUpdateRequest;
import com.leasrecover.modules.tenant.TenantRepository;
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

import java.util.Collections;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AdminUserManagementController.class)
@Import({com.leasrecover.config.SecurityConfig.class, com.leasrecover.modules.auth.JwtAuthenticationFilter.class})
@org.springframework.security.test.context.support.WithMockUser(roles = "ADMIN")
class AdminUserManagementControllerTest {

    @MockitoBean
    private com.leasrecover.modules.auth.JwtService jwtService;

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private UserManagementService userManagementService;

    @MockitoBean
    private TenantRepository tenantRepository;

    @MockitoBean
    private AppUserRepository appUserRepository;

    @MockitoBean
    private SuperAdminRepository superAdminRepository;

    @Autowired
    private ObjectMapper objectMapper;

    private UserResponse userResponse;

    @BeforeEach
    void setUp() {
        userResponse = new UserResponse();
        userResponse.setId(UUID.randomUUID());
        userResponse.setTenantId(UUID.randomUUID());
        userResponse.setEmail("test@example.com");
        userResponse.setFirstName("John");
        userResponse.setLastName("Doe");
        userResponse.setRole("GESTIONNAIRE");
        userResponse.setStatus("ACTIVE");
    }

    @Test
    void testCreateUser_Success() throws Exception {
        UserCreateRequest request = new UserCreateRequest();
        request.setEmail("test@example.com");
        request.setPassword("password123");
        request.setFirstName("John");
        request.setLastName("Doe");
        request.setRole("GESTIONNAIRE");

        when(userManagementService.createUser(any(UserCreateRequest.class))).thenReturn(userResponse);

        mockMvc.perform(post("/api/v1/admin/users")
                        .with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user("admin").roles("ADMIN"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("success"))
                .andExpect(jsonPath("$.data.email").value("test@example.com"))
                .andExpect(jsonPath("$.data.role").value("GESTIONNAIRE"));
    }

    @Test
    void testCreateUser_ValidationFailure() throws Exception {
        UserCreateRequest request = new UserCreateRequest(); // invalid blank fields

        mockMvc.perform(post("/api/v1/admin/users")
                        .with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user("admin").roles("ADMIN"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value("fail"))
                .andExpect(jsonPath("$.data.email").exists());
    }

    @Test
    void testGetAllUsers() throws Exception {
        when(userManagementService.getAllUsers()).thenReturn(Collections.singletonList(userResponse));

        mockMvc.perform(get("/api/v1/admin/users")
                        .with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user("admin").roles("ADMIN")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("success"))
                .andExpect(jsonPath("$.data[0].email").value("test@example.com"));
    }

    @Test
    void testGetUserById() throws Exception {
        UUID id = UUID.randomUUID();
        when(userManagementService.getUserById(id)).thenReturn(userResponse);

        mockMvc.perform(get("/api/v1/admin/users/{id}", id)
                        .with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user("admin").roles("ADMIN")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("success"))
                .andExpect(jsonPath("$.data.email").value("test@example.com"));
    }

    @Test
    void testUpdateUser() throws Exception {
        UUID id = UUID.randomUUID();
        UserUpdateRequest request = new UserUpdateRequest();
        request.setFirstName("Jane");
        request.setLastName("Doe");
        request.setRole("ADMIN");
        request.setStatus("ACTIVE");

        userResponse.setFirstName("Jane");
        userResponse.setRole("ADMIN");
        when(userManagementService.updateUser(eq(id), any(UserUpdateRequest.class))).thenReturn(userResponse);

        mockMvc.perform(put("/api/v1/admin/users/{id}", id)
                        .with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user("admin").roles("ADMIN"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("success"))
                .andExpect(jsonPath("$.data.firstName").value("Jane"))
                .andExpect(jsonPath("$.data.role").value("ADMIN"));
    }

    @Test
    void testDeactivateUser() throws Exception {
        UUID id = UUID.randomUUID();

        mockMvc.perform(put("/api/v1/admin/users/{id}/deactivate", id)
                        .with(org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user("admin").roles("ADMIN")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("success"));

        verify(userManagementService).deactivateUser(id);
    }
}
