package com.leasrecover.config.tenant;

import com.leasrecover.modules.tenant.Tenant;
import com.leasrecover.modules.tenant.TenantRepository;
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

import static org.mockito.Mockito.*;

class TenantFilterTest {

    @Mock
    private TenantRepository tenantRepository;

    @Mock
    private HttpServletRequest request;

    @Mock
    private HttpServletResponse response;

    @Mock
    private FilterChain filterChain;

    @InjectMocks
    private TenantFilter tenantFilter;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
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
}
