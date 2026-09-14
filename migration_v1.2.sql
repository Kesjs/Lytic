-- ─── Migration v1.2 — Politeness & Diagnostic bots IA ───────────────────────

-- 1. Colonne crawl_delay_ms sur site_crawl_runs
-- Stocke le délai en ms lu depuis le Crawl-delay du robots.txt (ou 800ms par défaut).
-- Permet à processNextPage de respecter le délai sans refaire un fetch du robots.txt.
ALTER TABLE site_crawl_runs
  ADD COLUMN IF NOT EXISTS crawl_delay_ms int NOT NULL DEFAULT 800;

-- ─── 2. Table brand_bot_access ────────────────────────────────────────────────
-- 1 ligne par marque, mise à jour (upsert) à chaque run.
-- bot_rules : { "GPTBot": "blocked", "ClaudeBot": "allowed", ... }
-- llms_txt_found : présence d'un /llms.txt accessible à la racine du domaine.

CREATE TABLE IF NOT EXISTS brand_bot_access (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id    uuid        NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  checked_at  timestamptz NOT NULL DEFAULT now(),
  llms_txt_found boolean  NOT NULL DEFAULT false,
  bot_rules   jsonb       NOT NULL DEFAULT '{}',
  created_at  timestamptz NOT NULL DEFAULT now(),
  -- Une seule ligne par marque (upsert on conflict brand_id)
  CONSTRAINT brand_bot_access_brand_unique UNIQUE (brand_id)
);

ALTER TABLE brand_bot_access ENABLE ROW LEVEL SECURITY;

-- Les utilisateurs ne peuvent lire que les données de leurs propres marques.
CREATE POLICY "brand_bot_access_select_own"
  ON brand_bot_access FOR SELECT
  USING (brand_id IN (SELECT id FROM brands WHERE owner_id = auth.uid()));

-- Index pour les requêtes par marque (tri par date de vérification)
CREATE INDEX IF NOT EXISTS idx_brand_bot_access_brand
  ON brand_bot_access(brand_id, checked_at DESC);
