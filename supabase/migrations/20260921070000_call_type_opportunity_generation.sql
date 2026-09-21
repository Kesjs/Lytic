-- Étend la contrainte api_usage_log_call_type_check pour autoriser
-- 'opportunity_generation'. Sans cette valeur, l'insert du coût du teaser
-- Opportunité Free (fetchOpportunities, branche plan Free) échoue en
-- silence (try/catch -> console.warn) depuis le début — ce coût réel
-- n'était jamais tracé. Aucun changement de code applicatif nécessaire au-
-- delà de cette migration : l'insert existant redevient fonctionnel une
-- fois la contrainte étendue.
ALTER TABLE public.api_usage_log DROP CONSTRAINT api_usage_log_call_type_check;
ALTER TABLE public.api_usage_log ADD CONSTRAINT api_usage_log_call_type_check
  CHECK (call_type = ANY (ARRAY['measurement','analysis','actionable_content','opportunity_generation']));
