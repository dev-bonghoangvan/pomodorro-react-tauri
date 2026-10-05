import { AnimatePresence, motion } from 'framer-motion';
import {
  Minus, MinusIcon, MoreVertical, Pause, Play, Plus, Repeat, SkipForward, Timer, X
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { closeWindow, minimizeWindow } from '../lib/utils';
import { Button } from '../ui/button';
import { YouTubeAnchor, useYouTubeOverlay } from '../player/YouTubeOverlay';
import SettingsPanel from './SettingsPanel';
import { LoopControl } from './LoopControl';
import { useDropdownPosition } from '../hooks/useDropdownPosition';

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
  getTabIcon: (tab: string) => React.ReactNode;
  youtubeUrl: string;
  getYouTubeEmbedUrl: (url: string) => string;
  onWorkTimeChange: (value: number) => void;
  onShortBreakTimeChange: (value: number) => void;
  onLongBreakTimeChange: (value: number) => void;
  autoStartNext: boolean;
  setAutoStartNext: (value: boolean) => void;
  autoStartBreakType: 'short' | 'long';
  setAutoStartBreakType: (value: 'short' | 'long') => void;
  roundsPerCycle: number;
  setRoundsPerCycle: (value: number) => void;
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
  autoStartNext,
  setAutoStartNext,
  autoStartBreakType,
  setAutoStartBreakType,
  roundsPerCycle,
  setRoundsPerCycle,
  onYouTubeUrlChange,
  onAnimationComplete,
}: CompactModeProps) {
  const [showSettings, setShowSettings] = useState(false);
  const [quoteSpeed, setQuoteSpeed] = useState("Normal");
  const [showQuotes, setShowQuotes] = useState(true);
  const [tempYoutube, setTempYoutube] = useState(youtubeUrl);
  const [isHovered, setIsHovered] = useState(false);
  const hoverTimeoutRef = useRef<number | null>(null);
  const settingsRef = useRef<HTMLDivElement>(null); // root container
  const panelRef = useRef<HTMLDivElement>(null);     // settings panel element
  const toggleBtnRef = useRef<HTMLButtonElement>(null); // settings toggle button
  const [showLoopControl, setShowLoopControl] = useState(false);
  const loopBtnRef = useRef<HTMLButtonElement>(null);
  const loopPos = useDropdownPosition(loopBtnRef, showLoopControl, { width: 380, gap: 8, align: 'end' });
  const { videoDuration, loopConfig } = useYouTubeOverlay();
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
                  onClick={minimizeWindow}
                  className="w-5 h-5 rounded-full bg-gray-600/80 hover:bg-yellow-500 flex items-center justify-center text-white transition-colors"
                  aria-label="Minimize window"
                  data-tauri-drag-region="false"
                >
                  <MinusIcon className="h-3 w-3" />
                </button>
                <button
                  onClick={closeWindow}
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
      <div className="h-full flex flex-col bg-[rgba(255,255,255,0.04)] shadow-2xl border border-white/15 p-4 pt-10" style={{ pointerEvents: 'auto' }}>
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
          <div className="flex items-center gap-2">
            <Button
              ref={loopBtnRef}
              onClick={() => setShowLoopControl(!showLoopControl)}
              size="sm"
              className={`h-8 w-8 p-0 flex items-center justify-center ${
                showLoopControl || loopConfig?.loopEnabled || loopConfig?.loopPortion
                  ? 'bg-red-500 hover:bg-red-600 text-white'
                  : 'bg-gray-600/80 hover:bg-gray-500/80 text-white'
              }`}
            >
              <Repeat className="w-4 h-4" />
            </Button>
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
        </div>

        {/* YouTube Frame */}
        <div className="w-full overflow-hidden border border-white/15 mb-4 relative">
          <div className="aspect-video w-full h-full relative">
            <YouTubeAnchor className="w-full h-full" />
          </div>
        </div>
        
        {/* Loop Control Overlay */}
        {createPortal(
          <AnimatePresence mode="wait">
            {showLoopControl && loopPos && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="fixed inset-0 bg-black/45 backdrop-blur-[2px] z-[9998]"
                  onClick={() => setShowLoopControl(false)}
                />
                <motion.div
                  initial={{
                    opacity: 0,
                    y: loopPos.placement === 'top' ? 8 : -8,
                    scale: 0.98,
                  }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{
                    opacity: 0,
                    y: loopPos.placement === 'top' ? 8 : -8,
                    scale: 0.98,
                  }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  style={{
                    position: 'fixed',
                    top: loopPos.top,
                    left: loopPos.left,
                    width: loopPos.width,
                    maxHeight: loopPos.maxHeight,
                  }}
                  className="z-[9999] pointer-events-auto flex flex-col"
                  onClick={(e) => e.stopPropagation()}
                >
                  <LoopControl
                    onClose={() => setShowLoopControl(false)}
                    videoDuration={videoDuration}
                    style={{ maxHeight: loopPos.maxHeight }}
                    className="max-h-full"
                  />
                </motion.div>
              </>
            )}
          </AnimatePresence>,
          document.body
        )}

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
      {createPortal(
        <AnimatePresence mode="wait">
          {showSettings && (
            <>
              {/* Soft dimmed backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="fixed inset-0 bg-black/45 backdrop-blur-[2px] z-[9998]"
                onClick={() => setShowSettings(false)}
              />
              <motion.div
                ref={panelRef}
                initial={{ opacity: 0, y: -5, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -5, scale: 0.96 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                className="fixed top-8 right-3 left-3 sm:left-auto sm:w-[440px] max-w-[calc(100vw-1.5rem)] max-h-[calc(100vh-3rem)] z-[9999] flex flex-col"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-label="Compact settings"
              >
                <SettingsPanel
                  onClose={() => setShowSettings(false)}
                  roundsPerCycle={roundsPerCycle}
                  setRoundsPerCycle={setRoundsPerCycle}
                  customTimes={customTimes}
                  onWorkTimeChange={onWorkTimeChange}
                  onShortBreakTimeChange={onShortBreakTimeChange}
                  onLongBreakTimeChange={onLongBreakTimeChange}
                  quoteSpeed={quoteSpeed}
                  setQuoteSpeed={setQuoteSpeed}
                  showQuotes={showQuotes}
                  setShowQuotes={setShowQuotes}
                  autoStartNext={autoStartNext}
                  setAutoStartNext={setAutoStartNext}
                  autoStartBreakType={autoStartBreakType}
                  setAutoStartBreakType={setAutoStartBreakType}
                  youtubeUrl={youtubeUrl}
                  onYouTubeUrlChange={onYouTubeUrlChange}
                  height="100%"
                />
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}
