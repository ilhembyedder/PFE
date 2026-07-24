package com.leasrecover.modules.cases;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class RecoveryPhaseTest {

    @Test
    void testGetNextPhase_Success() {
        assertEquals(RecoveryPhase.MISE_EN_DEMEURE, RecoveryPhase.PRE_CONTENTIEUX.getNextPhase());
        assertEquals(RecoveryPhase.SAISIE, RecoveryPhase.MISE_EN_DEMEURE.getNextPhase());
        assertEquals(RecoveryPhase.VENTE, RecoveryPhase.SAISIE.getNextPhase());
        assertEquals(RecoveryPhase.CLOTURE, RecoveryPhase.VENTE.getNextPhase());
    }

    @Test
    void testGetNextPhase_Cloture_ThrowsException() {
        assertThrows(IllegalStateException.class, () -> RecoveryPhase.CLOTURE.getNextPhase());
    }
}
