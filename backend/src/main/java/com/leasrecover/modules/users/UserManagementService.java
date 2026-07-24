package com.leasrecover.modules.users;

import com.leasrecover.core.tenant.TenantContextHolder;
import com.leasrecover.modules.users.dto.UserCreateRequest;
import com.leasrecover.modules.users.dto.UserResponse;
import com.leasrecover.modules.users.dto.UserUpdateRequest;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class UserManagementService {

    private final AppUserRepository appUserRepository;
    private final PasswordEncoder passwordEncoder;

    public UserManagementService(AppUserRepository appUserRepository, PasswordEncoder passwordEncoder) {
        this.appUserRepository = appUserRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public UserResponse createUser(UserCreateRequest request) {
        UUID tenantId = TenantContextHolder.getTenantUuid();
        if (tenantId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No active tenant context found");
        }

        // Check if user with email already exists in this tenant schema
        if (appUserRepository.findByEmailAndIsDeletedFalse(request.getEmail()).isPresent()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email already in use");
        }

        AppUser user = new AppUser();
        user.setId(UUID.randomUUID());
        user.setTenantId(tenantId);
        user.setEmail(request.getEmail());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setRole(request.getRole());
        user.setStatus("ACTIVE");

        AppUser savedUser = appUserRepository.save(user);
        return UserResponse.fromUser(savedUser);
    }

    @Transactional(readOnly = true)
    public List<UserResponse> getAllUsers() {
        UUID tenantId = TenantContextHolder.getTenantUuid();
        if (tenantId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No active tenant context found");
        }
        return appUserRepository.findAllByIsDeletedFalse().stream()
                .map(UserResponse::fromUser)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public UserResponse getUserById(UUID id) {
        AppUser user = appUserRepository.findById(id)
                .filter(u -> !u.getIsDeleted())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        UUID tenantId = TenantContextHolder.getTenantUuid();
        if (tenantId == null || !tenantId.equals(user.getTenantId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Unauthorized tenant access");
        }

        return UserResponse.fromUser(user);
    }

    @Transactional
    public UserResponse updateUser(UUID id, UserUpdateRequest request) {
        AppUser user = appUserRepository.findById(id)
                .filter(u -> !u.getIsDeleted())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        UUID tenantId = TenantContextHolder.getTenantUuid();
        if (tenantId == null || !tenantId.equals(user.getTenantId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Unauthorized tenant access");
        }

        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setRole(request.getRole());
        user.setStatus(request.getStatus());

        AppUser updatedUser = appUserRepository.save(user);
        return UserResponse.fromUser(updatedUser);
    }

    @Transactional
    public void deactivateUser(UUID id) {
        AppUser user = appUserRepository.findById(id)
                .filter(u -> !u.getIsDeleted())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        UUID tenantId = TenantContextHolder.getTenantUuid();
        if (tenantId == null || !tenantId.equals(user.getTenantId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Unauthorized tenant access");
        }

        user.setStatus("INACTIVE");
        appUserRepository.save(user);
    }
}
