-- Cache du contenu actionnable généré par IA pour chaque opportunité
-- (Palier 0 — ActionableContentPanel). Évite de régénérer un appel IA à
-- chaque affichage du panel : 1 ligne par opportunité, régénérée
-- uniquement quand le site a changé depuis la dernière génération
-- (source_content_hash) ou que rien n'a encore été généré.
--
-- Appliquée via l'admin/service role côté server function
-- (~/lib/queries/actionable-content.ts) — la policy ci-dessous protège
-- uniquement un éventuel accès direct côté client.

CREATE TABLE public.opportunity_actionable_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id uuid NOT NULL UNIQUE REFERENCES public.opportunities(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type = ANY (ARRAY['robots_txt','llms_txt','meta_description','json_ld','redirect_rule','custom'])),
  label text NOT NULL,
  content text NOT NULL,
  instructions text,
  filename text,
  plan text NOT NULL DEFAULT 'pro' CHECK (plan = ANY (ARRAY['free','pro'])),
  source_content_hash text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.opportunity_actionable_content ENABLE ROW LEVEL SECURITY;

-- Même schéma d'accès que opportunity_evidence : via opportunities -> brands.owner_id
CREATE POLICY opportunity_actionable_content_via_opp
  ON public.opportunity_actionable_content
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM opportunities op
      JOIN brands b ON b.id = op.brand_id
      WHERE op.id = opportunity_actionable_content.opportunity_id
        AND b.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM opportunities op
      JOIN brands b ON b.id = op.brand_id
      WHERE op.id = opportunity_actionable_content.opportunity_id
        AND b.owner_id = auth.uid()
    )
  );

-- Étend api_usage_log pour tracer le coût de cette fonctionnalité séparément
-- des mesures/analyses existantes (src/lib/queries/measure.ts).
ALTER TABLE public.api_usage_log DROP CONSTRAINT api_usage_log_call_type_check;
ALTER TABLE public.api_usage_log ADD CONSTRAINT api_usage_log_call_type_check
  CHECK (call_type = ANY (ARRAY['measurement','analysis','actionable_content']));
