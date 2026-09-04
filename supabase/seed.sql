-- ===========================================================================
-- seed.sql — Données de départ
--
-- ⚠️  RÈGLE ABSOLUE DE CE FICHIER (§1.7 du Rapport 2)
--
-- Les données proviennent **exclusivement** de `src/content/*.ts`,
-- `src/lib/site-config.ts` et `src/lib/navigation.ts`. Rien n'est réécrit,
-- rien n'est enjolivé, rien n'est complété. Les « [À COMPLÉTER] » sont repris
-- tels quels : ils sont volontairement visibles (invariant nº 1 du projet),
-- et le tableau de bord du Lot 5 en dressera la liste.
--
-- Les chaînes sont écrites en guillemets-dollar `$t$…$t$` plutôt qu'en
-- apostrophes doublées : le contenu est en français et regorge d'apostrophes
-- (« l'environnement », « d'activité »). Le doublage manuel sur deux cents
-- chaînes est une source d'erreur silencieuse ; le dollar-quoting n'en a
-- aucune.
--
-- Ce fichier est rejouable : `truncate` en tête remet les tables de contenu à
-- zéro sans toucher aux comptes (`profiles` / `auth.users`).
-- ===========================================================================

begin;

-- Remise à zéro du contenu seulement. `profiles`, `audit_logs` et
-- `form_submissions` ne sont pas touchés : on ne détruit ni un compte ni un
-- message reçu en rejouant un seed.
truncate table
  public.page_sections,
  public.pages,
  public.gallery_items,
  public.gallery_categories,
  public.annual_reports,
  public.testimonials,
  public.team_members,
  public.faq_items,
  public.core_values,
  public.stats,
  public.articles,
  public.article_categories,
  public.programmes,
  public.navigation_items,
  public.site_settings
restart identity cascade;


-- ===========================================================================
-- 1. PROGRAMMES — src/content/programmes.ts (8 lignes, ordre du tableau)
--
-- `status = 'published'` : ce sont les 8 programmes actuellement en ligne.
-- L'icône est stockée comme chaîne (§2.5 du Rapport 2) ; `getIcon()` la
-- résout côté présentation.
-- ===========================================================================

insert into public.programmes
  (slug, title, short_title, summary, icon, tone,
   actions, publics, besoins, benevolat_label, position, status)
