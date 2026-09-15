-- ─── Migration v1.3 — Politiques RLS manquantes (INSERT/UPDATE/DELETE) ────

-- 1. Table : brands
-- Autoriser l'utilisateur à créer (INSERT) une marque s'il est bien le propriétaire
CREATE POLICY "brands_insert_own" 
  ON brands FOR INSERT 
  WITH CHECK (auth.uid() = owner_id);

-- Autoriser l'utilisateur à modifier (UPDATE) sa propre marque
CREATE POLICY "brands_update_own" 
  ON brands FOR UPDATE 
  USING (auth.uid() = owner_id);

-- 2. Table : questions
-- Autoriser l'insertion de questions associées à ses propres marques
CREATE POLICY "questions_insert_own" 
  ON questions FOR INSERT 
  WITH CHECK (brand_id IN (SELECT id FROM brands WHERE owner_id = auth.uid()));

-- Autoriser la modification et la suppression de ses propres questions
CREATE POLICY "questions_update_own" 
  ON questions FOR UPDATE 
  USING (brand_id IN (SELECT id FROM brands WHERE owner_id = auth.uid()));

CREATE POLICY "questions_delete_own" 
  ON questions FOR DELETE 
  USING (brand_id IN (SELECT id FROM brands WHERE owner_id = auth.uid()));

-- 3. Table : notification_preferences
-- Autoriser l'insertion des préférences de notification
CREATE POLICY "notification_preferences_insert_own" 
  ON notification_preferences FOR INSERT 
  WITH CHECK (brand_id IN (SELECT id FROM brands WHERE owner_id = auth.uid()));

CREATE POLICY "notification_preferences_update_own" 
  ON notification_preferences FOR UPDATE 
  USING (brand_id IN (SELECT id FROM brands WHERE owner_id = auth.uid()));
