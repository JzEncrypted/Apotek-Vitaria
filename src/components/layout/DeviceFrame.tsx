import React, { ReactNode } from 'react';
import { FAIcon } from '../common/FAIcon';

export type DeviceMode = 'iphone' | 'android' | 'fluid';

interface DeviceFrameProps {
  mode: DeviceMode;
  children: ReactNode;
}

export const DeviceFrame: React.FC<DeviceFrameProps> = ({ mode, children }) => {
  if (mode === 'fluid') {
    return (
      <div className="w-full min-h-screen bg-[#F7F9F5]">
        {children}
      </div>
    );
  }

  if (mode === 'iphone') {
    return (
      <div className="min-h-screen bg-[#1E2520] py-6 sm:py-10 px-2 sm:px-4 flex items-center justify-center">
        {/* iPhone Chassis Outer Shell */}
        <div className="relative w-full max-w-[412px] h-[860px] bg-[#0F1411] rounded-[52px] p-[10px] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7),0_0_0_2px_rgba(255,255,255,0.08)] border-4 border-[#2D3830] flex flex-col overflow-hidden">
          {/* Side Buttons Visual Accents */}
          <div className="absolute -left-[14px] top-28 w-[3px] h-8 bg-[#3E4D43] rounded-l" />
          <div className="absolute -left-[14px] top-40 w-[3px] h-12 bg-[#3E4D43] rounded-l" />
          <div className="absolute -left-[14px] top-56 w-[3px] h-12 bg-[#3E4D43] rounded-l" />
          <div className="absolute -right-[14px] top-36 w-[3px] h-16 bg-[#3E4D43] rounded-r" />

          {/* Screen Glass */}
          <div className="relative w-full h-full bg-[#F7F9F5] rounded-[42px] overflow-hidden flex flex-col border border-black/10">
            {/* Dynamic Island Status Bar */}
            <div className="w-full h-11 bg-transparent px-7 flex items-center justify-between z-50 text-[12px] font-semibold text-[#26382B] shrink-0 select-none">
              <span>09:41</span>
              {/* Dynamic Island Pill */}
              <div className="w-28 h-6 bg-black rounded-full flex items-center justify-end px-2.5 gap-1.5 shadow-sm">
                <div className="w-2.5 h-2.5 rounded-full bg-[#1A261D] border border-white/20" />
                <div className="w-1.5 h-1.5 rounded-full bg-[#4E9B69]" />
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-[#26382B]">
                <FAIcon name="heartPulse" className="text-[10px] text-[#84A282]" />
                <span>5G</span>
              </div>
            </div>

            {/* App View Scroll Container */}
            <div className="flex-1 w-full overflow-y-auto overflow-x-hidden relative flex flex-col">
              {children}
            </div>

            {/* iOS Home Indicator Bar */}
            <div className="w-full h-5 bg-transparent flex items-center justify-center shrink-0 z-50 pointer-events-none pb-1">
              <div className="w-32 h-1 bg-[#26382B]/30 rounded-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Android Mode (Pixel style centered punch-hole camera)
  return (
    <div className="min-h-screen bg-[#1E2520] py-6 sm:py-10 px-2 sm:px-4 flex items-center justify-center">
      {/* Android Chassis */}
      <div className="relative w-full max-w-[412px] h-[860px] bg-[#121613] rounded-[40px] p-[8px] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)] border-2 border-[#38463B] flex flex-col overflow-hidden">
        {/* Screen Glass */}
        <div className="relative w-full h-full bg-[#F7F9F5] rounded-[32px] overflow-hidden flex flex-col border border-black/10">
          {/* Android Status Bar */}
          <div className="w-full h-9 bg-transparent px-6 flex items-center justify-between z-50 text-[12px] font-medium text-[#26382B] shrink-0 select-none">
            <span>09:41</span>
            {/* Centered Punch-hole Camera */}
            <div className="w-3.5 h-3.5 rounded-full bg-black border border-white/20 shadow-inner" />
            <div className="flex items-center gap-2 text-[11px] text-[#26382B]">
              <FAIcon name="shield" className="text-[10px] text-[#84A282]" />
              <span>LTE</span>
            </div>
          </div>

          {/* App View Scroll Container */}
          <div className="flex-1 w-full overflow-y-auto overflow-x-hidden relative flex flex-col">
            {children}
          </div>

          {/* Android Gesture Navigation Line */}
          <div className="w-full h-4 bg-transparent flex items-center justify-center shrink-0 z-50 pointer-events-none pb-1">
            <div className="w-20 h-1 bg-[#26382B]/35 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeviceFrame;
