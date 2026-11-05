import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { FAIcon } from '../../components/common/FAIcon';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { useToast } from '../../context/ToastContext';
import { Role } from '../../types';

interface RegisterProps {
  onGoToLogin: () => void;
}

export const Register: React.FC<RegisterProps> = ({ onGoToLogin }) => {
  const { register, loginWithGoogle } = useAuth();
  const { showToast } = useToast();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<Role>('customer');
  const [agreed, setAgreed] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGoogleSignIn = async () => {
    try {
      setIsGoogleLoading(true);
      setError('');
      const res = await loginWithGoogle();
      if (res && !res.success) {
        const errorMsg = res.error?.includes('provider is not enabled')
          ? 'Google Sign-In belum diaktifkan di Supabase Dashboard (Authentication -> Providers -> Google).'
          : (res.error || 'Gagal memulai login Google.');
        setError(errorMsg);
        showToast(errorMsg, 'danger');
        setIsGoogleLoading(false);
      }
    } catch (err: any) {
      setError(err?.message || 'Gagal memulai autentikasi Google.');
      showToast('Gagal terhubung ke Google OAuth.', 'danger');
      setIsGoogleLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Nama lengkap wajib diisi.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Format email tidak valid.');
      return;
    }
    if (password.length < 6) {
      setError('Kata sandi minimal 6 karakter.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Konfirmasi kata sandi tidak cocok.');
      return;
    }
    if (!agreed) {
      setError('Anda harus menyetujui ketentuan layanan apotek.');
      return;
    }

    try {
      setIsLoading(true);
      const res = await register({
        name,
        email,
        phone,
        password,
        role
      });

      if (!res.success) {
        setError(res.message || 'Pendaftaran gagal.');
        showToast(res.message || 'Pendaftaran gagal.', 'danger');
      } else {
        showToast('Pendaftaran akun berhasil! Selamat datang di Apotek Vitaria.', 'success');
      }
    } catch {
      setError('Gagal menghubungi server database.');
      showToast('Koneksi ke server terputus.', 'danger');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto p-4 flex flex-col justify-between">
      <div>
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-[#84A282] to-[#587A58] text-white flex items-center justify-center text-2xl mx-auto shadow-glow mb-4 border-2 border-white">
            <FAIcon name="heartPulse" />
          </div>
          <h2 className="text-2xl font-extrabold text-[#26382B] tracking-tight">
            Daftar Akun Baru
          </h2>
          <p className="text-xs text-[#778477] mt-1 max-w-xs mx-auto leading-relaxed">
            Daftarkan akun untuk mulai mengelola jadwal obat dan konsultasi apotek
          </p>
        </div>

        {/* Real Google OAuth Button */}
        <div className="mb-4">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isGoogleLoading}
            className="w-full py-3 px-4 bg-white hover:bg-[#F9FAF8] active:bg-[#F0F4EE] text-stone-700 font-bold text-xs rounded-2xl border border-stone-200 shadow-xs flex items-center justify-center gap-2.5 transition-all hover:border-[#84A282] hover:shadow-soft disabled:opacity-50"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Daftar Cepat dengan Google</span>
          </button>

          <div className="relative my-4 flex items-center justify-center">
            <div className="border-t border-[#E7EBE4] w-full"></div>
            <span className="bg-[#F7F9F5] px-3 text-[10px] text-[#778477] font-bold uppercase tracking-wider absolute">
              atau isi formulir pendaftaran
            </span>
          </div>
        </div>

        {/* Real Error Banner */}
        {error && (
          <div className="p-3 mb-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2 animate-fadeIn">
            <FAIcon name="circleAlert" className="text-sm shrink-0 mt-0.5 text-rose-600" />
            <span className="font-semibold leading-relaxed">{error}</span>
          </div>
        )}

        {/* Real Registration Form */}
        <form onSubmit={handleRegister} className="space-y-3">
          <Input
            label="Nama Lengkap *"
            placeholder="Contoh: Budi Santoso"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (error) setError('');
            }}
            icon="user"
            required
          />

          <Input
            label="Alamat Email *"
            placeholder="nama@email.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (error) setError('');
            }}
            icon="email"
            type="email"
            required
          />

          <Input
            label="Nomor Telepon / WhatsApp"
            placeholder="0812xxxxxxxx"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            icon="phone"
            type="tel"
          />

          {/* Role Selection */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-[#1F2E23]">
              Daftar Sebagai Peran
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRole('customer')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                  role === 'customer'
                    ? 'bg-[#84A282] text-white border-[#84A282] shadow-soft-sm'
                    : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
                }`}
              >
                Pelanggan (Pasien)
              </button>
              <button
                type="button"
                onClick={() => setRole('staff')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                  role === 'staff'
                    ? 'bg-[#84A282] text-white border-[#84A282] shadow-soft-sm'
                    : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
                }`}
              >
                Petugas / APJ
              </button>
            </div>
          </div>

          <Input
            label="Kata Sandi *"
            placeholder="Minimal 6 karakter"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (error) setError('');
            }}
            icon="shield"
            isPassword
            required
          />

          <Input
            label="Konfirmasi Kata Sandi *"
            placeholder="Ulangi kata sandi"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              if (error) setError('');
            }}
            icon="shield"
            isPassword
            required
          />

          <label className="flex items-start gap-2 pt-1 cursor-pointer text-xs text-[#778477]">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="w-4 h-4 text-[#84A282] rounded accent-[#84A282] mt-0.5"
            />
            <span className="leading-relaxed">
              Saya menyetujui Ketentuan Layanan dan Kebijakan Privasi Apotek Vitaria.
            </span>
          </label>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            disabled={isLoading}
            className="mt-3 shadow-soft"
          >
            {isLoading ? 'Mendaftarkan Akun...' : 'Daftar Akun'}
          </Button>
        </form>
      </div>

      {/* Footer Link */}
      <div className="text-center pt-6 border-t border-[#E7EBE4] mt-6">
        <p className="text-xs text-[#778477]">
          Sudah punya akun?{' '}
          <button
            type="button"
            onClick={onGoToLogin}
            className="font-bold text-[#587A58] hover:underline"
          >
            Masuk Sekarang
          </button>
        </p>
      </div>
    </div>
  );
};

export default Register;
