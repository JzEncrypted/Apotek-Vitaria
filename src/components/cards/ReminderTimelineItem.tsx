import React from 'react';
import { MedicationScheduleItem } from '../../types';
import { FAIcon } from '../common/FAIcon';
import { Badge } from '../common/Badge';

interface ReminderTimelineItemProps {
  schedule: MedicationScheduleItem;
  onTake: (scheduleId: string) => void;
  onSnooze: (scheduleId: string) => void;
  onMiss: (scheduleId: string) => void;
}

export const ReminderTimelineItem: React.FC<ReminderTimelineItemProps> = ({
  schedule,
  onTake,
  onSnooze,
  onMiss
}) => {
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

  const isCompleted = schedule.status === 'taken';

  return (
    <div className="relative pl-6 pb-6 last:pb-2">
      {/* Vertical Timeline Guide Line */}
      <div className="absolute left-[11px] top-3 bottom-0 w-[2px] bg-[#E7EBE4] -z-10" />

      {/* Timeline Node Dot */}
      <div
        className={`absolute left-0 top-1.5 w-6 h-6 rounded-full flex items-center justify-center text-xs border-2 transition-all ${
          schedule.status === 'taken'
            ? 'bg-[#4E9B69] border-white text-white shadow-sm'
            : schedule.status === 'due'
            ? 'bg-[#D99B42] border-white text-white animate-pulse'
            : schedule.status === 'snoozed'
            ? 'bg-[#648BB7] border-white text-white'
            : schedule.status === 'missed'
            ? 'bg-[#D96A68] border-white text-white'
            : 'bg-white border-[#84A282] text-[#84A282]'
        }`}
      >
        <FAIcon
          name={
            schedule.status === 'taken'
              ? 'check'
              : schedule.status === 'due'
              ? 'clock'
              : schedule.status === 'snoozed'
              ? 'refresh'
              : schedule.status === 'missed'
              ? 'close'
              : 'bell'
          }
          className="text-[9px]"
        />
      </div>

      {/* Item Card Body */}
      <div
        className={`rounded-2xl p-4 border transition-all ${
          isCompleted
            ? 'bg-white/80 border-[#E7EBE4] opacity-90'
            : schedule.status === 'due'
            ? 'bg-white border-[#D99B42]/50 shadow-soft ring-1 ring-[#D99B42]/20'
            : 'bg-white border-[#E7EBE4] shadow-soft-sm'
        }`}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-sm text-[#26382B] tracking-tight">
              {schedule.scheduledTime} WIB
            </span>
            <Badge variant={schedule.status} />
          </div>

          {schedule.takenAt && (
            <span className="text-[10px] text-[#4E9B69] font-semibold flex items-center gap-1">
              <FAIcon name="circleCheck" className="text-[9px]" />
              <span>Diminum pk {schedule.takenAt}</span>
            </span>
          )}
        </div>

        {/* Medicine Details */}
        <div className="flex items-center gap-3 mt-2.5">
          <div className="w-10 h-10 rounded-xl bg-[#F0F5ED] text-[#587A58] flex items-center justify-center text-base shrink-0 border border-[#84A282]/20">
            <FAIcon name={getDosageIcon(schedule.dosageForm)} />
          </div>

          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-xs sm:text-sm text-[#26382B] truncate">
              {schedule.medicationName}
            </h4>
            <p className="text-[11px] text-[#778477]">{schedule.dosage}</p>
            <p className="text-[10px] text-[#587A58] font-medium mt-0.5">
              {schedule.instructions}
            </p>
          </div>
        </div>

        {/* Action Buttons if not taken yet */}
        {!isCompleted && (
          <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-[#E7EBE4]/70">
            <button
              onClick={() => onTake(schedule.id)}
              className="flex-1 py-1.5 px-3 rounded-xl bg-[#84A282] hover:bg-[#587A58] text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm btn-press transition-colors"
            >
              <FAIcon name="check" className="text-xs" />
              <span>Sudah Diminum</span>
            </button>
            <button
              onClick={() => onSnooze(schedule.id)}
              className="py-1.5 px-2.5 rounded-xl border border-[#E7EBE4] hover:bg-[#F0F5ED] text-[#778477] text-xs font-medium flex items-center justify-center gap-1 btn-press transition-colors"
              title="Tunda 30 menit"
            >
              <FAIcon name="refresh" className="text-xs" />
              <span>Tunda</span>
            </button>
            <button
              onClick={() => onMiss(schedule.id)}
              className="py-1.5 px-2.5 rounded-xl border border-[#E7EBE4] hover:bg-[#D96A68]/10 text-[#D96A68] text-xs font-medium flex items-center justify-center btn-press transition-colors"
              title="Tandai Terlewat"
            >
              <FAIcon name="close" className="text-xs" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReminderTimelineItem;
