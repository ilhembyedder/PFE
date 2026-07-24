package com.leasrecover.modules.cases;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.ZonedDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class CaseAlertService {

    private final CaseAlertRepository caseAlertRepository;

    public CaseAlertService(CaseAlertRepository caseAlertRepository) {
        this.caseAlertRepository = caseAlertRepository;
    }

    @Transactional
    public void resolveDormancyAlert(UUID caseId) {
        List<CaseAlert> alerts = caseAlertRepository.findAllByCaseIdAndAlertTypeAndIsResolvedFalse(caseId, "DORMANCY");
        ZonedDateTime now = ZonedDateTime.now();
        for (CaseAlert alert : alerts) {
            alert.setIsResolved(true);
            alert.setResolvedAt(now);
            alert.setUpdatedAt(now);
            caseAlertRepository.save(alert);
        }
    }

    @Transactional
    public void resolveDeadlineAlert(UUID caseId) {
        List<CaseAlert> alerts = caseAlertRepository.findAllByCaseIdAndAlertTypeAndIsResolvedFalse(caseId, "DEADLINE");
        ZonedDateTime now = ZonedDateTime.now();
        for (CaseAlert alert : alerts) {
            alert.setIsResolved(true);
            alert.setResolvedAt(now);
            alert.setUpdatedAt(now);
            caseAlertRepository.save(alert);
        }
    }
}
