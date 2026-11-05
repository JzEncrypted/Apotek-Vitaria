import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useMedication } from '../../context/MedicationContext';
import { usePharmacy } from '../../context/PharmacyContext';
import { FAIcon, IconKey } from '../../components/common/FAIcon';
import { HealthSummaryCard } from '../../components/cards/HealthSummaryCard';
import { LiquidMedicationCarousel } from '../../components/cards/LiquidMedicationCarousel';
import { PharmacyInfoCard } from '../../components/cards/PharmacyInfoCard';
import { CustomerTab } from '../../components/layout/CustomerBottomNav';
import { useChat } from '../../context/ChatContext';

interface CustomerHomeProps {
  onNavigateTab: (tab: CustomerTab) => void;
  onOpenAddModal: () => void;
  onOpenPharmacyModal: () => void;
  onOpenNotifications: () => void;
  onOpenChat?: () => void;
  onOpenStore?: () => void;
  onOpenMyOrders?: () => void;
}

export const CustomerHome: React.FC<CustomerHomeProps> = ({
  onNavigateTab,
  onOpenAddModal,
  onOpenPharmacyModal,
  onOpenNotifications,
  onOpenChat,
  onOpenStore,
  onOpenMyOrders
}) => {
  const { currentUser } = useAuth();
  const { schedules, todayStats, notifications, markSchedule } = useMedication();
  const { pharmacyInfo } = usePharmacy();
  const { unreadCount: unreadChatCount } = useChat();

  const unreadNotifCount = notifications.filter((n) => !n.isRead).length;

  const quickActions: { label: string; icon: IconKey; action: () => void; color: string }[] = [
    {
      label: 'Beli Obat Apotek',
      icon: 'boxes',
      action: () => onOpenStore && onOpenStore(),
      color: 'bg-[#84A282] text-white'
    },
    {
      label: 'Tambah Obat Pribadi',
      icon: 'plus',
      action: onOpenAddModal,
      color: 'bg-[#F0F5ED] text-[#587A58]'
    },
    {
      label: 'Jadwal Reminder',
      icon: 'bell',
      action: () => onNavigateTab('reminders'),
      color: 'bg-[#F0F5ED] text-[#587A58]'
    },
    {
      label: 'Daftar Obat Saya',
      icon: 'pill',
      action: () => onNavigateTab('medications'),
      color: 'bg-[#F0F5ED] text-[#587A58]'
    }
  ];

  return (
    <div className="w-full max-w-lg mx-auto px-4 py-5 space-y-6 pb-24">
      {/* Top Header Bar */}
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-[#E6EEE3] text-[#587A58] flex items-center justify-center font-bold text-sm border border-[#84A282]/30 overflow-hidden shadow-soft-sm">
            {currentUser.avatarUrl ? (
              <img
                src={currentUser.avatarUrl}
                alt={currentUser.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <FAIcon name="user" />
            )}
          </div>
          <div>
            <span className="text-[11px] font-semibold text-[#778477] uppercase tracking-wider block">
              Selamat Pagi
            </span>
            <h2 className="text-base font-extrabold text-[#26382B] leading-tight">
              {currentUser.name}
            </h2>
          </div>
        </div>

        {/* Notification Bell with Badge */}
        <button
          onClick={onOpenNotifications}
          className="relative w-10 h-10 rounded-2xl bg-white border border-[#E7EBE4] shadow-soft-sm flex items-center justify-center text-[#26382B] hover:bg-[#F0F5ED] transition-colors btn-press"
          aria-label="Pusat Notifikasi"
        >
          <FAIcon name="bell" className="text-sm" />
          {unreadNotifCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#D96A68] text-white text-[10px] font-bold flex items-center justify-center border-2 border-white">
              {unreadNotifCount}
            </span>
          )}
        </button>
      </header>

      {/* Health Summary Card */}
      <HealthSummaryCard
        totalSchedules={todayStats.total}
        takenCount={todayStats.taken}
        remainingCount={todayStats.remaining}
        activeMeds={todayStats.activeMeds}
      />

      {/* Liquid Medication Carousel */}
      <section aria-labelledby="section-upcoming" className="space-y-2.5">
        <LiquidMedicationCarousel
          schedules={schedules}
          onTake={(id) => markSchedule(id, 'taken')}
          onSnooze={(id) => markSchedule(id, 'snoozed')}
          onViewAll={() => onNavigateTab('reminders')}
        />
      </section>

      {/* Konsultasi Apoteker Online Card */}
      <section aria-labelledby="section-consultation" className="bg-gradient-to-br from-[#F2F7F0] via-[#EAF2E7] to-[#E3EFE0] rounded-3xl p-4 border border-[#D5E4D1] shadow-soft-sm relative overflow-hidden">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="relative shrink-0">
              <img
                src="/vitaria.jpg"
                alt="apt. Sarinah Cantika, S.Farm."
                className="w-12 h-12 rounded-2xl object-cover border-2 border-white shadow-sm"
              />
              <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full shadow-xs" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100/90 px-2 py-0.5 rounded-full uppercase tracking-wider inline-flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Apoteker Aktif
                </span>
                {unreadChatCount > 0 && (
                  <span className="text-[10px] font-bold text-white bg-rose-500 px-2 py-0.5 rounded-full shadow-xs">
                    {unreadChatCount} pesan baru
                  </span>
                )}
              </div>
              <h4 className="text-sm font-bold text-[#203224] mt-1">Konsultasi Apoteker</h4>
              <p className="text-[11px] text-[#556956] line-clamp-1">
                Tanya dosis, efek samping, atau kirim foto resep
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenChat}
            className="px-3.5 py-2.5 bg-[#84A282] hover:bg-[#688C66] text-white text-xs font-semibold rounded-2xl flex items-center gap-1.5 shadow-sm active:scale-95 transition-all shrink-0 cursor-pointer"
            aria-label="Mulai Konsultasi Apoteker"
          >
            <FAIcon name="chat" className="text-xs" />
            <span>Chat</span>
          </button>
        </div>
      </section>

      {/* Quick My Orders Link */}
      <div className="flex items-center justify-between p-3 rounded-2xl bg-white border border-[#E5EAE3] shadow-soft-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#F0F5ED] text-[#587A58] flex items-center justify-center text-xs">
            <FAIcon name="boxes" />
          </div>
          <div>
            <span className="text-xs font-bold text-[#1F2E23] block">Pesanan & Obat Saya</span>
            <span className="text-[10px] text-[#778477]">Lacak status pengiriman & sambungkan ke pengingat</span>
          </div>
        </div>
        <button
          type="button"
          onClick={onOpenMyOrders}
          className="px-3 py-1.5 bg-[#F0F5ED] hover:bg-[#84A282] text-[#405A42] hover:text-white rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer"
        >
          Riwayat
        </button>
      </div>

      {/* Quick Actions 2x2 Grid */}
      <section aria-labelledby="section-quick-actions" className="space-y-2.5">
        <h3 id="section-quick-actions" className="text-sm font-bold text-[#26382B]">Aksi Cepat</h3>
        <div className="grid grid-cols-2 gap-2.5">
          {quickActions.map((item, idx) => (
            <button
              key={idx}
              onClick={item.action}
              className="flex items-center gap-3 p-3.5 rounded-2xl bg-white border border-[#E7EBE4] shadow-soft-sm hover:border-[#84A282]/40 hover:shadow-soft transition-all text-left btn-press"
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm shrink-0 shadow-sm ${item.color}`}
              >
                <FAIcon name={item.icon} />
              </div>
              <span className="text-xs font-bold text-[#26382B] leading-snug">
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Pharmacy Information Card */}
      <section aria-labelledby="section-pharmacy-info" className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h3 id="section-pharmacy-info" className="text-sm font-bold text-[#26382B]">Informasi Apotek Resmi</h3>
          <button
            onClick={onOpenPharmacyModal}
            className="text-xs font-semibold text-[#587A58] hover:underline"
          >
            Detail Apotek
          </button>
        </div>
        <PharmacyInfoCard
          info={pharmacyInfo}
          onViewDetails={onOpenPharmacyModal}
        />
      </section>

      {/* Edukasi Apoteker: Aturan Minum Antibiotik */}
      <div className="p-4 rounded-3xl bg-gradient-to-br from-[#F0F5ED] to-[#E5EFE2] border border-[#CBDCC7] shadow-soft-sm flex items-start gap-3">
        <div className="w-9 h-9 rounded-2xl bg-[#84A282] text-white flex items-center justify-center text-xs shrink-0 mt-0.5 shadow-xs">
          <FAIcon name="pill" />
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-extrabold text-[#38563A] bg-white/80 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Edukasi Apoteker Resmi
            </span>
          </div>
          <h4 className="text-xs font-extrabold text-[#1F2E23]">
            Edukasi Apoteker: Aturan Minum Antibiotik
          </h4>
          <p className="text-[11px] leading-relaxed text-[#405A42]">
            Antibiotik (seperti Amoxicillin) wajib diminum hingga tuntas sesuai instruksi resep dokter, meskipun gejala sudah reda, untuk mencegah resistensi bakteri.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CustomerHome;
