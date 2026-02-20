import type { FloorPlanObject, NavNode, NavEdge } from '@/types/database';

/**
 * Auto-generate navigation graph from walkway/zone objects.
 * Strategy: place nodes at centers and corners of walkable zones,
 * then connect adjacent nodes with edges.
 */

interface GeneratedNode {
  x: number;
  y: number;
  type: NavNode['type'];
  accessible: boolean;
  metadata: Record<string, unknown>;
}

interface GeneratedEdge {
  fromIndex: number;
  toIndex: number;
  distance_m: number;
  accessible: boolean;
}

interface GenerationResult {
  nodes: GeneratedNode[];
  edges: GeneratedEdge[];
}

/** Check if an object is a walkable area */
function isWalkable(obj: FloorPlanObject): boolean {
  // zones and infrastructure types that represent walkways
  if (obj.type === 'zone') return true;
  if (obj.type === 'infrastructure') {
    const label = (obj.label || '').toLowerCase();
    return label.includes('walkway') || label.includes('corridor') || label.includes('aisle') || label.includes('path');
  }
  return false;
}

/** Check if object represents stairs/elevator */
function isVerticalTransport(obj: FloorPlanObject): boolean {
  const label = (obj.label || '').toLowerCase();
  return label.includes('stair') || label.includes('elevator') || label.includes('escalator') || label.includes('lift');
}

/** Check if object is an entrance/exit */
function isEntrance(obj: FloorPlanObject): boolean {
  const label = (obj.label || '').toLowerCase();
  return label.includes('entrance') || label.includes('exit') || label.includes('door') || label.includes('gate');
}

/** Get bounding box center of an object */
function getCenter(obj: FloorPlanObject): { x: number; y: number } {
  return {
    x: obj.x + (obj.width || 0) / 2,
    y: obj.y + (obj.height || 0) / 2,
  };
}

/** Get corner points of a rectangular object for better graph coverage */
function getCornerMidpoints(obj: FloorPlanObject): Array<{ x: number; y: number }> {
  const w = obj.width || 0;
  const h = obj.height || 0;
  if (w === 0 || h === 0) return [];

  // Midpoints of each edge — better for connecting corridors
  return [
    { x: obj.x + w / 2, y: obj.y },         // top center
    { x: obj.x + w / 2, y: obj.y + h },     // bottom center
    { x: obj.x, y: obj.y + h / 2 },         // left center
    { x: obj.x + w, y: obj.y + h / 2 },     // right center
  ];
}

/** Euclidean distance */
function dist(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

/** Check if a point is inside a rectangular object (with margin) */
function isPointInObject(p: { x: number; y: number }, obj: FloorPlanObject, margin = 5): boolean {
  const w = obj.width || 0;
  const h = obj.height || 0;
  return (
    p.x >= obj.x - margin &&
    p.x <= obj.x + w + margin &&
    p.y >= obj.y - margin &&
    p.y <= obj.y + h + margin
  );
}

/**
 * Generate a navigation graph from floor plan objects.
 * @param objects All objects on the floor plan
 * @param scalePxPerM Pixels per meter for distance calculation
 */
export function generateNavGraph(
  objects: FloorPlanObject[],
  scalePxPerM: number = 50
): GenerationResult {
  const walkableObjects = objects.filter(isWalkable);
  const nodes: GeneratedNode[] = [];
  const nodeObjectMap: number[][] = []; // which objects each node belongs to

  // Phase 1: Generate nodes from walkable objects
  for (const obj of walkableObjects) {
    const center = getCenter(obj);
    const isAccessible = !obj.metadata?.['not_accessible'];

    // Center node
    const centerIdx = nodes.length;
    nodes.push({
      x: center.x,
      y: center.y,
      type: 'waypoint',
      accessible: isAccessible,
      metadata: { source_object_id: obj.id, auto_generated: true },
    });
    nodeObjectMap.push([walkableObjects.indexOf(obj)]);

    // Edge midpoint nodes for larger objects (>2m equivalent)
    const w = obj.width || 0;
    const h = obj.height || 0;
    if (w > scalePxPerM * 2 || h > scalePxPerM * 2) {
      const midpoints = getCornerMidpoints(obj);
      for (const mp of midpoints) {
        nodes.push({
          x: mp.x,
          y: mp.y,
          type: 'waypoint',
          accessible: isAccessible,
          metadata: { source_object_id: obj.id, auto_generated: true },
        });
        nodeObjectMap.push([walkableObjects.indexOf(obj)]);
      }
    }
  }

  // Add nodes for special objects (stairs, elevators, entrances)
  for (const obj of objects) {
    if (isVerticalTransport(obj)) {
      const center = getCenter(obj);
      const label = (obj.label || '').toLowerCase();
      nodes.push({
        x: center.x,
        y: center.y,
        type: label.includes('elevator') || label.includes('lift') ? 'elevator' : 'stairs',
        accessible: label.includes('elevator') || label.includes('lift'),
        metadata: { source_object_id: obj.id, auto_generated: true },
      });
      nodeObjectMap.push([]);
    } else if (isEntrance(obj)) {
      const center = getCenter(obj);
      const label = (obj.label || '').toLowerCase();
      nodes.push({
        x: center.x,
        y: center.y,
        type: label.includes('exit') ? 'exit' : 'entrance',
        accessible: true,
        metadata: { source_object_id: obj.id, auto_generated: true },
      });
      nodeObjectMap.push([]);
    }
  }

  // Phase 2: Generate edges
  const edges: GeneratedEdge[] = [];
  const maxConnectDistance = scalePxPerM * 15; // max 15 meters between connected nodes

  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const d = dist(nodes[i], nodes[j]);
      if (d > maxConnectDistance || d < 1) continue;

      // Connect nodes that share an object, or are close enough
      const shareObject = nodeObjectMap[i].some((idx) => nodeObjectMap[j].includes(idx));

      // For nodes in different objects, check if they're close enough (within 3m)
      const closeEnough = d < scalePxPerM * 3;

      // Also connect if one node is in a walkable area that contains the other point
      let containsOther = false;
      for (const objIdx of nodeObjectMap[i]) {
        if (isPointInObject(nodes[j], walkableObjects[objIdx])) {
          containsOther = true;
          break;
        }
      }
      if (!containsOther) {
        for (const objIdx of nodeObjectMap[j]) {
          if (isPointInObject(nodes[i], walkableObjects[objIdx])) {
            containsOther = true;
            break;
          }
        }
      }

      if (shareObject || closeEnough || containsOther) {
        edges.push({
          fromIndex: i,
          toIndex: j,
          distance_m: d / scalePxPerM,
          accessible: nodes[i].accessible && nodes[j].accessible,
        });
      }
    }
  }

  return { nodes, edges };
}
