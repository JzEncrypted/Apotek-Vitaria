import React from 'react';

interface GlassSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  id?: string;
  name?: string;
  'aria-label'?: string;
}

export const GlassSwitch: React.FC<GlassSwitchProps> = ({
  checked,
  onChange,
  disabled = false,
  id,
  name,
  'aria-label': ariaLabel
}) => {
  const handleToggle = () => {
    if (disabled) return;
    onChange(!checked);

    // Subtle liquid audio feedback (optional synthesized plip)
    try {
      const AC = window.AudioContext || (window as any).webkitAudioContext;
      if (AC) {
        const ctx = new AC();
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'sine';
        o.frequency.setValueAtTime(checked ? 440 : 660, ctx.currentTime);
        o.frequency.exponentialRampToValueAtTime(checked ? 320 : 880, ctx.currentTime + 0.05);
        g.gain.setValueAtTime(0.04, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.08);
        o.connect(g).connect(ctx.destination);
        o.start();
        o.stop(ctx.currentTime + 0.09);
      }
    } catch {}
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      handleToggle();
    }
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      id={id}
      name={name}
      onClick={handleToggle}
      onKeyDown={handleKeyDown}
      className={`relative inline-flex items-center w-[50px] h-[28px] rounded-full p-0.5 outline-none select-none transition-all duration-300 ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
      } focus-visible:ring-2 focus-visible:ring-[#84A282] focus-visible:ring-offset-2`}
      style={{
        background: checked
          ? 'linear-gradient(135deg, #84A282 0%, #688C66 50%, #587A58 100%)'
          : 'rgba(231, 235, 228, 0.75)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        border: checked
          ? '1px solid rgba(255, 255, 255, 0.9)'
          : '1px solid rgba(255, 255, 255, 0.7)',
        boxShadow: checked
          ? '0 3px 12px rgba(132, 162, 130, 0.42), inset 0 1px 2px rgba(255, 255, 255, 0.7)'
          : 'inset 0 1.5px 3px rgba(38, 56, 43, 0.08), 0 1px 3px rgba(0, 0, 0, 0.04)'
      }}
    >
      {/* Specular glass reflection inside track */}
      <span
        className="absolute inset-x-2 top-0.5 h-[1.5px] rounded-full pointer-events-none transition-opacity duration-300"
        style={{
          background: 'linear-gradient(90deg, rgba(255,255,255,0.75), rgba(255,255,255,0.1))',
          opacity: checked ? 0.9 : 0.5
        }}
      />

      {/* Liquid Drop Water Pearl Knob */}
      <span
        className="relative z-10 w-[22px] h-[22px] rounded-full flex items-center justify-center transition-transform duration-300"
        style={{
          transform: checked ? 'translateX(23px)' : 'translateX(2px)',
          transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
          background: 'radial-gradient(circle at 35% 30%, #ffffff 0%, #f7faf5 100%)',
          boxShadow:
            '0 2px 6px rgba(38, 56, 43, 0.22), 0 1px 2px rgba(0, 0, 0, 0.08), inset 0 1px 1.5px rgba(255, 255, 255, 0.95)'
        }}
      >
        {/* Specular shine on knob */}
        <span className="absolute top-1 left-1.5 w-2 h-1 bg-white rounded-full opacity-80 pointer-events-none" />

        {/* Twotone transition center dot */}
        <span
          className="w-1.5 h-1.5 rounded-full transition-colors duration-200"
          style={{
            backgroundColor: checked ? '#587A58' : '#CBD5C8'
          }}
        />
      </span>
    </button>
  );
};

export default GlassSwitch;
