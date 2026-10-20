"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import RoomLobby from "@/components/RoomLobby";
import GridFiller from "@/components/GridFiller";
import GameBoard from "@/components/GameBoard";
import GameOverModal from "@/components/GameOverModal";
import { GameRoom, SlotKey } from "@/types/bingo";
import {
  getRoomByCode,
  claimPlayerSlot,
  subscribeToRoom,
  submitBoard,
  callNumberInRoom,
  resetRoomForNextRound,
  generateSessionId
} from "@/lib/firestoreService";
import { ArrowLeft, Loader2, AlertCircle } from "lucide-react";

interface RoomClientProps {
  roomcode: string;
}

export default function RoomClient({ roomcode }: RoomClientProps) {
  const router = useRouter();
  const roomCode = roomcode.toUpperCase();

  const [room, setRoom] = useState<GameRoom | null>(null);
  const [mySlotKey, setMySlotKey] = useState<SlotKey | null>(null);
  const [myBoard, setMyBoard] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [sessionId, setSessionId] = useState<string>("");

  useEffect(() => {
    if (typeof window === "undefined" || !roomCode) return;

    const currentSessionId = generateSessionId();
    setSessionId(currentSessionId);

    let unsub: (() => void) | null = null;
    let isCancelled = false;

    async function initRoom() {
      setLoading(true);
      const loadedRoom = await getRoomByCode(roomCode);

      if (isCancelled) return;

      if (!loadedRoom) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setRoom(loadedRoom);
      const myClaimedSlot = Object.values(loadedRoom.players).find(
        (p) => p.claimed && p.sessionId === currentSessionId
      );

      if (myClaimedSlot) {
        setMySlotKey(myClaimedSlot.slotKey);
      } else {
        const slotKeys: SlotKey[] = ["P1", "P2", "P3", "P4", "P5", "P6"];
        const emptySlot = slotKeys
          .slice(0, loadedRoom.maxPlayers)
          .map((k) => loadedRoom.players[k])
          .find((p) => p && !p.claimed);

        if (emptySlot) {
          const storedName =
            typeof window !== "undefined" ? localStorage.getItem("bingo_player_name") : null;
          const finalName = storedName?.trim() || `Player ${emptySlot.slotKey.replace("P", "")}`;

          const res = await claimPlayerSlot(loadedRoom.id, emptySlot.slotKey, finalName);
          if (res.success && !isCancelled) {
            setMySlotKey(emptySlot.slotKey);
          }
        }
      }

      setLoading(false);
      unsub = subscribeToRoom(
        loadedRoom.id,
        (updatedRoom) => {
          if (isCancelled) return;
          if (!updatedRoom) {
            setRoom(null);
            setNotFound(true);
            return;
          }
          setRoom(updatedRoom);
          setMySlotKey((currentSlot) => {
            if (currentSlot) return currentSlot;
            const found = Object.values(updatedRoom.players).find(
              (p) => p.claimed && p.sessionId === currentSessionId
            );
            return found ? found.slotKey : null;
          });
        },
        (err) => {
          console.error("Room sync error:", err);
        }
      );
    }

    initRoom();

    return () => {
      isCancelled = true;
      if (unsub) unsub();
    };
  }, [roomCode]);

  const handleGridReady = async (finalBoard: number[]) => {
    setMyBoard(finalBoard);
    if (room && mySlotKey) {
      await submitBoard(room.id, mySlotKey, finalBoard);
    }
  };

  const handleCallNumber = async (num: number) => {
    if (room && mySlotKey) {
      await callNumberInRoom(room.id, mySlotKey, num);
    }
  };

  const handleNextRound = async () => {
    if (room) {
      await resetRoomForNextRound(room.id);
    }
  };

  const handleBackToHome = () => {
    router.push("/");
  };

  return (
    <div className="min-h-screen flex flex-col selection:bg-stone-200">
      <Header onResetToHome={handleBackToHome} />

      <main className="flex-1 flex flex-col justify-center items-center py-4 px-2 sm:px-4">
        {loading && (
          <div className="text-center py-12 space-y-3">
            <Loader2 className="w-7 h-7 animate-spin text-primary mx-auto" />
            <p className="text-xs text-muted-foreground font-medium">
              Connecting to room <span className="font-bold text-foreground">{roomCode}</span>...
            </p>
          </div>
        )}

        {!loading && notFound && (
          <div className="bg-card rounded-xl border border-border shadow-sm p-6 max-w-sm w-full mx-auto text-center space-y-4">
            <div className="w-10 h-10 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">Room Not Found</h2>
              <p className="text-xs text-muted-foreground mt-1">
                Room <span className="font-mono font-bold text-foreground">{roomCode}</span> could not be found or has ended.
              </p>
            </div>
            <button
              onClick={handleBackToHome}
              className="w-full py-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg shadow-xs text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Home
            </button>
          </div>
        )}

        {!loading && !notFound && room && (
          <>
            {room.status === "lobby" && (
              <RoomLobby
                room={room}
                mySlotKey={mySlotKey}
                onSlotClaimed={(slot) => setMySlotKey(slot)}
                onBackToHome={handleBackToHome}
              />
            )}

            {room.status === "filling" && (
              <GridFiller
                room={room}
                mySlotKey={mySlotKey}
                onReady={handleGridReady}
                opponentName="Opponent"
              />
            )}

            {room.status === "playing" && (
              <GameBoard
                myBoard={myBoard}
                calledNumbers={room.calledNumbers || []}
                mySlotKey={mySlotKey}
                players={room.players || {}}
                turnOrder={room.turnOrder || []}
                currentTurnSlot={room.turnOrder[room.currentTurnIndex] || "P1"}
                activeTurnStartTime={room.activeTurnStartTime || 0}
                lastCall={room.lastCall || null}
                onCallNumber={handleCallNumber}
                isAiMode={false}
              />
            )}

            {room.status === "ended" && (
              <GameOverModal
                room={room}
                mySlotKey={mySlotKey}
                calledNumbers={room.calledNumbers || []}
                myBoard={myBoard}
                onNextRound={handleNextRound}
                onBackToHome={handleBackToHome}
                isAiMode={false}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}
