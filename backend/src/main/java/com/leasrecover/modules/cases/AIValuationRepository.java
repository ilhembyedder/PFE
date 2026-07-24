package com.leasrecover.modules.cases;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AIValuationRepository extends JpaRepository<AIValuation, UUID> {
    List<AIValuation> findByRecoveryCaseId(UUID caseId);
    Optional<AIValuation> findFirstByRecoveryCaseIdAndStatusOrderByCreatedAtDesc(UUID caseId, String status);
    List<AIValuation> findByRecoveryCaseIdInAndStatus(List<UUID> caseIds, String status);
}
