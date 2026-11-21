import React from 'react';
import { Crown, GraduationCap, Shield, LogIn, LogOut, Sparkles, Database } from 'lucide-react';

export const PRESET_USERS = {
  admin: {
    id: 'user-admin',
    username: 'admin',
    password: 'admin123',
    name: 'Administrator Perpustakaan',
    role: 'admin',
    title: 'Grand Archivist & Pustakawan Utama',
    class: 'Pengurus Perpustakaan Sekolah',
    avatar: '👑'
  },
  guru: {
    id: 'user-guru',
    username: 'hendra',
    password: 'password123',
    name: 'Bpk. Hendra Wijaya, M.Pd.',
    role: 'guru',
    title: 'Guild Mentor (Guru Pengampu)',
    class: 'SMK • Kelas 10 • Jurusan TKJ',
    jenjang: 'SMK',
    kelas: '10',
    jurusan: 'TKJ',
    avatar: '📜'
  },
  siswa: {
    id: 'student-arya',
    username: 'arya',
    password: 'password123',
    name: 'Arya Pendragon',
    role: 'siswa',
    title: 'Apprentice Scholar',
    guildId: 'ARC-2026-089',
    nisn: '0061234501',
    jenjang: 'SMK',
    kelas: '10',
    jurusan: 'TKJ',
    class: 'SMK Kelas 10 TKJ 1',
    avatar: '⚔️'
  }
};

export default function RoleSwitcherBar({
  currentUser,
  onSwitchRole,
  onOpenGatekeeper,
  onOpenGatekeeperModal,
  onLogout,
  isSwitching = false
}) {
  const handleOpenModal = onOpenGatekeeper || onOpenGatekeeperModal;
  const presets = [
    {
      key: 'admin',
      label: 'Admin',
      sub: 'Grand Archivist',
      icon: Crown,
      activeStyle:
        'bg-amber-500/20 text-amber-200 border-amber-400 shadow-[0_0_12px_rgba(212,175,55,0.25)]',
      idleStyle:
        'text-stone-400 border-stone-700/70 hover:text-amber-300 hover:border-amber-500/40'
    },
    {
      key: 'guru',
      label: 'Guru',
      sub: 'Guild Mentor',
      icon: GraduationCap,
      activeStyle:
        'bg-sky-500/20 text-sky-200 border-sky-400 shadow-[0_0_12px_rgba(56,189,248,0.25)]',
      idleStyle:
        'text-stone-400 border-stone-700/70 hover:text-sky-300 hover:border-sky-500/40'
    },
    {
      key: 'siswa',
      label: 'Siswa',
      sub: 'Apprentice Scholar',
      icon: Shield,
      activeStyle:
        'bg-emerald-500/20 text-emerald-200 border-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.25)]',
      idleStyle:
        'text-stone-400 border-stone-700/70 hover:text-emerald-300 hover:border-emerald-500/40'
    }
  ];

  return (
    <div className="bg-[#0D0B09] border-b border-amber-500/25 px-3 sm:px-6 py-2 relative z-40">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 text-amber-300/90">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 font-semibold tracking-wider uppercase text-[10px]">
            <Sparkles className="w-3 h-3" /> Quick Login Uji Role
          </span>
          <span className="hidden md:inline text-stone-400">
            Sesi aktif PostgreSQL:
            <strong className="ml-1.5 text-amber-200">
              {currentUser ? `${currentUser.name} (@${currentUser.username})` : 'Tamu (Belum Login)'}
            </strong>
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {presets.map((item) => {
            const preset = PRESET_USERS[item.key];
            const Icon = item.icon;
            const isActive = currentUser?.role === preset.role;

            return (
              <button
                key={item.key}
                type="button"
                disabled={isSwitching}
                onClick={() => onSwitchRole?.(preset)}
                className={`px-2.5 py-1 rounded-md border flex items-center gap-1.5 font-medium transition-all cursor-pointer disabled:opacity-60 ${
                  isActive ? item.activeStyle : item.idleStyle
                }`}
                title={`Masuk DB PostgreSQL sebagai ${preset.name} (${preset.username})`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
                <span className="hidden lg:inline text-[10px] opacity-75">
                  • {item.sub}
                </span>
              </button>
            );
          })}

          <button
            type="button"
            onClick={handleOpenModal}
            className="ml-1 px-2.5 py-1 rounded-md border border-purple-500/40 bg-purple-950/30 hover:bg-purple-900/40 text-purple-200 flex items-center gap-1.5 transition-all cursor-pointer"
            title="Masuk atau Daftar menggunakan Username & Password"
          >
            <LogIn className="w-3.5 h-3.5 text-purple-300" />
            <span>{currentUser ? 'Ganti Akun' : 'Masuk / Daftar'}</span>
          </button>

          {currentUser && onLogout && (
            <button
              type="button"
              onClick={onLogout}
              className="px-2.5 py-1 rounded-md border border-rose-500/35 bg-rose-950/25 hover:bg-rose-900/40 text-rose-200 flex items-center gap-1.5 transition-all cursor-pointer"
              title="Keluar dan hapus HTTP-only cookie session"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-300" />
              <span className="hidden sm:inline">Keluar</span>
            </button>
          )}

          <span className="hidden xl:inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-950/40 border border-emerald-500/25 text-[10px] text-emerald-300">
            <Database className="w-3 h-3" /> Prisma Auth
          </span>
        </div>
      </div>
    </div>
  );
}
