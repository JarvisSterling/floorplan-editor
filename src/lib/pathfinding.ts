import type { NavNode, NavEdge } from '@/types/database';
import { PX_PER_METER } from './constants';

interface PathResult {
  path: string[];       // ordered node IDs
  distance: number;     // total distance in meters
  nodes: NavNode[];     // ordered nodes
}

/**
 * A* pathfinding on a navigation graph.
 */
export function findPath(
  nodes: NavNode[],
  edges: NavEdge[],
  startId: string,
  endId: string,
  options?: {
    accessibleOnly?: boolean;
  }
): PathResult | null {
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const startNode = nodeMap.get(startId);
  const endNode = nodeMap.get(endId);
  if (!startNode || !endNode) return null;

  // Build adjacency list
  const adjacency = new Map<string, Array<{ neighborId: string; cost: number; edgeId: string }>>();
  for (const node of nodes) {
    adjacency.set(node.id, []);
  }

  for (const edge of edges) {
    if (options?.accessibleOnly && !edge.accessible) continue;

    const fromNode = nodeMap.get(edge.from_node_id);
    const toNode = nodeMap.get(edge.to_node_id);
    if (!fromNode || !toNode) continue;
    if (options?.accessibleOnly && (!fromNode.accessible || !toNode.accessible)) continue;

    const cost = edge.distance_m * edge.weight_modifier;

    adjacency.get(edge.from_node_id)?.push({
      neighborId: edge.to_node_id,
      cost,
      edgeId: edge.id,
    });

    if (edge.bidirectional) {
      adjacency.get(edge.to_node_id)?.push({
        neighborId: edge.from_node_id,
        cost,
        edgeId: edge.id,
      });
    }
  }

  // Heuristic: Euclidean distance (in meters, using px coords / assumed scale)
  const endX = endNode.x;
  const endY = endNode.y;
  function heuristic(nodeId: string): number {
    const n = nodeMap.get(nodeId);
    if (!n) return Infinity;
    const dx = n.x - endX;
    const dy = n.y - endY;
    return Math.sqrt(dx * dx + dy * dy) / PX_PER_METER;
  }

  // A* with binary-ish priority queue (simple sorted array for moderate graph sizes)
  const openSet = new Set<string>([startId]);
  const cameFrom = new Map<string, string>();
  const gScore = new Map<string, number>();
  const fScore = new Map<string, number>();

  gScore.set(startId, 0);
  fScore.set(startId, heuristic(startId));

  while (openSet.size > 0) {
    // Get node with lowest fScore
    let current = '';
    let currentF = Infinity;
    for (const id of openSet) {
      const f = fScore.get(id) ?? Infinity;
      if (f < currentF) {
        currentF = f;
        current = id;
      }
    }

    if (current === endId) {
      // Reconstruct path
      const path: string[] = [current];
      let node = current;
      while (cameFrom.has(node)) {
        node = cameFrom.get(node)!;
        path.unshift(node);
      }

      const totalDist = gScore.get(endId) ?? 0;
      return {
        path,
        distance: totalDist,
        nodes: path.map((id) => nodeMap.get(id)!).filter(Boolean),
      };
    }

    openSet.delete(current);
    const neighbors = adjacency.get(current) || [];

    for (const { neighborId, cost } of neighbors) {
      const tentativeG = (gScore.get(current) ?? Infinity) + cost;
      if (tentativeG < (gScore.get(neighborId) ?? Infinity)) {
        cameFrom.set(neighborId, current);
        gScore.set(neighborId, tentativeG);
        fScore.set(neighborId, tentativeG + heuristic(neighborId));
        openSet.add(neighborId);
      }
    }
  }

  return null; // No path found
}

/**
 * Find the nearest node of a given type to a position.
 */
export function findNearestNode(
  nodes: NavNode[],
  x: number,
  y: number,
  type?: NavNode['type']
): NavNode | null {
  let nearest: NavNode | null = null;
  let nearestDist = Infinity;

  for (const node of nodes) {
    if (type && node.type !== type) continue;
    const dx = node.x - x;
    const dy = node.y - y;
    const d = dx * dx + dy * dy;
    if (d < nearestDist) {
      nearestDist = d;
      nearest = node;
    }
  }

  return nearest;
}
