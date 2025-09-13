import { AnimatePresence, motion } from 'framer-motion';
import {
    Clock, Coffee, Minus, MinusIcon, MoreVertical, Pause, Play, Plus, RotateCcw, SkipForward, Timer, X
} from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';

import { invoke } from '@tauri-apps/api/core';

import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs';
import { YouTubeAnchor } from '../player/YouTubeOverlay';
import quotesData from '../quotes/quotes.json';

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
  currentQuote: { en: string; vi: string };
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
  const [roundsPerCycle, setRoundsPerCycle] = useState(4);
  const [isHovered, setIsHovered] = useState(false);
  const hoverTimeoutRef = useRef<number | null>(null);
  const settingsRef = useRef<HTMLDivElement>(null);
  const [localQuoteIndex, setLocalQuoteIndex] = useState(0);

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

  // Change quotes every 6 seconds
  useEffect(() => {
    const quoteInterval = setInterval(() => {
      setLocalQuoteIndex((prev) => (prev + 1) % quotesData.length);
    }, 6000);

    return () => clearInterval(quoteInterval);
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
   
      {/* Main TallMode Interface - Vertical Layout */}
      <div className="w-full h-full flex flex-col bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
        {/* Header Section - Add padding for drag area */}
        <div className="flex justify-between items-center p-4 pt-8 border-b border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
              <Timer className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white" style={{ color: "#1DB954" }}>Let's Focus To Your Dreams</h1>
              <p className="text-xs text-slate-400">Stay productive, stay focused</p>
            </div>
          </div>
          <Button
            onClick={() => setShowSettings(!showSettings)}
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-slate-400 hover:text-white hover:bg-slate-700/50"
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>

        {/* YouTube Section - Larger */}
        <motion.div
          className="px-4 py-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="w-full h-40 rounded-xl overflow-hidden bg-slate-800/50 border border-slate-700/50">
            <YouTubeAnchor className="w-full h-full" />
          </div>
        </motion.div>

        {/* Main Content - Vertical Stack */}
        <div className="flex-1 flex flex-col px-4 py-2 space-y-4 mt-3">
          {/* Mode Tabs - Horizontal */}
          <div className="flex justify-center">
            <Tabs value={currentTab} onValueChange={onTabChange} className="w-full max-w-lg">
              <TabsList className="grid w-full grid-cols-3 p-2 gap-2 rounded-2xl border-0 outline-none">
                <TabsTrigger
                  value="focus"
                  className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white data-[state=active]:border data-[state=active]:border-white data-[state=active]:shadow-xl data-[state=active]:scale-105 data-[state=inactive]:bg-slate-800/20 data-[state=inactive]:text-slate-400 data-[state=inactive]:opacity-60 data-[state=inactive]:border-0 data-[state=inactive]:hover:text-slate-300 data-[state=inactive]:hover:opacity-80 data-[state=inactive]:hover:bg-slate-700/30 transition-all duration-200 rounded-xl"
                >
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span className="font-semibold">Focus</span>
                  </div>
                </TabsTrigger>
                <TabsTrigger
                  value="shortBreak"
                  className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white data-[state=active]:border data-[state=active]:border-white data-[state=active]:shadow-xl data-[state=active]:scale-105 data-[state=inactive]:bg-slate-800/20 data-[state=inactive]:text-slate-400 data-[state=inactive]:opacity-60 data-[state=inactive]:border-0 data-[state=inactive]:hover:text-slate-300 data-[state=inactive]:hover:opacity-80 data-[state=inactive]:hover:bg-slate-700/30 transition-all duration-200 rounded-xl"
                >
                  <div className="flex items-center gap-2">
                    <Coffee className="w-4 h-4" />
                    <span className="font-semibold">Short</span>
                  </div>
                </TabsTrigger>
                <TabsTrigger
                  value="longBreak"
                  className="data-[state=active]:bg-emerald-500 data-[state=active]:text-white data-[state=active]:border data-[state=active]:border-white data-[state=active]:shadow-xl data-[state=active]:scale-105 data-[state=inactive]:bg-slate-800/20 data-[state=inactive]:text-slate-400 data-[state=inactive]:opacity-60 data-[state=inactive]:border-0 data-[state=inactive]:hover:text-slate-300 data-[state=inactive]:hover:opacity-80 data-[state=inactive]:hover:bg-slate-700/30 transition-all duration-200 rounded-xl"
                >
                  <div className="flex items-center gap-2">
                    <Coffee className="w-4 h-4" />
                    <span className="font-semibold">Long</span>
                  </div>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Timer Section - Large and Centered */}
          <div className="flex flex-col items-center justify-center space-y-1 py-4">
            {/* Timer Circle */}
            <div className="relative w-40 h-40">
              <svg
                className="w-full h-full transform -rotate-90"
                viewBox="0 0 100 100"
              >
                {/* Background Circle */}
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth="3"
                  fill="none"
                />
                {/* Progress Circle */}
                <motion.circle
                  cx="50"
                  cy="50"
                  r="45"
                  stroke="url(#timerGradient)"
                  strokeWidth="3"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 45}`}
                  initial={{ strokeDashoffset: 2 * Math.PI * 45 }}
                  animate={{
                    strokeDashoffset: 2 * Math.PI * 45 * (1 - getProgress() / 100),
                  }}
                  transition={{ duration: 0.5, ease: "easeInOut" }}
                />
                <defs>
                  <linearGradient id="timerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#10b981" />
                    <stop offset="50%" stopColor="#059669" />
                    <stop offset="100%" stopColor="#047857" />
                  </linearGradient>
                </defs>
              </svg>

              {/* Time Display */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <motion.div
                  key={timeLeft}
                  initial={{ scale: 1.1, opacity: 0.8 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  className="text-3xl font-mono font-bold text-white mb-1"
                >
                  {formatTime(timeLeft)}
                </motion.div>
                <div className="text-sm text-slate-400 font-medium">
                  {currentTab === 'focus' ? 'Focus Time' : currentTab === 'shortBreak' ? 'Short Break' : 'Long Break'}
                </div>
              </div>
            </div>

            {/* Control Buttons - Horizontal Row */}
            <div className="flex justify-center gap-4">
              <Button
                onClick={onPlayPause}
                className="h-12 w-12 rounded-full bg-white hover:bg-gray-100 text-gray-800 shadow-xl transition-all duration-200 hover:scale-105 active:scale-95"
              >
                {isRunning ? (
                  <Pause className="h-5 w-5" />
                ) : (
                  <Play className="h-5 w-5 ml-0.5" />
                )}
              </Button>

              <Button
                onClick={onSkip}
                variant="ghost"
                className="h-12 w-12 rounded-full bg-slate-700/50 hover:bg-slate-600/50 text-white shadow-lg transition-all duration-200 hover:scale-105 active:scale-95"
              >
                <SkipForward className="h-5 w-5" />
              </Button>

              <Button
                onClick={onReset}
                variant="ghost"
                className="h-12 w-12 rounded-full bg-slate-700/50 hover:bg-slate-600/50 text-white shadow-lg transition-all duration-200 hover:scale-105 active:scale-95"
              >
                <RotateCcw className="h-5 w-5" />
              </Button>
            </div>

          </div>

          {/* Quote Section - Separate section with more space */}
          <motion.div
            className="text-center py-4 flex-1 flex flex-col justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={`${quotesData[localQuoteIndex]?.en}-${quotesData[localQuoteIndex]?.vi}-${localQuoteIndex}`}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="space-y-3"
              >
                <motion.p 
                  className="text-sm text-emerald-400 font-medium italic leading-relaxed px-4"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25, delay: 0.05 }}
                >
                  "{quotesData[localQuoteIndex]?.en || 'Time is what we want most, but what we use worst.'}"
                </motion.p>
                <motion.p 
                  className="text-sm text-blue-400 font-medium italic leading-relaxed px-4"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25, delay: 0.1 }}
                >
                  "{quotesData[localQuoteIndex]?.vi || 'Thời gian là thứ chúng ta muốn nhất, nhưng lại sử dụng tệ nhất.'}"
                </motion.p>
                <motion.div 
                  className="w-full h-px bg-gradient-to-r from-transparent via-emerald-400/30 to-transparent"
                  initial={{ opacity: 0, scaleX: 0 }}
                  animate={{ opacity: 1, scaleX: 1 }}
                  exit={{ opacity: 0, scaleX: 0 }}
                  transition={{ duration: 0.2, delay: 0.15 }}
                />
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </div>
      </div>

      {/* Settings Panel Dropdown */}
      <AnimatePresence mode="wait" initial={false}>
        {showSettings && (
          <motion.div
            ref={settingsRef}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute top-16 right-4 w-80 bg-slate-800/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-slate-700/50 p-6 z-[1001]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Settings Header */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-700/50">
              <h2 className="text-lg font-bold text-white">Settings</h2>
              <button
                onClick={() => setShowSettings(false)}
                className="w-6 h-6 rounded-full bg-slate-700/50 hover:bg-slate-600/50 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Quick Settings */}
            <div className="mb-6">
              <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wide">
                Quick Settings
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 text-sm">
                    Rounds per cycle
                  </span>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() =>
                        setRoundsPerCycle(Math.max(1, roundsPerCycle - 1))
                      }
                      className="w-8 h-8 rounded-lg bg-slate-700/50 hover:bg-slate-600/50 flex items-center justify-center transition-colors"
                    >
                      <Minus className="h-4 w-4 text-white" />
                    </button>
                    <span className="text-white font-mono w-8 text-center text-lg">
                      {roundsPerCycle}
                    </span>
                    <button
                      onClick={() => setRoundsPerCycle(roundsPerCycle + 1)}
                      className="w-8 h-8 rounded-lg bg-slate-700/50 hover:bg-slate-600/50 flex items-center justify-center transition-colors"
                    >
                      <Plus className="h-4 w-4 text-white" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Durations */}
            <div className="mb-6">
              <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wide">
                Durations
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 text-sm">Focus</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        onWorkTimeChange(Math.max(1, customTimes.focus - 1))
                      }
                      className="px-3 py-1.5 bg-slate-700/50 hover:bg-slate-600/50 rounded-lg text-white text-xs font-medium transition-colors"
                    >
                      -1m
                    </button>
                    <span className="text-white font-mono w-12 text-center text-lg">
                      {customTimes.focus}m
                    </span>
                    <button
                      onClick={() => onWorkTimeChange(customTimes.focus + 1)}
                      className="px-3 py-1.5 bg-slate-700/50 hover:bg-slate-600/50 rounded-lg text-white text-xs font-medium transition-colors"
                    >
                      +1m
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 text-sm">Short Break</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        onShortBreakTimeChange(
                          Math.max(1, customTimes.shortBreak - 1)
                        )
                      }
                      className="px-3 py-1.5 bg-slate-700/50 hover:bg-slate-600/50 rounded-lg text-white text-xs font-medium transition-colors"
                    >
                      -1m
                    </button>
                    <span className="text-white font-mono w-12 text-center text-lg">
                      {customTimes.shortBreak}m
                    </span>
                    <button
                      onClick={() =>
                        onShortBreakTimeChange(customTimes.shortBreak + 1)
                      }
                      className="px-3 py-1.5 bg-slate-700/50 hover:bg-slate-600/50 rounded-lg text-white text-xs font-medium transition-colors"
                    >
                      +1m
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 text-sm">Long Break</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        onLongBreakTimeChange(
                          Math.max(1, customTimes.longBreak - 1)
                        )
                      }
                      className="px-3 py-1.5 bg-slate-700/50 hover:bg-slate-600/50 rounded-lg text-white text-xs font-medium transition-colors"
                    >
                      -1m
                    </button>
                    <span className="text-white font-mono w-12 text-center text-lg">
                      {customTimes.longBreak}m
                    </span>
                    <button
                      onClick={() =>
                        onLongBreakTimeChange(customTimes.longBreak + 1)
                      }
                      className="px-3 py-1.5 bg-slate-700/50 hover:bg-slate-600/50 rounded-lg text-white text-xs font-medium transition-colors"
                    >
                      +1m
                    </button>
                  </div>
                </div>
              </div>
            </div>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
