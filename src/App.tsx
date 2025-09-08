import { useEffect, useRef, useState } from 'react'

import { Play, Pencil, ChevronUp, ChevronDown, Settings, Maximize2, Minimize2, Timer, Coffee, Clock, Pin, Power, Languages } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { WebviewWindow, appWindow } from '@tauri-apps/api/window'
import { invoke } from '@tauri-apps/api/tauri'
import { Tabs, TabsList, TabsTrigger } from './ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from './ui/dialog'
import { Label } from './ui/label'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader } from './ui/card'
import { Input } from './ui/input'
import quotesData from './quotes/quotes.json'
// @ts-ignore
import VietnamFlag from './svgs/vietnam.svg'
// @ts-ignore
import USAFlag from './svgs/usa.svg'

function useInterval(callback: () => void, delay: number | null) {
  const saved = useRef(callback)
  useEffect(() => { saved.current = callback }, [callback])
  useEffect(() => {
    if (delay === null) return
    const id = setInterval(() => saved.current(), delay)
    return () => clearInterval(id)
  }, [delay])
}

export default function App() {
  const [activeTab, setActiveTab] = useState("focus")
  const [timeLeft, setTimeLeft] = useState(30 * 60) // 30 minutes in seconds
  const [isRunning, setIsRunning] = useState(false)
  const [isYouTubeExpanded, setIsYouTubeExpanded] = useState(false)
  const [youtubeUrl, setYoutubeUrl] = useState("https://www.youtube.com/watch?v=YNDT833ahtc")
  const [newYoutubeUrl, setNewYoutubeUrl] = useState("")
  const [customTimes, setCustomTimes] = useState({
    focus: 30,
    shortBreak: 5,
    longBreak: 10,
  })
  const [editingTime, setEditingTime] = useState<string | null>(null)
  const [tempTime, setTempTime] = useState("")
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0)
  const [isVietnamese, setIsVietnamese] = useState(false) // Default to English
  const [alwaysOnTop, setAlwaysOnTop] = useState(true)
  const [autoStart, setAutoStart] = useState(false)
  const intervalRef = useRef<number | null>(null)

  useEffect(() => {
    const quoteInterval = setInterval(() => {
      setCurrentQuoteIndex((prev) => (prev + 1) % quotesData.length)
    }, 6000) // Tăng từ 5 giây lên 8 giây

    return () => clearInterval(quoteInterval)
  }, [quotesData.length])

  // Timer logic
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1)
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isRunning, timeLeft])

  // Update timer when tab changes
  useEffect(() => {
    setIsRunning(false)
    switch (activeTab) {
      case "focus":
        setTimeLeft(customTimes.focus * 60)
        break
      case "shortBreak":
        setTimeLeft(customTimes.shortBreak * 60)
        break
      case "longBreak":
        setTimeLeft(customTimes.longBreak * 60)
        break
    }
  }, [activeTab, customTimes])

  // Sound notification when timer ends
  useEffect(() => {
    if (timeLeft === 0 && isRunning) {
      // beep sound
      try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
        const o = ctx.createOscillator(); const g = ctx.createGain()
        o.connect(g); g.connect(ctx.destination)
        o.type = 'sine'; o.frequency.value = 880
        g.gain.value = 0.1; o.start(); setTimeout(()=>{o.stop(); ctx.close()}, 600)
      } catch {}
    }
  }, [timeLeft, isRunning])

  // Window always-on-top toggle via Rust (safer across versions)
  useEffect(() => {
    invoke('set_always_on_top', { on: alwaysOnTop }).catch(()=>{})
  }, [alwaysOnTop])

  // Try read autostart state (Windows only; no-op on other OS)
  useEffect(() => {
    invoke<boolean>('is_autostart_enabled').then(v => setAutoStart(!!v)).catch(() => {})
  }, [])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const handleStart = () => setIsRunning(true)
  const handlePause = () => setIsRunning(false)
  const handleStop = () => {
    setIsRunning(false)
    switch (activeTab) {
      case "focus":
        setTimeLeft(customTimes.focus * 60)
        break
      case "shortBreak":
        setTimeLeft(customTimes.shortBreak * 60)
        break
      case "longBreak":
        setTimeLeft(customTimes.longBreak * 60)
        break
    }
  }

  const handleNext = () => {
    const tabs = ["focus", "shortBreak", "longBreak"]
    const currentIndex = tabs.indexOf(activeTab)
    const nextIndex = (currentIndex + 1) % tabs.length
    setActiveTab(tabs[nextIndex])
  }

  const getYouTubeEmbedUrl = (url: string) => {
    const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)
    return videoId ? `https://www.youtube.com/embed/${videoId[1]}?autoplay=0&controls=1` : ""
  }

  const handleTimeEdit = (type: string) => {
    setEditingTime(type)
    setTempTime(customTimes[type as keyof typeof customTimes].toString())
  }

  const handleTimeSave = () => {
    if (editingTime && tempTime) {
      const newTime = Number.parseInt(tempTime)
      if (newTime > 0) {
        setCustomTimes((prev) => ({
          ...prev,
          [editingTime]: newTime,
        }))
      }
    }
    setEditingTime(null)
    setTempTime("")
  }

  const handleYouTubeUrlChange = () => {
    if (newYoutubeUrl) {
      setYoutubeUrl(newYoutubeUrl)
      setNewYoutubeUrl("")
    }
  }

  const getProgress = () => {
    const totalTime = customTimes[activeTab as keyof typeof customTimes] * 60
    const progress = ((totalTime - timeLeft) / totalTime) * 100
    return progress
  }

  const getTabIcon = (tab: string) => {
    switch (tab) {
      case "focus":
        return <Timer className="w-4 h-4" />
      case "shortBreak":
        return <Coffee className="w-4 h-4" />
      case "longBreak":
        return <Clock className="w-4 h-4" />
      default:
        return <Timer className="w-4 h-4" />
    }
  }

  const getCurrentQuote = () => {
    const quote = quotesData[currentQuoteIndex]
    return isVietnamese ? quote.vi : quote.en
  }

  const toggleAutostart = async (enable: boolean) => {
    try {
      await invoke('set_autostart', { enable })
      setAutoStart(enable)
    } catch (e) {
      console.error(e)
      alert('Không bật được Autostart trên Windows. Bạn có thể chạy ứng dụng với quyền phù hợp, hoặc bật bằng tay.')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background p-4">
      {/* Custom Drag Area */}
      <div 
        className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-r from-blue-500/10 to-purple-500/10 cursor-move z-50 flex items-center justify-center"
        data-tauri-drag-region
        onMouseDown={async (e) => {
          try {
            await appWindow.startDragging()
          } catch (error) {
            console.error('Drag error:', error)
          }
        }}
      >
        <div className="w-8 h-1 bg-gray-400 rounded-full opacity-50"></div>
      </div>
      
      <motion.div
        className="max-w-sm mx-auto space-y-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >

        {/* Main Timer and Background Music Card */}
        <motion.div
          layout
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <Card className="gradient-card border-2 border-border/50 shadow-xl backdrop-blur-sm">
            <CardHeader className="pb-4">
              {/* Top Right Icons */}
              <div className="flex justify-end gap-2 mb-4">
                <motion.button
                  onClick={() => setAlwaysOnTop(!alwaysOnTop)}
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
                  onClick={() => toggleAutostart(!autoStart)}
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
              
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
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

            <CardContent className="space-y-6">
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
                        strokeDashoffset: 2 * Math.PI * 45 * (getProgress() / 100),
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
                          onChange={(e) => setTempTime(e.target.value)}
                          className="w-16 h-8 text-center"
                          min="1"
                        />
                        <span className="text-sm text-muted-foreground">min</span>
                        <Button
                          size="sm"
                          onClick={handleTimeSave}
                          className="bg-primary text-primary-foreground hover:bg-primary/90"
                        >
                          Save
                        </Button>
                      </motion.div>
                    ) : (
                      <motion.button
                        onClick={() => handleTimeEdit(activeTab)}
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
                          onClick={handleStart}
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
                          onClick={handlePause}
                          size="lg"
                          className="bg-white hover:bg-gray-50 text-red-600 border-2 border-gray-200 px-6 py-2 text-sm font-semibold shadow-lg"
                        >
                          PAUSE
                        </Button>
                        <Button
                          onClick={handleNext}
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
                      onClick={() => setIsVietnamese(!isVietnamese)}
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
                        // Vietnam Flag
                        <img src={VietnamFlag} alt="Vietnam Flag" className="w-6 h-4 object-contain" />
                      ) : (
                        // USA Flag
                        <img src={USAFlag} alt="USA Flag" className="w-6 h-4 object-contain" />
                      )}
                    </motion.button>
                  </div>

                  <AnimatePresence mode="wait">
                    <motion.div
                      key={`${currentQuoteIndex}-${isVietnamese}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.5 }}
                      className="space-y-2"
                    >
                      <p className="text-base text-emerald-600 font-medium">{getCurrentQuote()}</p>
                      <div className="w-full h-px bg-gradient-to-r from-transparent via-emerald-200 to-transparent" />
                    </motion.div>
                  </AnimatePresence>
                </motion.div>
              </div>

              {/* Background Music section */}
              <motion.div
                className="border-t pt-4"
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
                              onChange={(e) => setNewYoutubeUrl(e.target.value)}
                              placeholder="https://www.youtube.com/watch?v=..."
                            />
                          </div>
                          <Button
                            onClick={handleYouTubeUrlChange}
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
                        onClick={() => setIsYouTubeExpanded(!isYouTubeExpanded)}
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
                      className="overflow-hidden rounded-lg"
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
                      className="text-center py-4"
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
        </motion.div>

      </motion.div>
    </div>
  )
}