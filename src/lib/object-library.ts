import type { ObjectType, ShapeType, LayerType } from '@/types/database';

export interface LibraryItem {
  id: string;
  name: string;
  category: string;
  subcategory?: string;
  icon: string;
  objectType: ObjectType;
  shapeType: ShapeType;
  defaultLayer: LayerType;
  /** Width in meters */
  widthM: number;
  /** Height in meters */
  heightM: number;
  defaultStyle: Record<string, unknown>;
  metadata: Record<string, unknown>;
}

export const LIBRARY_CATEGORIES = [
  'Booths',
  'Furniture & Fixtures',
  'Infrastructure',
  'Zones',
] as const;

export type LibraryCategory = (typeof LIBRARY_CATEGORIES)[number];

export const LIBRARY_ITEMS: LibraryItem[] = [
  // ── Booths ──
  { id: 'booth-standard-3x3', name: 'Standard 3×3m', category: 'Booths', icon: '🟦', objectType: 'booth', shapeType: 'rect', defaultLayer: 'booths', widthM: 3, heightM: 3, defaultStyle: { fill: '#4A90D9', stroke: '#2C5F8A', strokeWidth: 2, opacity: 1 }, metadata: { boothCategory: 'standard', sizeSqm: 9 } },
  { id: 'booth-standard-4x4', name: 'Standard 4×4m', category: 'Booths', icon: '🟦', objectType: 'booth', shapeType: 'rect', defaultLayer: 'booths', widthM: 4, heightM: 4, defaultStyle: { fill: '#4A90D9', stroke: '#2C5F8A', strokeWidth: 2, opacity: 1 }, metadata: { boothCategory: 'standard', sizeSqm: 16 } },
  { id: 'booth-standard-6x3', name: 'Standard 6×3m', category: 'Booths', icon: '🟦', objectType: 'booth', shapeType: 'rect', defaultLayer: 'booths', widthM: 6, heightM: 3, defaultStyle: { fill: '#4A90D9', stroke: '#2C5F8A', strokeWidth: 2, opacity: 1 }, metadata: { boothCategory: 'standard', sizeSqm: 18 } },
  { id: 'booth-island', name: 'Island Booth', category: 'Booths', icon: '🏝️', objectType: 'booth', shapeType: 'rect', defaultLayer: 'booths', widthM: 6, heightM: 6, defaultStyle: { fill: '#5BA85B', stroke: '#3D7A3D', strokeWidth: 2, opacity: 1 }, metadata: { boothCategory: 'island', sizeSqm: 36 } },
  { id: 'booth-corner', name: 'Corner Booth', category: 'Booths', icon: '📐', objectType: 'booth', shapeType: 'rect', defaultLayer: 'booths', widthM: 4, heightM: 4, defaultStyle: { fill: '#D9A84A', stroke: '#A67B2E', strokeWidth: 2, opacity: 1 }, metadata: { boothCategory: 'corner', sizeSqm: 16 } },
  { id: 'booth-inline', name: 'Inline Booth', category: 'Booths', icon: '▬', objectType: 'booth', shapeType: 'rect', defaultLayer: 'booths', widthM: 3, heightM: 3, defaultStyle: { fill: '#7B68EE', stroke: '#5B4ACE', strokeWidth: 2, opacity: 1 }, metadata: { boothCategory: 'inline', sizeSqm: 9 } },
  { id: 'booth-peninsula', name: 'Peninsula Booth', category: 'Booths', icon: '🔷', objectType: 'booth', shapeType: 'rect', defaultLayer: 'booths', widthM: 6, heightM: 4, defaultStyle: { fill: '#E0725C', stroke: '#B85A48', strokeWidth: 2, opacity: 1 }, metadata: { boothCategory: 'peninsula', sizeSqm: 24 } },
  { id: 'booth-custom', name: 'Custom Booth', category: 'Booths', icon: '✏️', objectType: 'booth', shapeType: 'rect', defaultLayer: 'booths', widthM: 3, heightM: 3, defaultStyle: { fill: '#888888', stroke: '#555555', strokeWidth: 2, opacity: 1 }, metadata: { boothCategory: 'standard', sizeSqm: 9 } },

  // ── Furniture & Fixtures ──
  { id: 'table-round', name: 'Round Table', category: 'Furniture & Fixtures', icon: '⭕', objectType: 'furniture', shapeType: 'circle', defaultLayer: 'furniture', widthM: 1.2, heightM: 1.2, defaultStyle: { fill: '#C19A6B', stroke: '#8B6914', strokeWidth: 1, opacity: 1 }, metadata: {} },
  { id: 'table-rect', name: 'Rectangle Table', category: 'Furniture & Fixtures', icon: '▬', objectType: 'furniture', shapeType: 'rect', defaultLayer: 'furniture', widthM: 1.8, heightM: 0.8, defaultStyle: { fill: '#C19A6B', stroke: '#8B6914', strokeWidth: 1, opacity: 1 }, metadata: {} },
  { id: 'table-conference', name: 'Conference Table', category: 'Furniture & Fixtures', icon: '🟫', objectType: 'furniture', shapeType: 'rect', defaultLayer: 'furniture', widthM: 3, heightM: 1.2, defaultStyle: { fill: '#8B4513', stroke: '#5C2D0E', strokeWidth: 1, opacity: 1 }, metadata: {} },
  { id: 'chair', name: 'Chair', category: 'Furniture & Fixtures', icon: '🪑', objectType: 'furniture', shapeType: 'rect', defaultLayer: 'furniture', widthM: 0.5, heightM: 0.5, defaultStyle: { fill: '#A0522D', stroke: '#6B3410', strokeWidth: 1, opacity: 1 }, metadata: {} },
  { id: 'podium', name: 'Podium / Stage', category: 'Furniture & Fixtures', icon: '🎤', objectType: 'furniture', shapeType: 'rect', defaultLayer: 'furniture', widthM: 4, heightM: 3, defaultStyle: { fill: '#2F4F4F', stroke: '#1A2F2F', strokeWidth: 2, opacity: 1 }, metadata: {} },
  { id: 'registration-desk', name: 'Registration Desk', category: 'Furniture & Fixtures', icon: '🖥️', objectType: 'furniture', shapeType: 'rect', defaultLayer: 'furniture', widthM: 3, heightM: 1, defaultStyle: { fill: '#4682B4', stroke: '#2F5A7E', strokeWidth: 1, opacity: 1 }, metadata: {} },
  { id: 'kiosk', name: 'Kiosk / Info Point', category: 'Furniture & Fixtures', icon: 'ℹ️', objectType: 'furniture', shapeType: 'rect', defaultLayer: 'furniture', widthM: 1, heightM: 1, defaultStyle: { fill: '#20B2AA', stroke: '#178B84', strokeWidth: 1, opacity: 1 }, metadata: {} },
  { id: 'display-stand', name: 'Display Stand', category: 'Furniture & Fixtures', icon: '🖼️', objectType: 'furniture', shapeType: 'rect', defaultLayer: 'furniture', widthM: 2, heightM: 0.5, defaultStyle: { fill: '#708090', stroke: '#4A5A6A', strokeWidth: 1, opacity: 1 }, metadata: {} },

  // ── Infrastructure ──
  { id: 'door-single', name: 'Single Door', category: 'Infrastructure', icon: '🚪', objectType: 'infrastructure', shapeType: 'rect', defaultLayer: 'structure', widthM: 1, heightM: 0.2, defaultStyle: { fill: '#DEB887', stroke: '#8B7355', strokeWidth: 1, opacity: 1 }, metadata: { doorType: 'single' } },
  { id: 'door-double', name: 'Double Door', category: 'Infrastructure', icon: '🚪', objectType: 'infrastructure', shapeType: 'rect', defaultLayer: 'structure', widthM: 2, heightM: 0.2, defaultStyle: { fill: '#DEB887', stroke: '#8B7355', strokeWidth: 1, opacity: 1 }, metadata: { doorType: 'double' } },
  { id: 'door-emergency', name: 'Emergency Exit', category: 'Infrastructure', icon: '🚨', objectType: 'infrastructure', shapeType: 'rect', defaultLayer: 'structure', widthM: 1.5, heightM: 0.2, defaultStyle: { fill: '#FF4444', stroke: '#CC0000', strokeWidth: 2, opacity: 1 }, metadata: { doorType: 'emergency' } },
  { id: 'stairs', name: 'Stairs / Escalator', category: 'Infrastructure', icon: '🪜', objectType: 'infrastructure', shapeType: 'rect', defaultLayer: 'structure', widthM: 3, heightM: 1.5, defaultStyle: { fill: '#B0B0B0', stroke: '#808080', strokeWidth: 1, opacity: 1 }, metadata: {} },
  { id: 'elevator', name: 'Elevator', category: 'Infrastructure', icon: '🛗', objectType: 'infrastructure', shapeType: 'rect', defaultLayer: 'structure', widthM: 2, heightM: 2, defaultStyle: { fill: '#C0C0C0', stroke: '#909090', strokeWidth: 1, opacity: 1 }, metadata: {} },
  { id: 'restroom', name: 'Restroom', category: 'Infrastructure', icon: '🚻', objectType: 'infrastructure', shapeType: 'rect', defaultLayer: 'structure', widthM: 3, heightM: 3, defaultStyle: { fill: '#87CEEB', stroke: '#5B9BD5', strokeWidth: 1, opacity: 1 }, metadata: {} },
  { id: 'electrical-outlet', name: 'Electrical Outlet', category: 'Infrastructure', icon: '🔌', objectType: 'infrastructure', shapeType: 'rect', defaultLayer: 'furniture', widthM: 0.3, heightM: 0.3, defaultStyle: { fill: '#FFD700', stroke: '#DAA520', strokeWidth: 1, opacity: 1 }, metadata: {} },
  { id: 'wifi-ap', name: 'WiFi AP', category: 'Infrastructure', icon: '📶', objectType: 'infrastructure', shapeType: 'circle', defaultLayer: 'furniture', widthM: 0.4, heightM: 0.4, defaultStyle: { fill: '#32CD32', stroke: '#228B22', strokeWidth: 1, opacity: 1 }, metadata: {} },
  { id: 'fire-extinguisher', name: 'Fire Extinguisher', category: 'Infrastructure', icon: '🧯', objectType: 'infrastructure', shapeType: 'rect', defaultLayer: 'furniture', widthM: 0.3, heightM: 0.3, defaultStyle: { fill: '#FF0000', stroke: '#CC0000', strokeWidth: 1, opacity: 1 }, metadata: {} },

  // ── Zones ──
  { id: 'zone-walkway', name: 'Walkway / Aisle', category: 'Zones', icon: '🛤️', objectType: 'zone', shapeType: 'rect', defaultLayer: 'zones', widthM: 10, heightM: 2, defaultStyle: { fill: '#E8E8E8', stroke: '#AAAAAA', strokeWidth: 1, opacity: 0.6 }, metadata: { zoneType: 'walkway', widthM: 2 } },
  { id: 'zone-networking', name: 'Networking Lounge', category: 'Zones', icon: '🤝', objectType: 'zone', shapeType: 'rect', defaultLayer: 'zones', widthM: 8, heightM: 6, defaultStyle: { fill: '#FFE4B5', stroke: '#DEB887', strokeWidth: 1, opacity: 0.5 }, metadata: { zoneType: 'networking' } },
  { id: 'zone-food', name: 'Food & Beverage', category: 'Zones', icon: '🍽️', objectType: 'zone', shapeType: 'rect', defaultLayer: 'zones', widthM: 10, heightM: 8, defaultStyle: { fill: '#98FB98', stroke: '#66CD00', strokeWidth: 1, opacity: 0.5 }, metadata: { zoneType: 'food' } },
  { id: 'zone-session', name: 'Session / Conference Room', category: 'Zones', icon: '🎓', objectType: 'zone', shapeType: 'rect', defaultLayer: 'zones', widthM: 10, heightM: 8, defaultStyle: { fill: '#B0C4DE', stroke: '#6B8FB5', strokeWidth: 1, opacity: 0.5 }, metadata: { zoneType: 'session' } },
  { id: 'zone-vip', name: 'VIP Area', category: 'Zones', icon: '⭐', objectType: 'zone', shapeType: 'rect', defaultLayer: 'zones', widthM: 6, heightM: 6, defaultStyle: { fill: '#FFD700', stroke: '#DAA520', strokeWidth: 2, opacity: 0.4 }, metadata: { zoneType: 'vip' } },
  { id: 'zone-loading', name: 'Loading Dock', category: 'Zones', icon: '🚛', objectType: 'zone', shapeType: 'rect', defaultLayer: 'zones', widthM: 8, heightM: 4, defaultStyle: { fill: '#D3D3D3', stroke: '#A9A9A9', strokeWidth: 1, opacity: 0.5 }, metadata: { zoneType: 'loading' } },
];

export function getItemsByCategory(category: string): LibraryItem[] {
  return LIBRARY_ITEMS.filter((item) => item.category === category);
}
