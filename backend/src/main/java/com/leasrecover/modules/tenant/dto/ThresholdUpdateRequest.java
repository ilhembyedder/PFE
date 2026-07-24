package com.leasrecover.modules.tenant.dto;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ThresholdUpdateRequest {

    @NotNull(message = "Moderate deviation threshold is required")
    @DecimalMin(value = "0.00", message = "Moderate threshold must be at least 0.00")
    @DecimalMax(value = "100.00", message = "Moderate threshold must not exceed 100.00")
    private BigDecimal aiDeviationModerate;

    @NotNull(message = "Critical deviation threshold is required")
    @DecimalMin(value = "0.00", message = "Critical threshold must be at least 0.00")
    @DecimalMax(value = "100.00", message = "Critical threshold must not exceed 100.00")
    private BigDecimal aiDeviationCritical;

    @AssertTrue(message = "Moderate deviation threshold must be strictly less than critical deviation threshold")
    public boolean isThresholdRangeValid() {
        if (aiDeviationModerate == null || aiDeviationCritical == null) {
            return true; // handled by @NotNull
        }
        return aiDeviationModerate.compareTo(aiDeviationCritical) < 0;
    }
}
