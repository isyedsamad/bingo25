"use client";

import React, { useState, useEffect, useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import ModeSelect from "@/components/ModeSelect";
import RoomLobby from "@/components/RoomLobby";
import GridFiller from "@/components/GridFiller";
import GameBoard from "@/components/GameBoard";
import GameOverModal from "@/components/GameOverModal";
import { GameRoom, SlotKey, AiDifficulty, PlayerData } from "@/types/bingo";
import {
  createRoom,
  getRoomByCode,
  claimPlayerSlot,
  subscribeToRoom,
  submitBoard,
  callNumberInRoom,
  resetRoomForNextRound,
  generateSessionId
} from "@/lib/firestoreService";
import { generateRandomBoard, getAiCall, checkLines } from "@/lib/bingoLogic";

type AppScreen = "select" | "lobby" | "filling" | "playing" | "gameover";

export default function Home() {
  const router = useRouter();
  const [screen, setScreen] = useState<AppScreen>("select");
  const [room, setRoom] = useState<GameRoom | null>(null);
  const [mySlotKey, setMySlotKey] = useState<SlotKey | null>(null);
  const [initialCode, setInitialCode] = useState<string>("");

  const [isAiMode, setIsAiMode] = useState<boolean>(false);
  const [aiDifficulty, setAiDifficulty] = useState<AiDifficulty>("smart");
  const [aiName, setAiName] = useState<string>("Smart Bot");
  const [myBoard, setMyBoard] = useState<number[]>([]);
  const [aiBoard, setAiBoard] = useState<number[]>([]);
  const [aiCalledNumbers, setAiCalledNumbers] = useState<number[]>([]);
  const [aiTurn, setAiTurn] = useState<"player" | "ai">("player");
  const [aiTurnStartTime, setAiTurnStartTime] = useState<number>(0);
  const [aiLastCall, setAiLastCall] = useState<{ number: number; callerSlot: SlotKey } | null>(null);

  const [sessionId, setSessionId] = useState<string>("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    setSessionId(generateSessionId());

    const parseUrlCode = () => {
      const hash = window.location.hash;
      const search = window.location.search;
      let code = "";
      if (hash.includes("room=")) {
        code = hash.split("room=")[1]?.split("&")[0];
      } else if (search.includes("room=")) {
        const params = new URLSearchParams(search);
        code = params.get("room") || "";
      }
      if (code) {
        router.replace(`/${code.toUpperCase()}`);
      }
    };

    parseUrlCode();
    window.addEventListener("hashchange", parseUrlCode);
    return () => window.removeEventListener("hashchange", parseUrlCode);
  }, [router]);

  useEffect(() => {
    if (!room?.id || isAiMode) return;

    const unsubscribe = subscribeToRoom(
      room.id,
      (updatedRoom) => {
        if (!updatedRoom) {
          setRoom(null);
          setScreen("select");
          return;
        }

        setRoom(updatedRoom);

        let mySlot = mySlotKey;
        if (!mySlot) {
          const found = Object.values(updatedRoom.players).find(
            (p) => p.claimed && p.sessionId === sessionId
          );
          if (found) {
            mySlot = found.slotKey;
            setMySlotKey(mySlot);
          }
        }

        if (updatedRoom.status === "lobby") {
          setScreen("lobby");
        } else if (updatedRoom.status === "filling") {
          setScreen("filling");
        } else if (updatedRoom.status === "playing") {
          setScreen("playing");
        } else if (updatedRoom.status === "ended") {
          setScreen("gameover");
        }
      },
      (err) => {
        console.error("Room sync error:", err);
      }
    );

    return () => unsubscribe();
  }, [room?.id, mySlotKey, sessionId, isAiMode]);

  const handleStartVsComputer = (
    difficulty: AiDifficulty,
    firstCall: "you" | "computer",
    playerName: string
  ) => {
    setIsAiMode(true);
    setAiDifficulty(difficulty);
    setAiName(difficulty === "casual" ? "Casual Bot" : difficulty === "smart" ? "Smart Bot" : "Expert Bot");
    setMySlotKey("P1");
    setAiBoard(generateRandomBoard());
    setAiCalledNumbers([]);
    setAiTurn(firstCall === "you" ? "player" : "ai");
    setAiTurnStartTime(Date.now());
    setAiLastCall(null);
    setScreen("filling");
  };

  const handleStartOnlineRoom = async (maxPlayers: number, hostName: string) => {
    setIsAiMode(false);
    const { roomCode } = await createRoom(hostName, maxPlayers);
    router.push(`/${roomCode}`);
  };

  const handleJoinOnlineRoom = (code: string, joinPlayerName?: string) => {
    if (joinPlayerName && typeof window !== "undefined") {
      localStorage.setItem("bingo_player_name", joinPlayerName);
    }
    router.push(`/${code.toUpperCase()}`);
  };

  const handleGridReady = async (finalBoard: number[]) => {
    setMyBoard(finalBoard);

    if (isAiMode) {
      setScreen("playing");
      setAiTurnStartTime(Date.now());
      if (aiTurn === "ai") {
        setTimeout(triggerAiMove, 1200);
      }
      return;
    }

    if (room && mySlotKey) {
      await submitBoard(room.id, mySlotKey, finalBoard);
    }
  };

  const triggerAiMove = useCallback(() => {
    if (!isAiMode) return;

    setAiCalledNumbers((prevCalled) => {
      const nextNum = getAiCall(aiDifficulty, aiBoard, prevCalled);
      const updated = [...prevCalled, nextNum];
      setAiLastCall({ number: nextNum, callerSlot: "P2" });
      setAiTurn("player");
      setAiTurnStartTime(Date.now());

      const pCheck = checkLines(myBoard, updated);
      const aiCheck = checkLines(aiBoard, updated);

      if (pCheck.count >= 5 || aiCheck.count >= 5) {
        setTimeout(() => setScreen("gameover"), 600);
      }

      return updated;
    });
  }, [isAiMode, aiDifficulty, aiBoard, myBoard]);

  const handleCallNumber = async (num: number) => {
    if (isAiMode) {
      if (aiCalledNumbers.includes(num)) return;
      const updated = [...aiCalledNumbers, num];
      setAiCalledNumbers(updated);
      setAiLastCall({ number: num, callerSlot: "P1" });

      const pCheck = checkLines(myBoard, updated);
      const aiCheck = checkLines(aiBoard, updated);

      if (pCheck.count >= 5 || aiCheck.count >= 5) {
        setTimeout(() => setScreen("gameover"), 600);
        return;
      }

      setAiTurn("ai");
      setAiTurnStartTime(Date.now());
      setTimeout(triggerAiMove, 1200);
      return;
    }

    if (room && mySlotKey) {
      await callNumberInRoom(room.id, mySlotKey, num);
    }
  };

  const handleNextRound = async () => {
    if (isAiMode) {
      setMyBoard([]);
      setAiBoard(generateRandomBoard());
      setAiCalledNumbers([]);
      setAiTurn("player");
      setAiTurnStartTime(Date.now());
      setAiLastCall(null);
      setScreen("filling");
      return;
    }

    if (room) {
      await resetRoomForNextRound(room.id);
    }
  };

  const handleBackToHome = () => {
    setScreen("select");
    setRoom(null);
    setIsAiMode(false);
    window.location.hash = "";
  };

  const aiPlayersMap: Record<string, PlayerData> = {
    P1: {
      slotKey: "P1",
      sessionId: "player",
      name: "You",
      colorIndex: 0,
      ready: true,
      linesCount: checkLines(myBoard, aiCalledNumbers).count,
      board: myBoard,
      rank: null,
      roundPoints: 0,
      totalScore: 0,
      isHost: true,
      claimed: true
    },
    P2: {
      slotKey: "P2",
      sessionId: "ai",
      name: aiName,
      colorIndex: 1,
      ready: true,
      linesCount: checkLines(aiBoard, aiCalledNumbers).count,
      board: aiBoard,
      rank: null,
      roundPoints: 0,
      totalScore: 0,
      isHost: false,
      claimed: true
    }
  };

  return (
    <div className="min-h-[100dvh] flex flex-col selection:bg-stone-200">
      <Header onResetToHome={handleBackToHome} />

      <main className="flex-1 flex flex-col justify-start items-center py-4 sm:py-4 px-2 sm:px-4">
        {screen === "select" && (
          <ModeSelect
            onStartVsComputer={handleStartVsComputer}
            onStartOnlineRoom={handleStartOnlineRoom}
            onJoinOnlineRoom={handleJoinOnlineRoom}
            initialCode={initialCode}
          />
        )}

        {screen === "lobby" && room && (
          <RoomLobby
            room={room}
            mySlotKey={mySlotKey}
            onSlotClaimed={(slot) => setMySlotKey(slot)}
            onBackToHome={handleBackToHome}
          />
        )}

        {screen === "filling" && (
          <GridFiller
            room={room}
            mySlotKey={mySlotKey}
            onReady={handleGridReady}
            opponentName={isAiMode ? aiName : "Opponent"}
          />
        )}

        {screen === "playing" && (
          <GameBoard
            myBoard={myBoard}
            calledNumbers={isAiMode ? aiCalledNumbers : room?.calledNumbers || []}
            mySlotKey={mySlotKey}
            players={isAiMode ? aiPlayersMap : room?.players || {}}
            turnOrder={isAiMode ? ["P1", "P2"] : room?.turnOrder || []}
            currentTurnSlot={
              isAiMode
                ? aiTurn === "player"
                  ? "P1"
                  : "P2"
                : room?.turnOrder[room?.currentTurnIndex] || "P1"
            }
            activeTurnStartTime={isAiMode ? aiTurnStartTime : room?.activeTurnStartTime || 0}
            lastCall={isAiMode ? aiLastCall : room?.lastCall || null}
            onCallNumber={handleCallNumber}
            isAiMode={isAiMode}
          />
        )}

        {screen === "gameover" && (
          <GameOverModal
            room={room}
            mySlotKey={mySlotKey}
            calledNumbers={isAiMode ? aiCalledNumbers : room?.calledNumbers || []}
            myBoard={myBoard}
            aiBoard={aiBoard}
            aiName={aiName}
            isAiMode={isAiMode}
            onNextRound={handleNextRound}
            onBackToHome={handleBackToHome}
          />
        )}
      </main>
    </div>
  );
}
