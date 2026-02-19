# B2 Pair — Interactive Floor Plan Editor PRD

**Version:** 1.0  
**Date:** February 19, 2026  
**Author:** Jarvis (AI Architect)  
**Product:** B2 Pair — B2B Event Matchmaking Platform  
**Module:** Floor Plan Editor & Wayfinding System

---

## 1. Overview

A full-featured, ExpoFP-grade interactive floor plan editor that allows event organizers to design venue layouts with custom booth shapes, manage multi-floor venues, track real-time attendee positions, and provide intelligent wayfinding/routing — all integrated with B2 Pair's matchmaking engine.

### 1.1 Goals

- **Organizers** can design and manage complex venue floor plans without external tools
- **Exhibitors** can claim/customize their booth spaces
- **Attendees** get real-time wayfinding to booths, sessions, and matched contacts
- **AI matchmaking** integrates spatial awareness (proximity-based suggestions, optimized meeting routes)

### 1.2 Non-Goals (v1)

- 3D floor plan rendering (2D top-down only)
- AR/VR wayfinding overlays
- Hardware beacon procurement/management (we integrate with existing BLE/UWB infrastructure)
- Architectural CAD-level precision (this is event layout, not building design)

---

## 2. User Roles

| Role | Permissions |
|------|-------------|
| **Platform Admin** | Full access, template management, global settings |
| **Event Organizer** | Create/edit floor plans, assign booths, view analytics |
| **Exhibitor** | View assigned booth, customize booth profile, upload assets |
| **Attendee** | View floor plan, get wayfinding directions, see real-time positions |
| **Staff** | View floor plan, manage check-ins, emergency evacuation views |

---

## 3. Feature Breakdown

### 3.1 Drag-and-Drop Floor Plan Editor

#### 3.1.1 Canvas System

- **Infinite canvas** with zoom (10%–500%) and pan
- **Grid snapping** — configurable grid size (0.5m, 1m, 2m, 5m)
- **Ruler/measurement** overlay in meters or feet
- **Background image import** — upload venue blueprints (PNG, SVG, PDF) as trace layer with opacity control
- **Multi-select** — click + drag selection box, Shift+click for additive
- **Undo/redo** — full history stack (min 100 steps)
- **Auto-save** — every 30 seconds + on every significant action
- **Keyboard shortcuts** — Delete, Ctrl+Z/Y, Ctrl+C/V, arrow nudge, Ctrl+A
- **Minimap** — bottom-right corner showing full layout with viewport indicator

#### 3.1.2 Shape Tools

| Tool | Description |
|------|-------------|
| **Rectangle** | Click-drag to draw, resize handles on corners/edges |
| **Circle/Ellipse** | Click-drag, constrain to circle with Shift |
| **Polygon** | Click to place vertices, double-click to close |
| **L-Shape / T-Shape / U-Shape** | Preset compound shapes for common booth configs |
| **Freeform** | Bezier curve drawing for irregular spaces |
| **Line/Wall** | Straight lines for walls, dividers, barriers |
| **Arc/Curve** | Curved walls and boundaries |
| **Text Label** | Floating text annotations |
| **Dimension Line** | Shows measurement between two points |

#### 3.1.3 Object Library (Drag from Sidebar)

**Booths:**
- Standard (3x3m, 4x4m, 6x3m presets)
- Island booth (open all sides)
- Corner booth
- Inline booth
- Peninsula booth
- Custom (any drawn shape becomes a booth)

**Furniture & Fixtures:**
- Tables (round, rectangle, conference)
- Chairs
- Podiums/stages
- Registration desks
- Kiosks/info points
- Display stands

**Infrastructure:**
- Doors (single, double, emergency)
- Stairs / escalators
- Elevators
- Restrooms (icon marker)
- Electrical outlets
- WiFi access points
- Fire extinguishers / emergency equipment

**Zones:**
- Walkways/aisles (with width)
- Networking lounges
- Food & beverage areas
- Session/conference rooms
- VIP areas
- Loading docks / back-of-house

