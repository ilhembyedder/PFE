package com.leasrecover.modules.cases;

import org.springframework.data.jpa.domain.Specification;
import jakarta.persistence.criteria.*;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import com.leasrecover.modules.contract.Contract;
import com.leasrecover.core.tenant.TenantContextHolder;

public class CaseSpecification {

    public static Specification<RecoveryCase> filterCases(String phase, String status, String reliabilityIndicator) {
        return (Root<RecoveryCase> root, CriteriaQuery<?> query, CriteriaBuilder cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // 1. tenantId (UUID): Enforce strictly matching TenantContextHolder.getTenantUuid()
            UUID tenantUuid = TenantContextHolder.getTenantUuid();
            if (tenantUuid != null) {
                predicates.add(cb.equal(root.get("tenantId"), tenantUuid));
            } else {
                predicates.add(cb.disjunction());
            }

            // 2. currentPhase (String): optional filter
            if (phase != null && !phase.trim().isEmpty()) {
                try {
                    RecoveryPhase phaseEnum = RecoveryPhase.valueOf(phase.toUpperCase());
                    predicates.add(cb.equal(root.get("currentPhase"), phaseEnum));
                } catch (IllegalArgumentException e) {
                    predicates.add(cb.disjunction());
                }
            }

            // 3. status (String): optional filter (e.g. 'ACTIVE')
            if (status != null && !status.trim().isEmpty()) {
                predicates.add(cb.equal(root.get("status"), status));
            }

            // 4. reliabilityIndicator (String): Join ai_valuation table and filter where reliability_indicator matches the parameter
            if (reliabilityIndicator != null && !reliabilityIndicator.trim().isEmpty()) {
                Subquery<UUID> subquery = query.subquery(UUID.class);
                Root<AIValuation> aiValuationRoot = subquery.from(AIValuation.class);
                subquery.select(aiValuationRoot.get("recoveryCase").get("id"))
                        .where(
                            cb.equal(aiValuationRoot.get("reliabilityIndicator"), reliabilityIndicator),
                            cb.equal(aiValuationRoot.get("status"), "SUCCESS")
                        );
                predicates.add(root.get("id").in(subquery));
            }

            // Fetch associations (Client, Contract, AppUser) in a single query to avoid N+1 queries.
            // Avoid fetching in count queries (which return Long/long).
            if (query.getResultType() != Long.class && query.getResultType() != long.class) {
                Fetch<RecoveryCase, Contract> contractFetch = root.fetch("contract", JoinType.LEFT);
                contractFetch.fetch("client", JoinType.LEFT);
                root.fetch("assignee", JoinType.LEFT);
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
