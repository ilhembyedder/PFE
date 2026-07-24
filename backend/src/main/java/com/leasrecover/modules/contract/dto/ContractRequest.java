package com.leasrecover.modules.contract.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;
import java.time.ZonedDateTime;
import java.util.UUID;

@Getter
@Setter
public class ContractRequest {

    @NotNull(message = "L'identifiant du client est obligatoire.")
    private UUID clientId;

    @NotBlank(message = "La référence du contrat est obligatoire.")
    private String referenceNumber;

    private ZonedDateTime startDate;
    private ZonedDateTime endDate;

    @NotBlank(message = "Le statut du contrat est obligatoire.")
    private String status;
}
