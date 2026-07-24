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
}
