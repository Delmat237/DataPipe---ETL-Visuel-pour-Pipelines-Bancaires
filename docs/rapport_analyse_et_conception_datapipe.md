# Rapport academique d'analyse et de conception
## Systeme DataPipe - plateforme ETL visuelle complete pour pipelines bancaires

### Resume

Le present rapport expose un travail d'analyse et de conception mene a l'echelle d'un systeme complet. DataPipe y est traite comme une plateforme integree qui associe une couche de presentation frontend, une couche applicative backend, une couche de persistance et une couche d'integration avec des services externes. Cette posture est volontairement systemique, car la valeur du produit ne provient pas d'une simple exposition d'endpoints, mais de la cooperation de plusieurs sous-systemes qui transforment un besoin metier en resultat exploitable.

L'objectif du systeme est de permettre la conception visuelle de pipelines ETL, leur execution fiable, leur supervision en continu et la diffusion de leurs sorties dans des formats utiles aux metiers bancaires. Le rapport distingue la phase d'analyse, orientee expression du besoin et modelisation du domaine, de la phase de conception, orientee architecture technique et comportement dynamique des composants. Les diagrammes UML produits dans les dossiers `analyses` et `conception` constituent des vues complementaires d'un meme systeme et non des artefacts isoles.

### Introduction generale

Les organisations financieres manipulent des donnees heterogenes dont la qualite conditionne la conformite, la performance operationnelle et la prise de decision. Le traitement de ces donnees ne peut plus etre considere comme une chaine purement technique executee en arriere-plan. Il s'agit d'un processus socio-technique complet, dans lequel des utilisateurs interagissent avec une interface, definissent des intentions de transformation, declenchent des traitements et interpretent des etats restitues par la plateforme.

DataPipe repond a cette realite par une architecture de plateforme. Le frontend porte la logique d'interaction, de visualisation des graphes ETL et d'assistance a la decision. Le backend porte la logique d'orchestration, de securite, de persistance et d'integration. Les deux couches forment un systeme unique, dont la qualite depend autant de la coherence du domaine metier que de la robustesse technique.

L'ambition de ce rapport est d'etablir cette coherence de maniere explicite. Il ne s'agit pas seulement de decrire des composants logiciels, mais de montrer comment les besoins metiers, les parcours utilisateurs et les mecanismes techniques s'alignent dans une conception defendable en contexte academique exigeant.

### Cadre methodologique

La methode adoptee suit une progression en trois niveaux. Le premier niveau est macroscopique et delimite le systeme dans son environnement. Le second niveau est mesoscopique et structure les responsabilites fonctionnelles en sous-ensembles coherents. Le troisieme niveau est microscopique et detaille les interactions techniques, les classes et les cycles d'etat.

Cette progression garantit la tracabilite des decisions. Les besoins exprimes a l'echelle fonctionnelle sont relies a des modeles conceptuels, puis transformes en choix d'architecture, en sequences techniques et en automates d'etat. La demarche preserve ainsi la continuite entre ce que le systeme doit faire, ce qu'il doit representer et la maniere dont il l'executera.

### Partie I - Analyse du systeme

#### 1. Contexte systeme et delimitation des frontieres

Le systeme DataPipe s'insere dans un ecosysteme de donnees ou interagissent utilisateurs metiers, administrateurs, services de donnees externes, fournisseurs IA et canaux d'evenements de type webhook. Le diagramme de contexte `analyses/01_contexte_systeme.puml` represente ce positionnement global. Il doit etre lu comme une vue d'ensemble de la plateforme, dans laquelle le coeur applicatif backend joue le role d'orchestrateur, tandis que le frontend joue le role d'interface de pilotage.

La frontiere du systeme inclut donc la capture des intentions utilisateurs, leur traduction en operations metiers, l'execution des transformations, la persistance des etats et la restitution de resultats. Cette frontiere depasse le cadre strict des routes HTTP. Elle couvre l'experience d'usage complete, depuis l'action de l'utilisateur dans l'interface jusqu'a l'effet durable en base ou en stockage de fichiers.

#### 2. Structuration fonctionnelle en sous-systemes

Le diagramme de packages `analyses/02_packages_analyse.puml` formalise l'organisation du sous-systeme applicatif. Dans une perspective plateforme, cette organisation se connecte a deux autres ensembles. En amont, un sous-systeme de presentation qui consomme les services metiers. En aval, un sous-systeme d'infrastructure qui porte stockage, persistance et integrabilite.

