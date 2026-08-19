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

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public UUID getTenantId() { return tenantId; }
    public void setTenantId(UUID tenantId) { this.tenantId = tenantId; }
    public String getFullNameOrCompany() { return fullNameOrCompany; }
    public void setFullNameOrCompany(String fullNameOrCompany) { this.fullNameOrCompany = fullNameOrCompany; }
    public String getRegistrationNumber() { return registrationNumber; }
    public void setRegistrationNumber(String registrationNumber) { this.registrationNumber = registrationNumber; }
    public String getContactEmail() { return contactEmail; }
    public void setContactEmail(String contactEmail) { this.contactEmail = contactEmail; }
    public String getContactPhone() { return contactPhone; }
    public void setContactPhone(String contactPhone) { this.contactPhone = contactPhone; }
    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }
    public ZonedDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(ZonedDateTime createdAt) { this.createdAt = createdAt; }
    public ZonedDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(ZonedDateTime updatedAt) { this.updatedAt = updatedAt; }

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
