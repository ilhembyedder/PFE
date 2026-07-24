package com.leasrecover.modules.auth;

import com.leasrecover._common.dto.JSendResponse;
import com.leasrecover.core.tenant.TenantContextHolder;
import com.leasrecover.modules.auth.dto.AuthRequest;
import com.leasrecover.modules.auth.dto.JwtResponse;
import com.leasrecover.modules.superadmin.SuperAdmin;
import com.leasrecover.modules.superadmin.SuperAdminRepository;
import com.leasrecover.modules.tenant.Tenant;
import com.leasrecover.modules.tenant.TenantRepository;
import com.leasrecover.modules.users.AppUser;
import com.leasrecover.modules.users.AppUserRepository;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;
    private final TenantRepository tenantRepository;
    private final AppUserRepository appUserRepository;
    private final SuperAdminRepository superAdminRepository;

    public AuthController(
            JwtService jwtService,
            PasswordEncoder passwordEncoder,
            TenantRepository tenantRepository,
            AppUserRepository appUserRepository,
            SuperAdminRepository superAdminRepository) {
        this.jwtService = jwtService;
        this.passwordEncoder = passwordEncoder;
        this.tenantRepository = tenantRepository;
        this.appUserRepository = appUserRepository;
        this.superAdminRepository = superAdminRepository;
    }

    @PostMapping("/login")
    public ResponseEntity<JSendResponse<JwtResponse>> login(@RequestBody @Valid AuthRequest request) {
        String email = request.getEmail();
        String password = request.getPassword();
        String tenantIdStr = request.getTenantId();

        if (tenantIdStr == null || tenantIdStr.trim().isEmpty()) {
            // No tenantId provided => authenticate as Super Admin
            TenantContextHolder.setTenantId("public");
            try {
                Optional<SuperAdmin> superAdminOpt = superAdminRepository.findByEmailAndIsDeletedFalse(email);
                if (superAdminOpt.isPresent()) {
                    SuperAdmin superAdmin = superAdminOpt.get();
                    if (!"ACTIVE".equals(superAdmin.getStatus())) {
                        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                                .body(new JSendResponse<>("error", null, "Super Admin account is deactivated"));
                    }
                    if (passwordEncoder.matches(password, superAdmin.getPasswordHash())) {
                        String token = jwtService.generateToken(
                                superAdmin.getId().toString(),
                                superAdmin.getEmail(),
                                null,
                                "SUPER_ADMIN",
                                "Super Admin"
                        );
                        JwtResponse jwtResponse = new JwtResponse(
                                token,
                                superAdmin.getId().toString(),
                                superAdmin.getEmail(),
                                null,
                                "SUPER_ADMIN",
                                "Super Admin"
                        );
                        return ResponseEntity.ok(JSendResponse.success(jwtResponse));
                    }
                }
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(new JSendResponse<>("error", null, "Invalid email or password"));
            } finally {
                TenantContextHolder.clear();
            }
        } else {
            // Tenant user authentication
            UUID tenantUuid;
            try {
                tenantUuid = UUID.fromString(tenantIdStr);
            } catch (IllegalArgumentException e) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(new JSendResponse<>("error", null, "Invalid Tenant ID format"));
            }

            Optional<Tenant> tenantOpt = tenantRepository.findById(tenantUuid);
            if (tenantOpt.isEmpty() || !"ACTIVE".equals(tenantOpt.get().getStatus())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(new JSendResponse<>("error", null, "Tenant not found or is inactive"));
            }

            // Route dynamically to the tenant's schema
            String schemaName = "tenant_" + tenantUuid.toString().replace("-", "");
            TenantContextHolder.setTenantId(schemaName);
            TenantContextHolder.setTenantUuid(tenantUuid);
            try {
                Optional<AppUser> userOpt = appUserRepository.findByEmailAndIsDeletedFalse(email);
                if (userOpt.isPresent()) {
                    AppUser user = userOpt.get();
                    if (!"ACTIVE".equals(user.getStatus())) {
                        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                                .body(new JSendResponse<>("error", null, "Account Suspended"));
                    }
                    if (passwordEncoder.matches(password, user.getPasswordHash())) {
                        String fullName = user.getFirstName() + " " + user.getLastName();
                        String token = jwtService.generateToken(
                                user.getId().toString(),
                                user.getEmail(),
                                tenantUuid.toString(),
                                user.getRole(),
                                fullName
                        );
                        JwtResponse jwtResponse = new JwtResponse(
                                token,
                                user.getId().toString(),
                                user.getEmail(),
                                tenantUuid.toString(),
                                user.getRole(),
                                fullName
                        );
                        return ResponseEntity.ok(JSendResponse.success(jwtResponse));
                    }
                }
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(new JSendResponse<>("error", null, "Invalid email or password"));
            } finally {
                TenantContextHolder.clear();
            }
        }
    }
}
