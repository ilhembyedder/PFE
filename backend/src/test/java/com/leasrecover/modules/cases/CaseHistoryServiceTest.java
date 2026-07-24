package com.leasrecover.modules.cases;

import com.leasrecover._common.audit.AuditRevisionEntity;
import com.leasrecover.core.tenant.TenantContextHolder;
import com.leasrecover.modules.cases.dto.HistoryEventResponse;
import com.leasrecover.modules.users.AppUser;
import jakarta.persistence.EntityManager;
import org.hibernate.envers.AuditReader;
import org.hibernate.envers.AuditReaderFactory;
import org.hibernate.envers.RevisionType;
import org.hibernate.envers.query.AuditQuery;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.MockitoAnnotations;
import org.springframework.web.server.ResponseStatusException;

import java.time.ZonedDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class CaseHistoryServiceTest {

    @Mock
    private EntityManager entityManager;

    @Mock
    private NoteRepository noteRepository;

    @Mock
    private RecoveryCaseRepository recoveryCaseRepository;

    @InjectMocks
    private CaseHistoryService caseHistoryService;

    private UUID caseId;
    private UUID tenantId;
    private RecoveryCase recoveryCase;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        caseId = UUID.randomUUID();
        tenantId = UUID.randomUUID();
        TenantContextHolder.setTenantUuid(tenantId);

        recoveryCase = new RecoveryCase();
        recoveryCase.setId(caseId);
        recoveryCase.setTenantId(tenantId);
        recoveryCase.setCurrentPhase(RecoveryPhase.PRE_CONTENTIEUX);
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    @Test
    void testGetCaseHistory_Success() {
        when(recoveryCaseRepository.findById(caseId)).thenReturn(Optional.of(recoveryCase));

        // Mock Envers AuditReader
        AuditReader auditReader = mock(AuditReader.class);
        org.hibernate.envers.query.AuditQueryCreator auditQueryCreator = mock(org.hibernate.envers.query.AuditQueryCreator.class);
        AuditQuery auditQuery = mock(AuditQuery.class);

        when(auditReader.createQuery()).thenReturn(auditQueryCreator);
        when(auditQueryCreator.forRevisionsOfEntity(eq(RecoveryCase.class), eq(false), eq(true))).thenReturn(auditQuery);
        when(auditQuery.add(any())).thenReturn(auditQuery);

        // Prepare revisions
        List<Object[]> revisions = new ArrayList<>();
        
        // Revision 1: ADD (Creation)
        RecoveryCase caseRev1 = new RecoveryCase();
        caseRev1.setId(caseId);
        caseRev1.setCurrentPhase(RecoveryPhase.PRE_CONTENTIEUX);
        AuditRevisionEntity revEntity1 = new AuditRevisionEntity();
        revEntity1.setId(1);
        revEntity1.setUserId("user1@example.com");
        revisions.add(new Object[]{caseRev1, revEntity1, RevisionType.ADD});

        // Revision 2: MOD (Phase transition)
        RecoveryCase caseRev2 = new RecoveryCase();
        caseRev2.setId(caseId);
        caseRev2.setCurrentPhase(RecoveryPhase.MISE_EN_DEMEURE);
        AuditRevisionEntity revEntity2 = new AuditRevisionEntity();
        revEntity2.setId(2);
        revEntity2.setUserId("user2@example.com");
        revisions.add(new Object[]{caseRev2, revEntity2, RevisionType.MOD});

        when(auditQuery.getResultList()).thenReturn(revisions);

        // Prepare notes
        AppUser author = new AppUser();
        author.setEmail("author@example.com");
        
        Note note = new Note();
        note.setId(UUID.randomUUID());
        note.setContent("Custom comment");
        note.setAuthor(author);

        ZonedDateTime time1 = ZonedDateTime.parse("2026-06-30T16:00:00Z");
        ZonedDateTime timeNote = ZonedDateTime.parse("2026-06-30T16:30:00Z");
        ZonedDateTime time2 = ZonedDateTime.parse("2026-06-30T17:00:00Z");
        
        revEntity1.setTimestamp(time1.toInstant().toEpochMilli());
        note.setCreatedAt(timeNote);
        revEntity2.setTimestamp(time2.toInstant().toEpochMilli());

        when(noteRepository.findAllByRecoveryCaseIdAndIsDeletedFalseOrderByCreatedAtAsc(caseId))
                .thenReturn(List.of(note));

        List<HistoryEventResponse> history;
        try (MockedStatic<AuditReaderFactory> auditReaderFactoryMockedStatic = mockStatic(AuditReaderFactory.class)) {
            auditReaderFactoryMockedStatic.when(() -> AuditReaderFactory.get(any(EntityManager.class))).thenReturn(auditReader);

            history = caseHistoryService.getCaseHistory(caseId);
        }

        assertNotNull(history);
        assertEquals(3, history.size());

        // Verify order: CASE_CREATED -> NOTE_ADDED -> PHASE_TRANSITION
        assertEquals("CASE_CREATED", history.get(0).getEventType());
        assertEquals("user1@example.com", history.get(0).getActor());

        assertEquals("NOTE_ADDED", history.get(1).getEventType());
        assertEquals("author@example.com", history.get(1).getActor());
        assertTrue(history.get(1).getDescription().contains("Custom comment"));

        assertEquals("PHASE_TRANSITION", history.get(2).getEventType());
        assertEquals("user2@example.com", history.get(2).getActor());
        assertTrue(history.get(2).getDescription().contains("PRE_CONTENTIEUX"));
        assertTrue(history.get(2).getDescription().contains("MISE_EN_DEMEURE"));
    }

    @Test
    void testGetCaseHistory_NotFound() {
        when(recoveryCaseRepository.findById(caseId)).thenReturn(Optional.empty());

        assertThrows(ResponseStatusException.class, () -> caseHistoryService.getCaseHistory(caseId));
    }
}
