import { AnimatePresence, motion } from 'framer-motion';
import {
    ChevronDown, Headphones, Maximize2, Minimize2, Minus, MoreVertical, Play, Plus, Settings, Volume2, VolumeX, X
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { invoke } from '@tauri-apps/api/core';

// @ts-ignore
import USAFlag from '../svgs/usa.svg';
// @ts-ignore
import VietnamFlag from '../svgs/vietnam.svg';
import quotesData from '../quotes/quotes.json';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader } from '../ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs';

interface FullModeProps {
  timeLeft: number;
  isRunning: boolean;
  activeTab: string;
  customTimes: { focus: number; shortBreak: number; longBreak: number };
  isVietnamese: boolean;
  isYouTubeExpanded: boolean;
  youtubeUrl: string;
  newYoutubeUrl: string;
  editingTime: string | null;
  tempTime: string;
  onStart: () => void;
  onPause: () => void;
  onNext: () => void;
  onTabChange: (tab: string) => void;
  onYouTubeToggle: () => void;
  onYouTubeUrlChange: () => void;
  onNewYoutubeUrlChange: (url: string) => void;
  onTimeEdit: (type: string) => void;
  onTimeSave: () => void;
  onTempTimeChange: (time: string) => void;
  getProgress: () => number;
  formatTime: (seconds: number) => string;
  getTabIcon: (tab: string) => JSX.Element;
  getYouTubeEmbedUrl: (url: string) => string;
}

