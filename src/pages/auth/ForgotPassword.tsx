import React, { useState } from 'react';
import { FAIcon } from '../../components/common/FAIcon';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { useToast } from '../../context/ToastContext';

interface ForgotPasswordProps {
  onBackToLogin: () => void;
}

export const ForgotPassword: React.FC<ForgotPasswordProps> = ({ onBackToLogin }) => {
  const { showToast } = useToast();
  const [step, setStep] = useState<'phone' | 'otp' | 'newPassword' | 'success'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const handlePhoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) return;
    setStep('otp');
    showToast(`Kode OTP pemulihan dikirim ke ${phone}.`, 'info');
  };

  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length < 4) return;
    setStep('newPassword');
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) return;
    setStep('success');
    showToast('Password baru berhasil dibuat. Silakan login kembali.', 'success');
  };

  return (
    <div className="w-full max-w-md mx-auto min-h-screen sm:min-h-0 sm:my-8 bg-white sm:rounded-3xl shadow-soft sm:border sm:border-[#E7EBE4] p-6 sm:p-8 flex flex-col justify-between">
      <div>
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-3xl bg-[#F0F5ED] text-[#587A58] flex items-center justify-center text-xl mx-auto shadow-sm mb-3 border border-[#84A282]/30">
            <FAIcon name="shield" />
          </div>
          <h2 className="text-2xl font-extrabold text-[#26382B]">
            {step === 'phone'
              ? 'Lupa Password'
              : step === 'otp'
              ? 'Masukkan Kode OTP'
              : step === 'newPassword'
              ? 'Buat Password Baru'
              : 'Password Berhasil Diubah'}
          </h2>
          <p className="text-xs text-[#778477] mt-1 max-w-xs mx-auto">
            {step === 'phone' && 'Masukkan nomor telepon yang terdaftar pada akun Vitaria Anda'}
            {step === 'otp' && `Kode pemulihan telah dikirim ke nomor ${phone}`}
            {step === 'newPassword' && 'Buat kata sandi baru yang aman dan mudah diingat'}
            {step === 'success' && 'Akun Anda telah diamankan dengan kata sandi baru'}
          </p>
        </div>

        {step === 'phone' && (
          <form onSubmit={handlePhoneSubmit} className="space-y-4">
            <Input
              label="Nomor Telepon"
              placeholder="Contoh: 087819622174"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              icon="phone"
              required
            />
            <Button type="submit" variant="primary" size="lg" fullWidth>
              Kirim Kode Pemulihan
            </Button>
          </form>
        )}

        {step === 'otp' && (
          <form onSubmit={handleOtpSubmit} className="space-y-4">
            <div className="text-center py-2">
              <input
                type="text"
                maxLength={4}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="1234"
                className="w-40 text-center tracking-[1em] text-2xl font-extrabold text-[#26382B] py-3 border-2 border-[#84A282] rounded-2xl bg-[#F7F9F5] focus:outline-none"
                autoFocus
              />
              <p className="text-[11px] text-[#778477] mt-2">
                (Masukkan sembarang 4 digit angka, misal: 1234)
              </p>
            </div>
            <Button type="submit" variant="primary" size="lg" fullWidth>
              Verifikasi Kode
            </Button>
          </form>
        )}

        {step === 'newPassword' && (
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <Input
              label="Password Baru"
              placeholder="Minimal 6 karakter"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              isPassword
              required
            />
            <Button type="submit" variant="primary" size="lg" fullWidth>
              Simpan Password Baru
            </Button>
          </form>
        )}

        {step === 'success' && (
          <div className="text-center py-4 space-y-4">
            <div className="w-12 h-12 rounded-full bg-[#4E9B69]/15 text-[#4E9B69] mx-auto flex items-center justify-center text-xl">
              <FAIcon name="circleCheck" />
            </div>
            <p className="text-xs text-[#26382B]">
              Kata sandi Anda telah berhasil diperbarui. Silakan login kembali.
            </p>
            <Button variant="primary" size="lg" fullWidth onClick={onBackToLogin}>
              Kembali ke Login
            </Button>
          </div>
        )}
      </div>

      <div className="text-center pt-6 border-t border-[#E7EBE4] mt-6">
        <button
          onClick={onBackToLogin}
          className="text-xs font-semibold text-[#587A58] hover:underline flex items-center justify-center gap-1.5 mx-auto"
        >
          <FAIcon name="arrowLeft" className="text-xs" />
          <span>Kembali ke Halaman Login</span>
        </button>
      </div>
    </div>
  );
};

export default ForgotPassword;
