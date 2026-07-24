package com.leasrecover.modules.users;

import com.leasrecover.core.tenant.TenantContextHolder;
import com.leasrecover.modules.users.dto.UserCreateRequest;
import com.leasrecover.modules.users.dto.UserResponse;
import com.leasrecover.modules.users.dto.UserUpdateRequest;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.server.ResponseStatusException;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class UserManagementServiceTest {

    @Mock
    private AppUserRepository appUserRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private UserManagementService userManagementService;

    private UUID tenantId;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        tenantId = UUID.randomUUID();
        TenantContextHolder.setTenantUuid(tenantId);
        TenantContextHolder.setTenantId("tenant_" + tenantId.toString().replace("-", ""));
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    @Test
    void testCreateUser_Success() {
        UserCreateRequest request = new UserCreateRequest();
        request.setEmail("test@example.com");
        request.setPassword("password123");
        request.setFirstName("John");
        request.setLastName("Doe");
        request.setRole("GESTIONNAIRE");

        when(appUserRepository.findByEmailAndIsDeletedFalse(request.getEmail())).thenReturn(Optional.empty());
        when(passwordEncoder.encode(request.getPassword())).thenReturn("hashedPassword");
        
        AppUser savedUser = new AppUser();
        savedUser.setId(UUID.randomUUID());
        savedUser.setTenantId(tenantId);
        savedUser.setEmail(request.getEmail());
        savedUser.setPasswordHash("hashedPassword");
        savedUser.setFirstName(request.getFirstName());
        savedUser.setLastName(request.getLastName());
        savedUser.setRole(request.getRole());
        savedUser.setStatus("ACTIVE");

        when(appUserRepository.save(any(AppUser.class))).thenReturn(savedUser);

        UserResponse response = userManagementService.createUser(request);

        assertNotNull(response);
        assertEquals(request.getEmail(), response.getEmail());
        assertEquals("ACTIVE", response.getStatus());
        assertEquals(tenantId, response.getTenantId());
        verify(passwordEncoder).encode("password123");
        verify(appUserRepository).save(any(AppUser.class));
    }

    @Test
    void testCreateUser_EmailAlreadyExists() {
        UserCreateRequest request = new UserCreateRequest();
        request.setEmail("test@example.com");

        when(appUserRepository.findByEmailAndIsDeletedFalse(request.getEmail())).thenReturn(Optional.of(new AppUser()));

        assertThrows(ResponseStatusException.class, () -> userManagementService.createUser(request));
        verify(appUserRepository, never()).save(any(AppUser.class));
    }

    @Test
    void testGetAllUsers() {
        AppUser user1 = new AppUser();
        user1.setEmail("u1@example.com");
        user1.setIsDeleted(false);

        AppUser user2 = new AppUser();
        user2.setEmail("u2@example.com");
        user2.setIsDeleted(false);

        when(appUserRepository.findAllByIsDeletedFalse()).thenReturn(Arrays.asList(user1, user2));

        List<UserResponse> users = userManagementService.getAllUsers();

        assertEquals(2, users.size());
        assertEquals("u1@example.com", users.get(0).getEmail());
        assertEquals("u2@example.com", users.get(1).getEmail());
    }

    @Test
    void testGetUserById_Success() {
        UUID userId = UUID.randomUUID();
        AppUser user = new AppUser();
        user.setId(userId);
        user.setTenantId(tenantId);
        user.setEmail("test@example.com");
        user.setIsDeleted(false);

        when(appUserRepository.findById(userId)).thenReturn(Optional.of(user));

        UserResponse response = userManagementService.getUserById(userId);

        assertNotNull(response);
        assertEquals(userId, response.getId());
        assertEquals(tenantId, response.getTenantId());
    }

    @Test
    void testGetUserById_Forbidden_DifferentTenant() {
        UUID userId = UUID.randomUUID();
        AppUser user = new AppUser();
        user.setId(userId);
        user.setTenantId(UUID.randomUUID()); // different tenant
        user.setIsDeleted(false);

        when(appUserRepository.findById(userId)).thenReturn(Optional.of(user));

        assertThrows(ResponseStatusException.class, () -> userManagementService.getUserById(userId));
    }

    @Test
    void testGetUserById_NotFound() {
        UUID userId = UUID.randomUUID();
        when(appUserRepository.findById(userId)).thenReturn(Optional.empty());

        assertThrows(ResponseStatusException.class, () -> userManagementService.getUserById(userId));
    }

    @Test
    void testUpdateUser_Success() {
        UUID userId = UUID.randomUUID();
        AppUser user = new AppUser();
        user.setId(userId);
        user.setTenantId(tenantId);
        user.setFirstName("OldName");
        user.setLastName("OldLast");
        user.setRole("GESTIONNAIRE");
        user.setStatus("ACTIVE");
        user.setIsDeleted(false);

        UserUpdateRequest request = new UserUpdateRequest();
        request.setFirstName("NewName");
        request.setLastName("NewLast");
        request.setRole("ADMIN");
        request.setStatus("INACTIVE");

        when(appUserRepository.findById(userId)).thenReturn(Optional.of(user));
        when(appUserRepository.save(any(AppUser.class))).thenReturn(user);

        UserResponse response = userManagementService.updateUser(userId, request);

        assertNotNull(response);
        assertEquals("NewName", response.getFirstName());
        assertEquals("NewLast", response.getLastName());
        assertEquals("ADMIN", response.getRole());
        assertEquals("INACTIVE", response.getStatus());
    }

    @Test
    void testDeactivateUser_Success() {
        UUID userId = UUID.randomUUID();
        AppUser user = new AppUser();
        user.setId(userId);
        user.setTenantId(tenantId);
        user.setStatus("ACTIVE");
        user.setIsDeleted(false);

        when(appUserRepository.findById(userId)).thenReturn(Optional.of(user));
        when(appUserRepository.save(any(AppUser.class))).thenReturn(user);

        userManagementService.deactivateUser(userId);

        assertEquals("INACTIVE", user.getStatus());
        verify(appUserRepository).save(user);
    }
}
