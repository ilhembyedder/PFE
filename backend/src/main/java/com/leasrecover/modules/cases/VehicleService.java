package com.leasrecover.modules.cases;

import com.leasrecover._common.util.UuidCreator;
import com.leasrecover.core.tenant.TenantContextHolder;
import com.leasrecover.modules.contract.Contract;
import com.leasrecover.modules.contract.ContractService;
import com.leasrecover.modules.cases.dto.VehicleCreateRequest;
import com.leasrecover.modules.cases.dto.VehicleResponse;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.ZonedDateTime;
import java.util.Optional;
import java.util.UUID;

@Service
public class VehicleService {

    private final VehicleRepository vehicleRepository;
    private final ContractService contractService;

    public VehicleService(VehicleRepository vehicleRepository, ContractService contractService) {
        this.vehicleRepository = vehicleRepository;
        this.contractService = contractService;
    }

    @Transactional
    public VehicleResponse registerVehicle(UUID contractId, VehicleCreateRequest request) {
        UUID tenantId = TenantContextHolder.getTenantUuid();
        if (tenantId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No active tenant context found");
        }

        Contract contract = contractService.getContractEntity(contractId);

        Optional<Vehicle> existingVehicleOpt = vehicleRepository.findByContract(contract);
        Vehicle vehicle;
        if (existingVehicleOpt.isPresent()) {
            vehicle = existingVehicleOpt.get();
        } else {
            vehicle = new Vehicle();
            vehicle.setId(UuidCreator.createUuidV7());
            vehicle.setContract(contract);
            vehicle.setTenantId(tenantId);
            vehicle.setIsDeleted(false);
            vehicle.setCreatedAt(ZonedDateTime.now());
        }

        vehicle.setVin(request.getVin());
        vehicle.setLicensePlate(request.getLicensePlate());
        vehicle.setBrand(request.getBrand());
        vehicle.setModel(request.getModel());
        vehicle.setYear(request.getYear());
        vehicle.setUpdatedAt(ZonedDateTime.now());

        Vehicle savedVehicle = vehicleRepository.save(vehicle);
        return VehicleResponse.fromEntity(savedVehicle);
    }

    @Transactional(readOnly = true)
    public VehicleResponse getVehicleByContract(UUID contractId) {
        Contract contract = contractService.getContractEntity(contractId);
        Vehicle vehicle = vehicleRepository.findByContract(contract)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Vehicle not found for contract"));
        return VehicleResponse.fromEntity(vehicle);
    }
}
