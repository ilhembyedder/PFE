package com.leasrecover.modules.contract;

import com.leasrecover._common.util.UuidCreator;
import com.leasrecover.core.tenant.TenantContextHolder;
import com.leasrecover.modules.client.Client;
import com.leasrecover.modules.client.ClientService;
import com.leasrecover.modules.contract.dto.ContractRequest;
import com.leasrecover.modules.contract.dto.ContractResponse;
import com.leasrecover.modules.cases.Vehicle;
import com.leasrecover.modules.cases.VehicleRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import java.time.ZonedDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class ContractService {

    private final ContractRepository contractRepository;
    private final ClientService clientService;
    private final VehicleRepository vehicleRepository;

    public ContractService(
            ContractRepository contractRepository, 
            ClientService clientService,
            VehicleRepository vehicleRepository) {
        this.contractRepository = contractRepository;
        this.clientService = clientService;
        this.vehicleRepository = vehicleRepository;
    }

    private ContractResponse toResponse(Contract contract) {
        Vehicle vehicle = vehicleRepository.findByContract(contract).orElse(null);
        return ContractResponse.fromEntity(contract, vehicle);
    }

    @Transactional
    public ContractResponse createContract(ContractRequest request) {
        UUID tenantId = TenantContextHolder.getTenantUuid();
        if (tenantId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No active tenant context found");
        }

        // Validate client exists and belongs to active tenant
        Client client = clientService.getClientEntity(request.getClientId());

        Contract contract = new Contract();
        contract.setId(UuidCreator.createUuidV7());
        contract.setTenantId(tenantId);
        contract.setClient(client);
        contract.setReferenceNumber(request.getReferenceNumber());
        contract.setStartDate(request.getStartDate());
        contract.setEndDate(request.getEndDate());
        contract.setStatus(request.getStatus());
        contract.setIsDeleted(false);

        Contract savedContract = contractRepository.save(contract);
        return toResponse(savedContract);
    }

    @Transactional(readOnly = true)
    public List<ContractResponse> getAllContracts() {
        UUID tenantId = TenantContextHolder.getTenantUuid();
        if (tenantId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No active tenant context found");
        }

        return contractRepository.findAllByTenantIdAndIsDeletedFalse(tenantId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ContractResponse getContractById(UUID id) {
        Contract contract = getContractEntity(id);
        return toResponse(contract);
    }

    @Transactional
    public ContractResponse updateContract(UUID id, ContractRequest request) {
        Contract contract = getContractEntity(id);

        // Validate client exists and belongs to active tenant
        Client client = clientService.getClientEntity(request.getClientId());

        contract.setClient(client);
        contract.setReferenceNumber(request.getReferenceNumber());
        contract.setStartDate(request.getStartDate());
        contract.setEndDate(request.getEndDate());
        contract.setStatus(request.getStatus());

        Contract updatedContract = contractRepository.save(contract);
        return toResponse(updatedContract);
    }

    @Transactional
    public void deleteContract(UUID id) {
        Contract contract = getContractEntity(id);
        contract.setIsDeleted(true);
        contract.setDeletedAt(ZonedDateTime.now());
        contractRepository.save(contract);
    }

    public Contract getContractEntity(UUID id) {
        UUID tenantId = TenantContextHolder.getTenantUuid();
        if (tenantId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No active tenant context found");
        }

        Contract contract = contractRepository.findById(id)
                .filter(c -> !c.getIsDeleted())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Contract not found"));

        if (!tenantId.equals(contract.getTenantId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied: Contract does not belong to active tenant");
        }

        return contract;
    }
}
