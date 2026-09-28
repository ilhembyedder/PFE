# Fiche orateur — Soutenance PFE LeasRecover

> Document de préparation personnel. Le support projeté est [`presentation.html`](presentation.html).

---

## Minutage sur 20 minutes

La présentation compte 24 slides. Le rythme n'est pas uniforme : quatre slides portent l'essentiel de la démonstration technique et méritent qu'on s'y arrête, une dizaine d'autres ne sont là que pour le support visuel et s'enchaînent.

| Bloc | Slides | Durée | Rythme |
|---|---|---|---|
| Ouverture et plan | 1–2 | 1 min | Rapide, ne pas lire le plan |
| Contexte et problématique | 3–4 | 2 min 30 | **Ralentir sur la slide 4**, marquer un silence |
| Objectifs et méthode BMAD | 5–7 | 2 min 30 | Poser la méthode, ne pas détailler les agents |
| Architecture | 8 | 2 min | **Slide clé**, suivre le flux de haut en bas |
| Pile technique et dépendances | 9–12 | 2 min | Enchaîner vite, trois ou quatre bibliothèques citées par slide |
| Multi-tenant, sécurité, workflow, audit | 13–16 | 4 min | **Slides 13 et 14 = le cœur**, 15 et 16 plus rapides |
| Pipeline, extraction réelle, LLM | 17–19 | 3 min 30 | **Slide 18 à assumer de front** |
| Démonstration | 20 | 5 min | Chronométrée à part, voir la checklist |
| Validation, bilan, perspectives | 21–23 | 1 min 30 | Trois chiffres, six chantiers, on conclut |
| Remerciements | 24 | 30 s | Debout, face au jury |

Si le temps déborde, sacrifier dans cet ordre : la slide 11 (dépendances backend), la slide 16 (audit), la slide 21 (tests). **Ne jamais sacrifier les slides 8, 13, 14 et 18.**

Si le temps est large, développer la slide 13 sur le multi-tenant : c'est la contribution technique la plus solide et celle qui appelle le plus de questions.

---

## Script de passage

Ce script donne les phrases d'ouverture et de transition. Le reste s'improvise à partir des notes d'orateur, affichées sous chaque slide dans `presentation.html`.

### Ouverture (slides 1–2)

> Bonjour Madame, Monsieur, membres du jury. Je vais vous présenter LeasRecover, une plateforme qui digitalise le recouvrement des véhicules en leasing et automatise la comparaison entre la valeur du marché et la valeur inscrite au contrat.

Puis le plan, en une phrase : « je consacrerai le cœur de l'exposé à l'architecture, au multi-tenant et au pipeline de valorisation. »

### Contexte et problématique (slides 3–4)

Définir les deux termes avant tout le reste, le jury n'est pas forcément du métier :

- **Valeur résiduelle** : la valeur inscrite au contrat d'origine, la référence comptable.
- **Valeur vénale** : ce que le véhicule vaut réellement, selon l'expert.

Transition vers la slide 4 : « tout le produit tourne autour de l'écart entre ces deux chiffres. Et aujourd'hui, cet écart se calcule à la main. » Marquer un silence après la phrase en gros caractères.

### Objectifs et méthode (slides 5–7)

Annoncer le hors-périmètre soi-même, cela désamorce la question : « la génération automatique des courriers légaux, l'accès direct de l'expert et l'analytique avancée ont été explicitement exclus du MVP. »

Sur BMAD : « le projet n'a pas été codé au fil de l'eau. Il a été spécifié d'abord, et tous les livrables de spécification sont versionnés dans le dépôt. »

### Architecture (slide 8)

Suivre le flux de haut en bas, et s'arrêter sur la couche BFF :

> Le navigateur ne reçoit jamais le jeton d'authentification. Il reçoit un cookie chiffré, que seul le serveur Next.js sait déchiffrer, et c'est ce serveur qui rejoue l'appel vers le backend avec le vrai jeton. Conséquence concrète : une faille XSS dans l'interface ne permet pas de voler la session.

