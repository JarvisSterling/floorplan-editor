import type { NavNode } from '@/types/database';

export interface DirectionStep {
  instruction: string;
  distance_m: number;
  from_node: NavNode;
  to_node: NavNode;
  direction: 'straight' | 'left' | 'right' | 'slight-left' | 'slight-right' | 'u-turn' | 'arrive' | 'depart';
}

/**
 * Calculate the angle between two points (in degrees, 0 = right, 90 = down).
 */
function angleBetween(from: { x: number; y: number }, to: { x: number; y: number }): number {
  return Math.atan2(to.y - from.y, to.x - from.x) * (180 / Math.PI);
}

/**
 * Normalize angle to [-180, 180].
 */
function normalizeAngle(angle: number): number {
  while (angle > 180) angle -= 360;
  while (angle < -180) angle += 360;
  return angle;
}

/**
 * Determine turn direction from angle change.
 */
function getTurnDirection(angleDiff: number): DirectionStep['direction'] {
  const abs = Math.abs(angleDiff);
  if (abs < 20) return 'straight';
  if (abs > 160) return 'u-turn';
  if (angleDiff > 0 && angleDiff <= 60) return 'slight-right';
  if (angleDiff > 60) return 'right';
  if (angleDiff < 0 && angleDiff >= -60) return 'slight-left';
  return 'left';
}

/**
 * Get human-readable node description.
 */
function describeNode(node: NavNode): string {
  const meta = node.metadata as Record<string, unknown>;
  if (meta?.label && typeof meta.label === 'string') return meta.label;

  switch (node.type) {
    case 'entrance': return 'the entrance';
    case 'exit': return 'the exit';
    case 'elevator': return 'the elevator';
    case 'stairs': return 'the stairs';
    default: return 'the waypoint';
  }
}

/**
 * Format distance for display.
 */
function formatDistance(meters: number): string {
  if (meters < 1) return 'a few steps';
  if (meters < 10) return `${Math.round(meters)} meters`;
  return `about ${Math.round(meters / 5) * 5} meters`;
}

/**
 * Direction instruction text based on turn type.
 */
function turnInstruction(dir: DirectionStep['direction']): string {
  switch (dir) {
    case 'straight': return 'Continue straight';
    case 'left': return 'Turn left';
    case 'right': return 'Turn right';
    case 'slight-left': return 'Bear slightly left';
    case 'slight-right': return 'Bear slightly right';
    case 'u-turn': return 'Make a U-turn';
    case 'depart': return 'Start';
    case 'arrive': return 'Arrive at';
    default: return 'Continue';
  }
}

/**
 * Generate turn-by-turn text directions from a path of nav nodes.
 * @param pathNodes Ordered list of nodes in the route
 * @param scalePxPerM Pixels per meter for distance calculation
 */
export function generateDirections(
  pathNodes: NavNode[],
  scalePxPerM: number = 50
): DirectionStep[] {
  if (pathNodes.length < 2) return [];

  const steps: DirectionStep[] = [];

  // First step: depart
  const distFirst = Math.sqrt(
    (pathNodes[1].x - pathNodes[0].x) ** 2 + (pathNodes[1].y - pathNodes[0].y) ** 2
  ) / scalePxPerM;

  steps.push({
    instruction: `Start at ${describeNode(pathNodes[0])} and head toward ${describeNode(pathNodes[1])} for ${formatDistance(distFirst)}`,
    distance_m: distFirst,
    from_node: pathNodes[0],
    to_node: pathNodes[1],
    direction: 'depart',
  });

  // Middle steps
  for (let i = 1; i < pathNodes.length - 1; i++) {
    const prev = pathNodes[i - 1];
    const curr = pathNodes[i];
    const next = pathNodes[i + 1];

    const inAngle = angleBetween(prev, curr);
    const outAngle = angleBetween(curr, next);
    const angleDiff = normalizeAngle(outAngle - inAngle);
    const dir = getTurnDirection(angleDiff);

    const dist = Math.sqrt(
      (next.x - curr.x) ** 2 + (next.y - curr.y) ** 2
    ) / scalePxPerM;

    // Skip "straight" for short segments to reduce noise
    if (dir === 'straight' && dist < 2) continue;

    let instruction: string;
    if (curr.type !== 'waypoint') {
      instruction = `At ${describeNode(curr)}, ${turnInstruction(dir).toLowerCase()} and continue for ${formatDistance(dist)}`;
    } else {
      instruction = `${turnInstruction(dir)} and continue for ${formatDistance(dist)}`;
    }

    steps.push({
      instruction,
      distance_m: dist,
      from_node: curr,
      to_node: next,
      direction: dir,
    });
  }

  // Final step: arrive
  const last = pathNodes[pathNodes.length - 1];
  steps.push({
    instruction: `Arrive at ${describeNode(last)}`,
    distance_m: 0,
    from_node: pathNodes[pathNodes.length - 2],
    to_node: last,
    direction: 'arrive',
  });

  return steps;
}

/**
 * Get total distance of a directions list.
 */
export function totalDistance(steps: DirectionStep[]): number {
  return steps.reduce((sum, s) => sum + s.distance_m, 0);
}

/**
 * Estimate walking time in seconds (avg 1.2 m/s).
 */
export function estimateWalkingTime(distanceM: number): number {
  return Math.ceil(distanceM / 1.2);
}

/**
 * Format seconds as "X min Y sec".
 */
export function formatWalkingTime(seconds: number): string {
  if (seconds < 60) return `${seconds} seconds`;
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  return sec > 0 ? `${min} min ${sec} sec` : `${min} min`;
}
