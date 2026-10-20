import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  onSnapshot,
  Unsubscribe,
  serverTimestamp
} from "firebase/firestore";
import { db } from "./firebase";
import { GameRoom, SlotKey, PlayerData } from "@/types/bingo";
import { generateRoomCode, checkLines, getPointsForRank } from "./bingoLogic";

const ROOMS_COLLECTION = "bingo_rooms";

export function generateSessionId(): string {
  if (typeof window === "undefined") return "session_" + Math.random().toString(36).substring(2, 9);
  let id = localStorage.getItem("bingo_session_id");
  if (!id) {
    id = "user_" + Math.random().toString(36).substring(2, 11) + "_" + Date.now().toString(36);
    localStorage.setItem("bingo_session_id", id);
  }
  return id;
}

export async function createRoom(
  hostName: string,
  maxPlayers: number
): Promise<{ roomId: string; roomCode: string; slotKey: SlotKey; sessionId: string }> {
  const sessionId = generateSessionId();
  const roomCode = generateRoomCode();
  const roomId = roomCode.toLowerCase();
  const roomRef = doc(db, ROOMS_COLLECTION, roomId);

  const initialPlayers: Record<string, PlayerData> = {};
  const turnOrder: SlotKey[] = [];

  for (let i = 1; i <= maxPlayers; i++) {
    const slot = `P${i}` as SlotKey;
    turnOrder.push(slot);
    initialPlayers[slot] = {
      slotKey: slot,
      sessionId: i === 1 ? sessionId : "",
      name: i === 1 ? hostName || "Player 1" : `Player ${i}`,
      colorIndex: i - 1,
      ready: false,
      linesCount: 0,
      board: [],
      rank: null,
      roundPoints: 0,
      totalScore: 0,
      isHost: i === 1,
      claimed: i === 1
    };
  }

  const roomData: Omit<GameRoom, "id"> = {
    code: roomCode,
    status: "lobby",
    maxPlayers,
    hostId: sessionId,
    roundNumber: 1,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    players: initialPlayers,
    turnOrder,
    currentTurnIndex: 0,
    activeTurnStartTime: Date.now(),
    calledNumbers: [],
    lastCall: null,
    rankings: [],
    loserSlot: null
  };

  await setDoc(roomRef, roomData);
  return { roomId, roomCode, slotKey: "P1", sessionId };
}

export async function getRoomByCode(roomCode: string): Promise<GameRoom | null> {
  const roomId = roomCode.trim().toLowerCase();
  const roomRef = doc(db, ROOMS_COLLECTION, roomId);
  const snap = await getDoc(roomRef);
  if (!snap.exists()) return null;
  return { id: snap.id, ...(snap.data() as Omit<GameRoom, "id">) };
}

export async function claimPlayerSlot(
  roomId: string,
  slotKey: SlotKey,
  playerName: string
): Promise<{ success: boolean; sessionId: string }> {
  const sessionId = generateSessionId();
  const roomRef = doc(db, ROOMS_COLLECTION, roomId);
  const snap = await getDoc(roomRef);
  if (!snap.exists()) return { success: false, sessionId };

  const data = snap.data() as GameRoom;
  const currentSlot = data.players[slotKey];

  if (currentSlot && currentSlot.claimed && currentSlot.sessionId !== sessionId) {
    return { success: false, sessionId };
  }

  const updatedPlayers = {
    ...data.players,
    [slotKey]: {
      ...currentSlot,
      sessionId,
      name: playerName.trim() || currentSlot?.name || slotKey,
      claimed: true
    }
  };

  await updateDoc(roomRef, {
    players: updatedPlayers,
    updatedAt: Date.now()
  });

  return { success: true, sessionId };
}

export async function leavePlayerSlot(
  roomId: string,
  slotKey: SlotKey
): Promise<void> {
  const roomRef = doc(db, ROOMS_COLLECTION, roomId);
  const snap = await getDoc(roomRef);
  if (!snap.exists()) return;

  const data = snap.data() as GameRoom;
  const currentSlot = data.players[slotKey];
  if (!currentSlot || !currentSlot.claimed) return;

  const updatedPlayers = {
    ...data.players,
    [slotKey]: {
      ...currentSlot,
      claimed: false,
      ready: false,
      sessionId: "",
      name: `Player ${slotKey.replace("P", "")}`,
      board: [],
      linesCount: 0
    }
  };

  const remainingClaimed = Object.values(updatedPlayers).filter((p) => p.claimed);

  if (remainingClaimed.length === 0) {
    await updateDoc(roomRef, {
      players: updatedPlayers,
      status: "ended",
      updatedAt: Date.now()
    });
    return;
  }

  if (currentSlot.isHost) {
    const nextHost = remainingClaimed[0];
    if (nextHost) {
      updatedPlayers[nextHost.slotKey] = {
        ...nextHost,
        isHost: true
      };
    }
  }

  await updateDoc(roomRef, {
    players: updatedPlayers,
    updatedAt: Date.now()
  });
}

export function subscribeToRoom(
  roomId: string,
  onUpdate: (room: GameRoom | null) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const roomRef = doc(db, ROOMS_COLLECTION, roomId);
  return onSnapshot(
    roomRef,
    (snap) => {
      if (!snap.exists()) {
        onUpdate(null);
      } else {
        onUpdate({ id: snap.id, ...(snap.data() as Omit<GameRoom, "id">) });
      }
    },
    (err) => {
      if (onError) onError(err);
    }
  );
}

export async function startFillingPhase(roomId: string): Promise<void> {
  const roomRef = doc(db, ROOMS_COLLECTION, roomId);
  await updateDoc(roomRef, {
    status: "filling",
    updatedAt: Date.now()
  });
}

