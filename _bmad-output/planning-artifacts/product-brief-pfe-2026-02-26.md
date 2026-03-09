---
stepsCompleted: [1, 2, 3, 4, 5]
inputDocuments: []
date: 2026-02-26
author: IlhemBENYEDDER
---

# Product Brief: pfe

## Executive Summary

**LeasRecover** est une plateforme SaaS configurable et multi-société destinée aux sociétés de leasing, qui digitalise intégralement le workflow de recouvrement — de la phase pré-contentieuse à la clôture du dossier. Au cœur de la solution se trouve un module intelligent d'estimation de la valeur réelle des véhicules, capable d'analyser des rapports d'expertise uploadés manuellement pour extraire la valeur de marché actuelle, la comparer à la valeur résiduelle initiale, et éclairer les décisions financières critiques. La plateforme remplace les fichiers Excel et les documents papier par un système unifié, traçable et paramétrable selon les spécificités de chaque société de leasing.

---

## Core Vision

### Problem Statement

Les sociétés de leasing gèrent aujourd'hui leur workflow de recouvrement de façon fragmentée : certaines utilisent des fichiers Excel, d'autres des documents papier, sans cohérence ni centralisation. Cette fragmentation s'aggrave lors de l'évaluation des véhicules repris : les experts produisent des rapports non structurés dont les données ne sont ni extraites ni comparées systématiquement à la valeur résiduelle initiale fixée lors du contrat de leasing.

### Problem Impact

Cette situation génère deux catégories de conséquences directement mesurables :
- **Pertes financières** : Des véhicules surévalués ou sous-évalués entraînent des décisions de vente mal calibrées, des provisions insuffisantes et des écarts comptables non anticipés.
- **Décisions erronées** : Sans comparaison systématique entre valeur de marché actuelle et valeur résiduelle initiale, les gestionnaires de recouvrement ne peuvent pas évaluer fiablement la qualité des estimations financières passées ni orienter les négociations avec les acheteurs.

### Why Existing Solutions Fall Short

Les outils actuels (Excel, papier) ne permettent pas :
- La traçabilité complète du dossier de recouvrement à travers toutes ses phases
- L'extraction automatique des données clés depuis les rapports d'expertise
- La comparaison structurée entre valeur résiduelle et valeur de marché réelle
- L'adaptabilité aux processus spécifiques de chaque société de leasing

Il n'existe pas de solution sectorielle couvrant l'intégralité du cycle de recouvrement leasing tout en intégrant un module d'analyse documentaire intelligent.

### Proposed Solution

Une plateforme web configurable et multi-société qui :
1. **Digitalise le workflow complet de recouvrement** : mise en demeure → saisie du véhicule → vente → clôture du dossier, avec suivi d'état, alertes, et historique complet par dossier.
2. **Intègre un module intelligent d'estimation de valeur** : upload de rapports d'expertise → extraction des données clés → calcul de la valeur de marché estimée → comparaison automatique avec la valeur résiduelle initiale → indicateur de fiabilité de l'estimation financière.
3. **Offre une vue unifiée et synthétique** : tableau de bord centralisé résumant l'état des dossiers, les écarts de valorisation et les actions prioritaires.
4. **Est entièrement paramétrable** : chaque société de leasing configure ses propres seuils, étapes de workflow, rôles utilisateurs et modèles de documents.

### Key Differentiators

- 🔁 **Couverture bout-en-bout** : Seule plateforme couvrant l'intégralité du cycle pré-contentieux à la clôture, sans rupture de continuité.
- 🧠 **Module IA documentaire sectoriel** : Extraction intelligente depuis des rapports d'expertise leasing — sans dépendance à des bases de données externes de marché.
- 📊 **Analyse comparative résiduel vs marché** : Indicateur unique de fiabilité des estimations financières initiales, inexistant dans les outils génériques.
- ⚙️ **Configurabilité multi-société** : Paramétrable pour s'adapter aux processus spécifiques de n'importe quelle société de leasing, sans développement custom.

