"use client";

import React from "react";
import { X, Award, CheckCircle2, Clock, Users, Flame } from "lucide-react";

interface HowToPlayModalProps {
  onClose: () => void;
}

export default function HowToPlayModal({ onClose }: HowToPlayModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-pop">
      <div className="bg-card border border-border rounded-xl max-w-lg w-full max-h-[85vh] overflow-y-auto shadow-xl p-5 sm:p-6 relative custom-scrollbar">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-7 h-7 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground flex items-center justify-center transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <h2 className="text-xl font-bold text-foreground mb-1">How to Play Bingo25</h2>
        <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
          The classic 25-box notebook grid game.
        </p>

        <div className="space-y-3 text-xs text-foreground">
          <div className="bg-secondary/40 p-3 rounded-lg border border-border flex items-start gap-3">
            <div className="w-6 h-6 rounded-md bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0 text-xs">1</div>
            <div>
              <div className="font-semibold text-foreground text-xs mb-0.5">Fill Your 5×5 Grid</div>
              <div className="text-muted-foreground leading-normal text-[11px]">
                Place numbers 1 to 25 into any box you like, or tap <strong>Auto-fill</strong>. Opponents never see your board until the end.
              </div>
            </div>
          </div>

          <div className="bg-secondary/40 p-3 rounded-lg border border-border flex items-start gap-3">
            <div className="w-6 h-6 rounded-md bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0 text-xs">2</div>
            <div>
              <div className="font-semibold text-foreground text-xs mb-0.5">Take Turns Calling Numbers</div>
              <div className="text-muted-foreground leading-normal text-[11px]">
                Players take turns calling any uncalled number. When called, every player strikes it off their board.
              </div>
            </div>
          </div>

          <div className="bg-secondary/40 p-3 rounded-lg border border-border flex items-start gap-3">
            <div className="w-6 h-6 rounded-md bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0 text-xs">
              <Clock className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="font-semibold text-foreground text-xs mb-0.5">20-Second Turn Timer</div>
              <div className="text-muted-foreground leading-normal text-[11px]">
                Each player has 20 seconds to make a call so games stay dynamic and fast-paced.
              </div>
            </div>
          </div>

          <div className="bg-secondary/40 p-3 rounded-lg border border-border flex items-start gap-3">
            <div className="w-6 h-6 rounded-md bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0 text-xs">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="font-semibold text-foreground text-xs mb-0.5">Strike B - I - N - G - O</div>
              <div className="text-muted-foreground leading-normal text-[11px]">
                Complete any row, column, or diagonal to strike a letter: <strong>B</strong>, <strong>I</strong>, <strong>N</strong>, <strong>G</strong>, <strong>O</strong>. Five lines spells BINGO!
              </div>
            </div>
          </div>

          <div className="bg-secondary/40 p-3 rounded-lg border border-border flex items-start gap-3">
            <div className="w-6 h-6 rounded-md bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0 text-xs">
              <Flame className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="font-semibold text-foreground text-xs mb-0.5">Multiplayer Elimination</div>
              <div className="text-muted-foreground leading-normal text-[11px]">
                In 3–6 player matches, players who reach BINGO take 1st, 2nd, etc. Remaining players battle until 1 loser remains!
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="mt-5 w-full py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg shadow-xs transition-all cursor-pointer text-xs"
        >
          Got it, let&apos;s play!
        </button>
      </div>
    </div>
  );
}
