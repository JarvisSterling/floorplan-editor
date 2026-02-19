// Auto-generated types matching PRD §4.4 database schema

export interface Event {
  id: string;
  name: string;
  organizer_id: string | null;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
}

export interface Attendee {
  id: string;
  event_id: string;
  user_id: string | null;
  name: string | null;
  email: string | null;
  created_at: string;
}

export interface Exhibitor {
  id: string;
  event_id: string;
  company_name: string;
  contact_email: string | null;
  created_at: string;
}

export interface FloorPlan {
  id: string;
  event_id: string;
  name: string;
  floor_number: number;
  width_m: number;
  height_m: number;
  background_image_url: string | null;
  grid_size_m: number;
  scale_px_per_m: number;
  metadata: Record<string, unknown>;
  sort_order: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export type FloorPlanInsert = Omit<FloorPlan, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
};
export type FloorPlanUpdate = Partial<Omit<FloorPlan, 'id' | 'created_at'>>;

export type ObjectType = 'booth' | 'wall' | 'zone' | 'furniture' | 'infrastructure' | 'annotation';
export type ShapeType = 'rect' | 'circle' | 'polygon' | 'line' | 'text' | 'image';
export type LayerType = 'background' | 'structure' | 'booths' | 'zones' | 'furniture' | 'annotations' | 'default';

export interface FloorPlanObject {
  id: string;
  floor_plan_id: string;
  type: ObjectType;
  shape: ShapeType;
  label: string | null;
  x: number;
  y: number;
  width: number | null;
  height: number | null;
  rotation: number;
  points: Array<{ x: number; y: number }> | null;
  style: Record<string, unknown>;
  layer: LayerType;
  z_index: number;
  locked: boolean;
  visible: boolean;
  metadata: Record<string, unknown>;
  parent_id: string | null;
  created_at: string;
  updated_at: string;
}

export type FloorPlanObjectInsert = Omit<FloorPlanObject, 'id' | 'created_at' | 'updated_at'> & {
  id?: string;
};
export type FloorPlanObjectUpdate = Partial<Omit<FloorPlanObject, 'id' | 'created_at'>>;

export type BoothStatus = 'available' | 'reserved' | 'sold' | 'blocked' | 'premium';
export type BoothCategory = 'standard' | 'island' | 'corner' | 'inline' | 'peninsula';

export interface Booth {
  id: string;
  object_id: string;
  event_id: string;
  booth_number: string;
  status: BoothStatus;
  category: BoothCategory | null;
  size_sqm: number | null;
  price: number | null;
  pricing_tier: string | null;
  exhibitor_id: string | null;
  max_capacity: number | null;
  amenities: string[];
  created_at: string;
  updated_at: string;
}

export interface BoothProfile {
  id: string;
  booth_id: string;
  company_name: string | null;
  logo_url: string | null;
  banner_url: string | null;
  description: string | null;
  products: unknown[];
  team_members: unknown[];
  social_links: Record<string, string>;
  custom_fields: Record<string, unknown>;
  updated_at: string;
}

export interface NavNode {
  id: string;
  floor_plan_id: string;
  x: number;
  y: number;
  type: 'waypoint' | 'entrance' | 'exit' | 'elevator' | 'stairs';
  accessible: boolean;
  linked_floor_node_id: string | null;
  metadata: Record<string, unknown>;
}

export interface NavEdge {
  id: string;
  from_node_id: string;
  to_node_id: string;
  distance_m: number;
  bidirectional: boolean;
  accessible: boolean;
  weight_modifier: number;
}

export type AnchorType = 'ble' | 'uwb' | 'wifi' | 'qr' | 'nfc';

export interface PositioningAnchor {
  id: string;
  floor_plan_id: string;
  x: number;
  y: number;
  type: AnchorType;
  hardware_id: string | null;
  config: Record<string, unknown>;
  battery_level: number | null;
  last_seen: string | null;
  status: 'active' | 'inactive';
}

export interface AttendeePosition {
  attendee_id: string;
  floor_plan_id: string;
  x: number;
  y: number;
  accuracy_m: number | null;
  source: string | null;
  updated_at: string;
}

export interface PositionHistory {
  id: number;
  attendee_id: string;
  floor_plan_id: string;
  x: number;
  y: number;
  recorded_at: string;
}

export interface BoothVisit {
  id: string;
  booth_id: string;
  attendee_id: string;
  entered_at: string;
  exited_at: string | null;
  dwell_seconds: number | null;
  source: 'positioning' | 'qr_scan' | 'manual';
}

export interface FloorPlanTemplate {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  thumbnail_url: string | null;
  data: Record<string, unknown>;
  is_public: boolean;
  created_by: string | null;
  created_at: string;
}

export type BoothRequestStatus = 'pending' | 'approved' | 'rejected';

export interface BoothRequest {
  id: string;
  booth_id: string;
  requester_name: string;
  company: string;
  email: string;
  message: string | null;
  status: BoothRequestStatus;
  created_at: string;
}

// API response types
export interface FloorPlanWithObjects extends FloorPlan {
  floor_plan_objects: FloorPlanObject[];
}

export interface BoothWithProfile extends Booth {
  booth_profiles: BoothProfile[] | null;
}

export interface MarketplaceBooth extends BoothWithProfile {
  floor_plan_object?: FloorPlanObject;
}
