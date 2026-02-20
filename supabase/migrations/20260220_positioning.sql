-- Positioning anchors (beacons, QR codes, etc.)
CREATE TABLE IF NOT EXISTS positioning_anchors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  floor_plan_id UUID NOT NULL REFERENCES floor_plans(id) ON DELETE CASCADE,
  x DOUBLE PRECISION NOT NULL,
  y DOUBLE PRECISION NOT NULL,
  type TEXT NOT NULL DEFAULT 'ble' CHECK (type IN ('ble', 'uwb', 'wifi', 'qr', 'nfc')),
  hardware_id TEXT,
  config JSONB NOT NULL DEFAULT '{}',
  battery_level SMALLINT CHECK (battery_level IS NULL OR (battery_level >= 0 AND battery_level <= 100)),
  last_seen TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_positioning_anchors_floor ON positioning_anchors(floor_plan_id);
CREATE INDEX idx_positioning_anchors_type ON positioning_anchors(type);
CREATE INDEX idx_positioning_anchors_status ON positioning_anchors(status);

-- Attendee positions (current live position)
CREATE TABLE IF NOT EXISTS attendee_positions (
  attendee_id UUID PRIMARY KEY REFERENCES attendees(id) ON DELETE CASCADE,
  floor_plan_id UUID NOT NULL REFERENCES floor_plans(id) ON DELETE CASCADE,
  x DOUBLE PRECISION NOT NULL,
  y DOUBLE PRECISION NOT NULL,
  accuracy_m DOUBLE PRECISION,
  source TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_attendee_positions_floor ON attendee_positions(floor_plan_id);
CREATE INDEX idx_attendee_positions_updated ON attendee_positions(updated_at);

-- Position history for analytics
CREATE TABLE IF NOT EXISTS position_history (
  id BIGSERIAL PRIMARY KEY,
  attendee_id UUID NOT NULL REFERENCES attendees(id) ON DELETE CASCADE,
  floor_plan_id UUID NOT NULL REFERENCES floor_plans(id) ON DELETE CASCADE,
  x DOUBLE PRECISION NOT NULL,
  y DOUBLE PRECISION NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_position_history_attendee ON position_history(attendee_id);
CREATE INDEX idx_position_history_floor ON position_history(floor_plan_id);
CREATE INDEX idx_position_history_time ON position_history(recorded_at);

-- RLS
ALTER TABLE positioning_anchors ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendee_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE position_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage positioning_anchors" ON positioning_anchors
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage attendee_positions" ON attendee_positions
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage position_history" ON position_history
  FOR ALL USING (auth.role() = 'authenticated');
