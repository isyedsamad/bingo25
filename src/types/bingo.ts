export type SlotKey = "P1" | "P2" | "P3" | "P4" | "P5" | "P6";

export type GameStatus = "lobby" | "filling" | "playing" | "ended";

export type AiDifficulty = "casual" | "smart" | "expert";

export type GameMode = "computer" | "online";

export interface PlayerData {
  slotKey: SlotKey;
  sessionId: string;
  name: string;
  colorIndex: number;
  ready: boolean;
  linesCount: number;
  board: number[];
  rank: number | null;
  roundPoints: number;
  totalScore: number;
  isHost: boolean;
  claimed: boolean;
}

export interface GameRoom {
  id: string;
  code: string;
  status: GameStatus;
  maxPlayers: number;
  hostId: string;
  roundNumber: number;
  createdAt: number;
  updatedAt: number;
  players: Record<string, PlayerData>;
  turnOrder: SlotKey[];
  currentTurnIndex: number;
  activeTurnStartTime: number;
  calledNumbers: number[];
  lastCall: {
    number: number;
    callerSlot: SlotKey;
    timestamp: number;
  } | null;
  rankings: SlotKey[];
  loserSlot: SlotKey | null;
}

export interface SoloGameState {
  difficulty: AiDifficulty;
  playerFirst: boolean;
  playerName: string;
  playerBoard: number[];
  aiBoard: number[];
  calledNumbers: number[];
  currentTurn: "player" | "ai";
  turnStartTime: number;
  playerLines: number;
  aiLines: number;
  status: "filling" | "playing" | "ended";
  winner: "player" | "ai" | "tie" | null;
  playerCompletedLines: number[][];
  aiCompletedLines: number[][];
}
