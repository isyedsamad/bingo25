"use client";

import React, { useState } from "react";
import { Copy, Check, Users, Play, Crown, Trophy, Edit2, Loader2, UserPlus, ArrowLeft, LogOut } from "lucide-react";
import { GameRoom, SlotKey } from "@/types/bingo";
import { PLAYER_COLORS, APP_BASE_URL } from "@/config/appConfig";
import { claimPlayerSlot, startFillingPhase, leavePlayerSlot } from "@/lib/firestoreService";

interface RoomLobbyProps {
  room: GameRoom;
  mySlotKey: SlotKey | null;
  onSlotClaimed: (slotKey: SlotKey) => void;
  onBackToHome: () => void;
}

export default function RoomLobby({
  room,
  mySlotKey,
  onSlotClaimed,
  onBackToHome
}: RoomLobbyProps) {
  const [copied, setCopied] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [customName, setCustomName] = useState(() => {
    if (mySlotKey && room.players[mySlotKey]) {
      return room.players[mySlotKey].name;
    }
    if (typeof window !== "undefined") {
      return localStorage.getItem("bingo_player_name") || "";
    }
    return "";
  });
  const [claimingSlot, setClaimingSlot] = useState<SlotKey | null>(null);

  const inviteUrl = `${APP_BASE_URL}/${room.code}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      const input = document.createElement("input");
      input.value = inviteUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  };

  const handleClaim = async (slot: SlotKey) => {
    setClaimingSlot(slot);
    try {
      const defaultName = customName.trim() || `Player ${slot.replace("P", "")}`;
      if (typeof window !== "undefined" && customName.trim()) {
        localStorage.setItem("bingo_player_name", customName.trim());
      }
      const res = await claimPlayerSlot(room.id, slot, defaultName);
      if (res.success) {
        onSlotClaimed(slot);
      }
    } finally {
      setClaimingSlot(null);
    }
  };

  const handleSaveName = async () => {
    if (!mySlotKey || !customName.trim()) return;
    const trimmed = customName.trim();
    if (typeof window !== "undefined") {
      localStorage.setItem("bingo_player_name", trimmed);
    }
    await claimPlayerSlot(room.id, mySlotKey, trimmed);
    setEditingName(false);
  };

  const handleStartGame = async () => {
    setIsStarting(true);
    try {
      await startFillingPhase(room.id);
    } finally {
      setIsStarting(false);
    }
  };

  const handleLeaveRoom = async () => {
    setIsLeaving(true);
    try {
      if (mySlotKey) {
        await leavePlayerSlot(room.id, mySlotKey);
      }
    } finally {
      setIsLeaving(false);
      onBackToHome();
    }
  };

  const claimedCount = Object.values(room.players).filter((p) => p.claimed).length;
  const isHost = mySlotKey === "P1" || (mySlotKey && room.players[mySlotKey]?.isHost);
  const canStart = claimedCount >= 2;

  return (
    <div className="w-full max-w-lg mx-auto px-4 py-2 space-y-4 animate-pop">
      <div className="bg-card rounded-xl border border-border shadow-none p-5 sm:p-6 text-center space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-border/40">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
            <Users className="w-3.5 h-3.5 text-primary" />
            <span>Room Lobby</span>
          </div>
          <button
            onClick={handleLeaveRoom}
            disabled={isLeaving}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium text-destructive hover:bg-destructive/10 border border-destructive/20 transition-all cursor-pointer"
          >
            {isLeaving ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <LogOut className="w-3 h-3" />
            )}
            <span>Leave Room</span>
          </button>
        </div>

        <div>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
            Share the code with up to {room.maxPlayers} players. The round will start once the host launches the game.
          </p>

          <div className="mt-3 inline-block font-mono text-2xl sm:text-3xl font-bold tracking-widest text-foreground bg-secondary px-5 py-2 rounded-lg border border-border shadow-2xs">
            {room.code}
          </div>

          <div className="mt-2.5">
            <button
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-secondary text-foreground text-xs font-medium shadow-2xs transition-all cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-600 font-semibold">Link Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>Copy invite link</span>
                </>
              )}
            </button>
          </div>
        </div>

        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-semibold px-0.5">
            <span>PLAYERS ({claimedCount}/{room.maxPlayers})</span>
            {room.roundNumber > 1 && (
              <span className="text-primary font-bold flex items-center gap-1">
                <Trophy className="w-3.5 h-3.5" />
                Round {room.roundNumber}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {Object.keys(room.players)
              .sort()
              .map((slotKey) => {
                const slot = slotKey as SlotKey;
                const player = room.players[slot];
                const color = PLAYER_COLORS[player?.colorIndex ?? 0];
                const isMe = mySlotKey === slot;
                const isClaimed = player?.claimed;

                return (
                  <div
                    key={slot}
                    style={{ borderColor: isClaimed ? color.border : undefined }}
                    className={`px-3 py-2.5 rounded-lg border flex items-center justify-between transition-all ${isClaimed ? "bg-card shadow-2xs border-border" : "bg-secondary/30 border-dashed border-border"
                      }`}
                  >
                    <div className="flex items-center gap-3 truncate">
                      <div
                        style={{ backgroundColor: color.primary }}
                        className="w-2.5 h-2.5 rounded-full shrink-0 shadow-2xs"
                      />
                      <div className="text-left truncate">
                        <div className="text-xs font-semibold text-foreground flex items-center gap-1 truncate">
                          {isClaimed ? player.name : `Slot ${slot}`}
                          {isMe && (
                            <span className="text-[10px] text-primary font-bold">
                              (you)
                            </span>
                          )}
                          {player.isHost && !isMe && (
                            <Crown className="w-3 h-3 text-amber-500 shrink-0" />
                          )}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          {isClaimed ? (
                            <span>{player.totalScore || 0} pts</span>
                          ) : (
                            <span className="text-muted-foreground/60">waiting...</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {!isClaimed && !mySlotKey && (
                      <button
                        onClick={() => handleClaim(slot)}
                        disabled={claimingSlot === slot}
                        className="px-2.5 py-1 bg-primary hover:bg-primary/90 text-primary-foreground text-[11px] font-semibold rounded-md transition-colors cursor-pointer shrink-0 flex items-center gap-1 shadow-2xs"
                      >
                        {claimingSlot === slot ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin" />
                            <span>Claiming...</span>
                          </>
                        ) : (
                          <>
                            <UserPlus className="w-3 h-3" />
                            <span>Claim</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                );
              })}
          </div>
        </div>

        {mySlotKey && (
          <div className="bg-secondary/40 p-2.5 rounded-lg border border-border flex items-center justify-between text-xs">
            {editingName ? (
              <div className="flex items-center gap-2 w-full">
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  maxLength={15}
                  className="px-2.5 py-1 bg-background border border-border rounded-md text-xs font-semibold text-foreground w-full focus:outline-none focus:ring-1 focus:ring-ring"
                  placeholder="Your Name"
                />
                <button
                  onClick={handleSaveName}
                  className="px-3 py-1 bg-primary text-primary-foreground rounded-md font-semibold shrink-0 cursor-pointer text-xs flex items-center gap-1"
                >
                  <Check className="w-3 h-3" />
                  Save
                </button>
              </div>
            ) : (
              <>
                <span className="text-muted-foreground font-medium truncate">
                  Playing as: <strong className="text-foreground">{room.players[mySlotKey]?.name}</strong>
                </span>
                <button
                  onClick={() => setEditingName(true)}
                  className="text-primary font-semibold flex items-center gap-1 hover:underline cursor-pointer shrink-0 text-xs"
                >
                  <Edit2 className="w-3 h-3" />
                  Edit
                </button>
              </>
            )}
          </div>
        )}

        <div className="space-y-2 pt-1">
          {isHost ? (
            <button
              onClick={handleStartGame}
              disabled={!canStart || isStarting}
              className={`w-full py-2.5 font-semibold rounded-lg shadow-xs transition-all flex items-center justify-center gap-2 text-sm cursor-pointer ${canStart && !isStarting
                ? "bg-primary hover:bg-primary/90 text-primary-foreground"
                : "bg-muted text-muted-foreground cursor-not-allowed"
                }`}
            >
              {isStarting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Starting Game...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Start Game</span>
                </>
              )}
            </button>
          ) : (
            <div className="py-2.5 px-4 rounded-lg bg-secondary text-muted-foreground font-medium text-xs flex items-center justify-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
              <span>Waiting for host to start the game...</span>
            </div>
          )}

          <p className="text-[11px] text-muted-foreground">
            {!canStart ? "Waiting for at least 2 players to join..." : `${claimedCount} players ready to play!`}
          </p>
        </div>
      </div>

      <div className="text-center">
        <button
          onClick={handleLeaveRoom}
          disabled={isLeaving}
          className="text-xs font-medium text-muted-foreground hover:text-destructive transition-colors cursor-pointer inline-flex items-center gap-1.5"
        >
          {isLeaving ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <LogOut className="w-3.5 h-3.5" />
          )}
          <span>Leave Room</span>
        </button>
      </div>
    </div>
  );
}
