import React, { useEffect, useState } from 'react';

interface LoadingScreenProps {
  onLoaded?: () => void;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ onLoaded }) => {
  const [progress, setProgress] = useState(25);
  const [isDone, setIsDone] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    // Seamlessly take over from the inline HTML logo loader
    const inlineSplash = document.getElementById('initial-splash-screen');
    if (inlineSplash) {
      inlineSplash.style.display = 'none';
    }

    const timer = setInterval(() => {
      setProgress((prev) => Math.min(100, prev + 9));
    }, 65);

    const fadeTimer = setTimeout(() => {
      setIsFadingOut(true);
    }, 850);

    const doneTimer = setTimeout(() => {
      setIsDone(true);
      if (onLoaded) onLoaded();
    }, 1100);

    return () => {
      clearInterval(timer);
      clearTimeout(fadeTimer);
      clearTimeout(doneTimer);
    };
  }, [onLoaded]);

  if (isDone) return null;

  return (
    <div
      style={{
        background: 'radial-gradient(circle at center, #0f172a 0%, #07090e 70%)'
      }}
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center p-6 select-none transition-opacity duration-300 ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Powerful Quotex Logo with Glowing Orbital Ring — Zero Text */}
      <div className="relative w-34 h-34 mb-7 flex items-center justify-center">
        {/* Outer rotating neon ring */}
        <div className="absolute -inset-1.5 rounded-full border-[2.5px] border-emerald-500/15 border-t-[#10b981] border-r-[#06b6d4] animate-spin" />
        {/* Subtle inner glow aura */}
        <div className="absolute inset-2 rounded-full bg-emerald-500/10 blur-xl animate-pulse" />
        {/* Quotex Logo Image */}
        <img
          src="/splash-image.png"
          alt=""
          className="relative w-28 h-28 object-contain rounded-3xl drop-shadow-[0_0_24px_rgba(16,185,129,0.45)]"
        />
      </div>

      {/* Sleek Progress Bar Only — No Text */}
      <div className="w-40 bg-[#131b29] rounded-full h-1 overflow-hidden border border-[#233146]/60 shadow-[0_0_12px_rgba(16,185,129,0.2)]">
        <div
          className="h-full bg-gradient-to-r from-[#10b981] to-[#06b6d4] rounded-full transition-all duration-75 ease-out"
          style={{ width: `${Math.min(100, progress)}%` }}
        />
      </div>
    </div>
  );
};
