import React from 'react';
import { FAIcon } from '../common/FAIcon';

interface HealthSummaryProps {
  totalSchedules: number;
  takenCount: number;
  remainingCount: number;
  activeMeds: number;
}

export const HealthSummaryCard: React.FC<HealthSummaryProps> = ({
  totalSchedules,
  takenCount,
  remainingCount,
  activeMeds
}) => {
  const percent = totalSchedules > 0 ? Math.round((takenCount / totalSchedules) * 100) : 0;

  return (
    <div className="w-full space-y-3">
      {/* Hero Sage Progress Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#84A282] via-[#6F8F6E] to-[#587A58] text-white p-5 shadow-soft border border-white/20">
        {/* Subtle Decorative Ambient Wave */}
        <div className="absolute -right-8 -bottom-8 w-40 h-40 rounded-full bg-white/10 blur-xl pointer-events-none" />
        
        <div className="flex items-start justify-between relative z-10">
          <div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-[11px] font-medium text-white mb-2">
              <FAIcon name="heartPulse" className="text-[10px]" />
              <span>Progres Kesehatan Hari Ini</span>
            </span>
            <h3 className="text-lg font-extrabold tracking-tight">Jaga kesehatanmu hari ini</h3>
            <p className="text-xs text-white/85 mt-0.5 leading-relaxed">
              {remainingCount === 0 && totalSchedules > 0
                ? 'Luar biasa! Semua jadwal obat hari ini telah selesai diminum.'
                : `${remainingCount} jadwal obat masih menunggu untuk diminum hari ini.`}
            </p>
          </div>

          {/* Progress Circular / Pill Gauge */}
          <div className="flex flex-col items-center justify-center bg-white/15 backdrop-blur-md px-3.5 py-2.5 rounded-2xl border border-white/25">
            <span className="text-xl font-extrabold">{percent}%</span>
            <span className="text-[10px] text-white/80 font-medium">Selesai</span>
          </div>
        </div>

        {/* Progress Bar Line */}
        <div className="mt-4 pt-1">
          <div className="w-full h-2 bg-black/20 rounded-full overflow-hidden p-0.5">
            <div
              className="h-full bg-white rounded-full transition-all duration-500 ease-out shadow-sm"
              style={{ width: `${percent}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-[10px] text-white/80 mt-1.5 font-medium">
            <span>{takenCount} dari {totalSchedules} jadwal diminum</span>
            <span>{activeMeds} obat aktif terdaftar</span>
          </div>
        </div>
      </div>

      {/* 3 Compact Overview Stat Cards */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="bg-white rounded-2xl p-3 border border-[#E7EBE4] shadow-soft-sm flex flex-col items-center text-center">
          <div className="w-7 h-7 rounded-xl bg-[#F0F5ED] text-[#587A58] flex items-center justify-center text-xs mb-1.5">
            <FAIcon name="calendarDay" />
          </div>
          <span className="text-lg font-bold text-[#26382B] leading-none">{totalSchedules}</span>
          <span className="text-[10px] text-[#778477] font-medium mt-1">Total Jadwal</span>
        </div>

        <div className="bg-white rounded-2xl p-3 border border-[#E7EBE4] shadow-soft-sm flex flex-col items-center text-center">
          <div className="w-7 h-7 rounded-xl bg-[#4E9B69]/15 text-[#4E9B69] flex items-center justify-center text-xs mb-1.5">
            <FAIcon name="circleCheck" />
          </div>
          <span className="text-lg font-bold text-[#4E9B69] leading-none">{takenCount}</span>
          <span className="text-[10px] text-[#778477] font-medium mt-1">Sudah Diminum</span>
        </div>

        <div className="bg-white rounded-2xl p-3 border border-[#E7EBE4] shadow-soft-sm flex flex-col items-center text-center">
          <div className="w-7 h-7 rounded-xl bg-[#D99B42]/15 text-[#D99B42] flex items-center justify-center text-xs mb-1.5">
            <FAIcon name="clock" />
          </div>
          <span className="text-lg font-bold text-[#D99B42] leading-none">{remainingCount}</span>
          <span className="text-[10px] text-[#778477] font-medium mt-1">Belum Diminum</span>
        </div>
      </div>
    </div>
  );
};

export default HealthSummaryCard;
