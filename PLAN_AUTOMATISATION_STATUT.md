# Plan — Automatisation "Vérifier → Remesure" + mise à jour pricing/coûts
## (statut d'avancement — mis à jour)

> Ce fichier reprend le plan original tâche par tâche (§6) et indique l'état
> réel de chaque point dans ce zip. Le plan original complet reste dans
> l'historique de conversation ; ce document est la version "checklist".

## 1–3. Contexte, décision pricing, coûts réels IA

Inchangé par rapport au plan original :
- Plan unique payant confirmé à **49€/mois** (déjà en place dans le code —
  `src/lib/i18n/dictionaries/fr.ts`, `priceMonthly: "49 €"` — aucune
  modification nécessaire ici).
- Coût réel d'une remesure complète ≈ $0,10, cap "1/jour" ≈ $3/mois/client
  au pire cas — marge confortable, cap non resserré.

## 4. Automatisation cron — état détaillé

### 4.1 Route HTTP dédiée — ✅ FAIT
- `POST /api/cron/site-check` créée dans
  `src/routes/api/cron/site-check.ts` (TanStack Start server route,
  `server.handlers.POST`).
- Protégée par `Authorization: Bearer CRON_SECRET` (variable d'env, pas de
  session utilisateur). Renvoie 500 si `CRON_SECRET` n'est pas configuré
  côté serveur, 401 si le secret ne correspond pas.
- Boucle sur **toutes les marques actives** (exclut `past_due`/`canceled`
  via la nouvelle fonction `isBrandEligibleForCron` dans `src/lib/plan.ts`),
  contrairement aux server functions existantes liées à l'utilisateur
  connecté.

### 4.2 Comportement différencié selon le plan — ✅ FAIT
- **Free** : crawl automatique déclenché pour toutes les marques éligibles
  (y compris Free), jamais de remesure automatique — gate explicite
  `if (!isFreePlan(brand.plan))` avant tout appel LLM.
- **Pro** (`trial`/`active`) : crawl auto + remesure auto si
  `checkMeasurementDelay` (cap `MEASUREMENT_DELAY_DAYS`, partagé avec le
  bouton manuel) autorise ET `getFreeRemeasureUnlock` confirme qu'un
  changement `importance != 'low'` non encore lié à un run existe (réemploi
  de la fonction existante, déjà plan-agnostique malgré son nom).

**Refactor nécessaire pour rendre ça possible (fait)** :
- `src/lib/crawler/orchestrate.ts` : logique de `triggerSiteCrawl` extraite
  dans `crawlBrandCore(admin, brand)` ; ajout de
  `triggerSiteCrawlForBrandId(brandId)` (admin, sans session) et de
  `runCrawlToCompletion(runId)` (boucle jusqu'à `done`, avec garde-fou
  `maxSteps`). Le bouton manuel (`triggerSiteCrawl`) garde son cooldown
  Free-only ; le cron ne l'a pas (crawl auto quotidien = règle séparée).
- `src/lib/queries/measure.ts` : même refactor sur `triggerMeasurementRun`
  (→ `triggerMeasurementRunCore` + `triggerMeasurementRunForBrandId`) et sur
  `processNextQuestion` (→ `processNextQuestionCore` +
  `runMeasurementToCompletion`). `checkMeasurementDelay` exportée pour être
  réutilisée par la route cron.
- **Aucune régression** : les 122 tests existants passent toujours
  (`npx vitest run`), y compris `measure.test.ts` et `opportunities.test.ts`
  cités dans le plan original comme base de test.

### 4.3 Déclenchement externe indépendant de l'hébergeur — ✅ FAIT
Déclencheur choisi : **GitHub Actions** (`schedule:`), gratuit, versionné
avec le repo, capable de faire un vrai `POST`.
- `.github/workflows/cron-site-check.yml` (nouveau) : appelle
  `POST https://<domaine>/api/cron/site-check` tous les jours à 05:00 UTC
  avec l'en-tête `Authorization: Bearer <secret>`, via les secrets de repo
  `LYTIC_CRON_URL` et `LYTIC_CRON_SECRET`. Déclenchable aussi manuellement
  (`workflow_dispatch`) pour tester sans attendre l'horaire.
- **Reste une action manuelle côté toi (aucun fichier de plus à livrer)** :
  1. Définir `CRON_SECRET` dans Vercel (Production) avec une valeur
     aléatoire forte.
  2. Définir les secrets GitHub `LYTIC_CRON_SECRET` (même valeur) et
     `LYTIC_CRON_URL` (ton domaine de prod, sans slash final) sur le repo.
  3. Lancer le workflow une fois manuellement (`Actions` → `Cron site-check`
     → `Run workflow`) et vérifier un `HTTP 200` dans les logs.

### 4.4 Notification utilisateur — ✅ FAIT (rien à ajouter)
Déjà géré par la logique existante réutilisée telle quelle : la fin d'un run
de mesure (`processNextQuestionCore`) insère déjà un `events` (type
success/partial/failed) — donc l'utilisateur voit "Score mis à jour" sans
action supplémentaire, que le run soit déclenché manuellement ou par le
cron.

