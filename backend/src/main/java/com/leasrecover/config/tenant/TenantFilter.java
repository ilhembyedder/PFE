package com.leasrecover.config.tenant;

import com.leasrecover.core.tenant.TenantContextHolder;
import com.leasrecover.modules.tenant.Tenant;
import com.leasrecover.modules.tenant.TenantRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Optional;
import java.util.UUID;

@Component
@Order(2) // Run after Authentication/JWT filter but before routing
public class TenantFilter extends OncePerRequestFilter {

    private final TenantRepository tenantRepository;

    public TenantFilter(TenantRepository tenantRepository) {
        this.tenantRepository = tenantRepository;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        
        String path = request.getRequestURI();
        
        // Super Admin paths must be explicitly barred from entering tenant schemas
        if (path.startsWith("/api/v1/super-admin")) {
            TenantContextHolder.setTenantId("public");
            try {
                filterChain.doFilter(request, response);
                return;
            } finally {
                TenantContextHolder.clear();
            }
        }

        // In a real scenario, extract tenantId from JWT Authentication
        String tenantIdStr = request.getHeader("X-Tenant-ID");
        
        if (tenantIdStr != null && !tenantIdStr.isEmpty()) {
            try {
                UUID tenantId = UUID.fromString(tenantIdStr);
                Optional<Tenant> tenantOpt = tenantRepository.findById(tenantId);
                
                if (tenantOpt.isPresent()) {
                    Tenant tenant = tenantOpt.get();
                    if (!"ACTIVE".equals(tenant.getStatus())) {
                        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                        response.setContentType("application/json");
                        response.getWriter().write("{\"status\": \"error\", \"message\": \"Tenant is inactive\"}");
                        return;
                    }
                    // Extract safe schema name from ID
                    String schemaName = "tenant_" + tenant.getId().toString().replace("-", "");
                    TenantContextHolder.setTenantId(schemaName);
                }
            } catch (Exception e) {
                // Ignore invalid UUID or other errors, let normal auth fail if needed
            }
        }
        
        try {
            filterChain.doFilter(request, response);
        } finally {
            TenantContextHolder.clear();
        }
    }
}
