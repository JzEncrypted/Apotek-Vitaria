import React, { useState, useMemo } from 'react';
import { useMedication } from '../../context/MedicationContext';
import { FAIcon } from '../../components/common/FAIcon';
import { Badge } from '../../components/common/Badge';
import { EmptyState } from '../../components/common/EmptyState';

export const History: React.FC = () => {
  const { logs, complianceRate } = useMedication();
  const [activeFilter, setActiveFilter] = useState<'all' | 'today' | '7days' | '30days'>('7days');

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (activeFilter === 'today') {
        return log.date === '2026-11-03';
      }
      return true;
    });
  }, [logs, activeFilter]);

  const totalTaken = logs.filter((l) => l.status === 'taken').length;
  const totalMissed = logs.filter((l) => l.status === 'missed').length;
  const totalSnoozed = logs.filter((l) => l.status === 'snoozed').length;

  return (
    <div className="w-full max-w-lg mx-auto px-4 py-5 space-y-5 pb-24">
      {/* Header */}
      <header>
        <h2 className="text-xl font-extrabold text-[#26382B] tracking-tight">Riwayat Konsumsi</h2>
        <p className="text-xs text-[#778477] mt-0.5">
          Rekam jejak kepatuhan dan pencatatan obat pribadi
        </p>
      </header>

      {/* Compliance Rate Card */}
      <div className="bg-gradient-to-br from-white to-[#F0F5ED] rounded-3xl p-5 border border-[#E7EBE4] shadow-soft">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-[#587A58] uppercase tracking-wider block">
              Ringkasan Kepatuhan
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-extrabold text-[#26382B]">{complianceRate}%</span>
              <span className="text-xs text-[#4E9B69] font-bold flex items-center gap-1">
                <FAIcon name="circleCheck" className="text-[10px]" />
                <span>Tingkat Kepatuhan Baik</span>
              </span>
            </div>
            <p className="text-[11px] text-[#778477] mt-1 max-w-xs leading-relaxed">
              Persentase dihitung berdasarkan pencatatan mandiri Anda, bukan diagnosis medis.
            </p>
          </div>

          <div className="w-14 h-14 rounded-2xl bg-[#E6EEE3] text-[#587A58] flex items-center justify-center text-xl shrink-0 border border-[#84A282]/30">
            <FAIcon name="heartPulse" />
          </div>
        </div>

        {/* 3 Metrics Mini Grid */}
        <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-[#E7EBE4]">
          <div className="text-center">
            <span className="text-xs text-[#778477] block">Diminum</span>
            <span className="text-sm font-bold text-[#4E9B69]">{totalTaken}x</span>
          </div>
          <div className="text-center border-x border-[#E7EBE4]">
            <span className="text-xs text-[#778477] block">Ditunda</span>
            <span className="text-sm font-bold text-[#648BB7]">{totalSnoozed}x</span>
          </div>
          <div className="text-center">
            <span className="text-xs text-[#778477] block">Terlewat</span>
            <span className="text-sm font-bold text-[#D96A68]">{totalMissed}x</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {[
          { id: 'today', label: 'Hari Ini' },
          { id: '7days', label: '7 Hari Terakhir' },
          { id: '30days', label: '30 Hari Terakhir' },
          { id: 'all', label: 'Semua Riwayat' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveFilter(tab.id as any)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              activeFilter === tab.id
                ? 'bg-[#84A282] text-white shadow-soft-sm'
                : 'bg-white border border-[#E7EBE4] text-[#778477] hover:bg-[#F0F5ED]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Logs List */}
      <section aria-labelledby="section-logs" className="space-y-2.5">
        <h3 id="section-logs" className="text-xs font-bold text-[#778477] uppercase tracking-wider">
          Daftar Catatan Aktivitas
        </h3>

        {filteredLogs.length > 0 ? (
          <div className="space-y-2.5">
            {filteredLogs.map((log) => (
              <div
                key={log.id}
                className="bg-white rounded-2xl p-4 border border-[#E7EBE4] shadow-soft-sm flex items-start justify-between gap-3"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm shrink-0 mt-0.5 ${
                      log.status === 'taken'
                        ? 'bg-[#4E9B69]/15 text-[#4E9B69]'
                        : log.status === 'snoozed'
                        ? 'bg-[#648BB7]/15 text-[#648BB7]'
                        : 'bg-[#D96A68]/15 text-[#D96A68]'
                    }`}
                  >
                    <FAIcon
                      name={
                        log.status === 'taken'
                          ? 'check'
                          : log.status === 'snoozed'
                          ? 'refresh'
                          : 'close'
                      }
                    />
                  </div>

                  <div>
                    <h4 className="font-bold text-xs sm:text-sm text-[#26382B]">
                      {log.medicationName}
                    </h4>
                    <p className="text-[11px] text-[#778477] mt-0.5">
                      Jadwal: {log.scheduledTime} WIB • Dicatat: {log.actionTime} WIB
                    </p>
                    {log.note && (
                      <p className="text-[11px] text-[#587A58] mt-1 italic">
                        "{log.note}"
                      </p>
                    )}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <Badge variant={log.status} />
                  <span className="block text-[10px] text-[#778477] mt-1 font-mono">
                    {log.date}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon="history"
            title="Belum Ada Riwayat"
            description="Riwayat konsumsi akan otomatis tercatat setiap kali kamu menandai obat sudah diminum atau menunda pengingat."
          />
        )}
      </section>
    </div>
  );
};

export default History;
