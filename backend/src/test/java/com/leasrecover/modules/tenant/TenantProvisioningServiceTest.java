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
    void testProvisionTenant_Success() {
        String name = "New Tenant";
        String logoUrl = "http://logo.com";
        Integer dataRetentionMonths = 12;
        String adminEmail = "admin@newtenant.com";
        String adminPassword = "password";

        when(tenantRepository.save(any(Tenant.class))).thenAnswer(invocation -> {
            Tenant t = invocation.getArgument(0);
            return t;
        });

        // Mock Flyway static call
        try (org.mockito.MockedStatic<org.flywaydb.core.Flyway> flywayMockedStatic = org.mockito.Mockito.mockStatic(org.flywaydb.core.Flyway.class)) {
            org.flywaydb.core.api.configuration.FluentConfiguration fluentConfiguration = mock(org.flywaydb.core.api.configuration.FluentConfiguration.class);
            org.flywaydb.core.Flyway flyway = mock(org.flywaydb.core.Flyway.class);

            flywayMockedStatic.when(org.flywaydb.core.Flyway::configure).thenReturn(fluentConfiguration);
            when(fluentConfiguration.dataSource(any(javax.sql.DataSource.class))).thenReturn(fluentConfiguration);
            when(fluentConfiguration.schemas(anyString())).thenReturn(fluentConfiguration);
            when(fluentConfiguration.locations(anyString())).thenReturn(fluentConfiguration);
            when(fluentConfiguration.load()).thenReturn(flyway);

            Tenant provisioned = tenantProvisioningService.provisionTenant(name, logoUrl, dataRetentionMonths, adminEmail, adminPassword);

            assertNotNull(provisioned);
            assertEquals(name, provisioned.getName());
            assertEquals("ACTIVE", provisioned.getStatus());

            // Verify adminProvisioningService.provisionAdminAndConfig is called
            verify(adminProvisioningService).provisionAdminAndConfig(
                    eq(provisioned.getId()),
                    eq("tenant_" + provisioned.getId().toString().replace("-", "")),
                    eq(adminEmail),
                    eq(adminPassword)
            );
        }
    }

    @Test
    void testDeactivateTenant_Success() {
        UUID tenantId = UUID.randomUUID();

        when(tenantRepository.existsById(tenantId)).thenReturn(true);

        tenantProvisioningService.deactivateTenant(tenantId);

        verify(tenantRepository).updateTenantStatus(eq(tenantId), eq("INACTIVE"), any());
    }

    @Test
    void testDeactivateTenant_NotFound() {
        UUID tenantId = UUID.randomUUID();
        when(tenantRepository.existsById(tenantId)).thenReturn(false);

        assertThrows(org.springframework.web.server.ResponseStatusException.class,
                () -> tenantProvisioningService.deactivateTenant(tenantId));
    }

    @Test
    void testActivateTenant_Success() {
        UUID tenantId = UUID.randomUUID();

        when(tenantRepository.existsById(tenantId)).thenReturn(true);

        tenantProvisioningService.activateTenant(tenantId);

        verify(tenantRepository).updateTenantStatus(eq(tenantId), eq("ACTIVE"), any());
    }

    @Test
    void testActivateTenant_NotFound() {
        UUID tenantId = UUID.randomUUID();
        when(tenantRepository.existsById(tenantId)).thenReturn(false);

        assertThrows(org.springframework.web.server.ResponseStatusException.class,
                () -> tenantProvisioningService.activateTenant(tenantId));
    }
}
