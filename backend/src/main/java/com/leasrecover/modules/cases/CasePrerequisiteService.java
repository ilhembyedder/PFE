package com.leasrecover.modules.cases;

import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class CasePrerequisiteService {

    private final EntityManager entityManager;

    public CasePrerequisiteService(EntityManager entityManager) {
        this.entityManager = entityManager;
    }

    @Transactional(readOnly = true)
    public List<String> checkPrerequisites(RecoveryCase recoveryCase, RecoveryPhase targetPhase) {
        List<String> unsatisfied = new ArrayList<>();

        if (targetPhase == RecoveryPhase.VENTE) {
            if (!hasValidAiValuation(recoveryCase.getId(), recoveryCase.getTenantId())) {
                unsatisfied.add("L'estimation de valeur par l'IA doit être effectuée et validée avant d'accéder à la phase de Vente.");
            }
        }
        // Hooks to support check constraints for other phases
        else if (targetPhase == RecoveryPhase.MISE_EN_DEMEURE) {
            checkMiseEnDemeurePrerequisites(recoveryCase, unsatisfied);
        } else if (targetPhase == RecoveryPhase.SAISIE) {
            checkSaisiePrerequisites(recoveryCase, unsatisfied);
        } else if (targetPhase == RecoveryPhase.CLOTURE) {
            checkCloturePrerequisites(recoveryCase, unsatisfied);
        }

        return unsatisfied;
    }

    private boolean hasValidAiValuation(UUID caseId, UUID tenantId) {
        Query query = entityManager.createNativeQuery(
            "SELECT COUNT(*) FROM ai_valuation WHERE case_id = :caseId AND tenant_id = :tenantId AND status IN ('SUCCESS', 'COMPLETED') AND is_deleted = false"
        );
        query.setParameter("caseId", caseId);
        query.setParameter("tenantId", tenantId);
        long count = ((Number) query.getSingleResult()).longValue();
        return count > 0;
    }

    private void checkMiseEnDemeurePrerequisites(RecoveryCase recoveryCase, List<String> unsatisfied) {
        // Hook: e.g. check if a required contract document exists
    }

    private void checkSaisiePrerequisites(RecoveryCase recoveryCase, List<String> unsatisfied) {
        // Hook: e.g. check if a legal document exists
    }

    private void checkCloturePrerequisites(RecoveryCase recoveryCase, List<String> unsatisfied) {
        // Hook: e.g. check if case status can be closed
    }
}
