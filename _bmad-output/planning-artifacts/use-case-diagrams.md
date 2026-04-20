# LeasRecover - Use Case Diagrams

This document contains visual Use Case representations of the functional requirements found in the LeasRecover platform, modeled using Mermaid flowcharts. The actors include Super Admin, Admin, Gestionnaire, and the System itself.

## 1. Tenant & System Configuration (Administration)

This diagram covers the setup of the application environment by the Super Admin, as well as the initial configuration and compliance policies set by the company's Admin.

```mermaid
flowchart LR
    %% Actors
    SA((Super\nAdmin))
    A((Admin))

    %% Use Cases
    subgraph "Tenant Management (Epic 1)"
        UC1([Créer / Configurer / Désactiver\ndes Tenants])
        UC2([Gérer les comptes\nGestionnaires])
        UC3([Définir les Rôles\net Droits d'accès])
    end

    subgraph "Compliance & Policies (Epic 2)"
        UC4([Configurer l'espace\nmarque, logo])
        UC5([Définir les délais légaux\net seuil de dormance])
        UC6([Configurer les seuils\nde sensibilité IA])
        UC7([Consulter et configurer\nlogs / rétention])
    end

    %% Relationships
    SA --> UC1
    A --> UC2
    A --> UC3
    A --> UC4
    A --> UC5
    A --> UC6
    A --> UC7
```

## 2. Core Entities & Case Management

This module details how Gestionnaires interact with Clients, Contracts, Vehicles, and the core Recovery Cases. Admins can also intervene for reassignment.

```mermaid
flowchart LR
    %% Actors
    G((Gestionnaire))
    A((Admin))

    %% Use Cases
    subgraph "Core Data Management (Epic 7)"
        UC8([Créer/Gérer Clients\net Contrats])
        UC9([Gérer Parc Véhicules])
    end

    subgraph "Recovery Case Management (Epic 3)"
        UC10([Créer un nouveau\nDossier de Recouvrement])
        UC11([Modifier informations\ndu dossier])
        UC12([Réassigner Dossier])
        UC13([Ajouter notes / commentaires])
        UC14([Consulter l'Historique\nAuditable])
        UC15([Exporter Dossier PDF])
    end

    %% Relationships
    G --> UC8
    G --> UC9
    G --> UC10
    G --> UC11
    G --> UC12
    A --> UC12
    G --> UC13
    G --> UC14
    G --> UC15
```

## 3. Workflow Progression, Documents & AI Valuation

This diagram illustrates the daily pipeline tasks. Gestionnaires navigate the 5 phases, while the System dynamically enforces checks, tracks inactivity, and performs AI data extraction.

```mermaid
flowchart LR
    %% Actors
    G((Gestionnaire))
    Sys((Système / IA Service))

    %% Use Cases
    subgraph "Document Vault & Legal Workflow (Epic 4)"
        UC16([Uploader Documents\npar phase ou entité])
        UC17([Consulter les Documents\net Rapports])
        UC18([Faire progresser le\nDossier via les 5 phases])
        UC19([Bloquer la phase si prérequis\nnon satisfaits])
        UC20([Déclencher alertes de\ndélais d'expiration])
    end

    subgraph "AI Valuation Pipeline (Epic 5)"
        UC21([Déclencher Pipeline IA\nsur Rapport Expertise])
        UC22([Extraire Valeur Marché\net Données clés])
        UC23([Calculer l'écart avec\nValeur Résiduelle])
        UC24([Générer Indicateur\nde Fiabilité  ✅/⚠️/🚨])
    end

    %% Relationships
    G --> UC16
    G --> UC17
    G --> UC18
    Sys -.->|Enforcement| UC18
    Sys --> UC19
    Sys --> UC20
    G --> UC21
    Sys -.->|Auto-Trigger| UC21
    Sys --> UC22
    Sys --> UC23
    Sys --> UC24
```

## 4. Command Center Dashboard & Traceability

Focusing on the operational view where Gestionnaires handle their prioritized cases based on system alert feeds.

```mermaid
flowchart LR
    %% Actors
    G((Gestionnaire))
    Sys((Système))

    %% Use Cases
    subgraph "Command Center Dashboard (Epic 6)"
        UC25([Consulter la liste\nfiltrable des dossiers])
        UC26([Visualiser alertes critiques\nau premier plan])
        UC27([Accès direct aux\nactions requises])
        UC28([Désactiver alertes\nautomatiquement post-action])
    end

    subgraph "Security & Traceability"
        UC29([S'authentifier via JWT\net RBAC])
        UC30([Enregistrer l'Audit Trail\nimmuable])
        UC31([Garantir l'Isolation\nMulti-Tenant])
    end

    %% Relationships
    G --> UC25
    G --> UC26
    G --> UC27
    Sys --> UC28
    G --> UC29
    Sys --> UC30
    Sys --> UC31
```