#### 3.1.4 Object Properties Panel

When an object is selected, the right panel shows:

- **Position:** X, Y coordinates
- **Size:** Width, Height (with lock aspect ratio)
- **Rotation:** 0–360°
- **Fill color** + opacity
- **Border:** color, width, style (solid/dashed)
- **Label:** Display name
- **Category:** Booth type / zone type / infrastructure
- **Layer:** Z-index ordering
- **Lock:** Prevent accidental moves
- **Metadata:** Custom key-value pairs
- **Booth-specific:** Booth ID, exhibitor assignment, pricing tier, status (available/reserved/sold/blocked)

#### 3.1.5 Layer Management

- **Background** — imported venue blueprint
- **Structure** — walls, doors, fixed infrastructure
- **Booths** — all booth objects
- **Zones** — walkways, lounges, restricted areas
- **Furniture** — tables, chairs, fixtures
- **Annotations** — labels, dimensions, notes
- **Heatmap overlay** — real-time traffic (toggle)
- **Wayfinding overlay** — routes and navigation (toggle)

Each layer: visibility toggle, lock toggle, opacity slider.

---

### 3.2 Custom Booth Shapes

#### 3.2.1 Booth Builder

- Draw any closed shape → right-click → "Convert to Booth"
- **Compound booths:** merge multiple shapes into one booth unit
- **Booth templates:** save custom shapes as reusable templates
- **Booth splitting:** divide a large space into multiple booths with a line tool
- **Snap-to-neighbor:** booths align to adjacent booths automatically
- **Minimum size enforcement:** configurable per event (e.g., min 9 sqm)
- **Auto-numbering:** sequential booth IDs with configurable prefix (A-101, B-202, etc.)

#### 3.2.2 Booth Status & Assignment

| Status | Color | Description |
|--------|-------|-------------|
| Available | Green | Open for booking |
| Reserved | Yellow | Held/pending payment |
| Sold | Blue | Confirmed exhibitor |
| Blocked | Red | Not for sale (staff, infrastructure) |
| Premium | Gold | Premium/sponsored tier |

- **Assign exhibitor** — search by company, drag from exhibitor list, or self-service claim
- **Booth profiles** — exhibitor uploads logo, description, products, team members
- **Pricing tiers** — per-sqm or flat rate, by zone or booth type
- **Bulk operations** — select multiple → change status, assign category, set pricing

---

### 3.3 Multi-Floor Support

#### 3.3.1 Floor Management

- **Floor list panel** — left sidebar, drag to reorder
- **Add/remove floors** — name, level number, elevation
- **Floor-specific settings** — individual grid, scale, background image
- **Copy floor** — duplicate layout as starting point
- **Cross-floor elements** — stairs, elevators, escalators linked between floors
- **Floor overview** — thumbnail view of all floors side by side
- **Default floor** — configurable "entry" floor for attendees

#### 3.3.2 Floor Transitions

- Stairs/elevators are **linked pairs** between floors
- Clicking a linked stair on Floor 1 offers "Go to Floor 2" in attendee view
- Wayfinding engine calculates cross-floor routes automatically
- Elevator capacity/wait times optionally factored into routing

---

### 3.4 Real-Time Attendee Positioning

#### 3.4.1 Positioning Technology Integration

| Method | Accuracy | Setup Cost | Use Case |
|--------|----------|-----------|----------|
| **BLE Beacons** | 2-5m | Medium | Indoor positioning, booth proximity |
| **UWB Tags** | 10-30cm | High | Precise tracking, premium events |
| **WiFi Fingerprinting** | 5-15m | Low | Large venues, approximate zones |
| **QR Check-in** | Zone-level | Very Low | Budget events, session rooms |
| **GPS** | 3-10m | None | Outdoor venues only |
| **Hybrid** | Best available | Varies | Combine multiple sources |

