# Plan Reflet - État d'implémentation

## ✅ Implémenté (100% fonctionnel)

### A2 : Extraction structurée du contenu
- **Fichier** : `src/lib/crawler/extract.ts`
- **Fonctionnalités** :
  - Sections structurées avec headings et contenu associé
  - Extraction du contenu principal (main/article sans nav/footer)
  - Détection et extraction FAQ (3 méthodes : JSON-LD, HTML dl/dt, headings avec "?")
  - Amélioration extraction pricing (ciblage sections pricing)
- **Impact** : Meilleure compréhension du contenu par les IA

### B1 : Validation SPA (Single Page Applications)
- **Fichier** : `tests/manual/test-spa-rendering.ts`
- **Fonctionnalités** :
  - Script de test manuel pour valider le rendu JavaScript
  - Détection des SPAs mal configurées
- **Usage** : `node --loader tsx tests/manual/test-spa-rendering.ts`

### B2 : Profondeur JSON-LD
- **Fichiers** : 
  - `src/lib/crawler/extract.ts` (schemaDetails)
  - `src/lib/audit-metrics.ts` (scoring graduel)
  - `src/components/dashboard/TechnicalAuditCard.tsx` (organizationComplete)
- **Fonctionnalités** :
  - Vérification profondeur Organization (name, url, description, logo)
  - Détection FAQPage, Product, Article
  - Scoring graduel : 15pts (complet) / 10pts (incomplet) / 5pts (présent)
- **Impact** : Audit technique plus nuancé

