import React, { useState } from 'react';
import {
  X,
  KeyRound,
  User,
  UserPlus,
  Lock,
  ArrowRight,
  Sparkles,
  AlertCircle,
  Hash
} from 'lucide-react';
import { PRESET_USERS } from './RoleSwitcherBar';
import { api } from '../lib/apiClient';
import {
  KELAS_BY_JENJANG,
  SMK_JURUSAN_OPTIONS,
  normalizeNisn
} from '../utils/libraryUtils';

export default function GatekeeperAuthModal({
  isOpen,
  onClose,
  currentUser,
  members = [],
  onRegisterMember,
  onLoginSuccess,
  showToast
}) {
  const [activeTab, setActiveTab] = useState('login'); // 'login' | 'register' | 'quick'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Form Registrasi Akun Baru (Username & Password tanpa Email)
  const [regForm, setRegForm] = useState({
    username: '',
    password: '',
    name: '',
    role: 'siswa',
    nisn: '',
    jenjang: 'SMK',
    kelas: '10',
    jurusan: 'TKJ'
  });

  if (!isOpen) return null;

  const handleQuickLogin = async (userPreset) => {
    setErrorMsg('');
    setIsLoading(true);
    try {
      const res = await api.login({
        username: userPreset.username,
        password: userPreset.password
      });
      onLoginSuccess(res.user);
      showToast(
        `Selamat Datang, ${res.user.name}!`,
        `Sesi PostgreSQL aktif untuk @${res.user.username} (${res.user.title}).`,
        'emerald'
      );
      onClose();
    } catch (err) {
      setErrorMsg(err?.message || 'Gagal melakukan login cepat ke PostgreSQL.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUsernameLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    const rawUsername = username.trim();
    const rawPassword = password;

    if (!rawUsername || !rawPassword) {
      setErrorMsg('Username dan kata sandi wajib diisi.');
      return;
    }

    setIsLoading(true);
    const cleanUser = rawUsername.toLowerCase();

    try {
      const res = await api.login({
        username: cleanUser,
        password: rawPassword
      });
      onLoginSuccess(res.user);
      showToast(
        'Autentikasi Berhasil!',
        `Selamat datang kembali, ${res.user.name} (@${res.user.username}).`,
        'emerald'
      );
      onClose();
    } catch (err) {
      setErrorMsg(
        err?.message ||
          'Username atau kata sandi salah. Gunakan akun terdaftar (misal: admin / admin123, hendra / password123, arya / password123).'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanUser = regForm.username
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9._-]/g, '');
    const cleanPass = regForm.password;
    const cleanName = regForm.name.trim();
    const cleanNisn = normalizeNisn(regForm.nisn);

    if (!cleanUser || cleanUser.length < 3) {
      setErrorMsg('Username minimal terdiri dari 3 karakter huruf/angka.');
      return;
    }
    if (!cleanPass || cleanPass.length < 6) {
      setErrorMsg('Kata sandi minimal 6 karakter.');
      return;
    }
    if (!cleanName) {
      setErrorMsg('Nama lengkap wajib diisi.');
      return;
    }
    if (!cleanNisn) {
      setErrorMsg('NISN siswa wajib diisi (contoh: 0081234567).');
      return;
    }

    setIsLoading(true);
    try {
      const jurusanFinal =
        regForm.jenjang === 'SMK' ? regForm.jurusan : 'Semua Jurusan';
      const res = await api.register({
        username: cleanUser,
        password: cleanPass,
        nama: cleanName,
        nisn: cleanNisn,
        jenjang: regForm.jenjang,
        kelas: regForm.kelas,
        jurusan: jurusanFinal
      });

      onRegisterMember?.(res.user);
      onLoginSuccess(res.user);
      showToast(
        'Akun Baru Berhasil Didaftarkan!',
        `Akun PostgreSQL dibuat untuk ${res.user.name} (@${res.user.username}).`,
        'emerald'
      );
      onClose();
    } catch (err) {
      setErrorMsg(err?.message || 'Gagal mendaftarkan akun ke database PostgreSQL.');
    } finally {
      setIsLoading(false);
    }
  };

  const availableKelasOptions = KELAS_BY_JENJANG[regForm.jenjang] || ['10', '11', '12'];

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
      <div
        className="max-w-lg w-full rounded-2xl border p-6 sm:p-8 relative my-8 text-parchment shadow-2xl"
        style={{
          backgroundColor: '#171311',
          borderColor: '#D4AF37',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.95)'
        }}
      >
        {/* Top Gold Bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-potion-emerald via-gold-alchemy to-amber-500 rounded-t-2xl" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/40 border border-[#D4AF37]/30 flex items-center justify-center text-[#A89F91] hover:text-[#F4E8C1] hover:border-[#D4AF37] transition-all"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="text-center space-y-1.5 mb-5">
          <div className="w-12 h-12 rounded-2xl mx-auto flex items-center justify-center border border-[#D4AF37] bg-gradient-to-br from-amber-500/20 to-purple-500/10 shadow-[0_0_15px_rgba(212,175,55,0.25)]">
            <KeyRound className="w-6 h-6 text-[#D4AF37]" />
          </div>
          <h2 className="font-cinzel text-2xl font-bold text-[#F4E8C1]">
            Guild Gatekeeper
          </h2>
          <p className="text-xs text-[#A89F91]">
            Autentikasi Sekolah Berbasis Username &amp; Password (Tanpa Email)
          </p>
        </div>

        {/* Tab Selection */}
        <div className="grid grid-cols-3 rounded-xl bg-black/40 border border-[#D4AF37]/20 p-1 mb-5 text-[11px] font-cinzel gap-1">
          <button
            type="button"
            onClick={() => {
              setActiveTab('login');
              setErrorMsg('');
            }}
            className={`py-2 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'login'
                ? 'bg-[#D4AF37] text-[#12100E] shadow-md'
                : 'text-[#A89F91] hover:text-[#F4E8C1]'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Masuk</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('register');
              setErrorMsg('');
            }}
            className={`py-2 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'register'
                ? 'bg-[#D4AF37] text-[#12100E] shadow-md'
                : 'text-[#A89F91] hover:text-[#F4E8C1]'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Daftar Akun</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('quick');
              setErrorMsg('');
            }}
            className={`py-2 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'quick'
                ? 'bg-[#D4AF37] text-[#12100E] shadow-md'
                : 'text-[#A89F91] hover:text-[#F4E8C1]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Akun Demo</span>
          </button>
        </div>

        {/* TAB 1: USERNAME & PASSWORD LOGIN */}
        {activeTab === 'login' && (
          <form onSubmit={handleUsernameLogin} className="space-y-4">
            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-cinzel text-[#D4AF37] mb-1">
                Username Pengguna:
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-[#A89F91] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Masukkan username (contoh: admin / hendra / arya / nadia.tkj)"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl text-xs bg-[#12100E] border border-[#D4AF37]/30 text-[#F4E8C1] focus:outline-none focus:border-[#D4AF37]"
                />
              </div>
              <p className="text-[10px] text-[#A89F91] mt-1">
                Petunjuk: Ketik username <strong>admin</strong>, <strong>hendra</strong> (Guru), <strong>arya</strong> (Siswa), atau NISN.
              </p>
            </div>

            <div>
              <label className="block text-xs font-cinzel text-[#D4AF37] mb-1">
                Password / Kata Sandi:
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#A89F91] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl text-xs bg-[#12100E] border border-[#D4AF37]/30 text-[#F4E8C1] focus:outline-none focus:border-[#D4AF37]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 rounded-xl font-cinzel font-bold text-xs bg-[#D4AF37] text-[#12100E] hover:bg-amber-400 transition-all flex items-center justify-center gap-2 shadow-lg"
            >
              {isLoading ? (
                <span>Memverifikasi Username...</span>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>Masuk dengan Username</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* TAB 2: REGISTER NEW ACCOUNT (USERNAME & PASSWORD ONLY) */}
        {activeTab === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-cinzel text-[#D4AF37] mb-1">
                  Username Baru:
                </label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 text-[#A89F91] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={regForm.username}
                    onChange={(e) =>
                      setRegForm({ ...regForm, username: e.target.value })
                    }
                    placeholder="contoh: budi.tkj10"
                    className="w-full pl-8 pr-3 py-2 rounded-xl text-xs bg-[#12100E] border border-[#D4AF37]/30 text-[#F4E8C1] focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-cinzel text-[#D4AF37] mb-1">
                  Password:
                </label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 text-[#A89F91] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={regForm.password}
                    onChange={(e) =>
                      setRegForm({ ...regForm, password: e.target.value })
                    }
                    placeholder="Minimal 4 karakter"
                    className="w-full pl-8 pr-3 py-2 rounded-xl text-xs bg-[#12100E] border border-[#D4AF37]/30 text-[#F4E8C1] focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-cinzel text-[#D4AF37] mb-1">
                  Nama Lengkap:
                </label>
                <input
                  type="text"
                  required
                  value={regForm.name}
                  onChange={(e) =>
                    setRegForm({ ...regForm, name: e.target.value })
                  }
                  placeholder="Nama Lengkap Siswa / Guru"
                  className="w-full px-3 py-2 rounded-xl text-xs bg-[#12100E] border border-[#D4AF37]/30 text-[#F4E8C1] focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-cinzel text-[#D4AF37] mb-1">
                  NISN (Teks 10 Digit):
                </label>
                <div className="relative">
                  <Hash className="w-3.5 h-3.5 text-[#A89F91] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    inputMode="numeric"
                    required={regForm.role === 'siswa'}
                    value={regForm.nisn}
                    onChange={(e) =>
                      setRegForm({ ...regForm, nisn: e.target.value })
                    }
                    placeholder="Contoh: 0081234567"
                    className="w-full pl-8 pr-3 py-2 rounded-xl text-xs font-mono bg-[#12100E] border border-[#D4AF37]/30 text-[#F4E8C1] focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              <div>
                <label className="block text-[11px] font-cinzel text-[#D4AF37] mb-1">
                  Jenjang:
                </label>
                <select
                  value={regForm.jenjang}
                  onChange={(e) => {
                    const nextJenjang = e.target.value;
                    const nextKelas = (KELAS_BY_JENJANG[nextJenjang] || ['10'])[0];
                    setRegForm({
                      ...regForm,
                      jenjang: nextJenjang,
                      kelas: nextKelas,
                      jurusan: nextJenjang === 'SMK' ? 'TKJ' : 'Semua Jurusan'
                    });
                  }}
                  className="w-full px-2.5 py-2 rounded-xl text-xs bg-[#12100E] border border-[#D4AF37]/30 text-[#F4E8C1] focus:outline-none focus:border-[#D4AF37]"
                >
                  <option value="SMP">SMP</option>
                  <option value="SMA">SMA</option>
                  <option value="SMK">SMK</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-cinzel text-[#D4AF37] mb-1">
                  Kelas:
                </label>
                <select
                  value={regForm.kelas}
                  onChange={(e) =>
                    setRegForm({ ...regForm, kelas: e.target.value })
                  }
                  className="w-full px-2.5 py-2 rounded-xl text-xs bg-[#12100E] border border-[#D4AF37]/30 text-[#F4E8C1] focus:outline-none focus:border-[#D4AF37]"
                >
                  {availableKelasOptions.map((kls) => (
                    <option key={kls} value={kls}>
                      Kelas {kls}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-cinzel text-[#D4AF37] mb-1">
                  Jurusan:
                </label>
                <select
                  value={regForm.jenjang === 'SMK' ? regForm.jurusan : 'Semua Jurusan'}
                  disabled={regForm.jenjang !== 'SMK'}
                  onChange={(e) =>
                    setRegForm({ ...regForm, jurusan: e.target.value })
                  }
                  className="w-full px-2.5 py-2 rounded-xl text-xs bg-[#12100E] border border-[#D4AF37]/30 text-[#F4E8C1] focus:outline-none focus:border-[#D4AF37] disabled:opacity-50"
                >
                  {regForm.jenjang === 'SMK' ? (
                    SMK_JURUSAN_OPTIONS.map((jur) => (
                      <option key={jur} value={jur}>
                        {jur}
                      </option>
                    ))
                  ) : (
                    <option value="Semua Jurusan">Umum / Nasional</option>
                  )}
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 rounded-xl font-cinzel font-bold text-xs bg-emerald-500 text-[#12100E] hover:bg-emerald-400 transition-all flex items-center justify-center gap-2 shadow-lg mt-2"
            >
              <UserPlus className="w-4 h-4" />
              <span>Daftarkan Akun &amp; Masuk</span>
            </button>
          </form>
        )}

        {/* TAB 3: QUICK CHARACTER PICK */}
        {activeTab === 'quick' && (
          <div className="space-y-3">
            <p className="text-[11px] text-[#A89F91] text-center mb-2">
              Klik salah satu akun demo di bawah untuk berpindah role secara instan:
            </p>

            {/* Admin Card */}
            <button
              onClick={() => handleQuickLogin(PRESET_USERS.admin)}
              className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-center justify-between group ${
                currentUser?.role === 'admin'
                  ? 'bg-amber-500/20 border-amber-500'
                  : 'bg-black/30 border-white/10 hover:border-amber-500/60 hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-lg">
                  👑
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-cinzel font-bold text-sm text-[#F4E8C1] group-hover:text-amber-400">
                      {PRESET_USERS.admin.name}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30">
                      @{PRESET_USERS.admin.username}
                    </span>
                  </div>
                  <p className="text-xs text-[#A89F91]">
                    {PRESET_USERS.admin.title} • {PRESET_USERS.admin.class}
                  </p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-amber-400 opacity-60 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </button>

            {/* Guru Card */}
            <button
              onClick={() => handleQuickLogin(PRESET_USERS.guru)}
              className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-center justify-between group ${
                currentUser?.role === 'guru'
                  ? 'bg-sky-500/20 border-sky-500'
                  : 'bg-black/30 border-white/10 hover:border-sky-500/60 hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-lg">
                  📜
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-cinzel font-bold text-sm text-[#F4E8C1] group-hover:text-sky-400">
                      {PRESET_USERS.guru.name}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 font-semibold border border-sky-500/30">
                      @{PRESET_USERS.guru.username}
                    </span>
                  </div>
                  <p className="text-xs text-[#A89F91]">
                    {PRESET_USERS.guru.title} • {PRESET_USERS.guru.class}
                  </p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-sky-400 opacity-60 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </button>

            {/* Siswa Card */}
            <button
              onClick={() => handleQuickLogin(PRESET_USERS.siswa)}
              className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-center justify-between group ${
                currentUser?.role === 'siswa'
                  ? 'bg-emerald-500/20 border-emerald-500'
                  : 'bg-black/30 border-white/10 hover:border-emerald-500/60 hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-lg">
                  ⚔️
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-cinzel font-bold text-sm text-[#F4E8C1] group-hover:text-emerald-400">
                      {PRESET_USERS.siswa.name}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
                      @{PRESET_USERS.siswa.username}
                    </span>
                  </div>
                  <p className="text-xs text-[#A89F91]">
                    NISN: {PRESET_USERS.siswa.nisn} • {PRESET_USERS.siswa.class}
                  </p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-emerald-400 opacity-60 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </button>
          </div>
        )}

        {/* Footer info */}
        <div className="mt-6 pt-4 border-t border-[#D4AF37]/20 flex items-center justify-between text-[11px] text-[#A89F91]">
          <span>Sistem Autentikasi:</span>
          <span className="text-emerald-400 font-semibold">
            PostgreSQL + Prisma (HTTP-Only Cookie JWT)
          </span>
        </div>
      </div>
    </div>
  );
}
