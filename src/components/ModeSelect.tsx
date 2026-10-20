"use client";

import React, { useState } from "react";
import { Monitor, Link2, Users, Bot, ArrowRight, Sparkles, Loader2, Play, User, KeyRound } from "lucide-react";
import { AiDifficulty } from "@/types/bingo";

interface ModeSelectProps {
  onStartVsComputer: (difficulty: AiDifficulty, firstCall: "you" | "computer", playerName: string) => void;
  onStartOnlineRoom: (maxPlayers: number, hostName: string) => void;
  onJoinOnlineRoom: (code: string, playerName?: string) => void;
  initialCode?: string;
}

export default function ModeSelect({
  onStartVsComputer,
  onStartOnlineRoom,
  onJoinOnlineRoom,
  initialCode = ""
}: ModeSelectProps) {
  const [mode, setMode] = useState<"computer" | "online">("online");
  const [onlineTab, setOnlineTab] = useState<"start" | "join">(initialCode ? "join" : "start");
  const [computerDifficulty, setComputerDifficulty] = useState<AiDifficulty>("smart");
  const [firstCall, setFirstCall] = useState<"you" | "computer">("you");
  const [playerName, setPlayerName] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("bingo_player_name") || "Player";
    }
    return "Player";
  });
  const [maxPlayers, setMaxPlayers] = useState<number>(2);
  const [joinCode, setJoinCode] = useState(initialCode);
  const [loading, setLoading] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  const handleNameChange = (val: string) => {
    setPlayerName(val);
    if (typeof window !== "undefined") {
      localStorage.setItem("bingo_player_name", val);
    }
  };

  const handleStartComputer = () => {
    const finalName = playerName.trim() || "You";
    if (typeof window !== "undefined") {
      localStorage.setItem("bingo_player_name", finalName);
    }
    onStartVsComputer(computerDifficulty, firstCall, finalName);
  };

  const handleStartOnline = async () => {
    setLoading(true);
    try {
      const finalName = playerName.trim() || "Player 1";
      if (typeof window !== "undefined") {
        localStorage.setItem("bingo_player_name", finalName);
      }
      await onStartOnlineRoom(maxPlayers, finalName);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinOnline = async () => {
    if (!joinCode.trim()) return;
    setIsJoining(true);
    try {
      const finalName = playerName.trim() || "Player";
      if (typeof window !== "undefined") {
        localStorage.setItem("bingo_player_name", finalName);
      }
      await onJoinOnlineRoom(joinCode.trim().toUpperCase(), finalName);
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto px-2.5 sm:px-4 py-1.5 sm:py-2 space-y-3 sm:space-y-4">
      <div className="bg-card rounded-xl border border-border shadow-none p-4 sm:p-6 space-y-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
            Bingo25
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
            Fill your 5×5 grid. Take turns calling numbers,{" "}
            <span className="font-semibold text-primary">strike a letter for each completed line.</span>
          </p>
        </div>

        <div className="grid grid-cols-2 gap-1 p-1 bg-secondary rounded-lg">
          <button
            onClick={() => setMode("computer")}
            className={`flex items-center justify-center gap-1.5 py-1.5 sm:py-2 rounded-md font-medium text-xs sm:text-sm transition-all cursor-pointer whitespace-nowrap ${mode === "computer"
              ? "bg-card text-foreground shadow-xs border border-border"
              : "text-muted-foreground hover:text-foreground"
              }`}
          >
            <Monitor className="w-3.5 h-3.5 shrink-0" />
            <span>vs AI</span>
          </button>

          <button
            onClick={() => setMode("online")}
            className={`flex items-center justify-center gap-1.5 py-1.5 sm:py-2 rounded-md font-medium text-xs sm:text-sm transition-all cursor-pointer whitespace-nowrap ${mode === "online"
              ? "bg-card text-foreground shadow-xs border border-border"
              : "text-muted-foreground hover:text-foreground"
              }`}
          >
            <Link2 className="w-3.5 h-3.5 shrink-0" />
            <span>Room</span>
          </button>
        </div>

        {mode === "computer" ? (
          <div className="space-y-4 pt-1">
            <div className="flex flex-wrap items-center justify-between gap-0">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Difficulty</span>
              <div className="flex gap-1">
                {(["casual", "smart", "expert"] as const).map((diff) => (
                  <button
                    key={diff}
                    onClick={() => setComputerDifficulty(diff)}
                    className={`px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-md text-xs font-medium capitalize transition-all cursor-pointer ${computerDifficulty === diff
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border"
                      }`}
                  >
                    {diff}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-0">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">First Turn</span>
              <div className="flex gap-1">
                {(["you", "computer"] as const).map((fc) => (
                  <button
                    key={fc}
                    onClick={() => setFirstCall(fc)}
                    className={`px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-md text-xs font-medium capitalize transition-all cursor-pointer ${firstCall === fc
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border"
                      }`}
                  >
                    {fc}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-0.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                {/* <User className="w-3.5 h-3.5 text-muted-foreground" /> */}
                Your Name
              </label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => handleNameChange(e.target.value)}
                maxLength={15}
                className="w-full px-3 py-2 sm:py-2 rounded-lg border border-border bg-background text-foreground text-xs sm:text-sm font-medium focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring transition-all placeholder:text-muted-foreground"
                placeholder="Enter your name"
              />
            </div>

            <button
              onClick={handleStartComputer}
              className="w-full py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer text-xs sm:text-sm"
            >
              <Play className="w-4 h-4 fill-current" />
              Start Game
            </button>
          </div>
        ) : (
          <div className="space-y-3 pt-0.5">
            <div className="grid grid-cols-2 gap-1 p-1 bg-secondary rounded-lg">
              <button
                onClick={() => setOnlineTab("start")}
                className={`py-2 text-xs font-medium rounded-md transition-all cursor-pointer ${onlineTab === "start" ? "bg-card text-foreground shadow-xs border border-border" : "text-muted-foreground hover:text-foreground"
                  }`}
              >
                Create
              </button>
              <button
                onClick={() => setOnlineTab("join")}
                className={`py-2 text-xs font-medium rounded-md transition-all cursor-pointer ${onlineTab === "join" ? "bg-card text-foreground shadow-xs border border-border" : "text-muted-foreground hover:text-foreground"
                  }`}
              >
                Join
              </button>
            </div>

            {onlineTab === "start" ? (
              <div className="space-y-4 mt-3">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Players</span>
                    <span className="text-[11px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded">
                      {maxPlayers} Players
                    </span>
                  </div>
                  <div className="grid grid-cols-5 gap-1">
                    {[2, 3, 4, 5, 6].map((num) => (
                      <button
                        key={num}
                        onClick={() => setMaxPlayers(num)}
                        className={`py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${maxPlayers === num
                          ? "bg-primary border-primary text-primary-foreground shadow-xs"
                          : "bg-background border-border text-foreground hover:bg-secondary"
                          }`}
                      >
                        {num}P
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-0.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    {/* <User className="w-3.5 h-3.5 text-muted-foreground" /> */}
                    Your Name
                  </label>
                  <input
                    type="text"
                    value={playerName}
                    onChange={(e) => handleNameChange(e.target.value)}
                    maxLength={15}
                    className="w-full px-3 py-2 sm:py-2 rounded-lg border border-border bg-background text-foreground text-xs sm:text-sm font-medium focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring transition-all placeholder:text-muted-foreground"
                    placeholder="Enter your name"
                  />
                </div>

                <button
                  onClick={handleStartOnline}
                  disabled={loading}
                  className="w-full py-3 bg-primary hover:bg-primary/90 disabled:opacity-60 text-primary-foreground font-semibold rounded-lg shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer text-xs sm:text-sm"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Creating room...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Create Room</span>
                    </>
                  )}
                </button>
                <p className="text-[10px] text-muted-foreground text-center -mt-1.5">
                  You&apos;ll get a link and 6-character code to share.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-muted-foreground" />
                    Your Name
                  </label>
                  <input
                    type="text"
                    value={playerName}
                    onChange={(e) => handleNameChange(e.target.value)}
                    maxLength={15}
                    className="w-full px-3 py-1.5 sm:py-2 rounded-lg border border-border bg-background text-foreground text-xs sm:text-sm font-medium focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring transition-all placeholder:text-muted-foreground"
                    placeholder="Enter your name"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-muted-foreground" />
                    Room Code
                  </label>
                  <input
                    type="text"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    maxLength={8}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm sm:text-base font-bold tracking-widest uppercase text-center focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring transition-all placeholder:text-muted-foreground"
                    placeholder="e.g. 3X3B9B"
                  />
                </div>

                <button
                  onClick={handleJoinOnline}
                  disabled={!joinCode.trim() || isJoining}
                  className="w-full py-2 sm:py-2.5 bg-foreground hover:bg-foreground/90 disabled:opacity-60 text-background font-semibold rounded-lg shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer text-xs sm:text-sm"
                >
                  {isJoining ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Joining Room...</span>
                    </>
                  ) : (
                    <>
                      <ArrowRight className="w-4 h-4" />
                      <span>Join Room</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="bg-secondary/40 rounded-xl border border-border p-3.5 sm:p-5 space-y-2 text-xs text-muted-foreground shadow-2xs">
        <h2 className="text-sm font-bold text-foreground">How Bingo25 Works</h2>
        <p className="leading-relaxed">
          The classic 5×5 pen-and-paper game: place numbers 1 to 25 wherever you like. Players take turns calling one number each round. Every player marks called numbers on their own board until someone strikes 5 lines for B-I-N-G-O!
        </p>

        <ul className="space-y-1.5 pt-1">
          <li className="flex items-start gap-2">
            <span className="font-semibold text-foreground shrink-0">• vs Computer:</span>Casual, Smart, or Expert AI.
          </li>
          <li className="flex items-start gap-2">
            <span className="font-semibold text-foreground shrink-0">• 2 to 6 Players Online:</span> Private rooms with live turn coordination.
          </li>
          <li className="flex items-start gap-2">
            <span className="font-semibold text-foreground shrink-0">• 20s Auto Timer:</span> Smooth, uninterrupted pacing.
          </li>
        </ul>
      </div>
    </div>
  );
}
