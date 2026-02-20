-- Navigation nodes for wayfinding
CREATE TABLE IF NOT EXISTS nav_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  floor_plan_id UUID NOT NULL REFERENCES floor_plans(id) ON DELETE CASCADE,
  x DOUBLE PRECISION NOT NULL,
  y DOUBLE PRECISION NOT NULL,
  type TEXT NOT NULL DEFAULT 'waypoint' CHECK (type IN ('waypoint', 'entrance', 'exit', 'elevator', 'stairs')),
  accessible BOOLEAN NOT NULL DEFAULT true,
  linked_floor_node_id UUID REFERENCES nav_nodes(id) ON DELETE SET NULL,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_nav_nodes_floor_plan ON nav_nodes(floor_plan_id);
CREATE INDEX idx_nav_nodes_type ON nav_nodes(type);

-- Navigation edges connecting nodes
CREATE TABLE IF NOT EXISTS nav_edges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_node_id UUID NOT NULL REFERENCES nav_nodes(id) ON DELETE CASCADE,
  to_node_id UUID NOT NULL REFERENCES nav_nodes(id) ON DELETE CASCADE,
  distance_m DOUBLE PRECISION NOT NULL CHECK (distance_m > 0),
  bidirectional BOOLEAN NOT NULL DEFAULT true,
  accessible BOOLEAN NOT NULL DEFAULT true,
  weight_modifier DOUBLE PRECISION NOT NULL DEFAULT 1.0 CHECK (weight_modifier > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT no_self_edges CHECK (from_node_id != to_node_id)
);

CREATE INDEX idx_nav_edges_from ON nav_edges(from_node_id);
CREATE INDEX idx_nav_edges_to ON nav_edges(to_node_id);

-- RLS
ALTER TABLE nav_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE nav_edges ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users full access (matching existing RLS pattern)
CREATE POLICY "Authenticated users can manage nav_nodes" ON nav_nodes
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can manage nav_edges" ON nav_edges
  FOR ALL USING (auth.role() = 'authenticated');
