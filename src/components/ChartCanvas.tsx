import React, { useRef, useEffect, useState, useMemo } from 'react';
import { useTrading } from '../context/TradingContext';
import {
  calculateSMA,
  calculateEMA,
  calculateBollingerBands,
  calculateRSI,
  calculateMACD,
  calculateStochastic,
  toHeikinAshi,
  formatPrice
} from '../utils/chartMath';
import { Candle, CANDLE_COLOR_SCHEMES } from '../types/trading';
import { ALL_INDICATORS } from '../constants/indicators';
import {
  MoreHorizontal,
  Briefcase,
  Sliders,
  Plus,
  Minus,
  PenTool,
  Square,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Undo2,
  Trash2,
  X,
  GripHorizontal
} from 'lucide-react';

interface ChartCanvasProps {
  className?: string;
  onOpenSettings?: () => void;
  onOpenIndicators?: (tab?: 'ALL' | 'TREND' | 'VOLATILITY' | 'OSCILLATORS' | 'DRAWING') => void;
  onOpenActiveTrades?: () => void;
}

export const ChartCanvas: React.FC<ChartCanvasProps> = ({
  className,
  onOpenSettings,
  onOpenIndicators,
  onOpenActiveTrades
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const {
    activeAsset,
    candles,
    chartType,
    candleColorScheme,
    indicators,
    activeTrades,
    tradeHistory,
    timeframe,
    accountType,
    isAssetLoading,
    zoomVisibleCount,
    setZoomVisibleCount,
    zoomIn,
    zoomOut,
    resetZoom,
    drawnLines,
    addDrawnLine,
    updateDrawnLine,
    undoLastDrawnLine,
    clearDrawnLines,
    activeDrawingTool,
    setActiveDrawingTool,
    drawingColor,
    setDrawingColor,
    showChartButtons,
    setShowChartButtons,
    showEyeButton,
    showBagButton,
    showPenButton,
    showZoomControls,
    watermarkEnabled,
    indicatorsEnabled,
    showResultPopupEnabled,
    lastClosedTrade,
    clearLastClosedTrade,
    logoImageUrl,
    backgroundImageUrl,
    watermarkSize,
    watermarkOpacity,
    watermarkType,
    activeIndicatorIds
  } = useTrading();

  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const [panOffset, setPanOffset] = useState<number>(0);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef<{ startX: number; initialPan: number } | null>(null);
  const touchStartDistRef = useRef<number | null>(null);
  const initialZoomRef = useRef<number>(zoomVisibleCount);

  // Preload logo image for high-visibility canvas watermark
  const logoImgRef = useRef<HTMLImageElement | null>(null);
  useEffect(() => {
    const img = new Image();
    img.src = logoImageUrl || '/splash-image.png';
    img.onload = () => {
      logoImgRef.current = img;
    };
  }, [logoImageUrl]);

  // Dragging / moving an interactive drawn rectangle / square on the chart
  const draggedShapeRef = useRef<{
    id: string;
    startScreenX: number;
    startScreenY: number;
    initialTime1: number;
    initialPrice1: number;
    initialTime2: number;
    initialPrice2: number;
  } | null>(null);

  // Floating draggable toolbar position for Drawing Tools
  const [toolbarPos, setToolbarPos] = useState<{ x: number; y: number }>({ x: 20, y: 14 });
  const isDraggingToolbarRef = useRef(false);
  const toolbarDragOffsetRef = useRef<{ offsetX: number; offsetY: number }>({ offsetX: 0, offsetY: 0 });

  const handleToolbarTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    e.stopPropagation();
    isDraggingToolbarRef.current = true;
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    toolbarDragOffsetRef.current = {
      offsetX: clientX - toolbarPos.x,
      offsetY: clientY - toolbarPos.y
    };
  };

  useEffect(() => {
    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!isDraggingToolbarRef.current) return;
      const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
      const newX = Math.max(10, Math.min(window.innerWidth - 220, clientX - toolbarDragOffsetRef.current.offsetX));
      const newY = Math.max(10, Math.min(window.innerHeight - 80, clientY - toolbarDragOffsetRef.current.offsetY));
      setToolbarPos({ x: newX, y: newY });
    };

    const handleEnd = () => {
      isDraggingToolbarRef.current = false;
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchmove', handleMove);
    window.addEventListener('touchend', handleEnd);

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [toolbarPos]);

  // Track exact pixel coordinates of the live candle's close dot so RESULT (P/L) anchors directly to the candle
  const [liveCandleAnchor, setLiveCandleAnchor] = useState<{
    x: number;
    y: number;
    chartWidth: number;
    chartHeight: number;
  }>({ x: 220, y: 180, chartWidth: 360, chartHeight: 360 });

  // Auto-dismiss lastClosedTrade after 5 seconds ("Result p/f 5 second bad band ho hod ok fix")
  useEffect(() => {
    if (!lastClosedTrade) return;
    const timer = setTimeout(() => {
      clearLastClosedTrade();
    }, 5000);
    return () => clearTimeout(timer);
  }, [lastClosedTrade, clearLastClosedTrade]);

  // Interactive Pen & Drawing State
  const [draftLine, setDraftLine] = useState<{
    type: 'trendline' | 'freehand' | 'horizontal' | 'rectangle' | 'vertical' | 'ray' | 'fibonacci' | 'channel';
    time1: number;
    price1: number;
    time2: number;
    price2: number;
    points: { time: number; price: number }[];
  } | null>(null);
  const isDrawingRef = useRef(false);

  const chartDimsRef = useRef<{
    minPrice: number;
    maxPrice: number;
    topPadding: number;
    chartHeight: number;
    chartWidth: number;
    expandedRange: number;
    candleWidth: number;
    liveCandleX: number;
    latestCandleTime: number;
    firstCandleTime: number;
    timeframeMs: number;
  } | null>(null);

  // Prepare display candles (Heikin Ashi or standard)
  const displayCandles = useMemo<Candle[]>(() => {
    if (chartType === 'heikinAshi') {
      return toHeikinAshi(candles);
    }
    return candles;
  }, [candles, chartType]);

  // Compute indicators
  const smaValues = useMemo(() => {
    if (!indicators.sma) return [];
    return calculateSMA(displayCandles, indicators.smaPeriod);
  }, [displayCandles, indicators.sma, indicators.smaPeriod]);

  const emaValues = useMemo(() => {
    if (!indicators.ema) return [];
    return calculateEMA(displayCandles, indicators.emaPeriod);
  }, [displayCandles, indicators.ema, indicators.emaPeriod]);

  const bbands = useMemo(() => {
    if (!indicators.bbands) return null;
    return calculateBollingerBands(displayCandles, indicators.bbandsPeriod, indicators.bbandsStdDev);
  }, [displayCandles, indicators.bbands, indicators.bbandsPeriod, indicators.bbandsStdDev]);

  const rsiValues = useMemo(() => {
    if (!indicators.rsi) return [];
    return calculateRSI(displayCandles, indicators.rsiPeriod);
  }, [displayCandles, indicators.rsi, indicators.rsiPeriod]);

  const macdValues = useMemo(() => {
    if (!indicators.macd) return null;
    return calculateMACD(displayCandles, indicators.macdFast, indicators.macdSlow, indicators.macdSignal);
  }, [displayCandles, indicators.macd, indicators.macdFast, indicators.macdSlow, indicators.macdSignal]);

  const stochValues = useMemo(() => {
    if (!indicators.stoch) return null;
    return calculateStochastic(displayCandles, indicators.stochK, indicators.stochD);
  }, [displayCandles, indicators.stoch, indicators.stochK, indicators.stochD]);

  // Memoize 100+ active technical indicator line calculations for zero-lag smooth rendering
  const activeIndicatorSeries = useMemo(() => {
    if (!indicatorsEnabled || !activeIndicatorIds || activeIndicatorIds.length === 0) return [];
    return activeIndicatorIds
      .map((id) => {
        const def = ALL_INDICATORS.find((ind) => ind.id === id);
        if (!def) return null;
        return {
          def,
          values: def.calculate(displayCandles)
        };
      })
      .filter((item): item is { def: (typeof ALL_INDICATORS)[number]; values: (number | null)[] } => item !== null);
  }, [displayCandles, activeIndicatorIds, indicatorsEnabled]);

  // Helper to convert screen (x, y) into chart (time, price)
  const screenToChartCoords = (x: number, y: number) => {
    if (!chartDimsRef.current) return null;
    const {
      maxPrice,
      topPadding,
      chartHeight,
      expandedRange,
      candleWidth,
      liveCandleX,
      latestCandleTime,
      timeframeMs
    } = chartDimsRef.current;

    const price = Number(
      (maxPrice - ((y - topPadding) / chartHeight) * expandedRange).toFixed(activeAsset.decimalPlaces)
    );
    const time = Math.round(latestCandleTime + ((x - liveCandleX) / candleWidth) * timeframeMs);
    return { time, price };
  };

  const chartPriceToScreenY = (price: number) => {
    if (!chartDimsRef.current) return 0;
    const { topPadding, chartHeight, minPrice, expandedRange } = chartDimsRef.current;
    return topPadding + chartHeight - ((price - minPrice) / expandedRange) * chartHeight;
  };

  const chartTimeToScreenX = (timestamp: number) => {
    if (!chartDimsRef.current) return 0;
    const { liveCandleX, latestCandleTime, timeframeMs, candleWidth } = chartDimsRef.current;
    const idxFloat = (timestamp - latestCandleTime) / timeframeMs;
    return liveCandleX + idxFloat * candleWidth;
  };

  // Main rendering loop on high-DPI canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = container.clientWidth;
    const height = container.clientHeight;

    if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
      canvas.width = width * dpr;
      canvas.height = height * dpr;
    }

    ctx.save();
    ctx.scale(dpr, dpr);

    // Deep dark background
    ctx.fillStyle = '#0a0d14';
    ctx.fillRect(0, 0, width, height);

    if (displayCandles.length < 2) {
      ctx.restore();
      return;
    }

    // Allocate sub-chart space for oscillators
    let subChartTotal = 0;
    if (indicators.rsi) subChartTotal += 55;
    if (indicators.macd) subChartTotal += 55;
    if (indicators.stoch) subChartTotal += 55;

    const rightPadding = 72;
    const bottomPadding = 30 + subChartTotal;
    const topPadding = 18;
    const chartWidth = width - rightPadding;
    const chartHeight = height - bottomPadding - topPadding;

    const latestCandleIndex = displayCandles.length - 1;
    const latestCandle = displayCandles[latestCandleIndex];
    const timeframeMs = 60 * 1000;

    // Responsive candle sizing based on zoomVisibleCount (supports full zoom from 2 huge bars to 180 compact bars)
    const candleWidth = Math.max(2.5, Math.min(95, (chartWidth * 0.72) / Math.max(2, zoomVisibleCount)));
    const bodyWidth = Math.max(2, candleWidth * 0.72);

    // Default live candle is placed at ~64% of chartWidth (matching Quotex mobile screenshot)
    const defaultLiveX = Math.round(chartWidth * 0.64);
    const maxPan = Math.max(0, displayCandles.length - 8);
    const clampedPan = Math.max(0, Math.min(maxPan, panOffset));

    // Live candle X position with pan offset applied
    const liveCandleX = defaultLiveX + clampedPan * candleWidth;

    // Viewport bounds: candle k has X = liveCandleX - (latestCandleIndex - k) * candleWidth
    // Ensure candles seamlessly fill the entire chart width from x <= 0 to x >= chartWidth
    const minVisibleK = latestCandleIndex - Math.ceil((liveCandleX + candleWidth * 2) / candleWidth);
    const maxVisibleK = latestCandleIndex - Math.floor((liveCandleX - (chartWidth + candleWidth * 2)) / candleWidth);

    const startIdx = Math.max(0, minVisibleK);
    const endIdx = Math.min(displayCandles.length, maxVisibleK + 1);
    const candleSlice = displayCandles.slice(startIdx, endIdx);
    const startIndex = startIdx;

    // Calculate Min & Max Price from visible slice
    let minPrice = Infinity;
    let maxPrice = -Infinity;
    let minPriceIndex = 0;

    candleSlice.forEach((c, idx) => {
      if (c.low < minPrice) {
        minPrice = c.low;
        minPriceIndex = idx;
      }
      if (c.high > maxPrice) {
        maxPrice = c.high;
      }
    });

    // Ensure active trade strike lines and current live price are ALWAYS in bounds
    activeTrades.forEach((trade) => {
      if (trade.assetId === activeAsset.id) {
        if (trade.entryPrice < minPrice) minPrice = trade.entryPrice;
        if (trade.entryPrice > maxPrice) maxPrice = trade.entryPrice;
      }
    });
    if (activeAsset.currentPrice < minPrice) minPrice = activeAsset.currentPrice;
    if (activeAsset.currentPrice > maxPrice) maxPrice = activeAsset.currentPrice;

    if (bbands) {
      for (let i = startIndex; i < endIdx; i++) {
        const u = bbands.upper[i];
        const l = bbands.lower[i];
        if (u !== null && u > maxPrice) maxPrice = u;
        if (l !== null && l < minPrice) minPrice = l;
      }
    }

    // Add vertical headroom
    const priceRange = maxPrice - minPrice || 0.0005;
    minPrice -= priceRange * 0.16;
    maxPrice += priceRange * 0.16;
    const expandedRange = maxPrice - minPrice;

    const firstCandleTime = candleSlice[0]?.time || latestCandle.time;

    chartDimsRef.current = {
      minPrice,
      maxPrice,
      topPadding,
      chartHeight,
      chartWidth,
      expandedRange,
      candleWidth,
      liveCandleX,
      latestCandleTime: latestCandle.time,
      firstCandleTime,
      timeframeMs
    };

    const getY = (price: number) => {
      return topPadding + chartHeight - ((price - minPrice) / expandedRange) * chartHeight;
    };

    const getXForCandleIndex = (globalIdx: number) => {
      return liveCandleX - (latestCandleIndex - globalIdx) * candleWidth;
    };

    const getX = (indexInSlice: number) => {
      return getXForCandleIndex(startIndex + indexInSlice);
    };

    const getXFromTime = (timestamp: number) => {
      const idxFloat = (timestamp - latestCandle.time) / timeframeMs;
      return liveCandleX + idxFloat * candleWidth;
    };

    // 1. Sleek Background Watermark Logo & LIVE/DEMO text with user-adjustable size & opacity
    if (watermarkEnabled) {
      ctx.save();
      const effectiveLogoSize = Math.min(chartWidth * 0.75, chartHeight * 0.75, watermarkSize || 160);
      const effectiveOpacity = Math.max(0.02, Math.min(0.6, watermarkOpacity || 0.14));
      const showLogo = watermarkType === 'both' || watermarkType === 'logo';
      const showText = watermarkType === 'both' || watermarkType === 'text';

      const logoImg = logoImgRef.current;
      if (showLogo && logoImg && logoImg.complete && logoImg.naturalWidth > 0) {
        ctx.globalAlpha = effectiveOpacity;
        ctx.drawImage(
          logoImg,
          chartWidth * 0.5 - effectiveLogoSize / 2,
          topPadding + chartHeight * 0.42 - effectiveLogoSize / 2 - (showText ? 15 : 0),
          effectiveLogoSize,
          effectiveLogoSize
        );
      }

      if (showText) {
        ctx.globalAlpha = Math.max(0.04, effectiveOpacity * 0.7);
        ctx.fillStyle = '#ffffff';
        const fontSize = Math.max(32, Math.min(110, Math.round(effectiveLogoSize * 0.45)));
        ctx.font = `900 ${fontSize}px "Plus Jakarta Sans", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(
          accountType === 'REAL' ? 'LIVE' : 'DEMO',
          chartWidth * 0.5,
          topPadding + chartHeight * 0.42 + (showLogo ? effectiveLogoSize * 0.35 : 0)
        );
      }
      ctx.restore();
    }

    // 2. Subtle Grid Lines
    ctx.strokeStyle = '#141a24';
    ctx.lineWidth = 1;
    ctx.setLineDash([]);

    // Horizontal price grid lines
    const gridRows = 5;
    for (let i = 0; i <= gridRows; i++) {
      const y = topPadding + (chartHeight / gridRows) * i;
      const priceAtY = maxPrice - (i / gridRows) * expandedRange;

      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(chartWidth, y);
      ctx.stroke();

      // Price labels on right axis
      ctx.fillStyle = '#94a3b8';
      ctx.font = '11px "JetBrains Mono", monospace';
      ctx.textAlign = 'left';
      ctx.fillText(formatPrice(priceAtY, activeAsset.decimalPlaces), chartWidth + 6, y + 4);
    }

    // Vertical time grid lines synchronized with pan
    const gridCols = 4;
    for (let i = 0; i <= gridCols; i++) {
      const x = (chartWidth / gridCols) * i;
      ctx.beginPath();
      ctx.moveTo(x, topPadding);
      ctx.lineTo(x, topPadding + chartHeight);
      ctx.stroke();

      const timeAtX = latestCandle.time + ((x - liveCandleX) / candleWidth) * timeframeMs;
      const date = new Date(timeAtX);
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      ctx.fillStyle = '#94a3b8';
      ctx.font = '11px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${hours}:${minutes}`, x, topPadding + chartHeight + 18);
    }

    // 3. Bollinger Bands Fill
    if (bbands) {
      ctx.fillStyle = 'rgba(168, 85, 247, 0.05)';
      ctx.beginPath();
      let started = false;
      for (let i = 0; i < candleSlice.length; i++) {
        const u = bbands.upper[startIndex + i];
        if (u !== null) {
          const x = getX(i);
          const y = getY(u);
          if (!started) {
            ctx.moveTo(x, y);
            started = true;
          } else {
            ctx.lineTo(x, y);
          }
        }
      }
      for (let i = candleSlice.length - 1; i >= 0; i--) {
        const l = bbands.lower[startIndex + i];
        if (l !== null) {
          const x = getX(i);
          const y = getY(l);
          ctx.lineTo(x, y);
        }
      }
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = 'rgba(192, 132, 252, 0.45)';
      ctx.lineWidth = 1;
      ['upper', 'lower'].forEach((b) => {
        ctx.beginPath();
        let s = false;
        for (let i = 0; i < candleSlice.length; i++) {
          const bandsRecord = bbands as unknown as Record<string, (number | null)[]>;
          const val = bandsRecord[b][startIndex + i];
          if (val !== null) {
            const x = getX(i);
            const y = getY(val);
            if (!s) {
              ctx.moveTo(x, y);
              s = true;
            } else {
              ctx.lineTo(x, y);
            }
          }
        }
        ctx.stroke();
      });
    }

    // 4. Moving Averages
    if (indicators.sma && smaValues.length > 0) {
      ctx.beginPath();
      ctx.strokeStyle = '#eab308';
      ctx.lineWidth = 1.6;
      let started = false;
      for (let i = 0; i < candleSlice.length; i++) {
        const val = smaValues[startIndex + i];
        if (val !== null) {
          const x = getX(i);
          const y = getY(val);
          if (!started) {
            ctx.moveTo(x, y);
            started = true;
          } else {
            ctx.lineTo(x, y);
          }
        }
      }
      ctx.stroke();
    }

    if (indicators.ema && emaValues.length > 0) {
      ctx.beginPath();
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 1.6;
      let started = false;
      for (let i = 0; i < candleSlice.length; i++) {
        const val = emaValues[startIndex + i];
        if (val !== null) {
          const x = getX(i);
          const y = getY(val);
          if (!started) {
            ctx.moveTo(x, y);
            started = true;
          } else {
            ctx.lineTo(x, y);
          }
        }
      }
      ctx.stroke();
    }

    // 4.5. Render Master 100+ Live Technical Indicators (Only Lines, Memoized)
    if (indicatorsEnabled && activeIndicatorSeries.length > 0) {
      activeIndicatorSeries.forEach(({ def, values: calculated }) => {
        if (!calculated || calculated.length === 0) return;

        ctx.save();
        ctx.beginPath();
        ctx.strokeStyle = def.color;
        ctx.lineWidth = 1.8;
        let started = false;
        let lastVal: number | null = null;
        let lastX = 0;
        let lastY = 0;

        for (let i = 0; i < candleSlice.length; i++) {
          const val = calculated[startIndex + i];
          if (val !== null && val !== undefined && !isNaN(val)) {
            const x = getX(i);
            const y = getY(val);
            if (!started) {
              ctx.moveTo(x, y);
              started = true;
            } else {
              ctx.lineTo(x, y);
            }
            lastVal = val;
            lastX = x;
            lastY = y;
          }
        }
        ctx.stroke();

        // Draw indicator label near edge of chart if visible
        if (started && lastVal !== null && lastX > 30 && lastX <= chartWidth + 20) {
          ctx.fillStyle = def.color;
          ctx.font = 'bold 9px "JetBrains Mono", monospace';
          ctx.textAlign = 'left';
          const clampedY = Math.max(topPadding + 14, Math.min(chartHeight + topPadding - 10, lastY));
          ctx.fillText(def.shortName, Math.min(chartWidth - 55, lastX + 4), clampedY);
        }
        ctx.restore();
      });
    }
    const activePalette = CANDLE_COLOR_SCHEMES[candleColorScheme] || CANDLE_COLOR_SCHEMES.classic;
    const bullColor = activePalette.bullish;
    const bearColor = activePalette.bearish;

    if (chartType === 'line' || chartType === 'area') {
      ctx.beginPath();
      ctx.strokeStyle = bullColor;
      ctx.lineWidth = 2;
      candleSlice.forEach((c, idx) => {
        const x = getX(idx);
        const y = getY(c.close);
        if (idx === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();

      if (chartType === 'area' && candleSlice.length > 0) {
        ctx.lineTo(getX(candleSlice.length - 1), topPadding + chartHeight);
        ctx.lineTo(getX(0), topPadding + chartHeight);
        ctx.closePath();
        ctx.fillStyle = `${bullColor}18`;
        ctx.fill();
      }
    } else {
      candleSlice.forEach((c, idx) => {
        const x = getX(idx);
        const isBullish = c.close >= c.open;
        const color = isBullish ? bullColor : bearColor;

        const openY = getY(c.open);
        const closeY = getY(c.close);
        const highY = getY(c.high);
        const lowY = getY(c.low);

        // Wick
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(x, highY);
        ctx.lineTo(x, lowY);
        ctx.stroke();

        // Body
        const bodyTop = Math.min(openY, closeY);
        const bodyHeight = Math.max(2, Math.abs(closeY - openY));

        ctx.fillStyle = color;
        ctx.fillRect(x - bodyWidth / 2, bodyTop, bodyWidth, bodyHeight);
      });
    }

    // 6. Vertical Lines: Beginning of trade (dashed white line at live candle) & End of trade (to the right) matching screenshot
    const endX = Math.min(chartWidth - 28, liveCandleX + Math.max(44, candleWidth * 2.4));

    // Only draw "Beginning of trade" if live candle is within current screen view
    if (liveCandleX >= -10 && liveCandleX <= chartWidth + 10) {
      ctx.save();
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1.2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(liveCandleX, topPadding);
      ctx.lineTo(liveCandleX, topPadding + chartHeight);
      ctx.stroke();

      ctx.setLineDash([]);
      ctx.fillStyle = '#64748b';
      ctx.font = '10px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText('▶', liveCandleX - 6, topPadding + 10);
      ctx.fillText('Beginning of trade', liveCandleX - 6, topPadding + 23);
      ctx.restore();
    }

    // End of trade line (if on screen)
    if (endX >= -10 && endX <= chartWidth + 10) {
      ctx.save();
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1;
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(endX, topPadding);
      ctx.lineTo(endX, topPadding + chartHeight);
      ctx.stroke();

      ctx.fillStyle = '#64748b';
      ctx.font = '10px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('◀', endX + 5, topPadding + 10);
      ctx.fillText('End of trade', endX + 5, topPadding + 23);
      ctx.restore();
    }

    // 7. Lowest Price Tag
    if (minPriceIndex >= 0 && minPriceIndex < candleSlice.length) {
      const minX = getX(minPriceIndex);
      const lowestActual = candleSlice[minPriceIndex].low;
      const minY = getY(lowestActual);

      ctx.fillStyle = '#18202c';
      ctx.beginPath();
      ctx.roundRect(minX - 25, minY + 8, 50, 16, 4);
      ctx.fill();

      ctx.fillStyle = '#64748b';
      ctx.font = '9px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(formatPrice(lowestActual, activeAsset.decimalPlaces), minX, minY + 20);
    }

    // 8. User-Drawn Lines (Horizontal, Trendline, Ray, Vertical, Freehand Pen, Square, Fibonacci)
    const renderLineItem = (
      line: {
        type: 'horizontal' | 'vertical' | 'trendline' | 'ray' | 'freehand' | 'rectangle' | 'fibonacci' | 'channel';
        price1: number;
        time1?: number;
        price2?: number;
        time2?: number;
        price3?: number;
        points?: { time: number; price: number }[];
        color: string;
        label?: string;
      },
      isDraft = false
    ) => {
      if (line.type === 'horizontal') {
        const lineY = getY(line.price1);
        if (lineY >= topPadding && lineY <= topPadding + chartHeight) {
          ctx.save();
          ctx.strokeStyle = line.color || '#eab308';
          ctx.lineWidth = 2;
          ctx.setLineDash([6, 3]);
          ctx.beginPath();
          ctx.moveTo(0, lineY);
          ctx.lineTo(chartWidth, lineY);
          ctx.stroke();

          ctx.fillStyle = line.color || '#eab308';
          ctx.beginPath();
          ctx.roundRect(chartWidth + 3, lineY - 10, 66, 20, 4);
          ctx.fill();

          ctx.fillStyle = '#0a0d14';
          ctx.font = 'bold 10px "JetBrains Mono", monospace';
          ctx.textAlign = 'center';
          ctx.fillText(formatPrice(line.price1, activeAsset.decimalPlaces), chartWidth + 36, lineY + 4);
          ctx.restore();
        }
      } else if (line.type === 'trendline' && line.price2 !== undefined) {
        const y1 = getY(line.price1);
        const y2 = getY(line.price2);
        const x1 = line.time1 !== undefined ? getXFromTime(line.time1) : candleWidth * 4;
        const x2 = line.time2 !== undefined ? getXFromTime(line.time2) : chartWidth - candleWidth * 4;

        ctx.save();
        ctx.strokeStyle = line.color || '#eab308';
        ctx.lineWidth = 2.2;
        ctx.setLineDash(isDraft ? [4, 3] : []);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();

        ctx.fillStyle = line.color || '#eab308';
        ctx.beginPath();
        ctx.arc(x1, y1, 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x2, y2, 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else if (line.type === 'rectangle' && line.price2 !== undefined) {
        const y1 = getY(line.price1);
        const y2 = getY(line.price2);
        const x1 = line.time1 !== undefined ? getXFromTime(line.time1) : candleWidth * 2;
        const x2 = line.time2 !== undefined ? getXFromTime(line.time2) : chartWidth - candleWidth * 2;

        const left = Math.min(x1, x2);
        const top = Math.min(y1, y2);
        const rectW = Math.max(6, Math.abs(x2 - x1));
        const rectH = Math.max(6, Math.abs(y2 - y1));

        ctx.save();
        // Semi-transparent box fill
        ctx.fillStyle = (line.color || '#eab308') + '2e';
        ctx.fillRect(left, top, rectW, rectH);

        // Accent border
        ctx.strokeStyle = line.color || '#eab308';
        ctx.lineWidth = 2;
        ctx.setLineDash(isDraft ? [4, 3] : []);
        ctx.strokeRect(left, top, rectW, rectH);

        // 4 corner handles for easy move/resize visual indication
        const corners = [
          [left, top],
          [left + rectW, top],
          [left + rectW, top + rectH],
          [left, top + rectH]
        ];
        corners.forEach(([cx, cy]) => {
          ctx.fillStyle = '#ffffff';
          ctx.strokeStyle = line.color || '#eab308';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(cx, cy, 3.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        });

        // Label pill
        ctx.fillStyle = line.color || '#eab308';
        ctx.beginPath();
        ctx.roundRect(left + 3, top + 3, 44, 14, 3);
        ctx.fill();
        ctx.fillStyle = '#0a0d14';
        ctx.font = 'bold 9px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(line.label || 'ZONE', left + 25, top + 13);
        ctx.restore();
      } else if (line.type === 'vertical') {
        const x = line.time1 !== undefined ? getXFromTime(line.time1) : chartWidth / 2;
        if (x >= 0 && x <= chartWidth) {
          ctx.save();
          ctx.strokeStyle = line.color || '#eab308';
          ctx.lineWidth = 1.8;
          ctx.setLineDash(isDraft ? [4, 3] : [5, 4]);
          ctx.beginPath();
          ctx.moveTo(x, topPadding);
          ctx.lineTo(x, topPadding + chartHeight);
          ctx.stroke();

          // Time badge at bottom
          const date = new Date(line.time1 || Date.now());
          const timeStr = `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
          ctx.fillStyle = line.color || '#eab308';
          ctx.beginPath();
          ctx.roundRect(x - 22, topPadding + chartHeight - 18, 44, 16, 3);
          ctx.fill();
          ctx.fillStyle = '#0a0d14';
          ctx.font = 'bold 9px "JetBrains Mono", monospace';
          ctx.textAlign = 'center';
          ctx.fillText(timeStr, x, topPadding + chartHeight - 6);
          ctx.restore();
        }
      } else if (line.type === 'ray' && line.price2 !== undefined) {
        const y1 = getY(line.price1);
        const y2 = getY(line.price2);
        const x1 = line.time1 !== undefined ? getXFromTime(line.time1) : candleWidth * 4;
        const x2 = line.time2 !== undefined ? getXFromTime(line.time2) : chartWidth - candleWidth * 4;

        ctx.save();
        ctx.strokeStyle = line.color || '#eab308';
        ctx.lineWidth = 2.2;
        ctx.setLineDash(isDraft ? [4, 3] : []);

        // Ray extends through (x2, y2) to the edge of the screen
        const dx = x2 - x1;
        const dy = y2 - y1;
        const slope = Math.abs(dx) > 0.001 ? dy / dx : 0;
        const targetX = dx >= 0 ? chartWidth + 50 : -50;
        const targetY = y1 + slope * (targetX - x1);

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(targetX, targetY);
        ctx.stroke();

        ctx.fillStyle = line.color || '#eab308';
        ctx.beginPath();
        ctx.arc(x1, y1, 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x2, y2, 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else if (line.type === 'fibonacci' && line.price2 !== undefined) {
        const y1 = getY(line.price1);
        const y2 = getY(line.price2);
        const x1 = line.time1 !== undefined ? getXFromTime(line.time1) : 40;
        const x2 = line.time2 !== undefined ? getXFromTime(line.time2) : chartWidth - 40;
        const startX = Math.min(x1, x2);
        const endX = Math.max(chartWidth - 10, Math.max(x1, x2));

        const fibLevels = [
          { level: 0, label: '0.0%' },
          { level: 0.236, label: '23.6%' },
          { level: 0.382, label: '38.2%' },
          { level: 0.5, label: '50.0%' },
          { level: 0.618, label: '61.8%' },
          { level: 0.786, label: '78.6%' },
          { level: 1.0, label: '100.0%' }
        ];

        ctx.save();
        fibLevels.forEach((fib, idx) => {
          const currentFibPrice = line.price1 + (line.price2! - line.price1) * fib.level;
          const currentFibY = getY(currentFibPrice);

          ctx.strokeStyle = idx === 0 || idx === 6 ? '#00e599' : idx === 3 ? '#eab308' : '#38bdf8';
          ctx.lineWidth = 1.3;
          ctx.setLineDash(idx === 3 ? [] : [4, 4]);
          ctx.beginPath();
          ctx.moveTo(startX, currentFibY);
          ctx.lineTo(endX, currentFibY);
          ctx.stroke();

          // Level badge
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(endX - 54, currentFibY - 8, 50, 16);
          ctx.fillStyle = '#94a3b8';
          ctx.font = 'bold 9px "JetBrains Mono", monospace';
          ctx.textAlign = 'right';
          ctx.fillText(`${fib.label}`, endX - 8, currentFibY + 4);
        });
        ctx.restore();
      } else if (line.type === 'freehand' && line.points && line.points.length > 1) {
        ctx.save();
        ctx.strokeStyle = line.color || '#eab308';
        ctx.lineWidth = 2.2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.setLineDash([]);
        ctx.beginPath();
        line.points.forEach((pt, idx) => {
          const px = getXFromTime(pt.time);
          const py = getY(pt.price);
          if (idx === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        });
        ctx.stroke();
        ctx.restore();
      }
    };

    drawnLines.forEach((l) => renderLineItem(l, false));
    if (draftLine) {
      renderLineItem({ ...draftLine, color: drawingColor }, true);
    }

    // 9. Active Trades Strike Lines & Circular Arrow Badges ONLY ("is tera show ho ok na timer na amount only arrow ok")
    const assetTrades = activeTrades.filter((t) => t.assetId === activeAsset.id);
    assetTrades.forEach((trade, idx) => {
      const tradeY = getY(trade.entryPrice);
      const isUp = trade.direction === 'UP';
      const color = isUp ? '#10b981' : '#ff5733';

      // Position arrow circles neatly along the horizontal trade line to the left of liveCandleX
      // matching Capture+_2026-10-12-09-03-37.png (no timer, no amount, ONLY arrow inside circle)
      const spacing = 17;
      const circleX = Math.max(14, liveCandleX - 18 - idx * spacing);

      ctx.save();

      // Solid horizontal strike line from the arrow circle through liveCandleX to End of trade (endX)
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.6;
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(circleX, tradeY);
      ctx.lineTo(Math.max(liveCandleX + 24, endX), tradeY);
      ctx.stroke();

      // Small white-filled circle with colored border right at (liveCandleX, tradeY) on the vertical dashed line
      if (liveCandleX >= 0 && liveCandleX <= chartWidth) {
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(liveCandleX, tradeY, 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }

      // Circular badge with ONLY the arrow inside (no timer, no dollar amount)
      const r = 8;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(circleX, tradeY, r, 0, Math.PI * 2);
      ctx.fill();

      // Subtle outer ring on the arrow badge
      ctx.strokeStyle = 'rgba(255,255,255,0.28)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Crisp white arrow (↑ for UP, ↓ for DOWN) inside the circle
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.8;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      if (isUp) {
        // Up arrow ↑
        ctx.moveTo(circleX, tradeY + 4);
        ctx.lineTo(circleX, tradeY - 4);
        ctx.moveTo(circleX - 3.2, tradeY - 1);
        ctx.lineTo(circleX, tradeY - 4.2);
        ctx.lineTo(circleX + 3.2, tradeY - 1);
      } else {
        // Down arrow ↓
        ctx.moveTo(circleX, tradeY - 4);
        ctx.lineTo(circleX, tradeY + 4);
        ctx.moveTo(circleX - 3.2, tradeY + 1);
        ctx.lineTo(circleX, tradeY + 4.2);
        ctx.lineTo(circleX + 3.2, tradeY + 1);
      }
      ctx.stroke();

      ctx.restore();
    });

    // 10. Live Strike Price Line & Strictly 1-Minute Candle Countdown Timer (NO green/red dot on the candle bar!)
    const currentPrice = activeAsset.currentPrice;
    const currentY = getY(currentPrice);

    ctx.save();
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1.2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(0, currentY);
    ctx.lineTo(chartWidth, currentY);
    ctx.stroke();
    ctx.restore();

    // Update anchor coordinates only when lastClosedTrade is visible so we avoid extra state updates on every tick
    if (lastClosedTrade) {
      setLiveCandleAnchor((prev) => {
        if (
          Math.abs(prev.x - liveCandleX) > 2 ||
          Math.abs(prev.y - currentY) > 2 ||
          prev.chartWidth !== chartWidth
        ) {
          return { x: liveCandleX, y: currentY, chartWidth, chartHeight };
        }
        return prev;
      });
    }

    // Strictly 1-minute (60s) candle countdown pill on the current price line
    const candleRemainingSec = 60 - (Math.floor(Date.now() / 1000) % 60);
    const mins = Math.floor(candleRemainingSec / 60);
    const secs = candleRemainingSec % 60;
    const timeFormatted = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    const timerPillWidth = 46;
    const timerPillHeight = 20;
    const timerPillX = chartWidth - timerPillWidth - 14;
    const timerPillY = currentY - timerPillHeight / 2;

    ctx.fillStyle = '#1e2636';
    ctx.beginPath();
    ctx.roundRect(timerPillX, timerPillY, timerPillWidth, timerPillHeight, 5);
    ctx.fill();

    ctx.strokeStyle = '#2e3a4e';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = '#e2e8f0';
    ctx.font = '11px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(timeFormatted, timerPillX + timerPillWidth / 2, timerPillY + 14);

    // Blue Price Pill on Right Axis (Matches 0.93214 rounded blue pill in screenshot!)
    const tagWidth = 68;
    const tagHeight = 24;
    const tagX = chartWidth + 2;
    const tagY = currentY - tagHeight / 2;

    ctx.fillStyle = '#2596ff';
    ctx.beginPath();
    ctx.roundRect(tagX, tagY, tagWidth, tagHeight, 12);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(formatPrice(currentPrice, activeAsset.decimalPlaces), tagX + tagWidth / 2, tagY + 16);

    // 11. Sub-charts: RSI, MACD, Stochastic
    let currentSubY = topPadding + chartHeight + 25;

    if (indicators.rsi && rsiValues.length > 0) {
      const subH = 50;
      ctx.fillStyle = '#0a0d14';
      ctx.fillRect(0, currentSubY, chartWidth, subH);
      ctx.strokeStyle = '#1b2332';
      ctx.strokeRect(0, currentSubY, chartWidth, subH);

      const y70 = currentSubY + subH * 0.3;
      const y30 = currentSubY + subH * 0.7;
      ctx.strokeStyle = '#ef444455';
      ctx.beginPath();
      ctx.moveTo(0, y70);
      ctx.lineTo(chartWidth, y70);
      ctx.stroke();
      ctx.strokeStyle = '#22c55e55';
      ctx.beginPath();
      ctx.moveTo(0, y30);
      ctx.lineTo(chartWidth, y30);
      ctx.stroke();

      ctx.fillStyle = '#38bdf8';
      ctx.font = '10px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'left';
      const curRsi = rsiValues[rsiValues.length - 1];
      ctx.fillText(`RSI (${indicators.rsiPeriod}): ${curRsi ? curRsi.toFixed(1) : '--'}`, 6, currentSubY + 12);

      ctx.beginPath();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.4;
      let s = false;
      for (let i = 0; i < candleSlice.length; i++) {
        const val = rsiValues[startIndex + i];
        if (val !== null) {
          const x = getX(i);
          const y = currentSubY + subH - (val / 100) * subH;
          if (!s) {
            ctx.moveTo(x, y);
            s = true;
          } else {
            ctx.lineTo(x, y);
          }
        }
      }
      ctx.stroke();
      currentSubY += 55;
    }

    if (indicators.macd && macdValues) {
      const subH = 50;
      ctx.fillStyle = '#0a0d14';
      ctx.fillRect(0, currentSubY, chartWidth, subH);
      ctx.strokeStyle = '#1b2332';
      ctx.strokeRect(0, currentSubY, chartWidth, subH);

      ctx.fillStyle = '#10b981';
      ctx.font = '10px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('MACD (12, 26, 9)', 6, currentSubY + 12);

      const midY = currentSubY + subH / 2;
      ctx.strokeStyle = '#334155';
      ctx.beginPath();
      ctx.moveTo(0, midY);
      ctx.lineTo(chartWidth, midY);
      ctx.stroke();

      for (let i = 0; i < candleSlice.length; i++) {
        const h = macdValues.histogram[startIndex + i];
        if (h !== null) {
          const x = getX(i);
          const barH = Math.min(22, Math.max(-22, h * 1200));
          ctx.fillStyle = barH >= 0 ? '#10b981' : '#f43f5e';
          ctx.fillRect(x - 1.5, midY - barH, 3, barH);
        }
      }
      currentSubY += 55;
    }

    if (indicators.stoch && stochValues) {
      const subH = 50;
      ctx.fillStyle = '#0a0d14';
      ctx.fillRect(0, currentSubY, chartWidth, subH);
      ctx.strokeStyle = '#1b2332';
      ctx.strokeRect(0, currentSubY, chartWidth, subH);

      ctx.fillStyle = '#fb7185';
      ctx.font = '10px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('Stochastic (14, 3)', 6, currentSubY + 12);

      ctx.beginPath();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.3;
      let s = false;
      for (let i = 0; i < candleSlice.length; i++) {
        const val = stochValues.k[startIndex + i];
        if (val !== null) {
          const x = getX(i);
          const y = currentSubY + subH - (val / 100) * subH;
          if (!s) {
            ctx.moveTo(x, y);
            s = true;
          } else {
            ctx.lineTo(x, y);
          }
        }
      }
      ctx.stroke();
    }

    // 12. Crosshair on touch / mouse
    if (
      mousePos &&
      mousePos.x >= 0 &&
      mousePos.x <= chartWidth &&
      mousePos.y >= topPadding &&
      mousePos.y <= topPadding + chartHeight
    ) {
      ctx.save();
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 3]);

      ctx.beginPath();
      ctx.moveTo(mousePos.x, topPadding);
      ctx.lineTo(mousePos.x, topPadding + chartHeight);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, mousePos.y);
      ctx.lineTo(chartWidth, mousePos.y);
      ctx.stroke();
      ctx.restore();
    }

    ctx.restore();
  }, [
    displayCandles,
    activeAsset,
    chartType,
    candleColorScheme,
    indicators,
    activeTrades,
    mousePos,
    smaValues,
    emaValues,
    bbands,
    rsiValues,
    macdValues,
    stochValues,
    timeframe,
    accountType,
    drawnLines,
    draftLine,
    drawingColor,
    zoomVisibleCount,
    panOffset,
    watermarkEnabled,
    watermarkSize,
    watermarkOpacity,
    watermarkType,
    indicatorsEnabled,
    activeIndicatorSeries,
    lastClosedTrade
  ]);

  // ResizeObserver
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const dpr = window.devicePixelRatio || 1;
      const width = container.clientWidth;
      const height = container.clientHeight;
      if (width > 0 && height > 0) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
      }
    });

    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, []);

  // Start drawing or panning with Mouse
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (activeDrawingTool !== 'none') {
      const coords = screenToChartCoords(x, y);
      if (!coords) return;

      if (activeDrawingTool === 'horizontal') {
        addDrawnLine({
          type: 'horizontal',
          price1: coords.price,
          color: drawingColor
        });
        return;
      }

      if (activeDrawingTool === 'vertical') {
        addDrawnLine({
          type: 'vertical',
          time1: coords.time,
          price1: coords.price,
          color: drawingColor
        });
        return;
      }

      if (activeDrawingTool === 'rectangle') {
        isDrawingRef.current = true;
        setDraftLine({
          type: 'rectangle',
          time1: coords.time,
          price1: coords.price,
          time2: coords.time,
          price2: coords.price,
          points: []
        });
        return;
      }

      if (activeDrawingTool === 'ray') {
        isDrawingRef.current = true;
        setDraftLine({
          type: 'ray',
          time1: coords.time,
          price1: coords.price,
          time2: coords.time,
          price2: coords.price,
          points: []
        });
        return;
      }

      if (activeDrawingTool === 'fibonacci') {
        isDrawingRef.current = true;
        setDraftLine({
          type: 'fibonacci',
          time1: coords.time,
          price1: coords.price,
          time2: coords.time,
          price2: coords.price,
          points: []
        });
        return;
      }

      isDrawingRef.current = true;
      setDraftLine({
        type: activeDrawingTool === 'freehand' ? 'freehand' : 'trendline',
        time1: coords.time,
        price1: coords.price,
        time2: coords.time,
        price2: coords.price,
        points: [{ time: coords.time, price: coords.price }]
      });
      return;
    }

    // Check if user clicked inside any existing rectangle to MOVE it around
    if (activeDrawingTool === 'none' && chartDimsRef.current) {
      for (let i = drawnLines.length - 1; i >= 0; i--) {
        const l = drawnLines[i];
        if (l.type === 'rectangle' && l.time1 !== undefined && l.time2 !== undefined && l.price2 !== undefined) {
          const x1 = chartTimeToScreenX(l.time1);
          const x2 = chartTimeToScreenX(l.time2);
          const y1 = chartPriceToScreenY(l.price1);
          const y2 = chartPriceToScreenY(l.price2);
          const left = Math.min(x1, x2);
          const right = Math.max(x1, x2);
          const top = Math.min(y1, y2);
          const bottom = Math.max(y1, y2);
          if (x >= left - 8 && x <= right + 8 && y >= top - 8 && y <= bottom + 8) {
            draggedShapeRef.current = {
              id: l.id,
              startScreenX: x,
              startScreenY: y,
              initialTime1: l.time1,
              initialPrice1: l.price1,
              initialTime2: l.time2,
              initialPrice2: l.price2
            };
            return;
          }
        }
      }
    }

    isDraggingRef.current = true;
    dragStartRef.current = { startX: e.clientX, initialPan: panOffset };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Moving an existing rectangle shape around the chart
    if (draggedShapeRef.current && chartDimsRef.current) {
      const deltaX = x - draggedShapeRef.current.startScreenX;
      const deltaY = y - draggedShapeRef.current.startScreenY;
      const candleW = Math.max(4, chartDimsRef.current.candleWidth || 8);
      const deltaCandles = deltaX / candleW;
      const deltaTime = deltaCandles * (60 * 1000);
      const priceRange = chartDimsRef.current.expandedRange || 1;
      const chartH = chartDimsRef.current.chartHeight || 300;
      const deltaPrice = -(deltaY / chartH) * priceRange;

      updateDrawnLine(draggedShapeRef.current.id, {
        time1: Math.round(draggedShapeRef.current.initialTime1 + deltaTime),
        time2: Math.round(draggedShapeRef.current.initialTime2 + deltaTime),
        price1: Number((draggedShapeRef.current.initialPrice1 + deltaPrice).toFixed(activeAsset.decimalPlaces)),
        price2: Number((draggedShapeRef.current.initialPrice2 + deltaPrice).toFixed(activeAsset.decimalPlaces))
      });
      setMousePos({ x, y });
      return;
    }

    if (isDrawingRef.current && draftLine) {
      const coords = screenToChartCoords(x, y);
      if (coords) {
        setDraftLine((prev) =>
          prev
            ? {
                ...prev,
                time2: coords.time,
                price2: coords.price,
                points: prev.points ? [...prev.points, { time: coords.time, price: coords.price }] : []
              }
            : null
        );
      }
      setMousePos({ x, y });
      return;
    }

    if (isDraggingRef.current && dragStartRef.current && chartDimsRef.current) {
      const deltaX = e.clientX - dragStartRef.current.startX;
      const candleW = Math.max(4, chartDimsRef.current.candleWidth || 8);
      const deltaCandles = Math.round(deltaX / candleW);
      const maxPan = Math.max(0, displayCandles.length - 8);
      const newPan = Math.max(0, Math.min(maxPan, dragStartRef.current.initialPan + deltaCandles));
      setPanOffset(newPan);
    }

    setMousePos({ x, y });
  };

  const finishDrawing = () => {
    draggedShapeRef.current = null;
    if (isDrawingRef.current && draftLine) {
      isDrawingRef.current = false;
      if (draftLine.type === 'rectangle') {
        const timeSpan =
          Math.abs(draftLine.time2 - draftLine.time1) < 1000
            ? 60 * 1000 * 5
            : Math.abs(draftLine.time2 - draftLine.time1);
        const minT = Math.min(draftLine.time1, draftLine.time2);
        const p1 = Math.max(draftLine.price1, draftLine.price2);
        const p2 = Math.min(draftLine.price1, draftLine.price2);
        addDrawnLine({
          type: 'rectangle',
          time1: minT,
          price1: p1,
          time2: minT + timeSpan,
          price2: p2,
          color: drawingColor,
          label: 'ZONE'
        });
      } else if (draftLine.type === 'ray') {
        const timeSpan =
          Math.abs(draftLine.time2 - draftLine.time1) < 1000
            ? 60 * 1000 * 6
            : draftLine.time2 - draftLine.time1;
        addDrawnLine({
          type: 'ray',
          time1: draftLine.time1,
          price1: draftLine.price1,
          time2: draftLine.time1 + timeSpan,
          price2: draftLine.price2,
          color: drawingColor,
          label: 'RAY'
        });
      } else if (draftLine.type === 'fibonacci') {
        const timeSpan =
          Math.abs(draftLine.time2 - draftLine.time1) < 1000
            ? 60 * 1000 * 10
            : draftLine.time2 - draftLine.time1;
        addDrawnLine({
          type: 'fibonacci',
          time1: draftLine.time1,
          price1: draftLine.price1,
          time2: draftLine.time1 + timeSpan,
          price2: draftLine.price2,
          color: drawingColor,
          label: 'FIBONACCI'
        });
      } else if (draftLine.type === 'freehand' && draftLine.points && draftLine.points.length > 1) {
        addDrawnLine({
          type: 'freehand',
          price1: draftLine.price1,
          points: draftLine.points,
          color: drawingColor
        });
      } else {
        const timeSpan =
          Math.abs(draftLine.time2 - draftLine.time1) < 1000
            ? 60 * 1000 * 6
            : draftLine.time2 - draftLine.time1;
        addDrawnLine({
          type: 'trendline',
          time1: draftLine.time1,
          price1: draftLine.price1,
          time2: draftLine.time1 + timeSpan,
          price2: draftLine.price2,
          color: drawingColor
        });
      }
      setDraftLine(null);
    }
    isDraggingRef.current = false;
    dragStartRef.current = null;
  };

  const handleMouseUp = () => {
    finishDrawing();
  };

  const handleMouseLeave = () => {
    finishDrawing();
    setMousePos(null);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    if (e.touches.length === 2) {
      isDraggingRef.current = false;
      dragStartRef.current = null;
      draggedShapeRef.current = null;
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      touchStartDistRef.current = dist;
      initialZoomRef.current = zoomVisibleCount;
    } else if (e.touches.length === 1) {
      const clickX = e.touches[0].clientX - rect.left;
      const clickY = e.touches[0].clientY - rect.top;

      if (activeDrawingTool !== 'none') {
        const coords = screenToChartCoords(clickX, clickY);
        if (!coords) return;

        if (activeDrawingTool === 'horizontal') {
          addDrawnLine({
            type: 'horizontal',
            price1: coords.price,
            color: drawingColor
          });
          return;
        }

        if (activeDrawingTool === 'vertical') {
          addDrawnLine({
            type: 'vertical',
            time1: coords.time,
            price1: coords.price,
            color: drawingColor
          });
          return;
        }

        if (activeDrawingTool === 'rectangle') {
          isDrawingRef.current = true;
          setDraftLine({
            type: 'rectangle',
            time1: coords.time,
            price1: coords.price,
            time2: coords.time,
            price2: coords.price,
            points: []
          });
          return;
        }

        if (activeDrawingTool === 'ray') {
          isDrawingRef.current = true;
          setDraftLine({
            type: 'ray',
            time1: coords.time,
            price1: coords.price,
            time2: coords.time,
            price2: coords.price,
            points: []
          });
          return;
        }

        if (activeDrawingTool === 'fibonacci') {
          isDrawingRef.current = true;
          setDraftLine({
            type: 'fibonacci',
            time1: coords.time,
            price1: coords.price,
            time2: coords.time,
            price2: coords.price,
            points: []
          });
          return;
        }

        isDrawingRef.current = true;
        setDraftLine({
          type: activeDrawingTool === 'freehand' ? 'freehand' : 'trendline',
          time1: coords.time,
          price1: coords.price,
          time2: coords.time,
          price2: coords.price,
          points: [{ time: coords.time, price: coords.price }]
        });
        return;
      }

      // Check if touching inside an existing rectangle to move it
      if (activeDrawingTool === 'none' && chartDimsRef.current) {
        for (let i = drawnLines.length - 1; i >= 0; i--) {
          const l = drawnLines[i];
          if (l.type === 'rectangle' && l.time1 !== undefined && l.time2 !== undefined && l.price2 !== undefined) {
            const x1 = chartTimeToScreenX(l.time1);
            const x2 = chartTimeToScreenX(l.time2);
            const y1 = chartPriceToScreenY(l.price1);
            const y2 = chartPriceToScreenY(l.price2);
            const left = Math.min(x1, x2);
            const right = Math.max(x1, x2);
            const top = Math.min(y1, y2);
            const bottom = Math.max(y1, y2);
            if (clickX >= left - 12 && clickX <= right + 12 && clickY >= top - 12 && clickY <= bottom + 12) {
              draggedShapeRef.current = {
                id: l.id,
                startScreenX: clickX,
                startScreenY: clickY,
                initialTime1: l.time1,
                initialPrice1: l.price1,
                initialTime2: l.time2,
                initialPrice2: l.price2
              };
              return;
            }
          }
        }
      }

      isDraggingRef.current = true;
      dragStartRef.current = { startX: e.touches[0].clientX, initialPan: panOffset };
      setMousePos({ x: clickX, y: clickY });
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    if (e.touches.length === 1 && draggedShapeRef.current && chartDimsRef.current) {
      const moveX = e.touches[0].clientX - rect.left;
      const moveY = e.touches[0].clientY - rect.top;
      const deltaX = moveX - draggedShapeRef.current.startScreenX;
      const deltaY = moveY - draggedShapeRef.current.startScreenY;
      const candleW = Math.max(4, chartDimsRef.current.candleWidth || 8);
      const deltaCandles = deltaX / candleW;
      const deltaTime = deltaCandles * (60 * 1000);
      const priceRange = chartDimsRef.current.expandedRange || 1;
      const chartH = chartDimsRef.current.chartHeight || 300;
      const deltaPrice = -(deltaY / chartH) * priceRange;

      updateDrawnLine(draggedShapeRef.current.id, {
        time1: Math.round(draggedShapeRef.current.initialTime1 + deltaTime),
        time2: Math.round(draggedShapeRef.current.initialTime2 + deltaTime),
        price1: Number((draggedShapeRef.current.initialPrice1 + deltaPrice).toFixed(activeAsset.decimalPlaces)),
        price2: Number((draggedShapeRef.current.initialPrice2 + deltaPrice).toFixed(activeAsset.decimalPlaces))
      });
      setMousePos({ x: moveX, y: moveY });
      return;
    }

    if (e.touches.length === 1 && isDrawingRef.current && draftLine) {
      const moveX = e.touches[0].clientX - rect.left;
      const moveY = e.touches[0].clientY - rect.top;
      const coords = screenToChartCoords(moveX, moveY);
      if (coords) {
        setDraftLine((prev) =>
          prev
            ? {
                ...prev,
                time2: coords.time,
                price2: coords.price,
                points: prev.points ? [...prev.points, { time: coords.time, price: coords.price }] : []
              }
            : null
        );
      }
      setMousePos({ x: moveX, y: moveY });
      return;
    }

    if (e.touches.length === 2 && touchStartDistRef.current) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const currentDist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      if (currentDist > 10 && touchStartDistRef.current > 10) {
        const scale = currentDist / touchStartDistRef.current;
        const targetCount = Math.round(initialZoomRef.current / scale);
        const clamped = Math.max(2, Math.min(180, targetCount));
        setZoomVisibleCount(clamped);
      }
    } else if (e.touches.length === 1 && isDraggingRef.current && dragStartRef.current && chartDimsRef.current) {
      const deltaX = e.touches[0].clientX - dragStartRef.current.startX;
      const candleW = Math.max(4, chartDimsRef.current.candleWidth || 8);
      const deltaCandles = Math.round(deltaX / candleW);
      const maxPan = Math.max(0, displayCandles.length - 8);
      const newPan = Math.max(0, Math.min(maxPan, dragStartRef.current.initialPan + deltaCandles));
      setPanOffset(newPan);

      setMousePos({
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      });
    }
  };

  const handleTouchEnd = () => {
    draggedShapeRef.current = null;
    if (isDrawingRef.current) {
      finishDrawing();
    }
    touchStartDistRef.current = null;
    isDraggingRef.current = false;
    dragStartRef.current = null;
    setTimeout(() => {
      setMousePos(null);
    }, 1200);
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      zoomIn();
    } else {
      zoomOut();
    }
  };

  const anyIndicatorActive =
    indicators.sma ||
    indicators.ema ||
    indicators.bbands ||
    indicators.rsi ||
    indicators.macd ||
    indicators.stoch;

  const penColors = ['#eab308', '#00e599', '#ff3355', '#38bdf8', '#c084fc', '#ffffff'];

  // Compute compact RESULT (P/F) Box Position & Styling right next to the live trading candle ("fix result p/f ko chota rako ok fix")
  const renderResultBubbleNextToCandle = () => {
    if (!lastClosedTrade || !showResultPopupEnabled) return null;

    const isWon = lastClosedTrade.status === 'WON';
    const isTie = lastClosedTrade.status === 'TIE';
    const isRedSell = lastClosedTrade.direction === 'DOWN';

    // Total return payout on win
    const totalReturn = isWon
      ? Number((lastClosedTrade.amount + (lastClosedTrade.actualProfit || 0)).toFixed(2))
      : lastClosedTrade.amount;

    const formattedAmount = isWon
      ? `+${totalReturn.toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        })} $`
      : isTie
      ? `0.00 $`
      : `-${lastClosedTrade.amount.toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        })} $`;

    // Compact dimensions so it stays small and unobtrusive next to the candle
    const boxWidth = 114;
    const boxHeight = 42;
    const clampedLeft = Math.max(8, Math.min(liveCandleAnchor.chartWidth - boxWidth - 10, liveCandleAnchor.x - boxWidth - 8));
    const clampedTop = Math.max(14, Math.min(liveCandleAnchor.chartHeight - boxHeight - 8, liveCandleAnchor.y - boxHeight / 2));

    const bgClass = isRedSell
      ? 'bg-[#e11d48]/95 border-[#ff4d6b]/60 shadow-[0_4px_14px_rgba(225,29,72,0.45)]'
      : 'bg-[#0ca65a]/95 border-[#22c55e]/60 shadow-[0_4px_14px_rgba(12,166,90,0.45)]';

    const pointerColorClass = isRedSell ? 'bg-[#e11d48]/95' : 'bg-[#0ca65a]/95';

    return (
      <div
        style={{
          left: `${clampedLeft}px`,
          top: `${clampedTop}px`,
          width: `${boxWidth}px`
        }}
        className="absolute z-30 select-none pointer-events-auto transition-all duration-150"
      >
        <div className={`relative rounded-md px-2 py-1 text-white border backdrop-blur-xs ${bgClass}`}>
          {/* Top Row: Compact RESULT (P/F) and Close × button */}
          <div className="flex items-center justify-between">
            <span className="text-[8.5px] font-bold uppercase tracking-wider text-white/90 leading-none">
              RESULT (P/F)
            </span>
            <button
              onClick={clearLastClosedTrade}
              className="text-white/75 hover:text-white transition-colors -mr-0.5 p-0.5 cursor-pointer"
              title="Close"
            >
              <X className="w-3 h-3 stroke-[2.5]" />
            </button>
          </div>

          {/* Bottom Row: Compact Payout Amount */}
          <div className="text-[12px] font-extrabold font-mono-num tracking-tight text-white mt-0.5 leading-tight truncate">
            {formattedAmount}
          </div>

          {/* Small right-side triangle pointer */}
          <div
            className={`absolute -right-1 top-1/2 -translate-y-1/2 w-2 h-2 rotate-45 ${pointerColorClass}`}
          />
        </div>
      </div>
    );
  };

  return (
    <div
      ref={containerRef}
      style={{
        backgroundImage: backgroundImageUrl ? `url(${backgroundImageUrl})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
      className={`relative w-full h-full select-none overflow-hidden touch-none bg-[#0a0d14] transition-[background-image] duration-300 ${className || ''}`}
    >
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onWheel={handleWheel}
        className="block w-full h-full cursor-crosshair touch-none"
      />

      {/* RESULT (P/F) Compact Speech Bubble anchored directly next to the live trading candle */}
      {renderResultBubbleNextToCandle()}

      {/* Top-Left Chart Buttons matching exact screenshot: Eye Button + Bag Icon + Pen Tool ("is tera ka eye button ho is jaga bag icon and pen tool ho") */}
      <div className="absolute top-2.5 left-2.5 z-20 flex flex-col items-center gap-2">
        {/* 1. Eye Toggle Button (Hides / Shows Chart Controls) */}
        {showEyeButton && (
          <button
            onClick={() => setShowChartButtons(!showChartButtons)}
            className="w-9 h-9 rounded-xl bg-[#141b27]/90 hover:bg-[#1c2637] border border-[#232f44] flex items-center justify-center text-slate-300 hover:text-white shadow-lg transition-all active:scale-95 cursor-pointer"
            title={showChartButtons ? 'Hide Chart Icons' : 'Show Chart Icons'}
          >
            {showChartButtons ? (
              <Eye className="w-4 h-4 stroke-[2]" />
            ) : (
              <EyeOff className="w-4 h-4 stroke-[2] text-slate-500" />
            )}
          </button>
        )}

        {/* 2. Bag / Briefcase Icon (Opens Active Trades & 24h Trade Records Drawer) */}
        {showChartButtons && showBagButton && (
          <button
            onClick={() => {
              if (onOpenActiveTrades) onOpenActiveTrades();
            }}
            className="relative w-9 h-9 rounded-xl bg-[#141b27]/90 hover:bg-[#1c2637] border border-[#232f44] flex items-center justify-center text-slate-300 hover:text-white shadow-lg transition-all active:scale-95 cursor-pointer"
            title="Active Trades & Orders"
          >
            <Briefcase className="w-4 h-4 stroke-[2]" />
            {activeTrades.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-[#0099ff] text-white text-[9px] font-black rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center shadow">
                {activeTrades.length}
              </span>
            )}
          </button>
        )}

        {/* 3. Pen Tool Button (Toggles Interactive Chart Drawing Tools) */}
        {showChartButtons && showPenButton && (
          <button
            onClick={() =>
              setActiveDrawingTool(activeDrawingTool === 'none' ? 'trendline' : 'none')
            }
            className={`relative w-9 h-9 rounded-xl border flex items-center justify-center shadow-lg transition-all active:scale-95 cursor-pointer ${
              activeDrawingTool !== 'none'
                ? 'bg-amber-400 text-slate-950 border-amber-300'
                : 'bg-[#141b27]/90 hover:bg-[#1c2637] border-[#232f44] text-slate-300 hover:text-white'
            }`}
            title="Pen & Drawing Tool"
          >
            <PenTool className="w-4 h-4 stroke-[2]" />
            {drawnLines.length > 0 && activeDrawingTool === 'none' && (
              <span className="absolute -top-1 -right-1 bg-amber-400 text-slate-950 text-[9px] font-black rounded-full w-4 h-4 flex items-center justify-center">
                {drawnLines.length}
              </span>
            )}
          </button>
        )}
      </div>

      {/* Interactive Pen Tool Floating & Draggable Toolbar (Float anywhere on screen if enabled) */}
      {activeDrawingTool !== 'none' && (
        <div
          style={{
            left: `${toolbarPos.x}px`,
            top: `${toolbarPos.y}px`
          }}
          className="absolute z-40 flex flex-wrap items-center gap-1.5 bg-[#101622]/95 backdrop-blur-md border border-amber-400/60 rounded-xl px-2.5 py-1.5 shadow-2xl max-w-[94vw]"
        >
          {/* Draggable Handle */}
          <div
            onMouseDown={handleToolbarTouchStart}
            onTouchStart={handleToolbarTouchStart}
            className="cursor-grab active:cursor-grabbing p-1 text-amber-400/80 hover:text-amber-300 flex items-center justify-center shrink-0"
            title="Drag toolbar anywhere"
          >
            <GripHorizontal className="w-4 h-4" />
          </div>

          {/* Tool Buttons */}
          <div className="flex items-center gap-1 flex-wrap">
            <button
              onClick={() => setActiveDrawingTool('trendline')}
              className={`px-2 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-colors ${
                activeDrawingTool === 'trendline'
                  ? 'bg-amber-400 text-slate-950 font-black'
                  : 'bg-[#1c2638] text-slate-300 hover:text-white'
              }`}
            >
              Line
            </button>
            <button
              onClick={() => setActiveDrawingTool('ray')}
              className={`px-2 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-colors ${
                activeDrawingTool === 'ray'
                  ? 'bg-amber-400 text-slate-950 font-black'
                  : 'bg-[#1c2638] text-slate-300 hover:text-white'
              }`}
            >
              Ray
            </button>
            <button
              onClick={() => setActiveDrawingTool('horizontal')}
              className={`px-2 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-colors ${
                activeDrawingTool === 'horizontal'
                  ? 'bg-amber-400 text-slate-950 font-black'
                  : 'bg-[#1c2638] text-slate-300 hover:text-white'
              }`}
            >
              Level
            </button>
            <button
              onClick={() => setActiveDrawingTool('vertical')}
              className={`px-2 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-colors ${
                activeDrawingTool === 'vertical'
                  ? 'bg-amber-400 text-slate-950 font-black'
                  : 'bg-[#1c2638] text-slate-300 hover:text-white'
              }`}
            >
              Vertical
            </button>
            <button
              onClick={() => setActiveDrawingTool('freehand')}
              className={`px-2 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-colors ${
                activeDrawingTool === 'freehand'
                  ? 'bg-amber-400 text-slate-950 font-black'
                  : 'bg-[#1c2638] text-slate-300 hover:text-white'
              }`}
            >
              Pen
            </button>
            <button
              onClick={() => setActiveDrawingTool('rectangle')}
              className={`px-2 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-colors flex items-center gap-1 ${
                activeDrawingTool === 'rectangle'
                  ? 'bg-amber-400 text-slate-950 font-black'
                  : 'bg-[#1c2638] text-slate-300 hover:text-white'
              }`}
              title="Rectangle / Square Support Zone"
            >
              <Square className="w-3 h-3" />
              <span>Square</span>
            </button>
            <button
              onClick={() => setActiveDrawingTool('fibonacci')}
              className={`px-2 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-colors ${
                activeDrawingTool === 'fibonacci'
                  ? 'bg-amber-400 text-slate-950 font-black'
                  : 'bg-[#1c2638] text-slate-300 hover:text-white'
              }`}
            >
              Fibonacci
            </button>
          </div>

          {/* Color palette */}
          <div className="flex items-center gap-1">
            {penColors.map((c) => (
              <button
                key={c}
                onClick={() => setDrawingColor(c)}
                className={`w-3.5 h-3.5 rounded-full border cursor-pointer transition-transform ${
                  drawingColor === c ? 'border-white scale-125' : 'border-transparent opacity-75'
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            {drawnLines.length > 0 && (
              <>
                <button
                  onClick={undoLastDrawnLine}
                  className="p-1 rounded-lg bg-[#1c2638] text-slate-300 hover:text-white cursor-pointer"
                  title="Undo Last Line"
                >
                  <Undo2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={clearDrawnLines}
                  className="p-1 rounded-lg bg-rose-950/60 text-rose-400 hover:text-rose-300 cursor-pointer"
                  title="Clear All Lines"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </>
            )}
            <button
              onClick={() => setActiveDrawingTool('none')}
              className="p-1 rounded-lg bg-[#1c2638] text-slate-300 hover:text-white cursor-pointer"
              title="Done Drawing"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Floating Zoom & Pan Controls (Shown when showChartButtons && showZoomControls is true) */}
      {showChartButtons && showZoomControls && (
        <div className="absolute right-3 bottom-12 flex flex-col items-center gap-1.5 z-10 bg-[#121824]/90 backdrop-blur-md p-1 rounded-xl border border-[#232f42] shadow-2xl">
          <button
            onClick={zoomIn}
            className="w-8 h-8 rounded-lg bg-[#1a2332] hover:bg-[#253348] text-slate-200 hover:text-white flex items-center justify-center transition-all active:scale-90 cursor-pointer"
            title="Zoom In"
          >
            <Plus className="w-4 h-4" />
          </button>

          <span className="text-[9px] font-mono font-bold text-cyan-400 px-0.5 select-none">
            1m
          </span>

          <button
            onClick={zoomOut}
            className="w-8 h-8 rounded-lg bg-[#1a2332] hover:bg-[#253348] text-slate-200 hover:text-white flex items-center justify-center transition-all active:scale-90 cursor-pointer"
            title="Zoom Out"
          >
            <Minus className="w-4 h-4" />
          </button>

          <button
            onClick={() => setPanOffset((prev) => prev + 12)}
            className="w-8 h-7 rounded-lg bg-[#161f2e] hover:bg-[#223046] text-slate-300 hover:text-white flex items-center justify-center transition-all active:scale-90 cursor-pointer border-t border-[#222e40]"
            title="Scroll Back"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setPanOffset((prev) => Math.max(0, prev - 12))}
            disabled={panOffset === 0}
            className={`w-8 h-7 rounded-lg flex items-center justify-center transition-all active:scale-90 cursor-pointer ${
              panOffset === 0
                ? 'opacity-40 text-slate-600 bg-transparent'
                : 'bg-[#161f2e] hover:bg-[#223046] text-slate-300 hover:text-white'
            }`}
            title="Scroll Forward"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => {
              resetZoom();
              setPanOffset(0);
            }}
            className="w-8 h-6 rounded-md bg-[#141b27] hover:bg-[#1d2738] text-slate-400 hover:text-slate-200 text-[10px] font-mono font-bold flex items-center justify-center transition-all cursor-pointer"
            title="Reset Zoom & Snap to Live"
          >
            1:1
          </button>
        </div>
      )}

      {/* Quotex Small Bottom Jump-to-Live Arrow Button ("nicha chota se arrow ho ok fix") */}
      {panOffset > 0 && (
        <button
          onClick={() => setPanOffset(0)}
          className="absolute right-3.5 bottom-3.5 z-30 w-8 h-8 rounded-full bg-[#131d2b]/95 hover:bg-[#1a293e] border border-cyan-500/50 shadow-xl shadow-black/70 flex items-center justify-center text-cyan-400 hover:text-white transition-all transform hover:scale-110 active:scale-95 cursor-pointer group"
          title="Return to live chart"
        >
          {activeTrades.some((t) => t.assetId === activeAsset.id) && (
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-[#0a0d14] animate-ping" />
          )}
          <ChevronRight className="w-4 h-4 stroke-[3] transition-transform group-hover:translate-x-0.5" />
        </button>
      )}

      {/* Mini Asset Switching Loading Overlay */}
      {isAssetLoading && (
        <div className="absolute inset-0 bg-[#0a0d14]/70 backdrop-blur-xs flex items-center justify-center z-20 animate-fadeIn">
          <div className="bg-[#141b27] px-4 py-2 rounded-xl border border-[#253246] flex items-center gap-2 text-xs font-bold text-cyan-400 shadow-xl">
            <span className="w-3.5 h-3.5 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
            <span>Loading {activeAsset.symbol} Market...</span>
          </div>
        </div>
      )}
    </div>
  );
};
