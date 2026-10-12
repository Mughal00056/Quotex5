import React, { useEffect } from 'react';
import { useTrading } from '../context/TradingContext';
import { X, TrendingUp, TrendingDown, Trophy } from 'lucide-react';

export const TradeResultPopup: React.FC = () => {
  const { lastClosedTrade, clearLastClosedTrade, showOrderToastEnabled, showResultPopupEnabled } = useTrading();

  useEffect(() => {
    if (!lastClosedTrade) return;
    const timer = setTimeout(() => {
      clearLastClosedTrade();
    }, 5000);
    return () => clearTimeout(timer);
  }, [lastClosedTrade, clearLastClosedTrade]);

  if (!lastClosedTrade || !showOrderToastEnabled || !showResultPopupEnabled) return null;

  const isWon = lastClosedTrade.status === 'WON';
  const isTie = lastClosedTrade.status === 'TIE';
  const isSell = lastClosedTrade.direction === 'DOWN';

  // Total payout return
  const totalReturn = isWon
    ? Number((lastClosedTrade.amount + (lastClosedTrade.actualProfit || 0)).toFixed(2))
    : lastClosedTrade.amount;

  return (
    <div className="absolute top-12 left-3 z-30 animate-scaleUp select-none pointer-events-auto">
      <div className="relative">
        <div
          className={`px-2.5 py-1.5 rounded-lg shadow-xl text-white min-w-[125px] border ${
            isWon
              ? isSell
                ? 'bg-gradient-to-r from-[#ff3355] to-[#e11d48] border-rose-300'
                : 'bg-gradient-to-r from-[#00c874] to-[#00e599] text-slate-950 border-emerald-300'
              : isTie
              ? 'bg-[#f59e0b] border-amber-300'
              : 'bg-[#1e1016] border-[#ff3355]/80 text-rose-300'
          }`}
        >
          <div className="flex items-center justify-between text-[9px] font-black tracking-wider uppercase mb-0.5">
            <span className="flex items-center gap-1">
              <Trophy className="w-2.5 h-2.5" />
              <span>RESULT (P/F)</span>
            </span>
            <button
              onClick={clearLastClosedTrade}
              className="p-0.5 rounded hover:bg-black/20 transition-colors ml-1.5 cursor-pointer"
              title="Dismiss"
            >
              <X className="w-2.5 h-2.5 stroke-[2.5]" />
            </button>
          </div>

          <div className={`font-mono-num text-xs font-black tracking-tight ${
            isWon && !isSell ? 'text-slate-950' : 'text-white'
          }`}>
            {isWon
              ? `+$${totalReturn.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              : isTie
              ? `$0.00`
              : `-$${lastClosedTrade.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          </div>
        </div>
      </div>
    </div>
  );
};