### Dépendances (slides 9–12)

Ne pas lire les listes. Annoncer : « je laisse ces trois slides affichées pour le détail, je ne commente que les choix structurants. » Puis trois ou quatre bibliothèques par slide, pas plus.

### Cœur technique (slides 13–16)

Phrase à préparer mot pour mot sur le multi-tenant :

> L'isolation ne repose pas sur une colonne qu'un développeur pourrait oublier dans une clause WHERE. Elle est portée par le schéma PostgreSQL lui-même : deux sociétés clientes ne partagent aucune table.

### Le module d'extraction (slides 17–19)

Prendre les devants, de front :

> Ce module est souvent présenté comme un module d'intelligence artificielle. Je préfère être précise : aujourd'hui, il ne fait appel à aucun modèle de langage. C'est un moteur déterministe. Ce choix était inscrit dans le découpage du MVP : le lot de travail portait sur la chaîne de traitement asynchrone, pas sur le moteur lui-même.

Puis retourner l'argument : déterministe signifie explicable, reproductible et auditable, ce qui compte dans un contexte de provision comptable.

### Clôture (slides 22–24)

> Le MVP couvre les 41 exigences fonctionnelles du cahier des charges. Six chantiers sont identifiés et priorisés pour la suite, le premier étant le branchement d'un véritable modèle de langage sur le moteur d'extraction. Je vous remercie de votre attention.

---

## Écarts entre le rapport écrit et le code réel

C'est le risque principal de la soutenance. Un membre du jury qui a lu le rapport et qui ouvre le dépôt trouvera ces écarts. Mieux vaut les connaître que les découvrir en direct.

| Le rapport annonce | Le dépôt contient | Où le vérifier |
|---|---|---|
| PostgreSQL 18 | PostgreSQL 16 | `docker-compose.yml`, avec un commentaire qui l'explique |
| Spring Boot 4 | Spring Boot 3.4.3 | `backend/pom.xml` |
| Ant Design | Tailwind CSS 4 + shadcn/ui + Base UI | `frontend/package.json`, aucune trace d'antd |
| PyMuPDF et modèles LLM | FastAPI, uvicorn, pydantic, requests, httpx | `ai-service/requirements.txt` |
| OCR dans le pipeline | Aucun OCR | `ai-service/app/services/llm_extraction.py` |
| Précision ≥ 94,2 % sur 50 rapports réels | Aucune campagne de mesure | Aucun corpus de test dans le dépôt |
| Captures d'écran du rapport | Maquettes, pas l'application réelle | Comparer avec l'application lancée |

### Ce qu'il faut faire avant la soutenance

Deux options, à trancher vite :

1. **Corriger le rapport** s'il peut encore être modifié. C'est l'option propre : six lignes à changer dans le chapitre 4, et retirer le chiffre de 94,2 % qui n'est adossé à aucune mesure.
2. **Préparer la réponse** si le rapport est déjà déposé. Formulation proposée :

> Le rapport décrit l'architecture cible telle que je l'avais spécifiée. Certaines versions ont évolué pendant la réalisation et le rapport n'a pas été mis à jour sur ces points. Je préfère vous donner l'état réel du code : PostgreSQL 16, Spring Boot 3.4.3, une interface reconstruite en TypeScript avec Tailwind et shadcn, et un moteur d'extraction déterministe sans modèle de langage.

### Le point le plus sensible

Les captures d'écran du rapport montrent des éléments qui n'existent pas dans l'application : des indicateurs de synthèse sur le tableau de bord, un score de confiance, une étape d'OCR, un bouton de validation d'arbitrage. Si la démonstration est faite en direct, l'écart sera visible.

**Recommandation** : prendre de nouvelles captures sur l'application réellement lancée et, si le rapport ne peut plus bouger, le dire d'entrée de jeu — « les captures du rapport sont les maquettes de conception, l'application livrée est celle que je vais vous montrer ».