values
(
  $t$developpement-communautaire$t$,
  $t$Développement communautaire$t$,
  $t$Développement communautaire$t$,
  $t$Renforcer les capacités des communautés pour un développement autonome.$t$,
  $t$Handshake$t$, 'blue',
  array[
    $t$Renforcement des compétences locales par la formation$t$,
    $t$Accompagnement des initiatives portées par les habitants eux-mêmes$t$,
    $t$Appui à la structuration d'associations et de groupements de quartier$t$,
    $t$Mise en relation des communautés avec les ressources disponibles$t$
  ],
  array[
    $t$Communautés de quartier de Douala et Yaoundé$t$,
    $t$Villages et localités des régions de l'intérieur$t$,
    $t$Groupements et associations locales$t$
  ],
  array[
    $t$Financer une session de formation pour un groupement$t$,
    $t$Animer un atelier de renforcement des capacités$t$,
    $t$Mettre à disposition une expertise en gestion de projet$t$
  ],
  $t$Développement communautaire$t$, 1, 'published'
),
(
  $t$education$t$,
  $t$Éducation$t$,
  $t$Éducation$t$,
  $t$Soutien scolaire, alphabétisation et bourses pour les enfants et les jeunes défavorisés.$t$,
  $t$GraduationCap$t$, 'navy',
  array[
    $t$Séances de soutien scolaire pour les élèves en difficulté$t$,
    $t$Programmes d'alphabétisation pour les jeunes et les adultes$t$,
    $t$Attribution de bourses aux élèves et étudiants défavorisés$t$,
    $t$Distribution de fournitures et de manuels scolaires$t$
  ],
  array[
    $t$Enfants scolarisés en difficulté d'apprentissage$t$,
    $t$Jeunes déscolarisés ou jamais scolarisés$t$,
    $t$Adultes en situation d'illettrisme$t$
  ],
  array[
    $t$Financer une année de scolarité pour un enfant$t$,
    $t$Encadrer une séance de soutien scolaire$t$,
    $t$Fournir des manuels et du matériel pédagogique$t$
  ],
  $t$Éducation et soutien scolaire$t$, 2, 'published'
),
(
  $t$sante$t$,
  $t$Santé$t$,
  $t$Santé$t$,
  $t$Campagnes médicales et accès aux soins dans les zones rurales.$t$,
  $t$Stethoscope$t$, 'green',
  array[
    $t$Organisation de campagnes médicales en zone rurale$t$,
    $t$Consultations et dépistages gratuits$t$,
    $t$Sensibilisation à la prévention et à l'hygiène$t$,
    $t$Orientation des patients vers les structures de soins adaptées$t$
  ],
  array[
    $t$Populations rurales éloignées des centres de santé$t$,
    $t$Familles sans couverture médicale$t$,
    $t$Personnes âgées et enfants en bas âge$t$
  ],
  array[
    $t$Financer une campagne de dépistage$t$,
    $t$Participer comme professionnel de santé bénévole$t$,
    $t$Contribuer en matériel médical et en médicaments$t$
  ],
  $t$Santé et campagnes médicales$t$, 3, 'published'
),
(
  $t$accompagnement-familles$t$,
  $t$Accompagnement des familles$t$,
  $t$Familles$t$,
  $t$Assistance sociale, aide alimentaire et soutien psychosocial aux familles fragilisées.$t$,
  $t$HandHeart$t$, 'orange',
  array[
    $t$Accompagnement social des familles en difficulté$t$,
    $t$Distribution d'aide alimentaire$t$,
    $t$Écoute et soutien psychosocial$t$,
    $t$Orientation vers les dispositifs d'aide existants$t$
  ],
  array[
    $t$Familles en situation de précarité$t$,
    $t$Parents isolés$t$,
    $t$Foyers touchés par une rupture ou un deuil$t$
  ],
  array[
    $t$Financer un colis alimentaire familial$t$,
    $t$Assurer des permanences d'écoute$t$,
    $t$Apporter une compétence en travail social ou en psychologie$t$
  ],
  $t$Accompagnement des familles$t$, 4, 'published'
),
(
  $t$inclusion-sociale$t$,
  $t$Inclusion sociale$t$,
  $t$Inclusion$t$,
  $t$Intégration des personnes en situation de handicap et des personnes marginalisées.$t$,
  $t$Accessibility$t$, 'blue',
  array[
    $t$Accompagnement vers l'autonomie des personnes en situation de handicap$t$,
    $t$Sensibilisation des communautés à la lutte contre les discriminations$t$,
    $t$Appui à l'accès à l'éducation et à l'emploi$t$,
    $t$Création d'espaces de rencontre et d'échange$t$
  ],
  array[
    $t$Personnes en situation de handicap et leurs familles$t$,
    $t$Personnes marginalisées ou isolées socialement$t$,
    $t$Communautés d'accueil à sensibiliser$t$
  ],
  array[
    $t$Financer un dispositif d'aide à la mobilité$t$,
    $t$Animer un atelier de sensibilisation$t$,
    $t$Accompagner une personne dans ses démarches$t$
  ],
  $t$Inclusion sociale et handicap$t$, 5, 'published'
),
(
  $t$protection-environnement$t$,
  $t$Protection de l'environnement$t$,
  $t$Environnement$t$,
  $t$Sensibilisation écologique, plantation d'arbres et initiatives vertes.$t$,
  $t$Leaf$t$, 'green',
  array[
    $t$Campagnes de sensibilisation écologique$t$,
    $t$Opérations de plantation d'arbres$t$,
    $t$Actions de salubrité et de gestion des déchets$t$,
    $t$Accompagnement d'initiatives vertes portées par les jeunes$t$
  ],
  array[
    $t$Écoles et établissements scolaires$t$,
    $t$Quartiers et communautés urbaines$t$,
    $t$Groupes de jeunes engagés$t$
  ],
  array[
    $t$Financer une opération de plantation$t$,
    $t$Participer à une journée de salubrité$t$,
    $t$Apporter du matériel (plants, outils, équipements)$t$
  ],
  $t$Protection de l'environnement$t$, 6, 'published'
),
(
  $t$youth-empowerment$t$,
  $t$Youth Empowerment$t$,
  $t$Jeunesse$t$,
  $t$Formation professionnelle, leadership et entrepreneuriat des jeunes.$t$,
  $t$Rocket$t$, 'navy',
  array[
    $t$Ateliers de formation professionnelle$t$,
    $t$Parcours de développement du leadership$t$,
    $t$Accompagnement à la création d'activité$t$,
    $t$Mise en relation avec des mentors et des partenaires$t$
  ],
  array[
    $t$Jeunes sans qualification professionnelle$t$,
    $t$Jeunes porteurs d'un projet entrepreneurial$t$,
    $t$Élèves et étudiants en fin de parcours$t$
  ],
  array[
    $t$Financer une place en formation professionnelle$t$,
    $t$Accompagner un jeune comme mentor$t$,
    $t$Ouvrir un stage ou une opportunité d'emploi$t$
  ],
  $t$Jeunesse, formation et entrepreneuriat$t$, 7, 'published'
),
(
  $t$women-empowerment$t$,
  $t$Women's Empowerment$t$,
  $t$Femmes$t$,
  $t$Autonomisation des femmes par la formation, l'artisanat et le soutien économique.$t$,
  $t$Sprout$t$, 'orange',
  array[
    $t$Formations professionnelles et techniques$t$,
    $t$Ateliers d'artisanat et valorisation des savoir-faire$t$,
    $t$Appui économique aux activités génératrices de revenus$t$,
    $t$Groupes d'entraide et de partage d'expérience$t$
  ],
  array[
    $t$Femmes en recherche d'autonomie financière$t$,
    $t$Mères de famille en situation de précarité$t$,
    $t$Artisanes et petites entrepreneures$t$
  ],
  array[
    $t$Financer un kit de démarrage d'activité$t$,
    $t$Animer une formation ou un atelier$t$,
    $t$Acheter et faire connaître les productions artisanales$t$
  ],
  $t$Autonomisation des femmes$t$, 8, 'published'
);


-- ===========================================================================
-- 2. ACTUALITÉS — src/content/actualites.ts
--
-- 5 catégories + 3 articles.
--
-- `is_placeholder` reprend la valeur réelle du fichier source : elle vaut
-- `false` sur les trois articles, malgré le commentaire d'en-tête qui les
-- décrit comme des gabarits. Le seed recopie la donnée, il ne la corrige pas.
--
-- Les dates sont relatives (`now() - interval`), comme dans le fichier source
-- où `joursAvant()` les recalcule à chaque build. Les figer en dur
-- reproduirait exactement le défaut que ce commentaire dénonce : « un gabarit
-- de démonstration ne doit pas afficher une date vieille de deux ans ».
-- ===========================================================================

