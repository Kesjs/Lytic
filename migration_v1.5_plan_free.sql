-- 1.5 Plan Free + anti-abus signup
-- ⚠️ Ne pas appliquer directement sur le projet Supabase réel sans validation.

-- Ajoute 'free' aux valeurs autorisées de brands.plan (contrainte réelle :
-- brands_plan_check, vérifiée sur le schéma actuel avant d'écrire cette migration).
alter table brands drop constraint if exists brands_plan_check;
alter table brands add constraint brands_plan_check
  check (plan in ('trial', 'active', 'past_due', 'canceled', 'free'));

-- Anti-abus signup : une ligne par tentative d'inscription, utilisée pour la
-- fenêtre glissante par IP (voir src/lib/queries/auth.ts).
create table if not exists signup_attempts (
  id uuid primary key default gen_random_uuid(),
  ip_address text not null,
  email text not null,
  user_id uuid references auth.users(id),
  created_at timestamptz not null default now()
);

alter table signup_attempts enable row level security;
-- Aucune policy : la table n'est écrite/lue que via le client serveur
-- (service role), jamais directement par le client — même logique que les
-- autres tables internes du pipeline.

create index if not exists idx_signup_attempts_ip_created
  on signup_attempts(ip_address, created_at desc);
