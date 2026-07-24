package com.leasrecover.modules.cases;

import com.leasrecover.core.tenant.TenantContextHolder;
import com.leasrecover.modules.contract.Contract;
import com.leasrecover.modules.contract.ContractService;
import com.leasrecover.modules.cases.dto.VehicleCreateRequest;
import com.leasrecover.modules.cases.dto.VehicleResponse;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class VehicleServiceTest {

    @Mock
    private VehicleRepository vehicleRepository;

    @Mock
    private ContractService contractService;

    @InjectMocks
    private VehicleService vehicleService;

    private UUID tenantId;
    private UUID contractId;
    private Contract contract;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        tenantId = UUID.randomUUID();
        contractId = UUID.randomUUID();
        TenantContextHolder.setTenantUuid(tenantId);

        contract = new Contract();
        contract.setId(contractId);
        contract.setTenantId(tenantId);
        contract.setReferenceNumber("CON-123");
        contract.setIsDeleted(false);
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    @Test
    void testRegisterVehicle_Success_CreatesNew() {
        // Arrange
        VehicleCreateRequest request = new VehicleCreateRequest();
        request.setVin("VIN12345678901234");
        request.setLicensePlate("123-TUN-4567");
        request.setBrand("Peugeot");
        request.setModel("3008");
        request.setYear(2020);

        when(contractService.getContractEntity(contractId)).thenReturn(contract);
        when(vehicleRepository.findByContract(contract)).thenReturn(Optional.empty());
        when(vehicleRepository.save(any(Vehicle.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        VehicleResponse response = vehicleService.registerVehicle(contractId, request);

        // Assert
        assertNotNull(response);
        assertNotNull(response.getId());
        assertEquals(tenantId, response.getTenantId());
        assertEquals(contractId, response.getContractId());
        assertEquals("VIN12345678901234", response.getVin());
        assertEquals("123-TUN-4567", response.getLicensePlate());
        assertEquals("Peugeot", response.getBrand());
        assertEquals("3008", response.getModel());
        assertEquals(2020, response.getYear());

        verify(contractService).getContractEntity(contractId);
        verify(vehicleRepository).findByContract(contract);
        verify(vehicleRepository).save(any(Vehicle.class));
    }

    @Test
    void testRegisterVehicle_Success_UpdatesExisting() {
        // Arrange
        VehicleCreateRequest request = new VehicleCreateRequest();
        request.setVin("VINNEW7890123456");
        request.setLicensePlate("789-TUN-1234");
        request.setBrand("Renault");
        request.setModel("Clio");
        request.setYear(2022);

        Vehicle existingVehicle = new Vehicle();
        existingVehicle.setId(UUID.randomUUID());
        existingVehicle.setContract(contract);
        existingVehicle.setTenantId(tenantId);
        existingVehicle.setVin("VINOLD1234567890");
        existingVehicle.setLicensePlate("123-TUN-7890");
        existingVehicle.setBrand("Renault");
        existingVehicle.setModel("Megane");
        existingVehicle.setYear(2018);

        when(contractService.getContractEntity(contractId)).thenReturn(contract);
        when(vehicleRepository.findByContract(contract)).thenReturn(Optional.of(existingVehicle));
        when(vehicleRepository.save(any(Vehicle.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        VehicleResponse response = vehicleService.registerVehicle(contractId, request);

        // Assert
        assertNotNull(response);
        assertEquals(existingVehicle.getId(), response.getId());
        assertEquals(tenantId, response.getTenantId());
        assertEquals(contractId, response.getContractId());
        assertEquals("VINNEW7890123456", response.getVin());
        assertEquals("789-TUN-1234", response.getLicensePlate());
        assertEquals("Clio", response.getModel());
        assertEquals(2022, response.getYear());

        verify(contractService).getContractEntity(contractId);
        verify(vehicleRepository).findByContract(contract);
        verify(vehicleRepository).save(existingVehicle);
    }

    @Test
    void testRegisterVehicle_NoTenantContext_ThrowsException() {
        // Arrange
        TenantContextHolder.clear();
        VehicleCreateRequest request = new VehicleCreateRequest();

        // Act & Assert
        assertThrows(ResponseStatusException.class, () -> vehicleService.registerVehicle(contractId, request));
        verify(vehicleRepository, never()).save(any(Vehicle.class));
    }

    @Test
    void testGetVehicleByContract_Success() {
        // Arrange
        Vehicle vehicle = new Vehicle();
        vehicle.setId(UUID.randomUUID());
        vehicle.setContract(contract);
        vehicle.setTenantId(tenantId);
        vehicle.setVin("VIN12345678901234");
        vehicle.setLicensePlate("123-TUN-4567");
        vehicle.setBrand("Peugeot");
        vehicle.setModel("3008");
        vehicle.setYear(2020);

        when(contractService.getContractEntity(contractId)).thenReturn(contract);
        when(vehicleRepository.findByContract(contract)).thenReturn(Optional.of(vehicle));

        // Act
        VehicleResponse response = vehicleService.getVehicleByContract(contractId);

        // Assert
        assertNotNull(response);
        assertEquals(vehicle.getId(), response.getId());
        assertEquals("VIN12345678901234", response.getVin());

        verify(contractService).getContractEntity(contractId);
        verify(vehicleRepository).findByContract(contract);
    }

    @Test
    void testGetVehicleByContract_NotFound_ThrowsException() {
        // Arrange
        when(contractService.getContractEntity(contractId)).thenReturn(contract);
        when(vehicleRepository.findByContract(contract)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(ResponseStatusException.class, () -> vehicleService.getVehicleByContract(contractId));
        verify(contractService).getContractEntity(contractId);
        verify(vehicleRepository).findByContract(contract);
    }
}
