import { AnimatePresence, motion } from 'framer-motion';
import {
    ChevronDown, Maximize2, Minimize2, Minus, MoreVertical, Plus, Settings, Volume2, VolumeX, X
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

// @ts-ignore
import USAFlag from '../svgs/usa.svg';
// @ts-ignore
import VietnamFlag from '../svgs/vietnam.svg';
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
  alwaysOnTop: boolean;
  autoStart: boolean;
  customTimes: { focus: number; shortBreak: number; longBreak: number };
  currentQuote: string;
  isVietnamese: boolean;
  isYouTubeExpanded: boolean;
  youtubeUrl: string;
  newYoutubeUrl: string;
  editingTime: string | null;
  tempTime: string;
  onStart: () => void;
  onPause: () => void;
  onNext: () => void;
  onToggleAlwaysOnTop: () => void;
  onToggleAutostart: () => void;
  onTabChange: (tab: string) => void;
  onLanguageToggle: () => void;
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
  alwaysOnTop,
  autoStart,
  customTimes,
  currentQuote,
  isVietnamese,
  isYouTubeExpanded,
  youtubeUrl,
  newYoutubeUrl,
  editingTime,
  tempTime,
  onStart,
  onPause,
  onNext,
  onToggleAlwaysOnTop,
  onToggleAutostart,
  onTabChange,
  onLanguageToggle,
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

  return (
    <div className="relative h-full flex flex-col" ref={settingsRef}>
      {/* Main FullMode Interface */}
      <Card className="flex-1 flex flex-col rounded-2xl overflow-hidden shadow-2xl border border-gray-600 bg-gradient-to-br from-gray-800 via-gray-700 to-gray-800">
        <CardHeader className="pb-4">
          {/* Header with title and settings */}
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-3">
              <span className="text-xl font-bold text-white">
                Pomodoro Timer
              </span>
              <span className="text-sm text-gray-400">v1.0</span>
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
            </div>
          </div>

          <Tabs
            value={activeTab}
            onValueChange={onTabChange}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-3 bg-gray-700/50 p-1 rounded-lg border border-gray-600">
              <TabsTrigger
                value="focus"
                className="text-sm flex items-center gap-2 data-[state=active]:bg-emerald-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=inactive]:bg-transparent data-[state=inactive]:text-gray-300 data-[state=inactive]:hover:text-white"
              >
                {getTabIcon("focus")}
                Focus
              </TabsTrigger>
              <TabsTrigger
                value="shortBreak"
                className="text-sm flex items-center gap-2 data-[state=active]:bg-emerald-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=inactive]:bg-transparent data-[state=inactive]:text-gray-300 data-[state=inactive]:hover:text-white"
              >
                {getTabIcon("shortBreak")}
                Short Break
              </TabsTrigger>
              <TabsTrigger
                value="longBreak"
                className="text-sm flex items-center gap-2 data-[state=active]:bg-emerald-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=inactive]:bg-transparent data-[state=inactive]:text-gray-300 data-[state=inactive]:hover:text-white"
              >
                {getTabIcon("longBreak")}
                Long Break
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>

        <CardContent className="space-y-8 flex-1 flex flex-col">
          {/* Timer Display with Circular Progress */}
          <div className="text-center relative">
            <div className="relative w-48 h-48 mx-auto mb-6">
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
            <div className="flex items-center justify-center gap-2 mb-6">
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
            <div className="flex justify-center gap-4 mb-6">
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

            <motion.div
              className="mt-6 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              {/* Language Toggle Button */}
              <div className="flex justify-center mb-4">
                <motion.button
                  onClick={onLanguageToggle}
                  className={`flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-colors border-2 ${
                    isVietnamese
                      ? "bg-emerald-500/20 border-emerald-500 text-emerald-400"
                      : "bg-blue-500/20 border-blue-500 text-blue-400"
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  title={
                    isVietnamese
                      ? "Switch to English"
                      : "Chuyển sang tiếng Việt"
                  }
                >
                  {isVietnamese ? (
                    <img
                      src={VietnamFlag}
                      alt="Vietnam Flag"
                      className="w-6 h-4 object-contain"
                    />
                  ) : (
                    <img
                      src={USAFlag}
                      alt="USA Flag"
                      className="w-6 h-4 object-contain"
                    />
                  )}
                  <span>{isVietnamese ? "Tiếng Việt" : "English"}</span>
                </motion.button>
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={`${currentQuote}-${isVietnamese}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.5 }}
                  className="space-y-3"
                >
                  <p className="text-lg text-emerald-400 font-medium italic">
                    {currentQuote}
                  </p>
                  <div className="w-full h-px bg-gradient-to-r from-transparent via-emerald-400/30 to-transparent" />
                </motion.div>
              </AnimatePresence>
            </motion.div>
          </div>

          {/* Background Music section */}
          <motion.div
            className="border-t border-gray-600 pt-6 flex-1 flex flex-col"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-lg font-semibold text-white">
                  Background Music
                </span>
                <svg
                  className="w-5 h-5 text-emerald-400"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
              <div className="flex gap-2">
                {/* Settings icon */}
                <Dialog>
                  <DialogTrigger asChild>
                    <motion.div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-10 w-10 p-0 text-gray-300 hover:text-white"
                      >
                        <Settings className="w-5 h-5" />
                      </Button>
                    </motion.div>
                  </DialogTrigger>

                  <DialogContent className="bg-gray-800 border-gray-600">
                    <DialogHeader>
                      <DialogTitle className="text-white">
                        Change YouTube URL
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="youtube-url" className="text-gray-300">
                          YouTube URL
                        </Label>
                        <Input
                          id="youtube-url"
                          value={newYoutubeUrl}
                          onChange={(e) =>
                            onNewYoutubeUrlChange(e.target.value)
                          }
                          placeholder="https://www.youtube.com/watch?v=..."
                          className="bg-gray-700 border-gray-600 text-white"
                        />
                      </div>
                      <Button
                        onClick={onYouTubeUrlChange}
                        className="w-full bg-emerald-500 hover:bg-emerald-600 text-white"
                      >
                        Update URL
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                {/* Expand/Collapse toggle */}
                <motion.div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-10 w-10 p-0 text-gray-300 hover:text-white"
                    onClick={onYouTubeToggle}
                  >
                    {isYouTubeExpanded ? (
                      <Minimize2 className="w-5 h-5" />
                    ) : (
                      <Maximize2 className="w-5 h-5" />
                    )}
                  </Button>
                </motion.div>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {isYouTubeExpanded ? (
                <motion.div
                  key="youtube-iframe"
                  className="overflow-hidden rounded-lg flex-1"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 200 }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{
                    duration: 0.4,
                    ease: [0.4, 0, 0.2, 1],
                  }}
                >
                  <iframe
                    src={getYouTubeEmbedUrl(youtubeUrl)}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    referrerPolicy="no-referrer"
                    sandbox="allow-scripts allow-same-origin allow-presentation"
                    allowFullScreen
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="motivational-text"
                  className="text-center py-8 flex-1 flex items-center justify-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <p className="text-base text-gray-400 italic font-medium">
                    /ĐỘNG LỰC HỌC TẬP/ "Nếu không hành động thì giấc mơ mãi mãi
                    chỉ là giấc mơ..."
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </CardContent>
      </Card>

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
                  <span className="text-gray-300 text-sm">Auto start next</span>
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
