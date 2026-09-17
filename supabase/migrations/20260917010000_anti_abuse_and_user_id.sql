-- Migration : Anti-abus signup, Plan Free, et enrichissement de api_usage_log

-- 1. Table signup_attempts (si non encore créée)
CREATE TABLE IF NOT EXISTS public.signup_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address text NOT NULL,
  email text NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.signup_attempts ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_signup_attempts_ip_created
  ON public.signup_attempts(ip_address, created_at DESC);

-- 2. Ajout de user_id et index sur api_usage_log pour le rate-limiting
ALTER TABLE public.api_usage_log
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_api_usage_log_user_id ON public.api_usage_log(user_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_log_user_call_type ON public.api_usage_log(user_id, call_type);

-- 3. Mise à jour de la contrainte sur brands.plan pour supporter 'free'
ALTER TABLE public.brands DROP CONSTRAINT IF EXISTS brands_plan_check;
ALTER TABLE public.brands ADD CONSTRAINT brands_plan_check
  CHECK (plan IN ('trial', 'active', 'past_due', 'canceled', 'free'));
