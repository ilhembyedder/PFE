package com.leasrecover.modules.cases;

import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import java.util.List;
import java.util.UUID;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

class CasePrerequisiteServiceTest {

    @Mock
    private EntityManager entityManager;

    @Mock
    private Query query;

    @InjectMocks
    private CasePrerequisiteService casePrerequisiteService;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void testCheckPrerequisites_Vente_NoValuation_Fails() {
        RecoveryCase rcase = new RecoveryCase();
        rcase.setId(UUID.randomUUID());
        rcase.setTenantId(UUID.randomUUID());

        when(entityManager.createNativeQuery(anyString())).thenReturn(query);
        when(query.setParameter(anyString(), any())).thenReturn(query);
        when(query.getSingleResult()).thenReturn(0L); // 0 valuations

        List<String> unsatisfied = casePrerequisiteService.checkPrerequisites(rcase, RecoveryPhase.VENTE);

        assertEquals(1, unsatisfied.size());
        assertEquals("L'estimation de valeur par l'IA doit être effectuée et validée avant d'accéder à la phase de Vente.", unsatisfied.get(0));
    }

    @Test
    void testCheckPrerequisites_Vente_WithValuation_Succeeds() {
        RecoveryCase rcase = new RecoveryCase();
        rcase.setId(UUID.randomUUID());
        rcase.setTenantId(UUID.randomUUID());

        when(entityManager.createNativeQuery(anyString())).thenReturn(query);
        when(query.setParameter(anyString(), any())).thenReturn(query);
        when(query.getSingleResult()).thenReturn(1L); // 1 validation

        List<String> unsatisfied = casePrerequisiteService.checkPrerequisites(rcase, RecoveryPhase.VENTE);

        assertTrue(unsatisfied.isEmpty());
    }

    @Test
    void testCheckPrerequisites_OtherPhases_Succeeds() {
        RecoveryCase rcase = new RecoveryCase();
        rcase.setId(UUID.randomUUID());

        List<String> unsatisfied = casePrerequisiteService.checkPrerequisites(rcase, RecoveryPhase.MISE_EN_DEMEURE);
        assertTrue(unsatisfied.isEmpty());

        unsatisfied = casePrerequisiteService.checkPrerequisites(rcase, RecoveryPhase.SAISIE);
        assertTrue(unsatisfied.isEmpty());

        unsatisfied = casePrerequisiteService.checkPrerequisites(rcase, RecoveryPhase.CLOTURE);
        assertTrue(unsatisfied.isEmpty());
    }
}
