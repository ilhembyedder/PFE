package com.leasrecover.config.tenant;

import com.leasrecover.core.tenant.TenantContextHolder;
import org.hibernate.context.spi.CurrentTenantIdentifierResolver;
import org.springframework.stereotype.Component;

@Component
public class TenantIdentifierResolver implements CurrentTenantIdentifierResolver<String> {

    @Override
    public String resolveCurrentTenantIdentifier() {
        String tenantId = TenantContextHolder.getTenantId();
        String result = tenantId != null ? tenantId : "public";
        System.out.println("[TenantIdentifierResolver] resolveCurrentTenantIdentifier returns: " + result);
        return result;
    }

    @Override
    public boolean validateExistingCurrentSessions() {
        return true;
    }
}
