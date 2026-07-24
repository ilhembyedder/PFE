package com.leasrecover.modules.cases;

import com.leasrecover.core.tenant.TenantContextHolder;
import com.leasrecover.modules.tenant.Tenant;
import com.leasrecover.modules.tenant.TenantRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.util.Arrays;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class AlertEngineSchedulerTest {

    @Mock
    private TenantRepository tenantRepository;

    @Mock
    private AlertEngineService alertEngineService;

    @InjectMocks
    private AlertEngineScheduler alertEngineScheduler;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        TenantContextHolder.clear();
    }

    @Test
    void testProcessAlerts_MultipleTenants() {
        Tenant tenant1 = new Tenant();
        tenant1.setId(UUID.randomUUID());
        tenant1.setName("Tenant A");
        tenant1.setStatus("ACTIVE");
        tenant1.setIsDeleted(false);

        Tenant tenant2 = new Tenant();
        tenant2.setId(UUID.randomUUID());
        tenant2.setName("Tenant B");
        tenant2.setStatus("ACTIVE");
        tenant2.setIsDeleted(false);

        List<Tenant> tenants = Arrays.asList(tenant1, tenant2);
        when(tenantRepository.findAll()).thenReturn(tenants);

        doAnswer(invocation -> {
            UUID passedTenantId = invocation.getArgument(0);
            String expectedSchema = "tenant_" + passedTenantId.toString().replace("-", "");
            assertEquals(expectedSchema, TenantContextHolder.getTenantId());
            assertEquals(passedTenantId, TenantContextHolder.getTenantUuid());
            return null;
        }).when(alertEngineService).processAlertsForTenant(any(UUID.class));

        alertEngineScheduler.processAlerts();

        verify(alertEngineService).processAlertsForTenant(tenant1.getId());
        verify(alertEngineService).processAlertsForTenant(tenant2.getId());
        assertNull(TenantContextHolder.getTenantId(), "Context should be cleared after scheduler run");
    }

    @Test
    void testProcessAlerts_InactiveTenantSkipped() {
        Tenant tenant1 = new Tenant();
        tenant1.setId(UUID.randomUUID());
        tenant1.setName("Tenant Active");
        tenant1.setStatus("ACTIVE");
        tenant1.setIsDeleted(false);

        Tenant tenant2 = new Tenant();
        tenant2.setId(UUID.randomUUID());
        tenant2.setName("Tenant Inactive");
        tenant2.setStatus("INACTIVE");
        tenant2.setIsDeleted(false);

        List<Tenant> tenants = Arrays.asList(tenant1, tenant2);
        when(tenantRepository.findAll()).thenReturn(tenants);

        alertEngineScheduler.processAlerts();

        verify(alertEngineService).processAlertsForTenant(tenant1.getId());
        verify(alertEngineService, never()).processAlertsForTenant(tenant2.getId());
    }

    @Test
    void testProcessAlerts_ContinuesOnException() {
        Tenant tenant1 = new Tenant();
        tenant1.setId(UUID.randomUUID());
        tenant1.setName("Tenant 1");
        tenant1.setStatus("ACTIVE");
        tenant1.setIsDeleted(false);

        Tenant tenant2 = new Tenant();
        tenant2.setId(UUID.randomUUID());
        tenant2.setName("Tenant 2");
        tenant2.setStatus("ACTIVE");
        tenant2.setIsDeleted(false);

        List<Tenant> tenants = Arrays.asList(tenant1, tenant2);
        when(tenantRepository.findAll()).thenReturn(tenants);

        doThrow(new RuntimeException("Database error for tenant 1"))
                .when(alertEngineService).processAlertsForTenant(tenant1.getId());

        assertDoesNotThrow(() -> alertEngineScheduler.processAlerts(), 
                "Scheduler should swallow exceptions internally and process next tenant");

        verify(alertEngineService).processAlertsForTenant(tenant1.getId());
        verify(alertEngineService).processAlertsForTenant(tenant2.getId());
        assertNull(TenantContextHolder.getTenantId(), "Context should be cleared");
    }
}
