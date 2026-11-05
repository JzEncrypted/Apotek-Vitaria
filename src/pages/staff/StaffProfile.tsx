import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { FAIcon } from '../../components/common/FAIcon';
import { Button } from '../../components/common/Button';
import { useToast } from '../../context/ToastContext';

export const StaffProfile: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const { showToast } = useToast();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      showToast('Password baru minimal 6 karakter.', 'danger');
      return;
    }
    setShowPasswordModal(false);
    setOldPassword('');
    setNewPassword('');
    showToast('Password staf berhasil diperbarui.', 'success');
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-5 space-y-5 pb-24 lg:pb-8">
      {/* Header */}
      <header>
        <h2 className="text-xl sm:text-2xl font-extrabold text-[#26382B]">Profil Petugas</h2>
        <p className="text-xs text-[#778477] mt-0.5">Identitas staf dan akun operasional farmasi</p>
      </header>

      {/* Staff Identity Card */}
      <div className="bg-white rounded-3xl p-6 border border-[#E7EBE4] shadow-soft flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
        <div className="w-20 h-20 rounded-3xl bg-[#E6EEE3] text-[#587A58] flex items-center justify-center font-bold text-2xl border-2 border-[#84A282]/30 overflow-hidden shadow-soft-sm shrink-0">
          {currentUser?.avatarUrl ? (
            <img
              src={currentUser.avatarUrl}
              alt={currentUser.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <FAIcon name="doctor" />
          )}
        </div>

        <div className="flex-1 space-y-1">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-center sm:justify-start">
            <h3 className="text-lg font-extrabold text-[#26382B]">{currentUser?.name || 'Petugas Apotek'}</h3>
            <span className="px-2.5 py-0.5 rounded-full bg-[#E6EEE3] text-[#587A58] text-[11px] font-bold self-center sm:self-auto">
              Petugas Terverifikasi
            </span>
          </div>

          <p className="text-xs font-semibold text-[#587A58]">
            Jabatan: Asisten Apoteker / Staf Pengelola Stok
          </p>
          <p className="text-xs text-[#778477] font-mono">
            ID Petugas: STF-VIT-2024-001
          </p>

          <div className="pt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#778477]">
            <span className="flex items-center gap-2 justify-center sm:justify-start">
              <FAIcon name="phone" className="text-[#84A282]" />
              <span>{currentUser.phone}</span>
            </span>
            <span className="flex items-center gap-2 justify-center sm:justify-start">
              <FAIcon name="email" className="text-[#84A282]" />
              <span>{currentUser.email || 'staf@apotekvitaria.com'}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Security Actions */}
      <div className="bg-white rounded-3xl p-5 border border-[#E7EBE4] shadow-soft-sm space-y-3">
        <h4 className="text-xs font-bold text-[#778477] uppercase tracking-wider">
          Pengaturan Keamanan
        </h4>

        <div className="flex items-center justify-between py-2 border-b border-[#E7EBE4]">
          <div>
            <p className="text-xs font-bold text-[#26382B]">Kata Sandi Akun</p>
            <p className="text-[11px] text-[#778477]">Terakhir diubah 30 hari yang lalu</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPasswordModal(true)}
          >
            Ubah Password
          </Button>
        </div>

        <div className="flex items-center justify-between py-2">
          <div>
            <p className="text-xs font-bold text-[#26382B]">Autentikasi Sesi Petugas</p>
            <p className="text-[11px] text-[#778477]">Login aktif pada perangkat kerja apotek</p>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-[#4E9B69]/15 text-[#4E9B69] text-xs font-bold">
            Sesi Aman
          </span>
        </div>
      </div>

      {/* Logout */}
      <Button
        variant="danger"
        size="md"
        fullWidth
        icon="logout"
        onClick={logout}
      >
        Keluar dari Akun Petugas
      </Button>

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowPasswordModal(false)}
          />
          <div className="relative bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-[#E7EBE4] space-y-4 animate-in zoom-in-95 z-10">
            <h3 className="font-bold text-base text-[#26382B]">Ubah Password Staf</h3>
            <form onSubmit={handlePasswordChange} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#26382B] mb-1">
                  Password Saat Ini
                </label>
                <input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="Masukkan password lama"
                  className="w-full bg-white border border-[#E7EBE4] rounded-2xl p-3 text-xs focus:outline-none focus:ring-2 focus:ring-[#84A282]/30"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#26382B] mb-1">
                  Password Baru
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  className="w-full bg-white border border-[#E7EBE4] rounded-2xl p-3 text-xs focus:outline-none focus:ring-2 focus:ring-[#84A282]/30"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowPasswordModal(false)}
                >
                  Batal
                </Button>
                <Button type="submit" variant="primary">
                  Perbarui
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffProfile;
