package com.leasrecover.modules.tenant;

import org.flywaydb.core.Flyway;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.sql.DataSource;
import java.util.UUID;

@Service
public class TenantProvisioningService {

    private final TenantRepository tenantRepository;
    private final DataSource dataSource;
    private final AdminProvisioningService adminProvisioningService;

    public TenantProvisioningService(TenantRepository tenantRepository, DataSource dataSource, AdminProvisioningService adminProvisioningService) {
        this.tenantRepository = tenantRepository;
        this.dataSource = dataSource;
        this.adminProvisioningService = adminProvisioningService;
    }

    @Transactional
    public Tenant provisionTenant(String name, String logoUrl, Integer dataRetentionMonths, String adminEmail, String adminPassword) {
        // 1. Create the tenant record in the public schema
        Tenant tenant = new Tenant();
        tenant.setId(UUID.randomUUID());
        tenant.setName(name);
        tenant.setLogoUrl(logoUrl);
        tenant.setDataRetentionMonths(dataRetentionMonths);
        tenant.setStatus("ACTIVE");

        tenant = tenantRepository.save(tenant);

        // 2. Extract safe schema name from ID
        String schemaName = "tenant_" + tenant.getId().toString().replace("-", "");

        // 3. Provision the schema via Flyway
        Flyway flyway = Flyway.configure()
                .dataSource(dataSource)
                .schemas(schemaName)
                .locations("classpath:db/migration/tenant")
                .load();

        flyway.migrate();

        // 4. Create initial Admin user and default config in the new schema
        com.leasrecover.core.tenant.TenantContextHolder.setTenantId(schemaName);
        try {
            adminProvisioningService.provisionAdminAndConfig(tenant.getId(), schemaName, adminEmail, adminPassword);
        } finally {
            com.leasrecover.core.tenant.TenantContextHolder.clear();
        }

        return tenant;
    }

    @Transactional
    public void deactivateTenant(UUID tenantId) {
        if (!tenantRepository.existsById(tenantId)) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.NOT_FOUND, "Tenant not found");
        }
        tenantRepository.updateTenantStatus(tenantId, "INACTIVE", java.time.ZonedDateTime.now());
    }

    @Transactional
    public void activateTenant(UUID tenantId) {
        if (!tenantRepository.existsById(tenantId)) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.NOT_FOUND, "Tenant not found");
        }
        tenantRepository.updateTenantStatus(tenantId, "ACTIVE", java.time.ZonedDateTime.now());
    }

    @Transactional(readOnly = true)
    public java.util.List<Tenant> getAllTenants() {
        return tenantRepository.findAll();
    }
}
