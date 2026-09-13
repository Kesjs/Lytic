# Reflet — Plan dashboard (suivi)

> Repris le 2026-09-13 : le repo GitHub `Kesjs/Lytic` était resté à l'état du
> template Next.js d'origine — la transformation TanStack Start décrite plus
> bas n'avait jamais été poussée. On repart proprement depuis ce zip.
> Incident traité en parallèle : la clé `service_role` Supabase était codée en
> dur dans `lib/supabase-server.ts` et publique sur GitHub → régénérée par
> l'utilisateur le 2026-09-13. Le nouveau code n'utilise plus que des
> variables d'environnement, sans aucun fallback codé en dur.

## Décisions actées
- Stack : TanStack Start (Vite + React Query + TanStack Router), pas Next.js
- Supabase : projet `nmzpskxclwcqnkmkpqkh` (nom affiché "Reflet", ex-Lokka),
  schéma de 13 tables confirmé et RLS activé sur toutes les tables
- Repo de travail : `Lytic-main` transformé sur place
- L'ancien Next.js est conservé intact dans `_legacy_next_reference/`

## ✅ Déjà fait (cette reprise)
1. Vérifié le schéma Supabase réel (13 tables + RLS, toutes à 0 ligne pour l'instant)
2. Scaffold TanStack Start complet : `package.json`, `vite.config.ts`, `tsconfig.json`,
   `tailwind.config.js` (accent jaune soufre `#c9ab1e`/`#f2d94e` correct), `postcss.config.js`
3. `.env.example` propre (aucune clé réelle) + `.gitignore` mis à jour
4. Fichiers réutilisés migrés dans `src/` : `globals.css` → `styles/app.css`,
   `utils.ts`, `grain-gradient-shader.tsx`, `otp-input.tsx` (directives `'use client'` retirées, inutiles en Vite)
5. Client Supabase navigateur (`src/lib/supabase/client.ts`) — anon key uniquement, via `import.meta.env`
6. Client Supabase serveur (`src/lib/supabase/server.ts`) — pattern officiel `@supabase/ssr` +
   `@tanstack/react-start/server`, respecte le RLS ; client admin (service_role) isolé et documenté
   comme réservé aux tâches privilégiées serveur, jamais utilisé par le dashboard
7. Types Supabase générés à la main depuis le vrai schéma (`database.types.ts`)
8. Router + route racine (`src/router.tsx`, `src/routes/__root.tsx`) avec session
   récupérée une seule fois à la racine (pas un fetch par route)
9. Pages `/login` et `/signup` (email + mot de passe, vrais appels Supabase, pas de mock) ;
   trigger Postgres `on_auth_user_created` ajouté côté Supabase pour créer automatiquement
   la ligne `profiles` à chaque inscription (il n'y en avait aucun avant)
10. Layout dashboard protégé avec garde de session (`src/routes/dashboard/route.tsx`)
11. Sidebar avec les vrais items définitifs (Accueil, Performance, Concurrents,
    Opportunités, Historique, séparateur, Paramètres) — `src/components/dashboard/Sidebar.tsx`
12. Page Accueil (`src/routes/dashboard/index.tsx`) connectée aux vraies tables
    (brands, measurement_runs, opportunities, events, site_pages) via une server
    function (`src/lib/queries/dashboard.ts`) — gère déjà les états no data /
    pending / measuring / partial / failed / success, aucune donnée simulée
13. Pages Performance / Concurrents / Opportunités / Historique / Paramètres :
    squelettes de routes créés (pour que la nav ne casse pas), contenu réel à faire

## ✅ Déjà fait (suite — session Claude du 2026-09-13)
14. Page Accueil complétée : 4 KPI réels calculés depuis `observations`/
    `observation_competitors` (jamais inventés, `null` → "—" si pas de donnée),
    graphique d'évolution (`ScoreChart.tsx`, recharts, sélecteur 7j/30j/3mois),
    blocs "Performance des questions" et "Concurrents" ajoutés (manquaient du
    spec §4), footer "Dernière mesure / prochaine mesure" (prochaine mesure
    volontairement affichée "non planifiée" — pas de scheduler dans le schéma,
    donc pas de date inventée)
15. `src/lib/queries/metrics.ts` — fonction serveur partagée `fetchMetricsHistory`
    (score/mentions/reco/position par run sur une période), utilisée par
    l'Accueil et par Performance
16. Page Performance (§5) connectée : rappel score, `PerformanceChart.tsx`
    (sélecteur d'indicateur Score/Mentions/Reco/Position + période), tableau
    complet des questions actives, `QuestionDrawer.tsx` au clic (réponses
    observées, concurrents détectés, historique, preuves) — **écart assumé** :
    le spec mentionne un 4ᵉ indicateur "citation" qui n'existe pas dans le
    schéma (`observations` n'a que mention/reco/position) ; pas inventé, à
    ajouter au schéma si besoin
17. Page Concurrents (§6) connectée : `CompetitorsChart.tsx` (barres Mentions/
    Recommandations, marque vs jusqu'à 6 concurrents), tableau avec lignes
    dépliables (extraits de contexte réels), formulation exacte du spec
    respectée ("apparaît plus fréquemment que vous", jamais de classement
    marché), action "masquer" (`hideCompetitor`, première écriture en base de
    l'app — **à vérifier** : policy RLS `UPDATE` sur `competitors` pas
    confirmée, seul `SELECT` l'était)
18. Améliorations indépendantes apportées en parallèle (à conserver, non
    touchées par Claude) : sidebar rétractable + fil d'Ariane dans le header
    du dashboard (`route.tsx`, `Sidebar.tsx`), session Supabase 30 jours
    (`client.ts`), affichage conditionnel connecté/déconnecté sur la landing
    (`Navbar.tsx`), écran de garde anti-flash sur `/login`

## 🔜 Prochaine étape (une seule à la fois)
- [ ] `npm install` + `npm run dev` chez toi → retour d'erreurs si besoin
- [ ] Créer un compte via `/signup`, vérifier qu'une ligne `profiles` apparaît bien automatiquement
- [ ] Insérer un jeu de données de test (1 brand liée à ton compte, questions,
      1 run, observations) pour valider visuellement Accueil/Performance/Concurrents
- [ ] Vérifier la policy RLS `UPDATE` sur `competitors` (nécessaire pour "masquer")
- [ ] Page Opportunités (§7) — Evidence Chain
- [ ] Page Historique (§8) — timeline mesures + modifications + événements
- [ ] Page Paramètres (§9) — sous-sections Compte/Site/Questions/Notifications/Abonnement/Sécurité
- [ ] Système de toasts/notifications transversal (§10) — événements → toast/notification/historique

## ⏳ Pas encore fait (plus tard)
- Moteur de mesure réel (appel API OpenAI par question → remplissage observations/competitors/score)
- Génération automatique des opportunités à partir des observations
- Détection des changements de site
- Landing page (volontairement en dernier)

## Notes techniques à ne pas oublier
- Couleur accent Reflet : jaune soufre `#c9ab1e` / texte `#f2d94e` — un seul CTA visible à la fois
- Dark mode uniquement, radius modérés (6/8/12/16px), pas de pill
- États obligatoires par page (§13 du prompt dashboard) : Loading/Analyzing/Measuring/Partial/Success/No data/No change/No opportunity/Failed/Unavailable/Stale
- "Aucun changement détecté" ≠ "jamais vérifié" — ne jamais confondre visuellement
- Un changement "faible importance" reste visible dans l'historique, jamais masqué
- Sécurité : plus jamais de clé Supabase codée en dur dans le code, même en fallback —
  variables d'environnement uniquement, échec explicite si absentes
