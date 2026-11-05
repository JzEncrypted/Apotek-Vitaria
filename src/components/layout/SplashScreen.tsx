import React, { useEffect, useState } from 'react';
import { FAIcon } from '../common/FAIcon';

interface SplashScreenProps {
  onComplete: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const [stage, setStage] = useState<'initial' | 'logo' | 'text' | 'exit'>('initial');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Stage 1: Logo contour and pulse
    const t1 = setTimeout(() => setStage('logo'), 100);

    // Progress bar fill
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 5;
      });
    }, 90);

    // Stage 2: Typography & Tagline reveal
    const t2 = setTimeout(() => setStage('text'), 700);

    // Stage 3: Smooth exit fade
    const t3 = setTimeout(() => setStage('exit'), 2200);

    // Complete callback
    const t4 = setTimeout(() => {
      onComplete();
    }, 2600);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearInterval(interval);
    };
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 z-[99999] flex flex-col items-center justify-between py-12 px-6 bg-[#F7F9F5] select-none transition-all duration-500 ${
        stage === 'exit' ? 'opacity-0 pointer-events-none scale-105' : 'opacity-100'
      }`}
    >
      {/* Background radial ambient sage glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-[#84A282]/15 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-[#84A282]/15 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-[#84A282]/10 blur-2xl" />
      </div>

      {/* Top Spacer / Clinical Badge */}
      <div
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#E6EEE3] border border-[#84A282]/30 text-[#587A58] text-[11px] font-semibold tracking-wider uppercase transition-all duration-700 ${
          stage !== 'initial' ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
        }`}
      >
        <FAIcon name="shield" className="text-xs text-[#84A282]" />
        <span>Platform Resmi & Terpercaya</span>
      </div>

      {/* Center Branding & Logo */}
      <div className="flex flex-col items-center justify-center text-center my-auto">
        {/* Animated Brand Emblem */}
        <div className="relative mb-6">
          {/* Subtle Ambient Pulse Ring */}
          <div className="absolute inset-0 rounded-3xl bg-[#84A282]/20 animate-ping opacity-75" />
          
          <div className="relative w-24 h-24 rounded-3xl bg-white shadow-glow flex items-center justify-center border-2 border-white/80 overflow-hidden">
            <img src="/vitaria.jpg" alt="Apotek Vitaria" className="w-full h-full object-cover" />
          </div>
        </div>

        {/* Brand Name */}
        <div
          className={`transition-all duration-700 transform ${
            stage === 'text' || stage === 'exit'
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-4'
          }`}
        >
          <h1 className="text-3xl font-extrabold text-[#26382B] tracking-tight">
            Apotek <span className="text-[#84A282]">Vitaria</span>
          </h1>
          <p className="text-xs font-medium text-[#778477] mt-1.5 tracking-wide uppercase">
            Your Health, Our Care
          </p>
        </div>

        {/* Heartbeat EKG Pulse Wave SVG */}
        <div
          className={`w-44 h-8 mt-6 text-[#84A282] transition-all duration-700 ${
            stage === 'text' || stage === 'exit' ? 'opacity-80' : 'opacity-0'
          }`}
        >
          <svg viewBox="0 0 200 40" fill="none" className="w-full h-full stroke-current">
            <path
              d="M0 20 H70 L80 5 L90 35 L100 12 L110 26 L118 20 H200"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="animate-pulse"
            />
          </svg>
        </div>
      </div>

      {/* Bottom Progress Indicator & Microcopy */}
      <div className="w-full max-w-xs flex flex-col items-center">
        {/* Progress bar */}
        <div className="w-full h-1.5 bg-[#E7EBE4] rounded-full overflow-hidden mb-3">
          <div
            className="h-full bg-gradient-to-r from-[#84A282] to-[#587A58] rounded-full transition-all duration-150 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex items-center justify-between w-full text-[11px] text-[#778477]">
          <span>Memuat sistem kesehatan...</span>
          <span className="font-semibold text-[#587A58]">{progress}%</span>
        </div>

        {/* Skip button for quick dev or impatient users */}
        <button
          onClick={onComplete}
          className="mt-4 text-xs text-[#778477] hover:text-[#26382B] underline decoration-dotted transition-colors"
        >
          Lewati Intro
        </button>
      </div>
    </div>
  );
};

export default SplashScreen;
