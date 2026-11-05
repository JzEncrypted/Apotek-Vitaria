import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useMedication } from '../../context/MedicationContext';
import { usePharmacy } from '../../context/PharmacyContext';
import { DeviceMode } from './DeviceFrame';
import { FAIcon } from '../common/FAIcon';

interface DevToolbarProps {
  deviceMode: DeviceMode;
  setDeviceMode: (mode: DeviceMode) => void;
  onReplaySplash: () => void;
}

export const DevToolbar: React.FC<DevToolbarProps> = ({
  deviceMode,
  setDeviceMode,
  onReplaySplash
}) => {
  const { role, switchRole } = useAuth();
  const { resetToInitial: resetMedication } = useMedication();
  const { resetPharmacyData } = usePharmacy();

  const handleReset = () => {
    resetMedication();
    resetPharmacyData();
  };

  return (
    <aside
      aria-label="Developer Preview Toolbar"
      className="w-full bg-[#1A261D] text-white py-2 px-3 sm:px-6 flex flex-wrap items-center justify-between gap-3 text-xs border-b border-[#2D3F32] shadow-md z-[9999]"
    >
      {/* Brand & Mode */}
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 rounded-md bg-[#84A282] flex items-center justify-center text-white text-[11px] font-bold">
          <FAIcon name="heartPulse" />
        </div>
        <span className="font-bold tracking-tight text-white hidden sm:inline">Apotek Vitaria Preview</span>
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#2D3F32] text-[#84A282] font-mono">v1.0 PRD</span>
      </div>

      {/* Role Toggle Switcher */}
      <div className="flex items-center gap-1 bg-[#121B14] p-1 rounded-xl border border-[#2D3F32]">
        <button
          onClick={() => switchRole('customer')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
            role === 'customer'
              ? 'bg-[#84A282] text-white shadow-sm'
              : 'text-[#B8C2B5] hover:text-white'
          }`}
        >
          <FAIcon name="user" className="text-xs" />
          <span>Customer</span>
        </button>
        <button
          onClick={() => switchRole('staff')}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
            role === 'staff'
              ? 'bg-[#84A282] text-white shadow-sm'
              : 'text-[#B8C2B5] hover:text-white'
          }`}
        >
          <FAIcon name="doctor" className="text-xs" />
          <span>Petugas Apotek</span>
        </button>
      </div>

      {/* Device Frame Switcher */}
      <div className="flex items-center gap-1 bg-[#121B14] p-1 rounded-xl border border-[#2D3F32]">
        <button
          onClick={() => setDeviceMode('iphone')}
          title="Mode Tampilan iPhone"
          className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${
            deviceMode === 'iphone'
              ? 'bg-[#84A282] text-white'
              : 'text-[#B8C2B5] hover:text-white'
          }`}
        >
          <FAIcon name="mobile" className="text-xs" />
          <span className="hidden md:inline text-[11px]">iPhone</span>
        </button>
        <button
          onClick={() => setDeviceMode('android')}
          title="Mode Tampilan Android"
          className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${
            deviceMode === 'android'
              ? 'bg-[#84A282] text-white'
              : 'text-[#B8C2B5] hover:text-white'
          }`}
        >
          <FAIcon name="mobile" className="text-xs rotate-180" />
          <span className="hidden md:inline text-[11px]">Android</span>
        </button>
        <button
          onClick={() => setDeviceMode('fluid')}
          title="Mode Tampilan Web Penuh"
          className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${
            deviceMode === 'fluid'
              ? 'bg-[#84A282] text-white'
              : 'text-[#B8C2B5] hover:text-white'
          }`}
        >
          <FAIcon name="desktop" className="text-xs" />
          <span className="hidden md:inline text-[11px]">Web Full</span>
        </button>
      </div>

      {/* Action Tools */}
      <div className="flex items-center gap-2">
        <button
          onClick={onReplaySplash}
          title="Putar Ulang Animasi Splash"
          className="px-2.5 py-1 rounded-lg bg-[#2D3F32] hover:bg-[#3D5244] text-[#E6EEE3] text-[11px] font-medium flex items-center gap-1.5 transition-colors"
        >
          <FAIcon name="refresh" className="text-xs" />
          <span className="hidden sm:inline">Splash</span>
        </button>
        <button
          onClick={handleReset}
          title="Reset Data Demo ke Awal"
          className="px-2.5 py-1 rounded-lg bg-[#2D3F32] hover:bg-[#587A58] text-[#E6EEE3] text-[11px] font-medium flex items-center gap-1.5 transition-colors"
        >
          <FAIcon name="history" className="text-xs" />
          <span className="hidden sm:inline">Reset Demo</span>
        </button>
      </div>
    </aside>
  );
};

export default DevToolbar;
