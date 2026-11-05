import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage, LANGUAGES } from '../../context/LanguageContext';
import { FAIcon, IconKey } from '../../components/common/FAIcon';
import { Button } from '../../components/common/Button';
import { BottomSheet } from '../../components/common/BottomSheet';
import { GlassSwitch } from '../../components/common/GlassSwitch';
import { useToast } from '../../context/ToastContext';
import { EditProfileModal } from './EditProfileModal';

interface ProfileProps {
  onOpenPharmacyModal: () => void;
  onOpenChat?: () => void;
  onOpenMyOrders?: () => void;
}

export const Profile: React.FC<ProfileProps> = ({ onOpenPharmacyModal, onOpenChat, onOpenMyOrders }) => {
  const { currentUser, logout } = useAuth();
  const { language, setLanguage, currentOption, t } = useLanguage();
  const { showToast } = useToast();

  const [isEditing, setIsEditing] = useState(false);
  const [isLanguageModalOpen, setIsLanguageModalOpen] = useState(false);

  // Preference states
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [pushEnabled, setPushEnabled] = useState(true);

  // Policy / info modals
  const [activeInfoModal, setActiveInfoModal] = useState<string | null>(null);

  const menuSections: {
    title: string;
    items: { label: string; icon: IconKey; action: () => void; badge?: string }[];
  }[] = [
    {
      title: 'Apotek Resmi',
      items: [
        {
          label: 'Riwayat Pesanan Saya & Pengingat',
          icon: 'boxes',
          action: () => onOpenMyOrders && onOpenMyOrders(),
          badge: 'Transaksi'
        },
        {
          label: 'Konsultasi Live Chat Apoteker',
          icon: 'consultation',
          action: () => onOpenChat && onOpenChat(),
          badge: 'Online'
        },
        {
          label: 'Informasi Apotek Vitaria',
          icon: 'heartPulse',
          action: onOpenPharmacyModal,
          badge: 'Resmi'
        },
        {
          label: 'Hubungi via WhatsApp',
          icon: 'phone',
          action: onOpenPharmacyModal
        },
        {
          label: 'Petunjuk Arah & Peta',
          icon: 'location',
          action: onOpenPharmacyModal
        }
      ]
    },
    {
      title: 'Layanan & Bantuan',
      items: [
        {
          label: 'Tentang Apotek Vitaria',
          icon: 'info',
          action: () => setActiveInfoModal('about')
        },
        {
          label: 'Kebijakan Privasi & Data Medis',
          icon: 'shield',
          action: () => setActiveInfoModal('privacy')
        },
        {
          label: 'Syarat & Ketentuan Penggunaan',
          icon: 'document',
          action: () => setActiveInfoModal('terms')
        }
      ]
    }
  ];

  return (
    <div className="w-full max-w-lg mx-auto px-4 py-5 space-y-5 pb-24">
      {/* Header */}
      <header>
        <h2 className="text-xl font-extrabold text-[#26382B] tracking-tight">Profil Saya</h2>
        <p className="text-xs text-[#778477] mt-0.5">Pengaturan akun dan preferensi pengingat</p>
      </header>

      {/* Profile Card */}
      <div className="bg-white rounded-3xl p-5 border border-[#E7EBE4] shadow-soft-sm flex items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-14 h-14 rounded-2xl bg-[#E6EEE3] text-[#587A58] flex items-center justify-center font-bold text-lg border border-[#84A282]/30 overflow-hidden shadow-sm">
            {currentUser?.avatarUrl ? (
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
            <h3 className="font-extrabold text-base text-[#26382B]">{currentUser?.name || 'Pelanggan'}</h3>
            <p className="text-xs text-[#778477] mt-0.5 flex items-center gap-1.5">
              <FAIcon name="phone" className="text-[10px] text-[#84A282]" />
              <span>{currentUser?.phone || '-'}</span>
            </p>
            {currentUser?.email && (
              <p className="text-[11px] text-[#778477] mt-0.5 flex items-center gap-1.5">
                <FAIcon name="email" className="text-[10px] text-[#84A282]" />
                <span>{currentUser.email}</span>
              </p>
            )}
          </div>
        </div>

        <button
          onClick={() => setIsEditing(true)}
          className="w-9 h-9 rounded-2xl bg-[#F0F5ED] hover:bg-[#E6EEE3] text-[#587A58] flex items-center justify-center transition-colors btn-press"
          title="Ubah Profil"
        >
          <FAIcon name="edit" className="text-xs" />
        </button>
      </div>

      {/* Preferences Section */}
      <div className="bg-white rounded-3xl p-5 border border-[#E7EBE4] shadow-soft-sm space-y-3">
        <span className="text-[11px] font-bold text-[#778477] uppercase tracking-wider block">
          Preferensi Notifikasi
        </span>

        {/* Push Notifikasi Toggle */}
        <div 
          onClick={() => setPushEnabled(!pushEnabled)}
          className="flex items-center justify-between py-1 cursor-pointer select-none group"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#F0F5ED] text-[#587A58] flex items-center justify-center text-xs group-hover:scale-105 transition-transform">
              <FAIcon name="bell" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#26382B] group-hover:text-[#587A58] transition-colors">Push Notifikasi Pengingat</p>
              <p className="text-[10px] text-[#778477]">Dapatkan pengingat saat tiba jadwal obat</p>
            </div>
          </div>
          <div onClick={(e) => e.stopPropagation()}>
            <GlassSwitch
              checked={pushEnabled}
              onChange={setPushEnabled}
              aria-label="Push Notifikasi Pengingat"
            />
          </div>
        </div>

        {/* Suara & Nada Dering Toggle */}
        <div 
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="flex items-center justify-between py-1 cursor-pointer border-t border-[#E7EBE4] pt-3 select-none group"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#F0F5ED] text-[#587A58] flex items-center justify-center text-xs group-hover:scale-105 transition-transform">
              <FAIcon name="volumeHigh" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#26382B] group-hover:text-[#587A58] transition-colors">Suara & Nada Dering</p>
              <p className="text-[10px] text-[#778477]">Bunyikan nada saat notifikasi muncul</p>
            </div>
          </div>
          <div onClick={(e) => e.stopPropagation()}>
            <GlassSwitch
              checked={soundEnabled}
              onChange={setSoundEnabled}
              aria-label="Suara & Nada Dering"
            />
          </div>
        </div>

        {/* Bahasa Aplikasi / Language Selection Row */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => setIsLanguageModalOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setIsLanguageModalOpen(true);
            }
          }}
          className="flex items-center justify-between py-1 cursor-pointer border-t border-[#E7EBE4] pt-3 group select-none outline-none focus-visible:ring-2 focus-visible:ring-[#84A282] rounded-xl"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-[#E6EEE3] text-[#587A58] flex items-center justify-center text-xs group-hover:scale-105 transition-transform">
              <FAIcon name="shield" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#26382B] group-hover:text-[#587A58] transition-colors">
                {t('app_language', 'Bahasa Aplikasi')}
              </p>
              <p className="text-[10px] text-[#778477]">
                {currentOption.name} ({currentOption.nativeName})
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-[#587A58] font-bold">
            <span className="px-2 py-0.5 rounded-full bg-[#F0F5ED] text-[11px] border border-[#84A282]/20">
              {currentOption.code.toUpperCase()}
            </span>
            <FAIcon name="chevronRight" className="text-[10px] text-[#778477]" />
          </div>
        </div>
      </div>

      {/* Menu Groups */}
      {menuSections.map((sec, idx) => (
        <div
          key={idx}
          className="bg-white rounded-3xl p-4 border border-[#E7EBE4] shadow-soft-sm space-y-1"
        >
          <span className="text-[11px] font-bold text-[#778477] uppercase tracking-wider block px-2 mb-2">
            {sec.title}
          </span>
          {sec.items.map((item, i) => (
            <button
              key={i}
              onClick={item.action}
              className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-[#F0F5ED] transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#F0F5ED] text-[#587A58] flex items-center justify-center text-xs">
                  <FAIcon name={item.icon} />
                </div>
                <span className="text-xs font-bold text-[#26382B]">{item.label}</span>
              </div>

              <div className="flex items-center gap-2">
                {item.badge && (
                  <span className="px-2 py-0.5 rounded-full bg-[#E6EEE3] text-[#587A58] text-[10px] font-bold">
                    {item.badge}
                  </span>
                )}
                <FAIcon name="chevronRight" className="text-xs text-[#778477]" />
              </div>
            </button>
          ))}
        </div>
      ))}

      {/* Logout Action */}
      <div className="pt-2">
        <Button
          variant="outline"
          size="md"
          fullWidth
          icon="logout"
          onClick={logout}
          className="text-[#D96A68] hover:bg-[#D96A68]/10 border-[#D96A68]/30"
        >
          Keluar dari Akun
        </Button>
      </div>

      <div className="text-center text-[11px] text-[#778477] space-y-1 pt-1">
        <p>Apotek Vitaria v1.0.0 (Production Release)</p>
        <p>Your Health, Our Care</p>
      </div>

      {/* Slideable Edit Profile BottomSheet with Realistic Canvas Cropper */}
      <EditProfileModal
        isOpen={isEditing}
        onClose={() => setIsEditing(false)}
      />

      {/* Info Modals */}
      {activeInfoModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setActiveInfoModal(null)}
          />
          <div className="relative bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-[#E7EBE4] space-y-3 animate-in zoom-in-95 max-h-[80vh] overflow-y-auto">
            <h3 className="font-bold text-base text-[#26382B]">
              {activeInfoModal === 'about'
                ? 'Tentang Apotek Vitaria'
                : activeInfoModal === 'privacy'
                ? 'Kebijakan Privasi Medis'
                : 'Syarat & Ketentuan'}
            </h3>
            <p className="text-xs text-[#778477] leading-relaxed">
              {activeInfoModal === 'about' &&
                'Apotek Vitaria hadir untuk mendampingi kepatuhan konsumsi obat Anda secara digital. Aplikasi ini mempermudah pencatatan obat harian dan memfasilitasi komunikasi langsung dengan Apoteker resmi kami.'}
              {activeInfoModal === 'privacy' &&
                'Data obat dan jadwal Anda disimpan secara aman dan terenkripsi. Petugas apotek tidak memiliki akses ke jadwal pribadi Anda tanpa persetujuan eksplisit, sesuai UU Perlindungan Data Pribadi.'}
              {activeInfoModal === 'terms' &&
                'Aplikasi ini tidak menggantikan resep dokter resmi. Pengguna wajib mematuhi dosis yang diinstruksikan oleh tenaga medis yang berwenang.'}
            </p>
            <Button
              variant="primary"
              size="sm"
              fullWidth
              onClick={() => setActiveInfoModal(null)}
            >
              Mengerti
            </Button>
          </div>
        </div>
      )}

      {/* Language Bottom Sheet Modal */}
      <BottomSheet
        isOpen={isLanguageModalOpen}
        onClose={() => setIsLanguageModalOpen(false)}
        title={t('change_language', 'Pilih Bahasa')}
        subtitle="Pilih bahasa pengantar antarmuka Apotek Vitaria"
        maxHeight="max-h-[60vh]"
      >
        <div className="space-y-2.5 pb-4">
          {LANGUAGES.map((item) => {
            const isSelected = language === item.code;
            return (
              <button
                key={item.code}
                type="button"
                onClick={() => {
                  setLanguage(item.code);
                  setIsLanguageModalOpen(false);
                  showToast(`${t('lang_changed', 'Bahasa diubah ke')} ${item.name}`, 'success');
                }}
                className={`w-full flex items-center justify-between p-3.5 rounded-2xl border transition-all text-left btn-press ${
                  isSelected
                    ? 'bg-[#E6EEE3] border-[#84A282] shadow-sm'
                    : 'bg-white border-[#E7EBE4] hover:bg-[#F0F5ED]'
                }`}
              >
                <div>
                  <h4 className={`text-xs font-extrabold ${isSelected ? 'text-[#587A58]' : 'text-[#26382B]'}`}>
                    {item.name}
                  </h4>
                  <p className="text-[11px] text-[#778477] mt-0.5">{item.subtitle}</p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-white border border-[#E7EBE4] text-[10px] font-mono font-bold text-[#587A58]">
                    {item.code.toUpperCase()}
                  </span>
                  {isSelected && (
                    <div className="w-6 h-6 rounded-full bg-[#84A282] text-white flex items-center justify-center text-xs shadow-sm">
                      <FAIcon name="check" />
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </BottomSheet>
    </div>
  );
};

export default Profile;