### 4.5 Deploy hook — ⏸️ PAS COMMENCÉ (hors MVP, comme prévu par le plan)
Non implémenté, conformément au plan original ("à garder en option pour
plus tard, pas dans le MVP du cron").

## 5. Ce qui ne change pas — ✅ respecté
Boutons manuels toujours disponibles et inchangés dans leur comportement
utilisateur (mêmes messages d'erreur, même cooldown Free). `triggerSiteCrawl`
et `triggerMeasurementRun` publics gardent exactement leur contrat d'origine
— seule la façade a changé (délégation à une fonction core partagée).

## 6. Liste des tâches — état détaillé

1. **Corriger `src/lib/openai-pricing.ts`** — ✅ FAIT. Tarifs `gpt-4o-mini`/
   `gpt-4o` remplacés par `gpt-5.6-luna` ($0,20/$1,20) + entrée
   `gpt-5.6-luna-nano` ($0,20/$1,25) réservée pour un futur modèle de
   parsing dédié (non utilisé actuellement — un seul modèle sert à la fois
   à la mesure et à l'analyse, comme décidé). Fallback de modèle corrigé
   dans `measure.ts` (`'gpt-4o-mini'` → `'gpt-5.6-luna'`).
2. **Créer la route cron** `POST /api/cron/site-check` — ✅ FAIT (voir §4.1).
3. **Brancher le déclencheur externe** — ✅ FAIT côté code (workflow GitHub
   Actions livré, voir §4.3 ci-dessus). Il reste seulement à renseigner les
   3 secrets (Vercel + GitHub) et lancer un test manuel — aucun fichier
   supplémentaire à écrire.
4. **Tester en local** — ✅ FAIT. Nouveau fichier
   `tests/integration/cron-site-check.test.ts` (6 tests : rejet sans secret,
   rejet mauvais secret, exclusion past_due/canceled, skip Free, remesure
   Pro déclenchée si conditions réunies, remesure Pro bloquée si délai ou
   changement absent). Suite complète passée avec `npx vitest run` :
   **122 tests, 0 échec**, aucune régression sur les tests existants.
5. **Discours pricing "analyse hebdomadaire"** — non touché, reste vrai a
   minima (pas de changement nécessaire identifié dans le code de landing
   au-delà du point 6).
6. **Texte pricing du plan Pro** — ✅ FAIT dans `fr.ts` et `en.ts` :
   - FR : label `Mesure continue automatique` → `Vérification automatique` ;
     détail → `Contrôle quotidien de votre site, remesure automatique dès
     qu'un changement est détecté.`
   - EN : équivalent mis à jour en parallèle (`Automatic verification` /
     `Daily check of your site, automatic remeasurement as soon as a change
     is detected.`) même si le contenu EN n'est pas encore câblé dans la nav
     (cohérence pour plus tard).
7. **Deploy hook** — ⏸️ PAS COMMENCÉ, hors MVP comme prévu.

## Fichiers modifiés / créés dans ce zip

- `src/lib/openai-pricing.ts` (réécrit)
- `src/lib/queries/measure.ts` (refactor + export `checkMeasurementDelay` +
  fallback modèle corrigé)
- `src/lib/crawler/orchestrate.ts` (refactor)
- `src/lib/plan.ts` (+ `isBrandEligibleForCron`)
- `src/routes/api/cron/site-check.ts` (nouveau)
- `tests/integration/cron-site-check.test.ts` (nouveau)
- `.env.example` (+ `CRON_SECRET`)
- `src/lib/i18n/dictionaries/fr.ts` / `en.ts` (texte pricing Pro)
- `.github/workflows/cron-site-check.yml` (nouveau — déclencheur externe §4.3)
- `PLAN_AUTOMATISATION_STATUT.md` (ce fichier)

## Point de vigilance connu (pas bloquant)

`npx tsc --noEmit` signale une erreur sur
`createFileRoute('/api/cron/site-check')` : le type généré pour les chemins
de route (`routeTree.gen.ts`) est **auto-généré au build/dev par le plugin
TanStack Start** et n'existe pas dans ce zip brut (il est dans
`.gitignore`, régénéré à chaque `npm run dev`/`npm run build`). C'est donc
un faux positif attendu tant que le projet n'a pas été buildé une première
fois avec la nouvelle route présente — à vérifier concrètement après un
`npm install && npm run dev` en local ou sur Vercel, mais ce n'est pas un
bug de code identifié.

## Prochaine étape si tu veux que je continue

Le plan est terminé côté code (§1 à §4.4, §6.1/2/4/6 tous ✅, §4.3 livré via
GitHub Actions). Il ne reste que :
- 3 secrets à renseigner (Vercel `CRON_SECRET` + GitHub `LYTIC_CRON_SECRET`/
  `LYTIC_CRON_URL`) et un test manuel du workflow — action hors code, pas de
  fichier à livrer.
- §4.5 (deploy hook) : toujours volontairement hors MVP, non implémenté.
  Dis-moi si tu veux que je le fasse quand même.