---

## Questions techniques probables

### « Pourquoi un schéma par société plutôt qu'une colonne d'identifiant ? »

Parce qu'une colonne se contourne par oubli. Il suffit qu'une requête oublie la clause de filtrage pour qu'une société voie les données d'une autre. Avec un schéma par société, deux clients ne partagent aucune table : l'erreur n'est plus possible au niveau de la base. Trois défenses se superposent : le filtre qui refuse l'accès, le schéma qui isole physiquement, et une revérification dans la couche service.

### « Pourquoi pas une base de données par société ? »

Coût d'exploitation. Une base par société multiplie les instances à superviser, à sauvegarder et à migrer. Un schéma par société garde une seule instance tout en préservant l'isolation. C'est le compromis standard pour un SaaS de cette taille.

### « Comment le schéma est-il commuté à chaque requête ? »

En quatre temps : le filtre JWT construit le profil appelant, le filtre tenant vérifie les droits et dépose le nom du schéma dans un contexte de fil d'exécution, Hibernate lit ce contexte au moment d'acquérir une connexion et appelle `setSchema`, puis remet le schéma à `public` à la libération. Le contexte est toujours vidé en fin de requête, sinon un fil recyclé emporterait le schéma précédent.

### « Qu'est-ce qu'un BFF et pourquoi ce choix ? »

Backend for Frontend : une couche serveur dédiée à une interface donnée, qui s'intercale entre le navigateur et l'API métier. Ici elle sert un but précis : garder le jeton côté serveur. Le navigateur ne détient qu'un cookie chiffré en AES-256-GCM, inaccessible au JavaScript de la page et inutilisable ailleurs. Vingt-neuf gestionnaires de routes déchiffrent ce cookie et rejouent l'appel vers Spring Boot.

### « Pourquoi du SSE et pas du WebSocket ? »

Le besoin est unidirectionnel : le serveur informe le navigateur de l'avancement, le navigateur n'a rien à renvoyer. Le SSE se contente d'HTTP, traverse les proxys sans configuration et se reconnecte tout seul. Un WebSocket aurait ajouté un protocole et une gestion de connexion pour un bénéfice nul.

### « Comment l'historique est-il rendu inaltérable ? »

Par Hibernate Envers. Chaque modification du dossier crée une révision horodatée dans une table d'audit séparée, attribuée à l'utilisateur grâce à un écouteur de révision. Le mécanisme est déclaratif : aucune ligne de journalisation écrite à la main, donc rien à oublier. À reconnaître : seule l'entité dossier est auditée pour l'instant.

### « Pourquoi Java 21 et Spring Boot 3.4 ? »

Java 21 est la version à support long terme exigée par Spring Boot 3.4, et elle apporte les fils d'exécution virtuels. Ils servent directement : l'appel au service d'extraction s'exécute sur un fil virtuel, ce qui évite de bloquer un fil système pendant le traitement du document.

### « Comment gérez-vous les migrations de base ? »

Flyway, avec deux jeux de migrations : celles du schéma `public` s'exécutent au démarrage de l'application, celles d'un schéma société s'exécutent à la création de la société. **Limite à assumer si on creuse** : aujourd'hui, une nouvelle migration société n'atteint pas les sociétés déjà en service ; une boucle de rattrapage reste à écrire, c'est identifié dans la revue de code.

---

## Questions pièges : le module IA et les outils agentiques

### « Votre module IA utilise quel modèle ? »

La question la plus probable, et la plus dangereuse si elle prend au dépourvu. La slide 18 doit avoir déjà répondu.

> Aucun, à ce jour. Le moteur est déterministe : décompression des flux du PDF, extraction par expressions régulières, puis un barème de valorisation. Ce choix était inscrit dans la story cinq-un du découpage : le lot de travail du MVP portait sur la chaîne asynchrone, pas sur le moteur. La chaîne est contractualisée par webhook, donc le moteur se remplace sans toucher au reste.

