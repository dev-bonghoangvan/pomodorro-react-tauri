import { AnimatePresence, motion } from 'framer-motion';
import {
    ChevronDown, GripVertical, Minus, MoreVertical, Pause, Play, Plus, SkipForward, Volume2,
    VolumeX, X
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { getCurrentWindow } from '@tauri-apps/api/window';

import { Button } from '../ui/button';

interface MiniModeProps {
  timeLeft: number;
  isRunning: boolean;
  activeTab: string;
  alwaysOnTop: boolean;
  autoStart: boolean;
  onStart: () => void;
  onPause: () => void;
  onNext: () => void;
  onToggleAlwaysOnTop: () => void;
  onToggleAutostart: () => void;
  getProgress: () => number;
  formatTime: (seconds: number) => string;
  currentQuote: string;
  youtubeUrl: string;
  getYouTubeEmbedUrl: (url: string) => string;
  customTimes: { focus: number; shortBreak: number; longBreak: number };
  onWorkTimeChange: (value: number) => void;
  onShortBreakTimeChange: (value: number) => void;
  onLongBreakTimeChange: (value: number) => void;
}

export function MiniMode({
  timeLeft,
  isRunning,
  activeTab,
  alwaysOnTop,
  autoStart,
  onStart,
  onPause,
  onNext,
  onToggleAlwaysOnTop,
  onToggleAutostart,
  getProgress,
  formatTime,
  currentQuote,
  youtubeUrl,
  getYouTubeEmbedUrl,
  customTimes,
  onWorkTimeChange,
  onShortBreakTimeChange,
  onLongBreakTimeChange,
}: MiniModeProps) {
  const [showSettings, setShowSettings] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [autoStartNext, setAutoStartNext] = useState(false);
  const [roundsPerCycle, setRoundsPerCycle] = useState(4);
  const [quoteSpeed, setQuoteSpeed] = useState("Normal");
  const settingsRef = useRef<HTMLDivElement>(null);

  // Close settings when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        settingsRef.current &&
        !settingsRef.current.contains(event.target as Node)
      ) {
        setShowSettings(false);
      }
    }

    if (showSettings) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showSettings]);

  const modeLabel =
    activeTab === "focus"
      ? "Focus"
      : activeTab === "shortBreak"
      ? "Short Break"
      : "Long Break";

  return (
    <div className="relative h-full">
      {/* Main MiniMode Interface */}
      <div
        className="group h-full px-4 py-3 bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 rounded-2xl relative shadow-2xl"
        ref={settingsRef}
      >
        {/* Left controls (hover to reveal) */}
        <div className="absolute left-0 top-0 h-full w-8 z-50 pointer-events-auto">
          <div
            className="pt-2 pl-2 flex flex-col items-start gap-1 opacity-0 hover:opacity-100 -ml-2 hover:ml-0 transition-all duration-200 ease-out"
            data-tauri-drag-region
          >
            {/* Close button */}
            <button
              aria-label="Close"
              className="h-4 w-4 rounded-full bg-white/90 hover:bg-white text-gray-800 shadow flex items-center justify-center"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={async (e) => {
                e.stopPropagation();
                try {
                  await getCurrentWindow().close();
                } catch {}
              }}
              data-tauri-drag-region="false"
            >
              <X className="h-3 w-3" />
            </button>

            {/* Drag handle */}
            <div
              className="mt-1 h-6 w-4 flex items-center justify-center cursor-move text-white/90"
              data-tauri-drag-region
              title="Drag window"
            >
              <GripVertical className="h-4 w-4" />
            </div>
          </div>
        </div>

        {/* Main Content Layout */}
        <div className="flex items-center gap-4 pl-8">
          {/* YouTube Thumbnail */}
          <div className="w-16 h-16 rounded-lg border border-gray-600 overflow-hidden bg-black/80 flex-shrink-0">
            <iframe
              src={getYouTubeEmbedUrl(youtubeUrl)}
              className="w-full h-full"
              title="Mini YouTube"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              referrerPolicy="no-referrer"
              sandbox="allow-scripts allow-same-origin allow-presentation"
              allowFullScreen
            />
          </div>

          {/* Timer and Controls */}
          <div className="flex-1 flex items-center justify-between">
            {/* Timer Display */}
            <div className="flex items-baseline gap-3">
              <span className="text-2xl font-mono font-bold text-white">
                {formatTime(timeLeft)}
              </span>
              <span className="text-sm text-gray-300 font-medium">
                ({modeLabel})
              </span>
            </div>

            {/* Control Buttons */}
            <div className="flex items-center gap-2">
              <AnimatePresence mode="wait">
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

              {/* Settings Button */}
              <Button
                onClick={() => {
                  console.log(
                    "Settings button clicked, current state:",
                    showSettings
                  );
                  setShowSettings(!showSettings);
                }}
                size="sm"
                className={`h-8 w-8 rounded-full shadow-lg flex items-center justify-center p-0 ${
                  showSettings
                    ? "bg-emerald-500 hover:bg-emerald-600 text-white"
                    : "bg-gray-600 hover:bg-gray-500 text-white"
                }`}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Quote Marquee */}
        <div className="mt-3 overflow-hidden">
          <motion.div
            key={currentQuote}
            className="whitespace-nowrap text-sm text-emerald-400 font-medium italic"
            initial={{ x: "100%" }}
            animate={{ x: ["100%", "-100%"] }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          >
            "{currentQuote}"
          </motion.div>
        </div>
      </div>

      {/* Settings Panel Dropdown */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full right-0 mt-2 w-80 bg-gray-800 rounded-2xl shadow-2xl border border-gray-600 p-6 z-50"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              {/* Settings Header */}
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-600">
                <h2 className="text-lg font-bold text-white">Settings</h2>
                <button
                  onClick={() => setShowSettings(false)}
                  className="w-6 h-6 rounded-full bg-gray-600 hover:bg-gray-500 flex items-center justify-center text-white"
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
                      Auto start next
                    </span>
                    <button
                      onClick={() => setAutoStartNext(!autoStartNext)}
                      className={`w-12 h-6 rounded-full transition-colors ${
                        autoStartNext ? "bg-emerald-500" : "bg-gray-600"
                      }`}
                    >
                      <div
                        className={`w-5 h-5 bg-white rounded-full transition-transform ${
                          autoStartNext ? "translate-x-6" : "translate-x-0.5"
                        }`}
                      />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300 text-sm">
                      Rounds per cycle
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          setRoundsPerCycle(Math.max(1, roundsPerCycle - 1))
                        }
                        className="w-6 h-6 rounded bg-gray-600 hover:bg-gray-500 flex items-center justify-center"
                      >
                        <Minus className="h-3 w-3 text-white" />
                      </button>
                      <span className="text-white font-mono w-8 text-center">
                        {roundsPerCycle}
                      </span>
                      <button
                        onClick={() => setRoundsPerCycle(roundsPerCycle + 1)}
                        className="w-6 h-6 rounded bg-gray-600 hover:bg-gray-500 flex items-center justify-center"
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
                        className="px-2 py-1 bg-gray-600 hover:bg-gray-500 rounded text-white text-xs"
                      >
                        -1m
                      </button>
                      <span className="text-white font-mono w-12 text-center">
                        {customTimes.focus}m
                      </span>
                      <button
                        onClick={() => onWorkTimeChange(customTimes.focus + 1)}
                        className="px-2 py-1 bg-gray-600 hover:bg-gray-500 rounded text-white text-xs"
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
                        className="px-2 py-1 bg-gray-600 hover:bg-gray-500 rounded text-white text-xs"
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
                        className="px-2 py-1 bg-gray-600 hover:bg-gray-500 rounded text-white text-xs"
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
                        className="px-2 py-1 bg-gray-600 hover:bg-gray-500 rounded text-white text-xs"
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
                        className="px-2 py-1 bg-gray-600 hover:bg-gray-500 rounded text-white text-xs"
                      >
                        +1m
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quotes */}
              <div className="mb-6">
                <h3 className="text-white font-semibold mb-3 text-sm uppercase tracking-wide">
                  Quotes
                </h3>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300 text-sm">Speed</span>
                  <div className="flex items-center gap-2">
                    <span className="text-white text-sm">{quoteSpeed}</span>
                    <button className="w-6 h-6 rounded bg-gray-600 hover:bg-gray-500 flex items-center justify-center">
                      <ChevronDown className="h-3 w-3 text-white" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Media */}
              <div>
                <h3 className="text-white font-semibold mb-3 text-sm uppercase tracking-wide">
                  Media
                </h3>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300 text-sm">Mute YouTube</span>
                  <button
                    onClick={() => setIsMuted(!isMuted)}
                    className="w-8 h-8 rounded bg-gray-600 hover:bg-gray-500 flex items-center justify-center"
                  >
                    {isMuted ? (
                      <VolumeX className="h-4 w-4 text-white" />
                    ) : (
                      <Volume2 className="h-4 w-4 text-white" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