---

## Target Users

### Primary Users

---

#### 🧑‍💼 Persona 1 — Le Gestionnaire de Recouvrement

**Profil : Sonia B., 34 ans — Chargée de Recouvrement**

Sonia travaille dans le département recouvrement d'une société de leasing de taille moyenne. Elle gère en parallèle 30 à 60 dossiers actifs à différents stades : certains en mise en demeure, d'autres en attente de saisie, d'autres encore en phase de vente. Elle est à l'aise avec les outils numériques mais passe aujourd'hui une grande partie de son temps à jongler entre des fichiers Excel, des emails et des documents papier scannés.

**Ses frustrations actuelles :**
- Elle doit retrouver manuellement l'état d'avancement de chaque dossier
- Quand elle reçoit un rapport d'expertise d'un expert véhicule, elle doit extraire manuellement la valeur estimée et la comparer elle-même à la valeur résiduelle inscrite dans le contrat initial
- Elle n'a aucune alerte automatique sur les délais critiques (ex. : délai légal de mise en demeure, deadline de vente)
- Elle perd du temps à reconstituer l'historique d'un dossier pour répondre à son responsable

**Ce qu'elle fait sur la plateforme :**
- Crée et gère les dossiers de recouvrement de A à Z
- Fait avancer le workflow à chaque étape (mise en demeure → saisie → vente → clôture)
- Uploade les rapports d'expertise reçus des experts véhicules
- Consulte l'estimation de valeur générée automatiquement par le système et l'indicateur d'écart avec la valeur résiduelle initiale
- Prend des décisions de vente éclairées sur la base de ces données

**Son moment "aha!" :**
Lorsqu'après avoir uploadé un rapport d'expertise, la plateforme lui affiche instantanément : valeur de marché estimée = 18 500 €, valeur résiduelle initiale = 22 000 €, écart = -16% ⚠️ — et qu'elle comprend en 3 secondes ce qui prenait 30 minutes avant.

---

#### ⚙️ Persona 2 — Le Super Administrateur

**Profil : Karim T., 40 ans — Administrateur Plateforme**

Karim est soit un profil technique de l'équipe LeasRecover, soit un responsable informatique de la société de leasing cliente. Il est le premier utilisateur de la plateforme avant même les gestionnaires : c'est lui qui configure l'environnement de travail de sa société.

**Ses responsabilités sur la plateforme :**
- Configure les étapes du workflow de recouvrement propres à sa société (certaines sociétés ont des étapes intermédiaires spécifiques)
- Définit les rôles utilisateurs et les droits d'accès
- Paramètre les seuils d'alerte (ex. : alerter si écart valeur > 20%)
- Gère les modèles de documents (lettres de mise en demeure, PV de saisie)
- Crée et administre les comptes des gestionnaires de sa société

**Ce qui compte pour lui :**
Une interface d'administration claire, sans nécessiter de développement custom, qui lui permette d'adapter la plateforme en autonomie totale.

---

### Secondary Users

#### 🔮 Acteurs potentiels (périmètre à confirmer en V2)

- **Expert véhicule** : Producteur externe du rapport d'expertise. Il n'est pas utilisateur direct de la plateforme dans la version initiale — c'est le gestionnaire qui uploade le document à sa place. Une future version pourrait lui permettre d'uploader directement.
- **Intervenant juridique** (avocat, huissier) : Acteur potentiel pour les phases contentieuses. Son intégration comme utilisateur reste à définir dans une version future.
- **Acheteur de véhicule** : Non inclus comme acteur de la plateforme — la vente est gérée entièrement par le gestionnaire en interne.

---

### System Actor

#### 🤖 Le Module d'Estimation Intelligent (acteur non-humain)

Le module d'estimation est un acteur système clé — il n'est pas un humain mais joue un rôle central dans la chaîne de valeur de LeasRecover.

**Déclencheur :** Upload d'un rapport d'expertise par le gestionnaire

