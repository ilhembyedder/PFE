package com.leasrecover.config.tenant;

import com.leasrecover.core.tenant.TenantContextHolder;
import com.leasrecover.core.user.UserContextHolder;
import com.leasrecover.modules.tenant.Tenant;
import com.leasrecover.modules.tenant.TenantRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.leasrecover.modules.users.AppUser;
import com.leasrecover.modules.users.AppUserRepository;
import com.leasrecover.modules.superadmin.SuperAdminRepository;

import org.springframework.beans.factory.annotation.Value;
import java.io.IOException;
import java.util.Optional;
import java.util.UUID;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Component
@Order(2) // Run after Authentication/JWT filter but before routing
public class TenantFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(TenantFilter.class);

    private final TenantRepository tenantRepository;
    private final AppUserRepository appUserRepository;
    private final SuperAdminRepository superAdminRepository;
    private final boolean allowHeaderFallback;

    public TenantFilter(
            TenantRepository tenantRepository, 
            AppUserRepository appUserRepository, 
            SuperAdminRepository superAdminRepository,
            @Value("${app.security.allow-header-fallback:true}") boolean allowHeaderFallback) {
        this.tenantRepository = tenantRepository;
        this.appUserRepository = appUserRepository;
        this.superAdminRepository = superAdminRepository;
        this.allowHeaderFallback = allowHeaderFallback;
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

        // Extract tenantId and userEmail from authenticated SecurityContext/JWT claims when present, fallback to headers
        org.springframework.security.core.Authentication authentication = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        String tenantIdStr = null;
        String userEmail = null;

        if (authentication != null && authentication.isAuthenticated() && authentication.getPrincipal() instanceof com.leasrecover.modules.auth.UserPrincipal principal) {
            tenantIdStr = principal.getTenantId();
            userEmail = principal.getEmail();
        }

        if (tenantIdStr == null || tenantIdStr.isEmpty()) {
            if (allowHeaderFallback) {
                tenantIdStr = request.getHeader("X-Tenant-ID");
            }
        }
        if (userEmail == null || userEmail.isEmpty()) {
            if (allowHeaderFallback) {
                userEmail = request.getHeader("X-User-Email");
            }
        }
        
        try {
            if (tenantIdStr != null && !tenantIdStr.isEmpty()) {
                UUID tenantId = UUID.fromString(tenantIdStr);
                
                // Enforce Super Admin isolation check: Super admins cannot access tenant schemas
                if (userEmail != null && !userEmail.isEmpty()) {
                    UserContextHolder.setUserEmail(userEmail);
                    if (superAdminRepository.findByEmailAndIsDeletedFalse(userEmail).isPresent()) {
                        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                        response.setContentType("application/json");
                        response.getWriter().write("{\"status\": \"error\", \"message\": \"Super Admin access to tenant data is barred\"}");
                        return;
                    }
                }

                Optional<Tenant> tenantOpt = tenantRepository.findById(tenantId);
                
                if (tenantOpt.isEmpty()) {
                    response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                    response.setContentType("application/json");
                    response.getWriter().write("{\"status\": \"error\", \"message\": \"Tenant not found\"}");
                    return;
                }
                
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
                TenantContextHolder.setTenantUuid(tenantId);

                // Enforce account status check and user presence if X-User-Email is provided
                if (userEmail != null && !userEmail.isEmpty()) {
                    Optional<AppUser> userOpt = appUserRepository.findByEmailAndIsDeletedFalse(userEmail);
                    if (userOpt.isEmpty()) {
                        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                        response.setContentType("application/json");
                        response.getWriter().write("{\"status\": \"error\", \"message\": \"User not found in tenant\"}");
                        return;
                    }
                    AppUser user = userOpt.get();
                    if ("INACTIVE".equals(user.getStatus())) {
                        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                        response.setContentType("application/json");
                        response.getWriter().write("{\"status\": \"error\", \"message\": \"Account Suspended\"}");
                        return;
                    }
                    if (path.startsWith("/api/v1/admin") && !"ADMIN".equals(user.getRole())) {
                        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                        response.setContentType("application/json");
                        response.getWriter().write("{\"status\": \"error\", \"message\": \"Access denied: Admin role required\"}");
                        return;
                    }
                }
            }
            
            filterChain.doFilter(request, response);
        } catch (IllegalArgumentException e) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            response.setContentType("application/json");
            response.getWriter().write("{\"status\": \"error\", \"message\": \"Invalid Tenant ID format\"}");
        } catch (Exception e) {
            log.error("Unexpected error in TenantFilter", e);
            if (!response.isCommitted()) {
                response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
                response.setContentType("application/json");
                response.getWriter().write("{\"status\": \"error\", \"message\": \"Internal Server Error\"}");
            }
        } finally {
            TenantContextHolder.clear();
            UserContextHolder.clear();
        }
    }
}
