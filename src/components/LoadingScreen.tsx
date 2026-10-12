import React, { useEffect, useState } from 'react';

interface LoadingScreenProps {
  onLoaded?: () => void;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ onLoaded }) => {
  const [progress, setProgress] = useState(12);
  const [isDone, setIsDone] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    // Hide inline HTML loader once React loading screen takes over seamlessly
    const inlineSplash = document.getElementById('initial-splash-screen');
    if (inlineSplash) {
      inlineSplash.style.display = 'none';
    }

    const timer = setInterval(() => {
      setProgress((prev) => Math.min(100, prev + 8));
    }, 70);

    const fadeTimer = setTimeout(() => {
      setIsFadingOut(true);
    }, 900);

    const doneTimer = setTimeout(() => {
      setIsDone(true);
      if (onLoaded) onLoaded();
    }, 1150);

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
      {/* Clean Spinning Loader Circle (No Splash Image) */}
      <div className="relative w-14 h-14 mb-5 flex items-center justify-center">
        <div className="w-14 h-14 rounded-full border-3 border-[#1e293b] border-t-[#10b981] border-r-[#06b6d4] animate-spin" />
        <span className="absolute font-mono text-[11px] font-bold text-slate-200">
          {Math.min(100, progress)}%
        </span>
      </div>

      {/* Loading Text */}
      <div className="text-sm font-bold tracking-wider text-slate-200 mb-3">
        Loading...
      </div>

      {/* Clean Progress Bar */}
      <div className="w-48 bg-[#161f2e] rounded-full h-1.5 overflow-hidden border border-[#233146]">
        <div
          className="h-full bg-gradient-to-r from-[#10b981] to-[#06b6d4] rounded-full transition-all duration-75 ease-out"
          style={{ width: `${Math.min(100, progress)}%` }}
        />
      </div>
    </div>
  );
};
