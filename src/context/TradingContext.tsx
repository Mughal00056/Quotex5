import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import {
  Asset,
  Candle,
  Trade,
  TradeDirection,
  TradeStatus,
  AccountType,
  DepositTransaction,
  WithdrawalTransaction,
  ChartType,
  CandleColorScheme,
  IndicatorSettings,
  MarketBehaviorMode,
  DrawnLine,
  DrawingToolType,
  OrderToast,
  WatermarkType
} from '../types/trading';
import { INITIAL_ASSETS, generateHistoricalCandles } from '../constants/assets';
import { sounds } from '../utils/audio';

const ONE_DAY_MS = 24 * 60 * 60 * 1000; // 24 hours (1 day) retention for trades

interface TradingContextType {
  // Accounts
  accountType: AccountType;
  setAccountType: (type: AccountType) => void;
  demoBalance: number;
  realBalance: number;
  resetDemoBalance: () => void;
  setRealBalanceDirect: (amount: number) => void;
  removeRealMoney: (amount?: number) => void;
  isVipPurpleLive: boolean;

  // Assets & Separate Graphs per Asset
  assets: Asset[];
  activeAsset: Asset;
  setActiveAsset: (asset: Asset) => void;
  candles: Candle[];
  timeframe: number;
  setTimeframe: (seconds: number) => void;
  chartType: ChartType;
  setChartType: (type: ChartType) => void;
  candleColorScheme: CandleColorScheme;
  setCandleColorScheme: (scheme: CandleColorScheme) => void;
  indicators: IndicatorSettings;
  setIndicators: React.Dispatch<React.SetStateAction<IndicatorSettings>>;

  // Drawing Tools (Interactive Pen Tool on Chart)
  drawnLines: DrawnLine[];
  addDrawnLine: (line: Omit<DrawnLine, 'id'>) => void;
  updateDrawnLine: (id: string, updates: Partial<DrawnLine>) => void;
  removeDrawnLine: (id: string) => void;
  undoLastDrawnLine: () => void;
  clearDrawnLines: () => void;
  activeDrawingTool: DrawingToolType;
  setActiveDrawingTool: (tool: DrawingToolType) => void;
  drawingColor: string;
  setDrawingColor: (color: string) => void;

  // UI & Visibility Toggles (Individual ON/OFF Feature Controls)
  showChartButtons: boolean;
  setShowChartButtons: (show: boolean) => void;
  showEyeButton: boolean;
  setShowEyeButton: (show: boolean) => void;
  showBagButton: boolean;
  setShowBagButton: (show: boolean) => void;
  showPenButton: boolean;
  setShowPenButton: (show: boolean) => void;
  showZoomControls: boolean;
  setShowZoomControls: (show: boolean) => void;
  watermarkEnabled: boolean;
  setWatermarkEnabled: (enabled: boolean) => void;
  indicatorsEnabled: boolean;
  setIndicatorsEnabled: (enabled: boolean) => void;
  showResultPopupEnabled: boolean;
  setShowResultPopupEnabled: (enabled: boolean) => void;
  showHeaderExtraButtons: boolean;
  setShowHeaderExtraButtons: (show: boolean) => void;
  showOrderToastEnabled: boolean;
  setShowOrderToastEnabled: (enabled: boolean) => void;

  // Leaderboard User Identity
  traderName: string;
  setTraderName: (name: string) => void;
  traderFlag: string;
  setTraderFlag: (flag: string) => void;
  customLeaderboardProfit: number | null;
  setCustomLeaderboardProfit: (profit: number | null) => void;
  customLeaderboardRank: number | null;
  setCustomLeaderboardRank: (rank: number | null) => void;

  // Market & Engine Mode (Win / Force Loss / Real Mix)
  isOnlineMode: boolean;
  setIsOnlineMode: (online: boolean) => void;
  marketBehaviorMode: MarketBehaviorMode;
  setMarketBehaviorMode: (mode: MarketBehaviorMode) => void;

  // Trading Actions
  activeTrades: Trade[];
  tradeHistory: Trade[];
  removeTradeFromHistory: (id: string) => void;
  placeTrade: (direction: TradeDirection, amount: number, durationSeconds: number) => boolean;
  lastClosedTrade: Trade | null;
  clearLastClosedTrade: () => void;
  orderToast: OrderToast | null;
  clearOrderToast: () => void;

  // Cashier
  deposits: DepositTransaction[];
  withdrawals: WithdrawalTransaction[];
  depositFunds: (amount: number, method: string, promoCode?: string, senderDetails?: string) => DepositTransaction;
  withdrawFunds: (amount: number, method: string, destinationAccount: string, accountHolderName?: string) => { success: boolean; message: string; transaction?: WithdrawalTransaction };
  approveWithdrawal: (id: string) => void;
  removeDepositFromHistory: (id: string) => void;
  removeWithdrawalFromHistory: (id: string) => void;
  clearAllHistory: () => void;

  // Zoom
  zoomVisibleCount: number;
  setZoomVisibleCount: React.Dispatch<React.SetStateAction<number>>;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;

  // Sound
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;

  // Loading state
  isAssetLoading: boolean;

  // Custom Branding (URL configurable by user)
  logoImageUrl: string;
  setLogoImageUrl: (url: string) => void;
  backgroundImageUrl: string;
  setBackgroundImageUrl: (url: string) => void;

  // Watermark Settings (Adjustable size & opacity as requested)
  watermarkSize: number;
  setWatermarkSize: (size: number) => void;
  watermarkOpacity: number;
  setWatermarkOpacity: (opacity: number) => void;
  watermarkType: WatermarkType;
  setWatermarkType: (type: WatermarkType) => void;

  // 100+ Live Technical Indicators (Only Lines)
  activeIndicatorIds: string[];
  setActiveIndicatorIds: React.Dispatch<React.SetStateAction<string[]>>;
  toggleIndicator: (id: string) => void;
  setIndicatorActive: (id: string, active: boolean) => void;
  clearAllActiveIndicators: () => void;
}

const TradingContext = createContext<TradingContextType | undefined>(undefined);

