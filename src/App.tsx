import { AnimatePresence, motion } from "framer-motion";
import { Clock, Coffee, Timer } from "lucide-react";
import { useEffect, useState } from "react";


import { CompactMode } from "./components/CompactMode";
import { FullMode } from "./components/FullMode";
import { MiniMode } from "./components/MiniMode";
import { SmallMode } from "./components/SmallMode";
import { TallMode } from "./components/TallMode";
import { useWindowSize } from "./hooks/useWindowSize";
import { useTimer } from "./hooks/useTimer";
import {
  useYouTubeOverlay,
  YouTubeOverlayProvider,
} from "./player/YouTubeOverlay";
import quotesData from "./quotes/quotes.json";
import { formatTime } from "./lib/utils";

const YT_ID_RE = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/;

function AppContent() {
  const [isYouTubeExpanded, setIsYouTubeExpanded] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState(
    "https://www.youtube.com/watch?v=YNDT833ahtc"
  );
  const [newYoutubeUrl, setNewYoutubeUrl] = useState("");
  const [customTimes, setCustomTimes] = useState({
    focus: 30,
    shortBreak: 5,
    longBreak: 10,
  });
  const [editingTime, setEditingTime] = useState<string | null>(null);
  const [tempTime, setTempTime] = useState("");
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);
  const [isVietnamese, setIsVietnamese] = useState(false); // Default to English
  const [autoStartNext, setAutoStartNext] = useState(false);
  const [autoStartBreakType, setAutoStartBreakType] = useState<'short' | 'long'>('short');
  const [roundsPerCycle, setRoundsPerCycle] = useState(4);
  const { setVideoId } = useYouTubeOverlay();

  // Use the custom timer hook
  const {
    timeLeft,
    isRunning,
    activeTab,
    setTimeLeft,
    setIsRunning,
    setActiveTab,
    handleStart,
    handlePause,
    handleNext,
  } = useTimer({
    autoStartNext,
    autoStartBreakType,
    roundsPerCycle,
    customTimes,
  });

  // Get window size and display mode
  const { mode } = useWindowSize();

  // When a quote animation completes (MiniMode) pick a new random quote (avoid immediate repeat)
  const handleQuoteAnimationComplete = () => {
    setCurrentQuoteIndex((prev) => {
      if (quotesData.length <= 1) return prev;
      let next = prev;
      // Ensure different index; loop will run at most length-1 times
      while (next === prev) {
        next = Math.floor(Math.random() * quotesData.length);
      }
      return next;
    });
  };


  const getYouTubeEmbedUrl = (url: string) => {
    const videoId = url.match(YT_ID_RE);
    if (!videoId) return "";
    const params = new URLSearchParams({
      autoplay: "0",
      controls: "1",
      rel: "0",
      modestbranding: "1",
      playsinline: "1",
      iv_load_policy: "3",
      // Note: avoid setting origin to a custom scheme to prevent validation issues in WebView
    });
    return `https://www.youtube-nocookie.com/embed/${
      videoId[1]
    }?${params.toString()}`;
  };

  const handleTimeEdit = (type: string) => {
    setEditingTime(type);
    setTempTime(customTimes[type as keyof typeof customTimes].toString());
  };

  const handleTimeSave = () => {
    if (editingTime && tempTime) {
      const newTime = Number.parseInt(tempTime);
      if (newTime > 0) {
        setCustomTimes((prev) => ({
          ...prev,
          [editingTime]: newTime,
        }));
      }
    }
    setEditingTime(null);
    setTempTime("");
  };

  const handleYouTubeUrlChange = () => {
    if (newYoutubeUrl) {
      setYoutubeUrl(newYoutubeUrl);
      setNewYoutubeUrl("");
    }
  };

  // Update video ID when YouTube URL changes
  useEffect(() => {
    const videoId = youtubeUrl.match(YT_ID_RE);
    if (videoId) {
      console.log("App: Setting video ID to", videoId[1]);
      setVideoId(videoId[1]);
    }
  }, [youtubeUrl, setVideoId]);

  const getProgress = () => {
    const totalTime = customTimes[activeTab as keyof typeof customTimes] * 60;
    const progress = ((totalTime - timeLeft) / totalTime) * 100;
    return progress;
  };

  const getTabIcon = (tab: string) => {
    switch (tab) {
      case "focus":
        return <Timer className="w-4 h-4" />;
      case "shortBreak":
        return <Coffee className="w-4 h-4" />;
      case "longBreak":
        return <Clock className="w-4 h-4" />;
      default:
        return <Timer className="w-4 h-4" />;
    }
  };

  const getCurrentQuoteObject = () => {
    return quotesData[currentQuoteIndex];
  };

  // Props shared by every display mode (times, auto-start, rounds, YouTube)
  const settingsProps = {
    customTimes,
    youtubeUrl,
    getYouTubeEmbedUrl,
    onWorkTimeChange: (value: number) =>
      setCustomTimes((prev) => ({ ...prev, focus: value })),
    onShortBreakTimeChange: (value: number) =>
      setCustomTimes((prev) => ({ ...prev, shortBreak: value })),
    onLongBreakTimeChange: (value: number) =>
      setCustomTimes((prev) => ({ ...prev, longBreak: value })),
    autoStartNext,
    setAutoStartNext,
    autoStartBreakType,
    setAutoStartBreakType,
    roundsPerCycle,
    setRoundsPerCycle,
  };

  // Props shared by the mini / small / compact modes
  const timerProps = {
    ...settingsProps,
    timeLeft,
    isRunning,
    activeTab,
    onStart: handleStart,
    onPause: handlePause,
    onNext: handleNext,
    getProgress,
    formatTime,
    currentQuote: getCurrentQuoteObject(),
    onYouTubeUrlChange: setYoutubeUrl,
    onAnimationComplete: handleQuoteAnimationComplete,
  };

  const fade = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.3 },
    className: "h-screen relative",
  };

  return (
    <div className="liquid-bg w-full h-full overflow-hidden">
      {/* Render different modes based on window size */}
      <AnimatePresence mode="sync" initial={false}>
        {mode === "mini" && (
          <motion.div key="mini" {...fade}>
            <MiniMode {...timerProps} />
          </motion.div>
        )}

        {mode === "small" && (
          <motion.div key="small" {...fade}>
            <SmallMode {...timerProps} />
          </motion.div>
        )}

        {mode === "compact" && (
          <motion.div key="compact" {...fade}>
            <CompactMode
              {...timerProps}
              onTabChange={setActiveTab}
              getTabIcon={getTabIcon}
            />
          </motion.div>
        )}

        {mode === "tall" && (
          <motion.div key="tall" {...fade}>
            <TallMode
              {...settingsProps}
              timeLeft={timeLeft}
              isRunning={isRunning}
              currentTab={activeTab}
              onTabChange={setActiveTab}
              onPlayPause={isRunning ? handlePause : handleStart}
              onSkip={handleNext}
              onReset={() => {
                setTimeLeft(customTimes[activeTab as keyof typeof customTimes] * 60);
                setIsRunning(false);
              }}
              currentQuote={getCurrentQuoteObject()}
              isVietnamese={isVietnamese}
              workTime={customTimes.focus}
              shortBreakTime={customTimes.shortBreak}
              longBreakTime={customTimes.longBreak}
            />
          </motion.div>
        )}

        {mode === "full" && (
          <motion.div key="full" {...fade}>
            <FullMode
              {...settingsProps}
              timeLeft={timeLeft}
              isRunning={isRunning}
              activeTab={activeTab}
              isVietnamese={isVietnamese}
              isYouTubeExpanded={isYouTubeExpanded}
              newYoutubeUrl={newYoutubeUrl}
              editingTime={editingTime}
              tempTime={tempTime}
              onStart={handleStart}
              onPause={handlePause}
              onNext={handleNext}
              onTabChange={setActiveTab}
              onYouTubeToggle={() => setIsYouTubeExpanded(!isYouTubeExpanded)}
              onYouTubeUrlChange={handleYouTubeUrlChange}
              onNewYoutubeUrlChange={setNewYoutubeUrl}
              onTimeEdit={handleTimeEdit}
              onTimeSave={handleTimeSave}
              onTempTimeChange={setTempTime}
              getProgress={getProgress}
              formatTime={formatTime}
              getTabIcon={getTabIcon}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function App() {
  return (
    <YouTubeOverlayProvider>
      <AppContent />
    </YouTubeOverlayProvider>
  );
}
