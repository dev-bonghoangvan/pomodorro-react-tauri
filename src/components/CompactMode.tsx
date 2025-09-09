import { AnimatePresence, motion } from 'framer-motion';
import {
    Minus, MoreVertical, Pause, Play, Plus, SkipForward, Volume2, VolumeX, X
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { Button } from '../ui/button';

interface CompactModeProps {
  timeLeft: number;
  isRunning: boolean;
  activeTab: string;
  customTimes: { focus: number; shortBreak: number; longBreak: number };
  currentQuote: string;
  isVietnamese: boolean;
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
}

export function CompactMode({
  timeLeft,
  isRunning,
  activeTab,
  customTimes,
  currentQuote,
  isVietnamese,
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
}: CompactModeProps) {
  const [showSettings, setShowSettings] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
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
      ? "S_Break"
      : "L_Break";

  return (
    <div className="relative h-full" ref={settingsRef}>
      {/* Main CompactMode Interface */}
      <div className="h-full flex flex-col bg-gradient-to-br from-gray-800 via-gray-700 to-gray-800 rounded-2xl shadow-2xl border border-gray-600 p-4">
        {/* Header with Timer and Controls */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl font-mono font-bold text-white">
              {formatTime(timeLeft)}
            </span>
            <span className="text-sm text-gray-300 font-medium">
              ({modeLabel})
            </span>
          </div>

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
              onClick={() => setShowSettings(!showSettings)}
              size="sm"
              className="h-8 w-8 rounded-full bg-gray-600 hover:bg-gray-500 text-white shadow-lg flex items-center justify-center p-0"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* YouTube Frame */}
        <div className="w-full overflow-hidden  border border-gray-600 mb-4">
          <div className="aspect-video w-full">
            <iframe
              src={getYouTubeEmbedUrl(youtubeUrl)}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              referrerPolicy="no-referrer"
              sandbox="allow-scripts allow-same-origin allow-presentation"
              allowFullScreen
            />
          </div>
        </div>

        {/* Quotes Display */}
        <div className="flex-1 flex flex-col justify-center">
          <div className="text-center space-y-2">
            <AnimatePresence mode="wait">
              <motion.div
                key={`${currentQuote}-${isVietnamese}`}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.3 }}
                className="space-y-1"
              >
                <p className="text-sm text-emerald-400 font-medium italic">
                  "{currentQuote}"
                </p>
                <p className="text-sm text-blue-400 font-medium italic">
                  "{currentQuote}"
                </p>
              </motion.div>
            </AnimatePresence>
          </div>
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