#### 3.4.2 Beacon/Anchor Management

- **Place beacons** on floor plan editor (drag from infrastructure library)
- **Beacon configuration:** UUID, major, minor, TX power, battery status
- **Coverage visualization:** show estimated range circles per beacon
- **Dead zone detection:** highlight areas with insufficient coverage
- **Calibration mode:** walk-test with reference device, adjust positioning model

#### 3.4.3 Real-Time Tracking Features

- **Live dot overlay:** show attendee positions as dots on floor plan (anonymized or identified based on privacy settings)
- **Density heatmap:** color gradient showing crowd concentration
- **Flow arrows:** aggregate movement direction visualization
- **Booth dwell time:** how long attendees spend at each booth
- **Zone occupancy counters:** real-time count per zone with capacity warnings
- **Historical playback:** scrub through time to replay movement patterns
- **Alerts:** overcrowding warnings, restricted zone breaches, VIP arrival notifications

#### 3.4.4 Privacy & Consent

- **Opt-in only:** attendees must explicitly enable location sharing
- **Granularity control:** share exact position / zone-level only / off
- **Anonymization:** organizer heatmaps use anonymized aggregate data
- **Visibility settings:** "Show me to matched contacts only" / "Show me to everyone" / "Ghost mode"
- **Data retention:** configurable (event duration only, 30 days, custom)
- **GDPR compliance:** right to delete, data export, clear consent records

---

### 3.5 Wayfinding & Route Navigation

#### 3.5.1 Navigation Graph

- **Auto-generated** from walkways and aisles drawn on floor plan
- **Manual waypoints** for fine-tuning (editor places navigation nodes)
- **One-way paths** support (enforce traffic flow direction)
- **Accessibility routing:** wheelchair-accessible paths, avoiding stairs
- **Weighted edges:** factor in congestion, distance, elevation changes

#### 3.5.2 Attendee Wayfinding

- **Search destination:** booth by name/exhibitor, session room, facility (restroom, food, exit)
- **Turn-by-turn directions:** "Walk straight 20m → Turn left at Aisle C → Booth B-204 on your right"
- **On-map route line:** animated path overlay with estimated walk time
- **Multi-stop routes:** "Visit these 5 booths" → optimized order (TSP solver)
- **Live re-routing:** if path is congested, suggest alternative
- **Nearest facility:** "Nearest restroom," "Nearest food," "Nearest exit"
- **Cross-floor navigation:** seamless directions across floors via stairs/elevators
- **Voice guidance** (optional): text-to-speech directions for accessibility

#### 3.5.3 AI-Powered Smart Routes

Integration with B2 Pair matchmaking engine:

- **"Show me my matches"** — plots all matched contacts on map with proximity indicators
- **Optimized meeting route** — "Visit your top 10 matches in the best order"
- **Serendipity mode** — "A high-match contact is 30m from you right now!"
- **Schedule-aware routing** — factors in session times, booth availability, meeting slots
- **Congestion-aware** — avoids busy aisles, suggests off-peak times for popular booths

---

### 3.6 Exhibitor Self-Service

#### 3.6.1 Booth Customization Portal

- View assigned booth on interactive (read-only) floor plan
- Upload booth design/layout within their space
- Set booth profile: logo, banner image, description, products/services, team bios
- Manage lead scanning settings
- View real-time booth analytics (visitors, dwell time, scans)

#### 3.6.2 Booth Marketplace

- Browse available booths on interactive floor plan
- Filter by: size, price, zone, proximity to entrance/sessions
- Request/book booth with payment integration
- Waitlist for sold-out preferred spots

---

### 3.7 Analytics Dashboard

#### 3.7.1 Real-Time Metrics

- Total attendees on-site (by floor)
- Busiest zones / booths
- Average dwell time per booth
- Peak traffic times
- Current flow bottlenecks

#### 3.7.2 Post-Event Analytics

