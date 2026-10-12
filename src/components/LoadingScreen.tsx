import React, { useEffect, useState } from 'react';
import { useTrading } from '../context/TradingContext';

interface LoadingScreenProps {
  onLoaded?: () => void;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ onLoaded }) => {
  const { logoImageUrl } = useTrading();
  const [progress, setProgress] = useState(5);
  const [isDone, setIsDone] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [statusText, setStatusText] = useState('Connecting to Quotex Trading Engine...');

  const activeLogo = logoImageUrl || '/splash-image.png';

  useEffect(() => {
    // Hide inline HTML splash once React component is mounted
    const inlineSplash = document.getElementById('initial-splash-screen');
    if (inlineSplash) {
      inlineSplash.style.display = 'none';
    }

    const timer = setInterval(() => {
      setProgress((prev) => {
        const step = Math.floor(Math.random() * 6) + 3;
        const next = prev + step;

        if (next >= 100) {
          clearInterval(timer);
          setStatusText('Quotex Platform Ready');
          setTimeout(() => {
            setIsFadingOut(true);
            setTimeout(() => {
              setIsDone(true);
              if (onLoaded) onLoaded();
            }, 450);
          }, 350);
          return 100;
        }

        if (next < 25) {
          setStatusText('Connecting to Quotex Trading Engine...');
        } else if (next < 55) {
          setStatusText('Loading Candlestick Feeds & Pairs...');
        } else if (next < 80) {
          setStatusText('Calibrating Technical Indicators...');
        } else {
          setStatusText('Synchronizing Real-Time Clock...');
        }

        return next;
      });
    }, 45);

    return () => clearInterval(timer);
  }, [onLoaded]);

  if (isDone) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] bg-[#07090e] flex flex-col items-center justify-center p-6 select-none transition-opacity duration-500 ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Background ambient neon glows */}
      <div className="absolute w-[450px] h-[450px] rounded-full bg-cyan-600/10 blur-[90px] pointer-events-none" />
      <div className="absolute w-[360px] h-[360px] rounded-full bg-emerald-500/10 blur-[80px] pointer-events-none -bottom-10" />

      {/* Modern Animated Loading Centerpiece */}
      <div className="relative mb-7 flex items-center justify-center">
        {/* Outer spinning radar circle */}
        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-2 border-cyan-500/20 border-t-cyan-400 border-r-emerald-400 animate-spin" />

        {/* Inner pulsing logo circle */}
        <div className="absolute w-18 h-18 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-[#0d131f] via-[#121927] to-[#172338] border border-cyan-500/50 shadow-[0_0_35px_rgba(6,182,212,0.45)] flex items-center justify-center p-2.5 overflow-hidden">
          <img
            src={activeLogo}
            alt="Quotex Logo"
            className="w-full h-full object-contain rounded-xl drop-shadow-md"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        </div>
      </div>

      {/* Brand title */}
      <div className="text-center mb-6">
        <div className="flex items-center justify-center gap-2">
          <h1 className="text-2xl sm:text-3xl font-black tracking-widest bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 bg-clip-text text-transparent">
            QUOTEX PRO
          </h1>
        </div>
        <p className="text-[10px] sm:text-[11px] font-extrabold text-cyan-400 tracking-[0.3em] uppercase mt-1">
          INNOVATIVE TRADING PLATFORM
        </p>
      </div>

      {/* Sleek Progress Bar with percentage */}
      <div className="w-64 max-w-full bg-[#101520] rounded-full h-2.5 overflow-hidden border border-[#232d3f] p-0.5 shadow-inner">
        <div
          className="h-full bg-gradient-to-r from-cyan-500 via-teal-400 to-[#00e599] rounded-full transition-all duration-100 ease-out shadow-[0_0_14px_rgba(6,182,212,0.85)]"
          style={{ width: `${Math.min(100, progress)}%` }}
        />
      </div>

      {/* Percentage and dynamic status caption */}
      <div className="mt-4 flex flex-col items-center gap-1.5">
        <span className="font-mono text-xs font-black text-cyan-300 tracking-wider">
          {Math.min(100, progress)}%
        </span>
        <div className="text-[11px] font-mono font-medium text-slate-400 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span>{statusText}</span>
        </div>
      </div>
    </div>
  );
};
