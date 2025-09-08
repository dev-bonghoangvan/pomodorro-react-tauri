import React from 'react'
import { Card, CardContent } from '../ui/card'
import { Button } from '../ui/button'
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs'
import { motion } from 'framer-motion'
import { Play, Pause, SkipForward, RotateCcw, Pin, PinOff, Settings, Minimize2 } from 'lucide-react'

interface TallModeProps {
  timeLeft: number
  isRunning: boolean
  currentTab: string
  onTabChange: (value: string) => void
  onPlayPause: () => void
  onSkip: () => void
  onReset: () => void
  alwaysOnTop: boolean
  onAlwaysOnTopToggle: () => void
  autoStart: boolean
  onAutoStartToggle: () => void
  onMinimize: () => void
  onSettings: () => void
  currentQuote: string
  isVietnamese: boolean
  onLanguageToggle: () => void
  workTime: number
  shortBreakTime: number
  longBreakTime: number
  onWorkTimeChange: (value: number) => void
  onShortBreakTimeChange: (value: number) => void
  onLongBreakTimeChange: (value: number) => void
}

export function TallMode({
  timeLeft,
  isRunning,
  currentTab,
  onTabChange,
  onPlayPause,
  onSkip,
  onReset,
  alwaysOnTop,
  onAlwaysOnTopToggle,
  autoStart,
  onAutoStartToggle,
  onMinimize,
  onSettings,
  currentQuote,
  isVietnamese,
  onLanguageToggle,
  workTime,
  shortBreakTime,
  longBreakTime,
  onWorkTimeChange,
  onShortBreakTimeChange,
  onLongBreakTimeChange
}: TallModeProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const getProgress = () => {
    const totalTime = currentTab === 'work' ? workTime * 60 : 
                     currentTab === 'shortBreak' ? shortBreakTime * 60 : 
                     longBreakTime * 60
    return ((totalTime - timeLeft) / totalTime) * 100
  }

  return (
    <Card className="w-full h-full rounded-2xl overflow-hidden shadow-xl backdrop-blur-sm border border-white/10 bg-white/5">
      <CardContent className="p-4 h-full flex flex-col">
        {/* Header with utility icons */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onAlwaysOnTopToggle}
              className={`h-8 w-8 p-0 ${alwaysOnTop ? 'text-blue-500' : 'text-gray-400'}`}
            >
              {alwaysOnTop ? <Pin className="h-4 w-4" /> : <PinOff className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onAutoStartToggle}
              className={`h-8 w-8 p-0 ${autoStart ? 'text-green-500' : 'text-gray-400'}`}
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onMinimize}
            className="h-8 w-8 p-0 text-gray-400"
          >
            <Minimize2 className="h-4 w-4" />
          </Button>
        </div>

        {/* Timer - Top Section */}
        <div className="flex-1 flex flex-col items-center justify-center mb-6">
          <div className="relative mb-4">
            {/* Progress Circle */}
            <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="45"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="8"
                fill="none"
              />
              <motion.circle
                cx="50"
                cy="50"
                r="45"
                stroke="url(#gradient)"
                strokeWidth="8"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 45}`}
                strokeDashoffset={`${2 * Math.PI * 45 * (1 - getProgress() / 100)}`}
                initial={{ strokeDashoffset: 2 * Math.PI * 45 }}
                animate={{ strokeDashoffset: 2 * Math.PI * 45 * (1 - getProgress() / 100) }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
              />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#8b5cf6" />
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
                className="text-2xl font-bold text-white"
              >
                {formatTime(timeLeft)}
              </motion.div>
            </div>
          </div>
        </div>

        {/* Tabs - Icon Only */}
        <Tabs value={currentTab} onValueChange={onTabChange} className="mb-4">
          <TabsList className="grid w-full grid-cols-3 bg-white/10 border-0">
            <TabsTrigger 
              value="work" 
              className="data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-lg data-[state=inactive]:bg-transparent data-[state=inactive]:shadow-none data-[state=inactive]:border-0 data-[state=inactive]:ring-0"
            >
              <div className="flex flex-col items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                <span className="text-xs">Work</span>
              </div>
            </TabsTrigger>
            <TabsTrigger 
              value="shortBreak"
              className="data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-lg data-[state=inactive]:bg-transparent data-[state=inactive]:shadow-none data-[state=inactive]:border-0 data-[state=inactive]:ring-0"
            >
              <div className="flex flex-col items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span className="text-xs">Short</span>
              </div>
            </TabsTrigger>
            <TabsTrigger 
              value="longBreak"
              className="data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-lg data-[state=inactive]:bg-transparent data-[state=inactive]:shadow-none data-[state=inactive]:border-0 data-[state=inactive]:ring-0"
            >
              <div className="flex flex-col items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                <span className="text-xs">Long</span>
              </div>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Controls - Bottom Section */}
        <div className="flex justify-center gap-3 mb-4">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              onClick={onPlayPause}
              className="h-12 w-12 rounded-full bg-white/20 hover:bg-white/30 border border-white/20"
            >
              {isRunning ? (
                <Pause className="h-6 w-6 text-white" />
              ) : (
                <Play className="h-6 w-6 text-white ml-1" />
              )}
            </Button>
          </motion.div>
          
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              onClick={onSkip}
              variant="ghost"
              className="h-12 w-12 rounded-full hover:bg-white/20"
            >
              <SkipForward className="h-6 w-6 text-white" />
            </Button>
          </motion.div>
          
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              onClick={onReset}
              variant="ghost"
              className="h-12 w-12 rounded-full hover:bg-white/20"
            >
              <RotateCcw className="h-6 w-6 text-white" />
            </Button>
          </motion.div>
        </div>

        {/* Quote Section - Condensed */}
        <div className="text-center">
          <motion.p
            key={currentQuote}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.5 }}
            className="text-sm text-white/80 mb-2 line-clamp-2"
          >
            {currentQuote}
          </motion.p>
          
          {/* Language Toggle */}
          <Button
            onClick={onLanguageToggle}
            variant="ghost"
            size="sm"
            className={`h-8 px-2 rounded-lg ${
              isVietnamese 
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
            }`}
          >
            <img 
              src={isVietnamese ? '/src/svgs/vietnam.svg' : '/src/svgs/usa.svg'} 
              alt={isVietnamese ? 'Vietnamese' : 'English'}
              className="w-5 h-5 object-contain"
            />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
