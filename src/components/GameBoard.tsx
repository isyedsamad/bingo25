"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Clock, Trophy, Flame, Sparkles, Loader2, Radio } from "lucide-react";
import { GameRoom, SlotKey, PlayerData } from "@/types/bingo";
import { PLAYER_COLORS, MOVE_TIME_LIMIT_SECONDS } from "@/config/appConfig";
import { checkLines } from "@/lib/bingoLogic";
import { soundManager } from "@/lib/soundEffects";

interface GameBoardProps {
  myBoard: number[];
  calledNumbers: number[];
  mySlotKey?: SlotKey | null;
  players: Record<string, PlayerData>;
  turnOrder: SlotKey[];
  currentTurnSlot: SlotKey;
  activeTurnStartTime: number;
  lastCall: { number: number; callerSlot: SlotKey } | null;
  onCallNumber: (num: number) => void;
  statusMessage?: string;
  isAiMode?: boolean;
}

export default function GameBoard({
  myBoard,
  calledNumbers,
  mySlotKey,
  players,
  turnOrder,
  currentTurnSlot,
  activeTurnStartTime,
  lastCall,
  onCallNumber,
  statusMessage,
  isAiMode = false
}: GameBoardProps) {
  const [timeLeft, setTimeLeft] = useState<number>(MOVE_TIME_LIMIT_SECONDS);

  const calledSet = useMemo(() => new Set(calledNumbers), [calledNumbers]);
  const isMyTurn = mySlotKey ? currentTurnSlot === mySlotKey : false;
  const myPlayer = mySlotKey ? players[mySlotKey] : null;
  const myColor = PLAYER_COLORS[myPlayer?.colorIndex ?? 0];

  const { completedLines, count: myLinesCount, completedIndices } = useMemo(() => {
    return checkLines(myBoard, calledNumbers);
  }, [myBoard, calledNumbers]);

  useEffect(() => {
    const checkTimer = () => {
      const elapsedSeconds = Math.floor((Date.now() - activeTurnStartTime) / 1000);
      const remaining = Math.max(0, MOVE_TIME_LIMIT_SECONDS - elapsedSeconds);
      setTimeLeft(remaining);

      if (remaining === 0 && isMyTurn) {
        const uncalled = myBoard.filter((num) => !calledSet.has(num));
        if (uncalled.length > 0) {
          const randomPick = uncalled[Math.floor(Math.random() * uncalled.length)];
          onCallNumber(randomPick);
        }
      }
    };

    checkTimer();
    const interval = setInterval(checkTimer, 1000);
    return () => clearInterval(interval);
  }, [activeTurnStartTime, isMyTurn, myBoard, calledSet, onCallNumber]);

  const handleNumberClick = (num: number) => {
    if (!isMyTurn) return;
    if (calledSet.has(num)) return;
    soundManager.playStrike();
    onCallNumber(num);
  };

  const GRID_PERCENT_OFFSETS = [9.2, 29.6, 50.0, 70.4, 90.8];

  const getSvgCoordinatesForIndex = (index: number) => {
    const row = Math.floor(index / 5);
    const col = index % 5;
    return {
      x: GRID_PERCENT_OFFSETS[col],
      y: GRID_PERCENT_OFFSETS[row]
    };
  };

  const lastCallerName = lastCall
    ? lastCall.callerSlot === mySlotKey
      ? "YOU"
      : players[lastCall.callerSlot]?.name?.slice(0, 5).toUpperCase() || lastCall.callerSlot
    : null;

  return (
    <div className="w-full max-w-lg mx-auto p-3 sm:p-4 space-y-4 animate-pop">
      <div className="flex gap-2 overflow-x-auto p-0.5 custom-scrollbar snap-x">
        {turnOrder.map((slot) => {
          const player = players[slot];
          if (!player) return null;
          const color = PLAYER_COLORS[player.colorIndex ?? 0];
          const isThisPlayerTurn = currentTurnSlot === slot;
          const isMe = mySlotKey === slot;
          const lines = isMe ? myLinesCount : player.linesCount || 0;

          return (
            <div
              key={slot}
              style={{
                borderColor: isThisPlayerTurn ? color.primary : undefined,
                boxShadow: isThisPlayerTurn ? `0 0 0 1.5px ${color.primary}40` : "none"
              }}
              className={`bg-card rounded-lg border p-2.5 shadow-2xs min-w-[150px] sm:min-w-[160px] flex-1 shrink-0 transition-all snap-start ${isThisPlayerTurn ? "border-primary" : "border-border"
                }`}
            >
              <div className="flex items-center justify-between gap-1 mb-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span style={{ backgroundColor: color.primary }} className="w-2 h-2 rounded-full shrink-0" />
                  <span className="text-xs font-semibold text-foreground truncate">
                    {player.name} {isMe && <span className="text-muted-foreground font-normal">(you)</span>}
                  </span>
                </div>

                {isThisPlayerTurn && (
                  <span
                    style={{ backgroundColor: color.primary }}
                    className="px-1.5 py-0.5 rounded text-white text-[8px] font-bold uppercase tracking-wider shrink-0 flex items-center gap-1 shadow-2xs animate-pulse"
                  >
                    CALLING
                  </span>
                )}
              </div>

              <div className="grid grid-cols-5 gap-1">
                {["B", "I", "N", "G", "O"].map((letter, idx) => {
                  const isStruck = idx < lines;
                  return (
                    <div
                      key={letter}
                      style={{
                        backgroundColor: isStruck ? color.primary : undefined,
                        color: isStruck ? "#FFFFFF" : undefined
                      }}
                      className={`h-6 rounded text-[11px] font-bold flex items-center justify-center transition-all ${isStruck
                        ? "letter-slash shadow-2xs"
                        : "bg-secondary border border-border text-muted-foreground"
                        }`}
                    >
                      {letter}
                    </div>
                  );
                })}
              </div>

              <div className="mt-1.5 text-center text-[11px] font-medium text-muted-foreground">
                {lines} {lines === 1 ? "line" : "lines"}
              </div>
            </div>
          );
        })}
      </div>

      <div className="modern-board-card p-3 sm:p-4 rounded-xl border border-border shadow-xs relative bg-card">
        <div className="relative max-w-[340px] mx-auto aspect-square z-10">
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-10 overflow-hidden" viewBox="0 0 100 100">
            {completedLines.map((line, lIdx) => {
              const start = getSvgCoordinatesForIndex(line[0]);
              const end = getSvgCoordinatesForIndex(line[4]);
              return (
                <line
                  key={lIdx}
                  x1={start.x}
                  y1={start.y}
                  x2={end.x}
                  y2={end.y}
                  stroke={myColor.primary}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  className="animate-line-draw opacity-90"
                />
              );
            })}
          </svg>

          <div className="grid grid-cols-5 gap-1.5 sm:gap-2 w-full h-full">
            {myBoard.map((num, idx) => {
              const isStruck = calledSet.has(num);
              const isInCompletedLine = completedIndices.has(idx);

              return (
                <button
                  key={idx}
                  onClick={() => handleNumberClick(num)}
                  disabled={!isMyTurn || isStruck}
                  style={{
                    backgroundColor: isInCompletedLine
                      ? myColor.softTint
                      : isStruck
                        ? undefined
                        : undefined
                  }}
                  className={`relative overflow-hidden rounded-lg font-bold text-lg sm:text-xl flex items-center justify-center transition-all aspect-square border ${isStruck
                    ? "cell-slash bg-secondary/50 text-muted-foreground border-border shadow-inner"
                    : isMyTurn
                      ? "bg-card text-foreground border-border hover:border-primary hover:shadow-xs cursor-pointer hover:scale-[1.02]"
                      : "bg-card text-foreground border-border shadow-2xs cursor-default"
                    }`}
                >
                  <span className={isStruck ? "opacity-35 leading-none" : "opacity-100 leading-none"}>{num}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="bg-card p-3 rounded-lg border border-border shadow-2xs flex items-center gap-3">
        {lastCall ? (
          <div className="w-12 h-12 rounded-lg bg-primary text-primary-foreground flex flex-col items-center justify-center shrink-0 shadow-2xs">
            <span className="text-lg font-bold leading-none">{lastCall.number}</span>
            <span className="text-[8px] font-bold text-primary-foreground/80 mt-0.5 tracking-wider truncate max-w-[42px] uppercase">
              {lastCallerName}
            </span>
          </div>
        ) : (
          <div className="w-12 h-12 rounded-lg bg-secondary text-muted-foreground flex flex-col items-center justify-center shrink-0 border border-border">
            <span className="text-xs font-semibold">Start</span>
          </div>
        )}

        <div className="flex-1 overflow-hidden">
          <div className="flex items-center gap-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
            <Radio className="w-3 h-3 text-primary animate-pulse" />
            <span>Called ({calledNumbers.length}/25)</span>
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
            {calledNumbers.length === 0 ? (
              <span className="text-xs text-muted-foreground italic">No numbers called yet</span>
            ) : (
              [...calledNumbers].reverse().map((num, i) => (
                <span
                  key={i}
                  className={`px-2 py-0.5 rounded text-xs font-semibold shrink-0 border ${i === 0
                    ? "bg-primary/10 border-primary/30 text-primary font-bold"
                    : "bg-secondary border-border text-secondary-foreground"
                    }`}
                >
                  {num}
                </span>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="text-center space-y-1.5">
        <div className="text-xs font-semibold text-foreground flex items-center justify-center gap-2">
          {statusMessage ? (
            <span>{statusMessage}</span>
          ) : isMyTurn ? (
            <>
              <Sparkles className="w-3.5 h-3.5 text-primary animate-pulse shrink-0" />
              <span>Your turn! Tap any number on your grid.</span>
            </>
          ) : (
            <>
              <Loader2 className="w-3.5 h-3.5 text-muted-foreground animate-spin shrink-0" />
              <span>Waiting for {players[currentTurnSlot]?.name || "opponent"} to call...</span>
            </>
          )}
        </div>

        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-secondary border border-border text-xs font-mono font-semibold text-foreground">
          <Clock className="w-3.5 h-3.5 text-muted-foreground" />
          <span>{timeLeft}s</span>
        </div>
      </div>
    </div>
  );
}
