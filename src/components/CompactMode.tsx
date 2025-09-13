import { AnimatePresence, motion } from 'framer-motion';
import {
  Minus, MinusIcon, MoreVertical, Pause, Play, Plus, SkipForward, Timer, X
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { invoke } from '@tauri-apps/api/core';
import { Button } from '../ui/button';
import { YouTubeAnchor } from '../player/YouTubeOverlay';

interface CompactModeProps {
  timeLeft: number;
  isRunning: boolean;
  activeTab: string;
  customTimes: { focus: number; shortBreak: number; longBreak: number };
  currentQuote: { en: string; vi: string }; // now receive both languages
  onStart: () => void;
  onPause: () => void;
  onNext: () => void;
  onTabChange: (tab: string) => void;
  getProgress: () => number;
  formatTime: (seconds: number) => string;
  getTabIcon: (tab: string) => JSX.Element;
  youtubeUrl: string;
  getYouTubeEmbedUrl: (url: string) => string;
  onWorkTimeChange: (value: number) => void;
  onShortBreakTimeChange: (value: number) => void;
  onLongBreakTimeChange: (value: number) => void;
  onYouTubeUrlChange?: (url: string) => void;
  onAnimationComplete?: () => void; // trigger next random quote after both lines done
}

export function CompactMode({
  timeLeft,
  isRunning,
  activeTab,
  customTimes,
  currentQuote,
  onStart,
  onPause,
  onNext,
  onTabChange,
  getProgress,
  formatTime,
  getTabIcon,
  youtubeUrl,
  getYouTubeEmbedUrl,
  onWorkTimeChange,
  onShortBreakTimeChange,
  onLongBreakTimeChange,
  onYouTubeUrlChange,
  onAnimationComplete,
}: CompactModeProps) {
  const [showSettings, setShowSettings] = useState(false);
  const [roundsPerCycle, setRoundsPerCycle] = useState(4);
  const [quoteSpeed, setQuoteSpeed] = useState("Normal");
  const [showQuotes, setShowQuotes] = useState(true);
  const [tempYoutube, setTempYoutube] = useState(youtubeUrl);
  const [isHovered, setIsHovered] = useState(false);
  const hoverTimeoutRef = useRef<number | null>(null);
  const settingsRef = useRef<HTMLDivElement>(null); // root container
  const panelRef = useRef<HTMLDivElement>(null);     // settings panel element
  const toggleBtnRef = useRef<HTMLButtonElement>(null); // settings toggle button
  // Quote animation refs & state (similar to MiniMode but simplified)
  const quoteContainerRef = useRef<HTMLDivElement>(null);
  const [animationDuration, setAnimationDuration] = useState(15);
  const [animationTarget, setAnimationTarget] = useState("-120%");
  const [animationKey, setAnimationKey] = useState(0);
  const [enDone, setEnDone] = useState(false);
  const [viDone, setViDone] = useState(false);
  const [cycleDone, setCycleDone] = useState(false);

  // Handle hover with delay (like MiniMode)
  const handleMouseEnter = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setIsHovered(false);
    }, 2000); // 2 seconds delay
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);


  // Close settings when clicking outside the panel (but allow clicks on toggle button)
  useEffect(() => {
    if (!showSettings) return;
    const handleMouseDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        panelRef.current &&
        !panelRef.current.contains(target) &&
        toggleBtnRef.current &&
        !toggleBtnRef.current.contains(target)
      ) {
        setShowSettings(false);
      }
    };
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [showSettings]);

  const modeLabel =
    activeTab === "focus"
      ? "Focus"
      : activeTab === "shortBreak"
        ? "Short Break"
        : "Long Break";

  // Recalculate scroll animation when quote changes
  useEffect(() => {
    if (!showQuotes) return; // skip calc if hidden
    const calc = () => {
      if (!quoteContainerRef.current) return;
      const containerRect = quoteContainerRef.current.getBoundingClientRect();

      // temp element to measure widths
      const temp = document.createElement('div');
      temp.style.position = 'absolute';
      temp.style.visibility = 'hidden';
      temp.style.whiteSpace = 'nowrap';
      temp.style.fontSize = '12px'; // text-xs
      temp.style.fontWeight = '500';
      temp.style.fontStyle = 'italic';
      document.body.appendChild(temp);
      temp.textContent = `"${currentQuote.en}"`;
      const enWidth = temp.offsetWidth;
      temp.textContent = `"${currentQuote.vi}"`;
      const viWidth = temp.offsetWidth;
      document.body.removeChild(temp);

      const maxWidth = Math.max(enWidth, viWidth);
      const containerWidth = containerRect.width;
      const distance = containerWidth + maxWidth; // travel distance
      const speed = 30; // px/s
      const duration = Math.max(5, Math.min(40, distance / speed));
      setAnimationDuration(duration);
      const targetPct = (maxWidth / containerWidth * 100) + 100;
      setAnimationTarget(`-${targetPct}%`);
      setAnimationKey(k => k + 1);
      setEnDone(false); setViDone(false); setCycleDone(false);
    };
    // slight delay to ensure DOM ready
    const id = setTimeout(calc, 80);
    const handleResize = () => setTimeout(calc, 120);
    window.addEventListener('resize', handleResize);
    return () => { clearTimeout(id); window.removeEventListener('resize', handleResize); };
  }, [currentQuote, showQuotes]);

  // When both lines finished, trigger callback
  useEffect(() => {
    if (enDone && viDone && !cycleDone) {
      setCycleDone(true);
      setTimeout(() => {
        onAnimationComplete?.();
      }, 120);
    }
  }, [enDone, viDone, cycleDone, onAnimationComplete]);

  return (
    <div 
      className="relative h-full" 
      ref={settingsRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Hover Header Bar - Fade in/out */}
      <AnimatePresence mode="sync" initial={false}>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute top-0 left-0 right-0 h-[30px] z-50 bg-gray-900/80 backdrop-blur-sm border-b border-gray-600/50"
            data-tauri-drag-region
            style={{ pointerEvents: 'auto' }}
          >
            <div className="flex items-center justify-between px-4 h-full">
              <div className="flex items-center gap-2" data-tauri-drag-region>
                <div className="w-2.5 h-2.5 rounded-full bg-gray-500" data-tauri-drag-region></div>
                <div className="w-2.5 h-2.5 rounded-full bg-gray-500" data-tauri-drag-region></div>
                <div className="w-2.5 h-2.5 rounded-full bg-gray-500" data-tauri-drag-region></div>
              </div>
              <div className="flex-1 h-full" data-tauri-drag-region></div>
              <div className="flex items-center gap-2">
                <button
                  onClick={async () => {
                    try {
                      await invoke('minimize_window');
                    } catch (error) {
                      console.error('Error minimizing window:', error);
                    }
                  }}
                  className="w-5 h-5 rounded-full bg-gray-600/80 hover:bg-yellow-500 flex items-center justify-center text-white transition-colors"
                  aria-label="Minimize window"
                  data-tauri-drag-region="false"
                >
                  <MinusIcon className="h-3 w-3" />
                </button>
                <button
                  onClick={async () => {
                    try {
                      await invoke('close_window');
                    } catch (error) {
                      console.error('Error closing window:', error);
                    }
                  }}
                  className="w-5 h-5 rounded-full bg-gray-600/80 hover:bg-red-500 flex items-center justify-center text-white transition-colors"
                  aria-label="Close window"
                  data-tauri-drag-region="false"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main CompactMode Interface */}
      <div className="h-full flex flex-col bg-gradient-to-br from-gray-800 via-gray-700 to-gray-800 shadow-2xl border border-gray-600 p-4 pt-10" style={{ pointerEvents: 'auto' }}>
        {/* Header: Logo + Title + Settings button */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
              <Timer className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white" style={{ color: "#1DB954" }}>Let's Focus To Your Dreams </h1>
              <p className="text-xs text-slate-400">Stay productive, stay focused</p>
            </div>
          </div>
          <Button
            ref={toggleBtnRef}
            onClick={() => setShowSettings(s => !s)}
            aria-expanded={showSettings}
            aria-label="Toggle settings"
            size="sm"
            className={`h-8 w-8 rounded-full shadow-lg flex items-center justify-center p-0 transition-all duration-200 ${showSettings ? 'bg-emerald-500 hover:bg-emerald-600 text-white' : 'bg-gray-600 hover:bg-gray-500 text-white'}`}
          >
            <MoreVertical className={`h-4 w-4 transition-transform duration-200 ${showSettings ? 'rotate-90' : 'rotate-0'}`} />
          </Button>
        </div>

        {/* YouTube Frame */}
        <div className="w-full overflow-hidden border border-gray-600 mb-4">
          <div className="aspect-video w-full h-full">
            <YouTubeAnchor className="w-full h-full" />
          </div>
        </div>

        {/* Timer & Controls now moved below video */}
        <div className="flex items-center justify-between mt-4 mb-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl font-mono font-bold text-white">{formatTime(timeLeft)}</span>
            <span className="text-sm text-gray-300 font-medium">({modeLabel})</span>
          </div>
          <div className="flex items-center gap-2">
            <AnimatePresence mode="wait" initial={false}>
              {!isRunning ? (
                <motion.div
                  key="start"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                >
                  <Button
                    onClick={onStart}
                    size="sm"
                    className="h-8 w-8 rounded-full bg-white hover:bg-gray-100 text-gray-800 shadow-lg flex items-center justify-center p-0 transition-colors duration-150"
                  >
                    <Play className="h-4 w-4 ml-0.5" />
                  </Button>
                </motion.div>
              ) : (
                <motion.div
                  key="pause-next"
                  className="flex gap-2"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                >
                  <Button
                    onClick={onPause}
                    size="sm"
                    className="h-8 w-8 rounded-full bg-gray-600 hover:bg-gray-500 text-white shadow-lg flex items-center justify-center p-0 transition-colors duration-150"
                  >
                    <Pause className="h-4 w-4" />
                  </Button>
                  <Button
                    onClick={onNext}
                    size="sm"
                    className="h-8 w-8 rounded-full bg-gray-600 hover:bg-gray-500 text-white shadow-lg flex items-center justify-center p-0 transition-colors duration-150"
                  >
                    <SkipForward className="h-4 w-4" />
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Quotes Display (animated like MiniMode) */}
        {showQuotes && (
          <div ref={quoteContainerRef} className="flex-1 flex flex-col justify-center gap-1 overflow-hidden">
            <div className="overflow-hidden">
              <motion.div
                key={`en-${animationKey}-${currentQuote.en}`}
                className="whitespace-nowrap text-sm text-blue-400 font-medium italic"
                initial={{ x: '100%' }}
                animate={{ x: animationTarget }}
                transition={{ duration: animationDuration, ease: 'linear' }}
                onAnimationComplete={() => { if (!enDone) setEnDone(true); }}
              >
                "{currentQuote.en}"
              </motion.div>
            </div>
            <div className="overflow-hidden">
              <motion.div
                key={`vi-${animationKey}-${currentQuote.vi}`}
                className="whitespace-nowrap text-sm text-emerald-400 font-medium italic"
                initial={{ x: '100%' }}
                animate={{ x: animationTarget }}
                transition={{ duration: animationDuration, ease: 'linear' }}
                onAnimationComplete={() => { if (!viDone) setViDone(true); }}
              >
                "{currentQuote.vi}"
              </motion.div>
            </div>
          </div>
        )}
      </div>

  {/* Settings Panel Overlay */}
      <AnimatePresence mode="wait" initial={false}>
        {showSettings && (
          <motion.div
            ref={panelRef}
    initial={{ opacity: 0, y: -5 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -5 }}
    transition={{ duration: 0.15, ease: 'easeOut' }}
    className="absolute top-2 right-2 w-80 max-h-[80vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600/60 scrollbar-track-transparent bg-gray-800/95 backdrop-blur rounded-2xl shadow-2xl border border-gray-600 p-6 z-[1001]"
            onClick={(e) => e.stopPropagation()}
    role="dialog"
    aria-label="Compact settings"
          >
            {/* Settings Header */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-600">
              <h2 className="text-lg font-bold text-white">Settings</h2>
              <button
                onClick={() => setShowSettings(false)}
        className="w-7 h-7 rounded-full bg-gray-600/90 hover:bg-gray-500 flex items-center justify-center text-white transition-colors"
        aria-label="Close settings"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Quick Settings */}
            <div className="mb-6">
              <h3 className="text-white font-semibold mb-3 text-sm uppercase tracking-wide">
                Quick Settings
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300 text-sm">
                    Rounds per cycle
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        setRoundsPerCycle(Math.max(1, roundsPerCycle - 1))
                      }
                      className="w-6 h-6 rounded bg-gray-600 hover:bg-gray-500 flex items-center justify-center focus:ring-2 focus:ring-emerald-500/60 focus:outline-none"
                      aria-label="Decrease rounds"
                    >
                      <Minus className="h-3 w-3 text-white" />
                    </button>
                    <span className="text-white font-mono w-8 text-center">
                      {roundsPerCycle}
                    </span>
                    <button
                      onClick={() => setRoundsPerCycle(roundsPerCycle + 1)}
                      className="w-6 h-6 rounded bg-gray-600 hover:bg-gray-500 flex items-center justify-center focus:ring-2 focus:ring-emerald-500/60 focus:outline-none"
                      aria-label="Increase rounds"
                    >
                      <Plus className="h-3 w-3 text-white" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Durations */}
            <div className="mb-6">
              <h3 className="text-white font-semibold mb-3 text-sm uppercase tracking-wide">
                Durations
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300 text-sm">Focus</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        onWorkTimeChange(Math.max(1, customTimes.focus - 1))
                      }
                      className="px-2 py-1 bg-gray-600 hover:bg-gray-500 rounded text-white text-xs focus:ring-2 focus:ring-emerald-500/60 focus:outline-none"
                      aria-label="Decrease focus time"
                    >
                      -1m
                    </button>
                    <span className="text-white font-mono w-12 text-center">
                      {customTimes.focus}m
                    </span>
                    <button
                      onClick={() => onWorkTimeChange(customTimes.focus + 1)}
                      className="px-2 py-1 bg-gray-600 hover:bg-gray-500 rounded text-white text-xs focus:ring-2 focus:ring-emerald-500/60 focus:outline-none"
                      aria-label="Increase focus time"
                    >
                      +1m
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300 text-sm">Short</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        onShortBreakTimeChange(
                          Math.max(1, customTimes.shortBreak - 1)
                        )
                      }
                      className="px-2 py-1 bg-gray-600 hover:bg-gray-500 rounded text-white text-xs focus:ring-2 focus:ring-emerald-500/60 focus:outline-none"
                      aria-label="Decrease short break"
                    >
                      -1m
                    </button>
                    <span className="text-white font-mono w-12 text-center">
                      {customTimes.shortBreak}m
                    </span>
                    <button
                      onClick={() =>
                        onShortBreakTimeChange(customTimes.shortBreak + 1)
                      }
                      className="px-2 py-1 bg-gray-600 hover:bg-gray-500 rounded text-white text-xs focus:ring-2 focus:ring-emerald-500/60 focus:outline-none"
                      aria-label="Increase short break"
                    >
                      +1m
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300 text-sm">Long</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        onLongBreakTimeChange(
                          Math.max(1, customTimes.longBreak - 1)
                        )
                      }
                      className="px-2 py-1 bg-gray-600 hover:bg-gray-500 rounded text-white text-xs focus:ring-2 focus:ring-emerald-500/60 focus:outline-none"
                      aria-label="Decrease long break"
                    >
                      -1m
                    </button>
                    <span className="text-white font-mono w-12 text-center">
                      {customTimes.longBreak}m
                    </span>
                    <button
                      onClick={() =>
                        onLongBreakTimeChange(customTimes.longBreak + 1)
                      }
                      className="px-2 py-1 bg-gray-600 hover:bg-gray-500 rounded text-white text-xs focus:ring-2 focus:ring-emerald-500/60 focus:outline-none"
                      aria-label="Increase long break"
                    >
                      +1m
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* YouTube URL */}
            {onYouTubeUrlChange && (
              <div>
                <h3 className="text-white font-semibold mb-3 text-sm uppercase tracking-wide">
                  Media
                </h3>
                <div className="space-y-2">
                  <label className="text-gray-300 text-xs font-semibold uppercase tracking-wide">YouTube URL</label>
                  <input
                    value={tempYoutube}
                    onChange={e => setTempYoutube(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && onYouTubeUrlChange) { onYouTubeUrlChange(tempYoutube.trim()); } }}
                    onBlur={() => { if (onYouTubeUrlChange) onYouTubeUrlChange(tempYoutube.trim()); }}
                    placeholder="Paste YouTube link..."
                    className="w-full px-3 py-2 rounded-md bg-gray-700/70 border border-gray-600 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/60"
                  />
                </div>
                {/* Quotes toggle */}
                <div className="mt-6 flex items-center justify-between">
                  <span className="text-gray-300 text-sm">Show Quotes</span>
                  <button
                    onClick={() => setShowQuotes(q => !q)}
                    className={`px-3 py-1.5 text-xs rounded-md font-medium transition-colors ${showQuotes ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-gray-600 hover:bg-gray-500 text-gray-200'}`}
                    aria-pressed={showQuotes}
                  >
                    {showQuotes ? 'ON' : 'OFF'}
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
