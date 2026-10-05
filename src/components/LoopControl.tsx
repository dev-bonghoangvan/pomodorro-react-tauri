import { AnimatePresence, motion } from 'framer-motion';
import { Repeat, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { useYouTubeOverlay } from '../player/YouTubeOverlay';

interface LoopControlProps {
  onClose?: () => void;
  onLoopChange?: (config: LoopConfig) => void;
  videoDuration?: number; // Duration in seconds
  className?: string;
  style?: React.CSSProperties;
}

export interface LoopConfig {
  loopCount: number;
  loopEnabled: boolean;
  loopPortion: boolean;
  portionLoopCount?: number;
  startTime: number; // seconds
  endTime: number; // seconds
}

export function LoopControl({
  onClose,
  onLoopChange,
  videoDuration = 0,
  className = "",
  style,
}: LoopControlProps) {
  // Get loop config and duration from context (persisted across mode changes)
  const {
    videoDuration: contextDuration,
    loopConfig: savedConfig,
    setLoopConfig: saveConfig,
    playedTimes = 0,
  } = useYouTubeOverlay();
  
  // Initialize state from saved config or defaults
  const [loopCount, setLoopCount] = useState(savedConfig?.loopCount ?? 10);
  const [loopEnabled, setLoopEnabled] = useState(savedConfig?.loopEnabled ?? false);
  const [loopPortion, setLoopPortion] = useState(savedConfig?.loopPortion ?? false);
  const [portionLoopCount, setPortionLoopCount] = useState(savedConfig?.portionLoopCount ?? 5);
  const [isDragging, setIsDragging] = useState<'start' | 'end' | null>(null);
  const sliderRef = useRef<HTMLDivElement>(null);
  
  // Use prop first, then context, then default
  const duration = videoDuration > 0 ? videoDuration : (contextDuration > 0 ? contextDuration : 3600);
  
  // Format time helper for initial values
  const formatInitialTime = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (duration >= 3600 || h > 0) {
      return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };
  
  const [startTime, setStartTime] = useState(savedConfig ? formatInitialTime(savedConfig.startTime) : '00:00');
  const [endTime, setEndTime] = useState(savedConfig ? formatInitialTime(savedConfig.endTime) : '00:00');

  // Parse time string "MM:SS" or "HH:MM:SS" to seconds
  const parseTime = (timeStr: string): number => {
    const parts = timeStr.split(':').map(p => parseInt(p) || 0);
    if (parts.length === 2) {
      const minutes = parts[0];
      const seconds = parts[1];
      return minutes * 60 + seconds;
    } else if (parts.length === 3) {
      const hours = parts[0];
      const minutes = parts[1];
      const seconds = parts[2];
      return hours * 3600 + minutes * 60 + seconds;
    }
    return 0;
  };

  // Convert seconds to "MM:SS" or "HH:MM:SS" format
  const formatTimeString = (totalSeconds: number): string => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    if (duration >= 3600 || hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else {
      return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
  };

  // Validate and format time input (supports MM:SS and HH:MM:SS)
  const validateTimeInput = (value: string, strict: boolean = false): string => {
    let cleaned = value.replace(/[^\d:]/g, '');
    const maxLength = duration >= 3600 ? 8 : 5;
    if (cleaned.length > maxLength) {
      cleaned = cleaned.substring(0, maxLength);
    }
    
    if (!strict) {
      const parts = cleaned.split(':');
      if (parts.length === 1 && parts[0].length >= 3) {
        cleaned = parts[0].substring(0, 2) + ':' + parts[0].substring(2);
      } else if (parts.length === 2 && parts[1].length >= 3 && duration >= 3600) {
        cleaned = parts[0] + ':' + parts[1].substring(0, 2) + ':' + parts[1].substring(2);
      }
      return cleaned;
    }
    
    const parts = cleaned.split(':');
    if (parts.length === 1) {
      if (cleaned.length <= 2) {
        cleaned = '00:' + cleaned.padStart(2, '0');
      } else if (cleaned.length <= 4) {
        cleaned = cleaned.substring(0, 2) + ':' + cleaned.substring(2, 4).padStart(2, '0');
      } else if (duration >= 3600 && cleaned.length <= 6) {
        cleaned = cleaned.substring(0, 2) + ':' + cleaned.substring(2, 4) + ':' + cleaned.substring(4, 6).padStart(2, '0');
      }
    } else if (parts.length === 2) {
      if (duration >= 3600 && parts[0].length >= 3) {
        cleaned = parts[0].substring(0, 2) + ':' + parts[0].substring(2) + ':' + parts[1].padStart(2, '0');
      } else {
        cleaned = parts[0].padStart(2, '0') + ':' + parts[1].padStart(2, '0');
      }
    } else if (parts.length === 3) {
      cleaned = parts[0].padStart(2, '0') + ':' + parts[1].padStart(2, '0') + ':' + parts[2].padStart(2, '0');
    }
    
    return cleaned;
  };

  const startSeconds = parseTime(startTime);
  const endSeconds = parseTime(endTime);
  const loopDuration = Math.max(0, endSeconds - startSeconds);

  const startPercent = duration > 0 ? (startSeconds / duration) * 100 : 0;
  const endPercent = duration > 0 ? (endSeconds / duration) * 100 : 0;

  const handleMouseDown = (type: 'start' | 'end') => (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(type);
    setLoopPortion(true);
    setLoopEnabled(false);
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!sliderRef.current || duration <= 0) return;
      
      const rect = sliderRef.current.getBoundingClientRect();
      const percent = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
      const seconds = Math.floor((percent / 100) * duration);
      
      if (isDragging === 'start') {
        const newStart = Math.min(seconds, endSeconds - 1);
        setStartTime(formatTimeString(Math.max(0, newStart)));
      } else if (isDragging === 'end') {
        const newEnd = Math.max(seconds, startSeconds + 1);
        setEndTime(formatTimeString(Math.min(duration, newEnd)));
      }
    };

    const handleMouseUp = () => {
      setIsDragging(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, duration, startSeconds, endSeconds]);

  const onLoopChangeRef = useRef(onLoopChange);
  useEffect(() => {
    onLoopChangeRef.current = onLoopChange;
  });

  useEffect(() => {
    const config: LoopConfig = {
      loopCount,
      loopEnabled,
      loopPortion,
      portionLoopCount,
      startTime: startSeconds,
      endTime: endSeconds,
    };
    onLoopChangeRef.current?.(config);
    saveConfig(config);
  }, [loopCount, loopEnabled, loopPortion, portionLoopCount, startSeconds, endSeconds, saveConfig]);

  return (
    <div
      className={`glass-panel rounded-2xl sm:rounded-3xl p-3.5 sm:p-4.5 max-h-[85vh] overflow-y-auto select-none border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.6)] ${className}`}
      style={style}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-white/15">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_10px_#34d399]" />
          <Repeat className="w-4 h-4 text-emerald-400" />
          <h2 className="text-sm sm:text-base font-bold tracking-wider text-white">LOOP CONTROL</h2>
        </div>
        {onClose && (
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="w-7 h-7 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 flex items-center justify-center text-white/80 hover:text-white transition-all border border-white/15 p-0"
            aria-label="Đóng lặp video"
          >
            <X className="w-3.5 h-3.5" />
          </Button>
        )}
      </div>

      {/* Status banner */}
      <div className="flex items-center justify-between mb-3 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/10 text-xs">
        <span className="text-white/60">
          {loopPortion ? 'Đang lặp đoạn:' : loopEnabled ? 'Đang lặp toàn bộ:' : 'Trạng thái:'}
        </span>
        <span className="font-mono font-semibold text-emerald-300">
          {loopPortion 
            ? `${playedTimes} / ${portionLoopCount} lần` 
            : loopEnabled 
              ? `${playedTimes} / ${loopCount} lần` 
              : 'Tắt lặp'}
        </span>
      </div>

      <div className="space-y-3">
        {/* Option 1: Loop for X times */}
        <div className="bg-white/[0.04] border border-white/15 rounded-xl p-3 sm:p-3.5 transition-all">
          <div className="flex items-center justify-between gap-3">
            <label htmlFor="loop-count" className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                id="loop-count"
                checked={loopEnabled && !loopPortion}
                onChange={(e) => {
                  setLoopEnabled(e.target.checked && !loopPortion);
                  if (e.target.checked) setLoopPortion(false);
                }}
                className="w-4 h-4 rounded border-white/20 bg-white/10 text-emerald-500 focus:ring-emerald-500/50 cursor-pointer"
              />
              <span className="text-xs sm:text-sm font-medium text-white/90">Lặp lại toàn bộ video</span>
            </label>

            <div className="flex items-center gap-1.5">
              <Input
                type="number"
                value={loopCount}
                onChange={(e) => setLoopCount(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-14 sm:w-16 h-7 sm:h-8 text-center bg-white/10 border-white/20 text-white font-mono font-bold text-xs sm:text-sm rounded-xl focus-visible:border-emerald-400"
                min="1"
              />
              <span className="text-xs text-white/60">lần</span>
            </div>
          </div>
        </div>

        {/* Option 2: Loop a portion */}
        <div className="bg-white/[0.04] border border-white/15 rounded-xl p-3 sm:p-3.5 space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <label htmlFor="loop-portion" className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                id="loop-portion"
                checked={loopPortion}
                onChange={(e) => {
                  setLoopPortion(e.target.checked);
                  if (e.target.checked) setLoopEnabled(false);
                }}
                className="w-4 h-4 rounded border-white/20 bg-white/10 text-emerald-500 focus:ring-emerald-500/50 cursor-pointer"
              />
              <span className="text-sm font-medium text-white/90">Lặp một đoạn</span>
            </label>

            <div className="flex items-center gap-1.5">
              <Input
                type="number"
                value={portionLoopCount}
                onChange={(e) => setPortionLoopCount(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-14 sm:w-16 h-7 sm:h-8 text-center bg-white/10 border-white/20 text-white font-mono font-bold text-xs sm:text-sm rounded-xl focus-visible:border-emerald-400"
                min="1"
              />
              <span className="text-xs text-white/60">lần</span>
            </div>
          </div>

          {/* Time range inputs */}
          <div className="flex items-center justify-between gap-2 pt-1 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-white/60">Từ:</span>
              <Input
                type="text"
                value={startTime}
                onChange={(e) => {
                  const formatted = validateTimeInput(e.target.value, false);
                  setStartTime(formatted);
                  if (formatted && formatted !== '00:00' && formatted !== '00:00:00') {
                    setLoopPortion(true);
                    setLoopEnabled(false);
                  }
                }}
                onBlur={(e) => {
                  const rawValue = e.target.value.trim();
                  const parsedSeconds = parseTime(rawValue);
                  if (parsedSeconds > duration) {
                    setStartTime(formatTimeString(duration));
                  } else if (parsedSeconds >= 0) {
                    setStartTime(validateTimeInput(rawValue, true));
                  }
                }}
                placeholder="00:00"
                className="w-20 h-8 text-center bg-white/10 border-white/20 text-emerald-300 font-mono font-semibold text-xs rounded-xl"
              />
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-white/60">Đến:</span>
              <Input
                type="text"
                value={endTime}
                onChange={(e) => {
                  const formatted = validateTimeInput(e.target.value, false);
                  setEndTime(formatted);
                  if (formatted && formatted !== '00:00' && formatted !== '00:00:00') {
                    setLoopPortion(true);
                    setLoopEnabled(false);
                  }
                }}
                onBlur={(e) => {
                  const rawValue = e.target.value.trim();
                  const parsedSeconds = parseTime(rawValue);
                  if (parsedSeconds > duration) {
                    setEndTime(formatTimeString(duration));
                  } else if (parsedSeconds >= 0) {
                    setEndTime(validateTimeInput(rawValue, true));
                  }
                }}
                placeholder="00:00"
                className="w-20 h-8 text-center bg-white/10 border-white/20 text-emerald-300 font-mono font-semibold text-xs rounded-xl"
              />
            </div>
          </div>

          {/* Slider */}
          <div className="pt-2">
            <div
              ref={sliderRef}
              className="relative h-2.5 bg-white/10 rounded-full cursor-pointer hover:bg-white/15 transition-all"
              onMouseDown={(e) => {
                if (!isDragging && sliderRef.current) {
                  const rect = sliderRef.current.getBoundingClientRect();
                  const percent = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
                  const seconds = Math.floor((percent / 100) * duration);
                  const distToStart = Math.abs(seconds - startSeconds);
                  const distToEnd = Math.abs(seconds - endSeconds);
                  
                  if (distToStart < distToEnd && seconds < endSeconds) {
                    setIsDragging('start');
                    setStartTime(formatTimeString(seconds));
                    setLoopPortion(true);
                    setLoopEnabled(false);
                  } else if (seconds > startSeconds) {
                    setIsDragging('end');
                    setEndTime(formatTimeString(seconds));
                    setLoopPortion(true);
                    setLoopEnabled(false);
                  }
                }
              }}
            >
              {/* Selected portion bar */}
              <div
                className="absolute h-full bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.6)]"
                style={{
                  left: `${startPercent}%`,
                  width: `${Math.max(0, endPercent - startPercent)}%`,
                }}
              />
              {/* Start handle */}
              <div
                className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full cursor-grab active:cursor-grabbing shadow-lg border border-emerald-400 z-10"
                style={{ left: `calc(${startPercent}% - 8px)` }}
                onMouseDown={handleMouseDown('start')}
              />
              {/* End handle */}
              <div
                className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full cursor-grab active:cursor-grabbing shadow-lg border border-emerald-400 z-10"
                style={{ left: `calc(${endPercent}% - 8px)` }}
                onMouseDown={handleMouseDown('end')}
              />
            </div>

            {/* Duration pill */}
            <div className="flex items-center justify-between mt-2.5 text-[11px] text-white/50 font-mono">
              <span>{startTime}</span>
              <span className="text-emerald-400 font-semibold">Độ dài lặp: {formatTimeString(loopDuration)}</span>
              <span>{endTime}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoopControl;
