import { Minus, Plus, X, ChevronDown, Check } from 'lucide-react';
import { Input } from '../ui/input';
import { useEffect, useState } from 'react';
import { safeInvoke } from '../lib/utils';

export interface SettingsPanelProps {
  onClose: () => void;
  roundsPerCycle: number;
  setRoundsPerCycle: (v: number) => void;
  customTimes: { focus: number; shortBreak: number; longBreak: number };
  onWorkTimeChange: (v: number) => void;
  onShortBreakTimeChange: (v: number) => void;
  onLongBreakTimeChange: (v: number) => void;
  quoteSpeed?: string;
  setQuoteSpeed?: (v: string) => void;
  showQuotes?: boolean;
  setShowQuotes?: (v: boolean) => void;
  autoStartNext: boolean;
  setAutoStartNext: (v: boolean) => void;
  autoStartBreakType: 'short' | 'long';
  setAutoStartBreakType: (v: 'short' | 'long') => void;
  youtubeUrl: string;
  onYouTubeUrlChange?: (url: string) => void;
  className?: string;
  width?: string;
  height?: string;
}

/** Modern liquid glass toggle switch */
function GlassSwitch({
  checked,
  onChange,
  label,
  sublabel,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  sublabel?: string;
}) {
  return (
    <div className="flex items-center justify-between py-1">
      <div className="flex flex-col pr-3">
        <span className="text-sm font-medium text-white/95">{label}</span>
        {sublabel && <span className="text-xs text-white/60 mt-0.5">{sublabel}</span>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border transition-all duration-200 ease-in-out focus:outline-none ${
          checked
            ? 'bg-emerald-500/80 border-emerald-400/60 shadow-[0_0_14px_rgba(52,211,153,0.5)]'
            : 'bg-white/10 border-white/20 hover:bg-white/15'
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-4.5 w-4.5 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out mt-[2px] ${
            checked ? 'translate-x-[22px]' : 'translate-x-[3px]'
          }`}
        />
      </button>
    </div>
  );
}

/** Hybrid direct-typing input + stepper + quick presets */
function GlassNumberInput({
  label,
  sublabel,
  value,
  suffix = 'm',
  min = 1,
  max = 999,
  step = 1,
  presets,
  onChange,
}: {
  label: string;
  sublabel?: string;
  value: number;
  suffix?: string;
  min?: number;
  max?: number;
  step?: number;
  presets?: number[];
  onChange: (v: number) => void;
}) {
  const [localVal, setLocalVal] = useState<string>(String(value));

  useEffect(() => {
    setLocalVal(String(value));
  }, [value]);

  const commitValue = (raw: string) => {
    const num = parseInt(raw, 10);
    if (!isNaN(num)) {
      const clamped = Math.max(min, Math.min(max, num));
      setLocalVal(String(clamped));
      onChange(clamped);
    } else {
      setLocalVal(String(value));
    }
  };

  const handleStep = (delta: number) => {
    const current = parseInt(localVal, 10) || value;
    const next = Math.max(min, Math.min(max, current + delta));
    setLocalVal(String(next));
    onChange(next);
  };

  return (
    <div className="space-y-1.5 py-1">
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-col">
          <span className="text-sm font-medium text-white/95">{label}</span>
          {sublabel && <span className="text-xs text-white/50">{sublabel}</span>}
        </div>

        {/* Input box with stepper buttons */}
        <div className="inline-flex items-center bg-white/[0.08] hover:bg-white/[0.12] border border-white/20 rounded-xl p-1 transition-all shadow-inner">
          <button
            type="button"
            onClick={() => handleStep(-step)}
            disabled={value <= min}
            className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 active:scale-95 disabled:opacity-25 flex items-center justify-center text-white/80 hover:text-white transition-all"
            aria-label={`Giảm ${label}`}
          >
            <Minus className="h-3.5 w-3.5" />
          </button>

          <div className="flex items-center px-1">
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={localVal}
              onChange={(e) => {
                const clean = e.target.value.replace(/[^0-9]/g, '');
                setLocalVal(clean);
              }}
              onBlur={() => commitValue(localVal)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  commitValue(localVal);
                  (e.target as HTMLInputElement).blur();
                } else if (e.key === 'ArrowUp') {
                  e.preventDefault();
                  handleStep(step);
                } else if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  handleStep(-step);
                }
              }}
              title="Nhấp để nhập số phút trực tiếp"
              className="w-12 h-7 bg-transparent text-center font-mono font-bold text-sm text-emerald-300 focus:text-emerald-200 outline-none select-all"
            />
            {suffix && (
              <span className="text-xs font-mono font-medium text-white/50 -ml-1 pr-1 pointer-events-none select-none">
                {suffix}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={() => handleStep(step)}
            disabled={value >= max}
            className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 active:scale-95 disabled:opacity-25 flex items-center justify-center text-white/80 hover:text-white transition-all"
            aria-label={`Tăng ${label}`}
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Quick preset chips */}
      {presets && presets.length > 0 && (
        <div className="flex items-center justify-end gap-1.5 pt-0.5">
          <span className="text-[11px] text-white/40 mr-1 select-none">Nhanh:</span>
          {presets.map((p) => {
            const isSelected = value === p;
            return (
              <button
                key={p}
                type="button"
                onClick={() => {
                  setLocalVal(String(p));
                  onChange(p);
                }}
                className={`px-2 py-0.5 rounded-lg text-xs font-mono transition-all ${
                  isSelected
                    ? 'bg-emerald-500 text-white font-semibold shadow-[0_0_10px_rgba(16,185,129,0.5)] border border-emerald-400'
                    : 'bg-white/[0.06] hover:bg-white/15 text-white/70 hover:text-white border border-white/10'
                }`}
              >
                {p}{suffix}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function SettingsPanel({
  onClose,
  roundsPerCycle,
  setRoundsPerCycle,
  customTimes,
  onWorkTimeChange,
  onShortBreakTimeChange,
  onLongBreakTimeChange,
  quoteSpeed = 'Normal',
  setQuoteSpeed,
  showQuotes = true,
  setShowQuotes,
  autoStartNext,
  setAutoStartNext,
  autoStartBreakType,
  setAutoStartBreakType,
  youtubeUrl,
  onYouTubeUrlChange,
  className = '',
  width = '100%',
  height = 'auto',
}: SettingsPanelProps) {
  const [youtubeInput, setYoutubeInput] = useState(youtubeUrl);
  const [autoStartWindows, setAutoStartWindows] = useState(false);
  const [savedYtNotice, setSavedYtNotice] = useState(false);

  useEffect(() => {
    setYoutubeInput(youtubeUrl);
  }, [youtubeUrl]);

  useEffect(() => {
    safeInvoke<boolean>('is_autostart_enabled').then((enabled) => {
      if (typeof enabled === 'boolean') {
        setAutoStartWindows(enabled);
      }
    });
  }, []);

  const handleAutoStartToggle = async (enabled: boolean) => {
    await safeInvoke('set_autostart', { enable: enabled });
    setAutoStartWindows(enabled);
  };

  const commitYouTube = () => {
    const trimmed = youtubeInput.trim();
    if (trimmed && trimmed !== youtubeUrl && onYouTubeUrlChange) {
      onYouTubeUrlChange(trimmed);
      setSavedYtNotice(true);
      setTimeout(() => setSavedYtNotice(false), 2000);
    }
  };

  return (
    <div
      className={`glass-panel p-5 sm:p-6 flex flex-col overflow-y-auto text-sm relative select-none rounded-2xl sm:rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.6)] border border-white/20 ${className}`}
      style={{ width, height }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-white/15">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_10px_#34d399]" />
          <h2 className="text-base font-bold tracking-wider text-white">SETTINGS</h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 flex items-center justify-center text-white/80 hover:text-white transition-all border border-white/15"
          aria-label="Đóng cài đặt"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-4">
        {/* Section: Auto Transition */}
        <div className="bg-white/[0.04] border border-white/15 rounded-2xl p-4 space-y-3">
          <GlassSwitch
            checked={autoStartNext}
            onChange={setAutoStartNext}
            label="Auto Start Next"
            sublabel="Tự động chuyển tiếp giữa phiên làm việc & nghỉ ngơi"
          />

          {autoStartNext && (
            <div className="pt-3 border-t border-white/10 space-y-2">
              <span className="text-xs font-medium text-white/70">Loại nghỉ ngơi tiếp theo</span>
              <div className="grid grid-cols-2 p-1 bg-black/25 rounded-xl border border-white/15 gap-1.5">
                <button
                  type="button"
                  onClick={() => setAutoStartBreakType('short')}
                  className={`py-1.5 text-xs font-medium rounded-lg transition-all ${
                    autoStartBreakType === 'short'
                      ? 'glass-accent text-white shadow-md'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  Short Break
                </button>
                <button
                  type="button"
                  onClick={() => setAutoStartBreakType('long')}
                  className={`py-1.5 text-xs font-medium rounded-lg transition-all ${
                    autoStartBreakType === 'long'
                      ? 'glass-accent text-white shadow-md'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  Long Break
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Section: Durations & Cycle with direct typing */}
        <div className="bg-white/[0.04] border border-white/15 rounded-2xl p-4 space-y-4 divide-y divide-white/10">
          <div>
            <GlassNumberInput
              label="Thời gian tập trung (Focus)"
              value={customTimes.focus}
              presets={[15, 25, 30, 45, 60]}
              onChange={onWorkTimeChange}
            />
          </div>

          <div className="pt-3">
            <GlassNumberInput
              label="Nghỉ ngắn (Short break)"
              value={customTimes.shortBreak}
              presets={[3, 5, 10]}
              onChange={onShortBreakTimeChange}
            />
          </div>

          <div className="pt-3">
            <GlassNumberInput
              label="Nghỉ dài (Long break)"
              value={customTimes.longBreak}
              presets={[10, 15, 20, 30]}
              onChange={onLongBreakTimeChange}
            />
          </div>

          <div className="pt-3">
            <GlassNumberInput
              label="Số vòng mỗi chu kỳ (Rounds)"
              value={roundsPerCycle}
              suffix=""
              presets={[2, 4, 6, 8]}
              onChange={setRoundsPerCycle}
            />
          </div>
        </div>

        {/* Section: Quotes */}
        {(setShowQuotes || setQuoteSpeed) && (
          <div className="bg-white/[0.04] border border-white/15 rounded-2xl p-4 space-y-3">
            {setShowQuotes && (
              <GlassSwitch
                checked={showQuotes}
                onChange={setShowQuotes}
                label="Motivational Quotes"
                sublabel="Trích dẫn truyền cảm hứng khi đếm giờ"
              />
            )}
            {setQuoteSpeed && (
              <div className="flex items-center justify-between pt-1">
                <span className="text-sm font-medium text-white/90">Tốc độ chữ chạy</span>
                <button
                  type="button"
                  onClick={() => {
                    const order = ['Slow', 'Normal', 'Fast'];
                    const idx = order.indexOf(quoteSpeed);
                    setQuoteSpeed(order[(idx + 1) % order.length]);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white text-xs font-semibold flex items-center gap-2 border border-white/20 transition-all"
                >
                  <span>{quoteSpeed}</span>
                  <ChevronDown className="h-3.5 w-3.5 text-white/60" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Section: Media / YouTube URL */}
        {onYouTubeUrlChange && (
          <div className="bg-white/[0.04] border border-white/15 rounded-2xl p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-white/80 block">
                Background Music (YouTube URL)
              </span>
              {savedYtNotice && (
                <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                  <Check className="h-3 w-3" /> Đã cập nhật
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Input
                value={youtubeInput}
                onChange={(e) => setYoutubeInput(e.target.value)}
                onBlur={commitYouTube}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    commitYouTube();
                  }
                }}
                placeholder="https://www.youtube.com/watch?v=..."
                className="h-9 bg-white/5 border-white/20 text-xs text-white placeholder-white/30 focus-visible:border-emerald-400 focus-visible:ring-1 focus-visible:ring-emerald-400/30 flex-1"
              />
              <button
                type="button"
                onClick={commitYouTube}
                className="h-9 px-3 rounded-xl bg-emerald-500/80 hover:bg-emerald-500 active:scale-95 text-white text-xs font-semibold transition-all border border-emerald-400/40 shrink-0"
              >
                Lưu
              </button>
            </div>
            <p className="text-[11px] text-white/50 leading-tight">
              Nhấn Enter, bấm "Lưu", hoặc click ra ngoài để đổi video.
            </p>
          </div>
        )}

        {/* Section: Windows Integration */}
        <div className="bg-white/[0.04] border border-white/15 rounded-2xl p-4">
          <GlassSwitch
            checked={autoStartWindows}
            onChange={handleAutoStartToggle}
            label="Start with Windows"
            sublabel="Tự động mở Pomodoro khi khởi động máy tính"
          />
        </div>
      </div>
    </div>
  );
}

export default SettingsPanel;
