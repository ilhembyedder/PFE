package com.leasrecover.config.tenant;

import com.leasrecover.core.user.UserContextHolder;
import com.leasrecover.modules.tenant.Tenant;
import com.leasrecover.modules.tenant.TenantRepository;
import com.leasrecover.modules.users.AppUser;
import com.leasrecover.modules.users.AppUserRepository;
import com.leasrecover.modules.superadmin.SuperAdmin;
import com.leasrecover.modules.superadmin.SuperAdminRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.io.IOException;
import java.io.PrintWriter;
import java.io.StringWriter;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class TenantFilterTest {

    @Mock
    private TenantRepository tenantRepository;

    @Mock
    private AppUserRepository appUserRepository;

    @Mock
    private SuperAdminRepository superAdminRepository;

    @Mock
    private HttpServletRequest request;

    @Mock
    private HttpServletResponse response;

    @Mock
    private FilterChain filterChain;

    private TenantFilter tenantFilter;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        tenantFilter = new TenantFilter(tenantRepository, appUserRepository, superAdminRepository, true);
    }

    @Test
    void testSuperAdminRoute_ForcesPublicSchema() throws ServletException, IOException {
        when(request.getRequestURI()).thenReturn("/api/v1/super-admin/tenants");

        tenantFilter.doFilterInternal(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
        verify(request, never()).getHeader("X-Tenant-ID");
    }

    @Test
    void testTenantRoute_InactiveTenantReturnsForbidden() throws ServletException, IOException {
        UUID tenantId = UUID.randomUUID();
        when(request.getRequestURI()).thenReturn("/api/v1/cases");
        when(request.getHeader("X-Tenant-ID")).thenReturn(tenantId.toString());

        Tenant tenant = new Tenant();
        tenant.setId(tenantId);
        tenant.setStatus("INACTIVE"); // Inactive tenant

        when(tenantRepository.findById(tenantId)).thenReturn(Optional.of(tenant));

        StringWriter sw = new StringWriter();
        PrintWriter pw = new PrintWriter(sw);
        when(response.getWriter()).thenReturn(pw);

        tenantFilter.doFilterInternal(request, response, filterChain);

        verify(response).setStatus(HttpServletResponse.SC_FORBIDDEN);
        verify(filterChain, never()).doFilter(request, response);
    }

    @Test
    void testTenantRoute_InactiveUserReturnsForbidden() throws ServletException, IOException {
        UUID tenantId = UUID.randomUUID();
        when(request.getRequestURI()).thenReturn("/api/v1/cases");
        when(request.getHeader("X-Tenant-ID")).thenReturn(tenantId.toString());
        when(request.getHeader("X-User-Email")).thenReturn("inactive@example.com");

        Tenant tenant = new Tenant();
        tenant.setId(tenantId);
        tenant.setStatus("ACTIVE");
        when(tenantRepository.findById(tenantId)).thenReturn(Optional.of(tenant));

        AppUser user = new AppUser();
        user.setEmail("inactive@example.com");
        user.setStatus("INACTIVE");
        when(appUserRepository.findByEmailAndIsDeletedFalse("inactive@example.com")).thenReturn(Optional.of(user));

        StringWriter sw = new StringWriter();
        PrintWriter pw = new PrintWriter(sw);
        when(response.getWriter()).thenReturn(pw);

        tenantFilter.doFilterInternal(request, response, filterChain);

        verify(response).setStatus(HttpServletResponse.SC_FORBIDDEN);
        verify(filterChain, never()).doFilter(request, response);
    }

    @Test
    void testTenantRoute_SuperAdminIsForbidden() throws ServletException, IOException {
        UUID tenantId = UUID.randomUUID();
        when(request.getRequestURI()).thenReturn("/api/v1/cases");
        when(request.getHeader("X-Tenant-ID")).thenReturn(tenantId.toString());
        when(request.getHeader("X-User-Email")).thenReturn("superadmin@example.com");

        SuperAdmin superAdmin = new SuperAdmin();
        superAdmin.setEmail("superadmin@example.com");
        when(superAdminRepository.findByEmailAndIsDeletedFalse("superadmin@example.com"))
                .thenReturn(Optional.of(superAdmin));

        StringWriter sw = new StringWriter();
        PrintWriter pw = new PrintWriter(sw);
        when(response.getWriter()).thenReturn(pw);

        tenantFilter.doFilterInternal(request, response, filterChain);

        verify(response).setStatus(HttpServletResponse.SC_FORBIDDEN);
        verify(filterChain, never()).doFilter(request, response);
    }

    @Test
    void testTenantRoute_TenantNotFoundIsForbidden() throws ServletException, IOException {
        UUID tenantId = UUID.randomUUID();
        when(request.getRequestURI()).thenReturn("/api/v1/cases");
        when(request.getHeader("X-Tenant-ID")).thenReturn(tenantId.toString());

        when(tenantRepository.findById(tenantId)).thenReturn(Optional.empty());

        StringWriter sw = new StringWriter();
        PrintWriter pw = new PrintWriter(sw);
        when(response.getWriter()).thenReturn(pw);

        tenantFilter.doFilterInternal(request, response, filterChain);

        verify(response).setStatus(HttpServletResponse.SC_FORBIDDEN);
        verify(filterChain, never()).doFilter(request, response);
    }

    @Test
    void testTenantRoute_UserNotFoundIsForbidden() throws ServletException, IOException {
        UUID tenantId = UUID.randomUUID();
        when(request.getRequestURI()).thenReturn("/api/v1/cases");
        when(request.getHeader("X-Tenant-ID")).thenReturn(tenantId.toString());
        when(request.getHeader("X-User-Email")).thenReturn("nonexistent@example.com");

        Tenant tenant = new Tenant();
        tenant.setId(tenantId);
        tenant.setStatus("ACTIVE");
        when(tenantRepository.findById(tenantId)).thenReturn(Optional.of(tenant));
        when(appUserRepository.findByEmailAndIsDeletedFalse("nonexistent@example.com")).thenReturn(Optional.empty());

        StringWriter sw = new StringWriter();
        PrintWriter pw = new PrintWriter(sw);
        when(response.getWriter()).thenReturn(pw);

        tenantFilter.doFilterInternal(request, response, filterChain);

        verify(response).setStatus(HttpServletResponse.SC_FORBIDDEN);
        verify(filterChain, never()).doFilter(request, response);
    }

    @Test
    void testTenantRoute_AdminPathWithNonAdminUserIsForbidden() throws ServletException, IOException {
        UUID tenantId = UUID.randomUUID();
        when(request.getRequestURI()).thenReturn("/api/v1/admin/users");
        when(request.getHeader("X-Tenant-ID")).thenReturn(tenantId.toString());
        when(request.getHeader("X-User-Email")).thenReturn("user@example.com");

        Tenant tenant = new Tenant();
        tenant.setId(tenantId);
        tenant.setStatus("ACTIVE");
        when(tenantRepository.findById(tenantId)).thenReturn(Optional.of(tenant));

        AppUser user = new AppUser();
        user.setEmail("user@example.com");
        user.setStatus("ACTIVE");
        user.setRole("GESTIONNAIRE"); // Non-admin role
        when(appUserRepository.findByEmailAndIsDeletedFalse("user@example.com")).thenReturn(Optional.of(user));

        StringWriter sw = new StringWriter();
        PrintWriter pw = new PrintWriter(sw);
        when(response.getWriter()).thenReturn(pw);

        tenantFilter.doFilterInternal(request, response, filterChain);

        verify(response).setStatus(HttpServletResponse.SC_FORBIDDEN);
        verify(filterChain, never()).doFilter(request, response);
    }

    @Test
    void testTenantRoute_UserContextHolder_IsCleared_AfterFilterCompletes() throws ServletException, IOException {
        UUID tenantId = UUID.randomUUID();
        when(request.getRequestURI()).thenReturn("/api/v1/cases");
        when(request.getHeader("X-Tenant-ID")).thenReturn(tenantId.toString());
        when(request.getHeader("X-User-Email")).thenReturn("gestionnaire@example.com");

        Tenant tenant = new Tenant();
        tenant.setId(tenantId);
        tenant.setStatus("ACTIVE");
        when(tenantRepository.findById(tenantId)).thenReturn(Optional.of(tenant));

        AppUser user = new AppUser();
        user.setEmail("gestionnaire@example.com");
        user.setStatus("ACTIVE");
        user.setRole("GESTIONNAIRE");
        when(appUserRepository.findByEmailAndIsDeletedFalse("gestionnaire@example.com")).thenReturn(Optional.of(user));

        tenantFilter.doFilterInternal(request, response, filterChain);

        // After filter completes, UserContextHolder must be cleared to prevent thread pool pollution
        assertNull(UserContextHolder.getUserEmail());
    }
}
