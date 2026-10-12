import React, { useState, useEffect } from 'react';
import { useTrading } from '../context/TradingContext';
import {
  Minus,
  Plus,
  ArrowUp,
  ArrowDown,
  ChevronDown,
  AlertCircle,
  Percent,
  DollarSign,
  Clock,
  Sparkles
} from 'lucide-react';

interface QuotexConsoleProps {
  onOpenAssetModal: () => void;
}

export const QuotexConsole: React.FC<QuotexConsoleProps> = ({ onOpenAssetModal }) => {
  const {
    activeAsset,
    accountType,
    setAccountType,
    demoBalance,
    realBalance,
    setRealBalanceDirect,
    placeTrade
  } = useTrading();

  // Investment state directly editable by user
  const [investmentAmount, setInvestmentAmount] = useState<number>(100);
  const [investmentInputStr, setInvestmentInputStr] = useState<string>('100');
  const [isPercentMode, setIsPercentMode] = useState<boolean>(false);
  const [percentValue, setPercentValue] = useState<number>(5); // 5% default when switched to %
  const [showPercentPicker, setShowPercentPicker] = useState<boolean>(false);

  // Expiration state: TIME vs TIMER as requested ("Is tera ka do ho time and timer ok fix karo")
  const [expirationMode, setExpirationMode] = useState<'time' | 'timer'>('timer');
  const [durationSeconds, setDurationSeconds] = useState<number>(30); // 30s default in Timer mode
  const [timeOffsetMinutes, setTimeOffsetMinutes] = useState<number>(1); // 1 min next close in Time mode
  const [showExpirationPicker, setShowExpirationPicker] = useState<boolean>(false);
  const [nowTimestamp, setNowTimestamp] = useState<number>(Date.now());

  const [pendingTrade, setPendingTrade] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const currentBalance = accountType === 'DEMO' ? demoBalance : realBalance;
  const payoutRate = activeAsset.payout;

  // Real-time clock tick updater (every second)
  useEffect(() => {
    const interval = setInterval(() => {
      setNowTimestamp(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Compute target close time for 'TIME' mode (aligned to upcoming minute: HH:MM:00)
  const getTargetTimeForOffset = (offsetMinutes: number) => {
    const nextMinute = Math.ceil(nowTimestamp / 60000) * 60000;
    return nextMinute + (offsetMinutes - 1) * 60000;
  };

  const currentTargetTimestamp = getTargetTimeForOffset(timeOffsetMinutes);
  const targetDate = new Date(currentTargetTimestamp);
  const targetTimeString = `${targetDate.getHours().toString().padStart(2, '0')}:${targetDate
    .getMinutes()
    .toString()
    .padStart(2, '0')}:00`;
  const timeRemainingSeconds = Math.max(5, Math.ceil((currentTargetTimestamp - nowTimestamp) / 1000));

  // Calculate current trade dollar amount
  const effectiveInvestment = isPercentMode
    ? Math.max(1, Number(((currentBalance * percentValue) / 100).toFixed(2)))
    : investmentAmount;

  // Percentage of balance that this trade represents
  const effectivePercentage = currentBalance > 0
    ? Number(((effectiveInvestment / currentBalance) * 100).toFixed(1))
    : 0;

  const totalPayout = Number(
    (effectiveInvestment + (effectiveInvestment * payoutRate) / 100).toFixed(2)
  );

  // Auto-adjust investment if balance drops below
  useEffect(() => {
    if (!isPercentMode && currentBalance >= 1 && investmentAmount > currentBalance) {
      const clamped = Math.max(1, Math.floor(currentBalance));
      setInvestmentAmount(clamped);
      setInvestmentInputStr(clamped.toString());
    }
  }, [accountType, currentBalance, isPercentMode, investmentAmount]);

  const formatTimerDisplay = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `00:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const timerOptions = [
    { label: '00:00:05', seconds: 5, tag: '5s' },
    { label: '00:00:15', seconds: 15, tag: '15s' },
    { label: '00:00:30', seconds: 30, tag: '30s' },
    { label: '00:01:00', seconds: 60, tag: '1m' },
    { label: '00:02:00', seconds: 120, tag: '2m' },
    { label: '00:05:00', seconds: 300, tag: '5m' }
  ];

  const timeOptions = [
    { offset: 1, label: '+1m' },
    { offset: 2, label: '+2m' },
    { offset: 3, label: '+3m' },
    { offset: 4, label: '+4m' },
    { offset: 5, label: '+5m' },
    { offset: 10, label: '+10m' },
    { offset: 15, label: '+15m' },
    { offset: 30, label: '+30m' }
  ];

  const percentPresets = [1, 2, 5, 10, 15, 20, 25, 50, 100];

  const stepExpiration = (dir: -1 | 1) => {
    if (expirationMode === 'time') {
      const offsets = [1, 2, 3, 4, 5, 10, 15, 30];
      const curIdx = offsets.indexOf(timeOffsetMinutes);
      if (curIdx !== -1) {
        const nextIdx = Math.max(0, Math.min(offsets.length - 1, curIdx + dir));
        setTimeOffsetMinutes(offsets[nextIdx]);
      } else {
        setTimeOffsetMinutes((m) => Math.max(1, Math.min(60, m + dir)));
      }
    } else {
      const steps = [5, 10, 15, 30, 60, 120, 180, 300];
      const idx = steps.indexOf(durationSeconds);
      if (idx !== -1) {
        const nextIdx = Math.max(0, Math.min(steps.length - 1, idx + dir));
        setDurationSeconds(steps[nextIdx]);
      } else {
        setDurationSeconds((s) => Math.max(5, Math.min(300, s + dir * 5)));
      }
    }
  };

  // Smart step for - / + buttons on investment
  const handleStepInvestment = (dir: -1 | 1) => {
    setErrorMessage(null);
    if (isPercentMode) {
      const curIdx = percentPresets.indexOf(percentValue);
      if (curIdx !== -1) {
        const nextIdx = Math.max(0, Math.min(percentPresets.length - 1, curIdx + dir));
        setPercentValue(percentPresets[nextIdx]);
      } else {
        setPercentValue((p) => Math.max(1, Math.min(100, p + dir * 5)));
      }
      return;
    }

    let step = 50;
    if (investmentAmount < 10) step = 1;
    else if (investmentAmount < 50) step = 5;
    else if (investmentAmount < 100) step = 10;
    else if (investmentAmount >= 500) step = 100;
    else if (investmentAmount >= 2000) step = 500;

    const maxAllowed = currentBalance >= 1 ? Math.max(1, Math.floor(currentBalance)) : 100000;
    const nextVal = Math.max(1, Math.min(maxAllowed, investmentAmount + dir * step));
    setInvestmentAmount(nextVal);
    setInvestmentInputStr(nextVal.toString());
  };

  const handleInvestmentInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage(null);
    const rawVal = e.target.value.replace(/[^0-9.]/g, '');
    if (isPercentMode) {
      const parsed = parseInt(rawVal, 10);
      if (!isNaN(parsed)) {
        setPercentValue(Math.max(1, Math.min(100, parsed)));
      }
      return;
    }
    setInvestmentInputStr(rawVal);
    const parsed = parseFloat(rawVal);
    if (!isNaN(parsed) && parsed > 0) {
      setInvestmentAmount(Math.min(100000, parsed));
    } else if (rawVal === '') {
      setInvestmentAmount(0);
    }
  };

  const handleInvestmentBlur = () => {
    if (isPercentMode) return;
    if (investmentAmount <= 0) {
      const fallback = currentBalance >= 10 ? 10 : Math.max(1, Math.floor(currentBalance || 10));
      setInvestmentAmount(fallback);
      setInvestmentInputStr(fallback.toString());
    } else {
      setInvestmentInputStr(investmentAmount.toString());
    }
  };

  const handleTrade = (direction: 'UP' | 'DOWN') => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(35);
      } catch {}
    }

    if (currentBalance < 1) {
      setErrorMessage('Balance is $0.00 — Tap to add funds or use Demo');
      setTimeout(() => setErrorMessage(null), 4000);
      return;
    }

    let tradeAmt = effectiveInvestment;
    if (tradeAmt <= 0) {
      tradeAmt = Math.min(10, currentBalance);
      setInvestmentAmount(tradeAmt);
      setInvestmentInputStr(tradeAmt.toString());
    }

    if (tradeAmt > currentBalance) {
      tradeAmt = Number(currentBalance.toFixed(2));
      if (!isPercentMode) {
        setInvestmentAmount(tradeAmt);
        setInvestmentInputStr(tradeAmt.toString());
      }
    }

    setErrorMessage(null);

    // Calculate effective duration: in TIME mode, exact difference to target timestamp; in TIMER mode, fixed seconds
    const tradeDuration =
      expirationMode === 'time'
        ? Math.max(5, Math.ceil((currentTargetTimestamp - Date.now()) / 1000))
        : durationSeconds;

    placeTrade(direction, tradeAmt, tradeDuration);
  };

  const toggleInvestmentSwitch = () => {
    setIsPercentMode((prev) => !prev);
    setShowPercentPicker((prev) => !prev);
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(15);
      } catch {}
    }
  };

  // Dynamic flags matching the selected asset symbol
  const getAssetFlags = (symbol: string) => {
    const upper = symbol.toUpperCase();
    const flagMap: Record<string, string> = {
      EUR: '🇪🇺',
      USD: '🇺🇸',
      GBP: '🇬🇧',
      JPY: '🇯🇵',
      CHF: '🇨🇭',
      AUD: '🇦🇺',
      CAD: '🇨🇦',
      NZD: '🇳🇿',
      PKR: '🇵🇰',
      INR: '🇮🇳',
      BRL: '🇧🇷',
      TRY: '🇹🇷',
      BTC: '₿',
      ETH: 'Ξ',
      XAU: '🪙'
    };
    const parts = upper.replace(/[^A-Z]/g, ' ').split(/\s+/).filter(Boolean);
    const f1 = flagMap[parts[0]] || '🇪🇺';
    const f2 = flagMap[parts[1]] || '🇨🇭';
    return [f1, f2];
  };

  const [flag1, flag2] = getAssetFlags(activeAsset.symbol);

  return (
    <div className="bg-[#0b0e14] border-t border-[#1a2230] px-3 pt-2 pb-2 select-none relative z-20">
      {/* Alert toast if balance is $0.00 */}
      {errorMessage && (
        <div className="absolute -top-11 left-2 right-2 z-30 bg-[#181f2e] border border-rose-500/70 text-white text-xs px-3 py-1.5 rounded-xl flex items-center justify-between shadow-2xl animate-fadeIn">
          <div className="flex items-center gap-1.5 truncate">
            <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            <span className="truncate text-[11px]">{errorMessage}</span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0 ml-2">
            {accountType === 'REAL' && (
              <button
                onClick={() => {
                  setRealBalanceDirect(1000);
                  setErrorMessage(null);
                }}
                className="px-2 py-0.5 rounded bg-emerald-500 text-slate-950 font-black text-[10px] cursor-pointer"
              >
                +$1,000
              </button>
            )}
            <button
              onClick={() => {
                setAccountType('DEMO');
                setErrorMessage(null);
              }}
              className="px-2 py-0.5 rounded bg-cyan-500 text-slate-950 font-black text-[10px] cursor-pointer"
            >
              Use Demo
            </button>
          </div>
        </div>
      )}

      {/* Row 1: Asset Selector & Pending Trade Toggle */}
      <div className="flex items-center justify-between mb-2">
        <button
          onClick={onOpenAssetModal}
          className="flex items-center gap-2 hover:opacity-90 transition-opacity cursor-pointer"
        >
          {/* Dynamic Circular Flag Badges */}
          <div className="flex items-center -space-x-1.5">
            <span className="w-5 h-5 rounded-full bg-[#192336] flex items-center justify-center text-[11px] font-bold border border-[#1b2230] shadow-xs">
              {flag1}
            </span>
            <span className="w-5 h-5 rounded-full bg-[#192336] flex items-center justify-center text-[11px] font-bold border border-[#1b2230] shadow-xs">
              {flag2}
            </span>
          </div>

          <span className="font-extrabold text-sm text-white tracking-wide">
            {activeAsset.symbol}
          </span>

          <div className="flex items-center gap-0.5 text-amber-400 font-extrabold text-sm font-mono-num">
            <span>{payoutRate}%</span>
            <ChevronDown className="w-3.5 h-3.5 text-amber-400 stroke-[3]" />
          </div>
        </button>

        {/* Right: Pending Trade Toggle */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-[#0284c7] tracking-wider uppercase">
            PENDING TRADE
          </span>
          <button
            onClick={() => setPendingTrade(!pendingTrade)}
            className={`w-9 h-5 rounded-full transition-colors p-0.5 flex items-center cursor-pointer ${
              pendingTrade ? 'bg-[#0284c7] justify-end' : 'bg-[#1e2634] justify-start'
            }`}
          >
            <div className="w-4 h-4 rounded-full bg-white shadow-md transition-transform" />
          </button>
        </div>
      </div>

      {/* Row 2: Two Side-by-Side Control Boxes: TIME & TIMER + INVESTMENT */}
      <div className="grid grid-cols-2 gap-2.5 mb-2 relative">
        {/* Box 1: Quotex Time & Timer Expiration ("Is tera ka do ho time and timer ok fix karo") */}
        <div className="relative bg-[#0d1118] border border-[#273244] hover:border-[#384760] rounded-xl px-2 py-1.5 flex flex-col justify-between">
          {/* Top Row: TIME vs TIMER Tab Switcher */}
          <div className="flex items-center justify-between pb-1 border-b border-[#1f2838]">
            <div className="flex items-center gap-1 bg-[#0b0e15] p-0.5 rounded-lg border border-[#1f2838]">
              <button
                onClick={() => setExpirationMode('time')}
                className={`px-2 py-0.5 rounded text-[10px] font-black uppercase transition-all cursor-pointer ${
                  expirationMode === 'time'
                    ? 'bg-cyan-500 text-slate-950 shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Time
              </button>
              <button
                onClick={() => setExpirationMode('timer')}
                className={`px-2 py-0.5 rounded text-[10px] font-black uppercase transition-all cursor-pointer ${
                  expirationMode === 'timer'
                    ? 'bg-cyan-500 text-slate-950 shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Timer
              </button>
            </div>
            <span className="text-[9px] font-mono text-cyan-400 font-bold">
              {expirationMode === 'time' ? `${timeRemainingSeconds}s` : `${durationSeconds}s`}
            </span>
          </div>

          {/* Middle Row: Minus Stepper, Expiration Display, Plus Stepper */}
          <div className="flex items-center justify-between mt-1">
            <button
              onClick={() => stepExpiration(-1)}
              className="w-6 h-6 rounded-md bg-[#18202d] hover:bg-[#222c3d] text-slate-200 flex items-center justify-center transition-colors cursor-pointer shrink-0"
              title="Decrease Expiration"
            >
              <Minus className="w-3.5 h-3.5 stroke-[3]" />
            </button>

            <button
              onClick={() => setShowExpirationPicker(!showExpirationPicker)}
              className="font-mono-num text-sm sm:text-base font-bold text-white tracking-wider px-1 py-0.5 hover:text-cyan-300 transition-colors cursor-pointer text-center truncate"
              title="Select Expiration"
            >
              {expirationMode === 'time' ? targetTimeString : formatTimerDisplay(durationSeconds)}
            </button>

            <button
              onClick={() => stepExpiration(1)}
              className="w-6 h-6 rounded-md bg-[#18202d] hover:bg-[#222c3d] text-slate-200 flex items-center justify-center transition-colors cursor-pointer shrink-0"
              title="Increase Expiration"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
            </button>
          </div>

          {/* Bottom Caption: Mode Indicator */}
          <div className="flex items-center justify-between text-[10px] font-bold -mt-0.5 pt-0.5">
            <button
              onClick={() => setExpirationMode(expirationMode === 'time' ? 'timer' : 'time')}
              className="text-slate-500 hover:text-cyan-400 uppercase tracking-wider cursor-pointer"
            >
              {expirationMode === 'time' ? 'CLOCK CLOSE' : 'COUNTDOWN'}
            </button>
            <button
              onClick={() => setShowExpirationPicker(!showExpirationPicker)}
              className="text-[#0284c7] hover:underline uppercase tracking-wider cursor-pointer"
            >
              {expirationMode === 'time' ? `+${timeOffsetMinutes}m` : `${durationSeconds}s`}
            </button>
          </div>

          {/* Expiration Picker Dropdown Menu */}
          {showExpirationPicker && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setShowExpirationPicker(false)}
              />
              <div className="absolute bottom-full left-0 mb-1.5 w-full bg-[#141b26] border border-[#263246] rounded-xl shadow-2xl p-2.5 z-40 animate-fadeIn">
                <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-[#212c3f]">
                  <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                    <Clock className="w-3 h-3 text-cyan-400" />
                    <span>{expirationMode === 'time' ? 'Time Options' : 'Timer Options'}</span>
                  </span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setExpirationMode('time')}
                      className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                        expirationMode === 'time' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400'
                      }`}
                    >
                      Time
                    </button>
                    <button
                      onClick={() => setExpirationMode('timer')}
                      className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                        expirationMode === 'timer' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400'
                      }`}
                    >
                      Timer
                    </button>
                  </div>
                </div>

                {expirationMode === 'time' ? (
                  <div className="space-y-1">
                    <span className="text-[9px] uppercase font-bold text-slate-500 block mb-1">
                      Upcoming Expirations:
                    </span>
                    <div className="grid grid-cols-2 gap-1 max-h-40 overflow-y-auto">
                      {timeOptions.map((opt) => {
                        const targetT = getTargetTimeForOffset(opt.offset);
                        const d = new Date(targetT);
                        const timeStr = `${d.getHours().toString().padStart(2, '0')}:${d
                          .getMinutes()
                          .toString()
                          .padStart(2, '0')}`;
                        const rem = Math.max(5, Math.ceil((targetT - nowTimestamp) / 1000));
                        const isSel = timeOffsetMinutes === opt.offset;
                        return (
                          <button
                            key={opt.offset}
                            onClick={() => {
                              setTimeOffsetMinutes(opt.offset);
                              setShowExpirationPicker(false);
                            }}
                            className={`py-1.5 px-2 rounded-lg text-left transition-colors cursor-pointer flex items-center justify-between ${
                              isSel
                                ? 'bg-cyan-500 text-slate-950 font-black'
                                : 'bg-[#192230] text-slate-300 hover:bg-[#202b3d]'
                            }`}
                          >
                            <span className="text-xs font-mono font-bold">{timeStr}</span>
                            <span className="text-[10px] font-mono opacity-80">{rem}s</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div>
                    <span className="text-[9px] uppercase font-bold text-slate-500 block mb-1">
                      Duration Presets:
                    </span>
                    <div className="grid grid-cols-3 gap-1">
                      {timerOptions.map((opt) => (
                        <button
                          key={opt.seconds}
                          onClick={() => {
                            setDurationSeconds(opt.seconds);
                            setShowExpirationPicker(false);
                          }}
                          className={`py-1.5 px-1 rounded-lg text-xs font-mono font-bold transition-colors cursor-pointer text-center ${
                            durationSeconds === opt.seconds
                              ? 'bg-[#0284c7] text-white font-black'
                              : 'bg-[#192230] text-slate-300 hover:bg-[#202b3d]'
                          }`}
                        >
                          {opt.tag}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Box 2: Investment Directly Editable with Input Field, % Display, and % Picker */}
        <div className="bg-[#0d1118] border border-[#273244] hover:border-[#384760] rounded-xl px-2 py-1.5 relative flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 tracking-wider flex items-center gap-1">
              <DollarSign className="w-2.5 h-2.5 text-emerald-400" />
              <span>Investment</span>
            </span>

            {/* Live Percentage Badge */}
            <button
              onClick={() => setShowPercentPicker(!showPercentPicker)}
              className={`text-[10px] font-mono font-black px-1.5 py-0.2 rounded transition-all cursor-pointer flex items-center gap-0.5 ${
                isPercentMode
                  ? 'bg-amber-400 text-slate-950 shadow-xs'
                  : 'bg-[#182333] text-amber-300 border border-[#25364d]'
              }`}
              title="Click to select percentage of balance"
            >
              <span>{isPercentMode ? `${percentValue}%` : `${effectivePercentage}%`}</span>
              <ChevronDown className="w-2.5 h-2.5 stroke-[3]" />
            </button>
          </div>

          {/* Stepper & Text Input */}
          <div className="flex items-center justify-between mt-1">
            <button
              onClick={() => handleStepInvestment(-1)}
              className="w-6 h-6 rounded-md bg-[#18202d] hover:bg-[#222c3d] text-slate-200 flex items-center justify-center transition-colors cursor-pointer shrink-0"
              title="Decrease Investment"
            >
              <Minus className="w-3.5 h-3.5 stroke-[3]" />
            </button>

            <div className="flex items-center justify-center font-mono-num text-sm sm:text-base font-bold text-white px-1 py-0.5">
              <span className="text-slate-400 mr-0.5 text-xs font-normal">
                {isPercentMode ? '%' : '$'}
              </span>
              <input
                type="text"
                inputMode="decimal"
                value={isPercentMode ? percentValue : investmentInputStr}
                onChange={handleInvestmentInputChange}
                onBlur={handleInvestmentBlur}
                className="w-16 sm:w-20 text-center bg-transparent outline-none font-bold text-white text-sm sm:text-base focus:text-cyan-300 transition-colors"
                title="Enter custom amount or percentage"
              />
            </div>

            <button
              onClick={() => handleStepInvestment(1)}
              className="w-6 h-6 rounded-md bg-[#18202d] hover:bg-[#222c3d] text-slate-200 flex items-center justify-center transition-colors cursor-pointer shrink-0"
              title="Increase Investment"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
            </button>
          </div>

          {/* Switch Mode CTA */}
          <div className="flex items-center justify-between text-[10px] font-bold -mt-0.5 pt-0.5">
            <button
              onClick={toggleInvestmentSwitch}
              className="text-[#0284c7] hover:underline uppercase tracking-wider flex items-center gap-1 cursor-pointer"
              title="Switch between $ and %"
            >
              <Percent className="w-2.5 h-2.5 text-[#0284c7]" />
              <span>{isPercentMode ? 'SWITCH TO $' : 'SWITCH TO %'}</span>
            </button>

            <span className="text-slate-400 font-mono-num text-[10px]">
              {isPercentMode ? `$${effectiveInvestment.toFixed(2)}` : `${effectivePercentage}% bal`}
            </span>
          </div>

          {/* Percentage Presets Selector Dropdown */}
          {showPercentPicker && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setShowPercentPicker(false)}
              />
              <div className="absolute bottom-full right-0 mb-1.5 w-52 bg-[#141b26] border border-[#263246] rounded-xl shadow-2xl p-2.5 z-40 animate-fadeIn">
                <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-[#212c3f]">
                  <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                    <Percent className="w-3 h-3 text-amber-400" />
                    <span>Select Trade % of Balance</span>
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-1 mb-2">
                  {percentPresets.map((pct) => (
                    <button
                      key={pct}
                      onClick={() => {
                        setPercentValue(pct);
                        setIsPercentMode(true);
                        setShowPercentPicker(false);
                      }}
                      className={`py-1.5 px-1 rounded-lg text-xs font-mono font-bold transition-colors cursor-pointer text-center ${
                        isPercentMode && percentValue === pct
                          ? 'bg-amber-400 text-slate-950 font-black shadow-md'
                          : 'bg-[#192230] text-slate-300 hover:bg-[#202b3d]'
                      }`}
                    >
                      {pct}%
                    </button>
                  ))}
                </div>

                <div className="pt-1 border-t border-[#212c3f] flex items-center justify-between text-[10px]">
                  <button
                    onClick={() => {
                      setIsPercentMode(false);
                      setShowPercentPicker(false);
                    }}
                    className="text-cyan-400 hover:underline font-bold"
                  >
                    Reset to Dollar ($)
                  </button>
                  <span className="font-mono text-slate-400">
                    ≈ ${((currentBalance * percentValue) / 100).toFixed(2)}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Row 3: Payout and Buy / Sell Buttons */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* BUY / UP Button (Green) */}
        <button
          onClick={() => handleTrade('UP')}
          className="relative bg-gradient-to-r from-[#00b074] to-[#00c874] hover:from-[#00c874] hover:to-[#00e599] active:scale-[0.98] text-white rounded-xl p-2.5 sm:p-3 flex items-center justify-between shadow-lg shadow-emerald-950/40 transition-all cursor-pointer overflow-hidden group"
        >
          <div className="flex flex-col items-start leading-tight">
            <span className="font-black text-xs sm:text-sm tracking-wider uppercase drop-shadow-xs">
              BUY / CALL
            </span>
            <span className="text-[10px] text-emerald-100 font-bold opacity-90 mt-0.5">
              Payout: <strong className="font-mono-num text-white">${totalPayout.toFixed(2)}</strong>
            </span>
          </div>
          <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center shrink-0 group-hover:translate-y-[-2px] transition-transform">
            <ArrowUp className="w-5 h-5 text-white stroke-[3]" />
          </div>
        </button>

        {/* SELL / DOWN Button (Red) */}
        <button
          onClick={() => handleTrade('DOWN')}
          className="relative bg-gradient-to-r from-[#d92d43] to-[#ef4444] hover:from-[#ef4444] hover:to-[#f87171] active:scale-[0.98] text-white rounded-xl p-2.5 sm:p-3 flex items-center justify-between shadow-lg shadow-rose-950/40 transition-all cursor-pointer overflow-hidden group"
        >
          <div className="flex flex-col items-start leading-tight">
            <span className="font-black text-xs sm:text-sm tracking-wider uppercase drop-shadow-xs">
              SELL / PUT
            </span>
            <span className="text-[10px] text-rose-100 font-bold opacity-90 mt-0.5">
              Payout: <strong className="font-mono-num text-white">${totalPayout.toFixed(2)}</strong>
            </span>
          </div>
          <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center shrink-0 group-hover:translate-y-[2px] transition-transform">
            <ArrowDown className="w-5 h-5 text-white stroke-[3]" />
          </div>
        </button>
      </div>
    </div>
  );
};
