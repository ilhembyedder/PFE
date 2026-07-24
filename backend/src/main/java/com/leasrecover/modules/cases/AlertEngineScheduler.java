package com.leasrecover.modules.cases;

import com.leasrecover.core.tenant.TenantContextHolder;
import com.leasrecover.modules.tenant.Tenant;
import com.leasrecover.modules.tenant.TenantRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@EnableScheduling
public class AlertEngineScheduler {

    private static final Logger log = LoggerFactory.getLogger(AlertEngineScheduler.class);

    private final TenantRepository tenantRepository;
    private final AlertEngineService alertEngineService;

    public AlertEngineScheduler(TenantRepository tenantRepository, AlertEngineService alertEngineService) {
        this.tenantRepository = tenantRepository;
        this.alertEngineService = alertEngineService;
    }

    @Scheduled(cron = "${app.alerts.cron:0 0 2 * * *}")
    public void processAlerts() {
        log.info("Starting background alert engine scanning...");
        List<Tenant> tenants = tenantRepository.findAll();

        for (Tenant tenant : tenants) {
            if (tenant.getIsDeleted() != null && tenant.getIsDeleted()) {
                continue;
            }
            if (!"ACTIVE".equalsIgnoreCase(tenant.getStatus())) {
                continue;
            }

            String schemaName = "tenant_" + tenant.getId().toString().replace("-", "");
            log.info("Processing alerts for tenant: {} (schema: {})", tenant.getName(), schemaName);

            // Bind context to each tenant's schema dynamically
            TenantContextHolder.setTenantId(schemaName);
            TenantContextHolder.setTenantUuid(tenant.getId());

            try {
                alertEngineService.processAlertsForTenant(tenant.getId());
            } catch (Exception e) {
                log.error("Failed to process alerts for tenant {} (schema: {}): {}", 
                        tenant.getName(), schemaName, e.getMessage(), e);
            } finally {
                TenantContextHolder.clear();
            }
        }
        log.info("Background alert engine scanning completed.");
    }
}