**Actions automatiques :**
1. Analyse du document uploadé (rapport PDF/scan)
2. Extraction des données clés : marque, modèle, année, kilométrage, état général, valeur estimée par l'expert
3. Comparaison avec la valeur résiduelle initiale du contrat de leasing
4. Calcul de l'écart (en % et en valeur absolue)
5. Génération d'un indicateur de fiabilité financière (✅ fiable / ⚠️ écart modéré / 🚨 écart critique)

**Valeur produite :** Une synthèse décisionnelle instantanée pour le gestionnaire, sans aucune intervention manuelle de calcul.

---

### User Journey — Gestionnaire de Recouvrement

| Étape | Action Sonia | Rôle du Système |
|-------|-------------|-----------------|
| 1. Nouveau dossier | Crée le dossier avec données contrat (dont valeur résiduelle initiale) | Initialise le workflow, première étape = "Pré-contentieux" |
| 2. Mise en demeure | Génère/suit la mise en demeure, enregistre les délais | Alerte si délai légal approche |
| 3. Saisie véhicule | Enregistre la saisie, uploade le rapport d'expertise | Analyse le rapport → extrait valeur de marché → calcule écart → affiche indicateur |
| 4. Décision de vente | Consulte l'estimation et l'indicateur, fixe le prix | Fournit comparatif résiduel vs marché, recommandation |
| 5. Clôture | Clôture le dossier avec le prix de vente réel | Calcule et archive l'écart final entre valeur résiduelle, estimation et prix réel de vente |

---

## Success Metrics

### User Success Metrics

#### 🎯 Métriques de performance pour le Gestionnaire (Sonia)

| Métrique | Situation Actuelle | Objectif LeasRecover | Gain |
|----------|-------------------|---------------------|------|
| Temps d'analyse valeur par dossier | 45-60 min | < 5 min | **-90%** |
| Taux de délais légaux manqués | Non mesuré / élevé | 0% (alertes auto) | **-100%** |
| Dépendance à Excel | 100% des dossiers | 0% (abandon total) | **-100%** |
| Durée du cycle saisie → vente | Référence à établir | Réduction de 20% | **-20%** |

**Définition du succès pour le gestionnaire :**
- Sonia ne consulte plus jamais un fichier Excel pour gérer un dossier
- Aucun délai légal (mise en demeure, saisie, vente) n'est manqué
- L'analyse valeur résiduelle vs. valeur marché est disponible en < 5 min après upload du rapport d'expertise
- Le tableau de bord signale proactivement les dossiers "dormants" et les actions prioritaires à chaque connexion

---

#### 📁 Contexte volumétrique (cible)

La plateforme doit être dimensionnée pour supporter :
- **40 à 80 dossiers actifs** par gestionnaire simultanément
- **300 à 1 000+ dossiers actifs** par société de leasing sur l'ensemble des phases du workflow
- Ce volume justifie la nécessité du tableau de bord, des filtres avancés et des alertes automatiques

---

### Business Objectives

#### 🎯 Objectif stratégique — Double positionnement (Architecture Microservices)

LeasRecover est conçu selon une **architecture microservices** qui répond à deux objectifs business distincts :

