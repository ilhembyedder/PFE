package com.leasrecover.modules.cases.dto;

import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class VehicleCreateRequest {

    @NotBlank(message = "VIN is required")
    @Pattern(regexp = "^[a-zA-Z0-9]+$", message = "VIN must be alphanumeric")
    @Size(max = 50, message = "VIN must not exceed 50 characters")
    private String vin;

    @NotBlank(message = "License plate is required")
    @Size(max = 50, message = "License plate must not exceed 50 characters")
    private String licensePlate;

    @NotBlank(message = "Brand is required")
    @Size(max = 100, message = "Brand must not exceed 100 characters")
    private String brand;

    @NotBlank(message = "Model is required")
    @Size(max = 100, message = "Model must not exceed 100 characters")
    private String model;

    @NotNull(message = "Year is required")
    @Min(value = 1900, message = "Year must be 1900 or later")
    private Integer year;
}
