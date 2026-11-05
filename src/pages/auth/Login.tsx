import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { FAIcon } from '../../components/common/FAIcon';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { useToast } from '../../context/ToastContext';

interface LoginProps {
  onGoToRegister: () => void;
  onGoToForgot: () => void;
}

export const Login: React.FC<LoginProps> = ({ onGoToRegister, onGoToForgot }) => {
  const { login, loginWithGoogle } = useAuth();
  const { showToast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Alamat email wajib diisi.');
      return;
    }
    if (!password) {
      setError('Kata sandi wajib diisi.');
      return;
    }

    try {
      setIsLoading(true);
      const res = await login(email, password);
      if (!res.success) {
        setError(res.message || 'Login gagal.');
        showToast(res.message || 'Login gagal.', 'danger');
      } else {
        showToast('Login berhasil! Selamat datang di Apotek Vitaria.', 'success');
      }
    } catch {
      setError('Terjadi kendala saat menghubungkan ke server.');
      showToast('Koneksi ke server terputus.', 'danger');
    } finally {
      setIsLoading(false);
    }
  };

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

  return (
    <div className="w-full max-w-sm mx-auto p-4 flex flex-col justify-between">
      <div>
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-[#84A282] to-[#587A58] text-white flex items-center justify-center text-2xl mx-auto shadow-glow mb-4 border-2 border-white">
            <FAIcon name="heartPulse" />
          </div>
          <h2 className="text-2xl font-extrabold text-[#26382B] tracking-tight">
            Masuk ke Akun
          </h2>
          <p className="text-xs text-[#778477] mt-1 max-w-xs mx-auto leading-relaxed">
            Akses layanan apotek, riwayat pembelian, dan konsultasi apoteker resmi
          </p>
        </div>

        {/* Real Google OAuth Button */}
        <div className="mb-5">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isGoogleLoading}
            className="w-full py-3 px-4 bg-white hover:bg-[#F9FAF8] active:bg-[#F0F4EE] text-stone-700 font-bold text-xs rounded-2xl border border-stone-200 shadow-xs flex items-center justify-center gap-2.5 transition-all hover:border-[#84A282] hover:shadow-soft"
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
            <span>{isGoogleLoading ? 'Menghubungkan ke Google...' : 'Lanjutkan dengan Google'}</span>
          </button>

          <div className="relative my-4 flex items-center justify-center">
            <div className="border-t border-[#E7EBE4] w-full"></div>
            <span className="bg-[#F7F9F5] px-3 text-[10px] text-[#778477] font-bold uppercase tracking-wider absolute">
              atau masuk dengan email
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

        {/* Real Login Form */}
        <form onSubmit={handleLogin} className="space-y-3.5">
          <Input
            label="Alamat Email"
            placeholder="contoh@email.com"
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
            label="Kata Sandi"
            placeholder="Masukkan kata sandi akun"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (error) setError('');
            }}
            icon="shield"
            isPassword
            required
          />

          <div className="flex items-center justify-between text-xs pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-[#778477]">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 text-[#84A282] rounded accent-[#84A282]"
              />
              <span>Ingat Saya</span>
            </label>

            <button
              type="button"
              onClick={onGoToForgot}
              className="font-semibold text-[#587A58] hover:underline"
            >
              Lupa Password?
            </button>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            icon="arrowRight"
            iconPosition="right"
            disabled={isLoading}
            className="mt-2 shadow-soft"
          >
            {isLoading ? 'Memverifikasi Akun...' : 'Masuk Sekarang'}
          </Button>
        </form>
      </div>

      {/* Footer Link */}
      <div className="text-center pt-8 border-t border-[#E7EBE4] mt-6">
        <p className="text-xs text-[#778477]">
          Belum punya akun?{' '}
          <button
            type="button"
            onClick={onGoToRegister}
            className="font-bold text-[#587A58] hover:underline"
          >
            Daftar Sekarang
          </button>
        </p>
      </div>
    </div>
  );
};

export default Login;