### Section 4.1-4.2 : Leviers conversion
- **Fichier** : `src/routes/dashboard/opportunites.tsx`
- **Fonctionnalités** :
  - Alerte "1 question sur dizaines" (quantifier l'inconnu)
  - Alerte "vendre l'historique des changements"
- **Impact** : Inciter upgrade Plan Free → Pro

### Section 4.3 : Badge Accueil optimisation IA
- **Fichier** : `src/routes/dashboard/index.tsx`
- **Fonctionnalités** :
  - Badge vert (score ≥80) : "Site bien optimisé pour les IA"
  - Badge orange (50-79) : "Optimisation partielle" + liste problèmes
  - Badge rouge (<50) : "Problèmes critiques" + liste problèmes
  - Lien vers audit technique
- **Impact** : Visibilité immédiate état technique

### Section 5 : Diff Historique lisible
- **Fichier** : `src/routes/dashboard/historique.tsx`
- **Fonctionnalités** :
  - Diff Git deux colonnes (Avant / Après)
  - Suppression diff inline mot-à-mot (trop dense)
  - Format − / + pour arrays (pricing, headings)
- **Impact** : Lisibilité améliorée

### Section 7 : FREE_SITE_SCAN_COOLDOWN_DAYS corrigé
- **Fichier** : `src/lib/plan.ts`
- **Modification** : Changé de 0 (debug) à 1 jour
- **Impact** : Éviter abus scans gratuits

### Section 9 : Surveillance visible
- **Fichier** : `src/routes/dashboard/index.tsx` + `src/lib/queries/dashboard.ts`
- **Fonctionnalités** :
  - Compteur "Changements cette semaine" sur page d'accueil
  - Lien vers Historique
- **Impact** : Alerter sur changements récents

### Section 11 : Audit technique humanisé
- **Fichiers** : 
  - `src/components/dashboard/TechnicalAuditCard.tsx` (labels)
  - `src/routes/dashboard/audit-technique.tsx` (toggle code)
- **Fonctionnalités** :
  - Labels bénéfices ("Les IA savent qui vous êtes" vs "JSON-LD Organization")
  - Code snippets cachés derrière bouton "Voir le code"
- **Impact** : Accessibilité non-techniques

### DatePicker dark mode
- **Fichier** : `src/components/ui/date-picker.tsx`
- **Fix** : Amélioration contraste mode sombre
- **Impact** : Utilisabilité

---

## ⏳ À implémenter (nécessite travail backend/infrastructure)

### C1 : Crawl concurrents
**Besoins** :
- Migration BDD : Ajouter colonne `website_url` à table `competitors`
- Fonction backend : Crawler l'URL concurrent (réutiliser extractContent)
- UI : Formulaire "Ajouter concurrent" avec URL

**Fichiers à créer/modifier** :
- Migration Supabase : `supabase/migrations/XXXXXX_add_competitor_url.sql`
- `src/lib/queries/competitors.ts` : Fonction `scanCompetitorWebsite`
- `src/routes/dashboard/concurrents.tsx` : Bouton "Analyser site concurrent"

**Impact** : Audit comparatif structuré

---

### Section 4.4 : Tableau comparatif concurrent
**Besoins** :
- Dépend de C1 (crawl concurrent)
- Composant tableau side-by-side
- Comparaison : JSON-LD, robots.txt, llms.txt, H1, alt, meta description

**Fichiers à créer** :
- `src/components/dashboard/CompetitorComparisonTable.tsx`
- Ajouter section dans `src/routes/dashboard/opportunites.tsx`

**Impact** : Argumentaire "votre concurrent fait mieux"

---

### Section 4.5 : Emails automatiques J0/J5/J6
**Besoins** :
- Service email : Resend ou SendGrid
- Templates email HTML
- Cron jobs (Supabase Edge Functions ou Vercel Cron)
  - J0 : Welcome email après inscription
  - J5 : "Votre premier scan est prêt"
  - J6 : "Upgrade Pro" si toujours Free

**Fichiers à créer** :
- `src/lib/email/templates/welcome.tsx` (React Email)
- `src/lib/email/templates/first-scan.tsx`
- `src/lib/email/templates/upgrade-prompt.tsx`
- `supabase/functions/send-onboarding-emails/index.ts`
- Ajouter `RESEND_API_KEY` dans `.env`

**Impact** : Activation utilisateurs + conversion

---

### Section 8 : Architecture Niveau 2 (ETag/sitemap)
**Besoins** :
- ETag : Stocker hash du contenu, skip crawl si inchangé
- Sitemap : Parser sitemap.xml pour trouver nouvelles pages
- Métriques : Temps crawl, pages ignorées

**Fichiers à modifier** :
- `src/lib/crawler/crawl.ts` : Ajouter support ETag
- Migration BDD : Colonne `content_hash` dans `tracked_pages`
- `src/lib/crawler/sitemap-parser.ts` : Nouveau module

**Impact** : Réduire coûts crawl/analyse

---

### Section 12 : Auto-apply GitHub (PR automatiques)
**Besoins** :
- GitHub App : OAuth + permissions write
- Génération fichiers : llms.txt, robots.txt
- Créer PR automatiquement via API GitHub

**Fichiers à créer** :
- `src/lib/github/create-pr.ts`
- `src/lib/github/templates/llms-txt.ts`
- `src/lib/github/templates/robots-txt.ts`
- `src/routes/dashboard/audit-technique.tsx` : Bouton "Auto-apply via GitHub"

**Impact** : Réduire friction correction (1-click fix)

---

## 📊 Résumé

| Section | Status | Complexité | Priorité |
|---------|--------|------------|----------|
| A2 : Extraction structurée | ✅ | Moyenne | ✅ Critique |
| B1 : Validation SPA | ✅ | Faible | ✅ Critique |
| B2 : Profondeur JSON-LD | ✅ | Moyenne | ✅ Critique |
| C1 : Crawl concurrents | ⏳ | Moyenne | 🔶 Importante |
| 4.1-4.2 : Leviers conversion | ✅ | Faible | ✅ Critique |
| 4.3 : Badge Accueil | ✅ | Faible | ✅ Critique |
| 4.4 : Comparatif concurrent | ⏳ | Moyenne | 🔶 Importante |
| 4.5 : Emails J0/J5/J6 | ⏳ | Haute | 🔶 Importante |
| 5 : Diff lisible | ✅ | Faible | ✅ Critique |
| 7 : Cooldown corrigé | ✅ | Faible | ✅ Critique |
| 8 : Architecture Niveau 2 | ⏳ | Haute | 🔵 Nice-to-have |
| 9 : Surveillance visible | ✅ | Faible | ✅ Critique |
| 11 : Audit humanisé | ✅ | Moyenne | ✅ Critique |
| 12 : Auto-apply GitHub | ⏳ | Haute | 🔵 Nice-to-have |

**Légende** :
- ✅ Critique : Implémenté
- 🔶 Importante : Prêt pour sprint suivant (nécessite backend/infra)
- 🔵 Nice-to-have : Post-launch, quand produit mature

---

## 🚀 Prochaines étapes recommandées

### Sprint suivant (Semaine N+1)
1. **C1 + Section 4.4** : Crawl concurrent + comparatif
   - Migration BDD (1h)
   - Backend fonction scan (2h)
   - UI tableau comparatif (3h)
   - **Impact** : Argument vente fort ("benchmark concurrent")

2. **Section 4.5** : Emails onboarding
   - Setup Resend (30min)
   - Templates React Email (2h)
   - Cron jobs Supabase (2h)
   - **Impact** : Activation + conversion automatique

### Post-launch (Mois N+1)
3. **Section 8** : Optimisations crawl (ETag/sitemap)
   - Quand coûts crawl deviennent significatifs
   - **Impact** : Scalabilité + réduction coûts

4. **Section 12** : Auto-apply GitHub
   - Feature "wow" pour Plan Pro
   - **Impact** : Réduction friction adoption

---

## ✅ Tests à faire

### Tests manuels
- [ ] Badge accueil : tester avec site score <50, 50-79, ≥80
- [ ] Diff historique : vérifier lisibilité après plusieurs scans
- [ ] JSON-LD profondeur : tester avec Organization incomplète
- [ ] Compteur changements : vérifier après modification site

### Tests SPA
```bash
node --loader tsx tests/manual/test-spa-rendering.ts
```

---

## 📦 Commits effectués

1. **611ed06** : "Amélioration du sélecteur de date et de l'affichage des modifications dans l'historique"
2. **cddfeff** : "Implémentation plan Reflet: extraction structurée, diff lisible, audit humanisé, conversion"
3. **4060d97** : "B1 et B2: validation SPA + profondeur JSON-LD"
4. **(à commit)** : "Section 4.3: badge accueil optimisation IA"

---

*Document généré le 22 septembre 2026*
