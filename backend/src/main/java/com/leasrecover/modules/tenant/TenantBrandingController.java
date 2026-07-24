package com.leasrecover.modules.tenant;

import com.leasrecover._common.dto.JSendResponse;
import com.leasrecover.core.tenant.TenantContextHolder;
import com.leasrecover.modules.tenant.dto.TenantBrandingRequest;
import com.leasrecover.modules.tenant.dto.TenantResponse;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/tenant")
public class TenantBrandingController {

    private final TenantRepository tenantRepository;

    public TenantBrandingController(TenantRepository tenantRepository) {
        this.tenantRepository = tenantRepository;
    }

    @GetMapping
    public ResponseEntity<JSendResponse<TenantResponse>> getTenant() {
        UUID tenantUuid = TenantContextHolder.getTenantUuid();
        if (tenantUuid == null) {
            return ResponseEntity.badRequest().body(JSendResponse.fail(null));
        }

        return tenantRepository.findById(tenantUuid)
                .map(tenant -> {
                    TenantResponse response = new TenantResponse(
                            tenant.getId(),
                            tenant.getName(),
                            tenant.getLogoUrl(),
                            tenant.getStatus()
                    );
                    return ResponseEntity.ok(JSendResponse.success(response));
                })
                .orElseGet(() -> ResponseEntity.status(404).body(JSendResponse.fail(null)));
    }

    @PutMapping("/branding")
    public ResponseEntity<JSendResponse<TenantResponse>> updateBranding(
            @Valid @RequestBody TenantBrandingRequest request) {
        UUID tenantUuid = TenantContextHolder.getTenantUuid();
        if (tenantUuid == null) {
            return ResponseEntity.badRequest().body(JSendResponse.fail(null));
        }

        return tenantRepository.findById(tenantUuid)
                .map(tenant -> {
                    tenant.setName(request.getName());
                    tenant.setLogoUrl(request.getLogoUrl());
                    Tenant savedTenant = tenantRepository.save(tenant);

                    TenantResponse response = new TenantResponse(
                            savedTenant.getId(),
                            savedTenant.getName(),
                            savedTenant.getLogoUrl(),
                            savedTenant.getStatus()
                    );
                    return ResponseEntity.ok(JSendResponse.success(response));
                })
                .orElseGet(() -> ResponseEntity.status(404).body(JSendResponse.fail(null)));
    }
}
