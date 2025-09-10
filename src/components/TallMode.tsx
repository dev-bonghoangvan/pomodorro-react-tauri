import { AnimatePresence, motion } from 'framer-motion';
import {
    Minimize2, Minus, MoreVertical, Pause, Play, Plus, RotateCcw, SkipForward, Volume2, VolumeX, X
} from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';

import { invoke } from '@tauri-apps/api/core';

import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs';
import { PlayerSlot } from '../player/PlayerSlot';

interface TallModeProps {
  timeLeft: number;
  isRunning: boolean;
  currentTab: string;
  onTabChange: (value: string) => void;
  onPlayPause: () => void;
  onSkip: () => void;
  onReset: () => void;
  onMinimize: () => void;
  onSettings: () => void;
  currentQuote: string;
  isVietnamese: boolean;
  workTime: number;
  shortBreakTime: number;
  longBreakTime: number;
  onWorkTimeChange: (value: number) => void;
  onShortBreakTimeChange: (value: number) => void;
  onLongBreakTimeChange: (value: number) => void;
  customTimes: { focus: number; shortBreak: number; longBreak: number };
  youtubeUrl: string;
  getYouTubeEmbedUrl: (url: string) => string;
}

export function TallMode({
  timeLeft,
  isRunning,
  currentTab,
  onTabChange,
  onPlayPause,
  onSkip,
  onReset,
  onMinimize,
  onSettings,
  currentQuote,
  isVietnamese,
  workTime,
  shortBreakTime,
  longBreakTime,
  onWorkTimeChange,
  onShortBreakTimeChange,
  onLongBreakTimeChange,
  customTimes,
  youtubeUrl,
  getYouTubeEmbedUrl,
}: TallModeProps) {
  const [showSettings, setShowSettings] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [roundsPerCycle, setRoundsPerCycle] = useState(4);
  const [isHovered, setIsHovered] = useState(false);
  const hoverTimeoutRef = useRef<number | null>(null);
  const settingsRef = useRef<HTMLDivElement>(null);

  // Handle hover with delay (like CompactMode)
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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const getProgress = () => {
    const totalTime =
      currentTab === "focus"
        ? customTimes.focus * 60
        : currentTab === "shortBreak"
        ? customTimes.shortBreak * 60
        : customTimes.longBreak * 60;
    return ((totalTime - timeLeft) / totalTime) * 100;
  };

  return (
    <div 
      className="relative w-full h-full" 
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
          </motion.div>
        )}
      </AnimatePresence>
   
      {/* Main TallMode Interface */}
      <Card className="w-full h-full rounded-2xl overflow-hidden shadow-2xl border border-gray-600 bg-gradient-to-br from-gray-800 via-gray-700 to-gray-800">
        <CardContent className="p-4 pt-10 h-full flex flex-col space-y-4">
          {/* Header with utility icons */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold text-white">Pomodoro (tall mode)</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setShowSettings(!showSettings)}
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-gray-300 hover:text-white"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onMinimize}
                className="h-8 w-8 p-0 text-gray-300 hover:text-white"
              >
                <Minimize2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* YouTube Section - Always at top */}
          <motion.div
            className="w-full"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="w-full h-32 rounded-lg overflow-hidden bg-gray-700">
              <PlayerSlot className="w-full h-full" />
            </div>
          </motion.div>

          {/* Main Content - Responsive Layout */}
          <div className="flex-1 flex flex-col xl:flex-row gap-4">
            {/* Left Side - Timer and Controls */}
            <div className="flex-1 flex flex-col items-center justify-center space-y-4">
              {/* Tabs */}
              <Tabs value={currentTab} onValueChange={onTabChange} className="w-full">
                <TabsList className="grid w-full grid-cols-3 bg-gray-700/50 border border-gray-600">
                  <TabsTrigger
                    value="focus"
                    className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=inactive]:bg-transparent data-[state=inactive]:text-gray-300 data-[state=inactive]:hover:text-white"
                  >
                    <div className="flex flex-col items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-red-500"></div>
                      <span className="text-xs font-medium">Focus</span>
                    </div>
                  </TabsTrigger>
                  <TabsTrigger
                    value="shortBreak"
                    className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=inactive]:bg-transparent data-[state=inactive]:text-gray-300 data-[state=inactive]:hover:text-white"
                  >
                    <div className="flex flex-col items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      <span className="text-xs font-medium">Short</span>
                    </div>
                  </TabsTrigger>
                  <TabsTrigger
                    value="longBreak"
                    className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=inactive]:bg-transparent data-[state=inactive]:text-gray-300 data-[state=inactive]:hover:text-white"
                  >
                    <div className="flex flex-col items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                      <span className="text-xs font-medium">Long</span>
                    </div>
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              {/* Timer Display */}
              <div className="relative w-32 h-32">
                <svg
                  className="w-full h-full transform -rotate-90"
                  viewBox="0 0 100 100"
                >
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth="4"
                    fill="none"
                  />
                  <motion.circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="url(#gradient)"
                    strokeWidth="4"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 40}`}
                    strokeDashoffset={`${
                      2 * Math.PI * 40 * (1 - getProgress() / 100)
                    }`}
                    initial={{ strokeDashoffset: 2 * Math.PI * 40 }}
                    animate={{
                      strokeDashoffset:
                        2 * Math.PI * 40 * (1 - getProgress() / 100),
                    }}
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                  />
                  <defs>
                    <linearGradient
                      id="gradient"
                      x1="0%"
                      y1="0%"
                      x2="100%"
                      y2="100%"
                    >
                      <stop offset="0%" stopColor="#10b981" />
                      <stop offset="100%" stopColor="#059669" />
                    </linearGradient>
                  </defs>
                </svg>

                {/* Time Display */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <motion.div
                    key={timeLeft}
                    initial={{ scale: 1.1, opacity: 0.8 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className="text-2xl font-mono font-bold text-white"
                  >
                    {formatTime(timeLeft)}
                  </motion.div>
                </div>
              </div>

              {/* Controls */}
              <div className="flex justify-center gap-3">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    onClick={onPlayPause}
                    className="h-12 w-12 rounded-full bg-white hover:bg-gray-100 text-gray-800 shadow-lg"
                  >
                    {isRunning ? (
                      <Pause className="h-5 w-5" />
                    ) : (
                      <Play className="h-5 w-5 ml-1" />
                    )}
                  </Button>
                </motion.div>

                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    onClick={onSkip}
                    variant="ghost"
                    className="h-12 w-12 rounded-full bg-gray-600 hover:bg-gray-500 text-white shadow-lg"
                  >
                    <SkipForward className="h-5 w-5" />
                  </Button>
                </motion.div>

                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    onClick={onReset}
                    variant="ghost"
                    className="h-12 w-12 rounded-full bg-gray-600 hover:bg-gray-500 text-white shadow-lg"
                  >
                    <RotateCcw className="h-5 w-5" />
                  </Button>
                </motion.div>
              </div>
            </div>

            {/* Right Side - Quotes */}
            <div className="flex-1 flex items-center justify-center">
              <motion.div
                className="text-center w-full"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <AnimatePresence mode="sync" initial={false}>
                  <motion.div
                    key={currentQuote}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.5 }}
                    className="space-y-3"
                  >
                    <p className="text-sm text-emerald-400 font-medium italic leading-relaxed">
                      "{currentQuote}"
                    </p>
                    <p className="text-sm text-blue-400 font-medium italic leading-relaxed">
                      "{currentQuote}"
                    </p>
                    <div className="w-full h-px bg-gradient-to-r from-transparent via-emerald-400/30 to-transparent" />
                  </motion.div>
                </AnimatePresence>
              </motion.div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Settings Panel Dropdown */}
      <AnimatePresence mode="sync" initial={false}>
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
