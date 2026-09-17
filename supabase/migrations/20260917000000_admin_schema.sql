-- 1. Add is_admin to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false;

-- 2. Create api_usage_log table
CREATE TABLE IF NOT EXISTS public.api_usage_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid REFERENCES public.brands(id) ON DELETE SET NULL,
  call_type text NOT NULL, -- 'measurement' | 'question_generation' | 'opportunity_generation'
  model text NOT NULL,
  tokens_input integer NOT NULL,
  tokens_output integer NOT NULL,
  estimated_cost_usd numeric NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Create index for fast date-based aggregation
CREATE INDEX IF NOT EXISTS idx_api_usage_log_created_at ON public.api_usage_log(created_at);
CREATE INDEX IF NOT EXISTS idx_api_usage_log_brand_id ON public.api_usage_log(brand_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_log_call_type ON public.api_usage_log(call_type);

-- 4. Set up RLS for api_usage_log (Only service_role can insert, only admin can read)
ALTER TABLE public.api_usage_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read api_usage_log"
ON public.api_usage_log
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid() AND profiles.is_admin = true
  )
);
