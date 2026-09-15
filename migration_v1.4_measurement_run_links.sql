ALTER TABLE measurement_runs
  ADD COLUMN triggered_by TEXT NOT NULL DEFAULT 'manual'
    CHECK (triggered_by IN ('manual', 'scheduled', 'post_change')),
  ADD COLUMN linked_change_id UUID REFERENCES site_changes(id);
