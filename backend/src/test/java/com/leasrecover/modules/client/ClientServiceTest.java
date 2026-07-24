package com.leasrecover.modules.client;

import com.leasrecover.core.tenant.TenantContextHolder;
import com.leasrecover.modules.client.dto.ClientRequest;
import com.leasrecover.modules.client.dto.ClientResponse;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.web.server.ResponseStatusException;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class ClientServiceTest {

    @Mock
    private ClientRepository clientRepository;

    @InjectMocks
    private ClientService clientService;

    private UUID tenantId;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        tenantId = UUID.randomUUID();
        TenantContextHolder.setTenantUuid(tenantId);
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    @Test
    void testCreateClient_Success() {
        ClientRequest request = new ClientRequest();
        request.setFullNameOrCompany("Client Co");
        request.setRegistrationNumber("MF123");
        request.setContactEmail("client@example.com");
        request.setContactPhone("12345678");
        request.setAddress("Tunis");

        when(clientRepository.save(any(Client.class))).thenAnswer(i -> i.getArgument(0));

        ClientResponse response = clientService.createClient(request);

        assertNotNull(response);
        assertEquals(tenantId, response.getTenantId());
        assertEquals("Client Co", response.getFullNameOrCompany());
        assertEquals("MF123", response.getRegistrationNumber());
        assertEquals("client@example.com", response.getContactEmail());
        verify(clientRepository, times(1)).save(any(Client.class));
    }

    @Test
    void testGetAllClients_Success() {
        Client client = new Client();
        client.setId(UUID.randomUUID());
        client.setTenantId(tenantId);
        client.setFullNameOrCompany("Client Co");
        client.setIsDeleted(false);

        when(clientRepository.findAllByTenantIdAndIsDeletedFalse(tenantId)).thenReturn(List.of(client));

        List<ClientResponse> response = clientService.getAllClients();

        assertEquals(1, response.size());
        assertEquals("Client Co", response.get(0).getFullNameOrCompany());
    }

    @Test
    void testGetClientById_Success() {
        UUID clientId = UUID.randomUUID();
        Client client = new Client();
        client.setId(clientId);
        client.setTenantId(tenantId);
        client.setFullNameOrCompany("Client Co");
        client.setIsDeleted(false);

        when(clientRepository.findById(clientId)).thenReturn(Optional.of(client));

        ClientResponse response = clientService.getClientById(clientId);

        assertNotNull(response);
        assertEquals(clientId, response.getId());
    }

    @Test
    void testGetClientById_NotFound() {
        UUID clientId = UUID.randomUUID();
        when(clientRepository.findById(clientId)).thenReturn(Optional.empty());

        assertThrows(ResponseStatusException.class, () -> clientService.getClientById(clientId));
    }

    @Test
    void testGetClientById_TenantScopeViolation() {
        UUID clientId = UUID.randomUUID();
        Client client = new Client();
        client.setId(clientId);
        client.setTenantId(UUID.randomUUID()); // different tenant
        client.setIsDeleted(false);

        when(clientRepository.findById(clientId)).thenReturn(Optional.of(client));

        assertThrows(ResponseStatusException.class, () -> clientService.getClientById(clientId));
    }

    @Test
    void testUpdateClient_Success() {
        UUID clientId = UUID.randomUUID();
        Client client = new Client();
        client.setId(clientId);
        client.setTenantId(tenantId);
        client.setFullNameOrCompany("Old Name");
        client.setIsDeleted(false);

        ClientRequest request = new ClientRequest();
        request.setFullNameOrCompany("New Name");

        when(clientRepository.findById(clientId)).thenReturn(Optional.of(client));
        when(clientRepository.save(any(Client.class))).thenAnswer(i -> i.getArgument(0));

        ClientResponse response = clientService.updateClient(clientId, request);

        assertNotNull(response);
        assertEquals("New Name", response.getFullNameOrCompany());
    }

    @Test
    void testDeleteClient_Success() {
        UUID clientId = UUID.randomUUID();
        Client client = new Client();
        client.setId(clientId);
        client.setTenantId(tenantId);
        client.setIsDeleted(false);

        when(clientRepository.findById(clientId)).thenReturn(Optional.of(client));
        when(clientRepository.save(any(Client.class))).thenAnswer(i -> i.getArgument(0));

        clientService.deleteClient(clientId);

        assertTrue(client.getIsDeleted());
        assertNotNull(client.getDeletedAt());
        verify(clientRepository, times(1)).save(client);
    }
}
