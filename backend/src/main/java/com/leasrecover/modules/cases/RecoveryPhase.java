package com.leasrecover.modules.cases;

public enum RecoveryPhase {
    PRE_CONTENTIEUX,
    MISE_EN_DEMEURE,
    SAISIE,
    VENTE,
    CLOTURE;

    public RecoveryPhase getNextPhase() {
        switch (this) {
            case PRE_CONTENTIEUX:
                return MISE_EN_DEMEURE;
            case MISE_EN_DEMEURE:
                return SAISIE;
            case SAISIE:
                return VENTE;
            case VENTE:
                return CLOTURE;
            case CLOTURE:
            default:
                throw new IllegalStateException("Cannot advance phase from " + this);
        }
    }
}
