import type { NavNode, NavEdge } from '@/types/database';
import { findPath } from './pathfinding';

interface OptimizedRoute {
  ordered_node_ids: string[];
  total_distance_m: number;
  segments: Array<{
    from_id: string;
    to_id: string;
    path: string[];
    distance_m: number;
  }>;
}

/**
 * Nearest-neighbor TSP heuristic for multi-stop route optimization.
 * Given a start node and a set of stops, finds a near-optimal order.
 *
 * @param nodes All nav nodes
 * @param edges All nav edges
 * @param startId Starting node ID
 * @param stopIds Node IDs to visit (unordered)
 * @param options Pathfinding options
 * @returns Optimized route or null if any segment is unreachable
 */
export function optimizeMultiStopRoute(
  nodes: NavNode[],
  edges: NavEdge[],
  startId: string,
  stopIds: string[],
  options?: { accessibleOnly?: boolean }
): OptimizedRoute | null {
  if (stopIds.length === 0) return { ordered_node_ids: [startId], total_distance_m: 0, segments: [] };

  // Precompute shortest paths between all pairs (start + stops)
  const allIds = [startId, ...stopIds];
  const distMatrix = new Map<string, Map<string, number>>();
  const pathMatrix = new Map<string, Map<string, string[]>>();

  for (const fromId of allIds) {
    distMatrix.set(fromId, new Map());
    pathMatrix.set(fromId, new Map());
    for (const toId of allIds) {
      if (fromId === toId) {
        distMatrix.get(fromId)!.set(toId, 0);
        pathMatrix.get(fromId)!.set(toId, [fromId]);
        continue;
      }
      const result = findPath(nodes, edges, fromId, toId, options);
      if (result) {
        distMatrix.get(fromId)!.set(toId, result.distance);
        pathMatrix.get(fromId)!.set(toId, result.path);
      } else {
        distMatrix.get(fromId)!.set(toId, Infinity);
      }
    }
  }

  // Nearest-neighbor heuristic
  const unvisited = new Set(stopIds);
  const ordered: string[] = [startId];
  let currentId = startId;
  let totalDist = 0;

  while (unvisited.size > 0) {
    let nearest = '';
    let nearestDist = Infinity;

    for (const candidateId of unvisited) {
      const d = distMatrix.get(currentId)?.get(candidateId) ?? Infinity;
      if (d < nearestDist) {
        nearestDist = d;
        nearest = candidateId;
      }
    }

    if (nearestDist === Infinity) return null; // unreachable stop

    ordered.push(nearest);
    totalDist += nearestDist;
    unvisited.delete(nearest);
    currentId = nearest;
  }

  // Build segments
  const segments: OptimizedRoute['segments'] = [];
  for (let i = 0; i < ordered.length - 1; i++) {
    const fromId = ordered[i];
    const toId = ordered[i + 1];
    segments.push({
      from_id: fromId,
      to_id: toId,
      path: pathMatrix.get(fromId)?.get(toId) || [],
      distance_m: distMatrix.get(fromId)?.get(toId) || 0,
    });
  }

  return {
    ordered_node_ids: ordered,
    total_distance_m: totalDist,
    segments,
  };
}

/**
 * 2-opt improvement on a nearest-neighbor solution.
 * Tries swapping segments to find shorter routes.
 */
export function twoOptImprove(
  nodes: NavNode[],
  edges: NavEdge[],
  route: OptimizedRoute,
  options?: { accessibleOnly?: boolean }
): OptimizedRoute {
  const ids = [...route.ordered_node_ids];
  if (ids.length <= 3) return route;

  // Only improve the stop order (keep start fixed)
  let improved = true;
  let bestDist = route.total_distance_m;

  while (improved) {
    improved = false;
    for (let i = 1; i < ids.length - 1; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        // Try reversing the segment between i and j
        const newIds = [...ids];
        const segment = newIds.slice(i, j + 1).reverse();
        newIds.splice(i, j - i + 1, ...segment);

        // Calculate new total distance
        let newDist = 0;
        let valid = true;
        for (let k = 0; k < newIds.length - 1; k++) {
          const result = findPath(nodes, edges, newIds[k], newIds[k + 1], options);
          if (!result) { valid = false; break; }
          newDist += result.distance;
        }

        if (valid && newDist < bestDist) {
          ids.splice(0, ids.length, ...newIds);
          bestDist = newDist;
          improved = true;
        }
      }
    }
  }

  // Rebuild segments
  const segments: OptimizedRoute['segments'] = [];
  for (let i = 0; i < ids.length - 1; i++) {
    const result = findPath(nodes, edges, ids[i], ids[i + 1], options);
    segments.push({
      from_id: ids[i],
      to_id: ids[i + 1],
      path: result?.path || [],
      distance_m: result?.distance || 0,
    });
  }

  return {
    ordered_node_ids: ids,
    total_distance_m: bestDist,
    segments,
  };
}
