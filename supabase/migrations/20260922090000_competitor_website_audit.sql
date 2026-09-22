-- C1 : URL du site concurrent + instantané d'audit technique associé.
-- Ne modifie rien à la détection automatique existante (measure.ts) :
-- website_url / technical_audit restent NULL tant que rien n'a été
-- renseigné ou scanné pour ce concurrent.
alter table public.competitors
  add column if not exists website_url text,
  add column if not exists technical_audit jsonb,
  add column if not exists technical_audit_checked_at timestamptz;
