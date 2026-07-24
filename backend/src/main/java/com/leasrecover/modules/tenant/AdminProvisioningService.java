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
    private final TenantConfigRepository tenantConfigRepository;

    public AdminProvisioningService(AppUserRepository appUserRepository, PasswordEncoder passwordEncoder, TenantConfigRepository tenantConfigRepository) {
        this.appUserRepository = appUserRepository;
        this.passwordEncoder = passwordEncoder;
        this.tenantConfigRepository = tenantConfigRepository;
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

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void provisionAdminAndConfig(UUID tenantId, String schemaName, String email, String plainPassword) {
        TenantContextHolder.setTenantId(schemaName);
        try {
            // 1. Provision Admin User
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

            // 2. Provision Default TenantConfig
            TenantConfig config = new TenantConfig();
            config.setTenantId(tenantId);
            config.setDormancyThresholdDays(30);
            config.setAiDeviationModerate(new java.math.BigDecimal("10.00"));
            config.setAiDeviationCritical(new java.math.BigDecimal("20.00"));
            
            java.util.Map<String, Integer> defaultDelays = new java.util.HashMap<>();
            defaultDelays.put("PRE_CONTENTIEUX", 15);
            defaultDelays.put("MISE_EN_DEMEURE", 30);
            defaultDelays.put("SAISIE", 45);
            defaultDelays.put("VENTE", 60);
            config.setPhaseLegalDelays(defaultDelays);

            tenantConfigRepository.save(config);
        } finally {
            TenantContextHolder.clear();
        }
    }
}
