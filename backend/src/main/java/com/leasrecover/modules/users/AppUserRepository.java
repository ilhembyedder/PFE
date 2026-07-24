package com.leasrecover.modules.users;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface AppUserRepository extends JpaRepository<AppUser, UUID> {
    Optional<AppUser> findByEmail(String email);
    Optional<AppUser> findByEmailAndIsDeletedFalse(String email);
    java.util.List<AppUser> findAllByIsDeletedFalse();
    java.util.List<AppUser> findAllByTenantIdAndRoleAndIsDeletedFalse(java.util.UUID tenantId, String role);
}