Cette decomposition respecte le principe de separation des preoccupations. Les fonctions d'identite et de gouvernance sont distinctes des fonctions d'orchestration ETL. Les fonctions d'observabilite sont distinctes des fonctions de transformation. Le resultat est une architecture lisible, favorable a la maintenabilite et a l'evolutivite, condition essentielle pour un systeme appele a croitre en perimetre.

#### 3. Cas d'usage de bout en bout

Le diagramme `analyses/03_use_cases.puml` decrit les services attendus par les acteurs. Dans une lecture systemique, chaque cas d'usage est un parcours transverse. Une operation commence par une interaction frontend, est interpretee par les services backend, puis est restituee a l'utilisateur sous forme d'etat, de donnee ou de notification.

Cette approche permet de traiter les cas d'usage non comme des appels techniques unitaires mais comme des transactions metier completement tracees. Elle rend egalement visible l'interdependance entre ergonomie d'interface et qualite de service applicatif. Un cas d'usage n'est satisfait qu'a la condition que la cooperation inter-couches soit coherente et comprehensible pour l'acteur qui l'initie.

#### 4. Modele conceptuel metier

Le diagramme `analyses/04_classes_metier.puml` structure les entites centrales du domaine. Les objets de gouvernance d'acces, les objets de construction des pipelines, les objets d'execution, les objets de donnees et les objets de supervision y sont relies par des associations explicites. Ce modele constitue le langage commun du systeme. Le frontend s'y aligne pour presenter les bonnes abstractions aux utilisateurs. Le backend s'y aligne pour appliquer les regles de coherence.

L'interet academique de ce modele est sa capacite a unifier le sens metier au travers des couches. Une notion comme `Run`, `Pipeline` ou `Workspace` garde une definition stable entre analyse, conception et implementation. Cette stabilite semantique est un facteur decisif de qualite dans un projet multi-composants.

#### 5. Exigences non fonctionnelles de niveau plateforme

L'analyse systeme fait emerger des exigences transversales. La securite ne se limite pas au controle d'acces des endpoints ; elle inclut la gestion des tokens dans l'interface, la protection des secrets, la maitrise des sessions et la reduction de l'exposition des donnees sensibles. La fiabilite ne se limite pas a l'execution du moteur ETL ; elle inclut la lisibilite des erreurs pour l'utilisateur et la coherence des transitions d'etat.

La tracabilite concerne l'ensemble de la chaine. Elle doit relier action utilisateur, commande applicative, evenement de run et sortie persistee. L'exploitabilite implique des logs, des metriques et des signaux de supervision capables d'etre interpretes aussi bien par l'equipe technique que par les responsables metiers. Enfin, la performance percue depend de la qualite de dialogue entre frontend et backend, non d'un seul composant.

### Partie II - Conception du systeme

#### 1. Architecture logique globale

La conception retenue s'appuie sur une architecture en couches cooperantes. La couche de presentation frontend prend en charge la visualisation des pipelines, l'orchestration des parcours utilisateur et la restitution des etats. La couche applicative backend transforme ces interactions en operations metiers securisees. La couche de persistance conserve les etats et les historiques. La couche d'integration assure l'ouverture vers les services externes.

Cette architecture etablit un contrat clair entre experience et execution. Le frontend n'implemente pas les regles metiers critiques. Le backend n'impose pas de logique d'ergonomie. Chacun remplit sa responsabilite tout en restant aligne sur le meme modele de domaine. Cet alignement limite les incoherences et facilite les evolutions.

#### 2. Sequences techniques et lecture inter-couches

Les diagrammes de sequence dans `conception` formalisent les flux techniques internes du coeur applicatif. Leur lecture systeme ajoute explicitement une etape de declenchement et de restitution cote interface. Dans `conception/01_sequence_auth_login.puml`, la connexion est un parcours complet qui va de la saisie utilisateur a l'etablissement d'une session exploitable par le frontend.

Dans `conception/02_sequence_file_upload_analyze.puml`, l'upload et l'analyse constituent une chaine continue ou l'interface collecte la commande, le backend assure validation et persistance, puis renvoie des informations interpretablees dans un ecran de controle qualite. Dans `conception/03_sequence_pipeline_run.puml`, la supervision de l'execution depend de la fidelite des informations remontant du moteur vers l'interface.

Ces sequences montrent que la qualite du systeme depend autant de l'ordonnancement technique que de la capacite a exposer des etats metier intelligibles aux utilisateurs finaux.

#### 3. Conception des classes techniques

