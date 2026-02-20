-- Booth visits tracking
CREATE TABLE IF NOT EXISTS booth_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booth_id UUID NOT NULL REFERENCES booths(id) ON DELETE CASCADE,
  attendee_id UUID NOT NULL REFERENCES attendees(id) ON DELETE CASCADE,
  entered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  exited_at TIMESTAMPTZ,
  dwell_seconds INTEGER,
  source TEXT NOT NULL DEFAULT 'positioning' CHECK (source IN ('positioning', 'qr_scan', 'manual')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_booth_visits_booth ON booth_visits(booth_id);
CREATE INDEX idx_booth_visits_attendee ON booth_visits(attendee_id);
CREATE INDEX idx_booth_visits_entered ON booth_visits(entered_at);

-- RLS
ALTER TABLE booth_visits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage booth_visits" ON booth_visits
  FOR ALL USING (auth.role() = 'authenticated');
