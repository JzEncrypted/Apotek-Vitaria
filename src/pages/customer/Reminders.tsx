import React, { useState, useMemo } from 'react';
import { useMedication } from '../../context/MedicationContext';
import { useOrder } from '../../context/OrderContext';
import { ReminderTimelineItem } from '../../components/cards/ReminderTimelineItem';
import { EmptyState } from '../../components/common/EmptyState';
import { FAIcon } from '../../components/common/FAIcon';

interface RemindersProps {
  onOpenAddModal: () => void;
}

export const Reminders: React.FC<RemindersProps> = ({ onOpenAddModal }) => {
  const { schedules, markSchedule, medications } = useMedication();
  const { orders } = useOrder();
  const [selectedDayOffset, setSelectedDayOffset] = useState<number>(0);

  // Check if there are unscheduled purchased medicines
  const unscheduledPurchasedCount = useMemo(() => {
    const scheduledNames = new Set(medications.map((m) => m.name.toLowerCase().trim()));
    const seen = new Set<string>();
    let count = 0;

    orders.forEach((o) => {
      if (o.orderStatus === 'cancelled') return;
      o.items.forEach((item) => {
        const key = item.medicineName.toLowerCase().trim();
        if (!scheduledNames.has(key) && !seen.has(key)) {
          seen.add(key);
          count++;
        }
      });
    });
    return count;
  }, [orders, medications]);

  // Generate 7-day horizontal strip centered on today (offset 0)
  const days = [-2, -1, 0, 1, 2, 3, 4].map((offset) => {
    const d = new Date('2026-11-03');
    d.setDate(d.getDate() + offset);
    const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    return {
      offset,
      dayName: dayNames[d.getDay()],
      dateNumber: d.getDate(),
      isToday: offset === 0
    };
  });

  const takenCount = schedules.filter((s) => s.status === 'taken').length;
  const dueCount = schedules.filter((s) => s.status === 'due').length;

  return (
    <div className="w-full max-w-lg mx-auto px-4 py-5 space-y-5 pb-24">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-[#26382B] tracking-tight">Pengingat Obat</h2>
          <p className="text-xs text-[#778477] mt-0.5">
            Jadwal kepatuhan konsumsi obat harian
          </p>
        </div>

        <button
          onClick={onOpenAddModal}
          className="w-9 h-9 rounded-2xl bg-[#E6EEE3] text-[#587A58] hover:bg-[#84A282] hover:text-white flex items-center justify-center transition-colors shadow-soft-sm"
          title="Tambah Obat Baru"
        >
          <FAIcon name="plus" className="text-xs" />
        </button>
      </header>

      {/* Horizontal Date Selector Strip */}
      <div className="flex items-center justify-between gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {days.map((item) => {
          const isSelected = selectedDayOffset === item.offset;
          return (
            <button
              key={item.offset}
              onClick={() => setSelectedDayOffset(item.offset)}
              className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-2xl flex-1 min-w-[42px] transition-all btn-press ${
                isSelected
                  ? 'bg-[#84A282] text-white shadow-soft font-bold'
                  : 'bg-white border border-[#E7EBE4] text-[#778477] hover:border-[#84A282]/40'
              }`}
            >
              <span className={`text-xs font-bold uppercase tracking-tight ${isSelected ? 'text-white' : 'text-[#26382B]'}`}>
                {item.dayName}
              </span>
              {item.isToday && (
                <span
                  className={`w-1.5 h-1.5 rounded-full mt-1 ${
                    isSelected ? 'bg-white' : 'bg-[#84A282]'
                  }`}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Quick Prompt for Unscheduled Purchases */}
      {unscheduledPurchasedCount > 0 && (
        <div className="bg-gradient-to-r from-[#F0F5ED] to-[#E6EEE3] rounded-2xl p-3.5 border border-[#84A282]/40 flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#587A58] text-white flex items-center justify-center text-xs shrink-0">
              <FAIcon name="boxes" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#26382B]">
                Ada {unscheduledPurchasedCount} obat pembelian apotek
              </p>
              <p className="text-[10px] text-[#778477]">
                Pasang alarm pengingat konsumsinya dalam 1 klik
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenAddModal}
            className="px-3 py-1.5 rounded-xl bg-[#587A58] hover:bg-[#466346] active:scale-95 text-white text-xs font-bold transition-all shrink-0 flex items-center gap-1 shadow-xs"
          >
            <FAIcon name="plus" className="text-[10px]" />
            <span>Pasang</span>
          </button>
        </div>
      )}

      {/* Day Overview Banner */}
      <div className="bg-[#F0F5ED] rounded-2xl p-3.5 border border-[#84A282]/30 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#84A282] text-white flex items-center justify-center text-xs">
            <FAIcon name="bell" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-[#26382B]">
              {selectedDayOffset === 0
                ? 'Jadwal Hari Ini'
                : selectedDayOffset < 0
                ? 'Riwayat Hari Sebelumnya'
                : 'Jadwal Mendatang'}
            </h4>
            <p className="text-[10px] text-[#778477]">
              {schedules.length} total pengingat terprogram
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {dueCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-[#D99B42]/20 text-[#D99B42] text-[10px] font-bold">
              {dueCount} Waktunya
            </span>
          )}
          <span className="px-2 py-0.5 rounded-full bg-[#4E9B69]/20 text-[#4E9B69] text-[10px] font-bold">
            {takenCount} Selesai
          </span>
        </div>
      </div>

      {/* Reminder Timeline Section */}
      <section aria-labelledby="section-timeline" className="space-y-3 pt-1">
        <h3 id="section-timeline" className="text-xs font-bold text-[#778477] uppercase tracking-wider">
          Timeline Pengingat 24 Jam
        </h3>

        {schedules.length > 0 ? (
          <div className="space-y-1">
            {schedules.map((schedule) => (
              <ReminderTimelineItem
                key={schedule.id}
                schedule={schedule}
                onTake={(id) => markSchedule(id, 'taken')}
                onSnooze={(id) => markSchedule(id, 'snoozed')}
                onMiss={(id) => markSchedule(id, 'missed')}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon="clock"
            title="Tidak Ada Jadwal Pengingat"
            description="Tambahkan obat pribadi terlebih dahulu untuk membuat jadwal notifikasi pengingat minum obat."
            actionLabel="Tambah Obat Baru"
            onAction={onOpenAddModal}
          />
        )}
      </section>
    </div>
  );
};

export default Reminders;
