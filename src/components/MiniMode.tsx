import { AnimatePresence, motion } from 'framer-motion';
import {
    ChevronDown, GripVertical, Minus, MoreVertical, Pause, Play, Plus, SkipForward, Volume2,
    VolumeX, X
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { invoke } from '@tauri-apps/api/core';

import { Button } from '../ui/button';

interface MiniModeProps {
  timeLeft: number;
  isRunning: boolean;
  activeTab: string;
  onStart: () => void;
  onPause: () => void;
  onNext: () => void;
  getProgress: () => number;
  formatTime: (seconds: number) => string;
  currentQuote: { en: string; vi: string };
  youtubeUrl: string;
  getYouTubeEmbedUrl: (url: string) => string;
  customTimes: { focus: number; shortBreak: number; longBreak: number };
  onWorkTimeChange: (value: number) => void;
  onShortBreakTimeChange: (value: number) => void;
  onLongBreakTimeChange: (value: number) => void;
  onAnimationComplete?: () => void;
}

export function MiniMode({
  timeLeft,
  isRunning,
  activeTab,
  onStart,
  onPause,
  onNext,
  getProgress,
  formatTime,
  currentQuote,
  youtubeUrl,
  getYouTubeEmbedUrl,
  customTimes,
  onWorkTimeChange,
  onShortBreakTimeChange,
  onLongBreakTimeChange,
  onAnimationComplete,
}: MiniModeProps) {
  const [showSettings, setShowSettings] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [roundsPerCycle, setRoundsPerCycle] = useState(4);
  const [quoteSpeed, setQuoteSpeed] = useState("Normal");
  const [animationDuration, setAnimationDuration] = useState(15);
  const [animationKey, setAnimationKey] = useState(0);
  const [isAnimationComplete, setIsAnimationComplete] = useState(false);
  const [englishComplete, setEnglishComplete] = useState(false);
  const [vietnameseComplete, setVietnameseComplete] = useState(false);
  const [animationTarget, setAnimationTarget] = useState("-120%");
  const [isHovered, setIsHovered] = useState(false);
  const hoverTimeoutRef = useRef<number | null>(null);
  const settingsRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const thumbnailRef = useRef<HTMLDivElement>(null);

  // Calculate animation duration based on actual UI dimensions
  useEffect(() => {
    const calculateDuration = () => {
      if (containerRef.current && thumbnailRef.current) {
        // Get actual UI dimensions
        const containerRect = containerRef.current.getBoundingClientRect();
        const thumbnailRect = thumbnailRef.current.getBoundingClientRect();
        
        // Create temporary elements to measure actual text width
        const tempDiv = document.createElement('div');
        tempDiv.style.position = 'absolute';
        tempDiv.style.visibility = 'hidden';
        tempDiv.style.whiteSpace = 'nowrap';
        tempDiv.style.fontSize = '12px'; // text-xs
        tempDiv.style.fontFamily = 'inherit';
        tempDiv.style.fontWeight = '500';
        tempDiv.style.fontStyle = 'italic';
        document.body.appendChild(tempDiv);

        // Measure both quotes and use the longer one
        tempDiv.textContent = `"${currentQuote.en}"`;
        const enWidth = tempDiv.offsetWidth;
        
        tempDiv.textContent = `"${currentQuote.vi}"`;
        const viWidth = tempDiv.offsetWidth;
        
        const maxTextWidth = Math.max(enWidth, viWidth);
        
        // Calculate the actual available space for text animation
        // Text needs to travel from right edge of container to completely exit the left side
        const availableWidth = containerRect.width;
        
        // Total distance = container width + text width (to ensure text completely exits)
        // Since text starts at 100% (right edge) and needs to go to -120% (completely out)
        const totalDistance = availableWidth + maxTextWidth;
        const speed = 30; // pixels per second
        const duration = totalDistance / speed;
        
        const finalDuration = Math.max(5, Math.min(40, duration));
        setAnimationDuration(finalDuration);
        
        // Calculate animation target to ensure text completely exits
        const targetPercentage = (maxTextWidth / availableWidth * 100) + 100;
        setAnimationTarget(`-${targetPercentage}%`);
        
        // Debug log
        console.log('Animation calculation:', {
          containerWidth: containerRect.width,
          containerHeight: containerRect.height,
          thumbnailWidth: thumbnailRect.width,
          thumbnailHeight: thumbnailRect.height,
          availableWidth,
          enWidth,
          viWidth,
          maxTextWidth,
          totalDistance,
          speed,
          duration,
          finalDuration,
          targetPercentage,
          animationTarget: `-${targetPercentage}%`
        });
        
        // Reset animation state
        setIsAnimationComplete(false);
        setEnglishComplete(false);
        setVietnameseComplete(false);
        
        // Trigger new animation when quote changes
        setAnimationKey(prev => prev + 1);
        
        document.body.removeChild(tempDiv);
      }
    };

    // Use setTimeout to ensure DOM is ready
    const timeoutId = setTimeout(calculateDuration, 100);
    
    const handleResize = () => {
      setTimeout(calculateDuration, 100);
    };
    window.addEventListener('resize', handleResize);
    
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', handleResize);
    };
  }, [currentQuote]);

  // Check if both quotes are complete - wait for Vietnamese quote (which has delay)
  useEffect(() => {
    if (englishComplete && vietnameseComplete && !isAnimationComplete) {
      // Add a small delay to ensure Vietnamese quote has fully completed
      setTimeout(() => {
        setIsAnimationComplete(true);
        onAnimationComplete?.();
      }, 100);
    }
  }, [englishComplete, vietnameseComplete, isAnimationComplete, onAnimationComplete]);

  // Handle hover with delay
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

  const modeLabel =
    activeTab === "focus"
      ? "F"
      : activeTab === "shortBreak"
      ? "S"
      : "L";

  return (
    <div 
      className="relative h-full group"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Main MiniMode Interface */}
      <div
        className="h-full bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800  relative shadow-2xl overflow-hidden"
        ref={settingsRef}
      >
        {/* Left controls (hover to reveal) - Spotify style */}
        <div className="absolute left-0 top-0 h-full w-6 z-50 pointer-events-auto">
          <div
            className={`pt-1.5 pl-1.5 flex flex-col justify-between items-start h-full transition-all duration-200 ease-out ${
              isHovered 
                ? 'opacity-100 translate-x-0' 
                : 'opacity-0 -translate-x-8'
            }`}
            data-tauri-drag-region
          >
            {/* Close button */}
            <button
              aria-label="Close"
              className="h-3 w-3 rounded-full bg-white/90 hover:bg-white text-gray-800 shadow flex items-center justify-center"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={async (e) => {
                e.stopPropagation();
                try {
                  await invoke('close_window');
                } catch (error) {
                }
              }}
              data-tauri-drag-region="false"
            >
              <X className="h-2 w-2" />
            </button>

            {/* Drag handle */}
            <div
              className="h-6 w-3 flex items-center justify-center  text-white/90 pointer-events-auto"
              title="Drag window"
            >
              <GripVertical 
                className="h-3 w-3 cursor-move" 
                data-tauri-drag-region
              />
            </div>
          </div>
        </div>

         {/* Main Content Layout - Flex Row */}
         <div className="flex items-center py-3 h-full">
           {/* Middle section - Thumbnail, Timer and Quotes (animated, can be hidden behind right section) */}
           <div className={`flex items-center gap-2 transition-transform duration-200 ease-out flex-1 min-w-0 pl-2 ${
             isHovered ? 'translate-x-8' : 'translate-x-0'
           }`}>
             {/* YouTube Thumbnail */}
             <div ref={thumbnailRef} className="w-8 h-8 rounded-lg border border-gray-600 overflow-hidden bg-black/80 flex-shrink-0">
               <iframe
                 src={getYouTubeEmbedUrl(youtubeUrl)}
                 className="w-full h-full"
                 title="Mini YouTube"
                 allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                 referrerPolicy="no-referrer"
                 sandbox="allow-scripts allow-same-origin allow-presentation"
                 allowFullScreen
               />
             </div>

             {/* Timer and Quotes Display */}
             <div ref={containerRef} className="flex flex-col gap-0 min-w-0 flex-1">
               {/* English Quote */}
               <div className="overflow-hidden">
                 <motion.div
                   key={`${animationKey}-${currentQuote.en}-english`}
                   className="whitespace-nowrap text-xs text-blue-400 font-medium italic"
                   initial={{ x: "100%" }}
                   animate={{ x: animationTarget }}
                   transition={{ duration: animationDuration, ease: "linear" }}
                   onAnimationComplete={() => {
                     if (!englishComplete) {
                       setEnglishComplete(true);
                     }
                   }}
                 >
                   "{currentQuote.en}"
                 </motion.div>
               </div>
               
               {/* Timer Display */}
               <div className="flex items-baseline gap-3">
                 <span className="text-2xl font-mono font-bold text-white whitespace-nowrap">
                   {formatTime(timeLeft)}
                 </span>
                 <span className="text-sm text-gray-300 font-medium whitespace-nowrap">
                   ({modeLabel})
                 </span>
               </div>
               
               {/* Vietnamese Quote */}
               <div className="overflow-hidden">
                 <motion.div
                   key={`${animationKey}-${currentQuote.vi}-vietnamese`}
                   className="whitespace-nowrap text-xs text-emerald-400 font-medium italic"
                   initial={{ x: "100%" }}
                   animate={{ x: animationTarget }}
                   transition={{ duration: animationDuration, ease: "linear" }}
                   onAnimationComplete={() => {
                     if (!vietnameseComplete) {
                       setVietnameseComplete(true);
                     }
                   }}
                 >
                   "{currentQuote.vi}"
                 </motion.div>
               </div>
             </div>
           </div>

           {/* Right section - Control Buttons (completely fixed position) */}
           <div className="flex items-center gap-2 flex-shrink-0 relative z-10 pr-4">
            {/* Control Buttons */}
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
                      className="h-8 w-8 rounded-full bg-white hover:bg-gray-100 text-gray-800 shadow-lg flex items-center justify-center p-0"
                    >
                      <Play className="h-4 w-4 ml-0.5" />
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
                      className="h-8 w-8 rounded-full bg-gray-600 hover:bg-gray-500 text-white shadow-lg flex items-center justify-center p-0"
                    >
                      <Pause className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={onNext}
                      size="sm"
                      className="h-8 w-8 rounded-full bg-gray-600 hover:bg-gray-500 text-white shadow-lg flex items-center justify-center p-0"
                    >
                      <SkipForward className="h-4 w-4" />
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Settings button - Fixed position */}
            <button
              onClick={() => {
                console.log(
                  "Settings button clicked, current state:",
                  showSettings
                );
                setShowSettings(!showSettings);
              }}
              className={`h-6 w-6 rounded-full shadow-lg flex items-center justify-center p-0 ${
                showSettings
                  ? "bg-emerald-500 hover:bg-emerald-600 text-white"
                  : "bg-gray-600 hover:bg-gray-500 text-white"
              }`}
            >
              <MoreVertical className="h-3 w-3" />
            </button>
          </div>
        </div>

      </div>

      {/* Settings Panel Dropdown */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full right-0 mt-2 w-80 bg-gray-800  shadow-2xl border border-gray-600 p-6 z-50"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
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
                        onClick={() =>
                          onWorkTimeChange(Math.max(1, customTimes.focus - 1))
                        }
                        className="px-2 py-1 bg-gray-600 hover:bg-gray-500 rounded text-white text-xs"
                      >
                        -1m
                      </button>
                      <span className="text-white font-mono w-12 text-center">
                        {customTimes.focus}m
                      </span>
                      <button
                        onClick={() => onWorkTimeChange(customTimes.focus + 1)}
                        className="px-2 py-1 bg-gray-600 hover:bg-gray-500 rounded text-white text-xs"
                      >
                        +1m
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300 text-sm">Short</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          onShortBreakTimeChange(
                            Math.max(1, customTimes.shortBreak - 1)
                          )
                        }
                        className="px-2 py-1 bg-gray-600 hover:bg-gray-500 rounded text-white text-xs"
                      >
                        -1m
                      </button>
                      <span className="text-white font-mono w-12 text-center">
                        {customTimes.shortBreak}m
                      </span>
                      <button
                        onClick={() =>
                          onShortBreakTimeChange(customTimes.shortBreak + 1)
                        }
                        className="px-2 py-1 bg-gray-600 hover:bg-gray-500 rounded text-white text-xs"
                      >
                        +1m
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300 text-sm">Long</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          onLongBreakTimeChange(
                            Math.max(1, customTimes.longBreak - 1)
                          )
                        }
                        className="px-2 py-1 bg-gray-600 hover:bg-gray-500 rounded text-white text-xs"
                      >
                        -1m
                      </button>
                      <span className="text-white font-mono w-12 text-center">
                        {customTimes.longBreak}m
                      </span>
                      <button
                        onClick={() =>
                          onLongBreakTimeChange(customTimes.longBreak + 1)
                        }
                        className="px-2 py-1 bg-gray-600 hover:bg-gray-500 rounded text-white text-xs"
                      >
                        +1m
                      </button>
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
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
