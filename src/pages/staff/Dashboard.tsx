import React from 'react';
import { usePharmacy } from '../../context/PharmacyContext';
import { useChat } from '../../context/ChatContext';
import { FAIcon } from '../../components/common/FAIcon';
import { Badge } from '../../components/common/Badge';
import { StaffTab } from '../../components/layout/StaffBottomNav';
import { PharmacyMedicine } from '../../types';

interface StaffDashboardProps {
  onNavigateTab: (tab: StaffTab, subTab?: 'sales' | 'stock') => void;
  onOpenAddMedicine: () => void;
  onOpenStockAdjust: (medicine: PharmacyMedicine) => void;
  onOpenChat?: () => void;
}

export const StaffDashboard: React.FC<StaffDashboardProps> = ({
  onNavigateTab,
  onOpenAddMedicine,
  onOpenStockAdjust,
  onOpenChat
}) => {
  const { stats, medicines, stockMovements } = usePharmacy();
  const { messages, unreadCount } = useChat();

  const lowStockMeds = medicines.filter((m) => m.totalStock <= m.minStock);
  const recentActivities = stockMovements.slice(0, 5);
  const latestCustomerMsg = [...messages].reverse().find((m) => m.sender === 'customer');

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-5 space-y-5 pb-24 lg:pb-8">
      {/* Apothecary In-Charge Hero Card (Glassmorphism & Branding) */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white/90 via-[#F4F8F2] to-[#E8F0E5] border border-[#D7E4D3] shadow-soft p-5 backdrop-blur-md">
        {/* Soft Background Radial Decor */}
        <div className="absolute -top-12 -right-12 w-44 h-44 rounded-full bg-[#84A282]/10 blur-2xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="relative shrink-0">
              <img
                src="/vitaria.jpg"
                alt="Logo Apotek Vitaria"
                className="w-14 h-14 rounded-2xl object-cover border-2 border-white shadow-soft-sm"
              />
              <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full shadow-xs" />
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-bold text-[#496547] bg-[#E3EFE0] px-2.5 py-0.5 rounded-full uppercase tracking-wider inline-flex items-center gap-1 border border-[#C8DEC3]">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Operasional Aktif
                </span>
                <span className="text-[10px] font-medium text-[#778477]">
                  SIPA: 19950512/SIPA_33.08/2022/2045
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-extrabold text-[#1F2E23] mt-1 leading-tight">
                apt. Sarinah Cantika, S.Farm.
              </h2>
              <p className="text-xs text-[#526352]">
                Apoteker Penanggung Jawab (APJ) • Apotek Vitaria Magelang
              </p>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => onNavigateTab('reports')}
              className="px-3.5 py-2.5 rounded-2xl bg-white border border-[#D5E1D2] hover:border-[#84A282] text-[#405643] hover:text-[#2A3E2D] text-xs font-bold flex items-center gap-2 shadow-2xs transition-all active:scale-95"
            >
              <FAIcon name="document" className="text-xs text-[#84A282]" />
              <span>Laporan</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigateTab('medicines')}
              className="px-3.5 py-2.5 rounded-2xl bg-white border border-[#D5E1D2] hover:border-[#84A282] text-[#405643] hover:text-[#2A3E2D] text-xs font-bold flex items-center gap-2 shadow-2xs transition-all active:scale-95"
            >
              <FAIcon name="boxes" className="text-xs text-[#84A282]" />
              <span>Katalog</span>
            </button>

            <button
              type="button"
              onClick={onOpenAddMedicine}
              className="px-4 py-2.5 rounded-2xl bg-[#84A282] hover:bg-[#688C66] text-white text-xs font-bold flex items-center gap-2 shadow-soft active:scale-95 transition-all"
            >
              <FAIcon name="plus" className="text-xs" />
              <span>Tambah Obat</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Smart Operational Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Metric 1: Total Katalog */}
        <div className="bg-white rounded-3xl p-4 border border-[#E7EBE4] shadow-soft-sm hover:border-[#84A282]/40 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-[#778477] uppercase tracking-wider">
              Katalog Obat
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#F0F5ED] text-[#587A58] flex items-center justify-center text-xs">
              <FAIcon name="pill" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-extrabold text-[#26382B] leading-none block">
              {stats.totalMedicines}
            </span>
            <span className="text-[11px] text-[#778477] font-medium mt-1 block">
              SKU aktif terdaftar
            </span>
          </div>
        </div>

        {/* Metric 2: Total Stok Fisik */}
        <div className="bg-white rounded-3xl p-4 border border-[#E7EBE4] shadow-soft-sm hover:border-[#84A282]/40 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-[#778477] uppercase tracking-wider">
              Stok Fisik
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#4E9B69]/15 text-[#4E9B69] flex items-center justify-center text-xs">
              <FAIcon name="boxes" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-extrabold text-[#26382B] leading-none block">
              {stats.totalStock}
            </span>
            <span className="text-[11px] text-[#778477] font-medium mt-1 block">
              Unit obat di rak farmasi
            </span>
          </div>
        </div>

        {/* Metric 3: Stok Kritis / Menipis */}
        <div
          onClick={() => onNavigateTab('reports', 'stock')}
          className="bg-white rounded-3xl p-4 border border-[#D99B42]/30 shadow-soft-sm bg-gradient-to-br from-white to-[#D99B42]/5 flex flex-col justify-between cursor-pointer hover:shadow-soft active:scale-95 transition-all"
          title="Klik untuk membuka Laporan Stok & Logistik"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-[#B07B2D] uppercase tracking-wider">
              Stok Kritis
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#D99B42]/15 text-[#D99B42] flex items-center justify-center text-xs">
              <FAIcon name="alert" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-[#B07B2D] leading-none block">
                {stats.lowStockCount}
              </span>
              <span className="text-[10px] text-[#9A671C] font-semibold">
                Perlu restock
              </span>
            </div>
            <span className="text-[11px] text-[#587A58] font-semibold mt-1 flex items-center gap-1">
              <span>Buka Laporan Stok</span>
              <FAIcon name="arrowRight" className="text-[9px]" />
            </span>
          </div>
        </div>

        {/* Metric 4: Konsultasi Pasien Aktif */}
        <div
          onClick={onOpenChat}
          className="bg-white rounded-3xl p-4 border border-[#84A282]/40 shadow-soft-sm bg-gradient-to-br from-white to-[#84A282]/10 cursor-pointer hover:shadow-soft active:scale-[0.98] transition-all flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-[#4B6B4A] uppercase tracking-wider">
              Konsultasi Pasien
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#84A282] text-white flex items-center justify-center text-xs shadow-xs">
              <FAIcon name="consultation" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-extrabold text-[#1F2E23] leading-none block">
                {messages.length}
              </span>
              {unreadCount > 0 ? (
                <span className="text-[10px] font-bold text-white bg-rose-500 px-2 py-0.5 rounded-full animate-bounce">
                  {unreadCount} baru
                </span>
              ) : (
                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                  Semua terjawab
                </span>
              )}
            </div>
            <span className="text-[11px] text-[#587A58] font-semibold mt-1 flex items-center gap-1">
              <span>Buka Live Chat</span>
              <FAIcon name="arrowRight" className="text-[9px]" />
            </span>
          </div>
        </div>
      </div>

      {/* Live Patient Consultation Spotlight Bar */}
      <div className="rounded-3xl bg-gradient-to-r from-[#EAF2E7] via-[#F1F6EF] to-white border border-[#D7E4D3] p-4 shadow-soft-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#84A282] text-white flex items-center justify-center text-sm shrink-0 shadow-xs">
            <FAIcon name="chat" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#1F2E23]">
                Layanan Konsultasi Farmasi Realtime
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <p className="text-xs text-[#526352] truncate mt-0.5">
              {latestCustomerMsg?.text
                ? `Pesan Pasien: "${latestCustomerMsg.text}"`
                : latestCustomerMsg?.imageUrl
                ? 'Pasien mengunggah foto resep medis'
                : 'Saluran konsultasi aktif dan siap merespons keluhan pasien'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onOpenChat}
            className="px-3.5 py-2 bg-[#84A282] hover:bg-[#688C66] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors active:scale-95"
          >
            <FAIcon name="paperPlane" className="text-xs" />
            <span>Respons Pasien</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigateTab('customers')}
            className="px-3 py-2 bg-white border border-[#D5E1D2] hover:bg-[#F0F5ED] text-[#405643] rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <FAIcon name="users" className="text-xs text-[#84A282]" />
            <span>Lihat Pasien</span>
          </button>
        </div>
      </div>

      {/* Critical Stock Alert Cards */}
      <section aria-labelledby="section-alerts" className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-[#D99B42]/15 text-[#D99B42] flex items-center justify-center text-xs">
              <FAIcon name="alert" />
            </div>
            <h3 id="section-alerts" className="text-sm font-bold text-[#26382B]">
              Peringatan Inventaris Kritis
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-[#778477]">
              {lowStockMeds.length} obat butuh restock segera
            </span>
            <button
              type="button"
              onClick={() => onNavigateTab('reports', 'stock')}
              className="px-2.5 py-1 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
            >
              <span>Laporan Stok</span>
              <FAIcon name="arrowRight" className="text-[9px]" />
            </button>
          </div>
        </div>

        {lowStockMeds.length === 0 ? (
          <div className="bg-white rounded-3xl p-6 border border-[#E7EBE4] text-center shadow-soft-sm">
            <div className="w-10 h-10 mx-auto rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-sm mb-2">
              <FAIcon name="circleCheck" />
            </div>
            <p className="text-xs font-bold text-[#26382B]">Seluruh Stok Obat Aman</p>
            <p className="text-[11px] text-[#778477] mt-0.5">
              Tidak ada obat yang berada di bawah batas stok minimum saat ini.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {lowStockMeds.map((med) => {
              const stockPercentage = Math.min(
                Math.round((med.totalStock / (med.minStock || 1)) * 100),
                100
              );

              return (
                <div
                  key={med.id}
                  className="bg-white rounded-2xl p-4 border border-[#E8D6BD] shadow-soft-sm flex flex-col justify-between gap-3 hover:border-[#D99B42] transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-[#D99B42]/10 text-[#D99B42] flex items-center justify-center text-base shrink-0">
                        <FAIcon name="pill" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-xs sm:text-sm text-[#26382B] truncate">
                          {med.name}
                        </h4>
                        <p className="text-[11px] text-[#778477] mt-0.5">
                          Kategori: {med.category} • {med.dosageForm}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onOpenStockAdjust(med)}
                      className="py-1.5 px-3 rounded-xl bg-[#84A282] hover:bg-[#688C66] text-white text-xs font-bold shrink-0 shadow-xs active:scale-95 transition-all flex items-center gap-1"
                    >
                      <FAIcon name="plus" className="text-[10px]" />
                      <span>Stok</span>
                    </button>
                  </div>

                  {/* Stock Level Bar Visual */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-[#778477]">Sisa Fisik:</span>
                      <span className="font-extrabold text-[#D99B42]">
                        {med.totalStock} {med.unit}{' '}
                        <span className="text-[10px] text-[#778477] font-normal">
                          (Min: {med.minStock})
                        </span>
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-[#F3EFE9] overflow-hidden">
                      <div
                        style={{ width: `${Math.max(stockPercentage, 8)}%` }}
                        className="h-full bg-gradient-to-r from-amber-500 to-rose-500 rounded-full transition-all duration-300"
                      />
                    </div>
                    <p className="text-[10px] text-[#778477] pt-0.5 flex items-center justify-between">
                      <span>Batch: {med.batchNumber}</span>
                      <span>Exp: {med.expiryDate}</span>
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Recent Stock Movement Audit Logs */}
      <section aria-labelledby="section-recent-activity" className="bg-white rounded-3xl p-5 border border-[#E7EBE4] shadow-soft-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-[#84A282]/15 text-[#587A58] flex items-center justify-center text-xs">
              <FAIcon name="history" />
            </div>
            <h3 id="section-recent-activity" className="text-sm font-bold text-[#26382B]">
              Riwayat Perubahan Stok Terbaru
            </h3>
          </div>
          <span className="text-[11px] text-[#778477]">Audit sistem otomatis</span>
        </div>

        <div className="divide-y divide-[#E7EBE4]">
          {recentActivities.map((log) => (
            <div key={log.id} className="py-3 first:pt-0 last:pb-0 flex items-start justify-between gap-3 text-xs">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-[#26382B]">{log.medicineName}</span>
                  <Badge
                    variant={
                      log.movementType === 'in'
                        ? 'active'
                        : log.movementType === 'out'
                        ? 'missed'
                        : 'snoozed'
                    }
                    label={
                      log.movementType === 'in'
                        ? `Masuk (+${log.quantityChanged})`
                        : log.movementType === 'out'
                        ? `Keluar (${log.quantityChanged})`
                        : `Koreksi (${log.quantityChanged})`
                    }
                    showIcon={false}
                  />
                </div>
                <p className="text-[11px] text-[#778477] mt-1">
                  Alasan: {log.reason}
                </p>
                <p className="text-[10px] text-[#587A58] mt-0.5 font-medium">
                  Petugas: {log.staffName}
                </p>
              </div>

              <span className="text-[10px] text-[#778477] shrink-0 font-mono">
                {log.createdAt}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default StaffDashboard;
