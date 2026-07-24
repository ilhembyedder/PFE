package com.leasrecover.modules.client.dto;

import com.leasrecover.modules.client.Client;
import lombok.Getter;
import lombok.Setter;
import java.time.ZonedDateTime;
import java.util.UUID;

@Getter
@Setter
public class ClientResponse {
    private UUID id;
    private UUID tenantId;
    private String fullNameOrCompany;
    private String registrationNumber;
    private String contactEmail;
    private String contactPhone;
    private String address;
    private ZonedDateTime createdAt;
    private ZonedDateTime updatedAt;

    public static ClientResponse fromEntity(Client client) {
        if (client == null) return null;
        ClientResponse response = new ClientResponse();
        response.setId(client.getId());
        response.setTenantId(client.getTenantId());
        response.setFullNameOrCompany(client.getFullNameOrCompany());
        response.setRegistrationNumber(client.getRegistrationNumber());
        response.setContactEmail(client.getContactEmail());
        response.setContactPhone(client.getContactPhone());
        response.setAddress(client.getAddress());
        response.setCreatedAt(client.getCreatedAt());
        response.setUpdatedAt(client.getUpdatedAt());
        return response;
    }
}
