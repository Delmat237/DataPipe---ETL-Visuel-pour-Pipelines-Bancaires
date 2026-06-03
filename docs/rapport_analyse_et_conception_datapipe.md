# Rapport academique d'analyse et de conception
## Systeme DataPipe - ETL visuel pour pipelines bancaires

### Resume

Ce rapport presente une modelisation et une conception orientees systeme. DataPipe est traite comme un ensemble coherent de composants de dialogue, de services applicatifs, de controle de processus, de persistance et d'integration intelligente. La logique retenue est strictement UML et se concentre sur les objets metier, les services, les controleurs et les interactions entre acteurs humains et acteurs logiciels.

Le cadre du defi 9 impose de repondre a un besoin de transformation de donnees bancaires dans un contexte contraint par la qualite des donnees, la conformite et le temps de production des reportings. Le systeme doit donc permettre la conception de pipelines, l'execution supervisee, l'assistance intelligente via LLM, et l'exploitation operationnelle via un assistant Telegram. Cette double capacite, automatisation structurelle et interaction conversationnelle, constitue le coeur de l'architecture proposee.

### 1. Positionnement systeme

DataPipe est un systeme applicatif de pilotage de flux de donnees. Son objectif est de reduire les manipulations manuelles et d'augmenter la fiabilite des transformations. Le systeme opere sur un cycle complet qui commence par une commande utilisateur, se poursuit par une orchestration de services, et se termine par un etat metier persistant et auditable. La frontiere fonctionnelle couvre l'authentification, la gouvernance des roles, la conception de pipeline, la gestion des sources, l'execution, la supervision, l'export et l'assistance intelligente.

La modelisation de contexte etablie dans `analyses/01_contexte_systeme.puml` formalise les acteurs principaux suivants, l'operateur metier, l'administrateur plateforme, l'auditeur interne, l'assistant Telegram, le LLM externe et les systemes tiers de donnees. Cette vue montre que le systeme est multi-acteurs et multi-canaux.

### 2. Structuration d'analyse en UML

Le diagramme de packages d'analyse `analyses/02_packages_analyse.puml` organise le systeme en quatre ensembles. Le premier ensemble est celui de l'interaction utilisateur, qui regroupe le portail operationnel et le canal Telegram. Le second ensemble est la couche applicative qui porte les capacites de gouvernance, d'orchestration et de supervision. Le troisieme ensemble est le domaine metier qui formalise les objets de reference. Le quatrieme ensemble est l'infrastructure qui assure persistance, stockage d'artefacts, connecteurs externes et service LLM.

Le diagramme de cas d'usage `analyses/03_use_cases.puml` traduit les attentes de chaque acteur. L'operateur metier pilote les executions et les resultats. L'administrateur gouverne les roles et l'automatisation. L'auditeur exploite les traces. L'assistant Telegram interagit avec le systeme pour les operations conversationnelles. Le LLM intervient comme acteur logiciel de recommandation et d'assistance.

Le diagramme de classes metier `analyses/04_classes_metier.puml` formalise les entites de gouvernance, de pipeline, d'execution, de donnees et d'assistance. Les objets `ConversationSession`, `AssistantRequest` et `AIRecommendation` ont ete introduits pour representer explicitement la dynamique Telegram/LLM dans le modele metier.

### 3. Conception technique UML pure

La conception est exprimee en UML pur selon les stereotypes `boundary`, `control` et `entity`. Les diagrammes de sequence techniques sont volontairement normalises autour de quatre elements, l'interface, le service applicatif, le controleur et les objets de base de donnees.

Le diagramme `conception/01_sequence_auth_login.puml` decrit l'authentification comme un enchainement entre une interface de commande, un service d'authentification, un controleur d'acces et les entites `Utilisateur` et `SessionUtilisateur` persistees en base.

Le diagramme `conception/02_sequence_file_upload_analyze.puml` decrit le processus d'ingestion et d'analyse de fichier selon le meme principe. L'interface soumet la commande, le service coordonne, le controleur applique les regles d'acces, l'entite `Fichier` est persistee, puis l'analyse est produite et retournee.

Le diagramme `conception/03_sequence_pipeline_run.puml` decrit le pilotage d'execution en introduisant explicitement l'assistant Telegram et le connecteur LLM. Le systeme traite une commande, orchestre le moteur de transformation, sollicite le LLM si necessaire, met a jour les objets `Pipeline` et `Run`, puis expose l'etat final aux canaux d'interaction.

Le diagramme de classes techniques `conception/04_classes_techniques.puml` consolide cette architecture. Les classes `InterfaceUtilisateur` et `AssistantTelegramGateway` representent les frontieres de dialogue. `ServiceApplicatif`, `AuthController`, `PipelineController` et `FileController` representent les mecanismes de controle. Les classes `Pipeline`, `Run`, `SessionUtilisateur` et `FichierMetier` representent les entites techniques persistees.

Les diagrammes d'etats-transitions `conception/05_etat_transition_run.puml` et `conception/06_etat_transition_schedule_datasource.puml` formalisent la dynamique du systeme. Le cycle de `Run` integre un etat d'attente d'assistance IA. Les cycles de synchronisation et d'interaction conversationnelle explicitent les etats de reprise et d'escalade.

### 4. Acteurs principaux et responsabilites

L'operateur metier est responsable de la configuration et du pilotage des flux. L'administrateur plateforme est responsable de la gouvernance des acces et de l'automatisation. L'auditeur interne est responsable de l'exploitation des traces et de la verification de conformite. L'assistant Telegram est un acteur logiciel de mediation operationnelle. Le LLM est un acteur logiciel d'assistance a la decision de transformation.

Cette distribution des responsabilites est centrale dans la qualite du systeme car elle separe clairement le pilotage metier, le controle organisationnel et les mecanismes d'aide intelligente.

### 5. Coherence avec le modele economique

Le modele economique associe a cette architecture est disponible dans `docs/modele_economique_datapipe_cameroun.md`. Il est fonde sur une valeur de systeme et non sur une valeur d'endpoint, avec une promesse de reduction des couts de traitement, de baisse du risque operationnel et d'amelioration de la tracabilite. Le role du LLM et de l'assistant Telegram y est integre comme levier de productivite et de rapidite d'exploitation.

### 6. Conclusion

La refonte de l'analyse et de la conception en UML pur confirme que DataPipe est un systeme applicatif complet articule autour d'une couche de service, de controleurs, d'objets persistes et de canaux d'interaction intelligents. La modelisation prend explicitement en compte l'assistant Telegram et le LLM comme acteurs structurants de la solution. Cette representation est adaptee a une soutenance exigeante car elle rend visibles les mecanismes de valeur, de controle et de robustesse du systeme.
