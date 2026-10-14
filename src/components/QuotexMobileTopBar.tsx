import React, { useState } from 'react';
import { useTrading } from '../context/TradingContext';
import {
  Bell,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  X,
  Menu,
  Crown,
  Eye,
  EyeOff,
  TrendingUp,
  TrendingDown,
  Shuffle,
  Trash2,
  PenTool,
  Square,
  Trophy,
  Send,
  Palette,
  Sliders,
  Settings,
  Briefcase,
  History,
  User,
  MessageSquare,
  Volume2,
  VolumeX,
  Image as ImageIcon,
  Clock,
  CreditCard,
  ArrowUpRight,
  ArrowDownLeft,
  Wallet,
  CandlestickChart,
  Layers,
  Activity,
  LineChart,
  Lock,
  Unlock,
  KeyRound,
  ShieldCheck,
  Globe,
  Radio,
  Gift,
  HelpCircle,
  CheckCircle2,
  Percent,
  Zap,
  Check,
  ExternalLink
} from 'lucide-react';
import { formatCurrency, formatPrice } from '../utils/chartMath';
import { CANDLE_COLOR_SCHEMES, CandleColorScheme, ChartType } from '../types/trading';

interface QuotexMobileTopBarProps {
  onOpenDeposit: () => void;
  onOpenWithdraw: () => void;
  onOpenHistory: (tab?: 'trades' | 'deposits' | 'withdrawals' | 'stats') => void;
  onOpenNotifications: () => void;
  onOpenLeaderboard?: () => void;
  onOpenIndicators?: () => void;
  onOpenChartSettings?: () => void;
  onOpenActiveTrades?: () => void;
  onOpenProfile?: () => void;
  onOpenSupport?: () => void;
}

type MenuPanelId =
  | 'forex'
  | 'signals'
  | 'tournaments'
  | 'market'
  | 'account'
  | 'trade_mode'
  | 'chart_icons'
  | 'drawing_pen'
  | 'indicators'
  | 'candle_style'
  | 'notifications_sound'
  | 'leaderboard'
  | 'watermark_bg'
  | 'cashier_history'
  | 'support';

