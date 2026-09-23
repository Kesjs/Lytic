# Tests E2E - Parcours utilisateur Lytic

## 🎯 Objectif

Tests automatisés complets qui simulent le comportement réel des utilisateurs pour détecter toute ambiguïté ou problème dans l'expérience utilisateur entre les plans Free et Pro.

## 🤖 Robots de test

### `user-journey-free.spec.ts`
**Teste le parcours complet utilisateur FREE :**
- ✅ Configuration marque : limite 3 questions respectée
- ✅ Mesures : quota 3/semaine avec blocage approprié  
- ✅ Scan technique : cooldown 1 jour appliqué
- ✅ Concurrents : max 2 visibles + floutage des autres
- ✅ Boutons upgrade : présents aux bons endroits
- ✅ Widget paiement : s'ouvre correctement
- ✅ Badge audit : incite à l'amélioration

### `user-journey-pro.spec.ts`
**Teste le parcours complet utilisateur PRO :**
- ✅ Configuration marque : questions illimitées
- ✅ Mesures : pas de quota, délai 1 jour seulement
- ✅ Scan technique : quotidien sans restriction
- ✅ Concurrents : tous visibles sans floutage
- ✅ Multi-moteur : OpenAI + Perplexity utilisés
- ✅ Dashboard : pas de limites affichées
- ✅ Fonctionnalités : accès complet débloqué
- ✅ Transition Free→Pro : déblocage immédiat

### `payment-flow.spec.ts`
**Teste le flux de paiement FedaPay :**
- ✅ Widget FedaPay : chargement et affichage correct
- ✅ Données utilisateur : pré-remplies automatiquement
- ✅ Fermeture widget : reste en plan Free si annulé
- ✅ Paiement réussi : webhook + mise à jour automatique
- ✅ Gestion erreurs : affichage gracieux des erreurs
- ✅ États de chargement : bouton désactivé pendant traitement
- ✅ Montant correct : 32 000 XOF partout
- ✅ Sécurité : vérification propriétaire marque

## 🚀 Utilisation

### Pré-requis
```bash
# Variables d'environnement requises dans .env.local
VITE_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
FEDAPAY_SECRET_KEY=
VITE_FEDAPAY_PUBLIC_KEY=
```

### Commandes

```bash
# Lancer tous les tests de parcours utilisateur
npm run test:journey

# Tests E2E complets (inclut autres tests)
npm run test:e2e

# Mode interface graphique pour debug
npm run test:e2e:ui

# Test spécifique
npx playwright test user-journey-free.spec.ts

# Avec traces pour debug
npx playwright test --trace on
```

## 📊 Détection d'ambiguïtés

Ces tests détectent automatiquement :

### ❌ Problèmes potentiels Free
- Limites non respectées (>3 questions, >3 mesures/semaine)
- Cooldown scan technique ignoré  
- Concurrents non floutés ou limite dépassée
- Boutons upgrade manquants ou mal placés
- Montants de paiement incorrects

### ❌ Problèmes potentiels Pro  
- Limitations Free encore affichées après paiement
- Fonctionnalités Pro non débloquées
- Multi-moteur non utilisé
- Boutons upgrade encore présents
- Quotas Free encore appliqués

### ❌ Problèmes de paiement
- Widget FedaPay ne se charge pas
- Données utilisateur non pré-remplies
- Webhook ne met pas à jour le statut
- Erreurs non gérées gracieusement
- Failles de sécurité (paiement pour autre marque)

## 🔧 Helpers

### `helpers/auth.ts`
- `createTestUser()` : Crée un utilisateur de test  
- `deleteTestUser()` : Nettoie l'utilisateur de test
- `loginTestUser()` : Connecte un utilisateur

### `helpers/brand.ts`
- `setupTestBrand()` : Crée une marque de test avec plan
- `cleanupTestBrand()` : Nettoie la marque de test
- `createTestMeasurement()` : Simule une mesure

## 📈 Rapports

Les tests génèrent :
- **Screenshots** en cas d'échec
- **Vidéos** de replay des échecs  
- **Traces** détaillées pour debug
- **Rapport HTML** avec résultats visuels

## ✅ Critères de succès

**Déploiement validé si :**
- ✅ Tous les tests parcours Free passent
- ✅ Tous les tests parcours Pro passent  
- ✅ Tous les tests de paiement passent
- ✅ Pas d'ambiguïté détectée entre les plans
- ✅ Transitions Free→Pro fluides
- ✅ Sécurité des paiements validée

## 🐛 Debug

En cas d'échec :

1. **Voir les traces** : `npx playwright show-trace test-results/[test-name]/trace.zip`
2. **Mode headful** : `npx playwright test --headed`
3. **Mode debug** : `npx playwright test --debug`
4. **Slow motion** : `npx playwright test --slowMo=1000`

## 🎭 Structure des tests

Chaque test suit le pattern :
1. **Setup** : Créer utilisateur + marque de test
2. **Action** : Simuler interaction utilisateur
3. **Assert** : Vérifier comportement attendu  
4. **Cleanup** : Nettoyer les données de test

Les tests sont **isolés** et peuvent tourner en parallèle sans conflits.