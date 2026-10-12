import React from 'react';

interface FoxLogoProps {
  className?: string;
  size?: number;
  glow?: boolean;
}

export const FoxLogo: React.FC<FoxLogoProps> = ({
  className = '',
  size = 32,
  glow = false
}) => {
  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      {glow && (
        <div
          className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-[#ff3355]/30 via-[#00e599]/30 to-[#00e599]/40 blur-md pointer-events-none"
          style={{ transform: 'scale(1.2)' }}
        />
      )}
      <svg
        viewBox="0 0 1000 1000"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full relative z-10 rounded-lg overflow-hidden drop-shadow-md"
      >
        <rect width="1000" height="1000" fill="#0a0d14" />
        <rect x="100" y="100" width="800" height="800" fill="#111723" />
        <rect x="303" y="340" width="24" height="420" fill="#ff3355" />
        <rect x="265" y="420" width="100" height="260" fill="#ff3355" />
        <rect x="488" y="300" width="24" height="420" fill="#00e599" />
        <rect x="450" y="370" width="100" height="270" fill="#00e599" />
        <rect x="673" y="250" width="24" height="430" fill="#00e599" />
        <rect x="635" y="330" width="100" height="270" fill="#00e599" />
      </svg>
    </div>
  );
};