export function FullMode({
  timeLeft,
  isRunning,
  activeTab,
  customTimes,
  isVietnamese,
  isYouTubeExpanded,
  youtubeUrl,
  newYoutubeUrl,
  editingTime,
  tempTime,
  onStart,
  onPause,
  onNext,
  onTabChange,
  onYouTubeToggle,
  onYouTubeUrlChange,
  onNewYoutubeUrlChange,
  onTimeEdit,
  onTimeSave,
  onTempTimeChange,
  getProgress,
  formatTime,
  getTabIcon,
  getYouTubeEmbedUrl,
}: FullModeProps) {
  const [showSettings, setShowSettings] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [roundsPerCycle, setRoundsPerCycle] = useState(4);
  const [quoteSpeed, setQuoteSpeed] = useState("Normal");
  const [isHovered, setIsHovered] = useState(false);
  const hoverTimeoutRef = useRef<number | null>(null);
  const settingsRef = useRef<HTMLDivElement>(null);
  const [animationKey, setAnimationKey] = useState(0);
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);

  // Get current quote from local state instead of props
  const getCurrentQuote = () => {
    return quotesData[currentQuoteIndex] || quotesData[0];
  };

  // Random quote selection (avoid immediate repeat)
  const getRandomQuote = () => {
    if (quotesData.length <= 1) return 0;
    let next = currentQuoteIndex;
    // Ensure different index; loop will run at most length-1 times
    while (next === currentQuoteIndex) {
      next = Math.floor(Math.random() * quotesData.length);
    }
    return next;
  };

  // Auto-rotate quotes every 4 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentQuoteIndex(getRandomQuote());
      setAnimationKey(prev => prev + 1);
    }, 4000); // 4 seconds per quote

    return () => clearInterval(interval);
  }, [currentQuoteIndex]);

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

  return (
    <div 
      className="relative h-full flex flex-col" 
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Hover Header Bar - Fade in/out */}
      <AnimatePresence>
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

      {/* Main FullMode Interface */}
      <Card className="flex-1 flex flex-col overflow-hidden shadow-2xl border border-gray-600 bg-gradient-to-br from-gray-800 via-gray-700 to-gray-800">
        <CardHeader className="pb-4 pt-10">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3">
              <span className="text-xl font-bold text-white">
                Pomodoro Timer
              </span>
              <span className="text-sm text-gray-400">v1.0</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => {
                  console.log('Settings button clicked, current state:', showSettings);
                  setShowSettings(!showSettings);
                }}
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-gray-300 hover:text-white z-[70] relative"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col p-0">
          {/* Main Layout - YouTube + Timer Side by Side */}
          <div className="flex-1 flex flex-col xl:flex-row gap-4 p-6">
            {/* Left Side - YouTube (Larger) */}
            <div className="flex-1 flex flex-col p-4">
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-lg font-semibold text-white">
                    Background Music
                  </span>
                  <Headphones className="w-5 h-5 text-emerald-400" />
                </div>
                
                {/* YouTube URL Input */}
                <div className="flex gap-2 flex-1 items-center">
                  <Input
                    id="youtube-url"
                    value={newYoutubeUrl}
                    onChange={(e) => onNewYoutubeUrlChange(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        onYouTubeUrlChange();
                      }
                    }}
                    placeholder="Paste YouTube URL here..."
                    className="flex-1 h-10 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  />
                  <Button
                    onClick={onYouTubeUrlChange}
                    size="sm"
                    className="h-10 w-10 bg-emerald-500 hover:bg-emerald-600 text-white p-0 flex items-center justify-center"
                  >
                    <Play className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* YouTube iframe - Much larger */}
              <div className="flex-1 min-h-[300px] rounded-lg overflow-hidden bg-gray-700 p-2">
                <iframe
                  src={getYouTubeEmbedUrl(youtubeUrl)}
                  className="w-full h-full rounded-md"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  referrerPolicy="no-referrer"
                  sandbox="allow-scripts allow-same-origin allow-presentation"
                  allowFullScreen
                />
              </div>
            </div>

            {/* Right Side - Timer and Controls */}
            <div className="xl:w-80 flex flex-col space-y-6">
              {/* Tabs - Aligned with YouTube input */}
              <div className="pt-0">
                <Tabs
                  value={activeTab}
                  onValueChange={onTabChange}
                  className="w-full"
                >
                  <TabsList className="grid w-full grid-cols-3 bg-transparent p-0 gap-2">
                    <TabsTrigger
                      value="focus"
                      className="text-sm flex items-center gap-2 data-[state=active]:bg-emerald-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:border data-[state=active]:border-white data-[state=active]:rounded-lg data-[state=inactive]:bg-gray-700/30 data-[state=inactive]:text-gray-400 data-[state=inactive]:hover:text-gray-200 data-[state=inactive]:hover:bg-gray-700/50 data-[state=inactive]:rounded-lg data-[state=inactive]:border-0 transition-all duration-200"
                    >
                      {getTabIcon("focus")}
                      Focus
                    </TabsTrigger>
                    <TabsTrigger
                      value="shortBreak"
                      className="text-sm flex items-center gap-2 data-[state=active]:bg-emerald-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:border data-[state=active]:border-white data-[state=active]:rounded-lg data-[state=inactive]:bg-gray-700/30 data-[state=inactive]:text-gray-400 data-[state=inactive]:hover:text-gray-200 data-[state=inactive]:hover:bg-gray-700/50 data-[state=inactive]:rounded-lg data-[state=inactive]:border-0 transition-all duration-200"
                    >
                      {getTabIcon("shortBreak")}
                      Short Break
                    </TabsTrigger>
                    <TabsTrigger
                      value="longBreak"
                      className="text-sm flex items-center gap-2 data-[state=active]:bg-emerald-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:border data-[state=active]:border-white data-[state=active]:rounded-lg data-[state=inactive]:bg-gray-700/30 data-[state=inactive]:text-gray-400 data-[state=inactive]:hover:text-gray-200 data-[state=inactive]:hover:bg-gray-700/50 data-[state=inactive]:rounded-lg data-[state=inactive]:border-0 transition-all duration-200"
                    >
                      {getTabIcon("longBreak")}
                      Long Break
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {/* Timer Display */}
              <div className="relative w-48 h-48 mx-auto">
                <svg
                  className="w-full h-full transform -rotate-90"
                  viewBox="0 0 100 100"
                >
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth="4"
                    fill="none"
                  />
                  <motion.circle
                    cx="50"
                    cy="50"
                    r="45"
                    stroke="url(#gradient)"
                    strokeWidth="4"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 45}`}
                    initial={{ strokeDashoffset: 2 * Math.PI * 45 }}
                    animate={{
                      strokeDashoffset:
                        2 * Math.PI * 45 * (1 - getProgress() / 100),
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

                <div className="absolute inset-0 flex items-center justify-center">
                  <motion.div
                    className="text-4xl font-mono font-bold text-white"
                    key={timeLeft}
                    initial={{ scale: 1.1 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.2 }}
                  >
                    {formatTime(timeLeft)}
                  </motion.div>
                </div>
              </div>

              {/* Time Settings */}
              <div className="flex items-center justify-center gap-2">
                <AnimatePresence mode="wait">
                  {editingTime === activeTab ? (
                    <motion.div
                      className="flex items-center gap-2"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                    >
                      <Input
                        type="number"
                        value={tempTime}
                        onChange={(e) => onTempTimeChange(e.target.value)}
                        className="w-20 h-10 text-center bg-gray-700 border-gray-600 text-white"
                        min="1"
                      />
                      <span className="text-sm text-gray-300">min</span>
                      <Button
                        size="sm"
                        onClick={onTimeSave}
                        className="bg-emerald-500 hover:bg-emerald-600 text-white"
                      >
                        Save
                      </Button>
                    </motion.div>
                  ) : (
                    <motion.button
                      onClick={() => onTimeEdit(activeTab)}
                      className="flex items-center gap-2 text-sm text-gray-300 hover:text-white transition-colors px-4 py-2 rounded-lg hover:bg-gray-700/50"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                    >
                      <Settings className="w-4 h-4" />
                      {customTimes[activeTab as keyof typeof customTimes]} min
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>

              {/* Control Buttons */}
              <div className="flex justify-center gap-4">
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
                        size="lg"
                        className="bg-white hover:bg-gray-100 text-gray-800 px-12 py-4 text-lg font-semibold shadow-lg rounded-full"
                      >
                        START
                      </Button>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="pause-next"
                      className="flex gap-4"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                    >
                      <Button
                        onClick={onPause}
                        size="lg"
                        className="bg-gray-600 hover:bg-gray-500 text-white border-2 border-gray-500 px-8 py-3 text-base font-semibold shadow-lg rounded-full"
                      >
                        PAUSE
                      </Button>
                      <Button
                        onClick={onNext}
                        size="lg"
                        className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 shadow-lg rounded-full"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M7 6v12l10-6z" />
                          <path d="M17 6h2v12h-2z" />
                        </svg>
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Quotes */}
              <div className="text-center w-full">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`${getCurrentQuote().en}-${getCurrentQuote().vi}-${animationKey}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="space-y-3"
                  >
                    <motion.p 
                      className="text-base text-emerald-400 font-medium italic leading-relaxed"
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      transition={{ duration: 0.5, delay: 0.1 }}
                    >
                      "{getCurrentQuote().en}"
                    </motion.p>
                    <motion.p 
                      className="text-base text-blue-400 font-medium italic leading-relaxed"
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      transition={{ duration: 0.5, delay: 0.2 }}
                    >
                      "{getCurrentQuote().vi}"
                    </motion.p>
                    <motion.div 
                      className="w-full h-px bg-gradient-to-r from-transparent via-emerald-400/30 to-transparent"
                      initial={{ opacity: 0, scaleX: 0 }}
                      animate={{ opacity: 1, scaleX: 1 }}
                      exit={{ opacity: 0, scaleX: 0 }}
                      transition={{ duration: 0.4, delay: 0.3 }}
                    />
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Settings Panel Dropdown */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            ref={settingsRef}
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute top-20 right-4 w-80 bg-gray-800 rounded-2xl shadow-2xl border border-gray-600 p-6 z-[60]"
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
                      onClick={() => onTimeEdit("focus")}
                      className="px-3 py-1 bg-gray-600 hover:bg-gray-500 rounded text-white text-xs"
                    >
                      Edit
                    </button>
                    <span className="text-white font-mono w-12 text-center">
                      {customTimes.focus}m
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300 text-sm">Short Break</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onTimeEdit("shortBreak")}
                      className="px-3 py-1 bg-gray-600 hover:bg-gray-500 rounded text-white text-xs"
                    >
                      Edit
                    </button>
                    <span className="text-white font-mono w-12 text-center">
                      {customTimes.shortBreak}m
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300 text-sm">Long Break</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onTimeEdit("longBreak")}
                      className="px-3 py-1 bg-gray-600 hover:bg-gray-500 rounded text-white text-xs"
                    >
                      Edit
                    </button>
                    <span className="text-white font-mono w-12 text-center">
                      {customTimes.longBreak}m
                    </span>
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
