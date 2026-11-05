import React, { useRef, useState } from 'react';
import { MedicationScheduleItem } from '../../types';
import { FAIcon } from '../common/FAIcon';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { useLanguage } from '../../context/LanguageContext';

interface LiquidMedicationCarouselProps {
  schedules: MedicationScheduleItem[];
  onTake: (scheduleId: string) => void;
  onSnooze: (scheduleId: string) => void;
  onViewAll: () => void;
}

export const LiquidMedicationCarousel: React.FC<LiquidMedicationCarouselProps> = ({
  schedules,
  onTake,
  onSnooze,
  onViewAll
}) => {
  const { t } = useLanguage();
  const carouselRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  // Filter schedules that are pending (due, upcoming, or snoozed)
  const pendingSchedules = schedules.filter(
    (s) => s.status === 'due' || s.status === 'upcoming' || s.status === 'snoozed'
  );

  const handleScroll = () => {
    if (!carouselRef.current) return;
    const el = carouselRef.current;
    const itemWidth = el.offsetWidth * 0.88; // Approximate card width + gap
    const index = Math.round(el.scrollLeft / itemWidth);
    setActiveIndex(Math.max(0, Math.min(index, pendingSchedules.length - 1)));
  };

  const scrollToCard = (index: number) => {
    if (!carouselRef.current) return;
    const el = carouselRef.current;
    const itemWidth = el.offsetWidth * 0.88;
    el.scrollTo({
      left: index * itemWidth,
      behavior: 'smooth'
    });
    setActiveIndex(index);
  };

  const getDosageIcon = (form: string) => {
    switch (form) {
      case 'kapsul':
        return 'capsule';
      case 'sirup':
        return 'syrup';
      case 'salep':
        return 'salep';
      case 'tetes':
        return 'drops';
      default:
        return 'pill';
    }
  };

  if (pendingSchedules.length === 0) {
    return (
      <div className="relative overflow-hidden rounded-[28px] p-6 text-center border border-white/80 bg-gradient-to-br from-white/95 via-white/80 to-[#E6EEE3]/60 backdrop-blur-xl shadow-soft">
        <div className="w-14 h-14 rounded-2xl bg-[#4E9B69]/15 text-[#4E9B69] mx-auto flex items-center justify-center text-xl mb-3 border border-[#4E9B69]/30 shadow-inner">
          <FAIcon name="circleCheck" />
        </div>
        <h4 className="font-extrabold text-[#26382B] text-sm">
          {t('all_taken_title', 'Semua Obat Hari Ini Telah Diminum')}
        </h4>
        <p className="text-xs text-[#778477] mt-1 mb-3 max-w-xs mx-auto leading-relaxed">
          {t('all_taken_desc', 'Luar biasa! Seluruh jadwal minum obat untuk hari ini telah selesai dicatat.')}
        </p>
        <button
          onClick={onViewAll}
          className="text-xs font-bold text-[#587A58] hover:underline"
        >
          {t('view_all', 'Lihat timeline lengkap')} →
        </button>
      </div>
    );
  }

  return (
    <div className="w-full space-y-3">
      {/* Top Header Label */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[#84A282] animate-ping" />
          <h3 className="text-sm font-extrabold text-[#26382B] tracking-tight">
            {t('upcoming_title', 'Jadwal Minum Berikutnya')}
          </h3>
          <span className="px-2 py-0.5 rounded-full bg-[#E6EEE3] text-[#587A58] text-[10px] font-bold">
            {pendingSchedules.length} Tersedia
          </span>
        </div>

        <button
          onClick={onViewAll}
          className="text-xs font-semibold text-[#587A58] hover:underline"
        >
          {t('view_all', 'Lihat Semua')}
        </button>
      </div>

      {/* Horizontal Liquid Carousel Scroll Container */}
      <div
        ref={carouselRef}
        onScroll={handleScroll}
        className="flex gap-3 overflow-x-auto snap-x snap-mandatory no-scrollbar pb-1 px-1 -mx-1 scroll-smooth"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {pendingSchedules.map((schedule, idx) => {
          const isDue = schedule.status === 'due';
          const isSelected = activeIndex === idx;

          return (
            <div
              key={schedule.id}
              className={`snap-center shrink-0 w-[88%] sm:w-[92%] rounded-[28px] p-5 relative overflow-hidden transition-all duration-300 border ${
                isSelected
                  ? 'border-white/90 bg-gradient-to-br from-white/95 via-white/85 to-[#F0F5ED]/90 shadow-[0_12px_32px_-8px_rgba(132,162,130,0.32)] scale-[1.01]'
                  : 'border-[#E7EBE4] bg-white/70 backdrop-blur-md opacity-90 scale-[0.98]'
              }`}
            >
              {/* Liquid Water Ripple Ambient Highlight */}
              <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-[#84A282]/15 blur-2xl pointer-events-none" />

              {/* Status Header */}
              <div className="flex items-center justify-between mb-3 relative z-10">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isDue ? 'bg-[#D99B42] animate-pulse' : 'bg-[#84A282]'
                    }`}
                  />
                  <span
                    className={`text-[11px] font-bold uppercase tracking-wider ${
                      isDue ? 'text-[#D99B42]' : 'text-[#587A58]'
                    }`}
                  >
                    {isDue ? 'Waktunya Sekarang' : 'Jadwal Hari Ini'}
                  </span>
                </div>
                <Badge variant={schedule.status} />
              </div>

              {/* Medication Details */}
              <div className="flex items-center gap-3.5 my-2.5 relative z-10">
                <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-[#F0F5ED] to-[#E6EEE3] text-[#587A58] flex items-center justify-center text-2xl shrink-0 border border-[#84A282]/30 shadow-inner">
                  <FAIcon name={getDosageIcon(schedule.dosageForm)} />
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="text-base font-extrabold text-[#26382B] truncate leading-tight">
                    {schedule.medicationName}
                  </h4>
                  <p className="text-xs text-[#778477] mt-0.5">{schedule.dosage}</p>
                  <div className="flex items-center gap-2 mt-1.5 text-xs text-[#587A58] font-bold">
                    <span className="flex items-center gap-1 bg-[#F0F5ED] px-2 py-0.5 rounded-lg border border-[#84A282]/20 text-[11px]">
                      <FAIcon name="clock" className="text-[10px]" />
                      <span>{schedule.scheduledTime} WIB</span>
                    </span>
                    <span className="text-[#778477] text-[11px] font-medium truncate">
                      {schedule.instructions}
                    </span>
                  </div>
                </div>
              </div>

              {/* Liquid Ripple Buttons */}
              <div className="grid grid-cols-2 gap-2.5 mt-4 pt-3.5 border-t border-[#E7EBE4]/80 relative z-10">
                <Button
                  variant="outline"
                  size="sm"
                  icon="refresh"
                  onClick={() => onSnooze(schedule.id)}
                  className="text-[#778477] hover:text-[#26382B]"
                >
                  {t('snooze', 'Tunda')}
                </Button>

                <Button
                  variant="primary"
                  size="sm"
                  icon="circleCheck"
                  onClick={() => onTake(schedule.id)}
                  className="shadow-soft"
                >
                  {t('mark_taken', 'Sudah Diminum')}
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Liquid Pagination Stretchy Droplet Dots Indicator */}
      {pendingSchedules.length > 1 && (
        <div className="flex items-center justify-center gap-2 pt-1">
          {pendingSchedules.map((_, i) => {
            const isActive = activeIndex === i;
            return (
              <button
                key={i}
                onClick={() => scrollToCard(i)}
                className={`transition-all duration-300 rounded-full ${
                  isActive
                    ? 'w-7 h-2 bg-gradient-to-r from-[#84A282] to-[#587A58] shadow-sm'
                    : 'w-2 h-2 bg-[#CBD5C8] hover:bg-[#84A282]/50'
                }`}
                aria-label={`Buka kartu jadwal ${i + 1}`}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

export default LiquidMedicationCarousel;
