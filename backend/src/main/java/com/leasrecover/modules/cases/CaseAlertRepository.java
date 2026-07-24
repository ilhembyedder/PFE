package com.leasrecover.modules.cases;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CaseAlertRepository extends JpaRepository<CaseAlert, UUID> {
    List<CaseAlert> findAllByTenantIdAndIsResolvedFalse(UUID tenantId);
    List<CaseAlert> findAllByCaseIdAndIsResolvedFalse(UUID caseId);
    List<CaseAlert> findAllByCaseIdAndAlertTypeAndIsResolvedFalse(UUID caseId, String alertType);
    Optional<CaseAlert> findByCaseIdAndAlertTypeAndIsResolvedFalse(UUID caseId, String alertType);
}
