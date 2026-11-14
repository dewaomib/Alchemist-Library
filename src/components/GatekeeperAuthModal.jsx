import React, { useState } from 'react';
import {
  X,
  Shield,
  Crown,
  GraduationCap,
  KeyRound,
  Mail,
  Lock,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { PRESET_USERS } from './RoleSwitcherBar';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

export default function GatekeeperAuthModal({
  isOpen,
  onClose,
  currentUser,
  onLoginSuccess,
  showToast
}) {
  const [activeTab, setActiveTab] = useState('quick'); // 'quick' | 'email'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleQuickLogin = (userPreset) => {
    onLoginSuccess(userPreset);
    showToast(
      `Selamat Datang, ${userPreset.name}!`,
      `Kamu kini bertindak sebagai ${userPreset.title} di The Grand Alchemist's Archive.`,
      'emerald'
    );
    onClose();
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      // 1. If Supabase Auth is enabled, try authenticating with Supabase
      if (isSupabaseConfigured && supabase) {
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email: email.trim(),
            password: password.trim()
          });

          if (!error && data?.user) {
            // Check metadata role or fallback
            const role = data.user.user_metadata?.role || 'siswa';
            const preset = PRESET_USERS[role] || {
              id: data.user.id,
              name: data.user.user_metadata?.name || data.user.email.split('@')[0],
              email: data.user.email,
              role: role,
              title: role === 'admin' ? 'Grand Archivist' : role === 'guru' ? 'Guild Mentor' : 'Scholar',
              avatar: role === 'admin' ? '🧙‍♂️' : role === 'guru' ? '📜' : '⚔️',
              color: role === 'admin' ? '#D4AF37' : role === 'guru' ? '#38BDF8' : '#10B981'
            };

            onLoginSuccess(preset);
            showToast('Autentikasi Supabase Berhasil!', `Selamat datang kembali, ${preset.name}.`, 'emerald');
            onClose();
            return;
          }
        } catch (supabaseErr) {
          console.warn('Supabase auth attempted, falling back to local credentials:', supabaseErr);
        }
      }

      // 2. Local Demo Credential Match
      const cleanEmail = email.trim().toLowerCase();
      let matchedUser = null;

      if (cleanEmail.includes('admin') || cleanEmail === 'archivist@academy.grand') {
        matchedUser = PRESET_USERS.admin;
      } else if (cleanEmail.includes('guru') || cleanEmail.includes('hendra') || cleanEmail === 'hendra.wijaya@academy.grand') {
        matchedUser = PRESET_USERS.guru;
      } else if (cleanEmail.includes('arya') || cleanEmail.includes('siswa') || cleanEmail === 'arya.pendragon@academy.grand') {
        matchedUser = PRESET_USERS.siswa;
      }

      if (matchedUser) {
        onLoginSuccess(matchedUser);
        showToast(
          'Gerbang Arkanum Terbuka!',
          `Autentikasi berhasil sebagai ${matchedUser.title}.`,
          'emerald'
        );
        onClose();
      } else {
        setErrorMsg('Email atau sandi tidak dikenali oleh Gerbang Arkanum. Gunakan akun demo atau pilih karakter di tab sebelah.');
      }
    } finally {
      setIsLoading(false);
    }
  };

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
        <div className="text-center space-y-1.5 mb-6">
          <div className="w-12 h-12 rounded-2xl mx-auto flex items-center justify-center border border-[#D4AF37] bg-gradient-to-br from-amber-500/20 to-purple-500/10 shadow-[0_0_15px_rgba(212,175,55,0.25)]">
            <KeyRound className="w-6 h-6 text-[#D4AF37]" />
          </div>
          <h2 className="font-cinzel text-2xl font-bold text-[#F4E8C1]">
            Guild Gatekeeper
          </h2>
          <p className="text-xs text-[#A89F91]">
            Portal Autentikasi 3 Role: Admin Pustaka, Guru Pengampu, &amp; Siswa
          </p>
        </div>

        {/* Tab Selection */}
        <div className="flex rounded-xl bg-black/40 border border-[#D4AF37]/20 p-1 mb-6 text-xs font-cinzel">
          <button
            onClick={() => setActiveTab('quick')}
            className={`flex-1 py-2 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'quick'
                ? 'bg-[#D4AF37] text-[#12100E] shadow-md'
                : 'text-[#A89F91] hover:text-[#F4E8C1]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Pilih Cepat Akun Demo</span>
          </button>
          <button
            onClick={() => setActiveTab('email')}
            className={`flex-1 py-2 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'email'
                ? 'bg-[#D4AF37] text-[#12100E] shadow-md'
                : 'text-[#A89F91] hover:text-[#F4E8C1]'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Login Email &amp; Sandi</span>
          </button>
        </div>

        {/* TAB 1: QUICK CHARACTER PICK */}
        {activeTab === 'quick' && (
          <div className="space-y-3">
            <p className="text-[11px] text-[#A89F91] text-center mb-2">
              Klik salah satu peran di bawah untuk langsung menguji antarmuka dan hak akses khusus:
            </p>

            {/* Admin Card */}
            <button
              onClick={() => handleQuickLogin(PRESET_USERS.admin)}
              className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-center justify-between group ${
                currentUser.role === 'admin'
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
                      ADMIN
                    </span>
                  </div>
                  <p className="text-xs text-[#A89F91]">
                    {PRESET_USERS.admin.title} • {PRESET_USERS.admin.class}
                  </p>
                  <p className="text-[10px] text-amber-400/80 mt-0.5">
                    Akses: Verifikasi Pinjaman, Kelola Stok, Tambah Grimoire
                  </p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-amber-400 opacity-60 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </button>

            {/* Guru Card */}
            <button
              onClick={() => handleQuickLogin(PRESET_USERS.guru)}
              className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-center justify-between group ${
                currentUser.role === 'guru'
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
                      GURU
                    </span>
                  </div>
                  <p className="text-xs text-[#A89F91]">
                    {PRESET_USERS.guru.title} • {PRESET_USERS.guru.class}
                  </p>
                  <p className="text-[10px] text-sky-400/80 mt-0.5">
                    Akses: Formulir Pinjam Buku Kelas &amp; Dashboard Permintaan
                  </p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-sky-400 opacity-60 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </button>

            {/* Siswa Card */}
            <button
              onClick={() => handleQuickLogin(PRESET_USERS.siswa)}
              className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-center justify-between group ${
                currentUser.role === 'siswa'
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
                      SISWA
                    </span>
                  </div>
                  <p className="text-xs text-[#A89F91]">
                    ID: {PRESET_USERS.siswa.guildId} • {PRESET_USERS.siswa.class}
                  </p>
                  <p className="text-[10px] text-emerald-400/80 mt-0.5">
                    Akses: Pinjam Fisik (Approval), Baca E-Grimoire Digital, Klaim XP
                  </p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-emerald-400 opacity-60 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </button>
          </div>
        )}

        {/* TAB 2: EMAIL & PASSWORD LOGIN */}
        {activeTab === 'email' && (
          <form onSubmit={handleEmailLogin} className="space-y-4">
            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-cinzel text-[#D4AF37] mb-1">
                Alamat Email Akademi:
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#A89F91] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="archivist@academy.grand / guru / arya..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl text-xs bg-[#12100E] border border-[#D4AF37]/30 text-[#F4E8C1] focus:outline-none focus:border-[#D4AF37]"
                />
              </div>
              <p className="text-[10px] text-[#A89F91] mt-1">
                Demo hint: Masukkan kata kunci "admin", "guru", atau "arya".
              </p>
            </div>

            <div>
              <label className="block text-xs font-cinzel text-[#D4AF37] mb-1">
                Kunci Sandi Rahasia:
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#A89F91] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 rounded-xl text-xs bg-[#12100E] border border-[#D4AF37]/30 text-[#F4E8C1] focus:outline-none focus:border-[#D4AF37]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 rounded-xl font-cinzel font-bold text-xs bg-[#D4AF37] text-[#12100E] hover:bg-amber-400 transition-all flex items-center justify-center gap-2 shadow-lg"
            >
              {isLoading ? (
                <span>Membuka Segel Gerbang...</span>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>Buka Gerbang (Masuk)</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* Footer info */}
        <div className="mt-6 pt-4 border-t border-[#D4AF37]/20 flex items-center justify-between text-[11px] text-[#A89F91]">
          <span>Status Supabase Auth:</span>
          <span className={isSupabaseConfigured ? 'text-emerald-400 font-semibold' : 'text-amber-400 font-semibold'}>
            {isSupabaseConfigured ? 'Online Cloud' : 'Local Fallback State'}
          </span>
        </div>
      </div>
    </div>
  );
}
