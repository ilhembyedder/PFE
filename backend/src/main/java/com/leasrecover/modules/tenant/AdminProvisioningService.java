package com.leasrecover.modules.tenant;

import com.leasrecover.core.tenant.TenantContextHolder;
import com.leasrecover.modules.users.AppUser;
import com.leasrecover.modules.users.AppUserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
public class AdminProvisioningService {

    private final AppUserRepository appUserRepository;
    private final PasswordEncoder passwordEncoder;

    public AdminProvisioningService(AppUserRepository appUserRepository, PasswordEncoder passwordEncoder) {
        this.appUserRepository = appUserRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void provisionAdmin(UUID tenantId, String schemaName, String email, String plainPassword) {
        // Run explicitly in the context of the newly provisioned schema
        TenantContextHolder.setTenantId(schemaName);
        try {
            AppUser admin = new AppUser();
            admin.setId(UUID.randomUUID());
            admin.setTenantId(tenantId);
            admin.setEmail(email);
            admin.setPasswordHash(passwordEncoder.encode(plainPassword));
            admin.setFirstName("Admin");
            admin.setLastName("Tenant");
            admin.setRole("ADMIN");
            admin.setStatus("ACTIVE");

            appUserRepository.save(admin);
        } finally {
            TenantContextHolder.clear();
        }
    }
}
