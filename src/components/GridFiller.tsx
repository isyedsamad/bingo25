"use client";

import React, { useState, useEffect } from "react";
import { Sparkles, Trash2, CheckCircle2, Plus, Loader2, Check, Clock } from "lucide-react";
import { GameRoom, SlotKey } from "@/types/bingo";
import { PLAYER_COLORS, SETUP_TIME_LIMIT_SECONDS } from "@/config/appConfig";
import { soundManager } from "@/lib/soundEffects";
import { generateRandomBoard } from "@/lib/bingoLogic";

interface GridFillerProps {
  room?: GameRoom | null;
  mySlotKey?: SlotKey | null;
  onReady: (board: number[]) => void;
  opponentName?: string;
}

export default function GridFiller({
  room,
  mySlotKey,
  onReady,
  opponentName = "Opponent"
}: GridFillerProps) {
  const [board, setBoard] = useState<(number | null)[]>(Array(25).fill(null));
  const [timeLeft, setTimeLeft] = useState<number>(SETUP_TIME_LIMIT_SECONDS);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const placedCount = board.filter((n) => n !== null).length;
  const nextNumberToPlace = placedCount + 1;

  useEffect(() => {
    if (isSubmitted) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleAutoFillAndReady();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [board, isSubmitted]);

  const handleCellClick = (index: number) => {
    if (isSubmitted) return;
    if (board[index] !== null) return;
    if (placedCount >= 25) return;

    soundManager.playPop();
    const newBoard = [...board];
    newBoard[index] = nextNumberToPlace;
    setBoard(newBoard);
  };

  const handleFillForMe = () => {
    if (isSubmitted) return;
    soundManager.playPop();
    const existing = new Set(board.filter((n): n is number => n !== null));
    const missing: number[] = [];
    for (let i = 1; i <= 25; i++) {
      if (!existing.has(i)) missing.push(i);
    }
    for (let i = missing.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [missing[i], missing[j]] = [missing[j], missing[i]];
    }

    let missingIdx = 0;
    const newBoard = board.map((val) => (val !== null ? val : missing[missingIdx++]));
    setBoard(newBoard);
  };

  const handleClear = () => {
    if (isSubmitted) return;
    soundManager.playPop();
    setBoard(Array(25).fill(null));
  };

  const handleAutoFillAndReady = () => {
    const finalBoard = generateRandomBoard();
    setBoard(finalBoard);
    setIsSubmitted(true);
    onReady(finalBoard);
  };

  const handleReadyClick = () => {
    if (placedCount !== 25 || isSubmitted) return;
    soundManager.playLine();
    setIsSubmitted(true);
    onReady(board as number[]);
  };

  const myColor = PLAYER_COLORS[mySlotKey ? room?.players[mySlotKey]?.colorIndex ?? 0 : 0];

  return (
    <div className="w-full max-w-lg mx-auto p-3 sm:p-4 space-y-3.5 animate-pop">
      <div className="flex gap-2 overflow-x-auto pb-1.5 custom-scrollbar snap-x">
        {room ? (
          Object.keys(room.players)
            .sort()
            .map((slotKey) => {
              const slot = slotKey as SlotKey;
              const player = room.players[slot];
              if (!player || !player.claimed) return null;
              const isMe = mySlotKey === slot;
              const color = PLAYER_COLORS[player.colorIndex ?? 0];
              const isPlayerReady = player.ready || (isMe && isSubmitted);

              return (
                <div
                  key={slot}
                  style={{ borderColor: isMe ? myColor.border : undefined }}
                  className="bg-card rounded-lg border border-border p-2.5 shadow-2xs min-w-[150px] sm:min-w-[160px] flex-1 shrink-0 snap-start"
                >
                  <div className="flex items-center justify-between gap-1 mb-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span style={{ backgroundColor: color.primary }} className="w-2 h-2 rounded-full shrink-0" />
                      <span className="text-xs font-semibold text-foreground truncate">
                        {player.name} {isMe && <span className="text-muted-foreground font-normal">(you)</span>}
                      </span>
                    </div>

                    <span
                      className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider shrink-0 shadow-2xs ${isPlayerReady
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground border border-border"
                        }`}
                    >
                      {isPlayerReady ? "READY" : "FILLING"}
                    </span>
                  </div>

                  <div className="grid grid-cols-5 gap-1">
                    {["B", "I", "N", "G", "O"].map((letter) => (
                      <div
                        key={letter}
                        className="h-6 rounded bg-secondary border border-border text-muted-foreground text-[11px] font-bold flex items-center justify-center"
                      >
                        {letter}
                      </div>
                    ))}
                  </div>
                  <div className="mt-1.5 text-center text-[11px] font-medium text-muted-foreground">
                    0 lines
                  </div>
                </div>
              );
            })
        ) : (
          <>
            <div
              style={{ borderColor: myColor.border }}
              className="bg-card rounded-lg border border-border p-2.5 shadow-2xs min-w-[150px] sm:min-w-[160px] flex-1 shrink-0 snap-start"
            >
              <div className="flex items-center justify-between gap-1 mb-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span style={{ backgroundColor: myColor.primary }} className="w-2 h-2 rounded-full shrink-0" />
                  <span className="text-xs font-semibold text-foreground truncate">
                    You <span className="text-muted-foreground font-normal">(you)</span>
                  </span>
                </div>

                <span
                  className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider shrink-0 shadow-2xs ${isSubmitted
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground border border-border"
                    }`}
                >
                  {isSubmitted ? "READY" : "FILLING"}
                </span>
              </div>

              <div className="grid grid-cols-5 gap-1">
                {["B", "I", "N", "G", "O"].map((letter) => (
                  <div
                    key={letter}
                    className="h-6 rounded bg-secondary border border-border text-muted-foreground text-[11px] font-bold flex items-center justify-center"
                  >
                    {letter}
                  </div>
                ))}
              </div>
              <div className="mt-1.5 text-center text-[11px] font-medium text-muted-foreground">
                0 lines
              </div>
            </div>

            <div className="bg-card rounded-lg border border-border p-2.5 shadow-2xs min-w-[150px] sm:min-w-[160px] flex-1 shrink-0 snap-start">
              <div className="flex items-center justify-between gap-1 mb-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="w-2 h-2 rounded-full bg-stone-400 shrink-0" />
                  <span className="text-xs font-semibold text-foreground truncate">
                    {opponentName}
                  </span>
                </div>

                <span className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground text-[8px] font-bold uppercase tracking-wider shrink-0 shadow-2xs">
                  FILLING
                </span>
              </div>

              <div className="grid grid-cols-5 gap-1">
                {["B", "I", "N", "G", "O"].map((letter) => (
                  <div
                    key={letter}
                    className="h-6 rounded bg-secondary border border-border text-muted-foreground text-[11px] font-bold flex items-center justify-center"
                  >
                    {letter}
                  </div>
                ))}
              </div>
              <div className="mt-1.5 text-center text-[11px] font-medium text-muted-foreground">
                0 lines
              </div>
            </div>
          </>
        )}
      </div>

      <div className="modern-board-card p-3 sm:p-4 rounded-xl border border-border shadow-xs relative bg-card">
        <div className="grid grid-cols-5 gap-1.5 sm:gap-2 max-w-[340px] mx-auto aspect-square relative z-10">
          {board.map((num, idx) => {
            const isFilled = num !== null;
            return (
              <button
                key={idx}
                onClick={() => handleCellClick(idx)}
                disabled={isFilled || isSubmitted}
                className={`group relative overflow-hidden rounded-lg font-bold text-lg sm:text-xl flex items-center justify-center transition-all cursor-pointer aspect-square ${isFilled
                  ? "bg-card text-foreground shadow-2xs border border-border scale-100"
                  : "bg-secondary/40 border border-dashed border-border text-muted-foreground hover:border-primary hover:bg-secondary/80"
                  }`}
              >
                {isFilled ? (
                  <span className="leading-none">{num}</span>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground/60 group-hover:text-primary transition-colors">
                    <Plus className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2]" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        <div className="text-xs text-foreground font-medium shrink-0">
          {placedCount < 25 ? (
            <>
              Next: <span className="font-bold text-primary text-sm">{nextNumberToPlace}</span>
              <span className="text-muted-foreground text-[11px] ml-1.5">({placedCount}/25)</span>
            </>
          ) : (
            <span className="text-emerald-600 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Grid Complete
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleFillForMe}
            disabled={placedCount >= 25 || isSubmitted}
            className="px-2.5 py-1.5 rounded-md border border-border bg-card hover:bg-secondary disabled:opacity-40 text-foreground text-xs font-medium shadow-none transition-all flex items-center gap-1 cursor-pointer"
          >
            <Sparkles className="w-3 h-3 text-primary" />
            Auto-fill
          </button>

          <button
            onClick={handleClear}
            disabled={placedCount === 0 || isSubmitted}
            className="px-2.5 py-1.5 rounded-md border border-border bg-card hover:bg-secondary disabled:opacity-40 text-muted-foreground hover:text-foreground text-xs font-medium shadow-none transition-all flex items-center gap-1 cursor-pointer"
          >
            <Trash2 className="w-3 h-3" />
            Clear
          </button>
        </div>
        <button
          onClick={handleReadyClick}
          disabled={placedCount < 25 || isSubmitted}
          className={`w-full px-3.5 py-2 rounded-lg font-medium text-xs shadow-none transition-all flex items-center justify-center gap-1.5 cursor-pointer ${placedCount === 25 && !isSubmitted
            ? "bg-primary hover:bg-primary/90 text-primary-foreground"
            : isSubmitted
              ? "bg-emerald-600 text-white cursor-default"
              : "bg-muted text-muted-foreground cursor-not-allowed"
            }`}
        >
          {isSubmitted ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Waiting...</span>
            </>
          ) : (
            <>
              <Check className="w-3.5 h-3.5" />
              <span>Ready</span>
            </>
          )}
        </button>
      </div>

      <div className="text-center space-y-1.5">
        <p className="text-xs text-muted-foreground">
          Write 1 to 25 in your grid, in any order — or let us. Opponents never see it.
        </p>
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-secondary border border-border text-xs font-mono font-semibold text-foreground">
          <Clock className="w-3.5 h-3.5 text-muted-foreground" />
          <span>{timeLeft}s remaining</span>
        </div>
      </div>
    </div>
  );
}
