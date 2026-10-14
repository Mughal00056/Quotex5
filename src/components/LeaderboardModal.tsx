import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ChevronLeft, Edit3, Check, RefreshCw } from 'lucide-react';
import { useTrading } from '../context/TradingContext';

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface LeaderboardEntry {
  name: string;
  flag: string;
  profit: number;
  capAt30k?: boolean;
  avatarType: 'blue' | 'dark' | 'photo1' | 'photo2';
  isCurrentUser?: boolean;
}

// Large pool of 48 distinct international traders so every time Leaderboard opens, traders change!
const TRADER_POOL: Omit<LeaderboardEntry, 'profit' | 'capAt30k'>[] = [
  { name: 'Zain Fx', flag: '🇵🇰', avatarType: 'blue' },
  { name: '#Aryan Vip', flag: '🇮🇳', avatarType: 'blue' },
  { name: '@QUOTEX_KING...', flag: '🇮🇳', avatarType: 'dark' },
  { name: 'HAMZA PRO', flag: '🇵🇰', avatarType: 'blue' },
  { name: '#VTO SNIPER', flag: '🇮🇳', avatarType: 'blue' },
  { name: 'Salman Trad...', flag: '🇵🇰', avatarType: 'blue' },
  { name: '$100k Club', flag: '🇮🇳', avatarType: 'blue' },
  { name: 'Vikram_FX', flag: '🇮🇳', avatarType: 'photo1' },
  { name: 'اسد التداول...', flag: '🇪🇬', avatarType: 'photo2' },
  { name: 'Lucas_OTC', flag: '🇧🇷', avatarType: 'blue' },
  { name: 'Bilal_Trader', flag: '🇵🇰', avatarType: 'blue' },
  { name: 'Sultan_DXB', flag: '🇦🇪', avatarType: 'dark' },
  { name: 'Karan_Scalp', flag: '🇮🇳', avatarType: 'blue' },
  { name: 'Faisal_VIP', flag: '🇸🇦', avatarType: 'blue' },
  { name: 'Rizwan_PK', flag: '🇵🇰', avatarType: 'blue' },
  { name: 'Usman_Gold', flag: '🇵🇰', avatarType: 'photo1' },
  { name: 'Rohit_Binary', flag: '🇮🇳', avatarType: 'blue' },
  { name: 'Tariq_AlMaktoum', flag: '🇦🇪', avatarType: 'photo2' },
  { name: 'Daniyal_FX', flag: '🇵🇰', avatarType: 'blue' },
  { name: 'Thiago_SilvaFX', flag: '🇧🇷', avatarType: 'dark' },
  { name: 'Mehmet_TR', flag: '🇹🇷', avatarType: 'blue' },
  { name: 'Aditya_Pro99', flag: '🇮🇳', avatarType: 'photo1' },
  { name: 'Zeeshan_OTC', flag: '🇵🇰', avatarType: 'blue' },
  { name: 'Omar_CairoFX', flag: '🇪🇬', avatarType: 'blue' },
  { name: 'Rehan_Sniper', flag: '🇵🇰', avatarType: 'dark' },
  { name: 'Budi_Jakarta', flag: '🇮🇩', avatarType: 'blue' },
  { name: 'Kabir_Bull', flag: '🇮🇳', avatarType: 'photo2' },
  { name: 'Shahzaib_VIP', flag: '🇵🇰', avatarType: 'blue' },
  { name: 'Mateo_Latam', flag: '🇦🇷', avatarType: 'blue' },
  { name: 'Yusuf_Istanbul', flag: '🇹🇷', avatarType: 'photo1' },
  { name: 'Nabeel_FX', flag: '🇵🇰', avatarType: 'blue' },
  { name: 'Harsh_Option', flag: '🇮🇳', avatarType: 'dark' },
  { name: 'Khalid_Riyadh', flag: '🇸🇦', avatarType: 'blue' },
  { name: 'Kamran_Lahore', flag: '🇵🇰', avatarType: 'photo2' },
  { name: 'Gabriel_BR', flag: '🇧🇷', avatarType: 'blue' },
  { name: 'Ankit_Million', flag: '🇮🇳', avatarType: 'blue' },
  { name: 'Waqas_King', flag: '🇵🇰', avatarType: 'dark' },
  { name: 'Farhan_Doha', flag: '🇶🇦', avatarType: 'blue' },
  { name: 'Rizky_IndoFX', flag: '🇮🇩', avatarType: 'photo1' },
  { name: 'Sajjad_Pro', flag: '🇵🇰', avatarType: 'blue' },
  { name: 'Pranav_Trades', flag: '🇮🇳', avatarType: 'blue' },
  { name: 'Hassan_Mughal', flag: '🇵🇰', avatarType: 'photo2' }
];

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({ isOpen, onClose }) => {
  const {
    tradeHistory,
    traderName,
    setTraderName,
    traderFlag,
    setTraderFlag,
    customLeaderboardProfit,
    setCustomLeaderboardProfit,
    customLeaderboardRank,
    setCustomLeaderboardRank,
    logoImageUrl,
    realBalance,
    demoBalance,
    accountType
  } = useTrading();

  const [showEditPanel, setShowEditPanel] = useState(false);
  const [showRatingInfo, setShowRatingInfo] = useState(false);
  const [rotationSeed, setRotationSeed] = useState<number>(() => Date.now());

  // Check if user has zero balance ("and jab hum apne balance na hu tu leaderboard ma top par na raha fix karo")
  const activeBalance = accountType === 'REAL' ? realBalance : demoBalance;
  const hasNoBalance = activeBalance <= 0;

  // Every time the Leaderboard opens or tradeHistory changes, rotate traders ("leaderboard ma har bar banda change ho")
  useEffect(() => {
    if (isOpen) {
      setRotationSeed(Date.now() + Math.floor(Math.random() * 100000));
    }
  }, [isOpen, tradeHistory.length]);

  const handleManualRefreshTraders = useCallback(() => {
    setRotationSeed(Date.now() + Math.floor(Math.random() * 100000));
  }, []);

  // Generate a fresh shuffled set of 15 traders whenever rotationSeed updates
  const dynamicTraders = useMemo<LeaderboardEntry[]>(() => {
    const copy = [...TRADER_POOL];
    let s = rotationSeed;
    const nextRand = () => {
      s = (s * 1664525 + 1013904223) % 4294967296;
      return s / 4294967296;
    };

    // Fisher-Yates shuffle with rotationSeed
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(nextRand() * (i + 1));
      const temp = copy[i];
      copy[i] = copy[j];
      copy[j] = temp;
    }

    const selected = copy.slice(0, 15);
    const profitTiers = [
      34800 + nextRand() * 4500,
      30500 + nextRand() * 3200,
      21100 + nextRand() * 6800,
      16400 + nextRand() * 3900,
      13800 + nextRand() * 2200,
      12500 + nextRand() * 1200,
      11600 + nextRand() * 850,
      10700 + nextRand() * 800,
      9850 + nextRand() * 750,
      9100 + nextRand() * 650,
      8350 + nextRand() * 650,
      7650 + nextRand() * 600,
      6950 + nextRand() * 550,
      6350 + nextRand() * 500,
      5750 + nextRand() * 480
    ];

    return selected.map((t, idx) => {
      const rawProfit = Number(profitTiers[idx].toFixed(2));
      return {
        ...t,
        profit: rawProfit,
        capAt30k: rawProfit >= 30000
      };
    });
  }, [rotationSeed]);

  if (!isOpen) return null;

  // Calculate user's live profit from tradeHistory so every trade win immediately updates profit & position
  const calculatedNetProfit = tradeHistory.reduce((sum, t) => sum + (t.actualProfit || 0), 0);
  const userProfit = hasNoBalance
    ? -5.21
    : customLeaderboardProfit !== null
    ? customLeaderboardProfit
    : tradeHistory.length > 0
    ? Number(calculatedNetProfit.toFixed(2))
    : -5.21;

  // Combine user into the leaderboard ONLY if user actually has balance and qualifies!
  // ("and jab hum apne balance na hu tu leaderboard ma top par na raha fix karo")
  const allEntries: LeaderboardEntry[] = [...dynamicTraders];
  if (!hasNoBalance && userProfit >= dynamicTraders[dynamicTraders.length - 1].profit) {
    allEntries.push({
      name: traderName || 'YA TRADER',
      flag: traderFlag || '🇵🇰',
      profit: userProfit,
      capAt30k: userProfit >= 30000,
      avatarType: 'blue',
      isCurrentUser: true
    });
    allEntries.sort((a, b) => b.profit - a.profit);
  }

  const rankedList = allEntries.slice(0, 15);
  const userIndexInTop = allEntries.findIndex((e) => e.isCurrentUser);

  // Dynamically calculate user's position
  // If user has NO balance, position is strictly #37,019 or unranked, never in top ranks!
  const computeDynamicRank = (profit: number) => {
    if (hasNoBalance) {
      return 37019;
    }
    if (userIndexInTop !== -1) {
      return userIndexInTop + 1;
    }
    if (profit <= -5.21) {
      return 37019 + Math.floor(Math.abs(profit + 5.21) * 1.5);
    }
    if (profit <= 0) {
      return 37019;
    }
    const minTopProfit = dynamicTraders[dynamicTraders.length - 1]?.profit || 5800;
    const ratio = Math.min(1, profit / minTopProfit);
    return Math.max(16, Math.round(37019 * Math.pow(1 - ratio, 2.6)));
  };

  const displayedPosition = hasNoBalance
    ? 37019
    : customLeaderboardRank !== null
    ? customLeaderboardRank
    : computeDynamicRank(userProfit);

  // Progress bar percentage for user's top card (matching screenshot green bar)
  const progressPercent = hasNoBalance
    ? 0
    : userIndexInTop === 0
    ? 100
    : userProfit > 0
    ? Math.min(95, Math.max(38, Math.floor((userProfit / 30000) * 100) + 35))
    : 36;

  // Format user profit on top right of card (e.g. "-5.21$" or "$1,250.00")
  const formatUserCardProfit = (val: number) => {
    if (val < 0) {
      return `-${Math.abs(val).toFixed(2)}$`;
    }
    return `$${val.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  // Format leaderboard row profit (e.g. "$30,000.00+" or "$21,277.96")
  const formatRowProfit = (entry: LeaderboardEntry) => {
    if (entry.capAt30k || entry.profit >= 30000) {
      return '$30,000.00+';
    }
    return `$${entry.profit.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-center bg-[#07090e] select-none animate-fadeIn">
      {/* Mobile / Container Frame matching App */}
      <div className="relative w-full h-full max-w-full sm:max-w-md md:max-w-xl lg:max-w-2xl bg-[#121622] flex flex-col justify-between overflow-hidden">
        {/* 1. Top Header: < Leader Board / of the Day with Quotex Logo */}
        <div className="px-4 pt-3.5 pb-2.5 flex items-center justify-between bg-[#121622] border-b border-[#1b2234]">
          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
              className="p-1 -ml-1 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Back to Chart"
            >
              <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
            </button>
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#0e1726] to-[#182337] border border-cyan-500/40 p-1 flex items-center justify-center shrink-0 shadow-md">
              <img
                src={logoImageUrl || '/splash-image.png'}
                alt="Quotex Logo"
                className="w-full h-full object-contain rounded-lg"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-extrabold text-white tracking-tight leading-tight flex items-center gap-1.5">
                <span>Leader Board</span>
                <span className="text-[9px] bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 px-1.5 py-0.5 rounded font-black tracking-wider uppercase">
                  DAILY
                </span>
              </h1>
              <p className="text-[11px] text-slate-400 font-medium">of the Day</p>
            </div>
          </div>

          {/* Right Action Buttons: Rotate Traders + Customize User Card */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleManualRefreshTraders}
              className="p-1.5 rounded-lg bg-[#1a2030] hover:bg-[#232b40] text-slate-400 hover:text-cyan-400 transition-colors cursor-pointer"
              title="Refresh Traders List"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowEditPanel(!showEditPanel)}
              className="p-1.5 rounded-lg bg-[#1a2030] hover:bg-[#232b40] text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Customize Trader Name & Position"
            >
              {showEditPanel ? <Check className="w-4 h-4 text-emerald-400" /> : <Edit3 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Optional Quick Customizer Drawer */}
        {showEditPanel && (
          <div className="mx-3.5 mb-2 p-3 rounded-xl bg-[#182032] border border-cyan-500/40 space-y-2.5 text-xs">
            <div className="font-bold text-cyan-300 text-[11px] uppercase tracking-wider">
              Customize Your Leaderboard Card
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2">
                <label className="text-[10px] text-slate-400 block mb-0.5">Trader Name</label>
                <input
                  type="text"
                  value={traderName}
                  onChange={(e) => setTraderName(e.target.value)}
                  className="w-full bg-[#0e131f] border border-[#2a3650] rounded px-2 py-1 text-white font-bold text-xs outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5">Flag</label>
                <input
                  type="text"
                  value={traderFlag}
                  onChange={(e) => setTraderFlag(e.target.value)}
                  className="w-full bg-[#0e131f] border border-[#2a3650] rounded px-2 py-1 text-white text-center text-xs outline-none"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5">Your Profit ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={customLeaderboardProfit !== null ? customLeaderboardProfit : userProfit}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setCustomLeaderboardProfit(isNaN(val) ? null : val);
                  }}
                  className="w-full bg-[#0e131f] border border-[#2a3650] rounded px-2 py-1 text-white font-mono-num text-xs outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5">Your Position</label>
                <input
                  type="number"
                  value={customLeaderboardRank !== null ? customLeaderboardRank : displayedPosition}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    setCustomLeaderboardRank(isNaN(val) ? null : val);
                  }}
                  className="w-full bg-[#0e131f] border border-[#2a3650] rounded px-2 py-1 text-white font-mono-num text-xs outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* Main Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-3.5 pb-4">
          {/* 2. User Position Card with Glass UI */}
          <div className="bg-gradient-to-b from-[#192233]/90 to-[#121927]/90 backdrop-blur-md border border-white/10 rounded-xl px-4 py-3.5 shadow-xl">
            {/* Top Row: Flag + Name on left, Profit/Loss on right */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex items-center -space-x-1 shrink-0">
                  <div className="w-6 h-6 rounded-full bg-[#252d3f] border border-white/20 flex items-center justify-center text-xs shadow-inner overflow-hidden z-10">
                    <span>{traderFlag || '🇵🇰'}</span>
                  </div>
                  <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-cyan-400 to-emerald-400 border border-white/20 flex items-center justify-center text-slate-950 font-black text-[9px] shadow-sm">
                    {(traderName || 'YA').slice(0, 2).toUpperCase()}
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="font-extrabold text-white text-sm tracking-wide">
                    {traderName || 'YA TRADER'}
                  </span>
                  {hasNoBalance && (
                    <span className="text-[9.5px] font-bold text-amber-400">
                      Balance: $0.00 (Unranked)
                    </span>
                  )}
                </div>
              </div>

              <span
                className={`font-mono-num font-extrabold text-sm ${
                  hasNoBalance ? 'text-slate-400' : userProfit < 0 ? 'text-[#ff4766]' : 'text-[#00e599]'
                }`}
              >
                {hasNoBalance ? '$0.00' : formatUserCardProfit(userProfit)}
              </span>
            </div>

            {/* Middle Progress Bar: Green bar on left, dark track on right */}
            <div className="w-full h-1 bg-[#232d40] my-2.5 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  hasNoBalance ? 'bg-slate-600' : 'bg-gradient-to-r from-emerald-500 to-[#00e599]'
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {/* Bottom Row: Your position */}
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400 font-medium">Your position:</span>
                <span className="text-white font-extrabold font-mono-num">
                  {hasNoBalance ? '37019' : displayedPosition}
                </span>
              </div>
              {hasNoBalance && (
                <span className="text-[10px] text-amber-300 bg-amber-500/20 border border-amber-500/30 px-2 py-0.5 rounded font-bold">
                  Zero Balance
                </span>
              )}
            </div>

            {hasNoBalance && (
              <div className="mt-2.5 text-[10.5px] text-amber-200/90 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1.5 rounded-lg flex items-center justify-between">
                <span>Deposit funds to rank on the live Top 15 Leaderboard</span>
              </div>
            )}
          </div>

          {/* 3. "How does this rating work?" Blue Box */}
          <button
            onClick={() => setShowRatingInfo(!showRatingInfo)}
            className="w-full mt-2.5 bg-[#122238] hover:bg-[#162944] rounded-lg py-2.5 px-4 flex items-center justify-center gap-2.5 transition-colors cursor-pointer"
          >
            {/* 3 Gold Podium Bars Icon */}
            <div className="flex items-end gap-[2px] h-4">
              <div className="w-1.5 h-2.5 bg-amber-400 rounded-t-[1px] flex items-center justify-center text-[6px] font-black text-slate-950">
                2
              </div>
              <div className="w-1.5 h-4 bg-yellow-300 rounded-t-[1px] flex items-center justify-center text-[6px] font-black text-slate-950">
                1
              </div>
              <div className="w-1.5 h-2 bg-amber-500 rounded-t-[1px] flex items-center justify-center text-[6px] font-black text-slate-950">
                3
              </div>
            </div>
            <span className="text-[#2b99ff] text-xs font-bold">
              How does this rating work?
            </span>
          </button>

          {showRatingInfo && (
            <div className="mt-2 p-3 rounded-lg bg-[#161c2a] border border-[#232d42] text-[11px] text-slate-300 leading-relaxed">
              The Leader Board ranks active Live Account traders by total net profit earned during the current trading day (UTC).
            </div>
          )}

          {/* 4. Ranked Traders List (1 to 15) — Dynamic rotation on every open */}
          <div className="mt-3 divide-y divide-[#1a2030]">
            {rankedList.map((trader, index) => {
              const rank = index + 1;
              return (
                <div
                  key={`${trader.name}-${rank}`}
                  className={`py-3 px-1 flex items-center justify-between ${
                    trader.isCurrentUser ? 'bg-[#1a2438]/60 rounded-lg px-2' : ''
                  }`}
                >
                  {/* Left: Rank Badge + Overlapping Flag & User Avatar + Trader Name */}
                  <div className="flex items-center min-w-0">
                    {/* Rank Indicator */}
                    <div className="w-6 flex items-center justify-center shrink-0">
                      {rank === 1 ? (
                        <div className="w-5 h-5 rounded-full bg-gradient-to-b from-[#fde047] to-[#ca8a04] text-slate-950 font-extrabold text-[11px] flex items-center justify-center shadow-sm">
                          1
                        </div>
                      ) : rank === 2 ? (
                        <div className="w-5 h-5 rounded-full bg-gradient-to-b from-[#f1f5f9] to-[#94a3b8] text-slate-950 font-extrabold text-[11px] flex items-center justify-center shadow-sm">
                          2
                        </div>
                      ) : rank === 3 ? (
                        <div className="w-5 h-5 rounded-full bg-gradient-to-b from-[#fb923c] to-[#b45309] text-slate-950 font-extrabold text-[11px] flex items-center justify-center shadow-sm">
                          3
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs font-semibold font-mono-num">
                          {rank}
                        </span>
                      )}
                    </div>

                    {/* Overlapping Flag Circle + Avatar Circle */}
                    <div className="flex items-center -space-x-1.5 ml-2.5 mr-3 shrink-0">
                      {/* Country Flag Circle */}
                      <div className="w-5 h-5 rounded-full bg-[#1e2638] border border-[#121622] flex items-center justify-center text-[11px] z-10 shadow-xs">
                        {trader.flag}
                      </div>

                      {/* Avatar Circle */}
                      {(() => {
                        const initial = trader.name.replace(/[^A-Za-z0-9]/g, '')[0]?.toUpperCase() || 'T';
                        if (rank === 1) {
                          return (
                            <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-yellow-400 via-amber-400 to-yellow-500 border border-yellow-300 flex items-center justify-center text-[9px] font-black text-slate-950 shadow-sm">
                              👑
                            </div>
                          );
                        }
                        if (rank === 2) {
                          return (
                            <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-slate-200 to-slate-400 border border-slate-200 flex items-center justify-center text-[8px] font-black text-slate-950 shadow-sm">
                              🥈
                            </div>
                          );
                        }
                        if (rank === 3) {
                          return (
                            <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-amber-600 to-amber-700 border border-amber-400 flex items-center justify-center text-[8px] font-black text-white shadow-sm">
                              🥉
                            </div>
                          );
                        }
                        if (trader.avatarType === 'photo1') {
                          return (
                            <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 border border-[#121622] flex items-center justify-center text-[9px] font-black text-slate-950 shadow-sm">
                              {initial}
                            </div>
                          );
                        }
                        if (trader.avatarType === 'photo2') {
                          return (
                            <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-400 border border-[#121622] flex items-center justify-center text-[9px] font-black text-white shadow-sm">
                              {initial}
                            </div>
                          );
                        }
                        if (trader.avatarType === 'dark') {
                          return (
                            <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-cyan-600 to-blue-500 border border-[#121622] flex items-center justify-center text-[9px] font-black text-white shadow-sm">
                              {initial}
                            </div>
                          );
                        }
                        return (
                          <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-blue-600 to-sky-400 border border-[#121622] flex items-center justify-center text-[9px] font-black text-white shadow-sm">
                            {initial}
                          </div>
                        );
                      })()}
                    </div>

                    {/* Trader Name */}
                    <span className="text-white text-xs sm:text-[13px] font-medium truncate">
                      {trader.name}
                    </span>
                  </div>

                  {/* Right: Green Profit Amount */}
                  <div className="text-[#00c874] font-mono-num text-xs sm:text-[13px] font-bold shrink-0 ml-2">
                    {formatRowProfit(trader)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
