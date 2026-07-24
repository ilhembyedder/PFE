package com.leasrecover.modules.cases;

import com.leasrecover.modules.cases.dto.HistoryEventResponse;
import com.leasrecover._common.audit.AuditRevisionEntity;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.hibernate.envers.AuditReader;
import org.hibernate.envers.AuditReaderFactory;
import org.hibernate.envers.RevisionType;
import org.hibernate.envers.query.AuditEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.*;

@Service
public class CaseHistoryService {

    private final NoteRepository noteRepository;
    private final RecoveryCaseRepository recoveryCaseRepository;
    private final EntityManager entityManager;

    public CaseHistoryService(
            NoteRepository noteRepository,
            RecoveryCaseRepository recoveryCaseRepository,
            EntityManager entityManager) {
        this.noteRepository = noteRepository;
        this.recoveryCaseRepository = recoveryCaseRepository;
        this.entityManager = entityManager;
    }

    @Transactional(readOnly = true)
    public List<HistoryEventResponse> getCaseHistory(UUID caseId) {
        // Verify case exists
        RecoveryCase targetCase = recoveryCaseRepository.findById(caseId)
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.NOT_FOUND, "Case not found"));

        AuditReader auditReader = AuditReaderFactory.get(entityManager);
        
        @SuppressWarnings("unchecked")
        List<Object[]> revisions = auditReader.createQuery()
                .forRevisionsOfEntity(RecoveryCase.class, false, true)
                .add(AuditEntity.id().eq(caseId))
                .getResultList();

        List<HistoryEventResponse> events = new ArrayList<>();

        for (int i = 0; i < revisions.size(); i++) {
            Object[] revision = revisions.get(i);
            RecoveryCase currentCase = (RecoveryCase) revision[0];
            AuditRevisionEntity revEntity = (AuditRevisionEntity) revision[1];
            RevisionType revType = (RevisionType) revision[2];

            ZonedDateTime timestamp = ZonedDateTime.ofInstant(
                    Instant.ofEpochMilli(revEntity.getTimestamp()),
                    ZoneId.systemDefault()
            );
            String actor = revEntity.getUserId() != null ? revEntity.getUserId() : "System";

            if (i == 0 || revType == RevisionType.ADD) {
                events.add(HistoryEventResponse.builder()
                        .eventType("CASE_CREATED")
                        .timestamp(timestamp)
                        .actor(actor)
                        .description("Dossier créé - Phase initiale: " + currentCase.getCurrentPhase())
                        .build());
            } else {
                RecoveryCase prevCase = (RecoveryCase) revisions.get(i - 1)[0];
                boolean changeDetected = false;

                // Check phase transition
                if (!Objects.equals(prevCase.getCurrentPhase(), currentCase.getCurrentPhase())) {
                    events.add(HistoryEventResponse.builder()
                            .eventType("PHASE_TRANSITION")
                            .timestamp(timestamp)
                            .actor(actor)
                            .description("Changement de phase: de " + prevCase.getCurrentPhase() + " à " + currentCase.getCurrentPhase())
                            .build());
                    changeDetected = true;
                }

                // Check assignee change
                String prevAssigneeEmail = prevCase.getAssignee() != null ? prevCase.getAssignee().getEmail() : null;
                String currentAssigneeEmail = currentCase.getAssignee() != null ? currentCase.getAssignee().getEmail() : null;
                if (!Objects.equals(prevAssigneeEmail, currentAssigneeEmail)) {
                    String description = currentAssigneeEmail != null 
                            ? "Dossier assigné à: " + currentAssigneeEmail
                            : "Dossier désassigné";
                    events.add(HistoryEventResponse.builder()
                            .eventType("ASSIGNMENT_CHANGED")
                            .timestamp(timestamp)
                            .actor(actor)
                            .description(description)
                            .build());
                    changeDetected = true;
                }

                // Check status change
                if (!Objects.equals(prevCase.getStatus(), currentCase.getStatus())) {
                    events.add(HistoryEventResponse.builder()
                            .eventType("DETAILS_MODIFIED")
                            .timestamp(timestamp)
                            .actor(actor)
                            .description("Statut mis à jour: de " + prevCase.getStatus() + " à " + currentCase.getStatus())
                            .build());
                    changeDetected = true;
                }

                // Check initial residual value change
                if (!Objects.equals(prevCase.getInitialResidualValueCents(), currentCase.getInitialResidualValueCents())) {
                    events.add(HistoryEventResponse.builder()
                            .eventType("DETAILS_MODIFIED")
                            .timestamp(timestamp)
                            .actor(actor)
                            .description("Valeur résiduelle modifiée: " + currentCase.getInitialResidualValueCents() + " " + currentCase.getCurrencyCode())
                            .build());
                    changeDetected = true;
                }

                // If revision type is MOD but no specific monitored field changed, log details modified
                if (!changeDetected && revType == RevisionType.MOD) {
                    events.add(HistoryEventResponse.builder()
                            .eventType("DETAILS_MODIFIED")
                            .timestamp(timestamp)
                            .actor(actor)
                            .description("Dossier mis à jour")
                            .build());
                }
            }
        }

        // Fetch notes associated with the case
        List<Note> notes = noteRepository.findAllByRecoveryCaseIdAndIsDeletedFalseOrderByCreatedAtAsc(caseId);
        for (Note note : notes) {
            String authorEmail = note.getAuthor() != null ? note.getAuthor().getEmail() : "System";
            ZonedDateTime noteTimestamp = note.getCreatedAt() != null 
                    ? note.getCreatedAt().withZoneSameInstant(ZoneId.systemDefault()) 
                    : null;
            events.add(HistoryEventResponse.builder()
                    .eventType("NOTE_ADDED")
                    .timestamp(noteTimestamp)
                    .actor(authorEmail)
                    .description("Note ajoutée: " + note.getContent())
                    .build());
        }

        // Sort combined list chronologically by timestamp ascending
        events.sort(Comparator.comparing(HistoryEventResponse::getTimestamp));

        return events;
    }
}
