/**
 * Kisi Cari Kata 10×10 (FR-PL-7): kata ditempatkan horizontal atau vertikal,
 * sisa sel diisi huruf acak.
 */

export interface PlacedWord {
  word: string;
  /** Indeks sel (row * N + col) yang ditempati kata ini. */
  cells: number[];
}

export interface WordSearchGrid {
  size: number;
  /** Huruf per sel, panjang size × size. */
  letters: string[];
  placed: PlacedWord[];
}

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

export function generateGrid(
  words: readonly string[],
  size = 10,
  rng: () => number = Math.random,
): WordSearchGrid {
  const grid: string[][] = Array.from({ length: size }, () => Array<string>(size).fill(""));
  const placed: PlacedWord[] = [];

  for (const word of words) {
    if (word.length > size) continue;
    for (let attempt = 0; attempt < 250; attempt++) {
      const horizontal = rng() < 0.5;
      const len = word.length;
      const row = Math.floor(rng() * (horizontal ? size : size - len + 1));
      const col = Math.floor(rng() * (horizontal ? size - len + 1 : size));

      let fits = true;
      for (let k = 0; k < len; k++) {
        const r = horizontal ? row : row + k;
        const c = horizontal ? col + k : col;
        const existing = grid[r][c];
        if (existing && existing !== word[k]) {
          fits = false;
          break;
        }
      }
      if (!fits) continue;

      const cells: number[] = [];
      for (let k = 0; k < len; k++) {
        const r = horizontal ? row : row + k;
        const c = horizontal ? col + k : col;
        grid[r][c] = word[k];
        cells.push(r * size + c);
      }
      placed.push({ word, cells });
      break;
    }
  }

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (!grid[r][c]) grid[r][c] = ALPHABET[Math.floor(rng() * ALPHABET.length)];
    }
  }

  return { size, letters: grid.flat(), placed };
}

/**
 * Sel-sel di antara dua ujung pilihan pemain. Hanya garis lurus horizontal
 * atau vertikal yang diterima (FR-PL-7); selain itu `null`.
 */
export function lineBetween(from: number, to: number, size: number): number[] | null {
  const r1 = Math.floor(from / size);
  const c1 = from % size;
  const r2 = Math.floor(to / size);
  const c2 = to % size;
  if (r1 !== r2 && c1 !== c2) return null;

  const cells: number[] = [];
  if (r1 === r2) {
    for (let c = Math.min(c1, c2); c <= Math.max(c1, c2); c++) cells.push(r1 * size + c);
  } else {
    for (let r = Math.min(r1, r2); r <= Math.max(r1, r2); r++) cells.push(r * size + c1);
  }
  return cells;
}

/** Kata yang cocok dengan rentang sel, dibaca maju maupun mundur. */
export function matchWord(
  grid: WordSearchGrid,
  cells: number[],
  alreadyFound: readonly string[],
): PlacedWord | undefined {
  const forward = cells.map((i) => grid.letters[i]).join("");
  const backward = forward.split("").reverse().join("");
  return grid.placed.find(
    (p) => !alreadyFound.includes(p.word) && (p.word === forward || p.word === backward),
  );
}
