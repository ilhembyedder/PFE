package com.leasrecover.modules.contract;

import com.leasrecover._common.dto.JSendResponse;
import com.leasrecover.modules.contract.dto.ContractRequest;
import com.leasrecover.modules.contract.dto.ContractResponse;
import com.leasrecover.modules.users.AppUser;
import com.leasrecover.modules.users.AppUserRepository;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.util.List;
import java.util.UUID;
import com.leasrecover.modules.cases.VehicleService;
import com.leasrecover.modules.cases.dto.VehicleCreateRequest;
import com.leasrecover.modules.cases.dto.VehicleResponse;

@RestController
@RequestMapping("/api/v1/contracts")
public class ContractController {

    private final ContractService contractService;
    private final AppUserRepository appUserRepository;
    private final VehicleService vehicleService;
    private final boolean allowHeaderFallback;

    public ContractController(
            ContractService contractService,
            AppUserRepository appUserRepository,
            VehicleService vehicleService,
            @Value("${app.security.allow-header-fallback:true}") boolean allowHeaderFallback) {
        this.contractService = contractService;
        this.appUserRepository = appUserRepository;
        this.vehicleService = vehicleService;
        this.allowHeaderFallback = allowHeaderFallback;
    }

    private String resolveUserEmail(String headerEmail) {
        org.springframework.security.core.Authentication authentication = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        String email = null;
        if (authentication != null && authentication.isAuthenticated()) {
            Object principal = authentication.getPrincipal();
            if (principal instanceof com.leasrecover.modules.auth.UserPrincipal userPrincipal) {
                email = userPrincipal.getEmail();
            } else if (principal instanceof org.springframework.security.core.userdetails.UserDetails userDetails) {
                email = userDetails.getUsername();
            } else if (principal instanceof String principalString && !"anonymousUser".equals(principalString)) {
                email = principalString;
            }
        }
        if (email == null || email.trim().isEmpty()) {
            if (allowHeaderFallback) {
                email = headerEmail;
            }
        }
        return email;
    }

    private void verifyAccess(String userEmail) {
        String email = resolveUserEmail(userEmail);
        if (email == null || email.trim().isEmpty()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User email is missing");
        }
        AppUser user = appUserRepository.findByEmailAndIsDeletedFalse(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));

        if (!"GESTIONNAIRE".equals(user.getRole()) && !"ADMIN".equals(user.getRole())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied: GESTIONNAIRE or ADMIN role required");
        }
    }

    @PostMapping
    public ResponseEntity<JSendResponse<ContractResponse>> createContract(
            @RequestBody @Valid ContractRequest request,
            @RequestHeader(value = "X-User-Email", required = false) String userEmail) {
        verifyAccess(userEmail);
        ContractResponse response = contractService.createContract(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(JSendResponse.success(response));
    }

    @GetMapping
    public ResponseEntity<JSendResponse<List<ContractResponse>>> getAllContracts(
            @RequestHeader(value = "X-User-Email", required = false) String userEmail) {
        verifyAccess(userEmail);
        List<ContractResponse> response = contractService.getAllContracts();
        return ResponseEntity.ok(JSendResponse.success(response));
    }

    @GetMapping("/{id}")
    public ResponseEntity<JSendResponse<ContractResponse>> getContractById(
            @PathVariable UUID id,
            @RequestHeader(value = "X-User-Email", required = false) String userEmail) {
        verifyAccess(userEmail);
        ContractResponse response = contractService.getContractById(id);
        return ResponseEntity.ok(JSendResponse.success(response));
    }

    @PutMapping("/{id}")
    public ResponseEntity<JSendResponse<ContractResponse>> updateContract(
            @PathVariable UUID id,
            @RequestBody @Valid ContractRequest request,
            @RequestHeader(value = "X-User-Email", required = false) String userEmail) {
        verifyAccess(userEmail);
        ContractResponse response = contractService.updateContract(id, request);
        return ResponseEntity.ok(JSendResponse.success(response));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<JSendResponse<Void>> deleteContract(
            @PathVariable UUID id,
            @RequestHeader(value = "X-User-Email", required = false) String userEmail) {
        verifyAccess(userEmail);
        contractService.deleteContract(id);
        return ResponseEntity.ok(JSendResponse.success(null));
    }

    @PostMapping("/{contractId}/vehicle")
    public ResponseEntity<JSendResponse<VehicleResponse>> registerVehicle(
            @PathVariable UUID contractId,
            @RequestBody @Valid VehicleCreateRequest request,
            @RequestHeader(value = "X-User-Email", required = false) String userEmail) {
        verifyAccess(userEmail);
        VehicleResponse response = vehicleService.registerVehicle(contractId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(JSendResponse.success(response));
    }

    @GetMapping("/{contractId}/vehicle")
    public ResponseEntity<JSendResponse<VehicleResponse>> getVehicle(
            @PathVariable UUID contractId,
            @RequestHeader(value = "X-User-Email", required = false) String userEmail) {
        verifyAccess(userEmail);
        VehicleResponse response = vehicleService.getVehicleByContract(contractId);
        return ResponseEntity.ok(JSendResponse.success(response));
    }
}
