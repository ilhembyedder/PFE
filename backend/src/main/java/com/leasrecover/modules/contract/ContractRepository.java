package com.leasrecover.modules.contract;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ContractRepository extends JpaRepository<Contract, UUID> {
    List<Contract> findAllByTenantIdAndIsDeletedFalse(UUID tenantId);
    List<Contract> findAllByClientIdAndIsDeletedFalse(UUID clientId);
    List<Contract> findAllByTenantIdAndStatusAndIsDeletedFalse(UUID tenantId, String status);
    Optional<Contract> findByReferenceNumberAndTenantIdAndIsDeletedFalse(String referenceNumber, UUID tenantId);
}
