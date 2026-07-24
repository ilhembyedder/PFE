package com.leasrecover.modules.users;

import com.leasrecover._common.dto.JSendResponse;
import com.leasrecover.modules.users.dto.UserCreateRequest;
import com.leasrecover.modules.users.dto.UserResponse;
import com.leasrecover.modules.users.dto.UserUpdateRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/users")
public class AdminUserManagementController {

    private final UserManagementService userManagementService;

    public AdminUserManagementController(UserManagementService userManagementService) {
        this.userManagementService = userManagementService;
    }

    @PostMapping
    public ResponseEntity<JSendResponse<UserResponse>> createUser(@RequestBody @Valid UserCreateRequest request) {
        UserResponse response = userManagementService.createUser(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(JSendResponse.success(response));
    }

    @GetMapping
    public ResponseEntity<JSendResponse<List<UserResponse>>> getAllUsers() {
        List<UserResponse> response = userManagementService.getAllUsers();
        return ResponseEntity.ok(JSendResponse.success(response));
    }

    @GetMapping("/{id}")
    public ResponseEntity<JSendResponse<UserResponse>> getUserById(@PathVariable UUID id) {
        UserResponse response = userManagementService.getUserById(id);
        return ResponseEntity.ok(JSendResponse.success(response));
    }

    @PutMapping("/{id}")
    public ResponseEntity<JSendResponse<UserResponse>> updateUser(@PathVariable UUID id, @RequestBody @Valid UserUpdateRequest request) {
        UserResponse response = userManagementService.updateUser(id, request);
        return ResponseEntity.ok(JSendResponse.success(response));
    }

    @PutMapping("/{id}/deactivate")
    public ResponseEntity<JSendResponse<Void>> deactivateUser(@PathVariable UUID id) {
        userManagementService.deactivateUser(id);
        return ResponseEntity.ok(JSendResponse.success(null));
    }
}