1. **Intégration modulaire** : Le module de recouvrement (et le sous-module d'estimation de valeur) peuvent s'intégrer dans des solutions de leasing existantes qui ne disposent pas de fonctionnalité de recouvrement. Cela permet d'enrichir un parc client existant sans repartir de zéro.

2. **Produit standalone** : LeasRecover peut également être déployé comme plateforme indépendante et proposé à n'importe quelle société de leasing ne disposant d'aucune solution digitale de recouvrement.

**Livrable MVP :** Un produit fonctionnel, "pitchable" à de vraies sociétés de leasing, démontrant les deux modes de déploiement.

---

#### 💰 Impact financier attendu

| Levier | Description | Résultat attendu |
|--------|-------------|------------------|
| Meilleure estimation de valeur | Réduction des sous-évaluations d'actifs | Moins de pertes à la vente |
| Provisionnement plus précis | L'écart résiduel vs. marché aide à provisionner correctement | Réduction des provisions non justifiées |
| Accélération du cycle | Passage saisie → vente 20% plus rapide | Amélioration du cash-flow de recouvrement |
| Zéro perte sur délais | Aucun délai légal raté | Élimination des risques juridiques et pénalités |

---

### Key Performance Indicators

#### 🤖 KPIs — Module d'Estimation Intelligent (IA)

| KPI | Description | Cible |
|-----|-------------|-------|
| **Précision d'extraction OCR/NLP** | Exactitude sur les champs structurés clés (immatriculation, kilométrage, valeur expert) | > 95% |
| **Taux de traitement automatique** | % de rapports traités sans intervention manuelle de correction | > 90% |
| **Temps de traitement** | Délai entre upload et affichage du résultat d'estimation | < 30 secondes |
| **Cohérence indicateur fiabilité** | L'indicateur ✅/⚠️/🚨 reflète fidèlement l'écart réel | Validation utilisateur |

#### 📦 KPIs — Plateforme Workflow

| KPI | Description | Cible |
|-----|-------------|-------|
| **Taux d'adoption** | % gestionnaires ayant abandonné Excel après 1 mois | 100% |
| **Temps moyen d'analyse** | Durée moyenne analyse valeur par dossier | < 5 min |
| **Taux d'alertes honorées** | % délais légaux respectés grâce aux alertes | 100% |
| **Accélération du cycle** | Réduction durée cycle saisie → vente | -20% |
| **Dossiers dormants détectés** | % dossiers bloqués signalés proactivement | 100% |

#### 🏢 KPIs — Business / Go-to-Market

| KPI | Description | Cible (MVP) |
|-----|-------------|-------------|
| **Démos réalisées** | Nombre de sociétés de leasing ayant vu le MVP | ≥ 3 |
| **Feedbacks positifs** | % décideurs jugeant la solution "deployable" | > 70% |
| **Intégrations possibles** | Nombre de systèmes leasing existants compatibles | ≥ 1 identifié |

---

## MVP Scope

### Core Features — Ce qu'on construit dans le MVP

#### 🏢 1. Gestion Multi-Tenant
- Onboarding de sociétés de leasing distinctes avec isolation totale des données
- Chaque société voit uniquement ses propres dossiers, utilisateurs et configurations
- Configuration minimale par société : nom, logo, seuils d'alerte, comptes utilisateurs

#### 🔐 2. Authentification & Gestion des Rôles
- Deux rôles MVP : **Super Administrateur** et **Gestionnaire de Recouvrement**
- Login sécurisé avec isolation multi-tenant (un gestionnaire ne voit que les dossiers de sa société)
- Gestion des droits d'accès par rôle

#### 📁 3. Gestion des Dossiers de Recouvrement
- Création et gestion complète des dossiers (CRUD)
- Données du dossier : informations client, données du contrat de leasing, **valeur résiduelle initiale** (champ clé pour la comparaison)
- Historique complet des actions par dossier
- Traçabilité de tous les documents uploadés associés au dossier

#### 🔄 4. Workflow de Recouvrement (5 Phases)

Progression séquentielle à travers les phases :

| Phase | Niveau de logique MVP |
|-------|----------------------|
| **Pré-contentieux** | ✅ Logique complète (délais, alertes, actions) |
| **Mise en demeure** | ✅ Logique complète (délais légaux, alertes critiques) |
| **Saisie du véhicule** | ✅ Logique complète (trigger du module IA à l'upload) |
| **Vente** | 🔘 Changement de statut simple + date de vente + prix réel |
| **Clôture** | 🔘 Changement de statut simple + archivage du dossier |

> Note : Le workflow est **standardisé** — les mêmes étapes s'appliquent à toutes les sociétés de leasing clientes. Pas de customisation des phases.

#### 🔔 5. Alertes Automatiques
- Alertes sur les délais légaux critiques (mise en demeure, saisie)
- Signalement des dossiers "dormants" (aucune action depuis X jours)
- Notifications visibles dans le tableau de bord à chaque connexion

#### 📄 6. Gestion des Documents (Upload Manuel)
- Upload de rapports d'expertise (PDF, scan) associés à la phase de saisie
- Upload de tout document lié au dossier (contrats, courriers) à n'importe quelle phase
- Les utilisateurs gèrent eux-mêmes la production et l'upload des documents

#### 🤖 7. Module IA d'Estimation de Valeur Réelle (NLP/LLM)

**Cœur différenciateur de LeasRecover — Architecture NLP/LLM**

Pipeline de traitement automatique déclenché à l'upload du rapport d'expertise :

1. **Ingestion** : Réception du document PDF/scan uploadé par le gestionnaire
2. **Analyse sémantique (LLM)** : Compréhension contextuelle du rapport d'expertise pour extraire les données clés même si la mise en page varie
3. **Extraction** : Marque, modèle, année, kilométrage, état général du véhicule, valeur estimée par l'expert
4. **Comparaison** : Valeur extraite vs. valeur résiduelle initiale du contrat
5. **Calcul de l'écart** : en valeur absolue et en pourcentage
6. **Indicateur de fiabilité** :
   - ✅ **Fiable** : écart < seuil configurable (ex. : 10%)
   - ⚠️ **Écart modéré** : entre 10% et 20%
   - 🚨 **Écart critique** : > 20% — action recommandée avant mise en vente

#### 📊 8. Tableau de Bord (Dashboard de Base)
- Vue liste de tous les dossiers avec filtres par phase, statut et alertes
- Indicateurs de dossiers en retard ou dormants mis en avant
- Accès rapide aux dossiers prioritaires (alertes actives)
- *Les graphiques analytiques avancés sont optionnels et non bloquants pour le MVP*

---

### Out of Scope for MVP — Ce qu'on ne construit PAS encore

| Fonctionnalité | Raison du report | Version cible |
|----------------|-----------------|---------------|
| **Génération automatique de documents légaux** | Upload manuel suffisant pour le MVP ; complexité juridique et de formatage | V2 |
| **Accès direct Expert Véhicule** | Le gestionnaire gère l'upload à sa place | V2 |
| **Accès Intervenant Juridique** | Périmètre à confirmer | V2 |
| **Customisation des étapes de workflow** | Processus standardisé identique chez tous les clients | Non prévu |
| **Connecteur API RNVP / Immatriculation** | Enrichissement automatique des données véhicule | V2 |
| **Analytics avancés** | Tableau de bord de base suffisant pour valider l'adoption | V2 |
| **Intégration API avec solutions leasing existantes** | Architecture microservices prévue mais connexion = post-MVP | V2 |

---

### MVP Success Criteria

Le MVP est considéré réussi si :

- [ ] Le **module IA** extrait correctement les données de 10+ rapports d'expertise réels avec une précision > 90% sur les champs clés
- [ ] Le **workflow complet** est navigable de A à Z (création → clôture) sans anomalie sur un jeu de données démo
- [ ] La **gestion multi-tenant** est opérationnelle avec isolation complète des données entre deux sociétés de test
- [ ] Les **alertes automatiques** se déclenchent correctement sur les délais critiques simulés
- [ ] Au moins **une société de leasing réelle** a vu une démo et exprimé un intérêt de déploiement

---

### Future Vision — LeasRecover V2+

| Fonctionnalité | Impact attendu |
|----------------|---------------|
| **Connecteur API RNVP & bases immatriculation** | Enrichissement automatique des données véhicule sans upload |
| **Génération automatique de documents légaux** | Mise en demeure, PV de saisie générés en 1 clic |
| **Accès Expert Véhicule** | Upload direct du rapport sans intermédiaire |
| **Accès Intervenant Juridique** | Consultation sécurisée des pièces contentieuses |
| **Module analytique avancé** | Distribution des écarts, scoring prédictif du risque |
| **Intégration API microservices** | Activation du mode "module" dans des solutions leasing existantes |
