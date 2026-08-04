export type PuzzleDifficulty = "easy" | "medium" | "hard";

export type PersistedPuzzlePiece = {
  id: number;
  isPlaced: boolean;
  x: number;
  y: number;
  rotation: number;
};

export function validateCompletedPuzzleBoard(
  pieces: PersistedPuzzlePiece[],
  rows: number,
  cols: number,
) {
  const totalPieces = rows * cols;
  const uniqueIds = new Set(pieces.map((piece) => piece.id));
  return (
    pieces.length === totalPieces &&
    uniqueIds.size === totalPieces &&
    pieces.every((piece) => {
      if (piece.id < 0 || piece.id >= totalPieces || !piece.isPlaced) return false;
      const row = Math.floor(piece.id / cols);
      const col = piece.id % cols;
      return (
        row < rows &&
        piece.rotation % 360 === 0 &&
        Math.abs(piece.x - (220 + col * 80)) < 0.01 &&
        Math.abs(piece.y - (160 + row * 80)) < 0.01
      );
    })
  );
}

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
  easy: { rows: 4, cols: 3, totalPieces: 12, label: "Fácil" },
  medium: { rows: 5, cols: 4, totalPieces: 20, label: "Médio" },
  hard: { rows: 6, cols: 5, totalPieces: 30, label: "Difícil" },
};

function r(n: number) {
  return Math.round(n * 100) / 100;
}

/**
 * Draws a jigsaw edge from (x1,y1) to (x2,y2).
 * tabType  1 → knob protrudes OUTWARD from piece (left of travel direction)
 * tabType -1 → blank indents inward
 * tabType  0 → straight line
 *
 * Uses the LEFT-of-travel perpendicular as the outward direction so that:
 *   top edge    → knob goes UP
 *   right edge  → knob goes RIGHT
 *   bottom edge → knob goes DOWN
 *   left edge   → knob goes LEFT
 */
function jigsawEdge(x1: number, y1: number, x2: number, y2: number, tabType: number): string {
  if (tabType === 0) return `L ${r(x2)} ${r(y2)}`;

  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy);

  // LEFT-of-travel unit perpendicular × tabType = outward for tabType=1
  const nx = (dy / len) * tabType;
  const ny = (-dx / len) * tabType;

  // Helper: point at fraction f along edge, d pixels outward
  const p = (f: number, d = 0) => `${r(x1 + dx * f + nx * d)} ${r(y1 + dy * f + ny * d)}`;

  const D = len * 0.28; // dome protrusion (28% of edge length)

  // Classic jigsaw knob via two cubic beziers:
  //   flat → knob entry (t=0.30) → dome apex (t=0.50, D out) → knob exit (t=0.70) → flat
  // cp1/cp2 at full dome height just inside the apex give a nice round dome
  // and the very slight (D*0.05) at entry/exit creates the characteristic neck
  return (
    `L ${p(0.3)} ` +
    `C ${p(0.3, D * 0.05)} ${p(0.44, D)} ${p(0.5, D)} ` +
    `C ${p(0.56, D)} ${p(0.7, D * 0.05)} ${p(0.7)} ` +
    `L ${r(x2)} ${r(y2)}`
  );
}

/**
 * Builds the SVG path for a piece in LOCAL space (top-left = 0,0).
 * Knob tabs protrude outside the bounding box — use overflow:visible on the element.
 */
export function buildPiecePath(w: number, h: number, edges: PieceTabEdges): string {
  let d = `M 0 0 `;
  d += jigsawEdge(0, 0, w, 0, edges.top) + " "; // top:    L→R
  d += jigsawEdge(w, 0, w, h, edges.right) + " "; // right:  T→B
  d += jigsawEdge(w, h, 0, h, edges.bottom) + " "; // bottom: R→L
  d += jigsawEdge(0, h, 0, 0, edges.left) + " Z"; // left:   B→T
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

  // hEdges[r][c]: tab direction for BOTTOM of piece(r,c) = TOP complement of piece(r+1,c)
  const hEdges: number[][] = Array.from({ length: rows - 1 }, () =>
    Array.from({ length: cols }, () => (rng() < 0.5 ? 1 : -1)),
  );

  // vEdges[r][c]: tab direction for RIGHT of piece(r,c) = LEFT complement of piece(r,c+1)
  const vEdges: number[][] = Array.from({ length: rows }, () =>
    Array.from({ length: cols - 1 }, () => (rng() < 0.5 ? 1 : -1)),
  );

  const pieces: PuzzlePieceDefinition[] = [];

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const id = row * cols + col;

      const top = row === 0 ? 0 : -hEdges[row - 1][col];
      const right = col === cols - 1 ? 0 : vEdges[row][col];
      const bottom = row === rows - 1 ? 0 : hEdges[row][col];
      const left = col === 0 ? 0 : -vEdges[row][col - 1];

      const edges: PieceTabEdges = { top, right, bottom, left };
      const svgPath = buildPiecePath(pieceWidth, pieceHeight, edges);

      pieces.push({ id, row, col, edges, svgPath });
    }
  }

  return pieces;
}
