# Task Breakdown

## Phase 1 — Core Editor

### P1-T1: Database Schema & API Foundation
- Create Supabase migration: floor_plans, floor_plan_objects tables + indexes
- Create stub parent tables (events, attendees, exhibitors)
- Supabase client lib setup
- API routes: CRUD for floor_plans and floor_plan_objects
- RLS policies scoped to event ownership

### P1-T2: Canvas System (Zoom, Pan, Grid, Snap, Minimap)
- Konva.js canvas with infinite zoom (10%-500%) and pan
- Configurable grid snapping (0.5m, 1m, 2m, 5m)
- Ruler/measurement overlay (meters/feet)
- Minimap (bottom-right, viewport indicator)
- Zustand store for editor state (zoom, pan, grid, tool selection)

### P1-T3: Shape Tools (Rect, Circle, Polygon, Line)
- Rectangle tool (click-drag, resize handles on corners/edges)
- Circle/Ellipse tool (click-drag, Shift=constrain to circle)
- Polygon tool (click vertices, double-click to close)
- Line tool (straight lines for walls/dividers)
- Text label tool (floating annotations)
- Dimension line tool (measurement between two points)

### P1-T4: Object Properties Panel
- Right sidebar: position (X,Y), size (W,H with lock aspect), rotation (0-360°)
- Fill color + opacity, border (color, width, solid/dashed)
- Label, category, layer, z-index
- Lock toggle (prevent moves)
- Metadata (custom key-value pairs)

### P1-T5: Layer Management
- 6 layers: Background, Structure, Booths, Zones, Furniture, Annotations
- Per layer: visibility toggle, lock toggle, opacity slider
- Layer panel in UI

### P1-T6: Object Library Sidebar (Drag-and-Drop)
- Sidebar with categorized objects (Booths, Furniture, Infrastructure, Zones per PRD)
- Drag from sidebar onto canvas to place
- Preset booth sizes (3x3m, 4x4m, 6x3m)
- All object types from PRD §3.1.3

### P1-T7: Background Image Import
- Upload venue blueprints (PNG, SVG, PDF)
- Trace layer with opacity control
- Background layer integration

### P1-T8: Undo/Redo, Auto-save, Keyboard Shortcuts
- Full history stack (min 100 steps)
- Undo (Ctrl+Z), Redo (Ctrl+Y)
- Auto-save every 30s + on significant actions
- Keyboard shortcuts: Delete, Ctrl+C/V, arrow nudge, Ctrl+A
- Multi-select: click+drag box, Shift+click additive

### P1-T9: Floor Plan Viewer (Read-Only Attendee Mode)
- Read-only floor plan rendering
- Zoom/pan navigation
- Booth info popups on click
- Separate route from editor

### P1-T10: Integration, Testing & Polish
- Full integration testing of all P1 features
- TypeScript strict mode compliance
- ESLint clean
- Build passes
- Initial deployment to Vercel

## Phase 2-6: Defined in PRD, tasks to be broken down after Phase 1 PASS.