export async function submitBoard(
  roomId: string,
  slotKey: SlotKey,
  board: number[]
): Promise<void> {
  const roomRef = doc(db, ROOMS_COLLECTION, roomId);
  const snap = await getDoc(roomRef);
  if (!snap.exists()) return;

  const room = snap.data() as GameRoom;
  const updatedPlayers = {
    ...room.players,
    [slotKey]: {
      ...room.players[slotKey],
      board,
      ready: true,
      linesCount: 0,
      rank: null,
      roundPoints: 0
    }
  };

  const claimedSlots = Object.values(updatedPlayers).filter((p) => p.claimed);
  const allReady = claimedSlots.every((p) => p.ready && p.board.length === 25);

  const updates: Record<string, unknown> = {
    players: updatedPlayers,
    updatedAt: Date.now()
  };

  if (allReady && claimedSlots.length >= 2) {
    updates.status = "playing";
    updates.currentTurnIndex = 0;
    updates.activeTurnStartTime = Date.now();
    updates.calledNumbers = [];
    updates.lastCall = null;
    updates.rankings = [];
    updates.loserSlot = null;
    updates.turnOrder = claimedSlots.map((p) => p.slotKey);
  }

  await updateDoc(roomRef, updates);
}

export async function callNumberInRoom(
  roomId: string,
  callerSlot: SlotKey,
  numberToCall: number
): Promise<void> {
  const roomRef = doc(db, ROOMS_COLLECTION, roomId);
  const snap = await getDoc(roomRef);
  if (!snap.exists()) return;

  const room = snap.data() as GameRoom;
  if (room.status !== "playing") return;
  if (room.calledNumbers.includes(numberToCall)) return;

  const updatedCalled = [...room.calledNumbers, numberToCall];
  const updatedPlayers = { ...room.players };
  const newRankings = [...(room.rankings || [])];
  const activeTurnOrder = room.turnOrder.filter((slot) => !newRankings.includes(slot));

  const callerPlayer = updatedPlayers[callerSlot];
  let callerGotBingo = false;

  if (callerPlayer && !newRankings.includes(callerSlot)) {
    const callerCheck = checkLines(callerPlayer.board, updatedCalled);
    callerPlayer.linesCount = callerCheck.count;
    if (callerCheck.count >= 5) {
      callerGotBingo = true;
      callerPlayer.rank = newRankings.length + 1;
      newRankings.push(callerSlot);
    }
  }

  for (const slot of activeTurnOrder) {
    if (slot === callerSlot) continue;
    const player = updatedPlayers[slot];
    if (player && !newRankings.includes(slot)) {
      const check = checkLines(player.board, updatedCalled);
      player.linesCount = check.count;
      if (check.count >= 5) {
        player.rank = newRankings.length + 1;
        newRankings.push(slot);
      }
    }
  }

  const remainingPlayers = room.turnOrder.filter((slot) => !newRankings.includes(slot));
  let finalStatus: GameRoom["status"] = "playing";
  let loserSlot = room.loserSlot;

  if (remainingPlayers.length <= 1) {
    finalStatus = "ended";
    if (remainingPlayers.length === 1) {
      loserSlot = remainingPlayers[0];
      const loserPlayer = updatedPlayers[loserSlot];
      if (loserPlayer) {
        loserPlayer.rank = newRankings.length + 1;
        newRankings.push(loserSlot);
      }
    }

    const totalInGame = room.turnOrder.length;
    newRankings.forEach((slot, idx) => {
      const rank = idx + 1;
      const pts = getPointsForRank(totalInGame, rank);
      const p = updatedPlayers[slot];
      if (p) {
        p.roundPoints = pts;
        p.totalScore = (p.totalScore || 0) + pts;
      }
    });
  }

  let nextTurnIndex = room.currentTurnIndex;
  if (finalStatus === "playing" && remainingPlayers.length > 1) {
    for (let step = 1; step <= room.turnOrder.length; step++) {
      const candidateIdx = (room.currentTurnIndex + step) % room.turnOrder.length;
      const candidateSlot = room.turnOrder[candidateIdx];
      if (!newRankings.includes(candidateSlot)) {
        nextTurnIndex = candidateIdx;
        break;
      }
    }
  }

  await updateDoc(roomRef, {
    calledNumbers: updatedCalled,
    lastCall: {
      number: numberToCall,
      callerSlot,
      timestamp: Date.now()
    },
    players: updatedPlayers,
    rankings: newRankings,
    loserSlot,
    status: finalStatus,
    currentTurnIndex: nextTurnIndex,
    activeTurnStartTime: Date.now(),
    updatedAt: Date.now()
  });
}

export async function resetRoomForNextRound(roomId: string): Promise<void> {
  const roomRef = doc(db, ROOMS_COLLECTION, roomId);
  const snap = await getDoc(roomRef);
  if (!snap.exists()) return;

  const room = snap.data() as GameRoom;
  const updatedPlayers: Record<string, PlayerData> = {};

  Object.entries(room.players).forEach(([slot, player]) => {
    updatedPlayers[slot] = {
      ...player,
      ready: false,
      board: [],
      linesCount: 0,
      rank: null,
      roundPoints: 0
    };
  });

  await updateDoc(roomRef, {
    status: "filling",
    roundNumber: (room.roundNumber || 1) + 1,
    calledNumbers: [],
    lastCall: null,
    rankings: [],
    loserSlot: null,
    players: updatedPlayers,
    currentTurnIndex: 0,
    activeTurnStartTime: Date.now(),
    updatedAt: Date.now()
  });
}
