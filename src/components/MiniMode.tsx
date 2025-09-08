import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '../ui/button'
import { Pin, Power } from 'lucide-react'

interface MiniModeProps {
  timeLeft: number
  isRunning: boolean
  activeTab: string
  alwaysOnTop: boolean
  autoStart: boolean
  onStart: () => void
  onPause: () => void
  onNext: () => void
  onToggleAlwaysOnTop: () => void
  onToggleAutostart: () => void
  getProgress: () => number
  formatTime: (seconds: number) => string
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
  formatTime
}: MiniModeProps) {
  return (
    <div className="h-full flex items-center justify-between px-3 py-2 bg-gradient-to-r from-background via-muted/20 to-background rounded-2xl">
      {/* Left: Timer Display */}
      <div className="flex items-center gap-3">
        {/* Mini Progress Circle */}
        <div className="relative w-8 h-8">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="40"
              stroke="currentColor"
              strokeWidth="3"
              fill="none"
              className="text-muted/30"
            />
            <motion.circle
              cx="50"
              cy="50"
              r="40"
              stroke="url(#miniGradient)"
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
              <linearGradient id="miniGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#059669" />
                <stop offset="100%" stopColor="#10b981" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Timer Text */}
        <div className="text-sm font-mono font-bold text-foreground">
          {formatTime(timeLeft)}
        </div>
      </div>

      {/* Center: Progress Bar */}
      <div className="flex-1 mx-4">
        <div className="w-full h-1 bg-muted/30 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${getProgress()}%` }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
          />
        </div>
      </div>

      {/* Right: Control Buttons */}
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
                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 text-xs font-semibold shadow-md h-6"
              >
                ▶
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="pause-next"
              className="flex gap-1"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <Button
                onClick={onPause}
                size="sm"
                className="bg-white hover:bg-gray-50 text-red-600 border border-gray-200 px-2 py-1 text-xs font-semibold shadow-md h-6"
              >
                ⏸
              </Button>
              <Button
                onClick={onNext}
                size="sm"
                className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 shadow-md h-6"
              >
                ⏭
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Utility Icons - Only show on hover */}
      <div className="opacity-0 hover:opacity-100 transition-opacity duration-200 flex items-center gap-1 ml-2">
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
    </div>
  )
}
