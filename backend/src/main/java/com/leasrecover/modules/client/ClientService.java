package com.leasrecover.modules.client;

import com.leasrecover._common.util.UuidCreator;
import com.leasrecover.core.tenant.TenantContextHolder;
import com.leasrecover.modules.client.dto.ClientRequest;
import com.leasrecover.modules.client.dto.ClientResponse;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import java.time.ZonedDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class ClientService {

    private final ClientRepository clientRepository;

    public ClientService(ClientRepository clientRepository) {
        this.clientRepository = clientRepository;
    }

    @Transactional
    public ClientResponse createClient(ClientRequest request) {
        UUID tenantId = TenantContextHolder.getTenantUuid();
        if (tenantId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No active tenant context found");
        }

        Client client = new Client();
        client.setId(UuidCreator.createUuidV7());
        client.setTenantId(tenantId);
        client.setFullNameOrCompany(request.getFullNameOrCompany());
        client.setRegistrationNumber(request.getRegistrationNumber());
        client.setContactEmail(request.getContactEmail());
        client.setContactPhone(request.getContactPhone());
        client.setAddress(request.getAddress());
        client.setIsDeleted(false);

        Client savedClient = clientRepository.save(client);
        return ClientResponse.fromEntity(savedClient);
    }

    @Transactional(readOnly = true)
    public List<ClientResponse> getAllClients() {
        UUID tenantId = TenantContextHolder.getTenantUuid();
        if (tenantId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No active tenant context found");
        }

        return clientRepository.findAllByTenantIdAndIsDeletedFalse(tenantId).stream()
                .map(ClientResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ClientResponse getClientById(UUID id) {
        Client client = getClientEntity(id);
        return ClientResponse.fromEntity(client);
    }

    @Transactional
    public ClientResponse updateClient(UUID id, ClientRequest request) {
        Client client = getClientEntity(id);
        client.setFullNameOrCompany(request.getFullNameOrCompany());
        client.setRegistrationNumber(request.getRegistrationNumber());
        client.setContactEmail(request.getContactEmail());
        client.setContactPhone(request.getContactPhone());
        client.setAddress(request.getAddress());

        Client updatedClient = clientRepository.save(client);
        return ClientResponse.fromEntity(updatedClient);
    }

    @Transactional
    public void deleteClient(UUID id) {
        Client client = getClientEntity(id);
        client.setIsDeleted(true);
        client.setDeletedAt(ZonedDateTime.now());
        clientRepository.save(client);
    }

    public Client getClientEntity(UUID id) {
        UUID tenantId = TenantContextHolder.getTenantUuid();
        if (tenantId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No active tenant context found");
        }

        Client client = clientRepository.findById(id)
                .filter(c -> !c.getIsDeleted())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Client not found"));

        if (!tenantId.equals(client.getTenantId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied: Client does not belong to active tenant");
        }

        return client;
    }
}
