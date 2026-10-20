"use client";

import React, { useEffect, useState } from "react";
import confetti from "canvas-confetti";
import { Trophy, Share2, RefreshCw, Award, Bot, Sparkles, Loader2, Home } from "lucide-react";
import { GameRoom, SlotKey, PlayerData } from "@/types/bingo";
import { PLAYER_COLORS, APP_BASE_URL } from "@/config/appConfig";
import { checkLines } from "@/lib/bingoLogic";
import { soundManager } from "@/lib/soundEffects";

interface GameOverModalProps {
  room?: GameRoom | null;
  mySlotKey?: SlotKey | null;
  calledNumbers: number[];
  myBoard: number[];
  aiBoard?: number[];
  aiName?: string;
  isAiMode?: boolean;
  onNextRound: () => void;
  onPlayVsComputer?: () => void;
  onBackToHome: () => void;
}

export default function GameOverModal({
  room,
  mySlotKey,
  calledNumbers,
  myBoard,
  aiBoard,
  aiName = "Computer",
  isAiMode = false,
  onNextRound,
  onPlayVsComputer,
  onBackToHome
}: GameOverModalProps) {
  const [isRestarting, setIsRestarting] = useState(false);
  const myLinesCount = checkLines(myBoard, calledNumbers).count;
  const aiLinesCount = aiBoard ? checkLines(aiBoard, calledNumbers).count : 0;
  let myRank: number = 1;
  let aiRank: number = 2;
  let isWinner: boolean = false;
  let isTie: boolean = false;

  if (isAiMode) {
    if (myLinesCount >= 5 && aiLinesCount < 5) {
      myRank = 1;
      aiRank = 2;
      isWinner = true;
    } else if (aiLinesCount >= 5 && myLinesCount < 5) {
      myRank = 2;
      aiRank = 1;
      isWinner = false;
    } else if (myLinesCount >= 5 && aiLinesCount >= 5) {
      if (myLinesCount > aiLinesCount) {
        myRank = 1;
        aiRank = 2;
        isWinner = true;
      } else if (aiLinesCount > myLinesCount) {
        myRank = 2;
        aiRank = 1;
        isWinner = false;
      } else {
        myRank = 1;
        aiRank = 1;
        isTie = true;
        isWinner = false;
      }
    } else {
      if (myLinesCount > aiLinesCount) {
        myRank = 1;
        aiRank = 2;
        isWinner = true;
      } else if (aiLinesCount > myLinesCount) {
        myRank = 2;
        aiRank = 1;
        isWinner = false;
      } else {
        myRank = 1;
        aiRank = 1;
        isTie = true;
        isWinner = false;
      }
    }
  } else if (room && mySlotKey) {
    myRank = room.players[mySlotKey]?.rank ?? (room.rankings.indexOf(mySlotKey) + 1 || 1);
    isWinner = room.rankings?.[0] === mySlotKey;
  } else {
    isWinner = myLinesCount >= 5;
  }

  useEffect(() => {
    if (isWinner) {
      soundManager.playWin();
      confetti({
        particleCount: 110,
        spread: 80,
        origin: { y: 0.6 }
      });
    } else {
      soundManager.playLose();
    }
  }, [isWinner]);

  const handleShare = async () => {
    const text = `I just finished a match on Bingo25 after ${calledNumbers.length} calls! Play with me: ${APP_BASE_URL}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "Bingo25", text, url: APP_BASE_URL });
      } catch { }
    } else {
      await navigator.clipboard.writeText(text);
      alert("Results copied to clipboard!");
    }
  };

  const calledSet = new Set(calledNumbers);

  const GRID_PERCENT_OFFSETS = [9.2, 29.6, 50.0, 70.4, 90.8];

  const getSvgCoordinatesForIndex = (index: number) => {
    const row = Math.floor(index / 5);
    const col = index % 5;
    return {
      x: GRID_PERCENT_OFFSETS[col],
      y: GRID_PERCENT_OFFSETS[row]
    };
  };

  const renderMiniBoard = (
    title: string,
    board: number[],
    colorIndex: number,
    rank: number | null
  ) => {
    const color = PLAYER_COLORS[colorIndex % PLAYER_COLORS.length];
    const { completedLines, count: linesCount, completedIndices } = checkLines(board, calledNumbers);

    return (
      <div key={title} className="w-[185px] sm:w-[220px] shrink-0 snap-center space-y-1.5 text-left">
        <div className="flex items-center justify-between text-xs font-bold gap-1.5">
          <span style={{ color: color.primary }} className="truncate font-semibold max-w-[105px]">
            {title}
          </span>
          <span className="text-muted-foreground text-[10px] sm:text-[11px] shrink-0 font-medium">
            {linesCount} {linesCount === 1 ? "line" : "lines"}
            {rank && <span className="ml-1 text-primary font-bold">#{rank}</span>}
          </span>
        </div>

        <div className="bg-card p-2 rounded-lg border border-border shadow-2xs relative aspect-square overflow-hidden">
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
                  stroke={color.primary}
                  strokeWidth="4"
                  strokeLinecap="round"
                  className="opacity-90"
                />
              );
            })}
          </svg>

          <div className="grid grid-cols-5 gap-1 w-full h-full">
            {board.map((num, idx) => {
              const isStruck = calledSet.has(num);
              const isInCompletedLine = completedIndices.has(idx);

              return (
                <div
                  key={idx}
                  style={{
                    backgroundColor: isInCompletedLine ? color.softTint : isStruck ? "#F9FAFB" : "#FFFFFF"
                  }}
                  className={`rounded-lg flex items-center justify-center font-bold text-[11px] sm:text-xs relative overflow-hidden border ${isStruck ? "cell-slash text-stone-400 border-stone-200" : "text-stone-900 border-stone-200"
                    }`}
                >
                  <span className={isStruck ? "opacity-35 leading-none" : "opacity-100 leading-none"}>{num}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const rankTitle = isTie
    ? "It's a Tie! 🤝"
    : isWinner
      ? "BINGO! You won 🏆"
      : isAiMode
        ? `${aiName} Won! 🤖`
        : myRank === 2
          ? "2nd Place! 🥈"
          : myRank === 3
            ? "3rd Place! 🥉"
            : "Match Complete! 🎖️";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/50 backdrop-blur-xs animate-pop">
      <div className="bg-card rounded-xl border border-border shadow-lg max-w-xl w-full max-h-[92vh] overflow-y-auto p-4 sm:p-6 text-center space-y-3.5 sm:space-y-4 custom-scrollbar">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight flex items-center justify-center gap-2">
            {rankTitle}
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Match ended after <strong className="text-foreground">{calledNumbers.length}</strong> calls.
          </p>
        </div>

        <div className="w-full flex gap-2.5 overflow-x-auto pb-2 pt-1 custom-scrollbar snap-x snap-mandatory justify-start sm:justify-center px-1">
          {isAiMode ? (
            <>
              {myRank <= aiRank ? (
                <>
                  {renderMiniBoard("You", myBoard, 0, myRank)}
                  {aiBoard && renderMiniBoard(aiName, aiBoard, 1, aiRank)}
                </>
              ) : (
                <>
                  {aiBoard && renderMiniBoard(aiName, aiBoard, 1, aiRank)}
                  {renderMiniBoard("You", myBoard, 0, myRank)}
                </>
              )}
            </>
          ) : room ? (
            Object.values(room.players)
              .filter((p) => p.claimed)
              .sort((a, b) => (a.rank || 99) - (b.rank || 99))
              .map((p) =>
                renderMiniBoard(
                  p.slotKey === mySlotKey ? `${p.name} (you)` : p.name,
                  p.board && p.board.length === 25 ? p.board : myBoard,
                  p.colorIndex,
                  p.rank
                )
              )
          ) : (
            renderMiniBoard("You", myBoard, 0, 1)
          )}
        </div>

        {((isAiMode && aiBoard) || (room && Object.values(room.players).filter((p) => p.claimed).length > 1)) && (
          <p className="text-[10px] text-muted-foreground sm:hidden -mt-1">
            Scroll horizontally to view all boards →
          </p>
        )}

        {room && (
          <div className="bg-secondary/40 rounded-lg border border-border p-3 text-left space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-foreground">
              <span className="flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5 text-primary" />
                Room Leaderboard (Round {room.roundNumber})
              </span>
              <span className="text-[10px] text-muted-foreground">Standing</span>
            </div>

            <div className="space-y-1.5">
              {Object.values(room.players)
                .filter((p) => p.claimed)
                .sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0))
                .map((p, idx) => {
                  const color = PLAYER_COLORS[p.colorIndex % PLAYER_COLORS.length];
                  return (
                    <div
                      key={p.slotKey}
                      className="flex items-center justify-between p-2 rounded-md bg-card border border-border text-xs shadow-2xs"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="font-bold text-muted-foreground w-4">{idx + 1}</span>
                        <span style={{ backgroundColor: color.primary }} className="w-2 h-2 rounded-full shrink-0" />
                        <span className="font-medium text-foreground truncate">
                          {p.name} {p.slotKey === mySlotKey && "(you)"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2.5 shrink-0 font-medium">
                        <span className="text-emerald-600 font-semibold">+{p.roundPoints || 0} pts</span>
                        <span className="text-foreground bg-secondary px-1.5 py-0.5 rounded text-[11px]">
                          {p.totalScore || 0} total
                        </span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-1">
          <button
            onClick={async () => {
              setIsRestarting(true);
              try {
                await onNextRound();
              } finally {
                setIsRestarting(false);
              }
            }}
            disabled={isRestarting}
            className="w-full sm:w-auto px-5 py-2.5 bg-primary hover:bg-primary/90 disabled:opacity-60 text-primary-foreground font-semibold rounded-lg shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer text-xs sm:text-sm"
          >
            {isRestarting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Restarting...</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                <span>Play Again</span>
              </>
            )}
          </button>

          <button
            onClick={handleShare}
            className="w-full sm:w-auto px-4 py-2.5 bg-secondary hover:bg-secondary/80 text-secondary-foreground font-medium rounded-lg border border-border shadow-2xs transition-all flex items-center justify-center gap-2 cursor-pointer text-xs sm:text-sm"
          >
            <Share2 className="w-4 h-4 text-muted-foreground" />
            Share Result
          </button>

          <button
            onClick={onBackToHome}
            className="w-full sm:w-auto px-3.5 py-2 text-muted-foreground hover:text-foreground font-medium text-xs cursor-pointer transition-colors inline-flex items-center justify-center gap-1.5"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Home</span>
          </button>
        </div>
      </div>
    </div>
  );
}
