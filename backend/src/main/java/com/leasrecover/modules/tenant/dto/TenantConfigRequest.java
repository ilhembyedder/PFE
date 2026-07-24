package com.leasrecover.modules.tenant.dto;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class TenantConfigRequest {

    @NotNull(message = "Le seuil d'inactivité est obligatoire")
    @Positive(message = "Le seuil d'inactivité doit être strictement supérieur à zéro")
    private Integer dormancyThresholdDays;

    @NotNull(message = "Les délais légaux par phase sont obligatoires")
    private Map<String, Integer> phaseLegalDelays;

    @AssertTrue(message = "Tous les délais légaux de phase doivent être strictement supérieurs à zéro")
    public boolean isPhaseLegalDelaysValid() {
        if (phaseLegalDelays == null || phaseLegalDelays.isEmpty()) {
            return false;
        }
        for (Integer value : phaseLegalDelays.values()) {
            if (value == null || value <= 0) {
                return false;
            }
        }
        return true;
    }
}
