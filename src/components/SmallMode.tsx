import { AnimatePresence, motion } from "framer-motion";
import { MoreVertical, Pause, Play, SkipForward, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { invoke } from "@tauri-apps/api/core";

import { YouTubeAnchor } from "../player/YouTubeOverlay";
import { Button } from "../ui/button";
import { toggleExpand } from "../ui/toggleExpand";
import SettingsPanel from "./SettingsPanel";

interface SmallModeProps {
  timeLeft: number;
  isRunning: boolean;
  activeTab: string;
  onStart: () => void;
  onPause: () => void;
  onNext: () => void;
  getProgress: () => number;
  formatTime: (seconds: number) => string;
  currentQuote: { en: string; vi: string };
  youtubeUrl: string;
  getYouTubeEmbedUrl: (url: string) => string;
  customTimes: { focus: number; shortBreak: number; longBreak: number };
  onWorkTimeChange: (value: number) => void;
  onShortBreakTimeChange: (value: number) => void;
  onLongBreakTimeChange: (value: number) => void;
  onAnimationComplete?: () => void;
  onYouTubeUrlChange?: (url: string) => void;
}

export function SmallMode({
  timeLeft,
  isRunning,
  activeTab,
  onStart,
  onPause,
  onNext,
  getProgress,
  formatTime,
  currentQuote,
  youtubeUrl,
  getYouTubeEmbedUrl,
  customTimes,
  onWorkTimeChange,
  onShortBreakTimeChange,
  onLongBreakTimeChange,
  onAnimationComplete,
  onYouTubeUrlChange,
}: SmallModeProps) {
  const [showSettings, setShowSettings] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [roundsPerCycle, setRoundsPerCycle] = useState(4);
  const [quoteSpeed, setQuoteSpeed] = useState("Normal");
  const [showQuotes, setShowQuotes] = useState(true);
  const [animationDuration, setAnimationDuration] = useState(15);
  const [animationKey, setAnimationKey] = useState(0);
  const [isAnimationComplete, setIsAnimationComplete] = useState(false);
  const [englishComplete, setEnglishComplete] = useState(false);
  const [vietnameseComplete, setVietnameseComplete] = useState(false);
  const [animationTarget, setAnimationTarget] = useState("-120%");
  const [isHovered, setIsHovered] = useState(false);
  const hoverTimeoutRef = useRef<number | null>(null);
  const settingsRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const thumbnailRef = useRef<HTMLDivElement>(null);

  // Calculate animation duration based on actual UI dimensions
  useEffect(() => {
    const calculateDuration = () => {
      if (containerRef.current && thumbnailRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect();
        const thumbnailRect = thumbnailRef.current.getBoundingClientRect();

        const tempDiv = document.createElement("div");
        tempDiv.style.position = "absolute";
        tempDiv.style.visibility = "hidden";
        tempDiv.style.whiteSpace = "nowrap";
        tempDiv.style.fontSize = "14px"; // text-sm for small mode
        tempDiv.style.fontFamily = "inherit";
        tempDiv.style.fontWeight = "500";
        tempDiv.style.fontStyle = "italic";
        document.body.appendChild(tempDiv);

        tempDiv.textContent = `"${currentQuote.en}"`;
        const enWidth = tempDiv.offsetWidth;

        tempDiv.textContent = `"${currentQuote.vi}"`;
        const viWidth = tempDiv.offsetWidth;

        const maxTextWidth = Math.max(enWidth, viWidth);
        const availableWidth = containerRect.width;
        const totalDistance = availableWidth + maxTextWidth;
        const speed = 35; // slightly faster for small mode
        const duration = totalDistance / speed;

        const finalDuration = Math.max(5, Math.min(35, duration));
        setAnimationDuration(finalDuration);

        const targetPercentage = (maxTextWidth / availableWidth) * 100 + 100;
        setAnimationTarget(`-${targetPercentage}%`);

        setIsAnimationComplete(false);
        setEnglishComplete(false);
        setVietnameseComplete(false);
        setAnimationKey((prev) => prev + 1);

        document.body.removeChild(tempDiv);
      }
    };

    const timeoutId = setTimeout(calculateDuration, 100);

    const handleResize = () => {
      setTimeout(calculateDuration, 100);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("resize", handleResize);
    };
  }, [currentQuote]);

  // Check if both quotes are complete
  useEffect(() => {
    if (englishComplete && vietnameseComplete && !isAnimationComplete) {
      setTimeout(() => {
        setIsAnimationComplete(true);
        onAnimationComplete?.();
      }, 100);
    }
  }, [
    englishComplete,
    vietnameseComplete,
    isAnimationComplete,
    onAnimationComplete,
  ]);

  // Handle hover with delay
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
    }, 2000);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  const modeLabel =
    activeTab === "focus"
      ? "Focus"
      : activeTab === "shortBreak"
      ? "Short Break"
      : "Long Break";

  return (
    <div
      className="relative h-full flex flex-col"
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
            style={{ pointerEvents: "auto" }}
          >
            <div className="flex items-center justify-between px-4 h-full">
              <div className="flex items-center gap-2" data-tauri-drag-region>
                <div
                  className="w-2.5 h-2.5 rounded-full bg-gray-500"
                  data-tauri-drag-region
                ></div>
                <div
                  className="w-2.5 h-2.5 rounded-full bg-gray-500"
                  data-tauri-drag-region
                ></div>
                <div
                  className="w-2.5 h-2.5 rounded-full bg-gray-500"
                  data-tauri-drag-region
                ></div>
              </div>
              <div className="flex-1 h-full" data-tauri-drag-region></div>
              <button
                onClick={async () => {
                  try {
                    await invoke("close_window");
                  } catch (error) {
                    console.error("Error closing window:", error);
                  }
                }}
                className="w-5 h-5 rounded-full bg-gray-600/80 hover:bg-red-500 flex items-center justify-center text-white transition-colors"
                aria-label="Close window"
                data-tauri-drag-region="false"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main SmallMode Interface */}
      <div
        className="h-full bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 relative shadow-2xl overflow-hidden"
        ref={settingsRef}
      >
        {/* Main Content Layout - Optimized for small size */}
        <div className="flex h-full">
          {/* Left Side - YouTube iframe */}
          <div className="flex-1 p-2">
            <div className="h-32 rounded-lg overflow-hidden bg-gray-700 border border-gray-600">
              <YouTubeAnchor className="w-full h-full" />
            </div>
          </div>

          {/* Right Side - Timer */}
          <div className="w-32 p-2 flex flex-col justify-center">
            {/* Mode Label */}
            <div className="text-center">
              <div className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">
                {modeLabel}
              </div>

              {/* Timer Display */}
              <div className="text-2xl font-mono font-bold text-white mb-2">
                {formatTime(timeLeft)}
              </div>

              {/* Progress Bar */}
              <div className="w-full h-1.5 bg-gray-600 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-1000 ease-out"
                  style={{ width: `${getProgress()}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section - Quotes and Controls */}
        <div className="px-2 pb-2">
          {/* Quotes Section */}
          {showQuotes && (
            <div className="mb-2">
              <div ref={containerRef} className="overflow-hidden">
                <motion.div
                  key={`${animationKey}-${currentQuote.en}-english-${showQuotes}`}
                  className="whitespace-nowrap text-xs text-blue-400 font-medium italic"
                  initial={{ x: "100%" }}
                  animate={{ x: animationTarget }}
                  transition={{ duration: animationDuration, ease: "linear" }}
                  onAnimationComplete={() => {
                    if (!englishComplete) {
                      setEnglishComplete(true);
                    }
                  }}
                >
                  "{currentQuote.en}"
                </motion.div>
              </div>
              <div className="overflow-hidden mt-0.5">
                <motion.div
                  key={`${animationKey}-${currentQuote.vi}-vietnamese-${showQuotes}`}
                  className="whitespace-nowrap text-xs text-emerald-400 font-medium italic"
                  initial={{ x: "100%" }}
                  animate={{ x: animationTarget }}
                  transition={{ duration: animationDuration, ease: "linear" }}
                  onAnimationComplete={() => {
                    if (!vietnameseComplete) {
                      setVietnameseComplete(true);
                    }
                  }}
                >
                  "{currentQuote.vi}"
                </motion.div>
              </div>
            </div>
          )}
        </div>

        {/* Control Buttons - Bottom Center */}
        <div
          className={`absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20 ${
            showSettings ? "right-60" : ""
          }`}
        >
          {/* Control Buttons */}
          <div className="flex items-center gap-2">
            <AnimatePresence mode="sync" initial={false}>
              {!isRunning ? (
                <motion.div
                  key="start"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                >
                  <Button
                    onClick={onStart}
                    size="sm"
                    className="h-8 w-8 rounded-full bg-white hover:bg-gray-100 text-gray-800 shadow-lg flex items-center justify-center p-0"
                  >
                    <Play className="h-4 w-4 ml-0.5" />
                  </Button>
                </motion.div>
              ) : (
                <motion.div
                  key="pause-next"
                  className="flex gap-2"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                >
                  <Button
                    onClick={onPause}
                    size="sm"
                    className="h-8 w-8 rounded-full bg-gray-600 hover:bg-gray-500 text-white shadow-lg flex items-center justify-center p-0"
                  >
                    <Pause className="h-4 w-4" />
                  </Button>
                  <Button
                    onClick={onNext}
                    size="sm"
                    className="h-8 w-8 rounded-full bg-gray-600 hover:bg-gray-500 text-white shadow-lg flex items-center justify-center p-0"
                  >
                    <SkipForward className="h-4 w-4" />
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Settings button */}
          <button
            onClick={async () => {
              const next = !showSettings;
              setShowSettings(next);
              await toggleExpand("right");
            }}
            className={`h-7 w-7 rounded-full shadow-lg flex items-center justify-center p-0 ${
              showSettings
                ? "bg-emerald-500 hover:bg-emerald-600 text-white"
                : "bg-gray-600 hover:bg-gray-500 text-white"
            }`}
          >
            <MoreVertical className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <SettingsPanel
          onClose={async () => {
            setShowSettings(false);
            await toggleExpand("right");
          }}
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
          isMuted={isMuted}
          setIsMuted={setIsMuted}
          youtubeUrl={youtubeUrl}
          onYouTubeUrlChange={onYouTubeUrlChange}
        />
      )}
    </div>
  );
}
