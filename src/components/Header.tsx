"use client";

import React, { useState } from "react";
import { Volume2, VolumeX, HelpCircle, Star, Sparkles } from "lucide-react";
import { soundManager } from "@/lib/soundEffects";
import HowToPlayModal from "@/components/HowToPlayModal";

interface HeaderProps {
  onResetToHome?: () => void;
}

export default function Header({ onResetToHome }: HeaderProps) {
  const [muted, setMuted] = useState(!soundManager.enabled);
  const [showHowToPlay, setShowHowToPlay] = useState(false);

  const toggleSound = () => {
    soundManager.enabled = !soundManager.enabled;
    setMuted(!soundManager.enabled);
  };

  return (
    <>
      <header className="w-full max-w-xl mx-auto px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between gap-2 border-b border-border bg-card/90 backdrop-blur-md sticky top-0 z-30">
        <button
          onClick={onResetToHome}
          className="flex items-center gap-2 cursor-pointer hover:opacity-90 transition-opacity text-left min-w-0"
        >
          <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
            <span>25</span>
          </div>
          <div className="min-w-0">
            <div className="font-bold text-sm tracking-tight text-foreground flex items-center gap-1.5 truncate">
              Bingo25
              <span className="text-[10px] font-semibold text-primary bg-primary/10 px-1.5 py-0.2 rounded shrink-0">Classic</span>
            </div>
            <div className="text-[10px] sm:text-[11px] text-muted-foreground font-medium truncate">2 to 6 Players & vs AI</div>
          </div>
        </button>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={toggleSound}
            aria-label="Toggle sound"
            className="w-8 h-8 rounded-lg border border-border bg-card hover:bg-secondary text-foreground flex items-center justify-center transition-colors cursor-pointer"
          >
            {muted ? <VolumeX className="w-4 h-4 text-muted-foreground" /> : <Volume2 className="w-4 h-4 text-primary" />}
          </button>

          <button
            onClick={() => setShowHowToPlay(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-secondary text-foreground text-xs font-medium transition-colors cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5 text-muted-foreground" />
            <span>Rules</span>
          </button>
        </div>
      </header>

      {showHowToPlay && <HowToPlayModal onClose={() => setShowHowToPlay(false)} />}
    </>
  );
}
