import { AnimatePresence, motion } from "framer-motion";
import { Clock, Coffee, Timer } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { getCurrentWindow } from "@tauri-apps/api/window";

import { CompactMode } from "./components/CompactMode";
import { FullMode } from "./components/FullMode";
import { MiniMode } from "./components/MiniMode";
import { SmallMode } from "./components/SmallMode";
import { TallMode } from "./components/TallMode";
import { useWindowSize } from "./hooks/useWindowSize";
import {
  useYouTubeOverlay,
  YouTubeOverlayProvider,
} from "./player/YouTubeOverlay";
import quotesData from "./quotes/quotes.json";
// @ts-ignore
import USAFlag from "./svgs/usa.svg";
// @ts-ignore
import VietnamFlag from "./svgs/vietnam.svg";

function useInterval(callback: () => void, delay: number | null) {
  const saved = useRef(callback);
  useEffect(() => {
    saved.current = callback;
  }, [callback]);
  useEffect(() => {
    if (delay === null) return;
    const id = setInterval(() => saved.current(), delay);
    return () => clearInterval(id);
  }, [delay]);
}

function AppContent() {
  const [activeTab, setActiveTab] = useState("focus");
  const [timeLeft, setTimeLeft] = useState(30 * 60); // 30 minutes in seconds
  const [isRunning, setIsRunning] = useState(false);
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
  const intervalRef = useRef<number | null>(null);
  const { setVideoId } = useYouTubeOverlay();

  // Get window size and display mode
  const { width, height, mode } = useWindowSize();

  // Remove fixed interval - quotes will change based on animation completion
  // useEffect(() => {
  //   const quoteInterval = setInterval(() => {
  //     setCurrentQuoteIndex((prev) => (prev + 1) % quotesData.length);
  //   }, 6000);

  //   return () => clearInterval(quoteInterval);
  // }, [quotesData.length]);

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

  // Timer logic
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timeLeft]);

  // Update timer when tab changes
  useEffect(() => {
    setIsRunning(false);
    switch (activeTab) {
      case "focus":
        setTimeLeft(customTimes.focus * 60);
        break;
      case "shortBreak":
        setTimeLeft(customTimes.shortBreak * 60);
        break;
      case "longBreak":
        setTimeLeft(customTimes.longBreak * 60);
        break;
    }
  }, [activeTab, customTimes]);

  // Sound notification when timer ends
  useEffect(() => {
    if (timeLeft === 0 && isRunning) {
      // beep sound
      try {
        const ctx = new (window.AudioContext ||
          (window as any).webkitAudioContext)();
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.connect(g);
        g.connect(ctx.destination);
        o.type = "sine";
        o.frequency.value = 880;
        g.gain.value = 0.1;
        o.start();
        setTimeout(() => {
          o.stop();
          ctx.close();
        }, 600);
      } catch {}
    }
  }, [timeLeft, isRunning]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const handleStart = () => setIsRunning(true);
  const handlePause = () => setIsRunning(false);
  const handleStop = () => {
    setIsRunning(false);
    switch (activeTab) {
      case "focus":
        setTimeLeft(customTimes.focus * 60);
        break;
      case "shortBreak":
        setTimeLeft(customTimes.shortBreak * 60);
        break;
      case "longBreak":
        setTimeLeft(customTimes.longBreak * 60);
        break;
    }
  };

  const handleNext = () => {
    const tabs = ["focus", "shortBreak", "longBreak"];
    const currentIndex = tabs.indexOf(activeTab);
    const nextIndex = (currentIndex + 1) % tabs.length;
    setActiveTab(tabs[nextIndex]);
  };

  const getYouTubeEmbedUrl = (url: string) => {
    const videoId = url.match(
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/
    );
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
    const videoId = youtubeUrl.match(
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/
    );
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

  const getCurrentQuote = () => {
    const quote = quotesData[currentQuoteIndex];
    return isVietnamese ? quote.vi : quote.en;
  };

  const getCurrentQuoteObject = () => {
    return quotesData[currentQuoteIndex];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background overflow-hidden relative">
      {/* Render different modes based on window size */}
      <AnimatePresence mode="sync" initial={false}>
        {mode === "mini" && (
          <motion.div
            key="mini"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="h-screen"
          >
            <MiniMode
              timeLeft={timeLeft}
              isRunning={isRunning}
              activeTab={activeTab}
              onStart={handleStart}
              onPause={handlePause}
              onNext={handleNext}
              getProgress={getProgress}
              formatTime={formatTime}
              currentQuote={getCurrentQuoteObject()}
              youtubeUrl={youtubeUrl}
              getYouTubeEmbedUrl={getYouTubeEmbedUrl}
              customTimes={customTimes}
              onWorkTimeChange={(value) =>
                setCustomTimes((prev) => ({ ...prev, focus: value }))
              }
              onShortBreakTimeChange={(value) =>
                setCustomTimes((prev) => ({ ...prev, shortBreak: value }))
              }
              onLongBreakTimeChange={(value) =>
                setCustomTimes((prev) => ({ ...prev, longBreak: value }))
              }
              onAnimationComplete={handleQuoteAnimationComplete}
              onYouTubeUrlChange={setYoutubeUrl}
            />
          </motion.div>
        )}

        {mode === "small" && (
          <motion.div
            key="small"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="h-screen"
          >
            <SmallMode
              timeLeft={timeLeft}
              isRunning={isRunning}
              activeTab={activeTab}
              onStart={handleStart}
              onPause={handlePause}
              onNext={handleNext}
              getProgress={getProgress}
              formatTime={formatTime}
              currentQuote={getCurrentQuoteObject()}
              youtubeUrl={youtubeUrl}
              getYouTubeEmbedUrl={getYouTubeEmbedUrl}
              customTimes={customTimes}
              onWorkTimeChange={(value) =>
                setCustomTimes((prev) => ({ ...prev, focus: value }))
              }
              onShortBreakTimeChange={(value) =>
                setCustomTimes((prev) => ({ ...prev, shortBreak: value }))
              }
              onLongBreakTimeChange={(value) =>
                setCustomTimes((prev) => ({ ...prev, longBreak: value }))
              }
              onAnimationComplete={handleQuoteAnimationComplete}
              onYouTubeUrlChange={setYoutubeUrl}
            />
          </motion.div>
        )}

        {mode === "compact" && (
          <motion.div
            key="compact"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="h-screen"
          >
            <CompactMode
              timeLeft={timeLeft}
              isRunning={isRunning}
              activeTab={activeTab}
              customTimes={customTimes}
              currentQuote={getCurrentQuoteObject()}
              onStart={handleStart}
              onPause={handlePause}
              onNext={handleNext}
              onTabChange={setActiveTab}
              getProgress={getProgress}
              formatTime={formatTime}
              getTabIcon={getTabIcon}
              youtubeUrl={youtubeUrl}
              getYouTubeEmbedUrl={getYouTubeEmbedUrl}
              onWorkTimeChange={(value) =>
                setCustomTimes((prev) => ({ ...prev, focus: value }))
              }
              onShortBreakTimeChange={(value) =>
                setCustomTimes((prev) => ({ ...prev, shortBreak: value }))
              }
              onLongBreakTimeChange={(value) =>
                setCustomTimes((prev) => ({ ...prev, longBreak: value }))
              }
              onYouTubeUrlChange={setYoutubeUrl}
              onAnimationComplete={handleQuoteAnimationComplete}
            />
          </motion.div>
        )}

        {mode === "tall" && (
          <motion.div
            key="tall"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="h-screen "
          >
            <TallMode
              timeLeft={timeLeft}
              isRunning={isRunning}
              currentTab={activeTab}
              onTabChange={setActiveTab}
              onPlayPause={isRunning ? handlePause : handleStart}
              onSkip={handleNext}
              onReset={() => {
                setTimeLeft(customTimes[activeTab] * 60);
                setIsRunning(false);
              }}
              onMinimize={() => getCurrentWindow().minimize()}
              onSettings={() => {}}
              currentQuote={getCurrentQuoteObject()}
              isVietnamese={isVietnamese}
              workTime={customTimes.focus}
              shortBreakTime={customTimes.shortBreak}
              longBreakTime={customTimes.longBreak}
              onWorkTimeChange={(value) =>
                setCustomTimes((prev) => ({ ...prev, focus: value }))
              }
              onShortBreakTimeChange={(value) =>
                setCustomTimes((prev) => ({ ...prev, shortBreak: value }))
              }
              onLongBreakTimeChange={(value) =>
                setCustomTimes((prev) => ({ ...prev, longBreak: value }))
              }
              customTimes={customTimes}
              youtubeUrl={youtubeUrl}
              getYouTubeEmbedUrl={getYouTubeEmbedUrl}
            />
          </motion.div>
        )}

        {mode === "full" && (
          <motion.div
            key="full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="h-screen "
          >
            <FullMode
              timeLeft={timeLeft}
              isRunning={isRunning}
              activeTab={activeTab}
              customTimes={customTimes}
              isVietnamese={isVietnamese}
              isYouTubeExpanded={isYouTubeExpanded}
              youtubeUrl={youtubeUrl}
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
              onWorkTimeChange={(value) =>
                setCustomTimes((prev) => ({ ...prev, focus: value }))
              }
              onShortBreakTimeChange={(value) =>
                setCustomTimes((prev) => ({ ...prev, shortBreak: value }))
              }
              onLongBreakTimeChange={(value) =>
                setCustomTimes((prev) => ({ ...prev, longBreak: value }))
              }
              getProgress={getProgress}
              formatTime={formatTime}
              getTabIcon={getTabIcon}
              getYouTubeEmbedUrl={getYouTubeEmbedUrl}
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
