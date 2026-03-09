---
stepsCompleted: [step-01-init, step-02-discovery, step-02b-vision, step-02c-executive-summary, step-03-success, step-04-journeys, step-05-domain, step-06-innovation, step-07-project-type, step-08-scoping, step-09-functional, step-10-nonfunctional, step-11-polish, step-12-complete]
inputDocuments: [product-brief-pfe-2026-02-26.md]
workflowType: 'prd'
briefCount: 1
researchCount: 0
brainstormingCount: 0
projectDocsCount: 0
classification:
  projectType: saas_b2b
  domain: fintech
  complexity: high
  projectContext: greenfield
  market: multi-market
---

# Product Requirements Document — LeasRecover

**Author:** IlhemBENYEDDER
**Date:** 2026-03-04
**Version:** 1.0 — MVP

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Project Classification](#project-classification)
3. [Success Criteria](#success-criteria)
4. [Product Scope & Roadmap](#product-scope--roadmap)
5. [User Journeys](#user-journeys)
6. [Domain-Specific Requirements](#domain-specific-requirements)
7. [Innovation & Novel Patterns](#innovation--novel-patterns)
8. [SaaS B2B Architecture Requirements](#saas-b2b-architecture-requirements)
9. [Project Scoping & Development Phasing](#project-scoping--development-phasing)
10. [Functional Requirements](#functional-requirements)
11. [Non-Functional Requirements](#non-functional-requirements)

---

## Executive Summary

LeasRecover est une plateforme SaaS B2B multi-tenant destinée aux sociétés de leasing, conçue pour digitaliser et automatiser l'intégralité du processus de recouvrement — de la phase pré-contentieuse à la clôture du dossier.

Le problème central n'est pas seulement la fragmentation des outils (Excel, papier) — c'est le **temps et les ressources perdus** à gérer manuellement des tâches critiques, combiné à un **risque juridique réel** : en phase pré-contentieuse, l'omission ou le retard dans l'envoi des éléments requis au client peut invalider l'ensemble de la procédure de recouvrement. LeasRecover élimine ce risque en automatisant la conformité légale à chaque étape du workflow.

LeasRecover comble le chaînon manquant dans les écosystèmes leasing existants : là où une solution de leasing couvre la gestion des contrats, LeasRecover prend le relais dès qu'un dossier entre en phase de recouvrement. Il se déploie en **mode module intégrable** dans une solution existante, ou en **plateforme standalone** pour toute société de leasing sans solution digitale de recouvrement.

> *« LeasRecover transforme un processus juridique long et incertain en une machine de guerre opérationnelle, en automatisant la conformité légale et en calculant instantanément la valeur réelle de vos actifs pour maximiser votre recouvrement financier. »*

### Ce qui rend LeasRecover unique

L'aha! moment est immédiat et mesurable : le gestionnaire uploade un rapport d'expertise véhicule, et en quelques secondes la plateforme affiche côte à côte **valeur de marché estimée | valeur résiduelle initiale | écart en % et en valeur absolue** — une synthèse décisionnelle qui prenait auparavant 30 à 60 minutes de travail manuel.

Trois différenciateurs structurels absents de toute solution générique :
1. **Couverture bout-en-bout** : workflow complet pré-contentieux → clôture, sans rupture de continuité.
2. **Module IA documentaire sectoriel** : extraction LLM/NLP depuis des rapports d'expertise leasing et comparaison automatique résiduel vs. marché.
3. **Conformité juridique automatisée** : chaque étape déclenche les actions requises et alerte sur les délais légaux critiques, éliminant le risque d'invalidation procédurale.

---

## Project Classification

| Dimension | Valeur |
|---|---|
| **Project Type** | SaaS B2B — Multi-tenant, role-based, configurable |
| **Domain** | Fintech — Valorisation d'actifs financiers + recouvrement de créances + conformité juridique |
| **Complexity** | High — Domaine financier réglementé + LLM/NLP + multi-tenant + deadline compliance |
| **Project Context** | Greenfield — Construction from scratch |
| **Market** | Multi-marché — Adaptable au cadre juridique du pays de déploiement |
| **Deployment Mode** | Module intégrable OU plateforme standalone |

---

## Success Criteria

### User Success

**Gestionnaire de recouvrement (Sonia) :**
- **Zéro Excel** : Aucun dossier de recouvrement géré hors de la plateforme après onboarding.
- **Analyse valeur instantanée** : Après upload d'un rapport d'expertise, la synthèse valeur marché / résiduelle / écart est disponible en < 30 secondes.
- **Zéro délai légal manqué** : 100% des alertes sur délais critiques déclenchées et visibles avant expiration.
- **Historique complet** : Chaque dossier expose l'historique exhaustif consultable en < 3 clics.
- **Dossiers prioritaires en évidence** : À chaque connexion, alertes actives mises en avant sans action du gestionnaire.

**Admin société (Karim) :**
- Configuration complète d'un nouveau compte société (rôles, seuils, utilisateurs) en autonomie totale, sans assistance technique externe.

### Business Success

| Horizon | Métrique | Cible |
|---|---|---|
| **MVP Validation** | Sociétés de leasing ayant vu une démo end-to-end | ≥ 3 |
| **MVP Validation** | Décideurs jugeant le produit "déployable en l'état" | > 70% |
| **MVP Validation** | Intégration modulaire identifiée avec solution leasing existante | ≥ 1 confirmée |
| **Post-MVP** | Taux d'adoption (abandon Excel après 1 mois) | 100% |
| **Post-MVP** | Réduction du cycle saisie → vente | -20% |

### Measurable Outcomes

| Critère | Mesure | Cible MVP |
|---|---|---|
| Précision extraction IA | Champs corrects / total rapports testés | > 95% |
| Fiabilité traitement IA | Rapports traités sans correction / total | > 90% |
| Vitesse module IA | Temps upload → résultat | < 30 sec |
| Workflow navigabilité | Création → Clôture sans anomalie | 100% |
| Alertes deadline | Déclenchements corrects / délais critiques simulés | 100% |
| Isolation tenant | Tests de fuite croisée | 0 fuite |
| Performance liste | Chargement 1 000 dossiers | < 2 sec |
| Disponibilité | Uptime mesuré | ≥ 99.5% |

---

## Product Scope & Roadmap

### MVP — Phase 1

✅ **Inclus dans le MVP :**

| # | Feature | Justification |
|---|---|---|
| 1 | **Authentification & RBAC** (3 rôles) | Foundation non-négociable |
| 2 | **Multi-tenant production-grade** | Core architecture livrable |
| 3 | **Gestion des dossiers** (CRUD + historique + traçabilité) | Cœur opérationnel |
| 4 | **Workflow 5 phases** + transitions conditionnelles enforced | Différenciateur #2 — conformité juridique |
| 5 | **Alertes délais légaux** configurables | Zéro délai manqué |
| 6 | **Upload de documents** (toutes phases) | Déclencheur IA + traçabilité |
| 7 | **Module IA** (LLM/NLP : extraction → comparaison → indicateur) | Différenciateur #1 — valeur core |
| 8 | **Dashboard** (liste filtrée, alertes prioritaires) | Expérience gestionnaire complète |
| 9 | **Interface Admin** (seuils, délais, utilisateurs, logo) | Onboarding autonome |
| 10 | **Audit trail immuable** + export dossier PDF | Conformité RGPD + opposabilité |

### V2 — Post-livraison

🔘 **Enrichissement produit :**
- Génération automatique de documents légaux (mise en demeure, PV de saisie)
- Accès direct Expert Véhicule (upload sans intermédiaire)
- Accès Intervenant Juridique (consultation sécurisée)
- Connecteur API RNVP / bases d'immatriculation
- Rôle Manager (supervision read-only)
- Module analytique avancé (distribution des écarts, scoring prédictif)
- Self-service onboarding tenant
- Intégration API microservices avec solutions leasing existantes

### V3+ — Vision plateforme

🔮 **LeasRecover comme référence sectorielle :**
- Scoring prédictif de risque de défaut sur portefeuille complet
- Benchmarking inter-sociétés (anonymisé) sur qualité des estimations résiduelles
- API ouverte pour intégration native dans tout ERP/LMS leasing
- Interface mobile pour gestionnaires terrain

---

## User Journeys

### Journey 1 — Sonia, Happy Path : De la mise en demeure à la décision de vente

*Il est 9h15. Sonia ouvre LeasRecover : 47 dossiers actifs, 3 alertes prioritaires en rouge.*

Elle clique sur **Dupont Logistics — Contrat #LC-2024-0892**, en phase *Mise en demeure* depuis 12 jours. Il reste **3 jours** avant expiration du délai légal. Elle valide l'envoi de la mise en demeure et fait passer le dossier à la phase *Saisie du véhicule*.

Deux jours plus tard, le rapport d'expertise arrive. Elle l'uploade. En **18 secondes** :

> 🚗 **BMW 520d — 2020 — 87 000 km**
> Valeur de marché estimée : **18 400 €**
> Valeur résiduelle initiale (contrat) : **22 000 €**
> Écart : **-16.4%** ⚠️ Écart modéré

La valorisation initiale était trop optimiste. Elle fait passer le dossier en phase *Vente*, fixe un prix plancher cohérent, et ajoute une note. Ce qui lui prenait 45 minutes lui a pris **4 minutes**.

**Capabilities révélées :** pipeline IA temps-réel, affichage comparatif résiduel/marché, transition de phase, historique automatique, timer délai légal.

---

### Journey 2 — Sonia, Edge Case : Le rapport que l'IA ne peut pas lire

*Sonia uploade un rapport scanné en basse résolution — pages de travers, écriture manuscrite partielle.*

Après 30 secondes :

> ⚠️ **Traitement IA échoué** — Document illisible ou format non reconnu.
> [🔁 Réessayer] [📄 Uploader un nouveau document]

Elle contacte l'expert, obtient un meilleur scan, le réuploade. En 22 secondes, l'extraction réussit.

**Règle critique :** La valeur finale doit **toujours provenir du module IA** — pas de saisie manuelle possible. Sans estimation IA validée, la transition vers la phase Vente est bloquée.

**Capabilities révélées :** gestion d'erreur gracieuse, message actionnable, retry sans perte de contexte, blocage conditionnel de transition de phase.

---

### Journey 3 — Admin, Onboarding d'une nouvelle société de leasing

*MediLease SA vient d'acquérir LeasRecover. L'Admin reçoit ses accès.*

Il configure en 4 étapes :
1. **Identité société** : nom, logo
2. **Seuils d'alerte** : écart IA à 15%, dormance à 5 jours ouvrés
3. **Rôles & utilisateurs** : 3 gestionnaires créés, droits attribués, emails de notification définis
4. **Validation** : dossier de test automatique

En **45 minutes**, MediLease SA est opérationnelle. Les gestionnaires reçoivent leurs invitations.

**Capabilities révélées :** interface admin guidée, configuration des seuils, gestion des utilisateurs, onboarding autonome.

---

### Journey 4 — Sonia, Urgence : Alerte délai critique à la connexion

*Sonia revient de 3 jours de congé. Elle se connecte à 8h30.*

Dashboard immédiat en rouge :

> 🚨 **2 dossiers en alerte critique**
> — **Martin SARL** : délai de mise en demeure expire **aujourd'hui à 23h59**
> — **Garage Ferrero** : délai de saisie expire dans **1 jour**

Elle traite les deux dossiers directement depuis les alertes. En **12 minutes**, les deux sont sécurisés. Aucun délai légal compromis — y compris pendant son absence.

**Capabilities révélées :** dashboard alertes prioritaires, tri par urgence, accès rapide depuis alerte, désactivation automatique après action, persistance inter-sessions.

---

### Journey Requirements Summary

| Capacité révélée | Journeys |
|---|---|
| Pipeline IA upload → extraction → comparaison résiduel/marché | J1, J2 |
| Affichage comparatif temps-réel (marché / résiduelle / écart / indicateur) | J1 |
| Gestion d'erreur IA + retry sans perte de contexte | J2 |
| Blocage conditionnel de transition de phase | J2 |
| Transitions de phase avec historique horodaté | J1, J4 |
| Alertes deadline légales avec décompte | J1, J4 |
| Dashboard prioritaire (alertes rouge/orange) | J4 |
| Historique complet et traçabilité par dossier | J1, J2 |
| Interface admin avec configuration guidée | J3 |
| Seuils configurables (écart IA, dormance) | J3 |
| Gestion des utilisateurs et rôles | J3 |
| Réassignation de dossier entre gestionnaires | Transverse |
| Upload et association de documents à chaque phase | J1, J2 |

---

## Domain-Specific Requirements

### Compliance & Regulatory

**Protection des données personnelles :**
- **Marchés cibles : Europe (RGPD) + Tunisie (Loi organique n°63-2004)**
- Les dossiers contiennent des données à caractère personnel → traitement soumis aux deux cadres légaux
- Chaque société cliente définit sa politique de rétention des données conforme à sa juridiction
- Base légale documentée, droit d'accès et de rectification garantis

**Délais juridiques du processus de recouvrement :**
- Les délais légaux (mise en demeure, saisie, vente) sont **entièrement configurables** par l'Admin selon le droit applicable dans le pays de déploiement
- Aucun délai légal hardcodé — la plateforme enforce les délais configurés

**Preuve & Opposabilité :**
- Chaque action critique est **horodatée et non modifiable** (audit trail immuable)
- L'historique complet d'un dossier est **exportable** (PDF) comme pièce justificative opposable en contentieux

### Technical Constraints

**Audit Trail & Logs :**
- **Log applicatif** : toutes actions utilisateurs enregistrées (timestamp + acteur + données avant/après)
- **Log système** : logs serveur conservés pour diagnostic et preuve de disponibilité
- Rétention configurable par tenant (minimum recommandé : 5 ans pour données financières)
- Export accessible à l'Admin (JSON ou CSV)

**Sécurité :**
- Chiffrement au repos (AES-256) et en transit (TLS 1.2+)
- Sessions sécurisées avec timeout configurable
- Isolation multi-tenant au niveau base de données — zéro tolérance
- Accès role-based strict : un gestionnaire ne voit que les dossiers de son tenant
- Journaux d'accès aux données personnelles (qui, quoi, quand)

### Integration Requirements

- **MVP** : Standalone — aucune intégration externe, upload fichiers locaux (PDF, images)
- **Post-MVP** : API microservices vers solution leasing existante + connecteur RNVP

### Risk Mitigations

| Risque | Probabilité | Impact | Mitigation |
|---|---|---|---|
| Incident de confidentialité inter-tenant | Faible | Critique | Tests d'isolation dédiés, cloisonnement DB par tenant |
| Non-conformité RGPD / Loi 63-2004 | Moyenne | Élevé | Politique de rétention configurable, audit trail immuable |
| Perte de preuves en contentieux | Faible | Critique | Export dossier horodaté + logs immuables |
| IA produit une valeur erronée | Moyenne | Élevé | Indicateur de fiabilité visible, validation sur ≥ 10 rapports réels avant MVP |
| Délai légal mal configuré par l'Admin | Moyenne | Élevé | Validation de cohérence obligatoire + alerte de confirmation |

---

## Innovation & Novel Patterns

### Innovations Détectées

**1. Pipeline LLM/NLP sectoriel — Extraction documentaire leasing**

LeasRecover intègre un pipeline d'analyse sémantique spécialisé sur les rapports d'expertise véhicule du recouvrement leasing. Contrairement aux solutions OCR génériques, il :
- Comprend les variations structurelles entre différents formats de rapports d'expertise
- Extrait automatiquement les champs clés : marque, modèle, kilométrage, état général, valeur estimée
- Produit une **valeur de marché estimée** comparable à la **valeur résiduelle initiale du contrat**
- Génère un **indicateur de fiabilité financière** (✅/⚠️/🚨) actionnable par un non-expert

Cette comparaison automatique résiduel vs. marché depuis un document non structuré n'existe dans aucune solution sectorielle connue.

**2. Moteur de conformité juridique configurable par déploiement**

LeasRecover abstrait les exigences légales comme paramètres configurables :
- Délais légaux définis par l'Admin selon le droit du pays de déploiement (aucun délai hardcodé)
- Transitions de phase conditionnelles et enforced (ex. : pas de Vente sans estimation IA validée)
- Audit trail immuable pour opposabilité des preuves
- Déploiement multi-marchés sans redéveloppement

### Market Context

Le marché des logiciels de recouvrement est dominé par des solutions génériques (ERP, CRM adaptés) qui ne couvrent pas le workflow spécifique du recouvrement leasing avec valorisation d'actifs. Les solutions leasing existantes s'arrêtent à la détection du défaut — LeasRecover commence là où elles s'arrêtent.

L'application de LLMs à l'analyse de documents d'expertise leasing avec comparaison résiduel/marché est une combinaison originale non adressée par l'offre actuelle.

### Validation des Innovations

| Innovation | Validation MVP | Critère de succès |
|---|---|---|
| Pipeline LLM/NLP | Test sur ≥ 10 rapports d'expertise réels variés | Précision extraction > 95% sur champs clés |
| Indicateur fiabilité | Validation utilisateur sur pertinence décisionnelle | Jugé "utile" par ≥ 3 gestionnaires réels |
| Conformité configurable | Test avec 2 profils pays différents | Zéro contournement possible des règles enforced |

| Risque Innovation | Fallback |
|---|---|
| LLM échoue sur formats trop hétérogènes | Retry + message actionnable ; fine-tuning sectoriel en V2 |
| Indicateur mal calibré | Seuils configurables par l'Admin |
| Délais mal paramétrés | Validation obligatoire + confirmation à la configuration |

---

## SaaS B2B Architecture Requirements

### Tenant Model

**Architecture multi-tenant à isolation stricte :**
- Chaque société de leasing cliente = un **tenant indépendant**
- Isolation au niveau base de données : aucune donnée d'un tenant accessible depuis un autre
- Chaque tenant a son propre espace de configuration : workflow, seuils, délais, utilisateurs, logo
- L'onboarding d'un nouveau tenant est initié par le **Super Admin** (éditeur LeasRecover) — pas de self-service dans le MVP

### RBAC Matrix

**3 rôles MVP :**

| Rôle | Niveau | Portée | Responsabilités |
|---|---|---|---|
| **Super Admin** | Éditeur (LeasRecover) | Toutes les sociétés | Création et gestion des tenants, onboarding des sociétés clientes |
| **Admin** | Société cliente | Son tenant uniquement | Configuration de l'environnement (workflow, seuils, délais) ; gestion des comptes Gestionnaire |
| **Gestionnaire** | Utilisateur opérationnel | Dossiers de son tenant | Gestion des dossiers, upload, workflow, consultation IA |

**Règles fondamentales :**
- L'**Admin** configure mais **ne gère pas de dossiers** — séparation stricte des rôles
- Le **Gestionnaire** ne voit que les dossiers de son tenant
- Le **Super Admin** ne peut pas accéder au contenu des dossiers clients
- Rôle **Manager** (supervision read-only) envisagé en V2 — hors MVP

**Matrice des permissions MVP :**

| Permission | Super Admin | Admin | Gestionnaire |
|---|---|---|---|
| Créer / supprimer un tenant | ✅ | ❌ | ❌ |
| Configurer workflow, seuils, délais | ❌ | ✅ | ❌ |
| Créer des comptes utilisateurs | ❌ | ✅ (son tenant) | ❌ |
| Créer / modifier un dossier | ❌ | ❌ | ✅ |
| Uploader un rapport d'expertise | ❌ | ❌ | ✅ |
| Consulter l'estimation IA | ❌ | ❌ | ✅ |
| Exporter l'historique d'un dossier | ❌ | ✅ | ✅ |
| Accéder aux logs système | ❌ | ✅ (son tenant) | ❌ |
| Réassigner un dossier | ❌ | ✅ | ✅ |

### Technical Architecture Considerations

- **Frontend** : SPA web responsive — optimisée desktop, fonctionnelle tablette
- **Backend** : Architecture orientée services, préparée pour l'extraction en microservices post-MVP
- **Base de données** : Isolation tenant enforced au niveau schéma ou base (à définir en architecture)
- **Module IA** : Service indépendant (pipeline LLM/NLP) asynchrone — résultat en < 30 secondes
- **Stockage documents** : Fichiers uploadés stockés avec accès contrôlé par tenant
- **Audit trail** : Logs immuables séparés de la base principale
- **Subscription Tiers** : Hors scope MVP — architecture à prévoir pour V2

---

## Project Scoping & Development Phasing

### MVP Strategy

**Approche :** Experience MVP — livrer l'expérience complète du recouvrement digitalisé, suffisamment robuste pour un déploiement réel en entreprise.

**Contexte :** Projet solo en entreprise (PFE). Livrable = produit production-grade. La qualité architecturale (isolation multi-tenant, sécurité, audit trail) est non-négociable.

**Séquencement de développement recommandé :**
1. **Phase 1** : Auth + RBAC + multi-tenant — risque le plus élevé, à traiter en premier
2. **Phase 2** : Gestion des dossiers + workflow 5 phases + alertes
3. **Phase 3** : Upload documents + Module IA (pipeline LLM/NLP)
4. **Phase 4** : Dashboard + Interface Admin + Audit trail + export

### Risk Mitigation Strategy

**Risque #1 — Architecture multi-tenant :**
- Traiter l'isolation DB dès la Phase 1 avec tests de fuite dédiés avant toute feature métier

**Risque #2 — Pipeline LLM/NLP :**
- Obtenir des rapports d'expertise réels de l'entreprise dès le départ — ne pas développer sur données simulées
- Prototyper le pipeline en parallèle des Phases 1-2

**Risque #3 — Solo en entreprise :**
- Priorisation stricte du scope sans ajout intermédiaire
- Module IA et multi-tenant sont les composants les plus chronophages — calibrer le planning en conséquence

**Risque #4 — Adoption marché :**
- Organiser ≥ 3 démos avec décideurs de sociétés de leasing pour valider et recueillir des feedbacks

---

## Functional Requirements

> ⚠️ **Contrat de capacités** : Ce qui n'est pas listé ici n'existe pas dans le produit final. UX, Architecture et Epics s'appuient exclusivement sur ces FRs.

### FR-1 — Gestion des Identités & Accès

- **FR01** : Le Super Admin peut créer, configurer et désactiver des tenants (sociétés de leasing clientes)
- **FR02** : L'Admin peut créer, modifier et désactiver des comptes Gestionnaire dans son tenant
- **FR03** : L'Admin peut définir et modifier les rôles et droits d'accès des utilisateurs de son tenant
- **FR04** : Le Gestionnaire peut s'authentifier et accéder uniquement aux dossiers de son tenant
- **FR05** : Le système peut appliquer l'isolation des données entre tenants sans exception
- **FR06** : Le système peut révoquer une session utilisateur selon un timeout configurable

### FR-2 — Configuration Tenant

- **FR07** : L'Admin peut configurer les informations de sa société (nom, logo)
- **FR08** : L'Admin peut définir les délais légaux du processus de recouvrement (par phase) selon le droit applicable dans son pays de déploiement
- **FR09** : L'Admin peut configurer le seuil d'écart de valorisation IA déclenchant chaque niveau d'alerte (fiable / modéré / critique)
- **FR10** : L'Admin peut configurer le seuil de dormance d'un dossier (nombre de jours sans action déclenchant une alerte)
- **FR11** : Le système peut valider la cohérence des délais configurés avant activation (ex. : délai mise en demeure < délai saisie)

### FR-3 — Gestion des Dossiers de Recouvrement

- **FR12** : Le Gestionnaire peut créer un dossier de recouvrement avec les données du client et du contrat de leasing (dont la valeur résiduelle initiale)
- **FR13** : Le Gestionnaire peut modifier les informations d'un dossier existant
- **FR14** : Le Gestionnaire peut consulter l'historique complet et horodaté de toutes les actions sur un dossier
- **FR15** : Le Gestionnaire peut réassigner un dossier à un autre Gestionnaire de son tenant
- **FR16** : L'Admin peut réassigner un dossier à un autre Gestionnaire de son tenant
- **FR17** : Le système peut enregistrer automatiquement chaque action sur un dossier dans l'audit trail (acteur, horodatage, données avant/après)

### FR-4 — Workflow de Recouvrement

- **FR18** : Le Gestionnaire peut faire progresser un dossier à travers les 5 phases séquentielles : Pré-contentieux → Mise en demeure → Saisie du véhicule → Vente → Clôture
- **FR19** : Le système peut bloquer la transition vers une phase si les prérequis ne sont pas satisfaits (ex. : blocage de la phase Vente sans estimation IA validée)
- **FR20** : Le système peut déclencher automatiquement une alerte lorsqu'un délai légal configuré approche de son expiration
- **FR21** : Le système peut déclencher automatiquement une alerte lorsqu'un dossier dépasse le seuil de dormance configuré
- **FR22** : Le Gestionnaire peut ajouter des notes et commentaires à chaque étape d'un dossier

### FR-5 — Gestion Documentaire

- **FR23** : Le Gestionnaire peut uploader des documents (PDF, images) et les associer à un dossier et à une phase spécifique
- **FR24** : Le Gestionnaire peut consulter tous les documents associés à un dossier
- **FR25** : Le système peut déclencher le pipeline d'estimation IA automatiquement lors de l'upload d'un rapport d'expertise à la phase Saisie
- **FR26** : Le Gestionnaire peut uploader un nouveau document et relancer le traitement IA en cas d'échec du traitement précédent

### FR-6 — Module IA d'Estimation de Valeur

- **FR27** : Le système peut extraire automatiquement les données clés d'un rapport d'expertise uploadé (marque, modèle, année, kilométrage, état général, valeur estimée par l'expert)
- **FR28** : Le système peut comparer la valeur de marché extraite avec la valeur résiduelle initiale du contrat de leasing
- **FR29** : Le système peut calculer l'écart entre valeur de marché et valeur résiduelle (en valeur absolue et en pourcentage)
- **FR30** : Le système peut générer un indicateur de fiabilité financière selon les seuils configurés (✅ Fiable / ⚠️ Écart modéré / 🚨 Écart critique)
- **FR31** : Le Gestionnaire peut consulter le résultat d'estimation (données extraites + comparaison + indicateur) sur la fiche dossier
- **FR32** : Le système peut notifier le Gestionnaire en cas d'échec du traitement IA avec un message d'erreur actionnable

### FR-7 — Dashboard & Alertes

- **FR33** : Le Gestionnaire peut consulter la liste de tous ses dossiers actifs avec filtres par phase, statut et niveau d'alerte
- **FR34** : Le Gestionnaire peut voir les dossiers en alerte critique mis en évidence au premier plan à chaque connexion
- **FR35** : Le Gestionnaire peut accéder directement à l'action requise sur un dossier depuis une alerte dashboard
- **FR36** : Le système peut désactiver automatiquement une alerte lorsque l'action requise a été effectuée
- **FR37** : Le système peut maintenir les alertes actives en l'absence du Gestionnaire (persistance inter-sessions)

### FR-8 — Traçabilité & Conformité

- **FR38** : Le Gestionnaire peut exporter l'historique complet d'un dossier sous forme de document structuré (PDF ou équivalent)
- **FR39** : L'Admin peut accéder aux logs applicatifs de son tenant (actions utilisateurs, accès aux données)
- **FR40** : Le système peut conserver les logs de façon immuable selon la durée de rétention configurée
- **FR41** : L'Admin peut configurer la durée de rétention des données et des logs de son tenant

---

## Non-Functional Requirements

### Performance

- **NFR01** : Le pipeline IA (upload → extraction → résultat) se complète en **< 30 secondes** dans 90% des cas
- **NFR02** : La liste des dossiers (jusqu'à 1 000 actifs) se charge en **< 2 secondes**
- **NFR03** : Transitions de phase et actions confirmées à l'utilisateur en **< 1 seconde**
- **NFR04** : Dashboard avec alertes chargé en **< 2 secondes** à la connexion
- **NFR05** : Support de **40 à 80 dossiers actifs simultanés** par gestionnaire sans dégradation

### Security

- **NFR06** : Données chiffrées **au repos** (AES-256) et **en transit** (TLS 1.2 minimum)
- **NFR07** : Isolation multi-tenant enforced — **zéro tolérance** pour toute fuite de données entre tenants
- **NFR08** : Sessions expirant après timeout configurable par l'Admin
- **NFR09** : Mots de passe hachés (bcrypt ou équivalent), jamais en clair
- **NFR10** : Accès aux données personnelles journalisés — conformité RGPD / Loi organique n°63-2004
- **NFR11** : Logs immuables — aucune modification ou suppression possible après écriture
- **NFR12** : Le Super Admin ne peut pas accéder au contenu des dossiers clients (isolation by design)

### Scalability

- **NFR13** : Architecture supportant **300 à 1 000+ dossiers actifs** par société sans refonte
- **NFR14** : Ajout d'un nouveau tenant sans intervention technique sur le code — par configuration uniquement
- **NFR15** : Module IA scalable indépendamment du reste de la plateforme (service découplé)

### Reliability

- **NFR16** : Disponibilité cible : **99.5%** hors maintenance planifiée
- **NFR17** : Alertes sur délais critiques déclenchées **sans exception** — aucune perte en cas de charge ou redémarrage
- **NFR18** : Échec du pipeline IA → erreur enregistrée, utilisateur notifié, retry possible — sans perte de données du dossier
- **NFR19** : Rétention des logs garantie selon durée configurée — aucune purge accidentelle possible

### Maintainability

- **NFR20** : Mise à jour du module IA possible indépendamment du reste de la plateforme
- **NFR21** : Configurations de délais, seuils et rôles modifiables sans redéploiement de l'application

### Accessibility

- **NFR22** : Interface respectant les principes de base d'accessibilité (contraste suffisant, navigation clavier) — WCAG AA recommandé, sans obligation légale stricte pour le MVP B2B
