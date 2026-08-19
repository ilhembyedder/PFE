package com.leasrecover.modules.client.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ClientRequest {

    @NotBlank(message = "Le nom du client est obligatoire.")
    private String fullNameOrCompany;

    private String registrationNumber;

    @Email(message = "L'adresse e-mail doit être valide.")
    private String contactEmail;

    private String contactPhone;
    private String address;

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
}