Puis retourner l'argument sans attendre : déterministe veut dire explicable, reproductible et auditable. Dans un contexte de provision comptable, une valorisation dont on ne peut pas justifier le calcul est un problème, pas une fonctionnalité.

### « Alors pourquoi parler d'IA ? »

Assumer le glissement de vocabulaire plutôt que de le défendre : « le terme est employé dans le cadrage produit au sens large d'automatisation de la décision. Techniquement, ce que je livre est un moteur de règles, et je préfère l'appeler ainsi. »

### « Comment brancheriez-vous un vrai modèle ? »

Réponse précise, elle montre la maîtrise du sujet :

- Extraction du texte du PDF, avec un OCR en amont pour les rapports scannés.
- Appel au modèle avec une sortie JSON contrainte par un schéma : marque, modèle, année, kilométrage, état, valeur vénale.
- Validation du JSON retourné côté service, et repli automatique sur le moteur déterministe si la sortie est invalide ou le service indisponible.
- Journalisation de la réponse brute pour l'auditabilité, puisqu'un modèle n'est pas reproductible.
- Campagne de mesure sur un corpus de rapports réels avant toute mise en production.

Les emplacements de clés d'API existent déjà dans `.env.example`, et le point d'entrée du service n'aurait pas à changer.

### « Vous avez utilisé des outils d'IA pour coder. Est-ce encore votre travail ? »

Ne jamais se justifier sur la défensive. Répondre sur le fond :

> Oui. J'ai utilisé BMAD et des assistants de codage comme j'utilise un compilateur, un débogueur ou une bibliothèque : ce sont des outils. La valeur est dans la conception, l'arbitrage et la vérification. Le modèle multi-tenant, la stratégie de session, le découpage en phases et le barème de valorisation sont des décisions que j'ai prises, et je peux défendre chacune d'elles.

Puis inviter le jury à vérifier : « posez-moi n'importe quelle question sur le code, je vous réponds. » C'est la meilleure preuve.

### « Pouvez-vous m'expliquer cette portion de code ? »

Révision obligatoire avant la soutenance, dans cet ordre de priorité :

1. Le filtre tenant et le résolveur de schéma.
2. Le module de scellement du cookie de session.
3. Le service de valorisation : calcul de l'écart et application des seuils.
4. Le moteur d'extraction côté Python, ligne par ligne.
5. Le service de progrès SSE et le contrôleur de webhook interne.

Si une question porte sur du code non révisé, dire franchement : « je préfère l'ouvrir plutôt que de vous répondre de mémoire », et l'ouvrir. C'est mieux reçu qu'une approximation.

---

## Questions métier et de méthode

### « Pourquoi cinq phases, et pourquoi aucun retour en arrière ? »

Parce que le processus de recouvrement est juridiquement séquentiel : on ne peut pas saisir un véhicule avant d'avoir envoyé la mise en demeure. Autoriser un retour en arrière reviendrait à permettre de réécrire l'historique d'un dossier contentieux. La correction d'une erreur passe par une annotation tracée, pas par une modification silencieuse.

### « Les délais légaux sont-ils codés en dur ? »

Non. Ils sont stockés par société dans une colonne JSONB de la table de configuration, modifiables depuis l'écran de paramétrage sans redéploiement. Les valeurs par défaut sont 15, 30, 45 et 60 jours. Il en va de même du seuil de dormance et des deux seuils de fiabilité.

### « Comment avez-vous validé le besoin ? »

Par un cadrage produit formalisé : personas, problème, périmètre et hors-périmètre, consignés dans le document de cadrage du dépôt. Deux personas structurent les décisions : une chargée de recouvrement qui suit 30 à 60 dossiers, et un administrateur qui paramètre l'environnement avant l'arrivée des gestionnaires.