- Heatmap timelapse (GIF/video export)
- Booth performance ranking (visits, unique visitors, avg dwell)
- Traffic flow patterns
- Zone utilization rates
- Attendee journey analysis (common paths)
- ROI metrics per booth (visits vs. cost)
- Exportable reports (PDF, CSV)

---

## 4. Technical Architecture

### 4.1 Frontend

```
Framework:     Next.js 15 (App Router)
Canvas Engine: Konva.js (React-Konva) for 2D canvas rendering
State:         Zustand (editor state) + React Query (server state)
Real-time:     Socket.IO client for live positions
Maps:          Custom canvas overlay (not Google Maps — indoor only)
UI:            Tailwind CSS + shadcn/ui
DnD:           Native HTML5 drag + Konva drag handlers
```

**Why Konva.js:**
- Hardware-accelerated canvas rendering (handles 1000s of objects)
- Built-in drag-and-drop, transforms, hit detection
- React-Konva provides declarative API
- Better performance than SVG for complex floor plans
- Supports custom shapes, images, groups

### 4.2 Backend

```
API:           Next.js API Routes + tRPC
Database:      Supabase (PostgreSQL)
Real-time:     Supabase Realtime (presence + broadcast) + Socket.IO for high-frequency position updates
File Storage:  Supabase Storage (floor plan images, booth assets)
Auth:          Supabase Auth (existing B2 Pair auth)
Pathfinding:   Server-side A* / Dijkstra with navigation graph
```

### 4.3 Positioning Pipeline

```
Beacon Data → MQTT/WebSocket → Position Engine (triangulation) → 
Socket.IO broadcast → Client canvas overlay

Position Engine options:
  - Self-hosted: IndoorAtlas SDK / custom trilateration
  - Third-party: IndoorAtlas, Mapwize, MazeMap API
  - Simple: Zone-based (QR/NFC check-in only)
```

### 4.4 Database Schema (Key Tables)

