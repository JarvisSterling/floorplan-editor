import type { NavNode, NavEdge } from '@/types/database';
import { findPath } from './pathfinding';
import { generateDirections, type DirectionStep } from './directions';

interface FloorSegment {
  floor_plan_id: string;
  path: string[];
  nodes: NavNode[];
  distance_m: number;
  directions: DirectionStep[];
}

interface CrossFloorRoute {
  segments: FloorSegment[];
  total_distance_m: number;
  floor_transitions: Array<{
    from_floor_id: string;
    to_floor_id: string;
    via_node_type: NavNode['type'];
    from_node_id: string;
    to_node_id: string;
  }>;
}

/**
 * Find a route that may span multiple floors.
 * Uses linked_floor_node_id on elevator/stairs nodes to cross floors.
 *
 * @param allNodes All nav nodes across all floors
 * @param allEdges All nav edges across all floors
 * @param startNodeId Starting node
 * @param endNodeId Destination node
 * @param options Routing options
 */
export function findCrossFloorRoute(
  allNodes: NavNode[],
  allEdges: NavEdge[],
  startNodeId: string,
  endNodeId: string,
  options?: { accessibleOnly?: boolean; scalePxPerM?: number }
): CrossFloorRoute | null {
  const nodeMap = new Map(allNodes.map((n) => [n.id, n]));
  const startNode = nodeMap.get(startNodeId);
  const endNode = nodeMap.get(endNodeId);
  if (!startNode || !endNode) return null;

  const scale = options?.scalePxPerM ?? 50;

  // Same floor — simple case
  if (startNode.floor_plan_id === endNode.floor_plan_id) {
    const floorNodes = allNodes.filter((n) => n.floor_plan_id === startNode.floor_plan_id);
    const floorNodeIds = new Set(floorNodes.map((n) => n.id));
    const floorEdges = allEdges.filter(
      (e) => floorNodeIds.has(e.from_node_id) && floorNodeIds.has(e.to_node_id)
    );

    const result = findPath(floorNodes, floorEdges, startNodeId, endNodeId, options);
    if (!result) return null;

    return {
      segments: [{
        floor_plan_id: startNode.floor_plan_id,
        path: result.path,
        nodes: result.nodes,
        distance_m: result.distance,
        directions: generateDirections(result.nodes, scale),
      }],
      total_distance_m: result.distance,
      floor_transitions: [],
    };
  }

  // Cross-floor: BFS over floor transitions
  // Build a floor-level graph using linked nodes
  const linkedPairs = allNodes.filter(
    (n) => n.linked_floor_node_id && (n.type === 'elevator' || n.type === 'stairs')
  );

  if (options?.accessibleOnly) {
    // Only use elevators for accessible routing
    const accessibleLinks = linkedPairs.filter((n) => n.type === 'elevator' && n.accessible);
    return findCrossFloorBFS(allNodes, allEdges, startNodeId, endNodeId, accessibleLinks, nodeMap, options, scale);
  }

  return findCrossFloorBFS(allNodes, allEdges, startNodeId, endNodeId, linkedPairs, nodeMap, options, scale);
}

function findCrossFloorBFS(
  allNodes: NavNode[],
  allEdges: NavEdge[],
  startNodeId: string,
  endNodeId: string,
  linkedNodes: NavNode[],
  nodeMap: Map<string, NavNode>,
  options: { accessibleOnly?: boolean } | undefined,
  scale: number
): CrossFloorRoute | null {
  const startNode = nodeMap.get(startNodeId)!;
  const endNode = nodeMap.get(endNodeId)!;

  // Group nodes/edges by floor
  const floorNodes = new Map<string, NavNode[]>();
  const floorEdges = new Map<string, NavEdge[]>();
  for (const n of allNodes) {
    if (!floorNodes.has(n.floor_plan_id)) floorNodes.set(n.floor_plan_id, []);
    floorNodes.get(n.floor_plan_id)!.push(n);
  }
  for (const e of allEdges) {
    const fromNode = nodeMap.get(e.from_node_id);
    if (!fromNode) continue;
    const fid = fromNode.floor_plan_id;
    if (!floorEdges.has(fid)) floorEdges.set(fid, []);
    floorEdges.get(fid)!.push(e);
  }

  // Dijkstra-style search: prioritize by total distance for shortest path
  interface SearchState {
    nodeId: string;
    floorId: string;
    segments: FloorSegment[];
    transitions: CrossFloorRoute['floor_transitions'];
    totalDist: number;
  }

  const queue: SearchState[] = [{
    nodeId: startNodeId,
    floorId: startNode.floor_plan_id,
    segments: [],
    transitions: [],
    totalDist: 0,
  }];

  const bestDist = new Map<string, number>(); // nodeId → best distance seen
  bestDist.set(startNodeId, 0);

  let bestRoute: CrossFloorRoute | null = null;

  while (queue.length > 0) {
    // Pick state with smallest totalDist (priority queue via sort — adequate for small floor counts)
    queue.sort((a, b) => a.totalDist - b.totalDist);
    const state = queue.shift()!;

    // Prune if we already found a better complete route
    if (bestRoute && state.totalDist >= bestRoute.total_distance_m) continue;

    // If we're on the destination floor, try to path to the end
    if (state.floorId === endNode.floor_plan_id) {
      const fNodes = floorNodes.get(state.floorId) || [];
      const fEdges = floorEdges.get(state.floorId) || [];
      const result = findPath(fNodes, fEdges, state.nodeId, endNodeId, options);

      if (result) {
        const candidateDist = state.totalDist + result.distance;
        if (!bestRoute || candidateDist < bestRoute.total_distance_m) {
          bestRoute = {
            segments: [
              ...state.segments,
              {
                floor_plan_id: state.floorId,
                path: result.path,
                nodes: result.nodes,
                distance_m: result.distance,
                directions: generateDirections(result.nodes, scale),
              },
            ],
            total_distance_m: candidateDist,
            floor_transitions: state.transitions,
          };
        }
      }
      continue; // Don't explore further from destination floor
    }

    // Try each linked node on this floor
    for (const linkNode of linkedNodes) {
      if (linkNode.floor_plan_id !== state.floorId) continue;
      if (!linkNode.linked_floor_node_id) continue;

      const targetNode = nodeMap.get(linkNode.linked_floor_node_id);
      if (!targetNode) continue;

      // Path from current position to this link node
      const fNodes = floorNodes.get(state.floorId) || [];
      const fEdges = floorEdges.get(state.floorId) || [];
      const pathToLink = findPath(fNodes, fEdges, state.nodeId, linkNode.id, options);

      if (!pathToLink) continue;

      const newDist = state.totalDist + pathToLink.distance;

      // Only explore if this is a better path to this node
      const prevBest = bestDist.get(targetNode.id) ?? Infinity;
      if (newDist >= prevBest) continue;
      bestDist.set(targetNode.id, newDist);

      queue.push({
        nodeId: targetNode.id,
        floorId: targetNode.floor_plan_id,
        segments: [
          ...state.segments,
          {
            floor_plan_id: state.floorId,
            path: pathToLink.path,
            nodes: pathToLink.nodes,
            distance_m: pathToLink.distance,
            directions: generateDirections(pathToLink.nodes, scale),
          },
        ],
        transitions: [
          ...state.transitions,
          {
            from_floor_id: state.floorId,
            to_floor_id: targetNode.floor_plan_id,
            via_node_type: linkNode.type,
            from_node_id: linkNode.id,
            to_node_id: targetNode.id,
          },
        ],
        totalDist: newDist,
      });
    }
  }

  return bestRoute; // null if no cross-floor path found
}
