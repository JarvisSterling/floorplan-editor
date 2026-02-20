/**
 * BLE trilateration engine.
 * Given RSSI readings from multiple anchors, estimates position via weighted centroid.
 */

interface AnchorReading {
  anchor_id: string;
  x: number;
  y: number;
  rssi: number; // signal strength in dBm (negative)
  tx_power?: number; // reference RSSI at 1 meter (default: -59)
  path_loss_exponent?: number; // environment factor (default: 2.0 for open space)
}

interface PositionEstimate {
  x: number;
  y: number;
  accuracy_m: number;
  method: 'trilateration' | 'weighted_centroid' | 'single_anchor';
}

/**
 * Estimate distance from RSSI using log-distance path loss model.
 * distance = 10 ^ ((txPower - rssi) / (10 * n))
 */
function rssiToDistance(rssi: number, txPower: number = -59, pathLossExponent: number = 2.0): number {
  if (rssi >= 0) return 0.1;
  const ratio = (txPower - rssi) / (10 * pathLossExponent);
  return Math.pow(10, ratio);
}

/**
 * Weighted centroid positioning.
 * Weights are inversely proportional to estimated distance.
 */
function weightedCentroid(readings: AnchorReading[]): PositionEstimate {
  let totalWeight = 0;
  let wx = 0;
  let wy = 0;
  const distances: number[] = [];

  for (const r of readings) {
    const dist = rssiToDistance(r.rssi, r.tx_power, r.path_loss_exponent);
    distances.push(dist);
    const weight = 1 / Math.max(dist, 0.1); // avoid division by zero
    wx += r.x * weight;
    wy += r.y * weight;
    totalWeight += weight;
  }

  if (totalWeight === 0) {
    return { x: readings[0].x, y: readings[0].y, accuracy_m: 50, method: 'single_anchor' };
  }

  const avgDist = distances.reduce((a, b) => a + b, 0) / distances.length;

  return {
    x: wx / totalWeight,
    y: wy / totalWeight,
    accuracy_m: Math.min(avgDist * 0.5, 20), // rough accuracy estimate
    method: readings.length >= 3 ? 'trilateration' : 'weighted_centroid',
  };
}

/**
 * True trilateration using least-squares for 3+ anchors.
 * Falls back to weighted centroid if under-determined.
 */
function trilaterate(readings: AnchorReading[]): PositionEstimate {
  if (readings.length < 3) return weightedCentroid(readings);

  // Estimate distances
  const anchors = readings.map((r) => ({
    x: r.x,
    y: r.y,
    d: rssiToDistance(r.rssi, r.tx_power, r.path_loss_exponent),
  }));

  // Linearize using first anchor as reference
  // (x-x1)^2 + (y-y1)^2 = d1^2
  // Subtract from each subsequent: 2*(xi-x1)*x + 2*(yi-y1)*y = di^2 - d1^2 - xi^2 + x1^2 - yi^2 + y1^2
  const ref = anchors[0];
  const A: number[][] = [];
  const b: number[] = [];

  for (let i = 1; i < anchors.length; i++) {
    const ai = anchors[i];
    A.push([2 * (ai.x - ref.x), 2 * (ai.y - ref.y)]);
    b.push(
      ref.d * ref.d - ai.d * ai.d -
      ref.x * ref.x + ai.x * ai.x -
      ref.y * ref.y + ai.y * ai.y
    );
  }

  // Solve via least squares: (A^T A)^-1 A^T b
  const ATA = [
    [0, 0],
    [0, 0],
  ];
  const ATb = [0, 0];

  for (let i = 0; i < A.length; i++) {
    ATA[0][0] += A[i][0] * A[i][0];
    ATA[0][1] += A[i][0] * A[i][1];
    ATA[1][0] += A[i][1] * A[i][0];
    ATA[1][1] += A[i][1] * A[i][1];
    ATb[0] += A[i][0] * b[i];
    ATb[1] += A[i][1] * b[i];
  }

  const det = ATA[0][0] * ATA[1][1] - ATA[0][1] * ATA[1][0];
  if (Math.abs(det) < 1e-10) {
    // Degenerate — fall back to weighted centroid
    return weightedCentroid(readings);
  }

  const x = (ATA[1][1] * ATb[0] - ATA[0][1] * ATb[1]) / det;
  const y = (ATA[0][0] * ATb[1] - ATA[1][0] * ATb[0]) / det;

  // Compute residual for accuracy estimate
  let residual = 0;
  for (const a of anchors) {
    const estDist = Math.sqrt((x - a.x) ** 2 + (y - a.y) ** 2);
    residual += (estDist - a.d) ** 2;
  }
  const accuracy = Math.sqrt(residual / anchors.length);

  return {
    x,
    y,
    accuracy_m: Math.min(accuracy, 20),
    method: 'trilateration',
  };
}

/**
 * Estimate position from anchor readings.
 */
export function estimatePosition(readings: AnchorReading[]): PositionEstimate | null {
  if (readings.length === 0) return null;

  if (readings.length === 1) {
    return {
      x: readings[0].x,
      y: readings[0].y,
      accuracy_m: rssiToDistance(readings[0].rssi, readings[0].tx_power, readings[0].path_loss_exponent),
      method: 'single_anchor',
    };
  }

  return trilaterate(readings);
}

export type { AnchorReading, PositionEstimate };
