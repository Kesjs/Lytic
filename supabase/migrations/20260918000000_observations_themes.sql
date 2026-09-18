-- Ajoute les vrais thèmes extraits par l'IA (analyzeAnswer, src/lib/analysis.ts)
-- sur chaque observation. Remplace le scan par mots-clés codés en dur qui
-- tournait côté dashboard (src/lib/queries/dashboard.ts) avec, en plus, du
-- bruit aléatoire injecté "pour la démo" — supprimé dans le même chantier.
--
-- Pas de table séparée type observation_competitors : ce sont de simples
-- libellés (2-5 par observation), pas des entités à suivre dans le temps
-- ou à dédupliquer entre marques.

alter table observations
  add column if not exists themes text[] not null default '{}';

comment on column observations.themes is
  'Thèmes/sujets réellement abordés dans la réponse IA, extraits par analyzeAnswer() (union des échantillons, dédupliqués). Tableau vide pour les observations mesurées avant ce chantier — pas de backfill, se peuple aux prochaines mesures.';
