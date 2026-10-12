import React, { useEffect, useState } from 'react';

interface LoadingScreenProps {
  onLoaded?: () => void;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ onLoaded }) => {
  const [progress, setProgress] = useState(18);
  const [isDone, setIsDone] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    // Seamlessly replace inline HTML splash on every refresh
    const inlineSplash = document.getElementById('initial-splash-screen');
    if (inlineSplash) {
      inlineSplash.style.display = 'none';
    }

    const timer = setInterval(() => {
      setProgress((prev) => Math.min(100, prev + 7));
    }, 70);

    const fadeTimer = setTimeout(() => {
      setIsFadingOut(true);
    }, 1050);

    const doneTimer = setTimeout(() => {
      setIsDone(true);
      if (onLoaded) onLoaded();
    }, 1350);

    return () => {
      clearInterval(timer);
      clearTimeout(fadeTimer);
      clearTimeout(doneTimer);
    };
  }, [onLoaded]);

  if (isDone) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] bg-[#0a0d14] flex flex-col items-center justify-center p-6 select-none transition-opacity duration-300 ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Exact 3-Candlesticks Logo (apple-touch-icon.png) — No Text, Powerful */}
      <div className="relative w-40 h-40 mb-7 flex items-center justify-center">
        {/* Subtle ambient emerald/crimson glow */}
        <div className="absolute inset-2 rounded-3xl bg-gradient-to-tr from-[#ff3355]/15 via-[#00e599]/20 to-[#00e599]/25 blur-2xl animate-pulse" />
        <img
          src="/apple-touch-icon.png?v=3"
          alt=""
          className="relative w-40 h-40 object-contain rounded-[28px] shadow-[0_12px_40px_rgba(0,0,0,0.75)]"
        />
      </div>

      {/* Sleek Loading Progress Bar — Zero Text */}
      <div className="w-[150px] bg-[#141b27] rounded-full h-1 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-[#ff3355] via-[#00e599] to-[#00e599] rounded-full transition-all duration-75 ease-out"
          style={{ width: `${Math.min(100, progress)}%` }}
        />
      </div>
    </div>
  );
};
