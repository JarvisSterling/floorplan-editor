/**
 * Compound shape generators for L, T, U shapes.
 * Returns polygon points for Konva rendering.
 */

interface ShapeParams {
  x: number;
  y: number;
  width: number;
  height: number;
  thickness: number; // wall/arm thickness
}

/**
 * Generate L-shape polygon points.
 */
export function generateLShape({ x, y, width, height, thickness }: ShapeParams): Array<{ x: number; y: number }> {
  return [
    { x, y },
    { x: x + thickness, y },
    { x: x + thickness, y: y + height - thickness },
    { x: x + width, y: y + height - thickness },
    { x: x + width, y: y + height },
    { x, y: y + height },
  ];
}

/**
 * Generate T-shape polygon points.
 */
export function generateTShape({ x, y, width, height, thickness }: ShapeParams): Array<{ x: number; y: number }> {
  const stemLeft = x + (width - thickness) / 2;
  const stemRight = stemLeft + thickness;
  return [
    { x, y },
    { x: x + width, y },
    { x: x + width, y: y + thickness },
    { x: stemRight, y: y + thickness },
    { x: stemRight, y: y + height },
    { x: stemLeft, y: y + height },
    { x: stemLeft, y: y + thickness },
    { x, y: y + thickness },
  ];
}

/**
 * Generate U-shape polygon points.
 */
export function generateUShape({ x, y, width, height, thickness }: ShapeParams): Array<{ x: number; y: number }> {
  return [
    { x, y },
    { x: x + thickness, y },
    { x: x + thickness, y: y + height - thickness },
    { x: x + width - thickness, y: y + height - thickness },
    { x: x + width - thickness, y },
    { x: x + width, y },
    { x: x + width, y: y + height },
    { x, y: y + height },
  ];
}

export type CompoundShapeType = 'L' | 'T' | 'U';

export function generateCompoundShape(
  type: CompoundShapeType,
  params: ShapeParams
): Array<{ x: number; y: number }> {
  switch (type) {
    case 'L': return generateLShape(params);
    case 'T': return generateTShape(params);
    case 'U': return generateUShape(params);
  }
}
