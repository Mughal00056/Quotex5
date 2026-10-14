import React, { useEffect } from 'react';
import { useTrading } from '../context/TradingContext';
import { X, TrendingUp, TrendingDown, Trophy } from 'lucide-react';

export const TradeResultPopup: React.FC = () => {
  const {
    lastClosedTrade,
    lastTradeResultSummary,
    clearLastClosedTrade,
    showOrderToastEnabled,
    showResultPopupEnabled
  } = useTrading();

  useEffect(() => {
    if (!lastClosedTrade && !lastTradeResultSummary) return;
    const timer = setTimeout(() => {
      clearLastClosedTrade();
    }, 5000);
    return () => clearTimeout(timer);
  }, [lastClosedTrade, lastTradeResultSummary, clearLastClosedTrade]);

  if ((!lastClosedTrade && !lastTradeResultSummary) || !showOrderToastEnabled || !showResultPopupEnabled) return null;

  const summary = lastTradeResultSummary;
  const isMultiple = summary ? summary.tradeCount > 1 : false;
  const tradeCount = summary ? summary.tradeCount : 1;
  const isWon = summary ? summary.status === 'WON' : lastClosedTrade?.status === 'WON';
  const isTie = summary ? summary.status === 'TIE' : lastClosedTrade?.status === 'TIE';
  const direction = summary ? summary.direction : lastClosedTrade?.direction || 'UP';
  const isRed = direction === 'DOWN' || (!isWon && !isTie);

  const totalReturn = summary
    ? summary.totalReturn
    : isWon
    ? Number(((lastClosedTrade?.amount || 0) + (lastClosedTrade?.actualProfit || 0)).toFixed(2))
    : lastClosedTrade?.amount || 0;

  const totalInvested = summary ? summary.totalAmount : lastClosedTrade?.amount || 0;
  const netProfit = summary ? summary.netProfit : lastClosedTrade?.actualProfit || 0;

  return (
    <div className="absolute top-12 left-3 z-30 animate-scaleUp select-none pointer-events-auto">
      <div className="relative">
        <div
          className={`px-3 py-2 rounded-xl shadow-2xl backdrop-blur-md text-white min-w-[130px] border ${
            isWon
              ? isRed
                ? 'bg-gradient-to-r from-[#2b0e17]/90 to-[#3f1322]/90 border-rose-400/50 shadow-[0_8px_24px_rgba(255,51,85,0.35)]'
                : 'bg-gradient-to-r from-[#0a281a]/90 to-[#0e3d26]/90 border-emerald-400/50 text-emerald-200 shadow-[0_8px_24px_rgba(0,229,153,0.35)]'
              : isTie
              ? 'bg-[#2b1f0c]/90 border-amber-400/50 text-amber-200'
              : 'bg-gradient-to-r from-[#200b12]/90 to-[#2c0f19]/90 border-rose-500/50 text-rose-300 shadow-[0_8px_24px_rgba(255,51,85,0.35)]'
          }`}
        >
          <div className="flex items-center justify-between text-[9px] font-black tracking-wider uppercase mb-0.5 gap-1.5">
            <span className="flex items-center gap-1 truncate">
              <Trophy className="w-2.5 h-2.5 shrink-0" />
              <span>RESULT (P/F)</span>
              {isMultiple && (
                <span className="bg-white/20 text-[8px] px-1 py-0.2 rounded font-mono font-black text-cyan-300">
                  {tradeCount}x
                </span>
              )}
            </span>
            <button
              onClick={clearLastClosedTrade}
              className="p-0.5 rounded hover:bg-black/20 transition-colors ml-1 cursor-pointer shrink-0"
              title="Dismiss"
            >
              <X className="w-2.5 h-2.5 stroke-[2.5]" />
            </button>
          </div>

          <div className="font-mono-num text-xs sm:text-sm font-black tracking-tight text-white mt-0.5">
            {isWon
              ? `+$${totalReturn.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              : isTie
              ? `$0.00`
              : `-$${totalInvested.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          </div>

          {isMultiple && (
            <div className="text-[8.5px] font-mono-num text-slate-300 flex items-center justify-between mt-0.5 pt-0.5 border-t border-white/10 opacity-90 truncate">
              <span>Inv: ${totalInvested.toFixed(0)}</span>
              <span className={netProfit >= 0 ? 'text-emerald-300 font-bold' : 'text-rose-300 font-bold'}>
                Net: {netProfit >= 0 ? '+' : ''}${netProfit.toFixed(2)}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