const STORAGE_KEYS = {
  DEMO_BALANCE: 'quotex_demo_balance',
  REAL_BALANCE: 'quotex_real_balance_v2',
  ACCOUNT_TYPE: 'quotex_account_type',
  ACTIVE_ASSET_ID: 'quotex_active_asset_id',
  TRADE_HISTORY: 'quotex_trade_history',
  DEPOSITS: 'quotex_deposits_history_v2',
  WITHDRAWALS: 'quotex_withdrawals_history',
  MARKET_MODE: 'quotex_market_mode',
  SOUND_ENABLED: 'quotex_sound_enabled',
  DRAWN_LINES: 'quotex_drawn_lines',
  SHOW_CHART_BUTTONS: 'quotex_show_chart_buttons',
  SHOW_EYE_BUTTON: 'quotex_show_eye_button',
  SHOW_BAG_BUTTON: 'quotex_show_bag_button',
  SHOW_PEN_BUTTON: 'quotex_show_pen_button',
  SHOW_ZOOM_CONTROLS: 'quotex_show_zoom_controls',
  WATERMARK_ENABLED: 'quotex_watermark_enabled',
  INDICATORS_ENABLED: 'quotex_indicators_enabled',
  SHOW_RESULT_POPUP: 'quotex_show_result_popup',
  SHOW_HEADER_EXTRA_BUTTONS: 'quotex_show_header_extra_buttons',
  SHOW_ORDER_TOAST: 'quotex_show_order_toast',
  TRADER_NAME: 'quotex_trader_name',
  TRADER_FLAG: 'quotex_trader_flag',
  CUSTOM_LB_PROFIT: 'quotex_custom_lb_profit',
  CUSTOM_LB_RANK: 'quotex_custom_lb_rank',
  CANDLE_COLOR_SCHEME: 'quotex_candle_color_scheme',
  LOGO_IMAGE_URL: 'quotex_logo_image_url',
  BACKGROUND_IMAGE_URL: 'quotex_background_image_url',
  WATERMARK_SIZE: 'quotex_watermark_size',
  WATERMARK_OPACITY: 'quotex_watermark_opacity',
  WATERMARK_TYPE: 'quotex_watermark_type',
  ACTIVE_INDICATOR_IDS: 'quotex_active_indicator_ids',
};