export const QuotexMobileTopBar: React.FC<QuotexMobileTopBarProps> = ({
  onOpenDeposit,
  onOpenWithdraw,
  onOpenHistory,
  onOpenNotifications,
  onOpenLeaderboard,
  onOpenIndicators,
  onOpenChartSettings,
  onOpenActiveTrades,
  onOpenProfile,
  onOpenSupport
}) => {
  const {
    accountType,
    setAccountType,
    demoBalance,
    realBalance,
    resetDemoBalance,
    setRealBalanceDirect,
    removeRealMoney,
    isVipPurpleLive,
    marketBehaviorMode,
    setMarketBehaviorMode,
    showChartButtons,
    setShowChartButtons,
    showEyeButton,
    setShowEyeButton,
    showBagButton,
    setShowBagButton,
    showPenButton,
    setShowPenButton,
    showZoomControls,
    setShowZoomControls,
    watermarkEnabled,
    setWatermarkEnabled,
    indicatorsEnabled,
    setIndicatorsEnabled,
    showResultPopupEnabled,
    setShowResultPopupEnabled,
    showOrderToastEnabled,
    setShowOrderToastEnabled,
    soundEnabled,
    setSoundEnabled,
    activeDrawingTool,
    setActiveDrawingTool,
    clearDrawnLines,
    drawnLines,
    traderName,
    setTraderName,
    traderFlag,
    setTraderFlag,
    customLeaderboardProfit,
    setCustomLeaderboardProfit,
    customLeaderboardRank,
    setCustomLeaderboardRank,
    chartType,
    setChartType,
    candleColorScheme,
    setCandleColorScheme,
    indicators,
    setIndicators,
    activeIndicatorIds,
    clearAllActiveIndicators,
    logoImageUrl,
    setLogoImageUrl,
    backgroundImageUrl,
    setBackgroundImageUrl,
    watermarkSize,
    setWatermarkSize,
    watermarkOpacity,
    setWatermarkOpacity,
    watermarkType,
    setWatermarkType,
    deposits,
    withdrawals,
    tradeHistory,
    tradingPlatformMode,
    setTradingPlatformMode,
    forexPositions,
    forexHistory,
    openForexPosition,
    closeForexPosition,
    clearForexHistory,
    activeAsset,
    assets,
    setActiveAsset
  } = useTrading();

  const [showAccountDropdown, setShowAccountDropdown] = useState(false);
  const [showPromoBanner, setShowPromoBanner] = useState(false);
  const [showThreeLineMenu, setShowThreeLineMenu] = useState(false);

  // Menu PIN Lock with code 1234 — Unlocked by default so ALL Quotex features are immediately available!
  const [showMenuPinLock, setShowMenuPinLock] = useState(false);
  const [isMenuUnlocked, setIsMenuUnlocked] = useState(true);
  const [menuPinInput, setMenuPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [pinSuccess, setPinSuccess] = useState(false);

  // Forex Trading State in Menu ("aur ma forex trading option jis ma forex trading be kar saka ok")
  const [forexMargin, setForexMargin] = useState<number>(50);
  const [forexLeverage, setForexLeverage] = useState<number>(100);
  const [forexTpPercent, setForexTpPercent] = useState<number>(50);
  const [forexSlPercent, setForexSlPercent] = useState<number>(30);
  const [forexMessage, setForexMessage] = useState<string | null>(null);
  const [menuFilterCategory, setMenuFilterCategory] = useState<'ALL' | 'FOREX' | 'TRADING' | 'TOOLS' | 'CASHIER'>('ALL');
  const [copiedSignalId, setCopiedSignalId] = useState<string | null>(null);

  const handlePinDigit = (digit: string) => {
    if (menuPinInput.length >= 4) return;
    const next = menuPinInput + digit;
    setMenuPinInput(next);
    setPinError(false);

    if (next.length === 4) {
      if (next === '1234') {
        setPinSuccess(true);
        setTimeout(() => {
          setIsMenuUnlocked(true);
          setShowMenuPinLock(false);
          setMenuPinInput('');
          setPinSuccess(false);
          setOpenPanelId(null);
          setShowThreeLineMenu(true);
        }, 400);
      } else {
        setPinError(true);
        setTimeout(() => {
          setMenuPinInput('');
          setPinError(false);
        }, 900);
      }
    }
  };

  const handlePinBackspace = () => {
    setMenuPinInput((prev) => prev.slice(0, -1));
    setPinError(false);
  };

  const handlePinClear = () => {
    setMenuPinInput('');
    setPinError(false);
  };

  // Separate accordion panels — all closed ("band") by default as requested
  const [openPanelId, setOpenPanelId] = useState<MenuPanelId | null>(null);

  const [customBalanceInput, setCustomBalanceInput] = useState<string>('');
  const [profitInput, setProfitInput] = useState<string>(
    customLeaderboardProfit !== null ? customLeaderboardProfit.toString() : '-5.21'
  );
  const [rankInput, setRankInput] = useState<string>(
    customLeaderboardRank !== null ? customLeaderboardRank.toString() : '37019'
  );

  const flags = ['🇵🇰', '🇮🇳', '🇦🇪', '🇸🇦', '🇧🇷', '🇺🇸', '🇬🇧', '🇪🇬', '🇮🇩', '🇹🇷'];

  const togglePanel = (id: MenuPanelId) => {
    setOpenPanelId((prev) => (prev === id ? null : id));
  };

  const chartTypes: { type: ChartType; label: string; icon: React.ReactNode }[] = [
    { type: 'candlestick', label: 'Candles', icon: <CandlestickChart className="w-3.5 h-3.5" /> },
    { type: 'heikinAshi', label: 'Heikin Ashi', icon: <Layers className="w-3.5 h-3.5" /> },
    { type: 'area', label: 'Area', icon: <Activity className="w-3.5 h-3.5" /> },
    { type: 'line', label: 'Line', icon: <LineChart className="w-3.5 h-3.5" /> }
  ];

  return (
    <div className="flex flex-col z-30 select-none bg-[#0a0d14]/90 backdrop-blur-md">
      {/* 1. Header Row matching exact screenshot: 3-Line Menu (PIN Lock 1234) + Unified [LIVE $Balance ▾] Pill + Bell + Deposit */}
      <div className="min-h-13 px-2 sm:px-3 py-1.5 flex items-center justify-between gap-1.5 sm:gap-2 border-b border-white/10">
        {/* Left & Center: 3-Line Hamburger Menu + Unified Account & Balance Pill */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-1 min-w-0">
          {/* 3-Line Hamburger Menu Button with 1234 PIN Lock */}
          <button
            onClick={() => {
              if (isMenuUnlocked) {
                setOpenPanelId(null);
                setShowThreeLineMenu(true);
              } else {
                setMenuPinInput('');
                setPinError(false);
                setPinSuccess(false);
                setShowMenuPinLock(true);
              }
            }}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#141b27]/85 hover:bg-[#1b2435] border border-white/10 flex items-center justify-center text-slate-200 hover:text-white transition-all active:scale-95 cursor-pointer shrink-0 shadow-md relative"
            title={isMenuUnlocked ? 'Quotex Feature Menu (Unlocked)' : 'Menu is Locked (PIN: 1234)'}
          >
            <Menu className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.2]" />
            {!isMenuUnlocked && (
              <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-amber-400 border border-[#0a0d14] flex items-center justify-center shadow-xs">
                <Lock className="w-2 h-2 text-slate-950 stroke-[3]" />
              </span>
            )}
          </button>

          {/* Quick Trade Mode Switcher: Quick Trade (Binary) / Forex Trading ("aur ma forex trading option jis ma forex trading be kar saka ok") */}
          <button
            onClick={() => {
              const nextMode = tradingPlatformMode === 'FOREX' ? 'BINARY' : 'FOREX';
              setTradingPlatformMode(nextMode);
            }}
            className={`px-2 py-1.5 rounded-xl text-[10px] font-black border flex items-center gap-1 cursor-pointer transition-all active:scale-95 shrink-0 shadow-sm ${
              tradingPlatformMode === 'FOREX'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.5)]'
                : 'bg-[#141b27]/85 hover:bg-[#1a2436] text-emerald-400 border-emerald-500/30'
            }`}
            title="Switch Trading Mode (Quick Trade / Forex)"
          >
            {tradingPlatformMode === 'FOREX' ? (
              <>
                <Globe className="w-3 h-3 text-cyan-300" />
                <span className="tracking-wide">FOREX</span>
              </>
            ) : (
              <>
                <Zap className="w-3 h-3 text-emerald-400" />
                <span className="tracking-wide">TRADE</span>
              </>
            )}
          </button>

          {/* Unified Account + Full Balance Pill — Never truncates LIVE or DEMO amount */}
          <div className="relative flex-1 min-w-0">
            {(() => {
              const formattedBal =
                accountType === 'REAL' ? formatCurrency(realBalance) : formatCurrency(demoBalance);
              const amountSizeClass =
                formattedBal.length > 14
                  ? 'text-[10.5px] sm:text-xs'
                  : formattedBal.length > 11
                  ? 'text-[11.5px] sm:text-sm'
                  : 'text-xs sm:text-sm';

              return (
                <button
                  onClick={() => setShowAccountDropdown(!showAccountDropdown)}
                  className={`w-full flex items-center justify-between gap-1 sm:gap-1.5 rounded-2xl px-2.5 sm:px-3 py-1.5 transition-all cursor-pointer border ${
                    accountType === 'REAL' && isVipPurpleLive
                      ? 'bg-[#1a112b] hover:bg-[#231739] border-purple-500/75 shadow-[0_0_16px_rgba(168,85,247,0.35)]'
                      : 'bg-[#141b27] hover:bg-[#1a2333] border-[#232f44]'
                  }`}
                >
                  <div className="flex items-center gap-1 sm:gap-1.5 min-w-0 flex-wrap sm:flex-nowrap">
                    {accountType === 'REAL' ? (
                      isVipPurpleLive ? (
                        <Crown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-400 fill-purple-400 shrink-0 drop-shadow-[0_0_6px_rgba(192,132,252,0.8)]" />
                      ) : (
                        <Send className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#00e599] -rotate-12 shrink-0" />
                      )
                    ) : (
                      <span className="text-xs shrink-0">🎓</span>
                    )}

                    <span
                      className={`text-[10px] sm:text-xs font-black uppercase tracking-wider shrink-0 ${
                        accountType === 'REAL'
                          ? isVipPurpleLive
                            ? 'text-purple-400 drop-shadow-[0_0_8px_rgba(192,132,252,0.5)]'
                            : 'text-[#00e599]'
                          : 'text-amber-400'
                      }`}
                    >
                      {accountType === 'REAL' ? 'LIVE' : 'DEMO'}
                    </span>

                    <span
                      className={`${amountSizeClass} font-extrabold font-mono-num text-white whitespace-nowrap tracking-tight`}
                    >
                      {formattedBal}
                    </span>
                  </div>

                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                </button>
              );
            })()}

            {/* Account Dropdown */}
            {showAccountDropdown && (
              <>
                <div
                  className="fixed inset-0 z-40 bg-black/30"
                  onClick={() => setShowAccountDropdown(false)}
                />
                <div className="absolute left-0 mt-2 w-76 sm:w-80 max-w-[92vw] bg-[#141b26] border border-[#273245] rounded-xl shadow-2xl p-3 z-50 animate-scaleUp">
                  <div className="text-[10px] text-slate-400 font-bold uppercase mb-2 flex items-center justify-between">
                    <span>Switch Trading Account</span>
                    {isVipPurpleLive && (
                      <span className="text-[9px] bg-purple-500/20 text-purple-300 border border-purple-500/40 px-1.5 py-0.5 rounded font-black flex items-center gap-1">
                        <Crown className="w-3 h-3 text-purple-400 fill-purple-400" />
                        VIP STATUS
                      </span>
                    )}
                  </div>

                  {/* Demo Account */}
                  <div
                    onClick={() => {
                      setAccountType('DEMO');
                      setShowAccountDropdown(false);
                    }}
                    className={`p-2.5 rounded-lg border mb-2 cursor-pointer transition-colors ${
                      accountType === 'DEMO'
                        ? 'bg-[#1b263b] border-cyan-500 text-white'
                        : 'bg-[#151c2a] border-[#222e42] text-slate-300 hover:bg-[#1b2536]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-cyan-300">🎓 Demo Account</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          resetDemoBalance();
                        }}
                        className="p-1 rounded hover:bg-[#283850] text-slate-400 hover:text-cyan-300"
                        title="Reset to $10,000"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="text-base font-extrabold font-mono-num text-white mt-1 whitespace-nowrap break-all">
                      {formatCurrency(demoBalance)}
                    </div>
                  </div>

                  {/* Live Account */}
                  <div
                    onClick={() => {
                      setAccountType('REAL');
                      setShowAccountDropdown(false);
                    }}
                    className={`p-2.5 rounded-lg border cursor-pointer transition-colors ${
                      accountType === 'REAL'
                        ? isVipPurpleLive
                          ? 'bg-[#211538] border-purple-500 text-white'
                          : 'bg-[#1b263b] border-emerald-500 text-white'
                        : 'bg-[#151c2a] border-[#222e42] text-slate-300 hover:bg-[#1b2536]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs font-bold flex items-center gap-1.5 ${
                          isVipPurpleLive ? 'text-purple-400' : 'text-emerald-400'
                        }`}
                      >
                        {isVipPurpleLive ? (
                          <Crown className="w-3.5 h-3.5 text-purple-400 fill-purple-400" />
                        ) : (
                          <Send className="w-3 h-3 text-emerald-400 -rotate-12" />
                        )}
                        <span>Live Account</span>
                      </span>
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded font-black tracking-wider flex items-center gap-1 ${
                          isVipPurpleLive
                            ? 'bg-purple-500/25 text-purple-300 border border-purple-500/40'
                            : 'bg-emerald-500/20 text-emerald-300'
                        }`}
                      >
                        {isVipPurpleLive && <Crown className="w-2.5 h-2.5 fill-current" />}
                        LIVE
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2 mt-1 flex-wrap">
                      <div className="text-base font-extrabold font-mono-num text-white whitespace-nowrap">
                        {formatCurrency(realBalance)}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-2 border-t border-[#222c3d] flex gap-2">
                    <button
                      onClick={() => {
                        setShowAccountDropdown(false);
                        onOpenDeposit();
                      }}
                      className="flex-1 py-1.5 bg-[#00e599] hover:bg-[#00d084] rounded-lg text-xs font-black text-slate-950 transition-colors cursor-pointer"
                    >
                      Deposit
                    </button>
                    <button
                      onClick={() => {
                        setShowAccountDropdown(false);
                        onOpenWithdraw();
                      }}
                      className="flex-1 py-1.5 bg-[#1f2838] hover:bg-[#28354a] rounded-lg text-xs font-bold text-slate-200 transition-colors cursor-pointer"
                    >
                      Withdraw
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right side: Bell icon with badge + Deposit button */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            onClick={onOpenNotifications}
            className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#141b27] border border-[#232f44] flex items-center justify-center text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[9px] font-bold rounded-full w-3.5 h-3.5 sm:w-4 sm:h-4 flex items-center justify-center">
              1
            </span>
          </button>

          <button
            onClick={onOpenDeposit}
            className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-[#00e599] hover:bg-[#00f7a5] active:scale-95 text-slate-950 font-black text-xs sm:text-sm tracking-wide shadow-[0_2px_12px_rgba(0,229,153,0.35)] transition-all cursor-pointer"
          >
            Deposit
          </button>
        </div>
      </div>

      {/* 2. Optional Promo Banner (Toggled in Menu) */}
      {showPromoBanner && (
        <div className="bg-[#00c874] text-slate-950 px-3 py-1.5 flex items-center justify-between text-xs font-bold shadow-sm animate-fadeIn">
          <div
            onClick={onOpenDeposit}
            className="flex items-center gap-2 cursor-pointer flex-1"
          >
            <span className="text-base">🚀</span>
            <span className="text-[11px] sm:text-xs">
              Get a 50% bonus on your deposit!
            </span>
            <span className="bg-[#009e5b] text-white text-[10px] px-2 py-0.5 rounded-full font-black">
              50%
            </span>
          </div>

          <button
            onClick={() => setShowPromoBanner(false)}
            className="p-1 text-slate-900 hover:text-black transition-colors cursor-pointer"
            title="Close Banner"
          >
            <X className="w-3.5 h-3.5 stroke-[2.5]" />
          </button>
        </div>
      )}

      {/* 3. 3-LINE CONTROL MENU DRAWER — Every feature in its own separate collapsible panel from top to bottom */}
      <div
        className={`fixed inset-0 z-50 transition-all duration-200 ease-out ${
          showThreeLineMenu ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Backdrop */}
        <div
          className={`absolute inset-0 bg-black/75 backdrop-blur-xs transition-opacity duration-200 ${
            showThreeLineMenu ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={() => setShowThreeLineMenu(false)}
        />

        {/* Drawer container */}
        <div
          className={`relative w-84 max-w-[90vw] h-full bg-[#0c111a] border-r border-[#1f2b3e] shadow-2xl flex flex-col z-10 overflow-hidden transform transition-transform duration-200 ease-out ${
            showThreeLineMenu ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          {/* Drawer Header */}
          <div className="px-4 py-3 bg-[#121926] border-b border-[#1f2a3c] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                <Menu className="w-4 h-4" />
              </div>
              <div>
                <div className="text-sm font-extrabold text-white flex items-center gap-1.5">
                  <span>Quotex Feature Menu</span>
                  <span className="text-[9px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-1.5 py-0.2 rounded font-black">
                    ALL FEATURES INTACT
                  </span>
                </div>
                <div className="text-[10px] text-slate-400">
                  Forex, Binary, AI Signals, Tournaments & Tools
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => {
                  setIsMenuUnlocked(false);
                  setShowThreeLineMenu(false);
                }}
                className="p-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 cursor-pointer transition-colors flex items-center gap-1 text-[10px] font-bold"
                title="Lock Menu with PIN 1234"
              >
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Lock</span>
              </button>
              {openPanelId !== null && (
                <button
                  onClick={() => setOpenPanelId(null)}
                  className="px-2 py-1 rounded-lg bg-[#1a2436] hover:bg-[#24324a] text-[10px] font-bold text-cyan-300 cursor-pointer"
                  title="Close Open Panel"
                >
                  Close Panel
                </button>
              )}
              <button
                onClick={() => setShowThreeLineMenu(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#1c2638] cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Top Quick Cashier & Account Summary Strip */}
          <div className="px-3.5 py-2.5 bg-[#0f1622] border-b border-[#1c2738] shrink-0">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-cyan-600 to-emerald-500 flex items-center justify-center text-white text-xs font-black shrink-0">
                  {traderFlag}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-black text-white flex items-center gap-1">
                    <span>{traderName || 'YA TRADER'}</span>
                    {isVipPurpleLive && accountType === 'REAL' && (
                      <Crown className="w-3.5 h-3.5 text-purple-400 fill-purple-400 shrink-0" />
                    )}
                  </div>
                  <div className="text-[10px] text-slate-400 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    <span>
                      <span className="text-[#00e599] font-bold">LIVE: </span>
                      <span className="text-white font-mono-num font-bold whitespace-nowrap">
                        {formatCurrency(realBalance)}
                      </span>
                    </span>
                    <span>
                      <span className="text-amber-400 font-bold">DEMO: </span>
                      <span className="text-white font-mono-num font-bold whitespace-nowrap">
                        {formatCurrency(demoBalance)}
                      </span>
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => {
                    setShowThreeLineMenu(false);
                    onOpenDeposit();
                  }}
                  className="py-1.5 px-2.5 rounded-lg bg-[#00e599] hover:bg-[#00f7a5] text-slate-950 font-black text-[10px] cursor-pointer"
                >
                  + Deposit
                </button>
                <button
                  onClick={() => {
                    setShowThreeLineMenu(false);
                    onOpenWithdraw();
                  }}
                  className="py-1.5 px-2.5 rounded-lg bg-[#182335] hover:bg-[#22314a] border border-[#273750] text-slate-200 font-bold text-[10px] cursor-pointer"
                >
                  Withdraw
                </button>
              </div>
            </div>
          </div>

          {/* Quick Filter Categories */}
          <div className="px-3 py-1.5 bg-[#090d15] border-b border-[#182335] flex items-center gap-1 overflow-x-auto no-scrollbar shrink-0">
            {(
              [
                { id: 'ALL', label: 'All (15)' },
                { id: 'FOREX', label: 'Forex 🌐' },
                { id: 'TRADING', label: 'Trading & AI' },
                { id: 'TOOLS', label: 'Tools & Chart' },
                { id: 'CASHIER', label: 'Cashier & Stats' }
              ] as const
            ).map((cat) => (
              <button
                key={cat.id}
                onClick={() => setMenuFilterCategory(cat.id)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap transition-colors cursor-pointer ${
                  menuFilterCategory === cat.id
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/50'
                    : 'bg-[#121927] text-slate-400 hover:text-white border border-white/5'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* UP-TO-DOWN SEPARATE COLLAPSIBLE FEATURE PANELS ("Sara meanu feature ko alada alada meanu ma rakna up to down ok") */}
          <div className="p-3 overflow-y-auto flex-1 space-y-2 text-xs overscroll-contain">
            {/* =====================================================================
                PANEL: Forex Trading Mode & Real-Time Trading ("aur ma forex trading option jis ma forex trading be kar saka ok")
               ===================================================================== */}
            {(menuFilterCategory === 'ALL' || menuFilterCategory === 'FOREX') && (
              <div className="bg-[#101726] border border-blue-500/40 rounded-xl overflow-hidden shadow-lg">
                <div
                  onClick={() => togglePanel('forex')}
                  className="px-3.5 py-3 flex items-center justify-between cursor-pointer hover:bg-[#152035] transition-colors bg-gradient-to-r from-blue-950/40 to-transparent"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 border border-blue-400/30">
                      <Globe className="w-4 h-4 text-cyan-400" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-extrabold text-white text-xs flex items-center gap-1.5">
                        <span>Forex Trading (CFD / Multipliers)</span>
                        <span className="text-[8px] bg-blue-500/30 text-cyan-300 border border-blue-400/40 px-1 py-0.2 rounded font-black uppercase">
                          NEW
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-1.5">
                        <span className="text-cyan-300 font-bold">{forexPositions.length} Open Positions</span>
                        <span>•</span>
                        <span>Multipliers up to x500</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        setTradingPlatformMode(tradingPlatformMode === 'FOREX' ? 'BINARY' : 'FOREX');
                      }}
                      className={`px-2 py-0.5 rounded text-[10px] font-black cursor-pointer transition-colors ${
                        tradingPlatformMode === 'FOREX'
                          ? 'bg-blue-500 text-white shadow-[0_0_8px_rgba(59,130,246,0.6)]'
                          : 'bg-[#182338] text-slate-300 hover:text-white border border-white/10'
                      }`}
                    >
                      {tradingPlatformMode === 'FOREX' ? 'FOREX ON' : 'ENABLE'}
                    </span>
                    {openPanelId === 'forex' ? (
                      <ChevronUp className="w-4 h-4 text-cyan-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                </div>

                {openPanelId === 'forex' && (
                  <div className="p-3.5 space-y-3 border-t border-[#1d2b42] bg-[#0c121e]">
                    {/* Platform Mode Selector */}
                    <div className="bg-[#121927] p-2 rounded-xl border border-white/10 flex items-center gap-1.5">
                      <button
                        onClick={() => setTradingPlatformMode('BINARY')}
                        className={`flex-1 py-1.5 rounded-lg text-[10.5px] font-black cursor-pointer transition-all flex items-center justify-center gap-1 ${
                          tradingPlatformMode === 'BINARY'
                            ? 'bg-emerald-500 text-slate-950 shadow-md'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <Zap className="w-3.5 h-3.5" />
                        <span>Quick Trade (Binary)</span>
                      </button>
                      <button
                        onClick={() => setTradingPlatformMode('FOREX')}
                        className={`flex-1 py-1.5 rounded-lg text-[10.5px] font-black cursor-pointer transition-all flex items-center justify-center gap-1 ${
                          tradingPlatformMode === 'FOREX'
                            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <Globe className="w-3.5 h-3.5" />
                        <span>Forex Mode</span>
                      </button>
                    </div>

                    {/* Pair & Current Price */}
                    <div className="bg-[#121927] p-2.5 rounded-xl border border-white/10 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold text-slate-400">Forex Asset Pair</span>
                        <span className="text-[10px] text-cyan-400 font-mono font-bold">
                          Spread: 0.8 pips • Real-Time
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-1">
                        {assets.slice(0, 6).map((ast) => (
                          <button
                            key={ast.id}
                            onClick={() => setActiveAsset(ast)}
                            className={`px-2 py-1.5 rounded-lg text-[10px] font-black cursor-pointer transition-colors text-left flex flex-col ${
                              activeAsset.id === ast.id
                                ? 'bg-blue-600 text-white border border-blue-400 shadow-sm'
                                : 'bg-[#182337] text-slate-300 hover:text-white border border-white/5'
                            }`}
                          >
                            <span className="truncate">{ast.symbol}</span>
                            <span className="font-mono text-[9px] opacity-80">
                              {formatPrice(ast.currentPrice, ast.decimalPlaces)}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Margin Collateral */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold text-slate-400">Margin Collateral ($)</span>
                        <span className="text-[10px] text-slate-400">
                          Balance: <span className="text-white font-mono font-bold">${accountType === 'REAL' ? realBalance.toFixed(2) : demoBalance.toFixed(2)}</span>
                        </span>
                      </div>
                      <div className="grid grid-cols-4 gap-1">
                        {[10, 25, 50, 100].map((amt) => (
                          <button
                            key={amt}
                            onClick={() => setForexMargin(amt)}
                            className={`py-1 rounded-lg text-[11px] font-bold cursor-pointer ${
                              forexMargin === amt
                                ? 'bg-cyan-500 text-slate-950 font-black'
                                : 'bg-[#162133] text-slate-300 hover:text-white border border-white/5'
                            }`}
                          >
                            ${amt}
                          </button>
                        ))}
                      </div>
                      <input
                        type="number"
                        value={forexMargin}
                        onChange={(e) => setForexMargin(Math.max(1, Number(e.target.value) || 1))}
                        className="w-full bg-[#162133] border border-[#233149] rounded-lg px-2.5 py-1.5 text-white font-mono text-xs focus:outline-hidden focus:border-cyan-400"
                        placeholder="Custom Margin ($)"
                      />
                    </div>

                    {/* Leverage Multiplier */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold text-slate-400">Leverage Multiplier</span>
                        <span className="text-[10px] text-amber-300 font-mono font-bold">
                          Trade Volume: ${(forexMargin * forexLeverage).toLocaleString()}
                        </span>
                      </div>
                      <div className="grid grid-cols-5 gap-1">
                        {[20, 50, 100, 200, 500].map((lev) => (
                          <button
                            key={lev}
                            onClick={() => setForexLeverage(lev)}
                            className={`py-1 rounded-lg text-[10.5px] font-black cursor-pointer ${
                              forexLeverage === lev
                                ? 'bg-amber-400 text-slate-950'
                                : 'bg-[#162133] text-slate-300 hover:text-white border border-white/5'
                            }`}
                          >
                            {lev}x
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Take Profit & Stop Loss */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-[#121927] p-2 rounded-xl border border-white/10 space-y-1">
                        <div className="text-[9px] uppercase font-bold text-emerald-400">Take Profit (TP)</div>
                        <div className="flex items-center gap-1">
                          {[25, 50, 100].map((p) => (
                            <button
                              key={p}
                              onClick={() => setForexTpPercent(p)}
                              className={`flex-1 py-0.5 rounded text-[9px] font-bold cursor-pointer ${
                                forexTpPercent === p
                                  ? 'bg-emerald-500 text-slate-950'
                                  : 'bg-[#1a2538] text-slate-300 hover:text-white'
                              }`}
                            >
                              +{p}%
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="bg-[#121927] p-2 rounded-xl border border-white/10 space-y-1">
                        <div className="text-[9px] uppercase font-bold text-rose-400">Stop Loss (SL)</div>
                        <div className="flex items-center gap-1">
                          {[20, 30, 50].map((p) => (
                            <button
                              key={p}
                              onClick={() => setForexSlPercent(p)}
                              className={`flex-1 py-0.5 rounded text-[9px] font-bold cursor-pointer ${
                                forexSlPercent === p
                                  ? 'bg-rose-500 text-white'
                                  : 'bg-[#1a2538] text-slate-300 hover:text-white'
                              }`}
                            >
                              -{p}%
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* BUY / SELL Action Buttons */}
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        onClick={() => {
                          const pip = Math.pow(10, -activeAsset.decimalPlaces);
                          const tpPrice = Number((activeAsset.currentPrice + pip * (forexTpPercent * 10)).toFixed(activeAsset.decimalPlaces));
                          const slPrice = Number((activeAsset.currentPrice - pip * (forexSlPercent * 10)).toFixed(activeAsset.decimalPlaces));
                          const ok = openForexPosition('BUY', forexMargin, forexLeverage, tpPrice, slPrice);
                          if (ok) {
                            setForexMessage(`BUY order opened on ${activeAsset.symbol} ($${forexMargin} @ ${forexLeverage}x)!`);
                            setTimeout(() => setForexMessage(null), 3000);
                          } else {
                            setForexMessage('Insufficient balance for margin!');
                            setTimeout(() => setForexMessage(null), 3000);
                          }
                        }}
                        className="py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-slate-950 font-black text-xs flex flex-col items-center justify-center cursor-pointer shadow-lg active:scale-95"
                      >
                        <div className="flex items-center gap-1">
                          <TrendingUp className="w-3.5 h-3.5 stroke-[2.5]" />
                          <span>BUY / LONG</span>
                        </div>
                        <span className="text-[10px] font-mono opacity-90">
                          {formatPrice(activeAsset.currentPrice, activeAsset.decimalPlaces)}
                        </span>
                      </button>

                      <button
                        onClick={() => {
                          const pip = Math.pow(10, -activeAsset.decimalPlaces);
                          const tpPrice = Number((activeAsset.currentPrice - pip * (forexTpPercent * 10)).toFixed(activeAsset.decimalPlaces));
                          const slPrice = Number((activeAsset.currentPrice + pip * (forexSlPercent * 10)).toFixed(activeAsset.decimalPlaces));
                          const ok = openForexPosition('SELL', forexMargin, forexLeverage, tpPrice, slPrice);
                          if (ok) {
                            setForexMessage(`SELL order opened on ${activeAsset.symbol} ($${forexMargin} @ ${forexLeverage}x)!`);
                            setTimeout(() => setForexMessage(null), 3000);
                          } else {
                            setForexMessage('Insufficient balance for margin!');
                            setTimeout(() => setForexMessage(null), 3000);
                          }
                        }}
                        className="py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-500 hover:from-rose-500 hover:to-red-400 text-white font-black text-xs flex flex-col items-center justify-center cursor-pointer shadow-lg active:scale-95"
                      >
                        <div className="flex items-center gap-1">
                          <TrendingDown className="w-3.5 h-3.5 stroke-[2.5]" />
                          <span>SELL / SHORT</span>
                        </div>
                        <span className="text-[10px] font-mono opacity-90">
                          {formatPrice(activeAsset.currentPrice, activeAsset.decimalPlaces)}
                        </span>
                      </button>
                    </div>

                    {forexMessage && (
                      <div className="text-center text-[10px] font-bold text-cyan-300 bg-cyan-950/40 p-1.5 rounded-lg border border-cyan-500/30">
                        {forexMessage}
                      </div>
                    )}

                    {/* Open Forex Positions List */}
                    <div className="pt-2 border-t border-white/10 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold text-slate-400">
                          Open Forex Positions ({forexPositions.length})
                        </span>
                        {forexPositions.length > 0 && (
                          <span className="text-[9px] text-cyan-400 animate-pulse font-bold">
                            Live P&L Tracking
                          </span>
                        )}
                      </div>

                      {forexPositions.length === 0 ? (
                        <div className="text-center py-3 text-[11px] text-slate-400 bg-[#121927] rounded-xl border border-white/5">
                          No open Forex positions. Click BUY or SELL above to trade Forex!
                        </div>
                      ) : (
                        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                          {forexPositions.map((pos) => {
                            const isProfit = pos.pnl >= 0;
                            return (
                              <div
                                key={pos.id}
                                className="bg-[#121927] p-2.5 rounded-xl border border-white/10 flex items-center justify-between gap-2 shadow-sm"
                              >
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <span
                                      className={`px-1.5 py-0.2 rounded text-[9px] font-black uppercase ${
                                        pos.direction === 'BUY'
                                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-400/40'
                                          : 'bg-rose-500/20 text-rose-400 border border-rose-400/40'
                                      }`}
                                    >
                                      {pos.direction}
                                    </span>
                                    <span className="font-extrabold text-white text-xs">{pos.assetSymbol}</span>
                                    <span className="text-[9px] text-slate-400 font-mono">
                                      {pos.leverage}x
                                    </span>
                                  </div>
                                  <div className="text-[9px] text-slate-400 font-mono mt-0.5">
                                    Open: {formatPrice(pos.openPrice, 4)} → Live: {formatPrice(pos.currentPrice, 4)}
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  <div className="text-right">
                                    <div
                                      className={`text-xs font-black font-mono-num ${
                                        isProfit ? 'text-[#00e599]' : 'text-[#ff3355]'
                                      }`}
                                    >
                                      {isProfit ? `+$${pos.pnl.toFixed(2)}` : `-$${Math.abs(pos.pnl).toFixed(2)}`}
                                    </div>
                                    <div
                                      className={`text-[9px] font-bold ${
                                        isProfit ? 'text-emerald-400' : 'text-rose-400'
                                      }`}
                                    >
                                      {isProfit ? `+${pos.pnlPercent}%` : `${pos.pnlPercent}%`}
                                    </div>
                                  </div>

                                  <button
                                    onClick={() => closeForexPosition(pos.id)}
                                    className="px-2 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/40 text-rose-300 border border-rose-400/40 font-bold text-[9px] cursor-pointer transition-colors"
                                    title="Close Position Now"
                                  >
                                    Close
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Forex Closed History */}
                    {forexHistory.length > 0 && (
                      <div className="pt-2 border-t border-white/10 space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] uppercase font-bold text-slate-400">
                            Closed History ({forexHistory.length})
                          </span>
                          <button
                            onClick={clearForexHistory}
                            className="text-[9px] text-slate-400 hover:text-rose-400 cursor-pointer"
                          >
                            Clear
                          </button>
                        </div>
                        <div className="space-y-1 max-h-28 overflow-y-auto pr-1">
                          {forexHistory.slice(0, 5).map((h) => {
                            const isWin = h.pnl >= 0;
                            return (
                              <div
                                key={h.id}
                                className="bg-[#0e1420] px-2 py-1 rounded-lg border border-white/5 flex items-center justify-between text-[10px]"
                              >
                                <div className="flex items-center gap-1.5">
                                  <span className={`font-bold ${h.direction === 'BUY' ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    {h.direction}
                                  </span>
                                  <span className="text-white">{h.assetSymbol}</span>
                                </div>
                                <div className={`font-mono font-bold ${isWin ? 'text-emerald-400' : 'text-rose-400'}`}>
                                  {isWin ? `+$${h.pnl.toFixed(2)}` : `-$${Math.abs(h.pnl).toFixed(2)}`}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            {/* =====================================================================
                PANEL 1: Account & Live Balance Control
               ===================================================================== */}
            <div className="bg-[#121926] border border-[#212e45] rounded-xl overflow-hidden">
              <div
                onClick={() => togglePanel('account')}
                className="px-3.5 py-3 flex items-center justify-between cursor-pointer hover:bg-[#162030] transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                    <Crown className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-white text-xs">1. Account & Live Balance</div>
                    <div className="text-[10px] text-slate-400 flex flex-wrap gap-x-2">
                      <span className="whitespace-nowrap">Live: {formatCurrency(realBalance)}</span>
                      <span className="whitespace-nowrap">Demo: {formatCurrency(demoBalance)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setAccountType(accountType === 'REAL' ? 'DEMO' : 'REAL');
                    }}
                    className={`px-2 py-0.5 rounded text-[10px] font-black cursor-pointer ${
                      accountType === 'REAL'
                        ? 'bg-emerald-500 text-slate-950'
                        : 'bg-amber-400 text-slate-950'
                    }`}
                  >
                    {accountType === 'REAL' ? 'LIVE ON' : 'DEMO ON'}
                  </button>
                  {openPanelId === 'account' ? (
                    <ChevronUp className="w-4 h-4 text-cyan-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </div>
              </div>

              {openPanelId === 'account' && (
                <div className="px-3.5 pb-3.5 pt-2 border-t border-[#1d293e] bg-[#0e141f] space-y-2.5">
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      onClick={() => setAccountType('REAL')}
                      className={`py-2 px-2.5 rounded-lg border font-bold text-[11px] cursor-pointer text-left ${
                        accountType === 'REAL'
                          ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300'
                          : 'bg-[#141c2b] border-[#223049] text-slate-400'
                      }`}
                    >
                      <div className="text-[10px] uppercase opacity-80">LIVE Account</div>
                      <div className="font-mono-num font-extrabold text-white text-xs whitespace-nowrap mt-0.5">
                        {formatCurrency(realBalance)}
                      </div>
                    </button>
                    <button
                      onClick={() => setAccountType('DEMO')}
                      className={`py-2 px-2.5 rounded-lg border font-bold text-[11px] cursor-pointer text-left ${
                        accountType === 'DEMO'
                          ? 'bg-amber-950/60 border-amber-500 text-amber-300'
                          : 'bg-[#141c2b] border-[#223049] text-slate-400'
                      }`}
                    >
                      <div className="text-[10px] uppercase opacity-80">DEMO Account</div>
                      <div className="font-mono-num font-extrabold text-white text-xs whitespace-nowrap mt-0.5">
                        {formatCurrency(demoBalance)}
                      </div>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-1.5">
                    <button
                      onClick={() => {
                        setRealBalanceDirect(105000);
                        setAccountType('REAL');
                      }}
                      className="py-2 px-2.5 rounded-lg bg-purple-950/60 hover:bg-purple-900/70 border border-purple-500/50 text-purple-300 font-bold text-[11px] flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Crown className="w-3.5 h-3.5 text-purple-400 fill-purple-400" />
                      <span>VIP $105,000</span>
                    </button>
                  </div>

                  <div className="flex gap-1.5">
                    <input
                      type="number"
                      placeholder="Set custom Live $ balance..."
                      value={customBalanceInput}
                      onChange={(e) => setCustomBalanceInput(e.target.value)}
                      className="flex-1 bg-[#0a0f18] border border-[#25334a] rounded-lg px-2.5 py-1.5 text-white font-mono-num text-xs outline-none focus:border-cyan-400"
                    />
                    <button
                      onClick={() => {
                        const val = parseFloat(customBalanceInput);
                        if (!isNaN(val) && val >= 0) {
                          setRealBalanceDirect(val);
                          setAccountType('REAL');
                          setCustomBalanceInput('');
                        }
                      }}
                      className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs cursor-pointer"
                    >
                      Set $
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <button
                      onClick={resetDemoBalance}
                      className="text-[11px] text-cyan-400 hover:underline font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Reset Demo to $10,000</span>
                    </button>
                    <button
                      onClick={() => setOpenPanelId(null)}
                      className="px-2.5 py-1 rounded-lg bg-[#1b2538] text-slate-300 hover:text-white text-[10px] font-bold cursor-pointer"
                    >
                      Close Panel
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* =====================================================================
                PANEL 2: Trade Result Mode (Win / Force Lose / Real Trading Mix)
               ===================================================================== */}
            <div className="bg-[#121926] border border-[#212e45] rounded-xl overflow-hidden">
              <div
                onClick={() => togglePanel('trade_mode')}
                className="px-3.5 py-3 flex items-center justify-between cursor-pointer hover:bg-[#162030] transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-white text-xs">2. Trade Result Mode</div>
                    <div className="text-[10px] text-slate-400">
                      {marketBehaviorMode === 'force_loss'
                        ? 'Force Lose Mode (ON)'
                        : marketBehaviorMode === 'realistic'
                        ? 'Real Trading Win & Lose Mix'
                        : 'Always Win Smooth Mode (ON)'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-black ${
                      marketBehaviorMode === 'force_loss'
                        ? 'bg-rose-500 text-white'
                        : marketBehaviorMode === 'realistic'
                        ? 'bg-amber-400 text-slate-950'
                        : 'bg-emerald-500 text-slate-950'
                    }`}
                  >
                    {marketBehaviorMode === 'force_loss'
                      ? 'LOSE ON'
                      : marketBehaviorMode === 'realistic'
                      ? 'REAL MIX'
                      : 'WIN ON'}
                  </span>
                  {openPanelId === 'trade_mode' ? (
                    <ChevronUp className="w-4 h-4 text-cyan-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </div>
              </div>

              {openPanelId === 'trade_mode' && (
                <div className="px-3.5 pb-3.5 pt-2 border-t border-[#1d293e] bg-[#0e141f] space-y-2">
                  <button
                    onClick={() => setMarketBehaviorMode('smart_push')}
                    className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                      marketBehaviorMode === 'smart_push'
                        ? 'bg-emerald-950/50 border-emerald-500 text-emerald-300'
                        : 'bg-[#121a28] border-[#1f2c40] text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-emerald-400 shrink-0" />
                      <div>
                        <div className="font-bold text-xs">Always Win Mode (Smooth Real-Time)</div>
                        <div className="text-[10px] text-slate-400">Gradual real-time finish in profit</div>
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded ${
                        marketBehaviorMode === 'smart_push'
                          ? 'bg-emerald-500 text-slate-950'
                          : 'bg-[#1e293b] text-slate-400'
                      }`}
                    >
                      {marketBehaviorMode === 'smart_push' ? 'ON' : 'OFF'}
                    </span>
                  </button>

                  <button
                    onClick={() => setMarketBehaviorMode('force_loss')}
                    className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                      marketBehaviorMode === 'force_loss'
                        ? 'bg-rose-950/50 border-rose-500 text-rose-300'
                        : 'bg-[#121a28] border-[#1f2c40] text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <TrendingDown className="w-4 h-4 text-rose-400 shrink-0" />
                      <div>
                        <div className="font-bold text-xs">Force Lose Mode</div>
                        <div className="text-[10px] text-slate-400">Gradual real-time finish in loss</div>
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded ${
                        marketBehaviorMode === 'force_loss'
                          ? 'bg-rose-500 text-white'
                          : 'bg-[#1e293b] text-slate-400'
                      }`}
                    >
                      {marketBehaviorMode === 'force_loss' ? 'ON' : 'OFF'}
                    </span>
                  </button>

                  <button
                    onClick={() => setMarketBehaviorMode('realistic')}
                    className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                      marketBehaviorMode === 'realistic'
                        ? 'bg-amber-950/50 border-amber-500 text-amber-300'
                        : 'bg-[#121a28] border-[#1f2c40] text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Shuffle className="w-4 h-4 text-amber-400 shrink-0" />
                      <div>
                        <div className="font-bold text-xs">Real Trading (Win & Lose Mix)</div>
                        <div className="text-[10px] text-slate-400">Natural live market win & loss ratio</div>
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded ${
                        marketBehaviorMode === 'realistic'
                          ? 'bg-amber-400 text-slate-950'
                          : 'bg-[#1e293b] text-slate-400'
                      }`}
                    >
                      {marketBehaviorMode === 'realistic' ? 'ON' : 'OFF'}
                    </span>
                  </button>

                  <div className="flex justify-end pt-1">
                    <button
                      onClick={() => setOpenPanelId(null)}
                      className="px-2.5 py-1 rounded-lg bg-[#1b2538] text-slate-300 hover:text-white text-[10px] font-bold cursor-pointer"
                    >
                      Close Panel
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* =====================================================================
                PANEL: Quotex AI Live Signals ("meanu ka all feature wapasa lao")
               ===================================================================== */}
            {(menuFilterCategory === 'ALL' || menuFilterCategory === 'TRADING') && (
              <div className="bg-[#121926] border border-cyan-500/30 rounded-xl overflow-hidden shadow-sm">
                <div
                  onClick={() => togglePanel('signals')}
                  className="px-3.5 py-3 flex items-center justify-between cursor-pointer hover:bg-[#162030] transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0 border border-cyan-500/30">
                      <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-white text-xs flex items-center gap-1.5">
                        <span>Quotex Live AI Signals</span>
                        <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-1 rounded font-black">
                          89-94% ACCURACY
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Real-time AI algorithmic trade predictions • 1-Click Copy
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {openPanelId === 'signals' ? (
                      <ChevronUp className="w-4 h-4 text-cyan-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                </div>

                {openPanelId === 'signals' && (
                  <div className="p-3 space-y-2 border-t border-[#1e2a3c] bg-[#0c121d]">
                    <div className="text-[10px] text-slate-300">
                      Tap <span className="text-cyan-300 font-bold">Copy Signal</span> to automatically switch asset and ready the trade!
                    </div>

                    <div className="space-y-1.5">
                      {[
                        { id: 'SIG-1', symbol: 'EUR/USD OTC', dir: 'UP', accuracy: '94%', tf: '1M', strength: 'Strong Buy' },
                        { id: 'SIG-2', symbol: 'GBP/USD OTC', dir: 'UP', accuracy: '91%', tf: '1M', strength: 'Strong Buy' },
                        { id: 'SIG-3', symbol: 'USD/JPY OTC', dir: 'DOWN', accuracy: '89%', tf: '2M', strength: 'Strong Sell' },
                        { id: 'SIG-4', symbol: 'Crypto BTC', dir: 'UP', accuracy: '92%', tf: '1M', strength: 'Bullish' }
                      ].map((sig) => (
                        <div
                          key={sig.id}
                          className="bg-[#141d2c] p-2.5 rounded-xl border border-white/5 flex items-center justify-between gap-2"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-extrabold text-white text-xs">{sig.symbol}</span>
                              <span className="text-[9px] bg-slate-800 text-slate-300 px-1 py-0.2 rounded font-mono">
                                {sig.tf}
                              </span>
                            </div>
                            <div className="text-[9px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                              <span className="text-emerald-400 font-bold">{sig.accuracy} Accuracy</span>
                              <span>•</span>
                              <span className={sig.dir === 'UP' ? 'text-emerald-300' : 'text-rose-300'}>
                                {sig.strength}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-black ${
                                sig.dir === 'UP'
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                                  : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                              }`}
                            >
                              {sig.dir}
                            </span>
                            <button
                              onClick={() => {
                                const matched = assets.find((a) => a.symbol === sig.symbol) || assets[0];
                                setActiveAsset(matched);
                                setCopiedSignalId(sig.id);
                                setTimeout(() => setCopiedSignalId(null), 2500);
                              }}
                              className="px-2 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-400/40 font-bold text-[10px] cursor-pointer transition-colors"
                            >
                              {copiedSignalId === sig.id ? 'Copied ✓' : 'Copy'}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* =====================================================================
                PANEL: Quotex Tournaments & Contests ("meanu ka all feature wapasa lao")
               ===================================================================== */}
            {(menuFilterCategory === 'ALL' || menuFilterCategory === 'TRADING') && (
              <div className="bg-[#121926] border border-amber-500/30 rounded-xl overflow-hidden shadow-sm">
                <div
                  onClick={() => togglePanel('tournaments')}
                  className="px-3.5 py-3 flex items-center justify-between cursor-pointer hover:bg-[#162030] transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30">
                      <Trophy className="w-4 h-4 text-amber-400" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-white text-xs flex items-center gap-1.5">
                        <span>Quotex Tournaments</span>
                        <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1 rounded font-black">
                          $125,000+ PRIZES
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Compete with top traders & win cash prizes
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {openPanelId === 'tournaments' ? (
                      <ChevronUp className="w-4 h-4 text-cyan-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                </div>

                {openPanelId === 'tournaments' && (
                  <div className="p-3 space-y-2 border-t border-[#1e2a3c] bg-[#0c121d]">
                    <div className="space-y-1.5">
                      {[
                        { title: 'Daily Free Tournament', prize: '$1,000', fee: 'FREE', active: '2,481 Traders', status: 'ACTIVE' },
                        { title: 'Weekend Pro Challenge', prize: '$25,000', fee: '$10', active: '840 Traders', status: 'REGISTER' },
                        { title: 'Grand Master Championship', prize: '$100,000', fee: '$50', active: '512 Traders', status: 'UPCOMING' }
                      ].map((trn, idx) => (
                        <div
                          key={idx}
                          className="bg-[#141d2c] p-2.5 rounded-xl border border-white/5 flex items-center justify-between gap-2"
                        >
                          <div>
                            <div className="font-bold text-white text-xs">{trn.title}</div>
                            <div className="text-[9px] text-slate-400 mt-0.5 flex items-center gap-2">
                              <span className="text-amber-400 font-extrabold">{trn.prize} Prize</span>
                              <span>•</span>
                              <span>Fee: {trn.fee}</span>
                              <span>•</span>
                              <span>{trn.active}</span>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              alert(`Successfully joined ${trn.title}! Your tournament balance is ready.`);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-[10px] cursor-pointer transition-colors shrink-0"
                          >
                            {trn.status === 'ACTIVE' ? 'Participate' : 'Join'}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* =====================================================================
                PANEL: Quotex Market & Promo Store ("meanu ka all feature wapasa lao")
               ===================================================================== */}
            {(menuFilterCategory === 'ALL' || menuFilterCategory === 'CASHIER') && (
              <div className="bg-[#121926] border border-purple-500/30 rounded-xl overflow-hidden shadow-sm">
                <div
                  onClick={() => togglePanel('market')}
                  className="px-3.5 py-3 flex items-center justify-between cursor-pointer hover:bg-[#162030] transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0 border border-purple-500/30">
                      <Gift className="w-4 h-4 text-purple-400" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-white text-xs flex items-center gap-1.5">
                        <span>Market & Promo Codes</span>
                        <span className="text-[9px] bg-purple-500/20 text-purple-300 px-1 rounded font-black">
                          PROMOS ACTIVE
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Deposit bonuses, risk-free trades & gems rewards
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {openPanelId === 'market' ? (
                      <ChevronUp className="w-4 h-4 text-cyan-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                </div>

                {openPanelId === 'market' && (
                  <div className="p-3 space-y-2.5 border-t border-[#1e2a3c] bg-[#0c121d]">
                    <div className="text-[10px] text-slate-300">
                      Active promotional codes to apply on deposit for bonus funds:
                    </div>

                    <div className="space-y-1.5">
                      {[
                        { code: 'BONUS50', desc: '+50% Extra Balance on Any Deposit', bonus: '+50%' },
                        { code: 'QUOTEX100', desc: '100% 2X Capital Double Match', bonus: '+100%' },
                        { code: 'VIP30', desc: '+30% Instant Real VIP Cashback', bonus: '+30%' }
                      ].map((pr) => (
                        <div
                          key={pr.code}
                          className="bg-[#141d2c] p-2 rounded-xl border border-white/5 flex items-center justify-between"
                        >
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-black text-amber-300 text-xs">{pr.code}</span>
                              <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1 rounded font-bold">
                                {pr.bonus}
                              </span>
                            </div>
                            <div className="text-[9px] text-slate-400">{pr.desc}</div>
                          </div>
                          <button
                            onClick={() => {
                              navigator.clipboard?.writeText(pr.code);
                              setShowThreeLineMenu(false);
                              onOpenDeposit();
                            }}
                            className="px-2 py-1 rounded-lg bg-[#00e599] hover:bg-[#00f7a5] text-slate-950 font-black text-[10px] cursor-pointer"
                          >
                            Apply Code
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* =====================================================================
                PANEL 3: Chart Buttons (Eye, Bag, Pen Tool & Zoom) ON/OFF
               ===================================================================== */}
            <div className="bg-[#121926] border border-[#212e45] rounded-xl overflow-hidden">
              <div
                onClick={() => togglePanel('chart_icons')}
                className="px-3.5 py-3 flex items-center justify-between cursor-pointer hover:bg-[#162030] transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
                    <Eye className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-white text-xs">3. Chart Icons (Eye, Bag & Pen)</div>
                    <div className="text-[10px] text-slate-400">
                      Turn individual chart buttons ON or OFF
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowChartButtons(!showChartButtons);
                    }}
                    className={`px-2 py-0.5 rounded text-[10px] font-black cursor-pointer ${
                      showChartButtons ? 'bg-cyan-500 text-slate-950' : 'bg-[#222e42] text-slate-400'
                    }`}
                  >
                    {showChartButtons ? 'ON' : 'OFF'}
                  </button>
                  {openPanelId === 'chart_icons' ? (
                    <ChevronUp className="w-4 h-4 text-cyan-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </div>
              </div>

              {openPanelId === 'chart_icons' && (
                <div className="px-3.5 pb-3.5 pt-2 border-t border-[#1d293e] bg-[#0e141f] space-y-2">
                  {/* All Chart Icons Master Toggle */}
                  <div className="flex items-center justify-between p-2 rounded-lg bg-[#141c2b] border border-[#1f2c40]">
                    <span className="font-bold text-white text-xs">All Chart Floating Buttons</span>
                    <button
                      onClick={() => setShowChartButtons(!showChartButtons)}
                      className={`px-2.5 py-1 rounded-lg font-black text-[10px] cursor-pointer ${
                        showChartButtons ? 'bg-emerald-500 text-slate-950' : 'bg-[#222e42] text-slate-400'
                      }`}
                    >
                      {showChartButtons ? 'ON' : 'OFF'}
                    </button>
                  </div>

                  {/* Eye Button Toggle */}
                  <div className="flex items-center justify-between p-2 rounded-lg bg-[#141c2b] border border-[#1f2c40]">
                    <span className="text-slate-200 text-xs flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Eye Button (Top-Left)</span>
                    </span>
                    <button
                      onClick={() => setShowEyeButton(!showEyeButton)}
                      className={`px-2.5 py-1 rounded-lg font-black text-[10px] cursor-pointer ${
                        showEyeButton ? 'bg-emerald-500 text-slate-950' : 'bg-[#222e42] text-slate-400'
                      }`}
                    >
                      {showEyeButton ? 'ON' : 'OFF'}
                    </button>
                  </div>

                  {/* Bag Icon Toggle */}
                  <div className="flex items-center justify-between p-2 rounded-lg bg-[#141c2b] border border-[#1f2c40]">
                    <span className="text-slate-200 text-xs flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Bag Icon (Trades Drawer)</span>
                    </span>
                    <button
                      onClick={() => setShowBagButton(!showBagButton)}
                      className={`px-2.5 py-1 rounded-lg font-black text-[10px] cursor-pointer ${
                        showBagButton ? 'bg-emerald-500 text-slate-950' : 'bg-[#222e42] text-slate-400'
                      }`}
                    >
                      {showBagButton ? 'ON' : 'OFF'}
                    </button>
                  </div>

                  {/* Pen Tool Icon Toggle */}
                  <div className="flex items-center justify-between p-2 rounded-lg bg-[#141c2b] border border-[#1f2c40]">
                    <span className="text-slate-200 text-xs flex items-center gap-1.5">
                      <PenTool className="w-3.5 h-3.5 text-amber-400" />
                      <span>Pen Tool Icon (Top-Left)</span>
                    </span>
                    <button
                      onClick={() => setShowPenButton(!showPenButton)}
                      className={`px-2.5 py-1 rounded-lg font-black text-[10px] cursor-pointer ${
                        showPenButton ? 'bg-emerald-500 text-slate-950' : 'bg-[#222e42] text-slate-400'
                      }`}
                    >
                      {showPenButton ? 'ON' : 'OFF'}
                    </button>
                  </div>

                  {/* Zoom Controls Toggle */}
                  <div className="flex items-center justify-between p-2 rounded-lg bg-[#141c2b] border border-[#1f2c40]">
                    <span className="text-slate-200 text-xs flex items-center gap-1.5">
                      <Settings className="w-3.5 h-3.5 text-purple-400" />
                      <span>Zoom (+ / -) Right Bar</span>
                    </span>
                    <button
                      onClick={() => setShowZoomControls(!showZoomControls)}
                      className={`px-2.5 py-1 rounded-lg font-black text-[10px] cursor-pointer ${
                        showZoomControls ? 'bg-emerald-500 text-slate-950' : 'bg-[#222e42] text-slate-400'
                      }`}
                    >
                      {showZoomControls ? 'ON' : 'OFF'}
                    </button>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      onClick={() => setOpenPanelId(null)}
                      className="px-2.5 py-1 rounded-lg bg-[#1b2538] text-slate-300 hover:text-white text-[10px] font-bold cursor-pointer"
                    >
                      Close Panel
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* =====================================================================
                PANEL 4: Pen Tool & Chart Drawing
               ===================================================================== */}
            <div className="bg-[#121926] border border-[#212e45] rounded-xl overflow-hidden">
              <div
                onClick={() => togglePanel('drawing_pen')}
                className="px-3.5 py-3 flex items-center justify-between cursor-pointer hover:bg-[#162030] transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                    <PenTool className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-white text-xs">4. Pen & Drawing Tools</div>
                    <div className="text-[10px] text-slate-400">
                      {activeDrawingTool !== 'none'
                        ? `Active Tool: ${activeDrawingTool.toUpperCase()}`
                        : `${drawnLines.length} drawn lines on chart`}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveDrawingTool(activeDrawingTool === 'none' ? 'trendline' : 'none');
                    }}
                    className={`px-2 py-0.5 rounded text-[10px] font-black cursor-pointer ${
                      activeDrawingTool !== 'none'
                        ? 'bg-amber-400 text-slate-950'
                        : 'bg-[#222e42] text-slate-400'
                    }`}
                  >
                    {activeDrawingTool !== 'none' ? 'ON' : 'OFF'}
                  </button>
                  {openPanelId === 'drawing_pen' ? (
                    <ChevronUp className="w-4 h-4 text-cyan-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </div>
              </div>

              {openPanelId === 'drawing_pen' && (
                <div className="px-3.5 pb-3.5 pt-2 border-t border-[#1d293e] bg-[#0e141f] space-y-2.5">
                  <div className="grid grid-cols-3 gap-1.5">
                    {(
                      [
                        { id: 'crosshair', label: '+ 4-Line Crosshair' },
                        { id: 'channel', label: 'Custom Shape (4 Dots)' },
                        { id: 'rectangle', label: 'Box (4 Dots)' },
                        { id: 'trendline', label: 'Trend Line' },
                        { id: 'horizontal', label: 'Support/Res' },
                        { id: 'vertical', label: 'Vertical' },
                        { id: 'ray', label: 'Ray Line' },
                        { id: 'freehand', label: 'Free Pen' },
                        { id: 'fibonacci', label: 'Fibonacci' }
                      ] as const
                    ).map((t) => (
                      <button
                        key={t.id}
                        onClick={() => {
                          setActiveDrawingTool(activeDrawingTool === t.id ? 'none' : t.id);
                          setShowThreeLineMenu(false);
                        }}
                        className={`py-1.5 px-2 rounded-lg text-[10px] font-bold border cursor-pointer ${
                          activeDrawingTool === t.id
                            ? 'bg-amber-400 text-slate-950 border-amber-300 font-black'
                            : 'bg-[#141c2b] text-slate-300 border-[#223049] hover:text-white'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}

                    <button
                      onClick={() => setActiveDrawingTool('none')}
                      className="py-1.5 px-2 rounded-lg text-[10px] font-bold bg-[#1f293d] text-slate-300 hover:text-white cursor-pointer"
                    >
                      Turn Off Pen
                    </button>
                  </div>

                  {drawnLines.length > 0 && (
                    <button
                      onClick={clearDrawnLines}
                      className="w-full py-1.5 rounded-lg bg-rose-950/50 border border-rose-500/30 text-rose-300 text-[11px] font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Clear All Drawn Lines ({drawnLines.length})</span>
                    </button>
                  )}

                  <div className="flex justify-end pt-1">
                    <button
                      onClick={() => setOpenPanelId(null)}
                      className="px-2.5 py-1 rounded-lg bg-[#1b2538] text-slate-300 hover:text-white text-[10px] font-bold cursor-pointer"
                    >
                      Close Panel
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* =====================================================================
                PANEL 5: Technical Indicators (100+ Lines) ON/OFF
               ===================================================================== */}
            <div className="bg-[#121926] border border-[#212e45] rounded-xl overflow-hidden">
              <div
                onClick={() => togglePanel('indicators')}
                className="px-3.5 py-3 flex items-center justify-between cursor-pointer hover:bg-[#162030] transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
                    <Sliders className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-white text-xs">5. Technical Indicators (100+)</div>
                    <div className="text-[10px] text-slate-400">
                      {indicatorsEnabled ? `${activeIndicatorIds.length} active lines` : 'Indicators Hidden (OFF)'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIndicatorsEnabled(!indicatorsEnabled);
                    }}
                    className={`px-2 py-0.5 rounded text-[10px] font-black cursor-pointer ${
                      indicatorsEnabled ? 'bg-cyan-500 text-slate-950' : 'bg-[#222e42] text-slate-400'
                    }`}
                  >
                    {indicatorsEnabled ? 'ON' : 'OFF'}
                  </button>
                  {openPanelId === 'indicators' ? (
                    <ChevronUp className="w-4 h-4 text-cyan-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </div>
              </div>

              {openPanelId === 'indicators' && (
                <div className="px-3.5 pb-3.5 pt-2 border-t border-[#1d293e] bg-[#0e141f] space-y-2">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-[#141c2b] border border-[#1f2c40]">
                    <span className="text-xs font-bold text-white">Show Indicator Lines on Chart</span>
                    <button
                      onClick={() => setIndicatorsEnabled(!indicatorsEnabled)}
                      className={`px-2.5 py-1 rounded-lg font-black text-[10px] cursor-pointer ${
                        indicatorsEnabled ? 'bg-emerald-500 text-slate-950' : 'bg-[#222e42] text-slate-400'
                      }`}
                    >
                      {indicatorsEnabled ? 'ON' : 'OFF'}
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5">
                    {(
                      [
                        { key: 'sma', label: 'SMA (10)' },
                        { key: 'ema', label: 'EMA (21)' },
                        { key: 'bbands', label: 'Bollinger Bands' },
                        { key: 'rsi', label: 'RSI (14)' },
                        { key: 'macd', label: 'MACD' },
                        { key: 'stoch', label: 'Stochastic' }
                      ] as const
                    ).map((item) => {
                      const isOn = Boolean(indicators[item.key]);
                      return (
                        <button
                          key={item.key}
                          onClick={() =>
                            setIndicators((prev) => ({ ...prev, [item.key]: !prev[item.key] }))
                          }
                          className={`p-2 rounded-lg border flex items-center justify-between text-[11px] font-bold cursor-pointer ${
                            isOn
                              ? 'bg-[#18263a] border-cyan-400 text-cyan-300'
                              : 'bg-[#141c2b] border-[#1f2c40] text-slate-400'
                          }`}
                        >
                          <span>{item.label}</span>
                          <span className="text-[9px] font-black">{isOn ? 'ON' : 'OFF'}</span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => {
                        setShowThreeLineMenu(false);
                        if (onOpenIndicators) onOpenIndicators();
                      }}
                      className="flex-1 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs cursor-pointer"
                    >
                      Open All 100+ Indicators
                    </button>
                    {activeIndicatorIds.length > 0 && (
                      <button
                        onClick={clearAllActiveIndicators}
                        className="py-2 px-3 rounded-lg bg-rose-950/60 border border-rose-500/40 text-rose-300 font-bold text-xs cursor-pointer"
                      >
                        Clear All
                      </button>
                    )}
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      onClick={() => setOpenPanelId(null)}
                      className="px-2.5 py-1 rounded-lg bg-[#1b2538] text-slate-300 hover:text-white text-[10px] font-bold cursor-pointer"
                    >
                      Close Panel
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* =====================================================================
                PANEL 6: Candle Style & Color Scheme
               ===================================================================== */}
            <div className="bg-[#121926] border border-[#212e45] rounded-xl overflow-hidden">
              <div
                onClick={() => togglePanel('candle_style')}
                className="px-3.5 py-3 flex items-center justify-between cursor-pointer hover:bg-[#162030] transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                    <Palette className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-white text-xs">6. Candle Type & Color Scheme</div>
                    <div className="text-[10px] text-slate-400">
                      {chartType.toUpperCase()} • {CANDLE_COLOR_SCHEMES[candleColorScheme]?.label}
                    </div>
                  </div>
                </div>

                {openPanelId === 'candle_style' ? (
                  <ChevronUp className="w-4 h-4 text-cyan-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                )}
              </div>

              {openPanelId === 'candle_style' && (
                <div className="px-3.5 pb-3.5 pt-2 border-t border-[#1d293e] bg-[#0e141f] space-y-2.5">
                  <div className="grid grid-cols-2 gap-1.5">
                    {chartTypes.map((ct) => (
                      <button
                        key={ct.type}
                        onClick={() => setChartType(ct.type)}
                        className={`p-2 rounded-lg border flex items-center gap-1.5 text-xs font-bold cursor-pointer ${
                          chartType === ct.type
                            ? 'bg-[#1a263b] border-cyan-400 text-cyan-300'
                            : 'bg-[#141c2b] border-[#1f2c40] text-slate-400'
                        }`}
                      >
                        {ct.icon}
                        <span>{ct.label}</span>
                      </button>
                    ))}
                  </div>

                  <div className="space-y-1.5">
                    {(Object.keys(CANDLE_COLOR_SCHEMES) as CandleColorScheme[]).map((schemeKey) => {
                      const palette = CANDLE_COLOR_SCHEMES[schemeKey];
                      const active = candleColorScheme === schemeKey;
                      return (
                        <button
                          key={schemeKey}
                          onClick={() => setCandleColorScheme(schemeKey)}
                          className={`w-full px-2.5 py-2 rounded-lg border flex items-center justify-between text-left transition-colors cursor-pointer ${
                            active
                              ? 'bg-[#1a263b] border-cyan-400 text-white'
                              : 'bg-[#141c2b] border-[#1f2c40] text-slate-300'
                          }`}
                        >
                          <span className="font-bold text-[11px]">{palette.label}</span>
                          <div className="flex items-center gap-1.5">
                            <span
                              className="w-3 h-3 rounded-xs inline-block"
                              style={{ backgroundColor: palette.bullish }}
                            />
                            <span
                              className="w-3 h-3 rounded-xs inline-block"
                              style={{ backgroundColor: palette.bearish }}
                            />
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      onClick={() => setOpenPanelId(null)}
                      className="px-2.5 py-1 rounded-lg bg-[#1b2538] text-slate-300 hover:text-white text-[10px] font-bold cursor-pointer"
                    >
                      Close Panel
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* =====================================================================
                PANEL 7: Notifications, Result P/F Popup & Sound FX
               ===================================================================== */}
            <div className="bg-[#121926] border border-[#212e45] rounded-xl overflow-hidden">
              <div
                onClick={() => togglePanel('notifications_sound')}
                className="px-3.5 py-3 flex items-center justify-between cursor-pointer hover:bg-[#162030] transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <Volume2 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-white text-xs">7. Result P/F, Popups & Sound FX</div>
                    <div className="text-[10px] text-slate-400">
                      Result P/F: {showResultPopupEnabled ? 'ON' : 'OFF'} • Sound: {soundEnabled ? 'ON' : 'OFF'}
                    </div>
                  </div>
                </div>

                {openPanelId === 'notifications_sound' ? (
                  <ChevronUp className="w-4 h-4 text-cyan-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                )}
              </div>

              {openPanelId === 'notifications_sound' && (
                <div className="px-3.5 pb-3.5 pt-2 border-t border-[#1d293e] bg-[#0e141f] space-y-2">
                  {/* Compact Result (P/F) Bubble Toggle */}
                  <div className="flex items-center justify-between p-2 rounded-lg bg-[#141c2b] border border-[#1f2c40]">
                    <div>
                      <div className="font-bold text-white text-xs">Compact Result (P/F) Box</div>
                      <div className="text-[10px] text-slate-400">Small P/F result box next to candle</div>
                    </div>
                    <button
                      onClick={() => setShowResultPopupEnabled(!showResultPopupEnabled)}
                      className={`px-2.5 py-1 rounded-lg font-black text-[10px] cursor-pointer ${
                        showResultPopupEnabled
                          ? 'bg-emerald-500 text-slate-950'
                          : 'bg-[#222e42] text-slate-400'
                      }`}
                    >
                      {showResultPopupEnabled ? 'ON' : 'OFF'}
                    </button>
                  </div>

                  {/* Order Placement Toast Toggle */}
                  <div className="flex items-center justify-between p-2 rounded-lg bg-[#141c2b] border border-[#1f2c40]">
                    <div>
                      <div className="font-bold text-white text-xs">Trade Order Toast Popup</div>
                      <div className="text-[10px] text-slate-400">Notification when placing Buy/Sell</div>
                    </div>
                    <button
                      onClick={() => setShowOrderToastEnabled(!showOrderToastEnabled)}
                      className={`px-2.5 py-1 rounded-lg font-black text-[10px] cursor-pointer ${
                        showOrderToastEnabled
                          ? 'bg-emerald-500 text-slate-950'
                          : 'bg-[#222e42] text-slate-400'
                      }`}
                    >
                      {showOrderToastEnabled ? 'ON' : 'OFF'}
                    </button>
                  </div>

                  {/* Sound FX Toggle */}
                  <div className="flex items-center justify-between p-2 rounded-lg bg-[#141c2b] border border-[#1f2c40]">
                    <div>
                      <div className="font-bold text-white text-xs">Sound FX Audio</div>
                      <div className="text-[10px] text-slate-400">Audio chime on trades & results</div>
                    </div>
                    <button
                      onClick={() => setSoundEnabled(!soundEnabled)}
                      className={`px-2.5 py-1 rounded-lg font-black text-[10px] cursor-pointer ${
                        soundEnabled ? 'bg-emerald-500 text-slate-950' : 'bg-[#222e42] text-slate-400'
                      }`}
                    >
                      {soundEnabled ? 'ON' : 'OFF'}
                    </button>
                  </div>

                  {/* Promo Banner Toggle */}
                  <div className="flex items-center justify-between p-2 rounded-lg bg-[#141c2b] border border-[#1f2c40]">
                    <div>
                      <div className="font-bold text-white text-xs">50% Deposit Bonus Banner</div>
                      <div className="text-[10px] text-slate-400">Top green bonus strip</div>
                    </div>
                    <button
                      onClick={() => setShowPromoBanner(!showPromoBanner)}
                      className={`px-2.5 py-1 rounded-lg font-black text-[10px] cursor-pointer ${
                        showPromoBanner ? 'bg-emerald-500 text-slate-950' : 'bg-[#222e42] text-slate-400'
                      }`}
                    >
                      {showPromoBanner ? 'ON' : 'OFF'}
                    </button>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      onClick={() => setOpenPanelId(null)}
                      className="px-2.5 py-1 rounded-lg bg-[#1b2538] text-slate-300 hover:text-white text-[10px] font-bold cursor-pointer"
                    >
                      Close Panel
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* =====================================================================
                PANEL 8: Leaderboard & Trader Profile Setup
               ===================================================================== */}
            <div className="bg-[#121926] border border-[#212e45] rounded-xl overflow-hidden">
              <div
                onClick={() => togglePanel('leaderboard')}
                className="px-3.5 py-3 flex items-center justify-between cursor-pointer hover:bg-[#162030] transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                    <Trophy className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-white text-xs">8. Leaderboard & Trader Profile</div>
                    <div className="text-[10px] text-slate-400">
                      {traderFlag} {traderName}
                    </div>
                  </div>
                </div>

                {openPanelId === 'leaderboard' ? (
                  <ChevronUp className="w-4 h-4 text-cyan-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                )}
              </div>

              {openPanelId === 'leaderboard' && (
                <div className="px-3.5 pb-3.5 pt-2 border-t border-[#1d293e] bg-[#0e141f] space-y-2.5">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Your Trader Name:</label>
                    <input
                      type="text"
                      value={traderName}
                      onChange={(e) => setTraderName(e.target.value)}
                      placeholder="YA TRADER"
                      className="w-full bg-[#0a0f18] border border-[#25334a] rounded-lg px-2.5 py-1.5 text-white font-bold text-xs outline-none focus:border-cyan-400"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Country Flag:</label>
                    <div className="flex flex-wrap gap-1">
                      {flags.map((flg) => (
                        <button
                          key={flg}
                          onClick={() => setTraderFlag(flg)}
                          className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm border cursor-pointer ${
                            traderFlag === flg
                              ? 'bg-cyan-500/20 border-cyan-400'
                              : 'bg-[#141c2b] border-[#223049]'
                          }`}
                        >
                          {flg}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">Your Profit ($):</label>
                      <input
                        type="number"
                        step="0.01"
                        value={profitInput}
                        onChange={(e) => {
                          setProfitInput(e.target.value);
                          const parsed = parseFloat(e.target.value);
                          if (!isNaN(parsed)) {
                            setCustomLeaderboardProfit(parsed);
                          } else {
                            setCustomLeaderboardProfit(null);
                          }
                        }}
                        className="w-full bg-[#0a0f18] border border-[#25334a] rounded-lg px-2 py-1.5 text-white font-mono-num text-xs outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block mb-1">Your Position:</label>
                      <input
                        type="number"
                        value={rankInput}
                        onChange={(e) => {
                          setRankInput(e.target.value);
                          const parsed = parseInt(e.target.value, 10);
                          if (!isNaN(parsed) && parsed > 0) {
                            setCustomLeaderboardRank(parsed);
                          } else {
                            setCustomLeaderboardRank(null);
                          }
                        }}
                        className="w-full bg-[#0a0f18] border border-[#25334a] rounded-lg px-2 py-1.5 text-white font-mono-num text-xs outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    {onOpenLeaderboard && (
                      <button
                        onClick={() => {
                          setShowThreeLineMenu(false);
                          onOpenLeaderboard();
                        }}
                        className="text-xs text-amber-400 hover:underline font-bold cursor-pointer"
                      >
                        Open Leaderboard →
                      </button>
                    )}
                    <button
                      onClick={() => setOpenPanelId(null)}
                      className="px-2.5 py-1 rounded-lg bg-[#1b2538] text-slate-300 hover:text-white text-[10px] font-bold cursor-pointer"
                    >
                      Close Panel
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* =====================================================================
                PANEL 9: Chart Watermark & Background
               ===================================================================== */}
            <div className="bg-[#121926] border border-[#212e45] rounded-xl overflow-hidden">
              <div
                onClick={() => togglePanel('watermark_bg')}
                className="px-3.5 py-3 flex items-center justify-between cursor-pointer hover:bg-[#162030] transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
                    <ImageIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-white text-xs">9. Watermark & Chart Background</div>
                    <div className="text-[10px] text-slate-400">
                      {watermarkEnabled ? `${watermarkSize}px • ${Math.round(watermarkOpacity * 100)}%` : 'Watermark OFF'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setWatermarkEnabled(!watermarkEnabled);
                    }}
                    className={`px-2 py-0.5 rounded text-[10px] font-black cursor-pointer ${
                      watermarkEnabled ? 'bg-cyan-500 text-slate-950' : 'bg-[#222e42] text-slate-400'
                    }`}
                  >
                    {watermarkEnabled ? 'ON' : 'OFF'}
                  </button>
                  {openPanelId === 'watermark_bg' ? (
                    <ChevronUp className="w-4 h-4 text-cyan-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </div>
              </div>

              {openPanelId === 'watermark_bg' && (
                <div className="px-3.5 pb-3.5 pt-2 border-t border-[#1d293e] bg-[#0e141f] space-y-2.5">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-[#141c2b] border border-[#1f2c40]">
                    <span className="font-bold text-white text-xs">Show Chart Watermark</span>
                    <button
                      onClick={() => setWatermarkEnabled(!watermarkEnabled)}
                      className={`px-2.5 py-1 rounded-lg font-black text-[10px] cursor-pointer ${
                        watermarkEnabled ? 'bg-emerald-500 text-slate-950' : 'bg-[#222e42] text-slate-400'
                      }`}
                    >
                      {watermarkEnabled ? 'ON' : 'OFF'}
                    </button>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-[11px] text-slate-300 font-semibold mb-1.5">
                      <span>Watermark Zoom / Size (10x - 1000x):</span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setWatermarkSize(Math.max(10, watermarkSize - 25))}
                          className="px-1.5 py-0.5 rounded bg-[#1b2538] text-white font-bold text-xs cursor-pointer"
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
                          className="w-16 bg-[#0a0f18] border border-[#25334a] rounded px-1.5 py-0.5 text-center text-cyan-400 font-mono font-bold text-xs outline-none"
                        />
                        <span className="text-[10px] text-cyan-400 font-mono font-bold">x</span>
                        <button
                          type="button"
                          onClick={() => setWatermarkSize(Math.min(1000, watermarkSize + 25))}
                          className="px-1.5 py-0.5 rounded bg-[#1b2538] text-white font-bold text-xs cursor-pointer"
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
                      className="w-full accent-cyan-400 cursor-pointer h-2 bg-[#141c2b] rounded-lg"
                    />
                    <div className="mt-1.5 grid grid-cols-6 gap-1">
                      {[50, 150, 300, 500, 750, 1000].map((sz) => (
                        <button
                          type="button"
                          key={sz}
                          onClick={() => setWatermarkSize(sz)}
                          className={`py-1 rounded text-[10px] font-mono font-bold border transition-all cursor-pointer ${
                            watermarkSize === sz
                              ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-black'
                              : 'bg-[#141c2b] text-slate-300 border-[#222e42] hover:text-white'
                          }`}
                        >
                          {sz}x
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] text-slate-300 font-semibold mb-1">
                      <span>Watermark Opacity (1% - 100%):</span>
                      <span className="text-cyan-400 font-mono font-bold">{Math.round(watermarkOpacity * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.02"
                      max="1"
                      step="0.02"
                      value={watermarkOpacity}
                      onChange={(e) => setWatermarkOpacity(parseFloat(e.target.value))}
                      className="w-full accent-cyan-400 cursor-pointer h-2 bg-[#141c2b] rounded-lg"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-1.5">
                    {(['both', 'logo', 'text'] as const).map((mode) => (
                      <button
                        type="button"
                        key={mode}
                        onClick={() => setWatermarkType(mode)}
                        className={`py-1.5 px-2 rounded-lg text-[10px] font-bold uppercase cursor-pointer ${
                          watermarkType === mode
                            ? 'bg-cyan-500 text-slate-950 font-black'
                            : 'bg-[#141c2b] text-slate-400'
                        }`}
                      >
                        {mode === 'both' ? 'Logo + Text' : mode === 'logo' ? 'Logo Only' : 'Text Only'}
                      </button>
                    ))}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-300 block">
                      Custom Watermark Image URL or Upload:
                    </label>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        placeholder="Paste any image URL (https://... or data:image/...)"
                        value={logoImageUrl}
                        onChange={(e) => {
                          setLogoImageUrl(e.target.value);
                          if (e.target.value.trim() && !watermarkEnabled) {
                            setWatermarkEnabled(true);
                          }
                        }}
                        className="flex-1 bg-[#0a0f18] border border-[#25334a] focus:border-cyan-400 rounded-lg px-2.5 py-1.5 text-white font-mono text-xs outline-none"
                      />
                      {logoImageUrl && (
                        <button
                          type="button"
                          onClick={() => setLogoImageUrl('')}
                          className="px-2 py-1 rounded-lg bg-rose-950/60 text-rose-300 text-[10px] font-bold cursor-pointer shrink-0"
                        >
                          Reset
                        </button>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-0.5">
                      <label className="flex-1 py-1.5 px-2.5 rounded-lg bg-[#141c2b] hover:bg-[#1b263b] border border-[#25334a] text-cyan-300 text-[10px] font-bold text-center cursor-pointer transition-colors">
                        <span>📁 Choose Image From Phone / Gallery</span>
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
                                setWatermarkEnabled(true);
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
                          className="w-8 h-8 rounded border border-cyan-500/40 object-contain bg-[#0a0f18] shrink-0"
                        />
                      )}
                    </div>

                    {/* Direct 3-Candlesticks Logo (apple-touch-icon.png) Download & URL Box */}
                    <div className="p-2 rounded-lg bg-[#121a28] border border-emerald-500/30 space-y-1.5 mt-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <img
                            src="/apple-touch-icon.png?v=3"
                            alt="Candlestick Logo"
                            className="w-7 h-7 rounded-md object-contain bg-[#0a0f18] border border-emerald-500/30 shrink-0"
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

                  <div>
                    <label className="text-[10px] font-bold text-slate-300 block mb-1">
                      Custom Chart Background URL (Optional):
                    </label>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        placeholder="Paste chart background image URL..."
                        value={backgroundImageUrl}
                        onChange={(e) => setBackgroundImageUrl(e.target.value)}
                        className="flex-1 bg-[#0a0f18] border border-[#25334a] focus:border-cyan-400 rounded-lg px-2.5 py-1.5 text-white font-mono text-xs outline-none"
                      />
                      {backgroundImageUrl && (
                        <button
                          type="button"
                          onClick={() => setBackgroundImageUrl('')}
                          className="px-2 py-1 rounded-lg bg-rose-950/60 text-rose-300 text-[10px] font-bold cursor-pointer shrink-0"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      onClick={() => setOpenPanelId(null)}
                      className="px-2.5 py-1 rounded-lg bg-[#1b2538] text-slate-300 hover:text-white text-[10px] font-bold cursor-pointer"
                    >
                      Close Panel
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* =====================================================================
                PANEL 10: Deposit, Withdrawal & Transaction History Records
               ===================================================================== */}
            <div className="bg-[#121926] border border-[#212e45] rounded-xl overflow-hidden">
              <div
                onClick={() => togglePanel('cashier_history')}
                className="px-3.5 py-3 flex items-center justify-between cursor-pointer hover:bg-[#162030] transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <History className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-white text-xs">10. Cashier & History Records</div>
                    <div className="text-[10px] text-slate-400">
                      {deposits.length} Deposits • {withdrawals.length} Withdrawals • {tradeHistory.length} Trades
                    </div>
                  </div>
                </div>

                {openPanelId === 'cashier_history' ? (
                  <ChevronUp className="w-4 h-4 text-cyan-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                )}
              </div>

              {openPanelId === 'cashier_history' && (
                <div className="px-3.5 pb-3.5 pt-2 border-t border-[#1d293e] bg-[#0e141f] space-y-2">
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      onClick={() => {
                        setShowThreeLineMenu(false);
                        onOpenDeposit();
                      }}
                      className="p-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <ArrowDownLeft className="w-4 h-4" />
                      <span>Deposit Funds</span>
                    </button>

                    <button
                      onClick={() => {
                        setShowThreeLineMenu(false);
                        onOpenWithdraw();
                      }}
                      className="p-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <ArrowUpRight className="w-4 h-4" />
                      <span>Withdraw Funds</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      onClick={() => {
                        setShowThreeLineMenu(false);
                        onOpenHistory('deposits');
                      }}
                      className="py-2 px-2 rounded-lg bg-[#141c2b] hover:bg-[#1b263b] border border-[#223049] text-emerald-400 font-bold text-[10px] cursor-pointer text-center"
                    >
                      Deposits ({deposits.length})
                    </button>

                    <button
                      onClick={() => {
                        setShowThreeLineMenu(false);
                        onOpenHistory('withdrawals');
                      }}
                      className="py-2 px-2 rounded-lg bg-[#141c2b] hover:bg-[#1b263b] border border-[#223049] text-purple-400 font-bold text-[10px] cursor-pointer text-center"
                    >
                      Withdraws ({withdrawals.length})
                    </button>

                    <button
                      onClick={() => {
                        setShowThreeLineMenu(false);
                        onOpenHistory('trades');
                      }}
                      className="py-2 px-2 rounded-lg bg-[#141c2b] hover:bg-[#1b263b] border border-[#223049] text-cyan-400 font-bold text-[10px] cursor-pointer text-center"
                    >
                      Trades ({tradeHistory.length})
                    </button>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      onClick={() => setOpenPanelId(null)}
                      className="px-2.5 py-1 rounded-lg bg-[#1b2538] text-slate-300 hover:text-white text-[10px] font-bold cursor-pointer"
                    >
                      Close Panel
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* =====================================================================
                PANEL: Quotex 24/7 Help & Support Desk ("meanu ka all feature wapasa lao")
               ===================================================================== */}
            {(menuFilterCategory === 'ALL' || menuFilterCategory === 'TOOLS') && (
              <div className="bg-[#121926] border border-emerald-500/30 rounded-xl overflow-hidden shadow-sm">
                <div
                  onClick={() => togglePanel('support')}
                  className="px-3.5 py-3 flex items-center justify-between cursor-pointer hover:bg-[#162030] transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
                      <HelpCircle className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-white text-xs flex items-center gap-1.5">
                        <span>24/7 Support & Verification</span>
                        <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-1 rounded font-black">
                          ONLINE
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Live chat desk, KYC status & trading FAQ
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {openPanelId === 'support' ? (
                      <ChevronUp className="w-4 h-4 text-cyan-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                </div>

                {openPanelId === 'support' && (
                  <div className="p-3 space-y-2.5 border-t border-[#1e2a3c] bg-[#0c121d]">
                    <div className="bg-[#141d2c] p-2.5 rounded-xl border border-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                        <div>
                          <div className="text-white font-extrabold text-xs">Profile Status: Verified ✓</div>
                          <div className="text-[9px] text-slate-400">Level 3 VIP Tier • Unlimited Withdrawals</div>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold text-[9px]">
                        ACTIVE
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="text-[10px] uppercase font-bold text-slate-400">Quick Assistance</div>
                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          onClick={() => {
                            if (onOpenSupport) onOpenSupport();
                            else alert('24/7 Support Agent is Online! You can submit inquiries anytime.');
                          }}
                          className="py-2 px-2.5 rounded-lg bg-[#182337] hover:bg-[#202f4a] text-cyan-300 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer border border-cyan-500/30"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Live Chat</span>
                        </button>
                        <button
                          onClick={() => {
                            alert('Quotex Platform Help: Instant execution, 0% fees on deposits/withdrawals, 100+ Indicators, and 24/7 OTC trading.');
                          }}
                          className="py-2 px-2.5 rounded-lg bg-[#182337] hover:bg-[#202f4a] text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer border border-white/10"
                        >
                          <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
                          <span>Trading FAQ</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Drawer Sticky Footer */}
          <div className="p-3 bg-[#111723] border-t border-[#1f2a3c] shrink-0">
            <button
              onClick={() => setShowThreeLineMenu(false)}
              className="w-full py-2.5 rounded-xl bg-[#00e599] hover:bg-[#00d084] active:scale-[0.99] text-slate-950 font-black text-xs cursor-pointer shadow-md transition-all flex items-center justify-center gap-1.5"
            >
              <span>Close Menu & Return to Chart</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4. Glass PIN Lock Modal with PIN 1234 ("aur meanu ma lock lagao 1234 ok fix") */}
      {showMenuPinLock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 select-none animate-fadeIn">
          {/* Dark Glass Backdrop */}
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity"
            onClick={() => setShowMenuPinLock(false)}
          />

          {/* Glass Dialog Card */}
          <div
            className={`relative w-full max-w-[330px] bg-gradient-to-b from-[#162032]/95 via-[#101726]/95 to-[#0b101a]/98 border rounded-2xl p-5 shadow-[0_16px_40px_rgba(0,0,0,0.85)] backdrop-blur-xl z-10 transition-all ${
              pinError
                ? 'border-rose-500/80 shadow-[0_0_30px_rgba(244,63,94,0.4)]'
                : pinSuccess
                ? 'border-emerald-400/80 shadow-[0_0_30px_rgba(16,185,129,0.4)]'
                : 'border-white/15'
            }`}
          >
            {/* Close button */}
            <button
              onClick={() => setShowMenuPinLock(false)}
              className="absolute top-3.5 right-3.5 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header */}
            <div className="flex flex-col items-center text-center">
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-2.5 shadow-lg transition-all ${
                  pinSuccess
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/50'
                    : pinError
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-400/50'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-400/50'
                }`}
              >
                {pinSuccess ? (
                  <ShieldCheck className="w-6 h-6 stroke-[2.2]" />
                ) : (
                  <Lock className="w-6 h-6 stroke-[2.2]" />
                )}
              </div>

              <h3 className="text-base font-black text-white tracking-wide flex items-center gap-1.5">
                <span>Menu Security Lock</span>
                <span className="text-[9px] bg-emerald-500/25 text-emerald-300 border border-emerald-400/40 px-1.5 py-0.2 rounded font-black">
                  ALL 15 FEATURES INTACT
                </span>
              </h3>
              <p className="text-[11px] text-slate-300 mt-1 font-medium">
                Enter PIN <span className="text-cyan-300 font-bold font-mono">1234</span> to access all 15 Quotex menu features
              </p>

              {/* 4 Digit Dots */}
              <div className="flex items-center gap-3 my-3.5">
                {[0, 1, 2, 3].map((idx) => {
                  const isFilled = menuPinInput.length > idx;
                  return (
                    <div
                      key={idx}
                      className={`w-3.5 h-3.5 rounded-full transition-all duration-200 ${
                        pinSuccess
                          ? 'bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.8)] scale-110'
                          : pinError
                          ? 'bg-rose-400 shadow-[0_0_12px_rgba(251,113,133,0.8)] scale-110'
                          : isFilled
                          ? 'bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.7)] scale-110'
                          : 'bg-[#1e2a3c] border border-white/20'
                      }`}
                    />
                  );
                })}
              </div>

              {/* Status message */}
              <div className="h-4 text-[10.5px] font-bold text-center">
                {pinError ? (
                  <span className="text-rose-400">Incorrect PIN! Password is 1234</span>
                ) : pinSuccess ? (
                  <span className="text-emerald-400">PIN Verified! Opening Menu...</span>
                ) : (
                  <span className="text-slate-400 text-[10px]">Enter 4 digits using keypad</span>
                )}
              </div>
            </div>

            {/* Numeric Keypad Grid */}
            <div className="grid grid-cols-3 gap-1.5 mt-3">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                <button
                  key={digit}
                  onClick={() => handlePinDigit(digit)}
                  className="h-10 rounded-xl bg-[#141d2c]/80 hover:bg-[#1f2b40] active:scale-95 border border-white/10 text-white font-mono-num font-extrabold text-base transition-all flex items-center justify-center shadow-md cursor-pointer"
                >
                  {digit}
                </button>
              ))}
              <button
                onClick={handlePinClear}
                className="h-10 rounded-xl bg-[#141d2c]/60 hover:bg-rose-950/40 active:scale-95 border border-white/10 text-rose-300 font-bold text-xs transition-all flex items-center justify-center cursor-pointer"
              >
                Clear
              </button>
              <button
                onClick={() => handlePinDigit('0')}
                className="h-10 rounded-xl bg-[#141d2c]/80 hover:bg-[#1f2b40] active:scale-95 border border-white/10 text-white font-mono-num font-extrabold text-base transition-all flex items-center justify-center shadow-md cursor-pointer"
              >
                0
              </button>
              <button
                onClick={handlePinBackspace}
                className="h-10 rounded-xl bg-[#141d2c]/60 hover:bg-[#1f2b40] active:scale-95 border border-white/10 text-slate-300 hover:text-white font-bold text-xs transition-all flex items-center justify-center cursor-pointer"
                title="Backspace"
              >
                ⌫
              </button>
            </div>

            {/* Quick 1234 auto-fill helper button for convenience */}
            <button
              onClick={() => {
                setMenuPinInput('1234');
                setPinSuccess(true);
                setTimeout(() => {
                  setIsMenuUnlocked(true);
                  setShowMenuPinLock(false);
                  setMenuPinInput('');
                  setPinSuccess(false);
                  setOpenPanelId(null);
                  setShowThreeLineMenu(true);
                }, 350);
              }}
              className="w-full mt-3 py-1.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-400/30 text-cyan-300 font-bold text-[11px] transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Unlock with PIN: 1234</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
