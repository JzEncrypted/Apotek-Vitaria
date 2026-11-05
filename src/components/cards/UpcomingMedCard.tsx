import React from 'react';
import { MedicationScheduleItem } from '../../types';
import { FAIcon } from '../common/FAIcon';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';

interface UpcomingMedCardProps {
  schedule?: MedicationScheduleItem;
  onTake: (scheduleId: string) => void;
  onSnooze: (scheduleId: string) => void;
  onViewAllReminders: () => void;
}

export const UpcomingMedCard: React.FC<UpcomingMedCardProps> = ({
  schedule,
  onTake,
  onSnooze,
  onViewAllReminders
}) => {
  if (!schedule) {
    return (
      <div className="bg-white rounded-3xl p-5 border border-[#E7EBE4] shadow-soft-sm text-center">
        <div className="w-12 h-12 rounded-2xl bg-[#4E9B69]/10 text-[#4E9B69] mx-auto flex items-center justify-center text-xl mb-3">
          <FAIcon name="circleCheck" />
        </div>
        <h4 className="font-bold text-[#26382B] text-sm">Tidak Ada Jadwal Tertunda</h4>
        <p className="text-xs text-[#778477] mt-1 mb-3">
          Hebat! Semua jadwal minum obat untuk hari ini telah tuntas.
        </p>
        <button
          onClick={onViewAllReminders}
          className="text-xs font-semibold text-[#587A58] hover:underline"
        >
          Lihat timeline lengkap →
        </button>
      </div>
    );
  }

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

  return (
    <div className="bg-white rounded-3xl p-5 border border-[#E7EBE4] shadow-soft transition-all duration-200 hover:border-[#84A282]/40">
      {/* Top Tag & Time */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#D99B42] animate-ping" />
          <span className="text-xs font-bold text-[#D99B42] uppercase tracking-wider">
            Pengingat Terdekat
          </span>
        </div>
        <Badge variant={schedule.status} />
      </div>

      {/* Main Details */}
      <div className="flex items-center gap-4 my-2">
        <div className="w-14 h-14 rounded-2xl bg-[#F0F5ED] text-[#587A58] flex items-center justify-center text-2xl shrink-0 border border-[#84A282]/20">
          <FAIcon name={getDosageIcon(schedule.dosageForm)} />
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="text-base font-bold text-[#26382B] truncate">{schedule.medicationName}</h4>
          <p className="text-xs text-[#778477] mt-0.5">{schedule.dosage}</p>
          <div className="flex items-center gap-3 mt-1.5 text-[11px] text-[#587A58] font-semibold">
            <span className="flex items-center gap-1">
              <FAIcon name="clock" className="text-[10px]" />
              <span>{schedule.scheduledTime} WIB</span>
            </span>
            <span className="text-[#E7EBE4]">•</span>
            <span className="text-[#778477] font-normal">{schedule.instructions}</span>
          </div>
        </div>
      </div>

      {/* Quick Action Buttons */}
      <div className="grid grid-cols-2 gap-2.5 mt-4 pt-3 border-t border-[#E7EBE4]/70">
        <Button
          variant="outline"
          size="sm"
          icon="refresh"
          onClick={() => onSnooze(schedule.id)}
          className="text-[#778477]"
        >
          Tunda
        </Button>
        <Button
          variant="primary"
          size="sm"
          icon="circleCheck"
          onClick={() => onTake(schedule.id)}
        >
          Sudah Diminum
        </Button>
      </div>
    </div>
  );
};

export default UpcomingMedCard;
