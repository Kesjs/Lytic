-- Historisation du score Audit Technique IA (§27).
--
-- Avant cette migration, computeAuditMetrics() était recalculé à la volée à
-- chaque affichage du dashboard, sans jamais être stocké — impossible de
-- montrer une progression dans le temps ("votre score est passé de 40 à
-- 85"), et impossible de corréler une amélioration technique avec une
-- évolution du score de visibilité IA (measurement_runs).
--
-- On stocke un instantané du score sur chaque run de crawl terminé, au même
-- niveau de granularité que measurement_runs pour le score de visibilité.
-- NULL tant qu'un run n'a pas encore été recalculé côté application (pas de
-- backfill : les runs passés gardent leur "40/100" par défaut, qui était de
-- toute façon souvent faux avant les fixes du crawler — cf. §24, §26).
alter table public.site_crawl_runs
  add column if not exists audit_score integer;

comment on column public.site_crawl_runs.audit_score is
  'Instantané du score Audit Technique IA (computeAuditMetrics, /100) au moment où ce run de crawl s''est terminé. NULL = pas encore calculé pour ce run.';
