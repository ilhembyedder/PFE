package com.leasrecover.modules.cases;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface DocumentRepository extends JpaRepository<Document, UUID> {

    /**
     * Fetch all non-deleted documents for a given case, ordered by creation date ascending.
     */
    List<Document> findAllByRecoveryCaseIdAndIsDeletedFalseOrderByCreatedAtAsc(UUID caseId);

    List<Document> findAllByClientIdAndIsDeletedFalseOrderByCreatedAtAsc(UUID clientId);

    List<Document> findAllByContractIdAndIsDeletedFalseOrderByCreatedAtAsc(UUID contractId);

    List<Document> findAllByVehicleIdAndIsDeletedFalseOrderByCreatedAtAsc(UUID vehicleId);
}
