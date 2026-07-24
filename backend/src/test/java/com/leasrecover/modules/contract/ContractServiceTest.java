package com.leasrecover.modules.contract;

import com.leasrecover.core.tenant.TenantContextHolder;
import com.leasrecover.modules.client.Client;
import com.leasrecover.modules.client.ClientService;
import com.leasrecover.modules.contract.dto.ContractRequest;
import com.leasrecover.modules.contract.dto.ContractResponse;
import com.leasrecover.modules.cases.VehicleRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.web.server.ResponseStatusException;
import java.time.ZonedDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class ContractServiceTest {

    @Mock
    private ContractRepository contractRepository;

    @Mock
    private ClientService clientService;

    @Mock
    private VehicleRepository vehicleRepository;

    @InjectMocks
    private ContractService contractService;

    private UUID tenantId;
    private Client client;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        tenantId = UUID.randomUUID();
        TenantContextHolder.setTenantUuid(tenantId);

        client = new Client();
        client.setId(UUID.randomUUID());
        client.setTenantId(tenantId);
        client.setFullNameOrCompany("Client Company");
        client.setIsDeleted(false);
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    @Test
    void testCreateContract_Success() {
        ContractRequest request = new ContractRequest();
        request.setClientId(client.getId());
        request.setReferenceNumber("REF-456");
        request.setStartDate(ZonedDateTime.now());
        request.setEndDate(ZonedDateTime.now().plusYears(2));
        request.setStatus("ACTIVE");

        when(clientService.getClientEntity(client.getId())).thenReturn(client);
        when(contractRepository.save(any(Contract.class))).thenAnswer(i -> i.getArgument(0));
        when(vehicleRepository.findByContract(any(Contract.class))).thenReturn(Optional.empty());

        ContractResponse response = contractService.createContract(request);

        assertNotNull(response);
        assertEquals(tenantId, response.getTenantId());
        assertEquals("REF-456", response.getReferenceNumber());
        assertEquals("Client Company", response.getClientName());
        verify(clientService, times(1)).getClientEntity(client.getId());
        verify(contractRepository, times(1)).save(any(Contract.class));
    }

    @Test
    void testGetAllContracts_Success() {
        Contract contract = new Contract();
        contract.setId(UUID.randomUUID());
        contract.setTenantId(tenantId);
        contract.setClient(client);
        contract.setReferenceNumber("REF-456");
        contract.setIsDeleted(false);

        when(contractRepository.findAllByTenantIdAndIsDeletedFalse(tenantId)).thenReturn(List.of(contract));
        when(vehicleRepository.findByContract(any(Contract.class))).thenReturn(Optional.empty());

        List<ContractResponse> response = contractService.getAllContracts();

        assertEquals(1, response.size());
        assertEquals("REF-456", response.get(0).getReferenceNumber());
        assertEquals("Client Company", response.get(0).getClientName());
    }

    @Test
    void testGetContractById_Success() {
        UUID contractId = UUID.randomUUID();
        Contract contract = new Contract();
        contract.setId(contractId);
        contract.setTenantId(tenantId);
        contract.setClient(client);
        contract.setReferenceNumber("REF-456");
        contract.setIsDeleted(false);

        when(contractRepository.findById(contractId)).thenReturn(Optional.of(contract));
        when(vehicleRepository.findByContract(any(Contract.class))).thenReturn(Optional.empty());

        ContractResponse response = contractService.getContractById(contractId);

        assertNotNull(response);
        assertEquals(contractId, response.getId());
        assertEquals("REF-456", response.getReferenceNumber());
    }

    @Test
    void testGetContractById_NotFound() {
        UUID contractId = UUID.randomUUID();
        when(contractRepository.findById(contractId)).thenReturn(Optional.empty());

        assertThrows(ResponseStatusException.class, () -> contractService.getContractById(contractId));
    }

    @Test
    void testGetContractById_TenantScopeViolation() {
        UUID contractId = UUID.randomUUID();
        Contract contract = new Contract();
        contract.setId(contractId);
        contract.setTenantId(UUID.randomUUID()); // different tenant
        contract.setIsDeleted(false);

        when(contractRepository.findById(contractId)).thenReturn(Optional.of(contract));

        assertThrows(ResponseStatusException.class, () -> contractService.getContractById(contractId));
    }

    @Test
    void testUpdateContract_Success() {
        UUID contractId = UUID.randomUUID();
        Contract contract = new Contract();
        contract.setId(contractId);
        contract.setTenantId(tenantId);
        contract.setClient(client);
        contract.setReferenceNumber("REF-OLD");
        contract.setIsDeleted(false);

        ContractRequest request = new ContractRequest();
        request.setClientId(client.getId());
        request.setReferenceNumber("REF-NEW");
        request.setStatus("SUSPENDED");

        when(contractRepository.findById(contractId)).thenReturn(Optional.of(contract));
        when(clientService.getClientEntity(client.getId())).thenReturn(client);
        when(contractRepository.save(any(Contract.class))).thenAnswer(i -> i.getArgument(0));
        when(vehicleRepository.findByContract(any(Contract.class))).thenReturn(Optional.empty());

        ContractResponse response = contractService.updateContract(contractId, request);

        assertNotNull(response);
        assertEquals("REF-NEW", response.getReferenceNumber());
        assertEquals("SUSPENDED", response.getStatus());
    }

    @Test
    void testDeleteContract_Success() {
        UUID contractId = UUID.randomUUID();
        Contract contract = new Contract();
        contract.setId(contractId);
        contract.setTenantId(tenantId);
        contract.setIsDeleted(false);

        when(contractRepository.findById(contractId)).thenReturn(Optional.of(contract));
        when(contractRepository.save(any(Contract.class))).thenAnswer(i -> i.getArgument(0));

        contractService.deleteContract(contractId);

        assertTrue(contract.getIsDeleted());
        assertNotNull(contract.getDeletedAt());
        verify(contractRepository, times(1)).save(contract);
    }
}
