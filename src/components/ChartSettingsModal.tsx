import React from 'react';
import { useTrading } from '../context/TradingContext';
import {
  X,
  CandlestickChart,
  LineChart,
  Activity,
  Layers,
  Sparkles,
  Volume2,
  VolumeX,
  Sliders,
  Palette,
  Image as ImageIcon,
  Link as LinkIcon,
  RotateCcw
} from 'lucide-react';
import { ChartType, CANDLE_COLOR_SCHEMES, CandleColorScheme } from '../types/trading';

interface ChartSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ChartSettingsModal: React.FC<ChartSettingsModalProps> = ({
  isOpen,
  onClose
}) => {
  const {
    setTimeframe,
    chartType,
    setChartType,
    candleColorScheme,
    setCandleColorScheme,
    indicators,
    setIndicators,
    soundEnabled,
    setSoundEnabled,
    marketBehaviorMode,
    setMarketBehaviorMode,
    logoImageUrl,
    setLogoImageUrl,
    watermarkSize,
    setWatermarkSize,
    watermarkOpacity,
    setWatermarkOpacity,
    watermarkType,
    setWatermarkType
  } = useTrading();

  if (!isOpen) return null;

  const timeframes = [
    { label: '5s', seconds: 5 },
    { label: '15s', seconds: 15 },
    { label: '30s', seconds: 30 },
    { label: '1m', seconds: 60 },
    { label: '5m', seconds: 300 }
  ];

  const chartTypes: { type: ChartType; label: string; icon: React.ReactNode }[] = [
    { type: 'candlestick', label: 'Candles', icon: <CandlestickChart className="w-4 h-4" /> },
    { type: 'heikinAshi', label: 'Heikin Ashi', icon: <Layers className="w-4 h-4" /> },
    { type: 'area', label: 'Area', icon: <Activity className="w-4 h-4" /> },
    { type: 'line', label: 'Line', icon: <LineChart className="w-4 h-4" /> }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md bg-[#111723] border border-[#232f45] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92dvh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1f2a3d] bg-[#141b29]">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Sliders className="w-4 h-4 text-cyan-400" />
            Chart & Engine Settings
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
          {/* Timeframe (Locked to 1m per candle as requested) */}
          <div>
            <div className="font-semibold text-slate-300 mb-2">Candle Timeframe (Fixed 1 Minute):</div>
            <div className="grid grid-cols-1 gap-1.5">
              <button
                onClick={() => setTimeframe(60)}
                className="py-2 rounded-lg font-black bg-[#00e599] text-slate-950 text-xs"
              >
                1m (1 Minute Per Candle - Locked)
              </button>
            </div>
          </div>

          {/* Chart Types */}
          <div>
            <div className="font-semibold text-slate-300 mb-2">Chart Style:</div>
            <div className="grid grid-cols-2 gap-2">
              {chartTypes.map((ct) => (
                <button
                  key={ct.type}
                  onClick={() => setChartType(ct.type)}
                  className={`p-2.5 rounded-xl border flex items-center gap-2 transition-all cursor-pointer ${
                    chartType === ct.type
                      ? 'bg-[#1b263b] border-cyan-500 text-cyan-300'
                      : 'bg-[#151c28] border-[#222e40] text-slate-300 hover:bg-[#1b2434]'
                  }`}
                >
                  {ct.icon}
                  <span className="font-medium">{ct.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Candle Color Scheme Selector (Bullish & Bearish Candles) */}
          <div>
            <div className="font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-cyan-400" />
              <span>Candle Color Scheme (Bullish / Bearish):</span>
            </div>
            <div className="space-y-1.5">
              {(Object.keys(CANDLE_COLOR_SCHEMES) as CandleColorScheme[]).map((schemeKey) => {
                const palette = CANDLE_COLOR_SCHEMES[schemeKey];
                const isSelected = candleColorScheme === schemeKey;
                return (
                  <button
                    key={schemeKey}
                    onClick={() => setCandleColorScheme(schemeKey)}
                    className={`w-full p-2.5 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#1b263b] border-cyan-500 text-white shadow-sm'
                        : 'bg-[#151c28] border-[#222e40] text-slate-300 hover:bg-[#1b2434]'
                    }`}
                  >
                    <div className="text-left">
                      <div className="font-bold text-xs flex items-center gap-1.5">
                        <span>{palette.label}</span>
                        {isSelected && (
                          <span className="text-[9px] bg-cyan-500/20 text-cyan-300 px-1.5 py-0.5 rounded font-black">
                            ACTIVE
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{palette.subtitle}</div>
                    </div>

                    {/* Visual Bullish & Bearish Mini Candlesticks Preview */}
                    <div className="flex items-center gap-2 bg-[#0b0f17] px-2.5 py-1.5 rounded-lg border border-[#1f2a3c] shrink-0">
                      <div className="flex items-center gap-1" title="Bullish Candle">
                        <div className="relative flex flex-col items-center">
                          <div className="w-[1.5px] h-1.5" style={{ backgroundColor: palette.bullish }} />
                          <div className="w-2.5 h-3.5 rounded-[1px]" style={{ backgroundColor: palette.bullish }} />
                          <div className="w-[1.5px] h-1.5" style={{ backgroundColor: palette.bullish }} />
                        </div>
                        <span className="text-[9px] font-mono font-bold" style={{ color: palette.bullish }}>
                          UP
                        </span>
                      </div>
                      <div className="w-[1px] h-4 bg-[#1f2a3c]" />
                      <div className="flex items-center gap-1" title="Bearish Candle">
                        <div className="relative flex flex-col items-center">
                          <div className="w-[1.5px] h-1.5" style={{ backgroundColor: palette.bearish }} />
                          <div className="w-2.5 h-3.5 rounded-[1px]" style={{ backgroundColor: palette.bearish }} />
                          <div className="w-[1.5px] h-1.5" style={{ backgroundColor: palette.bearish }} />
                        </div>
                        <span className="text-[9px] font-mono font-bold" style={{ color: palette.bearish }}>
                          DN
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Indicators */}
          <div>
            <div className="font-semibold text-slate-300 mb-2">Indicators:</div>
            <div className="space-y-1.5 bg-[#0e141f] p-2.5 rounded-xl border border-[#1e2738]">
              <label className="flex items-center justify-between p-1.5 hover:bg-[#151d2a] rounded cursor-pointer">
                <span className="text-slate-300">SMA Moving Average</span>
                <input
                  type="checkbox"
                  checked={indicators.sma}
                  onChange={(e) => setIndicators((prev) => ({ ...prev, sma: e.target.checked }))}
                  className="accent-[#00e599] w-4 h-4"
                />
              </label>

              <label className="flex items-center justify-between p-1.5 hover:bg-[#151d2a] rounded cursor-pointer">
                <span className="text-slate-300">EMA Exponential MA</span>
                <input
                  type="checkbox"
                  checked={indicators.ema}
                  onChange={(e) => setIndicators((prev) => ({ ...prev, ema: e.target.checked }))}
                  className="accent-cyan-400 w-4 h-4"
                />
              </label>

              <label className="flex items-center justify-between p-1.5 hover:bg-[#151d2a] rounded cursor-pointer">
                <span className="text-slate-300">Bollinger Bands</span>
                <input
                  type="checkbox"
                  checked={indicators.bbands}
                  onChange={(e) => setIndicators((prev) => ({ ...prev, bbands: e.target.checked }))}
                  className="accent-purple-400 w-4 h-4"
                />
              </label>
            </div>
          </div>

          {/* Candle Dynamics / User requested rule */}
          <div>
            <div className="font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Candle Response on Trade:</span>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => setMarketBehaviorMode('smart_push')}
                className={`w-full text-left p-2.5 rounded-xl border transition-all cursor-pointer ${
                  marketBehaviorMode === 'smart_push'
                    ? 'bg-emerald-950/40 border-emerald-500 text-emerald-300'
                    : 'bg-[#151c28] border-[#222e40] text-slate-300'
                }`}
              >
                <div className="font-bold">⚡ Always Win Mode (Smart Follow)</div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  When you tap Buy, candle moves green upward; when Sell, moves red downward.
                </div>
              </button>

              <button
                onClick={() => setMarketBehaviorMode('force_loss')}
                className={`w-full text-left p-2.5 rounded-xl border transition-all cursor-pointer ${
                  marketBehaviorMode === 'force_loss'
                    ? 'bg-rose-950/40 border-rose-500 text-rose-300'
                    : 'bg-[#151c28] border-[#222e40] text-slate-300'
                }`}
              >
                <div className="font-bold">📉 Force Lose Mode (Loss ON)</div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  When turned ON, trades move against entry direction and result in a loss.
                </div>
              </button>

              <button
                onClick={() => setMarketBehaviorMode('realistic')}
                className={`w-full text-left p-2.5 rounded-xl border transition-all cursor-pointer ${
                  marketBehaviorMode === 'realistic'
                    ? 'bg-amber-950/40 border-amber-500 text-amber-300'
                    : 'bg-[#151c28] border-[#222e40] text-slate-300'
                }`}
              >
                <div className="font-bold">📊 Real Trading (Lose & Win Mix)</div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Realistic trading behavior where trades naturally both win and lose.
                </div>
              </button>
            </div>
          </div>

          {/* Watermark Customization & Size Adjustment (No custom background clutter) */}
          <div className="bg-[#151d2a] border border-[#24334a] rounded-xl p-3.5 space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white text-xs flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-cyan-400" />
                <span>Chart Watermark & Branding</span>
              </span>
              <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded font-mono font-bold">
                {watermarkSize}px • {Math.round(watermarkOpacity * 100)}%
              </span>
            </div>

            {/* 1. Watermark Size Adjustment Slider (10x to 1000x) */}
            <div>
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-300 mb-1.5">
                <span>Watermark Zoom / Size (10x - 1000x):</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setWatermarkSize(Math.max(10, watermarkSize - 25))}
                    className="px-1.5 py-0.5 rounded bg-[#0d121c] border border-[#222e40] text-white font-bold text-xs cursor-pointer"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="10"
                    max="1000"
                    value={watermarkSize}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      if (!isNaN(val)) setWatermarkSize(Math.max(10, Math.min(1000, val)));
                    }}
                    className="w-16 bg-[#0d121c] border border-[#25334a] rounded px-1.5 py-0.5 text-center text-cyan-400 font-mono font-bold text-xs outline-none"
                  />
                  <span className="text-cyan-400 font-mono font-bold text-[10px]">x</span>
                  <button
                    type="button"
                    onClick={() => setWatermarkSize(Math.min(1000, watermarkSize + 25))}
                    className="px-1.5 py-0.5 rounded bg-[#0d121c] border border-[#222e40] text-white font-bold text-xs cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>
              <input
                type="range"
                min="10"
                max="1000"
                step="5"
                value={watermarkSize}
                onChange={(e) => setWatermarkSize(parseInt(e.target.value, 10))}
                className="w-full accent-cyan-400 cursor-pointer h-2 bg-[#0d121c] rounded-lg"
              />

              {/* Quick Preset Sizes up to 1000x */}
              <div className="mt-2 grid grid-cols-6 gap-1">
                {[
                  { label: '50x', size: 50 },
                  { label: '150x', size: 150 },
                  { label: '300x', size: 300 },
                  { label: '500x', size: 500 },
                  { label: '750x', size: 750 },
                  { label: '1000x', size: 1000 }
                ].map((preset) => (
                  <button
                    type="button"
                    key={preset.label}
                    onClick={() => setWatermarkSize(preset.size)}
                    className={`text-[10px] py-1 rounded-md border font-mono font-bold transition-all cursor-pointer ${
                      watermarkSize === preset.size
                        ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-black'
                        : 'bg-[#0d121c] border-[#222e40] text-slate-400 hover:text-white'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Watermark Opacity Slider (1% to 100%) */}
            <div>
              <div className="flex justify-between text-[11px] font-bold text-slate-300 mb-1">
                <span>Watermark Visibility (Opacity):</span>
                <span className="text-cyan-400 font-mono font-bold">{Math.round(watermarkOpacity * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.02"
                max="1"
                step="0.02"
                value={watermarkOpacity}
                onChange={(e) => setWatermarkOpacity(parseFloat(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer h-2 bg-[#0d121c] rounded-lg"
              />
            </div>

            {/* 3. Watermark Elements Toggle */}
            <div>
              <label className="text-[11px] font-bold text-slate-300 block mb-1">
                Watermark Elements:
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {(['both', 'logo', 'text'] as const).map((mode) => (
                  <button
                    type="button"
                    key={mode}
                    onClick={() => setWatermarkType(mode)}
                    className={`py-1.5 px-2 rounded-lg text-xs font-bold uppercase transition-all cursor-pointer ${
                      watermarkType === mode
                        ? 'bg-cyan-500 text-slate-950 font-black'
                        : 'bg-[#0d121c] border border-[#222e40] text-slate-400 hover:text-white'
                    }`}
                  >
                    {mode === 'both' ? 'Logo + Text' : mode === 'logo' ? 'Logo Only' : 'Text Only'}
                  </button>
                ))}
              </div>
            </div>

            {/* 4. Logo Image URL & Gallery Upload */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-300 block">
                Custom Watermark Logo URL or Upload:
              </label>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  placeholder="Paste any image URL (https://... or data:image/...)"
                  value={logoImageUrl}
                  onChange={(e) => setLogoImageUrl(e.target.value)}
                  className="flex-1 bg-[#0d121c] border border-[#25334a] rounded-lg px-2.5 py-1.5 text-white font-mono text-xs outline-none focus:border-cyan-400"
                />
                {logoImageUrl && (
                  <button
                    type="button"
                    onClick={() => setLogoImageUrl('')}
                    className="px-2 py-1 rounded bg-[#202b3d] hover:bg-rose-900/50 text-slate-300 hover:text-rose-200 text-xs font-bold transition-colors cursor-pointer"
                    title="Reset to default logo"
                  >
                    Default
                  </button>
                )}
              </div>

              <div className="flex items-center justify-between gap-2 pt-0.5">
                <label className="flex-1 py-1.5 px-2.5 rounded-lg bg-[#0d121c] hover:bg-[#1b263b] border border-[#25334a] text-cyan-300 text-[10px] font-bold text-center cursor-pointer transition-colors">
                  <span>📁 Upload Image From Device / Gallery</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = () => {
                        if (typeof reader.result === 'string') {
                          setLogoImageUrl(reader.result);
                        }
                      };
                      reader.readAsDataURL(file);
                    }}
                  />
                </label>
                {logoImageUrl && (
                  <img
                    src={logoImageUrl}
                    alt="Preview"
                    className="w-8 h-8 rounded border border-cyan-500/40 object-contain bg-[#0d121c] shrink-0"
                  />
                )}
              </div>

              {/* Direct 3-Candlesticks Logo Download & URL Box */}
              <div className="p-2 rounded-lg bg-[#0d121c] border border-emerald-500/30 flex items-center justify-between gap-2 mt-1">
                <div className="flex items-center gap-2 min-w-0">
                  <img
                    src="/apple-touch-icon.png?v=3"
                    alt="Candlestick Logo"
                    className="w-7 h-7 rounded-md object-contain bg-[#07090e] border border-emerald-500/30 shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="text-[10px] font-extrabold text-emerald-300 truncate">
                      3-Candlesticks Logo (apple-touch-icon.png)
                    </div>
                    <div className="text-[9px] text-slate-400 font-mono truncate">
                      /apple-touch-icon.png
                    </div>
                  </div>
                </div>
                <a
                  href="/apple-touch-icon.png?v=3"
                  download="apple-touch-icon.png"
                  className="px-2.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-[10px] shrink-0 transition-colors"
                >
                  ⬇️ Download
                </a>
              </div>
            </div>
          </div>

          {/* Sound FX */}
          <div className="flex items-center justify-between pt-2 border-t border-[#1e2738]">
            <span className="text-slate-300 font-semibold">Sound FX:</span>
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#18212f] text-slate-300 hover:text-white"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-[#00e599]" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
              <span>{soundEnabled ? 'Enabled' : 'Muted'}</span>
            </button>
          </div>
        </div>

        <div className="p-4 bg-[#0e141f] border-t border-[#1f2a3d]">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl text-xs transition-colors"
          >
            Apply & Close
          </button>
        </div>
      </div>
    </div>
  );
};
