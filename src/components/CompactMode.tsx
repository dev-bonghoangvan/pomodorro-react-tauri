import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader } from '../ui/card'
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs'
import { Pin, Power, Timer, Coffee, Clock } from 'lucide-react'

interface CompactModeProps {
  timeLeft: number
  isRunning: boolean
  activeTab: string
  alwaysOnTop: boolean
  autoStart: boolean
  customTimes: { focus: number; shortBreak: number; longBreak: number }
  currentQuote: string
  isVietnamese: boolean
  onStart: () => void
  onPause: () => void
  onNext: () => void
  onToggleAlwaysOnTop: () => void
  onToggleAutostart: () => void
  onTabChange: (tab: string) => void
  onLanguageToggle: () => void
  getProgress: () => number
  formatTime: (seconds: number) => string
  getTabIcon: (tab: string) => JSX.Element
}

export function CompactMode({
  timeLeft,
  isRunning,
  activeTab,
  alwaysOnTop,
  autoStart,
  customTimes,
  currentQuote,
  isVietnamese,
  onStart,
  onPause,
  onNext,
  onToggleAlwaysOnTop,
  onToggleAutostart,
  onTabChange,
  onLanguageToggle,
  getProgress,
  formatTime,
  getTabIcon
}: CompactModeProps) {
  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-background via-muted/20 to-background rounded-2xl shadow-xl backdrop-blur-sm border border-white/10">
      {/* Header with Icons */}
      <div className="flex justify-end gap-1 p-2">
        <motion.button
          onClick={onToggleAlwaysOnTop}
          className={`p-1 rounded-full transition-colors ${
            alwaysOnTop 
              ? 'bg-primary text-primary-foreground' 
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          title="Always on Top"
        >
          <Pin className="w-3 h-3" />
        </motion.button>
        <motion.button
          onClick={onToggleAutostart}
          className={`p-1 rounded-full transition-colors ${
            autoStart 
              ? 'bg-primary text-primary-foreground' 
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          title="Start with Windows"
        >
          <Power className="w-3 h-3" />
        </motion.button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Left: Timer Section */}
        <div className="flex-1 flex flex-col items-center justify-center p-3">
          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={onTabChange} className="w-full mb-3">
            <TabsList className="grid w-full grid-cols-3 bg-gray-100 p-0.5 rounded-md border-0">
              <TabsTrigger 
                value="focus" 
                className="text-xs flex items-center justify-center gap-1 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-gray-800 text-gray-600 data-[state=inactive]:bg-transparent data-[state=inactive]:shadow-none data-[state=inactive]:border-0 data-[state=inactive]:ring-0 py-1"
              >
                {getTabIcon("focus")}
              </TabsTrigger>
              <TabsTrigger 
                value="shortBreak" 
                className="text-xs flex items-center justify-center gap-1 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-gray-800 text-gray-600 data-[state=inactive]:bg-transparent data-[state=inactive]:shadow-none data-[state=inactive]:border-0 data-[state=inactive]:ring-0 py-1"
              >
                {getTabIcon("shortBreak")}
              </TabsTrigger>
              <TabsTrigger 
                value="longBreak" 
                className="text-xs flex items-center justify-center gap-1 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-gray-800 text-gray-600 data-[state=inactive]:bg-transparent data-[state=inactive]:shadow-none data-[state=inactive]:border-0 data-[state=inactive]:ring-0 py-1"
              >
                {getTabIcon("longBreak")}
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Compact Timer Display */}
          <div className="relative w-20 h-20 mb-3">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke="currentColor"
                strokeWidth="2"
                fill="none"
                className="text-muted/30"
              />
              <motion.circle
                cx="50"
                cy="50"
                r="40"
                stroke="url(#compactGradient)"
                strokeWidth="3"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 40}`}
                initial={{ strokeDashoffset: 2 * Math.PI * 40 }}
                animate={{
                  strokeDashoffset: 2 * Math.PI * 40 * (1 - getProgress() / 100),
                }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
              />
              <defs>
                <linearGradient id="compactGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#059669" />
                  <stop offset="100%" stopColor="#10b981" />
                </linearGradient>
              </defs>
            </svg>

            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                className="text-sm font-mono font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent"
                key={timeLeft}
                initial={{ scale: 1.1 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.2 }}
              >
                {formatTime(timeLeft)}
              </motion.div>
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex justify-center gap-2">
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
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 text-sm font-semibold shadow-md"
                  >
                    START
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
                    className="bg-white hover:bg-gray-50 text-red-600 border border-gray-200 px-3 py-2 text-sm font-semibold shadow-md"
                  >
                    PAUSE
                  </Button>
                  <Button
                    onClick={onNext}
                    size="sm"
                    className="bg-red-600 hover:bg-red-700 text-white px-2 py-2 shadow-md"
                  >
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M7 6v12l10-6z" />
                      <path d="M17 6h2v12h-2z" />
                    </svg>
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right: Quote Section */}
        <div className="w-32 flex flex-col justify-center p-3 border-l border-border/50">
          {/* Language Toggle */}
          <div className="flex justify-center mb-2">
            <motion.button
              onClick={onLanguageToggle}
              className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-colors border ${
                isVietnamese 
                  ? 'bg-emerald-100 border-emerald-500 text-emerald-700' 
                  : 'bg-blue-100 border-blue-500 text-blue-700'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title={isVietnamese ? "Switch to English" : "Chuyển sang tiếng Việt"}
            >
              {isVietnamese ? "🇻🇳" : "🇺🇸"}
            </motion.button>
          </div>

          {/* Quote */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`${currentQuote}-${isVietnamese}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.5 }}
              className="text-center"
            >
              <p className="text-xs text-emerald-600 font-medium leading-tight">
                {currentQuote}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
