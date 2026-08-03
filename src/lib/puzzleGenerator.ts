export type PuzzleDifficulty = "easy" | "medium" | "hard";

export interface PieceTabEdges {
  top: number; // 0 = flat, 1 = tab out, -1 = blank in
  right: number;
  bottom: number;
  left: number;
}

export interface PuzzlePieceDefinition {
  id: number;
  row: number;
  col: number;
  edges: PieceTabEdges;
  /** SVG path in LOCAL space: piece top-left = (0, 0), bottom-right = (pieceW, pieceH) */
  svgPath: string;
}

export const PUZZLE_GRID_CONFIG: Record<
  PuzzleDifficulty,
  { rows: number; cols: number; totalPieces: number; label: string }
> = {
  easy: { rows: 4, cols: 4, totalPieces: 16, label: "Fácil" },
  medium: { rows: 5, cols: 4, totalPieces: 20, label: "Médio" },
  hard: { rows: 5, cols: 5, totalPieces: 25, label: "Difícil" },
};

/**
 * Generates a jigsaw edge path segment from (x1,y1) to (x2,y2).
 * tabType: 0 = straight, 1 = tab protrudes, -1 = blank indents.
 * The "knob" protrudes to the RIGHT of the direction of travel.
 */
function jigsawEdge(
  x1: number, y1: number,
  x2: number, y2: number,
  tabType: number,
): string {
  if (tabType === 0) return `L ${r(x2)} ${r(y2)}`;

  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy);
  // Perpendicular unit vector (right of travel direction × tabType sign)
  const nx = (-dy / len) * tabType;
  const ny = (dx / len) * tabType;

  // Knob shape: neck narrows, circular head protrudes
  const t1 = 0.30, t2 = 0.70;   // where the neck starts/ends along the edge
  const neckProtrude = 0.08;     // how far neck narrows/widens outward
  const headProtrude = 0.28;     // how far the circular dome protrudes
  const headCenter = 0.50;       // midpoint of the knob along the edge

  const n1x = x1 + dx * t1;
  const n1y = y1 + dy * t1;
  const n2x = x1 + dx * t2;
  const n2y = y1 + dy * t2;
  const hx = x1 + dx * headCenter + nx * len * headProtrude;
  const hy = y1 + dy * headCenter + ny * len * headProtrude;

  const cp1x = n1x + nx * len * neckProtrude;
  const cp1y = n1y + ny * len * neckProtrude;
  const cp2x = n2x + nx * len * neckProtrude;
  const cp2y = n2y + ny * len * neckProtrude;

  // Approach to knob, dome arc, exit from knob
  return (
    `L ${r(n1x)} ${r(n1y)} ` +
    `Q ${r(cp1x)} ${r(cp1y)} ${r(hx - dx * 0.14)} ${r(hy - dy * 0.14)} ` +
    `Q ${r(hx)} ${r(hy)} ${r(hx + dx * 0.14)} ${r(hy + dy * 0.14)} ` +
    `Q ${r(cp2x)} ${r(cp2y)} ${r(n2x)} ${r(n2y)} ` +
    `L ${r(x2)} ${r(y2)}`
  );
}

function r(n: number) { return Math.round(n * 100) / 100; }

/**
 * Builds the SVG path for a piece in LOCAL space (top-left = 0,0).
 * Tab knobs protrude *outside* the bounding box, so the visible element
 * should have overflow: visible.
 */
export function buildPiecePath(
  w: number,
  h: number,
  edges: PieceTabEdges,
): string {
  let d = `M 0 0 `;
  d += jigsawEdge(0, 0, w, 0, edges.top) + " ";   // top: L→R, tab protrudes upward (left of travel = up)
  d += jigsawEdge(w, 0, w, h, edges.right) + " "; // right: T→B, tab protrudes right
  d += jigsawEdge(w, h, 0, h, edges.bottom) + " "; // bottom: R→L, tab protrudes downward
  d += jigsawEdge(0, h, 0, 0, edges.left) + " Z"; // left: B→T, tab protrudes left
  return d;
}

/**
 * Generates all piece definitions for an R×C jigsaw grid.
 * svgPath is always in LOCAL space (0,0 origin).
 */
export function generateGridPieceDefinitions(
  rows: number,
  cols: number,
  pieceWidth: number,
  pieceHeight: number,
  seed = 42,
): PuzzlePieceDefinition[] {
  let rngState = seed;
  const rng = () => {
    rngState = (rngState * 9301 + 49297) % 233280;
    return rngState / 233280;
  };

  // hEdges[r][c]: tab direction for BOTTOM edge of piece (r,c) = TOP edge of piece (r+1,c)
  const hEdges: number[][] = Array.from({ length: rows - 1 }, () =>
    Array.from({ length: cols }, () => (rng() < 0.5 ? 1 : -1)),
  );

  // vEdges[r][c]: tab direction for RIGHT edge of piece (r,c) = LEFT edge of piece (r,c+1)
  const vEdges: number[][] = Array.from({ length: rows }, () =>
    Array.from({ length: cols - 1 }, () => (rng() < 0.5 ? 1 : -1)),
  );

  const pieces: PuzzlePieceDefinition[] = [];

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const id = row * cols + col;

      const top = row === 0 ? 0 : -hEdges[row - 1][col];        // complement of piece above's bottom
      const right = col === cols - 1 ? 0 : vEdges[row][col];
      const bottom = row === rows - 1 ? 0 : hEdges[row][col];
      const left = col === 0 ? 0 : -vEdges[row][col - 1];       // complement of piece left's right

      const edges: PieceTabEdges = { top, right, bottom, left };
      const svgPath = buildPiecePath(pieceWidth, pieceHeight, edges);

      pieces.push({ id, row, col, edges, svgPath });
    }
  }

  return pieces;
}
