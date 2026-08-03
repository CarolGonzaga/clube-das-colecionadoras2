export type PuzzleDifficulty = "easy" | "medium" | "hard";

export interface PieceTabEdges {
  top: number; // 0 = flat, 1 = tab out, -1 = blank in
  right: number;
  bottom: number;
  left: number;
}

export interface PuzzlePieceDefinition {
  id: number; // 0-based piece index
  row: number;
  col: number;
  correctRow: number;
  correctCol: number;
  edges: PieceTabEdges;
  svgPath: string;
}

export const PUZZLE_GRID_CONFIG: Record<
  PuzzleDifficulty,
  { rows: number; cols: number; totalPieces: number; label: string }
> = {
  easy: { rows: 3, cols: 4, totalPieces: 12, label: "Fácil" },
  medium: { rows: 4, cols: 4, totalPieces: 16, label: "Médio" },
  hard: { rows: 5, cols: 5, totalPieces: 25, label: "Difícil" },
};

/**
  Generates a classical jigsaw piece edge path (with tab/blank knob)
  between (x1, y1) and (x2, y2).
  If tabType === 0, it is a straight line.
  If tabType === 1 or -1, it draws a smooth Bézier knob out or in.
 */
export function generateJigsawEdgePath(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  tabType: number,
): string {
  if (tabType === 0) return `L ${x2} ${y2}`;

  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy);
  const ux = dx / len;
  const uy = dy / len;
  // Perpendicular vector for tab protrusion (positive = right/out)
  const px = -uy * tabType;
  const py = ux * tabType;

  // Key relative points along the edge (0 to 1)
  const p1x = x1 + dx * 0.35;
  const p1y = y1 + dy * 0.35;

  const neck1x = p1x + px * len * 0.08;
  const neck1y = p1y + py * len * 0.08;

  const head1x = x1 + dx * 0.38 + px * len * 0.22;
  const head1y = y1 + dy * 0.38 + py * len * 0.22;

  const apex1x = x1 + dx * 0.46 + px * len * 0.24;
  const apex1y = y1 + dy * 0.46 + py * len * 0.24;

  const apex2x = x1 + dx * 0.54 + px * len * 0.24;
  const apex2y = y1 + dy * 0.54 + py * len * 0.24;

  const head2x = x1 + dx * 0.62 + px * len * 0.22;
  const head2y = y1 + dy * 0.62 + py * len * 0.22;

  const p2x = x1 + dx * 0.65;
  const p2y = y1 + dy * 0.65;

  const neck2x = p2x + px * len * 0.08;
  const neck2y = p2y + py * len * 0.08;

  return (
    `L ${p1x} ${p1y} ` +
    `C ${neck1x} ${neck1y}, ${head1x} ${head1y}, ${apex1x} ${apex1y} ` +
    `C ${apex1x + dx * 0.04} ${apex1y + dy * 0.04}, ${apex2x - dx * 0.04} ${apex2y - dy * 0.04}, ${apex2x} ${apex2y} ` +
    `C ${head2x} ${head2y}, ${neck2x} ${neck2y}, ${p2x} ${p2y} ` +
    `L ${x2} ${y2}`
  );
}

/**
 * Generates the full piece SVG Path string for a piece at (row, col)
 * within a grid of size pieceWidth x pieceHeight.
 */
export function generatePieceSvgPath(
  pieceWidth: number,
  pieceHeight: number,
  edges: PieceTabEdges,
): string {
  return generatePieceSvgPathOffset(0, 0, pieceWidth, pieceHeight, edges);
}

export function generatePieceSvgPathOffset(
  offsetX: number,
  offsetY: number,
  pieceWidth: number,
  pieceHeight: number,
  edges: PieceTabEdges,
): string {
  const x1 = offsetX;
  const y1 = offsetY;
  const x2 = offsetX + pieceWidth;
  const y2 = offsetY + pieceHeight;

  let path = `M ${x1} ${y1} `;
  path += generateJigsawEdgePath(x1, y1, x2, y1, edges.top) + " ";
  path += generateJigsawEdgePath(x2, y1, x2, y2, edges.right) + " ";
  path += generateJigsawEdgePath(x2, y2, x1, y2, edges.bottom) + " ";
  path += generateJigsawEdgePath(x1, y2, x1, y1, edges.left) + " Z";
  return path;
}

/**
 * Generates deterministic tab edge directions for an R x C jigsaw grid.
 * Seed-based or pseudo-random so matching pieces have matching complementary tabs.
 */
export function generateGridPieceDefinitions(
  rows: number,
  cols: number,
  pieceWidth: number,
  pieceHeight: number,
  seed = 42,
): PuzzlePieceDefinition[] {
  let rngState = seed;
  const random = () => {
    rngState = (rngState * 9301 + 49297) % 233280;
    return rngState / 233280;
  };

  // Generate horizontal internal edge tab directions: hEdges[r][c] (between r,c and r+1,c)
  const hEdges: number[][] = Array.from({ length: rows - 1 }, () =>
    Array.from({ length: cols }, () => (random() < 0.5 ? 1 : -1)),
  );

  // Generate vertical internal edge tab directions: vEdges[r][c] (between r,c and r,c+1)
  const vEdges: number[][] = Array.from({ length: rows }, () =>
    Array.from({ length: cols - 1 }, () => (random() < 0.5 ? 1 : -1)),
  );

  const pieces: PuzzlePieceDefinition[] = [];

  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      const id = r * cols + c;

      // Top edge
      const top = r === 0 ? 0 : -hEdges[r - 1][c]; // complementary to piece above

      // Right edge
      const right = c === cols - 1 ? 0 : vEdges[r][c];

      // Bottom edge
      const bottom = r === rows - 1 ? 0 : hEdges[r][c];

      // Left edge
      const left = c === 0 ? 0 : -vEdges[r][c - 1]; // complementary to piece on left

      const edges: PieceTabEdges = { top, right, bottom, left };
      const correctX = c * pieceWidth;
      const correctY = r * pieceHeight;
      const svgPath = generatePieceSvgPathOffset(correctX, correctY, pieceWidth, pieceHeight, edges);

      pieces.push({
        id,
        row: r,
        col: c,
        correctRow: r,
        correctCol: c,
        edges,
        svgPath,
      });
    }
  }

  return pieces;
}
