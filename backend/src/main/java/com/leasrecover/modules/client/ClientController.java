package com.leasrecover.modules.client;

import com.leasrecover._common.dto.JSendResponse;
import com.leasrecover.modules.client.dto.ClientRequest;
import com.leasrecover.modules.client.dto.ClientResponse;
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

@RestController
@RequestMapping("/api/v1/clients")
public class ClientController {

    private final ClientService clientService;
    private final AppUserRepository appUserRepository;
    private final boolean allowHeaderFallback;

    public ClientController(
            ClientService clientService,
            AppUserRepository appUserRepository,
            @Value("${app.security.allow-header-fallback:true}") boolean allowHeaderFallback) {
        this.clientService = clientService;
        this.appUserRepository = appUserRepository;
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
    public ResponseEntity<JSendResponse<ClientResponse>> createClient(
            @RequestBody @Valid ClientRequest request,
            @RequestHeader(value = "X-User-Email", required = false) String userEmail) {
        verifyAccess(userEmail);
        ClientResponse response = clientService.createClient(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(JSendResponse.success(response));
    }

    @GetMapping
    public ResponseEntity<JSendResponse<List<ClientResponse>>> getAllClients(
            @RequestHeader(value = "X-User-Email", required = false) String userEmail) {
        verifyAccess(userEmail);
        List<ClientResponse> response = clientService.getAllClients();
        return ResponseEntity.ok(JSendResponse.success(response));
    }

    @GetMapping("/{id}")
    public ResponseEntity<JSendResponse<ClientResponse>> getClientById(
            @PathVariable UUID id,
            @RequestHeader(value = "X-User-Email", required = false) String userEmail) {
        verifyAccess(userEmail);
        ClientResponse response = clientService.getClientById(id);
        return ResponseEntity.ok(JSendResponse.success(response));
    }

    @PutMapping("/{id}")
    public ResponseEntity<JSendResponse<ClientResponse>> updateClient(
            @PathVariable UUID id,
            @RequestBody @Valid ClientRequest request,
            @RequestHeader(value = "X-User-Email", required = false) String userEmail) {
        verifyAccess(userEmail);
        ClientResponse response = clientService.updateClient(id, request);
        return ResponseEntity.ok(JSendResponse.success(response));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<JSendResponse<Void>> deleteClient(
            @PathVariable UUID id,
            @RequestHeader(value = "X-User-Email", required = false) String userEmail) {
        verifyAccess(userEmail);
        clientService.deleteClient(id);
        return ResponseEntity.ok(JSendResponse.success(null));
    }
}
