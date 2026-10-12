import React, { useState, useMemo } from 'react';
import { useTrading } from '../context/TradingContext';
import { ALL_INDICATORS } from '../constants/indicators';
import { IndicatorCategory } from '../types/trading';
import {
  X,
  Sliders,
  TrendingUp,
  Activity,
  Layers,
  Sparkles,
  RotateCcw,
  Check,
  PenTool,
  Square,
  Trash2,
  Plus,
  Search,
  CheckCircle2
} from 'lucide-react';
import { formatPrice } from '../utils/chartMath';

interface IndicatorsDrawerModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'ALL' | 'TREND' | 'VOLATILITY' | 'CHANNELS' | 'OSCILLATORS' | 'PIVOTS' | 'VOLUME' | 'DRAWING';
}

export const IndicatorsDrawerModal: React.FC<IndicatorsDrawerModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'ALL'
}) => {
  const {
    activeIndicatorIds,
    toggleIndicator,
    clearAllActiveIndicators,
    drawnLines,
    addDrawnLine,
    removeDrawnLine,
    activeAsset,
    activeDrawingTool,
    setActiveDrawingTool
  } = useTrading();

  const [activeCategory, setActiveCategory] = useState<
    'ALL' | 'TREND' | 'VOLATILITY' | 'CHANNELS' | 'OSCILLATORS' | 'PIVOTS' | 'VOLUME' | 'DRAWING'
  >(defaultTab);
  const [search, setSearch] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('#eab308');

  const filteredIndicators = useMemo(() => {
    return ALL_INDICATORS.filter((ind) => {
      const matchesSearch =
        ind.name.toLowerCase().includes(search.toLowerCase()) ||
        ind.shortName.toLowerCase().includes(search.toLowerCase()) ||
        ind.description.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = activeCategory === 'ALL' || ind.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [search, activeCategory]);

  if (!isOpen) return null;

  const categories: { key: 'ALL' | 'TREND' | 'VOLATILITY' | 'CHANNELS' | 'OSCILLATORS' | 'PIVOTS' | 'VOLUME' | 'DRAWING'; label: string }[] = [
    { key: 'ALL', label: `All (${ALL_INDICATORS.length})` },
    { key: 'TREND', label: 'Trend & MAs' },
    { key: 'VOLATILITY', label: 'Volatility & Bands' },
    { key: 'CHANNELS', label: 'Channels & Reg' },
    { key: 'OSCILLATORS', label: 'Oscillators (Line)' },
    { key: 'PIVOTS', label: 'Pivots & Fibonacci' },
    { key: 'VOLUME', label: 'Volume & Flow' },
    { key: 'DRAWING', label: `Drawing Lines (${drawnLines.length})` }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-[#111723] border border-[#232f45] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92dvh]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-[#1f2a3d] bg-[#141b29]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                Live Technical Indicators ({ALL_INDICATORS.length}+)
                <span className="text-[10px] bg-cyan-500/20 text-cyan-300 font-extrabold px-2 py-0.5 rounded-full border border-cyan-500/30 font-mono">
                  {activeIndicatorIds.length} ACTIVE LINES
                </span>
              </h2>
              <p className="text-[10px] sm:text-[11px] text-slate-400">
                100+ Professional mathematical indicators plotted directly as clean lines on the chart
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {activeIndicatorIds.length > 0 && (
              <button
                onClick={clearAllActiveIndicators}
                className="px-2 py-1 rounded-lg text-[10px] font-bold text-slate-400 hover:text-rose-300 hover:bg-rose-950/40 border border-transparent hover:border-rose-900 transition-colors"
                title="Clear all active indicators"
              >
                Clear All
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#1f283a] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search & Category Filter */}
        <div className="p-3 sm:p-4 border-b border-[#1b2536] bg-[#0f1420] space-y-2.5">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search 100+ indicators (e.g. SMA, EMA 50, Supertrend, RSI, Fibonacci, Pivots)..."
              className="w-full bg-[#161e2b] border border-[#253246] focus:border-cyan-500 rounded-xl py-2 pl-10 pr-4 text-xs text-white placeholder-slate-400 outline-none"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
            {categories.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  activeCategory === cat.key
                    ? 'bg-cyan-500 text-slate-950 font-black'
                    : 'bg-[#17202e] text-slate-400 hover:text-slate-200 hover:bg-[#1e2a3c]'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="p-3 sm:p-4 overflow-y-auto flex-1 space-y-2 text-xs">
          {activeCategory === 'DRAWING' ? (
            /* DRAWING TOOLS TAB */
            <div className="space-y-3">
              <div className="bg-[#141c2a] border border-[#222e42] rounded-xl p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-xs flex items-center gap-1.5">
                    <PenTool className="w-4 h-4 text-cyan-400" />
                    <span>Quick Drawing Overlay Lines</span>
                  </span>
                  <span className="text-[10px] text-slate-400">Add lines to live candle chart</span>
                </div>

                {/* Color Palette Selector */}
                <div className="flex items-center gap-2 pt-1 pb-1">
                  <span className="text-[10px] text-slate-400 font-semibold">Line Color:</span>
                  {['#eab308', '#00e599', '#ff3355', '#06b6d4', '#a855f7', '#ffffff'].map((c) => (
                    <button
                      key={c}
                      onClick={() => setSelectedColor(c)}
                      className={`w-5 h-5 rounded-full border cursor-pointer transition-transform ${
                        selectedColor === c ? 'scale-125 border-white ring-2 ring-cyan-400' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>

                {/* Quick Add Buttons */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <button
                    onClick={() => {
                      const supportPrice = Number(
                        (activeAsset.currentPrice - activeAsset.volatility * 1.5).toFixed(activeAsset.decimalPlaces)
                      );
                      addDrawnLine({
                        type: 'horizontal',
                        price1: supportPrice,
                        color: '#00e599',
                        label: 'SUPPORT'
                      });
                    }}
                    className="py-2 px-2.5 rounded-xl bg-[#003823]/70 hover:bg-[#004a2f] border border-[#00e599]/40 text-[#00e599] font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Support Line</span>
                  </button>

                  <button
                    onClick={() => {
                      const resistPrice = Number(
                        (activeAsset.currentPrice + activeAsset.volatility * 1.5).toFixed(activeAsset.decimalPlaces)
                      );
                      addDrawnLine({
                        type: 'horizontal',
                        price1: resistPrice,
                        color: '#ff3355',
                        label: 'RESISTANCE'
                      });
                    }}
                    className="py-2 px-2.5 rounded-xl bg-[#3b0d14]/70 hover:bg-[#4f111b] border border-[#ff3355]/40 text-[#ff4d6b] font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Resistance Line</span>
                  </button>

                  <button
                    onClick={() => {
                      const price1 = Number(
                        (activeAsset.currentPrice - activeAsset.volatility * 0.8).toFixed(activeAsset.decimalPlaces)
                      );
                      const price2 = Number(
                        (activeAsset.currentPrice + activeAsset.volatility * 0.8).toFixed(activeAsset.decimalPlaces)
                      );
                      addDrawnLine({
                        type: 'trendline',
                        price1,
                        price2,
                        color: selectedColor,
                        label: 'TRENDLINE'
                      });
                    }}
                    className="py-2 px-2.5 rounded-xl bg-[#1a2436] hover:bg-[#233149] border border-[#2d3d57] text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-amber-400" />
                    <span>+ Trend Line</span>
                  </button>

                  <button
                    onClick={() => {
                      const now = Date.now();
                      addDrawnLine({
                        type: 'vertical',
                        price1: activeAsset.currentPrice,
                        time1: now,
                        color: selectedColor,
                        label: 'VERTICAL'
                      });
                    }}
                    className="py-2 px-2.5 rounded-xl bg-[#1a2436] hover:bg-[#233149] border border-[#2d3d57] text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-cyan-400" />
                    <span>+ Vertical Line</span>
                  </button>

                  <button
                    onClick={() => {
                      const price1 = Number(
                        (activeAsset.currentPrice - activeAsset.volatility * 2).toFixed(activeAsset.decimalPlaces)
                      );
                      const price2 = Number(
                        (activeAsset.currentPrice + activeAsset.volatility * 2).toFixed(activeAsset.decimalPlaces)
                      );
                      addDrawnLine({
                        type: 'fibonacci',
                        price1,
                        price2,
                        color: selectedColor,
                        label: 'FIBONACCI'
                      });
                    }}
                    className="py-2 px-2.5 rounded-xl bg-[#1e1b36] hover:bg-[#282449] border border-[#6366f1]/40 text-[#a5b4fc] font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-indigo-400" />
                    <span>+ Fibonacci</span>
                  </button>

                  <button
                    onClick={() => {
                      const price1 = Number(
                        (activeAsset.currentPrice + activeAsset.volatility * 1.2).toFixed(activeAsset.decimalPlaces)
                      );
                      const price2 = Number(
                        (activeAsset.currentPrice - activeAsset.volatility * 1.2).toFixed(activeAsset.decimalPlaces)
                      );
                      const now = Date.now();
                      addDrawnLine({
                        type: 'rectangle',
                        price1,
                        price2,
                        time1: now - 60 * 1000 * 8,
                        time2: now + 60 * 1000 * 4,
                        color: selectedColor,
                        label: 'ZONE BOX'
                      });
                    }}
                    className="py-2 px-2.5 rounded-xl bg-[#231a36] hover:bg-[#2f2249] border border-[#a855f7]/40 text-[#c084fc] font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Square className="w-3.5 h-3.5 text-purple-400" />
                    <span>+ Square Zone</span>
                  </button>
                </div>

                {/* Active Drawn Lines List */}
                {drawnLines.length > 0 && (
                  <div className="pt-2 border-t border-[#1f2b3e] space-y-1.5">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                      Active Drawn Lines ({drawnLines.length})
                    </span>
                    <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
                      {drawnLines.map((line) => (
                        <div
                          key={line.id}
                          className="flex items-center justify-between bg-[#0e1420] border border-[#1e2a3c] rounded-lg px-2.5 py-1.5 text-[11px]"
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: line.color }}
                            />
                            <span className="font-bold text-slate-200">{line.label}</span>
                            <span className="font-mono text-slate-400">
                              {formatPrice(line.price1, activeAsset.decimalPlaces)}
                            </span>
                          </div>
                          <button
                            onClick={() => removeDrawnLine(line.id)}
                            className="p-1 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* 100+ INDICATORS LIST (ONLY LINES) */
            <div className="space-y-1.5">
              {filteredIndicators.map((ind) => {
                const isActive = activeIndicatorIds.includes(ind.id);
                return (
                  <div
                    key={ind.id}
                    onClick={() => toggleIndicator(ind.id)}
                    className={`w-full flex items-center justify-between p-2.5 sm:p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#182436] border-cyan-500 shadow-md ring-1 ring-cyan-500/40'
                        : 'bg-[#141b27] border-[#202b3c] hover:bg-[#1b2536] text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Glowing Line Color Indicator */}
                      <div className="flex flex-col items-center gap-1 shrink-0">
                        <div
                          className="w-6 h-1 rounded-full shadow-sm"
                          style={{
                            backgroundColor: ind.color,
                            boxShadow: `0 0 8px ${ind.color}aa`
                          }}
                        />
                        <span className="text-[9px] font-mono text-slate-400 font-bold">
                          {ind.shortName}
                        </span>
                      </div>

                      <div className="pr-2">
                        <div className="font-bold text-xs text-white flex items-center gap-2 flex-wrap">
                          <span>{ind.name}</span>
                          <span className="text-[9px] bg-[#1d283c] text-slate-300 px-1.5 py-0.2 rounded font-mono font-semibold">
                            {ind.category}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">
                          {ind.description}
                        </p>
                      </div>
                    </div>

                    {/* Toggle Switch */}
                    <div className="shrink-0 pl-2">
                      <div
                        className={`w-9 h-5 rounded-full transition-colors p-0.5 flex items-center ${
                          isActive ? 'bg-cyan-500 justify-end' : 'bg-[#222d3e] justify-start'
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded-full shadow-md transition-transform ${
                            isActive ? 'bg-slate-950' : 'bg-slate-400'
                          }`}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}

              {filteredIndicators.length === 0 && (
                <div className="text-center py-10 text-slate-500 text-xs">
                  No indicators found matching "{search}".
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 bg-[#0e141f] border-t border-[#1f2a3d] flex items-center justify-between gap-3">
          <div className="text-[11px] text-slate-400 font-medium hidden sm:block">
            {activeIndicatorIds.length} indicators plotted as technical lines on chart
          </div>
          <button
            onClick={onClose}
            className="flex-1 sm:flex-none sm:px-8 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold rounded-xl text-xs transition-all shadow-md cursor-pointer"
          >
            Apply & View on Chart
          </button>
        </div>
      </div>
    </div>
  );
};
