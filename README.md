# Reflet — Dashboard (TanStack Start)

## Démarrage
```
cp .env.example .env.local   # puis remplir VITE_SUPABASE_ANON_KEY et SUPABASE_SERVICE_ROLE_KEY
npm install
npm run dev
```
Ouvre http://localhost:3001

`src/routeTree.gen.ts` est généré automatiquement au premier `npm run dev` — ne pas le committer (déjà dans `.gitignore`).

## État actuel (voir PLAN.md pour le détail)
- ✅ Scaffold TanStack Start + Vite + Tailwind (couleur d'accent jaune soufre correcte)
- ✅ Client Supabase navigateur + serveur, RLS respecté, aucune clé en dur
- ✅ Types générés depuis le vrai schéma (13 tables)
- ✅ Auth (login email/mot de passe) + garde de session sur `/dashboard`
- ✅ Sidebar avec les vrais items (Accueil, Performance, Concurrents, Opportunités, Historique, Paramètres)
- ✅ Page Accueil connectée aux vraies tables Supabase (pas de mock) — affiche les états "no data" tant qu'aucune marque/mesure n'existe
- 🔜 Pages Performance / Concurrents / Opportunités / Historique / Paramètres : squelettes seulement, à connecter une par une
- 🔜 Jeu de données de test à insérer pour valider visuellement l'Accueil avec de vraies données

L'ancien code Next.js du template Lytic est conservé intact dans `_legacy_next_reference/` pour référence (rien n'a été supprimé).
