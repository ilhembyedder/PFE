package com.leasrecover.modules.superadmin;

import com.leasrecover._common.dto.JSendResponse;
import com.leasrecover.modules.tenant.Tenant;
import com.leasrecover.modules.tenant.TenantProvisioningService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/super-admin/tenants")
public class SuperAdminTenantController {

    private final TenantProvisioningService tenantProvisioningService;

    public SuperAdminTenantController(TenantProvisioningService tenantProvisioningService) {
        this.tenantProvisioningService = tenantProvisioningService;
    }

    @PostMapping
    public ResponseEntity<JSendResponse<Tenant>> provisionTenant(@RequestBody @Valid TenantCreateRequest request) {
        Tenant tenant = tenantProvisioningService.provisionTenant(
                request.getName(),
                request.getLogoUrl(),
                request.getDataRetentionMonths(),
                request.getAdminEmail(),
                request.getAdminPassword()
        );
        return ResponseEntity.ok(JSendResponse.success(tenant));
    }

    @PutMapping("/{id}/deactivate")
    public ResponseEntity<JSendResponse<Void>> deactivateTenant(@PathVariable UUID id) {
        tenantProvisioningService.deactivateTenant(id);
        return ResponseEntity.ok(JSendResponse.success(null));
    }
}