```sql
-- Floor plans
CREATE TABLE floor_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  floor_number INT NOT NULL DEFAULT 0,
  width_m DECIMAL NOT NULL,      -- venue width in meters
  height_m DECIMAL NOT NULL,     -- venue height in meters
  background_image_url TEXT,
  grid_size_m DECIMAL DEFAULT 1.0,
  scale_px_per_m DECIMAL DEFAULT 50.0,
  metadata JSONB DEFAULT '{}',
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- All objects on a floor plan (booths, walls, zones, furniture)
CREATE TABLE floor_plan_objects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  floor_plan_id UUID REFERENCES floor_plans(id) ON DELETE CASCADE,
  type TEXT NOT NULL,             -- 'booth', 'wall', 'zone', 'furniture', 'infrastructure', 'annotation'
  shape TEXT NOT NULL,            -- 'rect', 'circle', 'polygon', 'line', 'text', 'image'
  label TEXT,
  x DECIMAL NOT NULL DEFAULT 0,
  y DECIMAL NOT NULL DEFAULT 0,
  width DECIMAL,
  height DECIMAL,
  rotation DECIMAL DEFAULT 0,
  points JSONB,                  -- for polygons/lines: [{x, y}, ...]
  style JSONB DEFAULT '{}',      -- fill, stroke, opacity, fontSize, etc.
  layer TEXT DEFAULT 'default',
  z_index INT DEFAULT 0,
  locked BOOLEAN DEFAULT false,
  visible BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}',   -- custom key-value pairs
  parent_id UUID REFERENCES floor_plan_objects(id), -- for grouped objects
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Booth-specific data (1:1 with floor_plan_objects where type='booth')
CREATE TABLE booths (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  object_id UUID UNIQUE REFERENCES floor_plan_objects(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  booth_number TEXT NOT NULL,
  status TEXT DEFAULT 'available',   -- available, reserved, sold, blocked, premium
  category TEXT,                     -- standard, island, corner, inline, peninsula
  size_sqm DECIMAL,
  price DECIMAL,
  pricing_tier TEXT,
  exhibitor_id UUID REFERENCES exhibitors(id),
  max_capacity INT,
  amenities JSONB DEFAULT '[]',      -- power, wifi, water, etc.
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Booth profiles (exhibitor-managed content)
CREATE TABLE booth_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booth_id UUID UNIQUE REFERENCES booths(id) ON DELETE CASCADE,
  company_name TEXT,
  logo_url TEXT,
  banner_url TEXT,
  description TEXT,
  products JSONB DEFAULT '[]',
  team_members JSONB DEFAULT '[]',
  social_links JSONB DEFAULT '{}',
  custom_fields JSONB DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Navigation graph for wayfinding
CREATE TABLE nav_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  floor_plan_id UUID REFERENCES floor_plans(id) ON DELETE CASCADE,
  x DECIMAL NOT NULL,
  y DECIMAL NOT NULL,
  type TEXT DEFAULT 'waypoint',    -- waypoint, entrance, exit, elevator, stairs
  accessible BOOLEAN DEFAULT true,
  linked_floor_node_id UUID REFERENCES nav_nodes(id), -- cross-floor link
  metadata JSONB DEFAULT '{}'
);

CREATE TABLE nav_edges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_node_id UUID REFERENCES nav_nodes(id) ON DELETE CASCADE,
  to_node_id UUID REFERENCES nav_nodes(id) ON DELETE CASCADE,
  distance_m DECIMAL NOT NULL,
  bidirectional BOOLEAN DEFAULT true,
  accessible BOOLEAN DEFAULT true,
  weight_modifier DECIMAL DEFAULT 1.0, -- >1 = avoid, <1 = prefer
  UNIQUE(from_node_id, to_node_id)
);

-- Beacon/anchor placement
CREATE TABLE positioning_anchors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  floor_plan_id UUID REFERENCES floor_plans(id) ON DELETE CASCADE,
  x DECIMAL NOT NULL,
  y DECIMAL NOT NULL,
  type TEXT NOT NULL,              -- 'ble', 'uwb', 'wifi', 'qr', 'nfc'
  hardware_id TEXT,                -- beacon UUID/MAC
  config JSONB DEFAULT '{}',       -- tx_power, major, minor, etc.
  battery_level INT,
  last_seen TIMESTAMPTZ,
  status TEXT DEFAULT 'active'
);

-- Real-time attendee positions (ephemeral — hot table)
CREATE TABLE attendee_positions (
  attendee_id UUID REFERENCES attendees(id) ON DELETE CASCADE,
  floor_plan_id UUID REFERENCES floor_plans(id),
  x DECIMAL NOT NULL,
  y DECIMAL NOT NULL,
  accuracy_m DECIMAL,
  source TEXT,                    -- 'ble', 'uwb', 'wifi', 'qr', 'gps'
  updated_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (attendee_id)
);

-- Position history (for analytics)
CREATE TABLE position_history (
  id BIGSERIAL PRIMARY KEY,
  attendee_id UUID NOT NULL,
  floor_plan_id UUID NOT NULL,
  x DECIMAL NOT NULL,
  y DECIMAL NOT NULL,
  recorded_at TIMESTAMPTZ DEFAULT now()
);
-- Partition by date for performance
-- CREATE INDEX idx_pos_history_time ON position_history (recorded_at);

-- Booth visit tracking
CREATE TABLE booth_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booth_id UUID REFERENCES booths(id) ON DELETE CASCADE,
  attendee_id UUID REFERENCES attendees(id) ON DELETE CASCADE,
  entered_at TIMESTAMPTZ NOT NULL,
  exited_at TIMESTAMPTZ,
  dwell_seconds INT,
  source TEXT DEFAULT 'positioning'  -- positioning, qr_scan, manual
);

-- Floor plan templates
CREATE TABLE floor_plan_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,                   -- 'convention_center', 'hotel', 'outdoor', etc.
  thumbnail_url TEXT,
  data JSONB NOT NULL,             -- serialized floor plan + objects
  is_public BOOLEAN DEFAULT false,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 4.5 Key Indexes

```sql
CREATE INDEX idx_fpo_floor ON floor_plan_objects(floor_plan_id);
CREATE INDEX idx_fpo_type ON floor_plan_objects(floor_plan_id, type);
CREATE INDEX idx_booths_event ON booths(event_id);
CREATE INDEX idx_booths_status ON booths(event_id, status);
CREATE INDEX idx_booth_visits_booth ON booth_visits(booth_id, entered_at);
CREATE INDEX idx_booth_visits_attendee ON booth_visits(attendee_id, entered_at);
CREATE INDEX idx_nav_edges_from ON nav_edges(from_node_id);
CREATE INDEX idx_nav_edges_to ON nav_edges(to_node_id);
CREATE INDEX idx_pos_history_attendee ON position_history(attendee_id, recorded_at);
```

---

## 5. Implementation Phases

### Phase 1 — Core Editor (4 weeks)

- [ ] Canvas system (zoom, pan, grid, snap)
- [ ] Rectangle, circle, polygon, line shape tools
- [ ] Object properties panel (position, size, rotation, style)
- [ ] Layer management (6 layers with visibility/lock)
- [ ] Object library sidebar with drag-and-drop
- [ ] Background image import with opacity
- [ ] Undo/redo stack
- [ ] Auto-save + manual save
- [ ] Keyboard shortcuts
- [ ] Minimap
- [ ] Database: floor_plans, floor_plan_objects tables
- [ ] API: CRUD for floor plans and objects
- [ ] Basic floor plan viewer (read-only mode for attendees)

### Phase 2 — Booths & Multi-Floor (3 weeks)

- [ ] Booth conversion (shape → booth with properties)
- [ ] Booth status management (available/reserved/sold/blocked)
- [ ] Booth numbering (auto + manual)
- [ ] Exhibitor assignment
- [ ] Booth profiles (logo, description, products)
- [ ] Booth marketplace (browse + filter + request)
- [ ] Multi-floor support (add/remove/reorder floors)
- [ ] Floor-specific backgrounds and settings
- [ ] Cross-floor element linking (stairs/elevators)
- [ ] Floor overview panel
- [ ] Database: booths, booth_profiles tables
- [ ] Booth pricing tiers

### Phase 3 — Wayfinding (3 weeks)

- [ ] Navigation graph auto-generation from walkways
- [ ] Manual waypoint placement + editing
- [ ] A* pathfinding engine (server-side)
- [ ] Route visualization on canvas (animated path)
- [ ] Turn-by-turn text directions
- [ ] Multi-stop route optimization (nearest-neighbor TSP heuristic)
- [ ] Cross-floor routing via linked stairs/elevators
- [ ] Accessibility routing (wheelchair-friendly paths)
- [ ] Search: booth by name, nearest facility
- [ ] Database: nav_nodes, nav_edges tables
- [ ] Congestion-aware re-routing (future data feed)

### Phase 4 — Real-Time Positioning (3 weeks)

- [ ] Beacon/anchor placement on editor
- [ ] Positioning anchor management UI
- [ ] Position ingestion pipeline (WebSocket/MQTT → processing → broadcast)
- [ ] BLE trilateration engine (basic)
- [ ] QR/NFC zone check-in (fallback positioning)
- [ ] Live attendee dots on floor plan
- [ ] Density heatmap overlay
- [ ] Zone occupancy counters
- [ ] Privacy controls (opt-in, granularity, ghost mode)
- [ ] Database: positioning_anchors, attendee_positions tables

### Phase 5 — Analytics & AI Integration (2 weeks)

- [ ] Real-time dashboard (on-site count, busy zones, flow)
- [ ] Booth visit tracking + dwell time
- [ ] Post-event heatmap timelapse
- [ ] Booth performance ranking
- [ ] Traffic flow visualization
- [ ] Exportable reports (PDF, CSV)
- [ ] AI match plotting on map ("Show my matches")
- [ ] Smart route generation ("Visit top matches efficiently")
- [ ] Serendipity notifications ("High match nearby!")
- [ ] Database: booth_visits, position_history tables

### Phase 6 — Polish & Advanced (2 weeks)

- [ ] Floor plan templates (save/load/share)
- [ ] Compound shape tools (L, T, U shapes)
- [ ] Freeform/bezier drawing
- [ ] Bulk booth operations
- [ ] Collaborative editing (multi-user cursors — stretch goal)
- [ ] Mobile-optimized attendee view
- [ ] Offline floor plan caching (PWA)
- [ ] Emergency evacuation view (nearest exit routing)
- [ ] Historical playback scrubber
- [ ] Performance optimization (virtualization for 5000+ objects)

---

## 6. Performance Requirements

| Metric | Target |
|--------|--------|
| Canvas render (1000 objects) | < 16ms per frame (60fps) |
| Floor plan load time | < 2 seconds |
| Position update latency | < 500ms end-to-end |
| Pathfinding calculation | < 200ms for single route |
| Multi-stop optimization (10 stops) | < 1 second |
| Concurrent live positions | 10,000+ attendees |
| Auto-save round-trip | < 1 second |
| Heatmap refresh | Every 5 seconds |

---

## 7. Security & Access Control

- RLS on all tables scoped to event ownership
- Exhibitors can only modify their own booth profile
- Attendee position data: encrypted at rest, ephemeral (auto-purge post-event)
- Admin audit log for all floor plan modifications
- Rate limiting on position ingestion API (prevent flooding)
- Signed URLs for background images and assets

---

## 8. Third-Party Integrations

| Service | Purpose | Priority |
|---------|---------|----------|
| **IndoorAtlas** | Professional indoor positioning SDK | P1 (if BLE/UWB used) |
| **Mapwize** | Alternative indoor mapping platform | P2 |
| **Stripe** | Booth booking payments | P1 |
| **ExpoFP** | Import existing floor plans (JSON/SVG) | P2 |
| **Supabase Realtime** | Live position broadcast | P0 |

---

## 9. Open Questions

1. **Positioning approach for MVP?** — QR zone check-in (cheapest) vs BLE beacons (better UX)?
2. **Collaborative editing?** — Multiple organizers editing simultaneously? (Complex — maybe Phase 6+)
3. **Import/export formats?** — SVG, DXF, ExpoFP JSON, custom?
4. **Mobile editor?** — Or editor desktop-only, viewer mobile-responsive?
5. **Offline capability?** — How much works without internet? (PWA service worker for floor plan cache?)

---

## 10. Success Metrics

| Metric | Target |
|--------|--------|
| Floor plan creation time (medium venue) | < 2 hours |
| Attendee wayfinding adoption | > 40% of attendees use it |
| Booth dwell time accuracy | ±30 seconds |
| Exhibitor booth profile completion rate | > 70% |
| Organizer satisfaction (post-event survey) | > 4.2/5 |
| Wayfinding route accuracy | > 95% reach destination |

---

## 11. Estimated Total Effort

| Phase | Duration | Complexity |
|-------|----------|------------|
| Phase 1 — Core Editor | 4 weeks | High |
| Phase 2 — Booths & Multi-Floor | 3 weeks | Medium-High |
| Phase 3 — Wayfinding | 3 weeks | High |
| Phase 4 — Real-Time Positioning | 3 weeks | Very High |
| Phase 5 — Analytics & AI | 2 weeks | Medium |
| Phase 6 — Polish & Advanced | 2 weeks | Medium |
| **Total** | **~17 weeks** | |

With parallel work on frontend/backend and leveraging existing B2 Pair infrastructure, this could compress to **12-14 weeks** with 2 devs.

---

*This PRD is ready for review. All features are scoped to integrate with B2 Pair's existing matchmaking, event management, and attendee systems.*
