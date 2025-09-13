import { Minus, Plus, X, ChevronDown, Volume2, VolumeX } from 'lucide-react';
import { Input } from '../ui/input';
import { useEffect, useState } from 'react';

export interface SettingsPanelProps {
  onClose: () => void;
  roundsPerCycle: number;
  setRoundsPerCycle: (v: number) => void;
  customTimes: { focus: number; shortBreak: number; longBreak: number };
  onWorkTimeChange: (v: number) => void;
  onShortBreakTimeChange: (v: number) => void;
  onLongBreakTimeChange: (v: number) => void;
  quoteSpeed: string; // currently display only
  setQuoteSpeed: (v: string) => void;
  showQuotes: boolean;
  setShowQuotes: (v: boolean) => void;
  isMuted: boolean;
  setIsMuted: (v: boolean) => void;
  youtubeUrl: string;
  onYouTubeUrlChange?: (url: string) => void;
  className?: string;
  width?: string; // Custom width for different modes
  height?: string; // Custom height for different modes
}

/**
 * Re-usable settings panel used in MiniMode (and can be plugged into other modes).
 * All state is lifted to parent; only YouTube input keeps temporary local value then commits on blur/enter.
 */
export function SettingsPanel({
  onClose,
  roundsPerCycle,
  setRoundsPerCycle,
  customTimes,
  onWorkTimeChange,
  onShortBreakTimeChange,
  onLongBreakTimeChange,
  quoteSpeed,
  setQuoteSpeed,
  showQuotes,
  setShowQuotes,
  isMuted,
  setIsMuted,
  youtubeUrl,
  onYouTubeUrlChange,
  className = '',
  width = '240px',
  height = '100%'
}: SettingsPanelProps) {
  const [youtubeInput, setYoutubeInput] = useState(youtubeUrl);
  useEffect(() => { setYoutubeInput(youtubeUrl); }, [youtubeUrl]);

  const commitYouTube = () => {
    const trimmed = youtubeInput.trim();
    if (trimmed && trimmed !== youtubeUrl && onYouTubeUrlChange) {
      onYouTubeUrlChange(trimmed);
    }
  };

  return (
    <div 
      className={`bg-gray-800 border-l border-gray-600 p-4 flex flex-col overflow-y-auto overflow-x-hidden text-xs relative z-[101] ${className}`}
      style={{ width, height }}
    >      
      <div className="flex items-center justify-between mb-4 select-none">
        <h2 className="text-sm font-semibold text-white tracking-wide">SETTINGS</h2>
        <button
          className="w-6 h-6 rounded-full bg-gray-600 hover:bg-gray-500 flex items-center justify-center"
          onClick={onClose}
        >
          <X className="h-3 w-3 text-white" />
        </button>
      </div>
      <div className="space-y-6">
        {/* Quick Settings */}
        <div>
          <h3 className="text-gray-300 font-semibold mb-2 text-xs">Quick Settings</h3>
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-xs">Rounds per cycle</span>
            <div className="flex items-center gap-1">
              <button onClick={() => setRoundsPerCycle(Math.max(1, roundsPerCycle - 1))} className="w-5 h-5 rounded bg-gray-600 hover:bg-gray-500 flex items-center justify-center"><Minus className="h-2.5 w-2.5 text-white" /></button>
              <span className="text-white font-mono w-5 text-center text-xs">{roundsPerCycle}</span>
              <button onClick={() => setRoundsPerCycle(roundsPerCycle + 1)} className="w-5 h-5 rounded bg-gray-600 hover:bg-gray-500 flex items-center justify-center"><Plus className="h-2.5 w-2.5 text-white" /></button>
            </div>
          </div>
        </div>

        {/* Durations */}
        <div>
          <h3 className="text-gray-300 font-semibold mb-2 text-xs">Durations</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-xs">Focus</span>
              <div className="flex items-center gap-1">
                <button onClick={() => onWorkTimeChange(Math.max(1, customTimes.focus - 1))} className="px-1.5 py-0.5 bg-gray-600 hover:bg-gray-500 rounded text-white text-xs">-1m</button>
                <span className="text-white font-mono w-8 text-center text-xs">{customTimes.focus}m</span>
                <button onClick={() => onWorkTimeChange(customTimes.focus + 1)} className="px-1.5 py-0.5 bg-gray-600 hover:bg-gray-500 rounded text-white text-xs">+1m</button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-xs">Short</span>
              <div className="flex items-center gap-1">
                <button onClick={() => onShortBreakTimeChange(Math.max(1, customTimes.shortBreak - 1))} className="px-1.5 py-0.5 bg-gray-600 hover:bg-gray-500 rounded text-white text-xs">-1m</button>
                <span className="text-white font-mono w-8 text-center text-xs">{customTimes.shortBreak}m</span>
                <button onClick={() => onShortBreakTimeChange(customTimes.shortBreak + 1)} className="px-1.5 py-0.5 bg-gray-600 hover:bg-gray-500 rounded text-white text-xs">+1m</button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-xs">Long</span>
              <div className="flex items-center gap-1">
                <button onClick={() => onLongBreakTimeChange(Math.max(1, customTimes.longBreak - 1))} className="px-1.5 py-0.5 bg-gray-600 hover:bg-gray-500 rounded text-white text-xs">-1m</button>
                <span className="text-white font-mono w-8 text-center text-xs">{customTimes.longBreak}m</span>
                <button onClick={() => onLongBreakTimeChange(customTimes.longBreak + 1)} className="px-1.5 py-0.5 bg-gray-600 hover:bg-gray-500 rounded text-white text-xs">+1m</button>
              </div>
            </div>
          </div>
        </div>

        {/* Quotes */}
        <div>
          <h3 className="text-gray-300 font-semibold mb-2">Quotes</h3>
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Speed</span>
            <div className="flex items-center gap-2">
              <span className="text-white text-xs">{quoteSpeed}</span>
              <button className="w-6 h-6 rounded bg-gray-600 hover:bg-gray-500 flex items-center justify-center" onClick={() => {
                // simple cycle speeds
                const order = ['Slow','Normal','Fast'];
                const idx = order.indexOf(quoteSpeed);
                setQuoteSpeed(order[(idx+1)%order.length]);
              }}>
                <ChevronDown className="h-3 w-3 text-white" />
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between mt-3">
            <span className="text-gray-400">Show quotes</span>
            <button
              onClick={() => setShowQuotes(!showQuotes)}
              className={`px-3 h-6 rounded text-xs font-medium transition-colors ${showQuotes ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-gray-600 hover:bg-gray-500 text-gray-200'}`}
            >
              {showQuotes ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>

        {/* Media */}
        <div>
          <h3 className="text-gray-300 font-semibold mb-2">Media</h3>
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Mute YouTube</span>
            <button onClick={() => setIsMuted(!isMuted)} className="w-8 h-8 rounded bg-gray-600 hover:bg-gray-500 flex items-center justify-center">
              {isMuted ? <VolumeX className="h-4 w-4 text-white" /> : <Volume2 className="h-4 w-4 text-white" />}
            </button>
          </div>
          {onYouTubeUrlChange && (
            <div className="mt-4 space-y-1">
              <label className="text-gray-400 text-[10px] font-medium block">YouTube URL</label>
              <Input
                value={youtubeInput}
                onChange={(e) => setYoutubeInput(e.target.value)}
                onBlur={commitYouTube}
                onKeyDown={(e) => { if (e.key === 'Enter') { commitYouTube(); } }}
                placeholder="Paste YouTube link..."
                className="h-7 bg-gray-700 border-gray-600 text-xs focus-visible:ring-0 focus-visible:ring-offset-0"
              />
              <p className="text-[10px] text-gray-500 leading-tight">Enter / blur để áp dụng.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SettingsPanel;
