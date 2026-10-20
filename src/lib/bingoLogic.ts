import { AiDifficulty } from "@/types/bingo";
import { POINT_TABLE } from "@/config/appConfig";

export const WINNING_LINES: number[][] = [
  [0, 1, 2, 3, 4],
  [5, 6, 7, 8, 9],
  [10, 11, 12, 13, 14],
  [15, 16, 17, 18, 19],
  [20, 21, 22, 23, 24],
  [0, 5, 10, 15, 20],
  [1, 6, 11, 16, 21],
  [2, 7, 12, 17, 22],
  [3, 8, 13, 18, 23],
  [4, 9, 14, 19, 24],
  [0, 6, 12, 18, 24],
  [4, 8, 12, 16, 20]
];

export const BINGO_LETTERS = ["B", "I", "N", "G", "O"] as const;

export function generateRandomBoard(): number[] {
  const numbers = Array.from({ length: 25 }, (_, i) => i + 1);
  for (let i = numbers.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
  }
  return numbers;
}

export function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function checkLines(
  board: number[],
  calledNumbers: number[]
): { completedLines: number[][]; count: number; completedIndices: Set<number> } {
  if (!board || board.length !== 25) {
    return { completedLines: [], count: 0, completedIndices: new Set() };
  }

  const calledSet = new Set(calledNumbers);
  const completedLines: number[][] = [];
  const completedIndices = new Set<number>();

  for (const line of WINNING_LINES) {
    const isComplete = line.every((index) => calledSet.has(board[index]));
    if (isComplete) {
      completedLines.push(line);
      line.forEach((idx) => completedIndices.add(idx));
    }
  }

  return {
    completedLines,
    count: Math.min(5, completedLines.length),
    completedIndices
  };
}

export function getPointsForRank(playerCount: number, rank: number): number {
  const count = Math.min(6, Math.max(2, playerCount));
  const table = POINT_TABLE[count] || POINT_TABLE[2];
  const index = rank - 1;
  if (index >= 0 && index < table.length) {
    return table[index];
  }
  return 0;
}

export function getAiCall(
  difficulty: AiDifficulty,
  aiBoard: number[],
  calledNumbers: number[]
): number {
  const calledSet = new Set(calledNumbers);
  const uncalledNumbers = aiBoard.filter((num) => !calledSet.has(num));

  if (uncalledNumbers.length === 0) {
    return 1;
  }

  if (difficulty === "casual") {
    return uncalledNumbers[Math.floor(Math.random() * uncalledNumbers.length)];
  }

  const scores: Record<number, number> = {};
  uncalledNumbers.forEach((num) => {
    scores[num] = 0;
  });

  WINNING_LINES.forEach((line) => {
    const numbersInLine = line.map((idx) => aiBoard[idx]);
    const uncalledInLine = numbersInLine.filter((num) => !calledSet.has(num));
    const struckInLineCount = 5 - uncalledInLine.length;

    if (uncalledInLine.length > 0) {
      const weight =
        difficulty === "expert"
          ? Math.pow(struckInLineCount + 1, 3)
          : Math.pow(struckInLineCount + 1, 2);

      uncalledInLine.forEach((num) => {
        scores[num] = (scores[num] || 0) + weight;
      });
    }
  });

  let bestNum = uncalledNumbers[0];
  let maxScore = -1;

  for (const num of uncalledNumbers) {
    const score = scores[num] || 0;
    if (score > maxScore) {
      maxScore = score;
      bestNum = num;
    }
  }

  return bestNum;
}
