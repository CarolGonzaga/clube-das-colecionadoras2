export type WordSearchDifficulty = "easy" | "medium" | "hard";
export type WordSource = {
  sourceType: "trope" | "genre" | "book" | "author";
  sourceId: string | null;
  category: string;
  displayWord: string;
  normalizedWord: string;
};
export type CellCoordinate = { row: number; col: number };
export type PlacedWord = WordSource & {
  path: CellCoordinate[];
  direction: string;
  isReversed: boolean;
};
export type GeneratedWordSearch = {
  board: string[][];
  words: PlacedWord[];
  size: number;
};

const DIRECTIONS = {
  right: [0, 1],
  down: [1, 0],
  left: [0, -1],
  up: [-1, 0],
  downRight: [1, 1],
  downLeft: [1, -1],
  upRight: [-1, 1],
  upLeft: [-1, -1],
} as const;

export function normalizeGameWord(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleUpperCase("pt-BR")
    .replace(/[^A-Z]/g, "");
}

function seededRandom(seed: string) {
  let state = 2166136261;
  for (const char of seed) state = Math.imul(state ^ char.charCodeAt(0), 16777619);
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(items: T[], random: () => number) {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1));
    [result[index], result[swap]] = [result[swap], result[index]];
  }
  return result;
}

function directionsFor(difficulty: WordSearchDifficulty) {
  if (difficulty === "easy") return ["right", "down"] as (keyof typeof DIRECTIONS)[];
  return Object.keys(DIRECTIONS) as (keyof typeof DIRECTIONS)[];
}

export function generateWordSearch(
  candidates: WordSource[],
  difficulty: WordSearchDifficulty,
  seed: string,
  attemptLimit = 200,
): GeneratedWordSearch {
  const targetCount = difficulty === "easy" ? 7 : 5;
  const random = seededRandom(seed);
  const unique = [
    ...new Map(
      candidates
        .map((item) => ({ ...item, normalizedWord: normalizeGameWord(item.displayWord) }))
        .filter((item) => item.normalizedWord.length >= 4)
        .map((item) => [item.normalizedWord, item]),
    ).values(),
  ];

  if (unique.length < targetCount) throw new Error("Não há palavras válidas suficientes.");

  const baseSize = difficulty === "easy" ? 10 : difficulty === "medium" ? 11 : 12;
  for (let setAttempt = 0; setAttempt < 12; setAttempt += 1) {
    const selected = shuffle(unique, random).slice(0, targetCount);
    const longest = Math.max(...selected.map((word) => word.normalizedWord.length));
    const size = Math.min(16, Math.max(baseSize, longest));
    if (longest > size) continue;

    const board: (string | null)[][] = Array.from({ length: size }, () =>
      Array.from({ length: size }, () => null),
    );
    const placed: PlacedWord[] = [];
    let diagonalCount = 0;
    let reversedCount = 0;

    for (let wordIndex = 0; wordIndex < selected.length; wordIndex += 1) {
      const source = selected[wordIndex];
      let didPlace = false;
      const availableDirections = directionsFor(difficulty);

      for (let attempt = 0; attempt < attemptLimit && !didPlace; attempt += 1) {
        let directionName = shuffle(availableDirections, random)[0];
        if (difficulty === "medium" && wordIndex < 2) {
          directionName = shuffle(
            ["downRight", "downLeft", "upRight", "upLeft"] as const,
            random,
          )[0];
        } else if (difficulty === "medium" && wordIndex < 4) {
          directionName = shuffle(["left", "up", "upLeft", "upRight"] as const, random)[0];
        }
        const [rowDelta, colDelta] = DIRECTIONS[directionName];
        const row = Math.floor(random() * size);
        const col = Math.floor(random() * size);
        const path = Array.from({ length: source.normalizedWord.length }, (_, index) => ({
          row: row + rowDelta * index,
          col: col + colDelta * index,
        }));
        if (
          path.some((cell) => cell.row < 0 || cell.col < 0 || cell.row >= size || cell.col >= size)
        )
          continue;
        if (
          path.some(
            (cell, index) =>
              board[cell.row][cell.col] !== null &&
              board[cell.row][cell.col] !== source.normalizedWord[index],
          )
        )
          continue;

        path.forEach((cell, index) => {
          board[cell.row][cell.col] = source.normalizedWord[index];
        });
        const isDiagonal = rowDelta !== 0 && colDelta !== 0;
        const isReversed = rowDelta < 0 || colDelta < 0;
        if (isDiagonal) diagonalCount += 1;
        if (isReversed) reversedCount += 1;
        placed.push({ ...source, path, direction: directionName, isReversed });
        didPlace = true;
      }
      if (!didPlace) break;
    }

    const validMedium = difficulty !== "medium" || (diagonalCount >= 2 && reversedCount >= 2);
    if (placed.length === targetCount && validMedium) {
      const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
      return {
        board: board.map((row) =>
          row.map((cell) => cell ?? letters[Math.floor(random() * letters.length)]),
        ),
        words: placed,
        size,
      };
    }
  }
  throw new Error("Não foi possível gerar um quadro completo.");
}

export function isStraightContinuousPath(path: CellCoordinate[], size: number) {
  if (
    path.length < 2 ||
    path.some(
      ({ row, col }) =>
        !Number.isInteger(row) ||
        !Number.isInteger(col) ||
        row < 0 ||
        col < 0 ||
        row >= size ||
        col >= size,
    )
  )
    return false;
  const unique = new Set(path.map(({ row, col }) => `${row}:${col}`));
  if (unique.size !== path.length) return false;
  const rowDelta = path[1].row - path[0].row;
  const colDelta = path[1].col - path[0].col;
  if (Math.max(Math.abs(rowDelta), Math.abs(colDelta)) !== 1) return false;
  return path.every(
    (cell, index) =>
      index === 0 ||
      (cell.row === path[0].row + rowDelta * index && cell.col === path[0].col + colDelta * index),
  );
}
