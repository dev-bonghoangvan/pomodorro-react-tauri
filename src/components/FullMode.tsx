import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '../ui/button'
import { Card, CardContent, CardHeader } from '../ui/card'
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog'
import { Label } from '../ui/label'
import { Input } from '../ui/input'
import { Pin, Power, Settings, Maximize2, Minimize2 } from 'lucide-react'
// @ts-ignore
import VietnamFlag from '../svgs/vietnam.svg'
// @ts-ignore
import USAFlag from '../svgs/usa.svg'

interface FullModeProps {
  timeLeft: number
  isRunning: boolean
  activeTab: string
  alwaysOnTop: boolean
  autoStart: boolean
  customTimes: { focus: number; shortBreak: number; longBreak: number }
  currentQuote: string
  isVietnamese: boolean
  isYouTubeExpanded: boolean
  youtubeUrl: string
  newYoutubeUrl: string
  editingTime: string | null
  tempTime: string
  onStart: () => void
  onPause: () => void
  onNext: () => void
  onToggleAlwaysOnTop: () => void
  onToggleAutostart: () => void
  onTabChange: (tab: string) => void
  onLanguageToggle: () => void
  onYouTubeToggle: () => void
  onYouTubeUrlChange: () => void
  onNewYoutubeUrlChange: (url: string) => void
  onTimeEdit: (type: string) => void
  onTimeSave: () => void
  onTempTimeChange: (time: string) => void
  getProgress: () => number
  formatTime: (seconds: number) => string
  getTabIcon: (tab: string) => JSX.Element
  getYouTubeEmbedUrl: (url: string) => string
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
  getYouTubeEmbedUrl
}: FullModeProps) {
  return (
    <div className="h-full flex flex-col">
      <Card className="gradient-card border-2 border-border/50 shadow-xl backdrop-blur-sm flex-1 flex flex-col rounded-2xl overflow-hidden">
        <CardHeader className="pb-4">
          {/* Top Right Icons */}
          <div className="flex justify-end gap-2 mb-4">
            <motion.button
              onClick={onToggleAlwaysOnTop}
              className={`p-2 rounded-full transition-colors ${
                alwaysOnTop 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title="Always on Top"
            >
              <Pin className="w-4 h-4" />
            </motion.button>
            <motion.button
              onClick={onToggleAutostart}
              className={`p-2 rounded-full transition-colors ${
                autoStart 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              title="Start with Windows"
            >
              <Power className="w-4 h-4" />
            </motion.button>
          </div>
          
          <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-gray-100 p-1 rounded-lg border-0">
              <TabsTrigger 
                value="focus" 
                className="text-xs flex items-center gap-1 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-gray-800 text-gray-600 data-[state=inactive]:bg-transparent data-[state=inactive]:shadow-none data-[state=inactive]:border-0 data-[state=inactive]:ring-0"
              >
                {getTabIcon("focus")}
                Focus
              </TabsTrigger>
              <TabsTrigger 
                value="shortBreak" 
                className="text-xs flex items-center gap-1 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-gray-800 text-gray-600 data-[state=inactive]:bg-transparent data-[state=inactive]:shadow-none data-[state=inactive]:border-0 data-[state=inactive]:ring-0"
              >
                {getTabIcon("shortBreak")}
                Short
              </TabsTrigger>
              <TabsTrigger 
                value="longBreak" 
                className="text-xs flex items-center gap-1 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-gray-800 text-gray-600 data-[state=inactive]:bg-transparent data-[state=inactive]:shadow-none data-[state=inactive]:border-0 data-[state=inactive]:ring-0"
              >
                {getTabIcon("longBreak")}
                Long
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>

        <CardContent className="space-y-6 flex-1 flex flex-col">
          {/* Timer Display with Circular Progress */}
          <div className="text-center relative">
            <div className="relative w-36 h-36 mx-auto mb-4">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                  className="text-muted/30"
                />
                <motion.circle
                  cx="50"
                  cy="50"
                  r="45"
                  stroke="url(#gradient)"
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
                  <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#059669" />
                    <stop offset="100%" stopColor="#10b981" />
                  </linearGradient>
                </defs>
              </svg>

              <div className="absolute inset-0 flex items-center justify-center">
                <motion.div
                  className="text-3xl font-mono font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent"
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
            <div className="flex items-center justify-center gap-2 mb-4">
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
                      className="w-16 h-8 text-center"
                      min="1"
                    />
                    <span className="text-sm text-muted-foreground">min</span>
                    <Button
                      size="sm"
                      onClick={onTimeSave}
                      className="bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      Save
                    </Button>
                  </motion.div>
                ) : (
                  <motion.button
                    onClick={() => onTimeEdit(activeTab)}
                    className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-1 rounded-full hover:bg-muted/50"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                  >
                    <Settings className="w-3 h-3" />
                    {customTimes[activeTab as keyof typeof customTimes]} min
                  </motion.button>
                )}
              </AnimatePresence>
            </div>

            {/* Control Buttons */}
            <div className="flex justify-center gap-3">
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
                      className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 text-base font-semibold shadow-lg"
                    >
                      START
                    </Button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="pause-next"
                    className="flex gap-3"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                  >
                    <Button
                      onClick={onPause}
                      size="lg"
                      className="bg-white hover:bg-gray-50 text-red-600 border-2 border-gray-200 px-6 py-2 text-sm font-semibold shadow-lg"
                    >
                      PAUSE
                    </Button>
                    <Button
                      onClick={onNext}
                      size="lg"
                      className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 shadow-lg"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M7 6v12l10-6z" />
                        <path d="M17 6h2v12h-2z" />
                      </svg>
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <motion.div
              className="mt-4 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              {/* Language Toggle Button */}
              <div className="flex justify-center mb-3">
                <motion.button
                  onClick={onLanguageToggle}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors border-2 ${
                    isVietnamese 
                      ? 'bg-emerald-100 border-emerald-500 text-emerald-700' 
                      : 'bg-blue-100 border-blue-500 text-blue-700'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  title={isVietnamese ? "Switch to English" : "Chuyển sang tiếng Việt"}
                >
                  {isVietnamese ? (
                    <img src={VietnamFlag} alt="Vietnam Flag" className="w-6 h-4 object-contain" />
                  ) : (
                    <img src={USAFlag} alt="USA Flag" className="w-6 h-4 object-contain" />
                  )}
                </motion.button>
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={`${currentQuote}-${isVietnamese}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.5 }}
                  className="space-y-2"
                >
                  <p className="text-base text-emerald-600 font-medium">{currentQuote}</p>
                  <div className="w-full h-px bg-gradient-to-r from-transparent via-emerald-200 to-transparent" />
                </motion.div>
              </AnimatePresence>
            </motion.div>
          </div>

          {/* Background Music section */}
          <motion.div
            className="border-t pt-4 flex-1 flex flex-col"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Background Music</span>
                <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
              <div className="flex gap-2">
                {/* Settings icon */}
                <Dialog>
                  <DialogTrigger asChild>
                    <motion.div>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Settings className="w-4 h-4" />
                      </Button>
                    </motion.div>
                  </DialogTrigger>
                  
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Change YouTube URL</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="youtube-url">YouTube URL</Label>
                        <Input
                          id="youtube-url"
                          value={newYoutubeUrl}
                          onChange={(e) => onNewYoutubeUrlChange(e.target.value)}
                          placeholder="https://www.youtube.com/watch?v=..."
                        />
                      </div>
                      <Button
                        onClick={onYouTubeUrlChange}
                        className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
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
                    className="h-8 w-8 p-0"
                    onClick={onYouTubeToggle}
                  >
                    {isYouTubeExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
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
                  animate={{ opacity: 1, height: 150 }}
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
                    allowFullScreen
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="motivational-text"
                  className="text-center py-4 flex-1 flex items-center justify-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <p className="text-sm text-muted-foreground italic font-bold">
                    /ĐỘNG LỰC HỌC TẬP/ "Nếu không hành động thì giấc mơ mãi mãi chỉ là giấc mơ..."
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </CardContent>
      </Card>
    </div>
  )
}
