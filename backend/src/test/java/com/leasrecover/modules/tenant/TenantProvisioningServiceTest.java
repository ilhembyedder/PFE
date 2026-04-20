package com.leasrecover.modules.tenant;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import javax.sql.DataSource;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class TenantProvisioningServiceTest {

    @Mock
    private TenantRepository tenantRepository;

    @Mock
    private DataSource dataSource;

    @Mock
    private AdminProvisioningService adminProvisioningService;

    @InjectMocks
    private TenantProvisioningService tenantProvisioningService;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void testDeactivateTenant_Success() {
        UUID tenantId = UUID.randomUUID();
        Tenant tenant = new Tenant();
        tenant.setId(tenantId);
        tenant.setStatus("ACTIVE");

        when(tenantRepository.findById(tenantId)).thenReturn(Optional.of(tenant));

        tenantProvisioningService.deactivateTenant(tenantId);

        assertEquals("INACTIVE", tenant.getStatus());
        verify(tenantRepository).save(tenant);
    }

    @Test
    void testDeactivateTenant_NotFound() {
        UUID tenantId = UUID.randomUUID();
        when(tenantRepository.findById(tenantId)).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () -> tenantProvisioningService.deactivateTenant(tenantId));
    }
}