insert into public.article_categories (slug, label, position) values
  ($t$education$t$,             $t$Éducation$t$,             1),
  ($t$sante$t$,                 $t$Santé$t$,                 2),
  ($t$communaute$t$,            $t$Communauté$t$,            3),
  ($t$environnement$t$,         $t$Environnement$t$,         4),
  ($t$vie-de-l-association$t$,  $t$Vie de l'association$t$,  5);

insert into public.articles
  (slug, title, excerpt, body, category_id, reading_minutes,
   is_placeholder, published_at, status)
values
(
  $t$exemple-campagne-sante-communautaire$t$,
  $t$Campagne de santé communautaire$t$,
  $t$Gabarit d'article : décrivez ici une campagne médicale, le lieu, le nombre de personnes reçues et les partenaires mobilisés.$t$,
  jsonb_build_array(
    $t$Ce texte est un exemple de mise en page. Remplacez-le par le récit d'une action réelle : où, quand, avec qui, et ce que cela a changé pour les personnes concernées.$t$,
    $t$Un bon article d'actualité pour une association répond à quatre questions : ce qui a été fait, pour combien de personnes, avec quels partenaires, et ce qu'il reste à faire. Les donateurs cherchent des faits vérifiables plutôt que des intentions.$t$,
    $t$Terminez par un appel à l'action clair : soutenir la prochaine campagne, se porter volontaire, ou faire connaître l'initiative.$t$
  ),
  (select id from public.article_categories where slug = $t$sante$t$),
  3, false, (current_date - 9) + time '09:00', 'published'
),
(
  $t$exemple-rentree-scolaire-solidaire$t$,
  $t$Rentrée scolaire solidaire$t$,
  $t$Gabarit d'article : racontez une distribution de fournitures ou l'attribution de bourses, avec le nombre d'élèves concernés.$t$,
  jsonb_build_array(
    $t$Ce texte est un exemple de mise en page. Décrivez ici l'action menée à l'occasion de la rentrée : établissements concernés, nombre d'élèves accompagnés, nature de l'aide apportée.$t$,
    $t$Une photo prise sur place vaut mieux qu'une illustration générique : déposez-la dans `public/images/actualites/` en la nommant d'après le slug de l'article.$t$,
    $t$Pensez à citer nommément vos partenaires : c'est une preuve de sérieux, et cela leur donne une raison de partager l'article.$t$
  ),
  (select id from public.article_categories where slug = $t$education$t$),
  2, false, (current_date - 24) + time '09:00', 'published'
),
(
  $t$exemple-plantation-arbres-quartier$t$,
  $t$Plantation d'arbres dans le quartier$t$,
  $t$Gabarit d'article : présentez une opération environnementale, le nombre de plants mis en terre et les bénévoles mobilisés.$t$,
  jsonb_build_array(
    $t$Ce texte est un exemple de mise en page. Racontez l'opération : lieu, date, nombre de plants, personnes mobilisées, suite prévue pour l'entretien.$t$,
    $t$Les actions environnementales se prêtent bien au format « avant / après » : deux photos prises au même endroit à quelques mois d'intervalle montrent un résultat concret.$t$,
    $t$Indiquez comment rejoindre la prochaine opération : c'est le meilleur moment pour convertir un lecteur en bénévole.$t$
  ),
  (select id from public.article_categories where slug = $t$environnement$t$),
  2, false, (current_date - 47) + time '09:00', 'published'
);


-- ===========================================================================
-- 3. VALEURS · FAQ · CHIFFRES CLÉS
-- ===========================================================================

-- src/content/valeurs.ts — 4 valeurs
insert into public.core_values (title, description, icon, tone, position) values
  ($t$Solidarité$t$,   $t$L'union fait la force : chaque geste compte.$t$,              $t$HeartHandshake$t$, 'blue',   1),
  ($t$Respect$t$,      $t$Chaque individu est traité avec dignité, sans distinction.$t$, $t$ShieldCheck$t$,    'navy',   2),
  ($t$Innovation$t$,   $t$Des approches créatives pour maximiser l'impact.$t$,           $t$Lightbulb$t$,      'orange', 3),
  ($t$Impact social$t$,$t$Des résultats mesurés et durables.$t$,                         $t$TrendingUp$t$,     'green',  4);


-- src/content/faq.ts — 7 questions.
-- Les valeurs interpolées à la construction (téléphone, e-mail, [À COMPLÉTER])
-- sont matérialisées ici depuis src/lib/site-config.ts.
insert into public.faq_items (topic, question, answer, bullets, position, status) values
(
  $t$don$t$,
  $t$Comment faire un don à ADEBES ?$t$,
  $t$Plusieurs canaux sont possibles. Le plus direct reste WhatsApp, où un membre de l'équipe vous répond et vous accompagne dans la démarche.$t$,
  array[
    $t$WhatsApp : +237 680 67 89 39 — réponse pendant les heures d'ouverture$t$,
    $t$Par e-mail : contact@adebes.cm$t$,
    $t$Mobile Money (Orange Money, MTN Mobile Money) : coordonnées communiquées sur demande$t$,
    $t$Virement bancaire : coordonnées communiquées sur demande$t$
  ],
  1, 'published'
),
(
  $t$don$t$,
  $t$Mon don est-il bien utilisé ?$t$,
  $t$Chaque don est affecté à un programme identifié. Un rapport d'utilisation est envoyé sur demande aux donateurs, et les rapports d'activité de l'association sont publiés sur la page Impact et transparence dès leur validation.$t$,
  '{}', 2, 'published'
),
(
  $t$don$t$,
  $t$Puis-je choisir le programme que je soutiens ?$t$,
  $t$Oui. Indiquez simplement le programme concerné lors de votre prise de contact : votre don lui sera affecté en priorité.$t$,
  '{}', 3, 'published'
),
(
  $t$benevolat$t$,
  $t$Comment devenir bénévole ?$t$,
  $t$Remplissez le formulaire de candidature sur la page Devenir bénévole : indiquez votre domaine d'intérêt et vos disponibilités. Un membre de l'équipe vous recontacte pour un premier échange.$t$,
  '{}', 4, 'published'
),
(
  $t$benevolat$t$,
  $t$Faut-il une compétence particulière pour être bénévole ?$t$,
  $t$Non. Certaines missions demandent une qualification (santé, formation professionnelle, accompagnement psychosocial), mais beaucoup d'actions reposent avant tout sur la disponibilité et l'engagement.$t$,
  '{}', 5, 'published'
),
(
  $t$general$t$,
  $t$Où intervenez-vous au Cameroun ?$t$,
  $t$Principalement à Douala et Yaoundé, ainsi que dans les régions de l'intérieur du pays selon les programmes et les besoins identifiés.$t$,
  '{}', 6, 'published'
),
(
  $t$general$t$,
  $t$ADEBES est-elle une association légalement enregistrée ?$t$,
  $t$ADEBES est une association camerounaise à but non lucratif. Numéro d'enregistrement : [À COMPLÉTER]. Les informations légales complètes figurent dans les mentions légales.$t$,
  '{}', 7, 'published'
);


-- ---------------------------------------------------------------------------
-- src/content/stats.ts — 4 chiffres
--
-- ⚠️  `beneficiaires` a `value = NULL`, exactement comme aujourd'hui. C'est
-- l'invariant nº 1 du projet : le site affichera « — » et la mention
-- explicative, jamais « 0 ».
--
-- ⚠️  CHANGEMENT DE COMPORTEMENT À CONNAÎTRE — deux chiffres étaient calculés
-- à chaque build et deviennent des valeurs stockées :
--
--   * `programmes` valait `programmes.length` → figé à 8. Sans conséquence
--     tant que le nombre de programmes ne change pas ; à mettre à jour depuis
--     le dashboard si un neuvième programme est créé.
--   * `annees` valait `année courante - 2020` → figé à 6 (2026). Il ne
--     s'incrémentera plus tout seul au 1er janvier.
--
-- Les deux portent déjà `to_confirm = true` côté `annees` ; le tableau de bord
-- les signalera. Aucune valeur n'est inventée pour autant : ce sont bien les
-- valeurs affichées aujourd'hui.
-- ---------------------------------------------------------------------------
insert into public.stats (key, label, value, suffix, icon, note, to_confirm, position) values
(
  $t$beneficiaires$t$, $t$Bénéficiaires accompagnés$t$, null, $t$+$t$, $t$Users$t$,
  $t$Chiffre à fournir par ADEBES à partir des rapports d'activité.$t$, false, 1
),
(
  $t$projets$t$, $t$Projets menés$t$, 30, $t$+$t$, $t$Target$t$,
  $t$Valeur affichée sur l'ancien site — à revalider.$t$, true, 2
),
(
  $t$programmes$t$, $t$Programmes actifs$t$, 8, null, $t$Layers$t$,
  $t$Correspond aux domaines d'intervention présentés sur ce site.$t$, false, 3
),
(
  $t$annees$t$, $t$Années au service des communautés$t$, 6, $t$+$t$, $t$CalendarDays$t$,
  $t$Calculé à partir de l'année de création renseignée dans la configuration du site.$t$, true, 4
);


-- ===========================================================================
-- 4. ÉQUIPE — src/content/equipe.ts
--
-- `status = 'draft'` conformément au §1.7.4 du Rapport 2 : ces trois fiches
-- ne portent aucun nom réel, seulement des « [À COMPLÉTER] ». Elles resteront
-- invisibles du site public tant qu'elles ne seront pas renseignées, ce qui
-- est le comportement voulu — on ne publie pas une gouvernance anonyme sur le
-- site d'une structure qui collecte des dons.
-- ===========================================================================

insert into public.team_members (name, role, bio, position, status) values
(
  $t$[À COMPLÉTER]$t$, $t$Président·e / Direction$t$,
  $t$Responsable de la stratégie générale et de la représentation de l'association.$t$,
  1, 'draft'
),
(
  $t$[À COMPLÉTER]$t$, $t$Coordination des programmes$t$,
  $t$Pilote la mise en œuvre des 8 programmes sur le terrain.$t$,
  2, 'draft'
),
(
  $t$[À COMPLÉTER]$t$, $t$Coordination terrain et bénévoles$t$,
  $t$Organise les interventions et l'accompagnement des bénévoles.$t$,
  3, 'draft'
);


-- ===========================================================================
-- 5. TÉMOIGNAGES ET GALERIE
--
-- Témoignages : `status = 'published'` pour préserver le rendu actuel de la
-- page d'accueil, qui les affiche. `has_consent = false` est la vérité : ce
-- sont des emplacements de gabarit signés « Prénom », pas des paroles de
-- personnes réelles. Aucun accord n'a donc été donné, et aucun n'est
-- prétendu.
-- ===========================================================================

insert into public.testimonials
  (quote, author_name, author_role, programme_id, has_consent, position, status)
values
(
  $t$Emplacement réservé au témoignage d'un bénéficiaire. Deux phrases suffisent : ce qui a changé, et grâce à quoi.$t$,
  $t$Prénom$t$, $t$Bénéficiaire du programme Éducation$t$,
  (select id from public.programmes where slug = $t$education$t$),
  false, 1, 'published'
),
(
  $t$Emplacement réservé au témoignage d'un bénévole. Décrivez en quelques mots la mission et ce qu'elle apporte.$t$,
  $t$Prénom$t$, $t$Bénévole depuis 2 ans$t$,
  (select id from public.programmes where slug = $t$developpement-communautaire$t$),
  false, 2, 'published'
),
(
  $t$Emplacement réservé au témoignage d'un partenaire : entreprise, école ou structure de santé ayant travaillé avec ADEBES.$t$,
  $t$Prénom$t$, $t$Partenaire$t$,
  (select id from public.programmes where slug = $t$sante$t$),
  false, 3, 'published'
);


-- Les 4 catégories de galerie. Aucun `gallery_items` n'est créé : les 4 photos
-- réelles de `public/images/galerie/` doivent d'abord être téléversées dans
-- Storage et cataloguées dans `media_assets`, ce qui est le travail du Lot 8H.
insert into public.gallery_categories (slug, label, tone, position) values
  ($t$education$t$,     $t$Éducation$t$,     'navy',  1),
  ($t$sante$t$,         $t$Santé$t$,         'green', 2),
  ($t$communaute$t$,    $t$Communauté$t$,    'blue',  3),
  ($t$environnement$t$, $t$Environnement$t$, 'green', 4);


-- ---------------------------------------------------------------------------
-- Rapports annuels — src/content/equipe.ts (`rapports`).
--
-- Ajout au-delà de la liste littérale du §1.7, signalé comme tel : ces deux
-- entrées existent bien dans le fichier source, et les omettre ferait perdre
-- la donnée au Lot 8I.
--
-- Aucun document rattaché : `public/documents/` n'existe pas, et le lien reste
-- masqué tant que le PDF est absent. C'est exactement le comportement actuel.
--
-- ⚠️  `status = 'published'` — CORRIGÉ AU LOT 8I, ET C'EST UN VRAI DÉFAUT DU
-- SEED, PAS UN CHANGEMENT D'AVIS.
--
-- Ces deux lignes étaient seedées en `'draft'`, au motif que « le lien reste
-- masqué tant que le PDF est absent » — vrai pour le LIEN, faux pour la LIGNE.
-- Le site affiche aujourd'hui les deux rapports, avec la mention « En cours de
-- préparation » et la pastille « Bientôt disponible » : ce sont deux contenus
-- visibles, pas deux absences.
--
-- Tant que rien ne lisait cette table, l'écart ne se voyait pas. À la bascule
-- du Lot 8I, il devenait une régression : la lecture publique ne rend que les
-- rapports `published`, et la section « Rapports d'activité » aurait disparu
-- de `/impact`. Or le §8x exige que « le rendu public soit IDENTIQUE à l'actuel
-- pour les données migrées ».
--
-- ⚠️  Le trigger `guard_publish` laisse passer parce que `auth.uid()` est nul
-- pendant le seed (écart nº 9) — c'est la même porte qui permet d'insérer les
-- 8 programmes publiés.
--
-- Les années étaient calculées (`année courante - 1` et `- 2`) : elles sont
-- figées ici, comme les chiffres du §3.
-- ---------------------------------------------------------------------------
insert into public.annual_reports (year, title, position, status) values
  (2025, $t$Rapport d'activité 2025$t$, 1, 'published'),
  (2024, $t$Rapport d'activité 2024$t$, 2, 'published');


-- ===========================================================================
-- 6. PAGES ÉDITORIALES ET LEURS SECTIONS
--
-- Les 10 pages éditoriales + les 2 pages légales, toutes `is_system = true` :
-- chacune correspond à une route qui existe en dur dans `src/app/`, et sa
-- suppression laisserait une route sans contenu.
--
-- ⚠️  LES SECTIONS SONT DES SQUELETTES : `block_type` et `position` sont
-- posés d'après le relevé du §1 du Rapport 1, mais `content` reste vide.
--
-- C'est délibéré et conforme au découpage : le §9.5 du Rapport 2 confie
-- explicitement au Lot 9 la conversion du contenu, « section par section, en
-- comparant le rendu avant/après ». Les schémas des blocs n'existent pas
-- encore (registre du Lot 9) ; inventer ici la forme de leur `content`
-- reviendrait à préempter ce travail avec des données non validées.
--
-- Le comportement dégradé est sûr : `SectionRenderer` applique
-- `schema.safeParse` et ignore une section invalide sans casser la page
-- (§9.4). Et le site public continue de lire `src/content/` jusqu'au Lot 15.
--
-- Les pages `/mentions-legales` et `/politique-confidentialite` n'ont
-- volontairement aucune section : elles sont alimentées par le groupe de
-- réglages `legal` (§1.7.6).
-- ===========================================================================

insert into public.pages (slug, route, title, status, is_system, published_at) values
  ($t$accueil$t$,                    $t$/$t$,                          $t$Accueil$t$,                     'published', true, now()),
  ($t$a-propos$t$,                   $t$/a-propos$t$,                  $t$Qui sommes-nous$t$,             'published', true, now()),
  ($t$biographie$t$,                 $t$/biographie$t$,                $t$Biographie$t$,                  'published', true, now()),
  ($t$programmes$t$,                 $t$/programmes$t$,                $t$Nos programmes$t$,              'published', true, now()),
  ($t$impact$t$,                     $t$/impact$t$,                    $t$Impact et transparence$t$,      'published', true, now()),
  ($t$actualites$t$,                 $t$/actualites$t$,                $t$Actualités$t$,                  'published', true, now()),
  ($t$galerie$t$,                    $t$/galerie$t$,                   $t$Galerie$t$,                     'published', true, now()),
  ($t$don$t$,                        $t$/don$t$,                       $t$Faire un don$t$,                'published', true, now()),
  ($t$benevolat$t$,                  $t$/benevolat$t$,                 $t$Devenir bénévole$t$,            'published', true, now()),
  ($t$contact$t$,                    $t$/contact$t$,                   $t$Contact$t$,                     'published', true, now()),
  ($t$mentions-legales$t$,           $t$/mentions-legales$t$,          $t$Mentions légales$t$,            'published', true, now()),
  ($t$politique-confidentialite$t$,  $t$/politique-confidentialite$t$, $t$Politique de confidentialité$t$,'published', true, now());


-- Les sections, avec leur contenu RÉEL — migré au Lot 9 (§9.5 du Rapport 2)
-- depuis les dix pages `.tsx` alors statiques. Le texte est repris mot pour
-- mot ; trois écarts par rapport au relevé initial du §1 du Rapport 1 sont
-- documentés dans l'en-tête de `src/recette/lot9-migration-contenu.ts`
-- (fichier temporaire du lot, supprimé une fois la migration recettée) :
--
--   * `/a-propos` position 4 : `rich-text` prévu au §1, `feature-list` réel —
--     le contenu (deux cartes icône + titre + description) est la forme
--     exacte de ce bloc, pas du texte libre ;
--   * `/don` et `/benevolat` : une seule des sections prévues correspond à du
--     contenu ÉDITORIAL statique. « À quoi sert votre don » et « Domaines
--     d'engagement » listent des PROGRAMMES lus en direct — une donnée
--     dérivée d'une autre collection, pas du contenu propre à la page — et
--     restent du code (`src/app/(site)/don/page.tsx`,
--     `src/app/(site)/benevolat/page.tsx`), comme le formulaire et la carte
--     de `/contact` l'étaient déjà avant ce lot ;
--   * `/contact` n'a AUCUNE section : sa colonne « Coordonnées » est
--     indissociable de la mise en page à deux colonnes qui l'associe au
--     formulaire, et `contact-info` n'a pas cette forme. La page reste 100 %
--     du code.
--
-- Trois visuels ont été migrés dans le bucket `media` à cette occasion
-- (`histoire-01.png`, `histoire-01.jpeg`, `portrait.png` — mêmes fichiers,
-- mêmes textes alternatifs que le code d'origine) ; leurs identifiants sont
-- donc FIXES ci-dessous plutôt que recalculés, contrairement aux quatre
-- photos de galerie du Lot 8H qui restent résolues par sous-requête. Une
-- installation neuve doit téléverser ces trois fichiers AVANT ce script —
-- voir `docs/REPRISE-CONTEXTE.md`, section Lot 9 — et corriger les trois
-- `mediaId` ci-dessous si les identifiants générés diffèrent.
insert into public.page_sections (page_id, block_type, position, content)
select p.id, s.block_type, s.position, s.content
from public.pages p
join (values
  -- accueil
  ($t$accueil$t$, $t$stats-grid$t$, 1, $t${"align":"left","badge":"","title":"","subtitle":"","showNotes":false}$t$::jsonb),
  ($t$accueil$t$, $t$image-text$t$, 2, $t${"tone":"blue","badge":"Qui sommes-nous","title":"Une association camerounaise au service des communautés","bullets":["Présente à Douala, Yaoundé et dans les régions de l'intérieur","8 programmes complémentaires, du soutien scolaire à l'autonomisation des femmes","Une action de terrain menée avec les communautés, pas à leur place"],"ctaHref":"/a-propos","mediaId":"6d001cc6-3221-4448-9523-601695253102","ctaLabel":"En savoir plus sur ADEBES","subtitle":"ADEBES est une organisation à but non lucratif qui agit dans l'éducation, la santé, l'inclusion sociale et le développement communautaire.","imageSide":"left","paragraphs":[]}$t$::jsonb),
  ($t$accueil$t$, $t$values-grid$t$, 3, $t${"align":"center","badge":"Nos valeurs","title":"Ce qui guide chacune de nos actions","subtitle":""}$t$::jsonb),
  ($t$accueil$t$, $t$programmes-grid$t$, 4, $t${"badge":"Nos programmes","limit":6,"title":"Huit domaines d'intervention","ctaHref":"/programmes","ctaLabel":"Voir les 8 programmes","subtitle":"Chaque programme a sa page dédiée : objectifs, actions menées et façons concrètes de le soutenir."}$t$::jsonb),
  ($t$accueil$t$, $t$testimonials$t$, 5, $t${"align":"center","badge":"Témoignages","limit":3,"title":"Celles et ceux qui font vivre ADEBES","subtitle":"Bénéficiaires, bénévoles et partenaires racontent ce que change une action de terrain."}$t$::jsonb),
  ($t$accueil$t$, $t$news-grid$t$, 6, $t${"badge":"Actualités","limit":3,"title":"Les nouvelles du terrain","ctaHref":"/actualites","ctaLabel":"Toutes les actualités","subtitle":"Les dernières actions menées et les prochaines échéances."}$t$::jsonb),
  ($t$accueil$t$, $t$faq$t$, 7, $t${"align":"center","badge":"Questions fréquentes","title":"Vous vous posez ces questions","source":"accueil","subtitle":"","openFirst":false,"background":"surface","footerHref":"/contact","footerText":"Une autre question ?","footerLinkLabel":"Écrivez-nous"}$t$::jsonb),
  -- a-propos
  ($t$a-propos$t$, $t$image-text$t$, 1, $t${"tone":"blue","badge":"Notre mission","title":"Agir avec les communautés, pas à leur place","bullets":[],"ctaHref":"/programmes","mediaId":"cae9e272-2ce2-42b9-ac32-74de14e3b430","ctaLabel":"Découvrir nos 8 programmes","subtitle":"ADEBES est une organisation camerounaise à but non lucratif qui intervient dans l'éducation, la santé, l'inclusion sociale et le développement communautaire.","imageSide":"left","paragraphs":["Nous intervenons principalement à Douala et Yaoundé, ainsi que dans les régions de l'intérieur du Cameroun, là où les besoins identifiés avec les habitants ne trouvent pas de réponse.","Nos huit programmes sont complémentaires : soutenir la scolarité d'un enfant a peu de sens si sa famille n'a pas accès aux soins, et former une femme à un métier suppose qu'elle dispose d'un capital de départ. C'est cette articulation qui fait notre méthode."]}$t$::jsonb),
  ($t$a-propos$t$, $t$values-grid$t$, 2, $t${"align":"center","badge":"Nos valeurs","title":"Quatre principes appliqués au quotidien","subtitle":""}$t$::jsonb),
  ($t$a-propos$t$, $t$team-grid$t$, 3, $t${"align":"left","badge":"L'équipe","title":"Celles et ceux qui portent l'association","subtitle":"Savoir qui dirige une association est un signal de confiance au moins aussi important qu'un chiffre d'impact."}$t$::jsonb),
  ($t$a-propos$t$, $t$feature-list$t$, 4, $t${"align":"left","badge":"Gouvernance","items":[{"icon":"Landmark","title":"Statut juridique","description":"Association camerounaise à but non lucratif. Numéro d'enregistrement : [À COMPLÉTER]"},{"icon":"ShieldCheck","title":"Redevabilité","description":"Rapports d'activité publiés et chiffres sourcés sur la page Impact et transparence."}],"title":"Statut et transparence","columns":"2","centered":false,"subtitle":"Les informations légales complètes figurent dans les mentions légales et sur la page Impact.","footerHref":"","footerText":"","footerLinkLabel":""}$t$::jsonb),
  -- biographie
  ($t$biographie$t$, $t$image-text$t$, 1, $t${"tone":"navy","badge":"Présentation","title":"Un parcours au service du développement","bullets":[],"ctaHref":"/a-propos","mediaId":"c4efdb9c-8910-4eba-93a5-aaf35552db27","ctaLabel":"Découvrir l'association","subtitle":"Homme politique et opérateur économique — Cameroun.","imageSide":"left","paragraphs":["En parallèle de ses activités économiques, il prend en charge des personnes malades par les soins traditionnels: le traitement à l'indigène, une pratique de proximité ancrée dans les savoirs locaux.","Engagement public, investissement productif et action de terrain se rejoignent dans une même finalité : contribuer au développement du Cameroun."]}$t$::jsonb),
  ($t$biographie$t$, $t$feature-list$t$, 2, $t${"align":"center","badge":"Domaines d'activité","items":[{"icon":"Landmark","title":"Engagement politique","description":"Homme politique, engagé dans la vie publique et le débat citoyen au Cameroun."},{"icon":"Sprout","title":"Agriculture","description":"Investisseur dans le secteur agricole, moteur de production et d'emploi local."},{"icon":"HardHat","title":"Bâtiment et travaux publics","description":"Investisseur dans le bâtiment et les travaux publics, au service des infrastructures."},{"icon":"Briefcase","title":"Opérateur économique","description":"Acteur du tissu économique camerounais, à travers plusieurs secteurs d'activité."}],"title":"Quatre terrains d'engagement","columns":"3","centered":true,"subtitle":"","footerHref":"","footerText":"","footerLinkLabel":""}$t$::jsonb),
  ($t$biographie$t$, $t$feature-list$t$, 3, $t${"align":"left","badge":"Au-delà de l'économie","items":[{"icon":"HeartPulse","title":"Soins aux personnes malades","description":"Il prend en charge des personnes malades par les soins traditionnels: le traitement à l'indigène, selon les savoirs et la pharmacopée locale."},{"icon":"Globe","title":"Contribution au développement du pays","description":"Ses activités économiques comme son action de terrain concourent au développement du Cameroun."}],"title":"Une action tournée vers les personnes","columns":"2","centered":false,"subtitle":"Les activités économiques ne résument pas son engagement : le soin apporté aux personnes malades et la contribution au développement du pays en font partie intégrante.","footerHref":"","footerText":"","footerLinkLabel":""}$t$::jsonb),
  ($t$biographie$t$, $t$rich-text$t$, 4, $t${"align":"left","badge":"Biographie à compléter","title":"Informations en attente","width":"default","subtitle":"","paragraphs":["Seuls les éléments transmis figurent sur cette page : aucune date ni aucune fonction n'a été ajoutée par déduction. Les précisions suivantes viendront la compléter dès qu'elles seront fournies.","Parcours détaillé : formation, dates et étapes clés.","Fonctions et mandats politiques exercés, avec leurs dates.","Lien avec ADEBES : fonction exercée ou nature du soutien apporté."]}$t$::jsonb),
  -- programmes
  ($t$programmes$t$, $t$programmes-grid$t$, 1, $t${"badge":"","limit":null,"title":"","ctaHref":"","ctaLabel":"","subtitle":""}$t$::jsonb),
  -- impact
  ($t$impact$t$, $t$stats-grid$t$, 1, $t${"align":"left","badge":"","title":"Nos chiffres","subtitle":"Chaque valeur est accompagnée de sa source. Les chiffres en attente de consolidation sont signalés plutôt qu'arrondis au hasard.","showNotes":true}$t$::jsonb),
  ($t$impact$t$, $t$feature-list$t$, 2, $t${"align":"center","badge":"Nos engagements","items":[{"icon":"ShieldCheck","title":"Chaque don est affecté","description":"Un don est rattaché à un programme identifié. Vous pouvez préciser lequel au moment de votre contact."},{"icon":"ShieldCheck","title":"Un rapport sur demande","description":"Tout donateur peut demander le détail de l'utilisation de son don. La demande se fait par e-mail ou WhatsApp."},{"icon":"ShieldCheck","title":"Des chiffres vérifiables","description":"Nous ne publions que des chiffres issus de nos rapports d'activité. Un chiffre non consolidé n'est pas affiché."},{"icon":"ShieldCheck","title":"Aucune collecte cachée","description":"Le site ne collecte aucune donnée à votre insu. Les seules informations reçues sont celles que vous nous transmettez volontairement."}],"title":"Quatre règles que nous nous imposons","columns":"2","centered":false,"subtitle":"","footerHref":"","footerText":"","footerLinkLabel":""}$t$::jsonb),
  ($t$impact$t$, $t$documents-list$t$, 3, $t${"badge":"Documents","title":"Rapports d'activité","subtitle":"L'ancien site promettait un rapport envoyé sur demande sans rien publier. Les rapports validés sont désormais téléchargeables directement ici.","footerHref":"mailto:contact@adebes.cm","footerText":"Vous souhaitez le détail de l'utilisation d'un don ?","footerLinkLabel":"contact@adebes.cm"}$t$::jsonb),
  ($t$impact$t$, $t$feature-list$t$, 4, $t${"align":"center","badge":"Où nous agissons","items":[{"icon":"Globe","title":"Douala","description":"Siège de l'association et actions urbaines"},{"icon":"Globe","title":"Yaoundé","description":"Programmes éducatifs et sociaux"},{"icon":"Globe","title":"Régions de l'intérieur","description":"Campagnes de santé et actions rurales"}],"title":"Nos zones d'intervention","columns":"3","centered":true,"subtitle":"","footerHref":"","footerText":"","footerLinkLabel":""}$t$::jsonb),
  -- actualites
  ($t$actualites$t$, $t$news-grid$t$, 1, $t${"badge":"","limit":null,"title":"","ctaHref":"","ctaLabel":"","subtitle":""}$t$::jsonb),
  -- galerie
  ($t$galerie$t$, $t$gallery-preview$t$, 1, $t${"align":"left","badge":"","limit":null,"title":"","ctaHref":"","ctaLabel":"","subtitle":"","showFilters":true,"categorySlug":""}$t$::jsonb),
  ($t$galerie$t$, $t$video$t$, 2, $t${"tone":"navy","align":"center","badge":"Vidéo","title":"ADEBES en mouvement","videoId":"","provider":"none","subtitle":"Les vidéos sont hébergées sur une plateforme externe et chargées uniquement au clic : aucune donnée mobile n'est consommée avant que vous ne lanciez la lecture.","videoTitle":"Présentation d'ADEBES","posterMediaId":null}$t$::jsonb),
  -- don
  ($t$don$t$, $t$donation-options$t$, 1, $t${"align":"center","badge":"Moyens de paiement","title":"D'autres façons de donner","methods":[{"icon":"HandHeart","title":"Mobile Money","status":"Coordonnées communiquées sur demande","description":"Orange Money et MTN Mobile Money."},{"icon":"Landmark","title":"Virement bancaire","status":"Coordonnées communiquées sur demande","description":"Pour les dons importants et les partenariats."},{"icon":"Briefcase","title":"Carte bancaire","status":"Bientôt disponible","description":"Utile pour les donateurs de la diaspora."}],"subtitle":"WhatsApp reste le canal le plus rapide. Ces moyens complémentaires sont disponibles ou en cours de mise en place.","background":"surface","footerHref":"mailto:contact@adebes.cm","footerText":"Pour obtenir les coordonnées de paiement, écrivez à","showAmounts":false,"footerLinkLabel":"contact@adebes.cm"}$t$::jsonb),
  ($t$don$t$, $t$faq$t$, 2, $t${"align":"center","badge":"Questions fréquentes","title":"Vos questions sur les dons","source":"don","subtitle":"","openFirst":false,"background":"default","footerHref":"/benevolat","footerText":"Vous préférez donner de votre temps ?","footerLinkLabel":"Devenez bénévole"}$t$::jsonb),
  -- benevolat
  ($t$benevolat$t$, $t$faq$t$, 1, $t${"align":"center","badge":"Questions fréquentes","title":"Avant de vous lancer","source":"benevolat","subtitle":"","openFirst":false,"background":"default","footerHref":"","footerText":"","footerLinkLabel":""}$t$::jsonb)
) as s(page_slug, block_type, position, content) on s.page_slug = p.slug;


-- ===========================================================================
-- 7. RÉGLAGES DU SITE — src/lib/site-config.ts
--
-- Les 7 groupes. Les « [À COMPLÉTER] » sont repris tels quels : ils doivent
-- rester visibles sur le site et apparaître dans la liste « À compléter » du
-- tableau de bord (§10.2 du Rapport 2).
--
-- `theme` et `features` sont volontairement vides : leurs schémas
-- appartiennent aux Lots 11 et suivants. Une valeur inventée ici serait à
-- défaire.
--
-- `resolveSiteUrl()` n'est PAS migré : l'URL canonique vient de
-- l'environnement et doit rester disponible au build, même base injoignable
-- (§10.3 du Rapport 2).
-- ===========================================================================

insert into public.site_settings ("group", value) values
(
  $t$identity$t$,
  jsonb_build_object(
    'name',          $t$ADEBES$t$,
    'legalName',     $t$Association pour le Développement et le Bien-être Social$t$,
    'motto',         $t$Solidarité – Développement – Bien-être$t$,
    'tagline',       $t$Construisons un avenir meilleur ensemble.$t$,
    'description',   $t$ADEBES œuvre pour le développement humain, la solidarité et le bien-être social à travers des actions concrètes au service de la communauté africaine.$t$,
    'foundingYear',  2020,
    'logoMediaId',   null,
    'faviconMediaId',null
  )
),
(
  $t$contact$t$,
  jsonb_build_object(
    'city',                   $t$Douala$t$,
    'country',                $t$Cameroun$t$,
    'streetAddress',          $t$[À COMPLÉTER]$t$,
    'postalCode',             $t$[À COMPLÉTER]$t$,
    'region',                 $t$Littoral$t$,
    'email',                  $t$contact@adebes.cm$t$,
    'phoneE164',              $t$+237680678939$t$,
    'phoneDisplay',           $t$+237 680 67 89 39$t$,
    -- Numéro secondaire volontairement nul : l'ancien site en affichait un
    -- second dont le lien pointait en réalité vers le premier (constat #5 de
    -- l'audit). Il ne sera réintroduit que si un numéro réellement distinct
    -- est fourni.
    'secondaryPhoneE164',     null,
    'secondaryPhoneDisplay',  null,
    'openingHours',           $t$Lundi – Samedi, 8h – 18h$t$,
    'openingHoursSpec',       $t$Mo-Sa 08:00-18:00$t$,
    'geo', jsonb_build_object('latitude', 4.0511, 'longitude', 9.7679)
  )
),
(
  $t$legal$t$,
  jsonb_build_object(
    'registrationNumber',    $t$[À COMPLÉTER]$t$,
    'registrationAuthority', $t$[À COMPLÉTER]$t$,
    'publicationDirector',   $t$[À COMPLÉTER]$t$,
    'hostingProvider', jsonb_build_object(
      'name',    $t$Vercel Inc.$t$,
      'address', $t$440 N Barranca Ave #4133, Covina, CA 91723, États-Unis$t$,
      'url',     $t$https://vercel.com$t$
    )
  )
),
(
  -- `configured: false` produit une icône grisée « bientôt », jamais un lien
  -- mort (invariant nº 2 du projet). Le formulaire du Lot 10 propose une case
  -- explicite « ce compte n'existe pas encore ».
  $t$socials$t$,
  jsonb_build_object(
    'facebook',  jsonb_build_object('label', $t$Facebook$t$,  'href', '', 'configured', false),
    'instagram', jsonb_build_object('label', $t$Instagram$t$, 'href', '', 'configured', false),
    'tiktok',    jsonb_build_object('label', $t$TikTok$t$,    'href', '', 'configured', false)
  )
),
(
  $t$seo$t$,
  jsonb_build_object(
    'metaDescription', $t$ADEBES, association camerounaise à but non lucratif : éducation, santé, inclusion sociale et développement communautaire à Douala, Yaoundé et dans les régions de l'intérieur.$t$,
    'keywords', jsonb_build_array(
      $t$ADEBES$t$, $t$association Cameroun$t$, $t$ONG Douala$t$,
      $t$développement communautaire$t$, $t$éducation Cameroun$t$,
      $t$santé Cameroun$t$, $t$bénévolat Cameroun$t$, $t$faire un don Cameroun$t$
    ),
    'ogMediaId', null,
    'locale',    $t$fr_CM$t$
  )
),
($t$theme$t$,    '{}'::jsonb),
($t$features$t$, '{}'::jsonb);


-- ===========================================================================
-- 8. NAVIGATION — src/lib/navigation.ts (3 menus)
-- ===========================================================================

insert into public.navigation_items (menu, label, href, description, position) values
  ($t$main$t$, $t$Accueil$t$,          $t$/$t$,           null,                                          1),
  ($t$main$t$, $t$Qui sommes-nous$t$,  $t$/a-propos$t$,   $t$Mission, valeurs, équipe et gouvernance$t$,  2),
  ($t$main$t$, $t$Biographie$t$,       $t$/biographie$t$, $t$M. Tana TEBOH Taduis$t$,                     3),
  ($t$main$t$, $t$Programmes$t$,       $t$/programmes$t$, $t$Nos 8 domaines d'intervention$t$,            4),
  ($t$main$t$, $t$Impact$t$,           $t$/impact$t$,     $t$Chiffres et transparence financière$t$,      5),
  ($t$main$t$, $t$Actualités$t$,       $t$/actualites$t$, $t$Les nouvelles du terrain$t$,                 6),
  ($t$main$t$, $t$Galerie$t$,          $t$/galerie$t$,    $t$Photos et vidéos de nos actions$t$,          7),
  ($t$main$t$, $t$Contact$t$,          $t$/contact$t$,    $t$Nous écrire$t$,                              8),

  ($t$conversion$t$, $t$Faire un don$t$,      $t$/don$t$,       null, 1),
  ($t$conversion$t$, $t$Devenir bénévole$t$,  $t$/benevolat$t$, null, 2),

  ($t$legal$t$, $t$Mentions légales$t$,             $t$/mentions-legales$t$,          null, 1),
  ($t$legal$t$, $t$Politique de confidentialité$t$, $t$/politique-confidentialite$t$, null, 2);


commit;