### « Qu'est-ce que BMAD apporte par rapport à Scrum ? »

Deux choses concrètes. La traçabilité : chaque ligne de code se rattache à une story, chaque story à une exigence numérotée du cahier des charges. Et le fait que chaque story porte ses critères d'acceptation, écrits **avant** l'implémentation, ce qui rend la vérification objective.

### « Qu'est-ce qui n'est pas fini ? »

Répondre sans détour, la liste est écrite et priorisée dans la revue de code du dépôt :

- Le moteur d'extraction, qui reste déterministe.
- L'audit, limité à l'entité dossier.
- Les migrations d'un schéma société déjà en service.
- Le durcissement avant production : authentification du webhook interne, secrets à renouveler, garde de routes à compléter.
- L'absence de chaîne d'intégration continue et de tests de bout en bout automatisés.

Cadrer la réponse : « avoir conduit une revue de code et en avoir tiré un registre priorisé est un résultat du projet. Un MVP qui se croit terminé est un MVP mal relu. »

### « Quelle est la valeur réelle pour une société de leasing ? »

Trois bénéfices, sans chiffrer ce qui n'a pas été mesuré : la confrontation valeur de marché contre valeur résiduelle devient systématique au lieu d'être manuelle et inégale ; les échéances légales sont surveillées automatiquement au lieu d'être découvertes après dépassement ; l'historique d'un dossier devient opposable en cas de contestation.

### « Combien de temps le projet a-t-il pris ? »

Préparer la réponse à partir de l'historique réel : premiers artefacts de cadrage en mars 2026, première version fonctionnelle en juillet, refonte de l'interface et localisation en juillet, corrections jusqu'en septembre 2026.

---

## Checklist de la veille et du jour J

### La veille

- [ ] Trancher les écarts rapport / code : corriger le rapport, ou apprendre la réponse par cœur.
- [ ] Reprendre des captures d'écran sur l'application réellement lancée.
- [ ] Compléter les champs entre crochets de la slide de titre : encadrants et établissement.
- [ ] Réviser les cinq portions de code listées plus haut.
- [ ] Répéter la démonstration trois fois, chronomètre en main.
- [ ] **Enregistrer une vidéo de la démonstration** et la copier sur la machine de présentation.
- [ ] Exporter le deck en PDF et le copier sur une clé USB.
- [ ] Préparer un rapport d'expertise PDF au bon gabarit, prêt sur le bureau.

### Préparation de la démonstration

- [ ] Lancer la pile complète au moins dix minutes avant le passage.
- [ ] Exécuter le script de jeu de données de démonstration.
- [ ] Régler la tâche d'alertes sur un passage toutes les cinq minutes, afin que les alertes soient visibles.
- [ ] Se connecter d'avance dans un second navigateur, pour éviter de taper les identifiants devant le jury.
- [ ] Ouvrir les onglets utiles à l'avance : registre des dossiers, fiche dossier, paramètres.
- [ ] Vérifier que les quatre conteneurs répondent, service d'extraction compris.

### Sur la machine, en arrière-plan

À garder ouverts dans une autre fenêtre, pour répondre à une question en montrant plutôt qu'en récitant :

- Le cahier des charges avec ses exigences numérotées.
- Le diagramme de classes et le modèle conceptuel de données.
- La revue de code, pour appuyer les réponses sur ce qui reste à faire.
- L'éditeur de code, positionné sur le filtre tenant.

### Pendant le passage

- Ne jamais déboguer en direct. Si la démonstration échoue, basculer immédiatement sur la vidéo et la commenter.
- Ne pas paraphraser le rapport pendant les questions : répondre court, puis proposer d'ouvrir le document.
- Si une question sort du périmètre maîtrisé, le dire et proposer la démarche qu'on suivrait pour y répondre. C'est mieux reçu qu'une approximation.
- Terminer debout, face au jury, sans revenir en arrière dans les slides.
