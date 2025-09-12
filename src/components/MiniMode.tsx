import { AnimatePresence, motion } from "framer-motion";
import {
  GripVertical,
  MoreVertical,
  Pause,
  Play,
  SkipForward,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { invoke } from "@tauri-apps/api/core";

import { YouTubeAnchor } from "../player/YouTubeOverlay";
import { Button } from "../ui/button";
import { toggleExpand } from "../ui/toggleExpand";
import SettingsPanel from "./SettingsPanel";

interface MiniModeProps {
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
  onYouTubeUrlChange?: (url: string) => void; // optional to avoid breaking existing callers
}

export function MiniMode({
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
}: MiniModeProps) {
  const [showSettings, setShowSettings] = useState(false); // logical state (expanded)
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
  // (SettingsPanel will manage temporary YouTube input state)

  // Calculate animation duration based on actual UI dimensions
  useEffect(() => {
    const calculateDuration = () => {
      if (containerRef.current && thumbnailRef.current) {
        // Get actual UI dimensions
        const containerRect = containerRef.current.getBoundingClientRect();
        const thumbnailRect = thumbnailRef.current.getBoundingClientRect();

        // Create temporary elements to measure actual text width
        const tempDiv = document.createElement("div");
        tempDiv.style.position = "absolute";
        tempDiv.style.visibility = "hidden";
        tempDiv.style.whiteSpace = "nowrap";
        tempDiv.style.fontSize = "12px"; // text-xs
        tempDiv.style.fontFamily = "inherit";
        tempDiv.style.fontWeight = "500";
        tempDiv.style.fontStyle = "italic";
        document.body.appendChild(tempDiv);

        // Measure both quotes and use the longer one
        tempDiv.textContent = `"${currentQuote.en}"`;
        const enWidth = tempDiv.offsetWidth;

        tempDiv.textContent = `"${currentQuote.vi}"`;
        const viWidth = tempDiv.offsetWidth;

        const maxTextWidth = Math.max(enWidth, viWidth);

        // Calculate the actual available space for text animation
        // Text needs to travel from right edge of container to completely exit the left side
        const availableWidth = containerRect.width;

        // Total distance = container width + text width (to ensure text completely exits)
        // Since text starts at 100% (right edge) and needs to go to -120% (completely out)
        const totalDistance = availableWidth + maxTextWidth;
        const speed = 30; // pixels per second
        const duration = totalDistance / speed;

        const finalDuration = Math.max(5, Math.min(40, duration));
        setAnimationDuration(finalDuration);

        // Calculate animation target to ensure text completely exits
        const targetPercentage = (maxTextWidth / availableWidth) * 100 + 100;
        setAnimationTarget(`-${targetPercentage}%`);

        // Debug log
        console.log("Animation calculation:", {
          containerWidth: containerRect.width,
          containerHeight: containerRect.height,
          thumbnailWidth: thumbnailRect.width,
          thumbnailHeight: thumbnailRect.height,
          availableWidth,
          enWidth,
          viWidth,
          maxTextWidth,
          totalDistance,
          speed,
          duration,
          finalDuration,
          targetPercentage,
          animationTarget: `-${targetPercentage}%`,
        });

        // Reset animation state
        setIsAnimationComplete(false);
        setEnglishComplete(false);
        setVietnameseComplete(false);

        // Trigger new animation when quote changes
        setAnimationKey((prev) => prev + 1);

        document.body.removeChild(tempDiv);
      }
    };

    // Use setTimeout to ensure DOM is ready
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

  // Check if both quotes are complete - wait for Vietnamese quote (which has delay)
  useEffect(() => {
    if (englishComplete && vietnameseComplete && !isAnimationComplete) {
      // Add a small delay to ensure Vietnamese quote has fully completed
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

  // NOTE: Removed auto-sync that opened settings when width > collapsed.
  // Keep settings closed by default; only user interaction (button) toggles it.

  const modeLabel =
    activeTab === "focus" ? "F" : activeTab === "shortBreak" ? "S" : "L";

  return (
    <div
      className="relative h-full group"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Main MiniMode Interface */}
      <div
        className="h-full bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800  relative shadow-2xl overflow-hidden"
        ref={settingsRef}
      >
        {/* Left controls (hover to reveal) - Spotify style */}
        <div className="absolute left-0 top-0 h-full w-6 z-50 pointer-events-auto">
          <div
            className={`pt-1.5 pl-1.5 flex flex-col justify-between items-start h-full transition-all duration-200 ease-out ${
              isHovered
                ? "opacity-100 translate-x-0"
                : "opacity-0 -translate-x-8"
            }`}
            data-tauri-drag-region
          >
            {/* Close button */}
            <button
              aria-label="Close"
              className="h-3 w-3 rounded-full bg-white/90 hover:bg-white text-gray-800 shadow flex items-center justify-center"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={async (e) => {
                e.stopPropagation();
                try {
                  await invoke("close_window");
                } catch (error) {}
              }}
              data-tauri-drag-region="false"
            >
              <X className="h-2 w-2" />
            </button>

            {/* Drag handle */}
            <div
              className="h-6 w-3 flex items-center justify-center  text-white/90 pointer-events-auto"
              title="Drag window"
            >
              <GripVertical
                className="h-3 w-3 cursor-move"
                data-tauri-drag-region
              />
            </div>
          </div>
        </div>

        {/* Main Content Layout - Flex Row */}
        <div className="flex items-center py-3 h-full">
          {/* Middle section - Thumbnail, Timer and Quotes (animated, can be hidden behind right section) */}
          <div
            className={`flex items-center gap-2 transition-transform duration-200 ease-out flex-1 min-w-0 pl-2 pr-16 ${
              isHovered ? "translate-x-8" : "translate-x-0"
            }`}
          >
            {/* YouTube Thumbnail */}
            <div
              ref={thumbnailRef}
              className="w-8 h-8 rounded-lg border border-gray-600 overflow-hidden bg-black/80 flex-shrink-0"
            >
              <YouTubeAnchor className="w-full h-full" />
            </div>

            {/* Timer and Quotes Display */}
            <div
              ref={containerRef}
              className="flex flex-col gap-0 min-w-0 flex-1"
            >
              {showQuotes && (
                <div className="overflow-hidden">
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
              )}
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-mono font-bold text-white whitespace-nowrap">
                  {formatTime(timeLeft)}
                </span>
                <span className="text-sm text-gray-300 font-medium whitespace-nowrap">
                  ({modeLabel})
                </span>
              </div>
              {showQuotes && (
                <div className="overflow-hidden">
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
              )}
            </div>
          </div>

          {/* Right section - Control Buttons (anchored) */}
          <div
            className={`absolute top-1/2 -translate-y-1/2 flex items-center gap-2 z-20 ${
              showSettings ? "right-60" : "right-2"
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

            {/* Settings button - triggers expand / collapse */}
            <button
              onClick={async () => {
                const next = !showSettings;
                setShowSettings(next);
                await toggleExpand("right");
              }}
              className={`h-6 w-6 rounded-full shadow-lg flex items-center justify-center p-0 ${
                showSettings
                  ? "bg-emerald-500 hover:bg-emerald-600 text-white"
                  : "bg-gray-600 hover:bg-gray-500 text-white"
              }`}
            >
              <MoreVertical className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>
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
          width="240px"
          height="100%"
          className="absolute inset-y-0 right-0"
        />
      )}
    </div>
  );
}
