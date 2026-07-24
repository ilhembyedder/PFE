package com.leasrecover.modules.client;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ClientRepository extends JpaRepository<Client, UUID> {
    Optional<Client> findByContactEmailAndIsDeletedFalse(String contactEmail);
    Optional<Client> findFirstByRegistrationNumberAndIsDeletedFalse(String registrationNumber);
    Optional<Client> findFirstByContactEmailAndIsDeletedFalse(String contactEmail);
    List<Client> findAllByIsDeletedFalse();
    List<Client> findAllByTenantIdAndIsDeletedFalse(UUID tenantId);
}