export const TradingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Custom Branding (Logo & Background URLs)
  const [logoImageUrl, setLogoImageUrlState] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEYS.LOGO_IMAGE_URL) || '';
  });

  const setLogoImageUrl = useCallback((url: string) => {
    setLogoImageUrlState(url);
    if (url) {
      localStorage.setItem(STORAGE_KEYS.LOGO_IMAGE_URL, url);
    } else {
      localStorage.removeItem(STORAGE_KEYS.LOGO_IMAGE_URL);
    }
  }, []);

  const [backgroundImageUrl, setBackgroundImageUrlState] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEYS.BACKGROUND_IMAGE_URL) || '';
  });

  const setBackgroundImageUrl = useCallback((url: string) => {
    setBackgroundImageUrlState(url);
    if (url) {
      localStorage.setItem(STORAGE_KEYS.BACKGROUND_IMAGE_URL, url);
    } else {
      localStorage.removeItem(STORAGE_KEYS.BACKGROUND_IMAGE_URL);
    }
  }, []);

  // Watermark Settings (Adjustable size & opacity, no background image clutter)
  const [watermarkSize, setWatermarkSizeState] = useState<number>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.WATERMARK_SIZE);
    return saved ? parseInt(saved, 10) : 160;
  });

  const setWatermarkSize = useCallback((size: number) => {
    setWatermarkSizeState(size);
    localStorage.setItem(STORAGE_KEYS.WATERMARK_SIZE, size.toString());
  }, []);

  const [watermarkOpacity, setWatermarkOpacityState] = useState<number>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.WATERMARK_OPACITY);
    return saved ? parseFloat(saved) : 0.14;
  });

  const setWatermarkOpacity = useCallback((opacity: number) => {
    setWatermarkOpacityState(opacity);
    localStorage.setItem(STORAGE_KEYS.WATERMARK_OPACITY, opacity.toString());
  }, []);

  const [watermarkType, setWatermarkTypeState] = useState<WatermarkType>(() => {
    return (localStorage.getItem(STORAGE_KEYS.WATERMARK_TYPE) as WatermarkType) || 'both';
  });

  const setWatermarkType = useCallback((type: WatermarkType) => {
    setWatermarkTypeState(type);
    localStorage.setItem(STORAGE_KEYS.WATERMARK_TYPE, type);
  }, []);

  // 100+ Indicators (Only Lines)
  const [activeIndicatorIds, setActiveIndicatorIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ACTIVE_INDICATOR_IDS);
      return saved ? JSON.parse(saved) : ['sma_10', 'ema_20'];
    } catch {
      return ['sma_10', 'ema_20'];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_INDICATOR_IDS, JSON.stringify(activeIndicatorIds));
  }, [activeIndicatorIds]);

  const toggleIndicator = useCallback((id: string) => {
    setActiveIndicatorIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  }, []);

  const setIndicatorActive = useCallback((id: string, active: boolean) => {
    setActiveIndicatorIds((prev) => {
      if (active && !prev.includes(id)) return [...prev, id];
      if (!active && prev.includes(id)) return prev.filter((i) => i !== id);
      return prev;
    });
  }, []);

  const clearAllActiveIndicators = useCallback(() => {
    setActiveIndicatorIds([]);
  }, []);
  // 1. Account balances (Live starts at $0.00 with money removed as requested, customizable anytime)
  const [accountType, setAccountTypeState] = useState<AccountType>(() => {
    return (localStorage.getItem(STORAGE_KEYS.ACCOUNT_TYPE) as AccountType) || 'DEMO';
  });

  const [demoBalance, setDemoBalance] = useState<number>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.DEMO_BALANCE);
    return saved !== null ? parseFloat(saved) : 10000;
  });

  const [realBalance, setRealBalance] = useState<number>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.REAL_BALANCE);
    return saved !== null ? parseFloat(saved) : 0.00;
  });

  // Purple LIVE + Crown when Live balance crosses $100,000
  const isVipPurpleLive = realBalance >= 100000;

  // 2. Assets & Active Asset
  const [assets, setAssets] = useState<Asset[]>(INITIAL_ASSETS);
  const [activeAssetId, setActiveAssetId] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEYS.ACTIVE_ASSET_ID) || INITIAL_ASSETS[0].id;
  });

  const activeAsset = assets.find((a) => a.id === activeAssetId) || assets[0];
  const [isAssetLoading, setIsAssetLoading] = useState<boolean>(false);

  // 3. Timeframe & Chart (Strictly 60s / 1 min per candle)
  const [timeframe, setTimeframeState] = useState<number>(60);
  const setTimeframe = useCallback((_seconds: number) => {
    // Locked to 60s (1 minute per candle) as requested: "har candle 1 min ke ho"
    setTimeframeState(60);
  }, []);

  const [chartType, setChartType] = useState<ChartType>('candlestick');
  const [candleColorScheme, setCandleColorSchemeState] = useState<CandleColorScheme>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CANDLE_COLOR_SCHEME) as CandleColorScheme;
    return saved || 'classic';
  });

  const setCandleColorScheme = useCallback((scheme: CandleColorScheme) => {
    setCandleColorSchemeState(scheme);
    localStorage.setItem(STORAGE_KEYS.CANDLE_COLOR_SCHEME, scheme);
  }, []);
  const [indicators, setIndicators] = useState<IndicatorSettings>({
    sma: false,
    smaPeriod: 10,
    ema: false,
    emaPeriod: 21,
    bbands: false,
    bbandsPeriod: 20,
    bbandsStdDev: 2,
    rsi: false,
    rsiPeriod: 14,
    macd: false,
    macdFast: 12,
    macdSlow: 26,
    macdSignal: 9,
    stoch: false,
    stochK: 14,
    stochD: 3,
    parabolicSar: false
  });

  // 4. UI Toggles & Leaderboard Profile
  const [showChartButtons, setShowChartButtonsState] = useState<boolean>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SHOW_CHART_BUTTONS);
    return saved !== null ? saved === 'true' : true;
  });

  const setShowChartButtons = useCallback((show: boolean) => {
    setShowChartButtonsState(show);
    localStorage.setItem(STORAGE_KEYS.SHOW_CHART_BUTTONS, String(show));
  }, []);

  const [showEyeButton, setShowEyeButtonState] = useState<boolean>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SHOW_EYE_BUTTON);
    return saved !== null ? saved === 'true' : true;
  });

  const setShowEyeButton = useCallback((show: boolean) => {
    setShowEyeButtonState(show);
    localStorage.setItem(STORAGE_KEYS.SHOW_EYE_BUTTON, String(show));
  }, []);

  const [showBagButton, setShowBagButtonState] = useState<boolean>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SHOW_BAG_BUTTON);
    return saved !== null ? saved === 'true' : true;
  });

  const setShowBagButton = useCallback((show: boolean) => {
    setShowBagButtonState(show);
    localStorage.setItem(STORAGE_KEYS.SHOW_BAG_BUTTON, String(show));
  }, []);

  const [showPenButton, setShowPenButtonState] = useState<boolean>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SHOW_PEN_BUTTON);
    return saved !== null ? saved === 'true' : true;
  });

  const setShowPenButton = useCallback((show: boolean) => {
    setShowPenButtonState(show);
    localStorage.setItem(STORAGE_KEYS.SHOW_PEN_BUTTON, String(show));
  }, []);

  const [showZoomControls, setShowZoomControlsState] = useState<boolean>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SHOW_ZOOM_CONTROLS);
    return saved !== null ? saved === 'true' : true;
  });

  const setShowZoomControls = useCallback((show: boolean) => {
    setShowZoomControlsState(show);
    localStorage.setItem(STORAGE_KEYS.SHOW_ZOOM_CONTROLS, String(show));
  }, []);

  const [watermarkEnabled, setWatermarkEnabledState] = useState<boolean>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.WATERMARK_ENABLED);
    return saved !== null ? saved === 'true' : true;
  });

  const setWatermarkEnabled = useCallback((enabled: boolean) => {
    setWatermarkEnabledState(enabled);
    localStorage.setItem(STORAGE_KEYS.WATERMARK_ENABLED, String(enabled));
  }, []);

  const [indicatorsEnabled, setIndicatorsEnabledState] = useState<boolean>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.INDICATORS_ENABLED);
    return saved !== null ? saved === 'true' : true;
  });

  const setIndicatorsEnabled = useCallback((enabled: boolean) => {
    setIndicatorsEnabledState(enabled);
    localStorage.setItem(STORAGE_KEYS.INDICATORS_ENABLED, String(enabled));
  }, []);

  const [showResultPopupEnabled, setShowResultPopupEnabledState] = useState<boolean>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SHOW_RESULT_POPUP);
    return saved !== null ? saved === 'true' : true;
  });

  const setShowResultPopupEnabled = useCallback((enabled: boolean) => {
    setShowResultPopupEnabledState(enabled);
    localStorage.setItem(STORAGE_KEYS.SHOW_RESULT_POPUP, String(enabled));
  }, []);

  // Top bar extra buttons: Briefcase/Bag (Active Trades) & 3-Dots (Settings/Menu) toggle
  const [showHeaderExtraButtons, setShowHeaderExtraButtonsState] = useState<boolean>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SHOW_HEADER_EXTRA_BUTTONS);
    return saved !== null ? saved === 'true' : true;
  });

  const setShowHeaderExtraButtons = useCallback((show: boolean) => {
    setShowHeaderExtraButtonsState(show);
    localStorage.setItem(STORAGE_KEYS.SHOW_HEADER_EXTRA_BUTTONS, String(show));
  }, []);

  // Notification when placing trade OFF by default ("jab hum trade lagaya ju notification show horaha ha wo off ho")
  const [showOrderToastEnabled, setShowOrderToastEnabledState] = useState<boolean>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SHOW_ORDER_TOAST);
    return saved !== null ? saved === 'true' : false;
  });

  const setShowOrderToastEnabled = useCallback((enabled: boolean) => {
    setShowOrderToastEnabledState(enabled);
    localStorage.setItem(STORAGE_KEYS.SHOW_ORDER_TOAST, String(enabled));
    if (!enabled) setOrderToast(null);
  }, []);

  const [traderName, setTraderNameState] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEYS.TRADER_NAME) || 'YA TRADER';
  });

  const setTraderName = useCallback((name: string) => {
    setTraderNameState(name);
    localStorage.setItem(STORAGE_KEYS.TRADER_NAME, name);
  }, []);

  const [traderFlag, setTraderFlagState] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEYS.TRADER_FLAG) || '🇵🇰';
  });

  const setTraderFlag = useCallback((flag: string) => {
    setTraderFlagState(flag);
    localStorage.setItem(STORAGE_KEYS.TRADER_FLAG, flag);
  }, []);

  const [customLeaderboardProfit, setCustomLeaderboardProfitState] = useState<number | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CUSTOM_LB_PROFIT);
    return saved !== null && saved !== '' ? parseFloat(saved) : null;
  });

  const setCustomLeaderboardProfit = useCallback((profit: number | null) => {
    setCustomLeaderboardProfitState(profit);
    if (profit === null) {
      localStorage.removeItem(STORAGE_KEYS.CUSTOM_LB_PROFIT);
    } else {
      localStorage.setItem(STORAGE_KEYS.CUSTOM_LB_PROFIT, profit.toString());
    }
  }, []);

  const [customLeaderboardRank, setCustomLeaderboardRankState] = useState<number | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CUSTOM_LB_RANK);
    return saved !== null && saved !== '' ? parseInt(saved, 10) : null;
  });

  const setCustomLeaderboardRank = useCallback((rank: number | null) => {
    setCustomLeaderboardRankState(rank);
    if (rank === null) {
      localStorage.removeItem(STORAGE_KEYS.CUSTOM_LB_RANK);
    } else {
      localStorage.setItem(STORAGE_KEYS.CUSTOM_LB_RANK, rank.toString());
    }
  }, []);

  // 5. Market Mode & Engine behavior
  const [marketBehaviorMode, setMarketBehaviorModeState] = useState<MarketBehaviorMode>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.MARKET_MODE);
    return (saved as MarketBehaviorMode) || 'smart_push';
  });

  const [isOnlineMode, setIsOnlineMode] = useState<boolean>(true);
  const [soundEnabled, setSoundEnabledState] = useState<boolean>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SOUND_ENABLED);
    return saved !== null ? saved === 'true' : true;
  });

  // 6. INDEPENDENT 1-MINUTE GRAPH PER ASSET
  const [assetCandlesMap, setAssetCandlesMap] = useState<Record<string, Candle[]>>(() => {
    const map: Record<string, Candle[]> = {};
    INITIAL_ASSETS.forEach((ast) => {
      map[ast.id] = generateHistoricalCandles(ast, 60, 180);
    });
    return map;
  });

  const candles = assetCandlesMap[activeAsset.id] || generateHistoricalCandles(activeAsset, 60, 180);

  // 7. Trades & Drawing Tools (Trades stay for 1 day / 24 hours then auto-remove)
  const [activeTrades, setActiveTrades] = useState<Trade[]>([]);
  const [tradeHistory, setTradeHistory] = useState<Trade[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TRADE_HISTORY);
      if (!saved) return [];
      const parsed: Trade[] = JSON.parse(saved);
      const cutoff = Date.now() - ONE_DAY_MS;
      return parsed.filter((t) => (t.closeTime || t.openTime) >= cutoff);
    } catch {
      return [];
    }
  });
  const [lastClosedTrade, setLastClosedTrade] = useState<Trade | null>(null);

  const removeTradeFromHistory = useCallback((id: string) => {
    setTradeHistory((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Automatically purge any trade older than 1 day (24 hours)
  useEffect(() => {
    const pruneInterval = setInterval(() => {
      const cutoff = Date.now() - ONE_DAY_MS;
      setTradeHistory((prev) => {
        const filtered = prev.filter((t) => (t.closeTime || t.openTime) >= cutoff);
        return filtered.length !== prev.length ? filtered : prev;
      });
    }, 30000);
    return () => clearInterval(pruneInterval);
  }, []);

  // Per-trade target outcome map for 'realistic' mode (mix of win and lose)
  const tradeOutcomeTargetRef = useRef<Record<string, 'WIN' | 'LOSS'>>({});
  const realisticCounterRef = useRef<number>(0);

  const [orderToast, setOrderToast] = useState<OrderToast | null>(null);
  const orderToastTimerRef = useRef<any>(null);

  const clearOrderToast = useCallback(() => {
    if (orderToastTimerRef.current) clearTimeout(orderToastTimerRef.current);
    setOrderToast(null);
  }, []);

  // Drawing Tools (Interactive user-drawn lines on chart)
  const [drawnLines, setDrawnLines] = useState<DrawnLine[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.DRAWN_LINES);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [activeDrawingTool, setActiveDrawingTool] = useState<DrawingToolType>('none');
  const [drawingColor, setDrawingColor] = useState<string>('#eab308');

  const addDrawnLine = useCallback((line: Omit<DrawnLine, 'id'>) => {
    const newLine: DrawnLine = {
      ...line,
      id: 'LINE-' + Math.random().toString(36).substring(2, 9)
    };
    setDrawnLines((prev) => {
      const updated = [...prev, newLine];
      localStorage.setItem(STORAGE_KEYS.DRAWN_LINES, JSON.stringify(updated));
      return updated;
    });
    sounds.playBeep(600, 0.08);
  }, []);

  const updateDrawnLine = useCallback((id: string, updates: Partial<DrawnLine>) => {
    setDrawnLines((prev) => {
      const updated = prev.map((l) => (l.id === id ? { ...l, ...updates } : l));
      localStorage.setItem(STORAGE_KEYS.DRAWN_LINES, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const removeDrawnLine = useCallback((id: string) => {
    setDrawnLines((prev) => {
      const updated = prev.filter((l) => l.id !== id);
      localStorage.setItem(STORAGE_KEYS.DRAWN_LINES, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const undoLastDrawnLine = useCallback(() => {
    setDrawnLines((prev) => {
      const updated = prev.slice(0, -1);
      localStorage.setItem(STORAGE_KEYS.DRAWN_LINES, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const clearDrawnLines = useCallback(() => {
    setDrawnLines([]);
    localStorage.removeItem(STORAGE_KEYS.DRAWN_LINES);
  }, []);

  // Zoom Controls ("fix candle ko hum fully zoom kara ok fix")
  const [zoomVisibleCount, setZoomVisibleCount] = useState<number>(42);

  const zoomIn = useCallback(() => {
    // Allows full zoom-in down to 5 candles so candles appear huge & clear
    setZoomVisibleCount((prev) => Math.max(5, prev - 4));
  }, []);

  const zoomOut = useCallback(() => {
    // Allows zoom-out up to 160 candles for broad view
    setZoomVisibleCount((prev) => Math.min(160, prev + 5));
  }, []);

  const resetZoom = useCallback(() => {
    setZoomVisibleCount(42);
  }, []);

  // 8. Cashier History
  const [deposits, setDeposits] = useState<DepositTransaction[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.DEPOSITS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [withdrawals, setWithdrawals] = useState<WithdrawalTransaction[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.WITHDRAWALS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const activeBiasRef = useRef<number>(0);
  const activeTradesRef = useRef<Trade[]>(activeTrades);
  activeTradesRef.current = activeTrades;

  const marketModeRef = useRef<MarketBehaviorMode>(marketBehaviorMode);
  marketModeRef.current = marketBehaviorMode;

  const currentPriceRef = useRef<number>(activeAsset.currentPrice);
  currentPriceRef.current = activeAsset.currentPrice;

  // Persist State helpers
  const setAccountType = (type: AccountType) => {
    setAccountTypeState(type);
    localStorage.setItem(STORAGE_KEYS.ACCOUNT_TYPE, type);
  };

  const setMarketBehaviorMode = (mode: MarketBehaviorMode) => {
    setMarketBehaviorModeState(mode);
    marketModeRef.current = mode;
    localStorage.setItem(STORAGE_KEYS.MARKET_MODE, mode);
  };

  const setSoundEnabled = (enabled: boolean) => {
    setSoundEnabledState(enabled);
    sounds.setEnabled(enabled);
    localStorage.setItem(STORAGE_KEYS.SOUND_ENABLED, String(enabled));
  };

  const setRealBalanceDirect = useCallback((amount: number) => {
    const clean = Math.max(0, Number(amount.toFixed(2)));
    setRealBalance(clean);
  }, []);

  const removeRealMoney = useCallback((amount?: number) => {
    if (amount === undefined) {
      setRealBalance(0);
    } else {
      setRealBalance((prev) => Math.max(0, Number((prev - amount).toFixed(2))));
    }
  }, []);

  // Switch Active Asset with individual unique 1-minute graph
  const setActiveAsset = (asset: Asset) => {
    setIsAssetLoading(true);
    setActiveAssetId(asset.id);
    localStorage.setItem(STORAGE_KEYS.ACTIVE_ASSET_ID, asset.id);

    if (!assetCandlesMap[asset.id]) {
      const newCandles = generateHistoricalCandles(asset, 60, 180);
      setAssetCandlesMap((prev) => ({ ...prev, [asset.id]: newCandles }));
    }

    setTimeout(() => {
      setIsAssetLoading(false);
    }, 220);
  };

  // Balance persistence
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.DEMO_BALANCE, demoBalance.toString());
  }, [demoBalance]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.REAL_BALANCE, realBalance.toString());
  }, [realBalance]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TRADE_HISTORY, JSON.stringify(tradeHistory.slice(0, 200)));
  }, [tradeHistory]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.DEPOSITS, JSON.stringify(deposits));
  }, [deposits]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.WITHDRAWALS, JSON.stringify(withdrawals));
  }, [withdrawals]);

  const resetDemoBalance = () => {
    setDemoBalance(10000);
    sounds.playCashRegister();
  };

  const clearAllHistory = () => {
    setTradeHistory([]);
    setDeposits([]);
    setWithdrawals([]);
    localStorage.removeItem(STORAGE_KEYS.TRADE_HISTORY);
    localStorage.removeItem(STORAGE_KEYS.DEPOSITS);
    localStorage.removeItem(STORAGE_KEYS.WITHDRAWALS);
  };

  // Market bias calculation based on active trades and selected outcome mode
  useEffect(() => {
    if (activeTrades.length === 0) {
      if (marketBehaviorMode === 'bull_trend') {
        activeBiasRef.current = 0.12;
      } else if (marketBehaviorMode === 'bear_trend') {
        activeBiasRef.current = -0.12;
      } else {
        activeBiasRef.current = 0;
      }
      return;
    }

    let bias = 0;
    activeTrades.forEach((t) => {
      if (t.assetId === activeAsset.id) {
        let desiredOutcome: 'WIN' | 'LOSS' = 'WIN';
        if (marketBehaviorMode === 'force_loss') {
          desiredOutcome = 'LOSS';
        } else if (marketBehaviorMode === 'realistic') {
          desiredOutcome = tradeOutcomeTargetRef.current[t.id] || 'WIN';
        } else {
          desiredOutcome = 'WIN';
        }

        const dirMultiplier = t.direction === 'UP' ? 1 : -1;
        const outcomeMultiplier = desiredOutcome === 'WIN' ? 1 : -1;
        bias += dirMultiplier * outcomeMultiplier * 0.14;
      }
    });
    activeBiasRef.current = Math.max(-0.28, Math.min(0.28, bias));
  }, [activeTrades, marketBehaviorMode, activeAsset.id]);

  // Real-time Tick Engine: Strict 1-Minute (60,000ms) Candle Alignment
  // Live candle moves smoothly every tick (150ms) by visible pip steps — never frozen in one place, and never teleports on trade entry!
  useEffect(() => {
    const tickInterval = 150; // ~6.6 ticks/sec for realistic live OTC candle breathing
    const timeframeMs = 60 * 1000; // Strictly 1 minute per candle

    const timer = setInterval(() => {
      setAssetCandlesMap((prevMap) => {
        const curCandles = prevMap[activeAsset.id];
        if (!curCandles || curCandles.length === 0) return prevMap;

        const now = Date.now();
        const currentBucket = Math.floor(now / timeframeMs) * timeframeMs;
        const lastCandle = curCandles[curCandles.length - 1];

        const pip = Math.pow(10, -activeAsset.decimalPlaces);
        const volatility = Math.max(activeAsset.volatility || pip * 14, pip * 10);

        // Base live tick step: 1 to 3 pips per tick so the candle ALWAYS moves visibly in real time
        const baseStepPips = 1 + Math.floor(Math.random() * 2.6);
        const stepSize = Math.max(pip * baseStepPips, volatility * (0.09 + Math.random() * 0.14));

        // Natural mean-reversion toward candle open so normal candles stay well-proportioned
        const distFromOpen = lastCandle.close - lastCandle.open;
        const maxNaturalExcursion = volatility * 1.6;
        let upProb = 0.5;
        if (distFromOpen > maxNaturalExcursion) upProb = 0.35;
        else if (distFromOpen < -maxNaturalExcursion) upProb = 0.65;

        if (activeBiasRef.current > 0) upProb = 0.62;
        else if (activeBiasRef.current < 0) upProb = 0.38;

        let delta = (Math.random() < upProb ? 1 : -1) * stepSize;

        // Check active trades on this asset for smooth, real-time step-by-step movement
        const currentTradesOnAsset = activeTradesRef.current.filter((t) => t.assetId === activeAsset.id);
        if (currentTradesOnAsset.length > 0) {
          const latest = currentTradesOnAsset[0];
          const totalDurationMs = Math.max(2000, latest.closeTime - latest.openTime);
          const elapsedMs = Math.max(0, now - latest.openTime);
          const elapsedRatio = Math.min(1, elapsedMs / totalDurationMs);

          let targetOutcome: 'WIN' | 'LOSS' = 'WIN';
          if (marketModeRef.current === 'force_loss') {
            targetOutcome = 'LOSS';
          } else if (marketModeRef.current === 'realistic') {
            targetOutcome = tradeOutcomeTargetRef.current[latest.id] || 'WIN';
          }

          const wantUpFinish =
            (latest.direction === 'UP' && targetOutcome === 'WIN') ||
            (latest.direction === 'DOWN' && targetOutcome === 'LOSS');

          // Comfort zone is 5 to 12 pips (or ~0.45x volatility) in the winning/target direction
          const minWinDist = Math.max(pip * 4, volatility * 0.3);
          const maxWinDist = Math.max(pip * 14, volatility * 1.15);
          const signedProgress = wantUpFinish
            ? lastCandle.close - latest.entryPrice
            : latest.entryPrice - lastCandle.close;

          let moveInTargetDirProb = 0.68;
          if (signedProgress < minWinDist) {
            // Needs to walk smoothly toward the target side of entryPrice
            moveInTargetDirProb = elapsedRatio > 0.6 ? 0.86 : 0.74;
          } else if (signedProgress > maxWinDist) {
            // Already comfortably in profit zone — breathe naturally up and down without flying off screen
            moveInTargetDirProb = 0.38;
          } else {
            // Inside the ideal real-time zone: oscillate naturally up and down while holding the lead
            moveInTargetDirProb = 0.56;
          }

          const goTargetDir = Math.random() < moveInTargetDirProb;
          const dirSign = wantUpFinish ? (goTargetDir ? 1 : -1) : (goTargetDir ? -1 : 1);
          const tradeStep = Math.max(pip * (1 + Math.floor(Math.random() * 2.2)), volatility * 0.11);
          delta = dirSign * tradeStep;
        }

        let newPrice = Number((lastCandle.close + delta).toFixed(activeAsset.decimalPlaces));
        // Guarantee that newPrice changes by at least 1 pip if rounding left it identical
        if (newPrice === lastCandle.close) {
          const fallbackDir = delta >= 0 ? 1 : -1;
          newPrice = Number((lastCandle.close + fallbackDir * pip).toFixed(activeAsset.decimalPlaces));
        }
        currentPriceRef.current = newPrice;

        setAssets((prev) =>
          prev.map((a) => (a.id === activeAsset.id ? { ...a, currentPrice: newPrice } : a))
        );

        let updatedList: Candle[];
        // Start a new candle when the real clock crosses into a new 1-minute bucket
        const lastCandleBucket = Math.floor(lastCandle.time / timeframeMs) * timeframeMs;
        if (currentBucket > lastCandleBucket) {
          const newCandle: Candle = {
            time: currentBucket,
            open: lastCandle.close,
            high: Math.max(lastCandle.close, newPrice),
            low: Math.min(lastCandle.close, newPrice),
            close: newPrice,
            volume: 15 + Math.floor(Math.random() * 20)
          };
          updatedList = [...curCandles.slice(-240), newCandle];
        } else {
          const updatedCandle: Candle = {
            ...lastCandle,
            time: currentBucket,
            high: Math.max(lastCandle.high, newPrice),
            low: Math.min(lastCandle.low, newPrice),
            close: newPrice,
            volume: lastCandle.volume + 1
          };
          updatedList = [...curCandles.slice(0, -1), updatedCandle];
        }

        return { ...prevMap, [activeAsset.id]: updatedList };
      });
    }, tickInterval);

    return () => clearInterval(timer);
  }, [activeAsset.id, activeAsset.volatility, activeAsset.decimalPlaces]);

  // Trade Expiration Monitor
  useEffect(() => {
    const checkInterval = 100;
    const interval = setInterval(() => {
      const now = Date.now();
      const currentTrades = activeTradesRef.current;
      if (currentTrades.length === 0) return;

      const expiringTrades: Trade[] = [];
      const remainingTrades: Trade[] = [];

      currentTrades.forEach((trade) => {
        const remainingSeconds = Math.ceil((trade.closeTime - now) / 1000);
        if (remainingSeconds <= 3 && remainingSeconds > 0 && Math.random() < 0.15) {
          sounds.playCountdownTick(remainingSeconds === 1 ? 950 : 750);
        }

        if (now >= trade.closeTime) {
          expiringTrades.push(trade);
        } else {
          remainingTrades.push(trade);
        }
      });

      if (expiringTrades.length > 0) {
        setActiveTrades(remainingTrades);

        expiringTrades.forEach((trade) => {
          let exitPrice = currentPriceRef.current;
          const minTick = Math.pow(10, -activeAsset.decimalPlaces) * 2;

          let targetOutcome: 'WIN' | 'LOSS' = 'WIN';
          if (marketModeRef.current === 'force_loss') {
            targetOutcome = 'LOSS';
          } else if (marketModeRef.current === 'realistic') {
            targetOutcome = tradeOutcomeTargetRef.current[trade.id] || 'WIN';
          } else {
            targetOutcome = 'WIN';
          }

          // Ensure final exitPrice matches the active mode cleanly
          if (marketModeRef.current === 'smart_push' || marketModeRef.current === 'force_loss' || marketModeRef.current === 'realistic') {
            const shouldBeAbove =
              (trade.direction === 'UP' && targetOutcome === 'WIN') ||
              (trade.direction === 'DOWN' && targetOutcome === 'LOSS');

            if (shouldBeAbove && exitPrice <= trade.entryPrice) {
              exitPrice = Number((trade.entryPrice + minTick).toFixed(activeAsset.decimalPlaces));
            } else if (!shouldBeAbove && exitPrice >= trade.entryPrice) {
              exitPrice = Number((trade.entryPrice - minTick).toFixed(activeAsset.decimalPlaces));
            }
            currentPriceRef.current = exitPrice;
            setAssets((prev) =>
              prev.map((a) => (a.id === trade.assetId ? { ...a, currentPrice: exitPrice } : a))
            );
            setAssetCandlesMap((prevMap) => {
              const list = prevMap[trade.assetId];
              if (!list || list.length === 0) return prevMap;
              const last = list[list.length - 1];
              const updatedLast: Candle = {
                ...last,
                high: Math.max(last.high, exitPrice),
                low: Math.min(last.low, exitPrice),
                close: exitPrice
              };
              return { ...prevMap, [trade.assetId]: [...list.slice(0, -1), updatedLast] };
            });
          }

          let status: TradeStatus = 'LOST';
          let actualProfit = 0;

          if (trade.direction === 'UP') {
            if (exitPrice > trade.entryPrice) {
              status = 'WON';
              actualProfit = Number((trade.amount * (trade.payoutRate / 100)).toFixed(2));
            } else if (exitPrice === trade.entryPrice) {
              status = 'TIE';
              actualProfit = 0;
            } else {
              status = 'LOST';
              actualProfit = -trade.amount;
            }
          } else {
            if (exitPrice < trade.entryPrice) {
              status = 'WON';
              actualProfit = Number((trade.amount * (trade.payoutRate / 100)).toFixed(2));
            } else if (exitPrice === trade.entryPrice) {
              status = 'TIE';
              actualProfit = 0;
            } else {
              status = 'LOST';
              actualProfit = -trade.amount;
            }
          }

          const resolvedTrade: Trade = {
            ...trade,
            status,
            exitPrice,
            actualProfit
          };

          delete tradeOutcomeTargetRef.current[trade.id];

          if (status === 'WON') {
            const returnAmount = trade.amount + actualProfit;
            if (trade.accountType === 'DEMO') {
              setDemoBalance((b) => Number((b + returnAmount).toFixed(2)));
            } else {
              setRealBalance((b) => Number((b + returnAmount).toFixed(2)));
            }
            // Dynamically update Leaderboard Profit & allow Position to recalculate automatically
            setCustomLeaderboardProfitState((prev: number | null) => {
              if (prev === null) return null;
              const base = prev < 0 ? 0 : prev;
              const nextVal = Number((base + actualProfit).toFixed(2));
              localStorage.setItem(STORAGE_KEYS.CUSTOM_LB_PROFIT, nextVal.toString());
              return nextVal;
            });
            setCustomLeaderboardRank(null);
            sounds.playWin();
          } else if (status === 'TIE') {
            if (trade.accountType === 'DEMO') {
              setDemoBalance((b) => Number((b + trade.amount).toFixed(2)));
            } else {
              setRealBalance((b) => Number((b + trade.amount).toFixed(2)));
            }
          } else {
            setCustomLeaderboardProfitState((prev: number | null) => {
              if (prev === null) return null;
              const nextVal = Number((prev - trade.amount).toFixed(2));
              localStorage.setItem(STORAGE_KEYS.CUSTOM_LB_PROFIT, nextVal.toString());
              return nextVal;
            });
            setCustomLeaderboardRank(null);
            sounds.playLoss();
          }

          setTradeHistory((prev) => [resolvedTrade, ...prev]);
          setLastClosedTrade(resolvedTrade);
        });
      }
    }, checkInterval);

    return () => clearInterval(interval);
  }, [activeAsset.decimalPlaces]);

  // Place Trade Action: Does NOT change candle timing or trade timer!
  const placeTrade = useCallback(
    (direction: TradeDirection, amount: number, durationSeconds: number): boolean => {
      const balance = accountType === 'DEMO' ? demoBalance : realBalance;
      if (amount <= 0 || balance < amount) {
        return false;
      }

      if (accountType === 'DEMO') {
        setDemoBalance((b) => Number((b - amount).toFixed(2)));
      } else {
        setRealBalance((b) => Number((b - amount).toFixed(2)));
      }

      const now = Date.now();
      const currentPrice = currentPriceRef.current;
      const payoutAmount = Number((amount * (activeAsset.payout / 100)).toFixed(2));
      const tradeId = 'TRD-' + Math.random().toString(36).substring(2, 9).toUpperCase();

      // Determine outcome target for this trade based on mode
      if (marketBehaviorMode === 'force_loss') {
        tradeOutcomeTargetRef.current[tradeId] = 'LOSS';
      } else if (marketBehaviorMode === 'realistic') {
        // Real trading mix: realistic alternating & random wins and losses
        realisticCounterRef.current += 1;
        const isWin = realisticCounterRef.current % 2 === 1 ? Math.random() < 0.65 : Math.random() < 0.35;
        tradeOutcomeTargetRef.current[tradeId] = isWin ? 'WIN' : 'LOSS';
      } else {
        tradeOutcomeTargetRef.current[tradeId] = 'WIN';
      }

      const curCandles = assetCandlesMap[activeAsset.id] || [];
      const currentCandle = curCandles.length > 0 ? curCandles[curCandles.length - 1] : undefined;

      const newTrade: Trade = {
        id: tradeId,
        assetId: activeAsset.id,
        assetName: activeAsset.name,
        direction,
        amount,
        entryPrice: currentPrice,
        payoutRate: activeAsset.payout,
        potentialProfit: payoutAmount,
        status: 'OPEN',
        openTime: now,
        closeTime: now + durationSeconds * 1000,
        candleTime: currentCandle ? currentCandle.time : Math.floor(now / (60 * 1000)) * (60 * 1000),
        durationSeconds,
        accountType
      };

      sounds.playTradePlaced();

      // Do NOT jump or nudge the candle price on trade entry!
      // The candle continues moving naturally in real time without any sudden jump up or down.

      // Only trigger order toast if user explicitly enabled it (OFF by default as requested!)
      if (showOrderToastEnabled) {
        const newOrderToast: OrderToast = {
          id: 'ORD-' + Math.random().toString(36).substring(2, 8),
          direction,
          amount,
          assetSymbol: activeAsset.symbol,
          price: currentPrice,
          payoutRate: activeAsset.payout,
          timestamp: now
        };
        setOrderToast(newOrderToast);
        if (orderToastTimerRef.current) clearTimeout(orderToastTimerRef.current);
        orderToastTimerRef.current = setTimeout(() => {
          setOrderToast(null);
        }, 3000);
      }

      setActiveTrades((prev) => [newTrade, ...prev]);
      return true;
    },
    [accountType, demoBalance, realBalance, activeAsset, marketBehaviorMode, showOrderToastEnabled]
  );

  const clearLastClosedTrade = () => {
    setLastClosedTrade(null);
  };

  // Cashier: Deposit (Synchronized with Live Balance & History)
  const depositFunds = useCallback(
    (amount: number, method: string, promoCode?: string, senderDetails?: string): DepositTransaction => {
      let bonusPercent = 0;
      const cleanPromo = promoCode ? promoCode.trim().toUpperCase() : '';
      if (cleanPromo === 'BONUS50') {
        bonusPercent = 50;
      } else if (cleanPromo === 'QUOTEX100') {
        bonusPercent = 100;
      } else if (cleanPromo === 'VIP30') {
        bonusPercent = 30;
      }

      const bonusAmount = Number((amount * (bonusPercent / 100)).toFixed(2));
      const totalCredited = Number((amount + bonusAmount).toFixed(2));
      const nextBalance = Number((realBalance + totalCredited).toFixed(2));

      const tx: DepositTransaction = {
        id: 'DEP-' + Math.floor(100000 + Math.random() * 900000),
        amount: Number(amount.toFixed(2)),
        bonusAmount,
        totalCredited,
        method,
        txHash: '0x' + Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
        status: 'APPROVED',
        createdAt: Date.now(),
        accountType: 'REAL',
        promoCode: bonusPercent > 0 ? cleanPromo : undefined,
        senderDetails: senderDetails || method,
        balanceAfter: nextBalance
      };

      setRealBalance(nextBalance);
      setDeposits((prev) => [tx, ...prev]);
      sounds.playCashRegister();

      return tx;
    },
    [realBalance]
  );

  // Cashier: Withdrawal (Synchronized with Live Balance & History)
  const withdrawFunds = useCallback(
    (amount: number, method: string, destinationAccount: string, accountHolderName?: string) => {
      if (amount <= 0) {
        return { success: false, message: 'Invalid withdrawal amount' };
      }
      if (realBalance < amount) {
        return { success: false, message: 'Insufficient live balance' };
      }

      const nextBalance = Number((realBalance - amount).toFixed(2));
      setRealBalance(nextBalance);

      const tx: WithdrawalTransaction = {
        id: 'WTH-' + Math.floor(100000 + Math.random() * 900000),
        amount: Number(amount.toFixed(2)),
        method,
        destinationAccount,
        accountHolderName: accountHolderName || traderName || 'Verified Account Holder',
        fee: 0,
        balanceAfter: nextBalance,
        status: 'APPROVED',
        createdAt: Date.now(),
        accountType: 'REAL',
        txId: 'TXW-' + Math.random().toString(36).substring(2, 10).toUpperCase()
      };

      setWithdrawals((prev) => [tx, ...prev]);
      sounds.playCashRegister();

      return {
        success: true,
        message: `Withdrawal of $${amount.toFixed(2)} via ${method} processed and recorded!`,
        transaction: tx
      };
    },
    [realBalance, traderName]
  );

  const approveWithdrawal = useCallback((id: string) => {
    setWithdrawals((prev) =>
      prev.map((w) => (w.id === id ? { ...w, status: 'APPROVED' } : w))
    );
    sounds.playCashRegister();
  }, []);

  const removeDepositFromHistory = useCallback((id: string) => {
    setDeposits((prev) => prev.filter((d) => d.id !== id));
  }, []);

  const removeWithdrawalFromHistory = useCallback((id: string) => {
    setWithdrawals((prev) => prev.filter((w) => w.id !== id));
  }, []);

  return (
    <TradingContext.Provider
      value={{
        accountType,
        setAccountType,
        demoBalance,
        realBalance,
        resetDemoBalance,
        setRealBalanceDirect,
        removeRealMoney,
        isVipPurpleLive,
        assets,
        activeAsset,
        setActiveAsset,
        candles,
        timeframe,
        setTimeframe,
        chartType,
        setChartType,
        candleColorScheme,
        setCandleColorScheme,
        indicators,
        setIndicators,
        isOnlineMode,
        setIsOnlineMode,
        marketBehaviorMode,
        setMarketBehaviorMode,
        activeTrades,
        tradeHistory,
        removeTradeFromHistory,
        placeTrade,
        lastClosedTrade,
        clearLastClosedTrade,
        orderToast,
        clearOrderToast,
        drawnLines,
        addDrawnLine,
        updateDrawnLine,
        removeDrawnLine,
        undoLastDrawnLine,
        clearDrawnLines,
        activeDrawingTool,
        setActiveDrawingTool,
        drawingColor,
        setDrawingColor,
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
        showHeaderExtraButtons,
        setShowHeaderExtraButtons,
        showOrderToastEnabled,
        setShowOrderToastEnabled,
        traderName,
        setTraderName,
        traderFlag,
        setTraderFlag,
        customLeaderboardProfit,
        setCustomLeaderboardProfit,
        customLeaderboardRank,
        setCustomLeaderboardRank,
        zoomVisibleCount,
        setZoomVisibleCount,
        zoomIn,
        zoomOut,
        resetZoom,
        deposits,
        withdrawals,
        depositFunds,
        withdrawFunds,
        approveWithdrawal,
        removeDepositFromHistory,
        removeWithdrawalFromHistory,
        clearAllHistory,
        soundEnabled,
        setSoundEnabled,
        isAssetLoading,
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
        activeIndicatorIds,
        setActiveIndicatorIds,
        toggleIndicator,
        setIndicatorActive,
        clearAllActiveIndicators
      }}
    >
      {children}
    </TradingContext.Provider>
  );
};

export const useTrading = () => {
  const context = useContext(TradingContext);
  if (!context) {
    throw new Error('useTrading must be used within a TradingProvider');
  }
  return context;
};
