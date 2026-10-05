import { useEffect, useRef, useState } from 'react';

interface UseTimerProps {
  autoStartNext: boolean;
  autoStartBreakType: 'short' | 'long';
  roundsPerCycle: number;
  customTimes: {
    focus: number;
    shortBreak: number;
    longBreak: number;
  };
}

interface UseTimerReturn {
  timeLeft: number;
  isRunning: boolean;
  activeTab: string;
  setTimeLeft: (time: number) => void;
  setIsRunning: (running: boolean) => void;
  setActiveTab: (tab: string) => void;
  handleStart: () => void;
  handlePause: () => void;
  handleNext: () => void;
}

export function useTimer({
  autoStartNext,
  autoStartBreakType,
  roundsPerCycle,
  customTimes,
}: UseTimerProps): UseTimerReturn {
  const [timeLeft, setTimeLeft] = useState(customTimes.focus * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [activeTab, setActiveTab] = useState('focus');
  const [completedRounds, setCompletedRounds] = useState(0);
  const intervalRef = useRef<number | null>(null);

  // Timer logic
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            // Timer finished
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
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

  // Play a short sine beep
  const playBeep = (freq: number, gain: number, ms: number) => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g);
      g.connect(ctx.destination);
      o.type = "sine";
      o.frequency.value = freq;
      g.gain.value = gain;
      o.start();
      setTimeout(() => {
        o.stop();
        ctx.close();
      }, ms);
    } catch (error) {
      console.warn('Could not play notification sound:', error);
    }
  };
  const playNotificationSound = () => playBeep(880, 0.1, 600);

  // Handle timer completion
  const handleTimerComplete = () => {
    setIsRunning(false);
    
    // Always play sound when timer completes
    playNotificationSound();
    
    if (autoStartNext) {
      if (activeTab === 'focus') {
        // Focus finished, go to break
        const nextBreak = autoStartBreakType === 'short' ? 'shortBreak' : 'longBreak';
        setActiveTab(nextBreak);
        setTimeLeft(customTimes[nextBreak] * 60);
        setCompletedRounds(prev => prev + 1);
        // Start the break timer immediately
        setTimeout(() => setIsRunning(true), 1000); // 1 second delay to let user hear the sound
      } else if (activeTab === 'shortBreak' || activeTab === 'longBreak') {
        // Break finished, check if we should continue or stop
        if (completedRounds < roundsPerCycle) {
          setActiveTab('focus');
          setTimeLeft(customTimes.focus * 60);
          // Start the focus timer immediately
          setTimeout(() => setIsRunning(true), 1000); // 1 second delay to let user hear the sound
        } else {
          // All rounds completed, reset and go back to focus
          setCompletedRounds(0);
          setActiveTab('focus');
          setTimeLeft(customTimes.focus * 60);
          // Higher pitch for cycle completion
          setTimeout(() => playBeep(1200, 0.15, 800), 500);
        }
      }
    }
  };

  // Update timer when tab changes (manual change)
  useEffect(() => {
    if (!isRunning) {
      setTimeLeft(customTimes[activeTab as keyof typeof customTimes] * 60);
    }
  }, [activeTab, customTimes, isRunning]);

  // Reset completed rounds when auto start is disabled
  useEffect(() => {
    if (!autoStartNext) {
      setCompletedRounds(0);
    }
  }, [autoStartNext]);

  const handleStart = () => setIsRunning(true);
  const handlePause = () => setIsRunning(false);

  const handleNext = () => {
    const tabs = ['focus', 'shortBreak', 'longBreak'];
    const currentIndex = tabs.indexOf(activeTab);
    const nextIndex = (currentIndex + 1) % tabs.length;
    setActiveTab(tabs[nextIndex]);
  };

  return {
    timeLeft,
    isRunning,
    activeTab,
    setTimeLeft,
    setIsRunning,
    setActiveTab,
    handleStart,
    handlePause,
    handleNext,
  };
}