Le diagramme `conception/04_classes_techniques.puml` formalise les dependances du sous-systeme applicatif backend, notamment entre factory d'application, controleurs, utilitaires, moteur ETL, persistance et adaptateurs externes. Dans une vue plateforme, ce schema est complete par une couche de services frontend qui agit comme client metier structure de ces composants.

Le choix architectural majeur consiste a centraliser la logique d'execution dans des services dedies, afin d'eviter la dispersion des regles dans les routes de presentation. Ce choix favorise la testabilite et la robustesse. Il permet aussi a la couche frontend de rester concentree sur l'experience utilisateur et la composition d'ecrans.

#### 4. Conception dynamique par etats-transitions

Les automates representes dans `conception/05_etat_transition_run.puml` et `conception/06_etat_transition_schedule_datasource.puml` structurent le comportement dynamique du systeme. La modelisation des etats de `Run` garantit la lisibilite du cycle de traitement. La modelisation de `Schedule` et `Datasource` formalise la gouvernance de l'automatisation et de la synchronisation.

A l'echelle systeme, ces etats doivent etre propagés et interpretes correctement dans la couche de presentation. Une transition technique non visible ou mal interpretee cote interface degrade la maitrise operationnelle, meme si l'execution backend est correcte. Cette exigence justifie une conception orientee contrat d'etat entre couches.

#### 5. Arbitrages techniques et consequences systemes

Les choix de persistance locale, de stockage fichier local et de certains mecanismes memoire sont adequats pour une phase de consolidation rapide. Ils simplifient l'exploitation initiale, mais limitent la scalabilite et la resilience multi-instance. Dans une perspective systeme, ces limites concernent directement la qualite percue par les utilisateurs, notamment en charge ou en contexte distribue.

La trajectoire d'evolution naturelle inclut une base de donnees plus robuste, un stockage partage des resultats, un ordonnanceur persistant et un renforcement du pilotage evenementiel. Le modele actuel facilite cette trajectoire, car les responsabilites sont deja relativement bien separees.

#### 6. Securite, qualite et verification

La securite doit etre validee comme propriete globale de la plateforme. La couche backend applique controle d'acces et gestion de session. La couche frontend doit appliquer des politiques de conservation, de renouvellement et d'invalidation de contexte utilisateur conformes. Les deux dimensions sont inseparables.

La qualite logicielle est soutenue par une base de tests backend significative. Pour une couverture systeme complete, cette base doit etre completee par des validations de parcours frontend-backend, des tests de non-regression d'interface et des tests de charge axes sur l'experience utilisateur. Ce couplage des strategies de test est coherent avec le positionnement plateforme du projet.

### Discussion critique et perspectives

L'adaptation du rapport a une lecture systeme renforce sa validite academique. Elle permet d'eviter une reduction du projet a son seul coeur applicatif et rend justice a la nature reelle de la solution, qui combine interaction humaine, logique metier, execution technique et gouvernance des donnees.

Les perspectives prioritaires portent sur l'enrichissement explicite de la modelisation de la couche frontend, la mesure de la performance percue, l'instrumentation de bout en bout et la formalisation de contrats d'etat plus stricts entre presentation et services. Ces axes permettraient de passer d'une plateforme solide en phase de maturation a une solution pleinement industrialisable.

### Conclusion generale

Ce rapport etabli que DataPipe doit etre compris et concu comme un systeme complet. L'analyse a clarifie les acteurs, les processus et le modele metier commun. La conception a formalise les mecanismes techniques qui rendent ces processus executables et controlables. L'ensemble constitue une base robuste pour la soutenance et pour les evolutions futures.

Les diagrammes UML produits dans `analyses` et `conception` gardent toute leur pertinence lorsqu'ils sont interpretes comme des vues partielles d'une architecture globale frontend-backend-donnees-integrations. Cette interpretation systemique est la plus conforme a une exigence academique elevee et a la realite d'un produit logiciel de type plateforme.

### Annexe - References aux diagrammes UML du projet

Le corpus d'analyse est disponible dans `analyses/01_contexte_systeme.puml`, `analyses/02_packages_analyse.puml`, `analyses/03_use_cases.puml` et `analyses/04_classes_metier.puml`. Le corpus de conception est disponible dans `conception/01_sequence_auth_login.puml`, `conception/02_sequence_file_upload_analyze.puml`, `conception/03_sequence_pipeline_run.puml`, `conception/04_classes_techniques.puml`, `conception/05_etat_transition_run.puml` et `conception/06_etat_transition_schedule_datasource.puml`.
