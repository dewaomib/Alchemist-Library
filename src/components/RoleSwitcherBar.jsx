import React from 'react';
import { Crown, GraduationCap, Shield, UserCheck, KeyRound, Sparkles } from 'lucide-react';

export const PRESET_USERS = {
  admin: {
    id: 'user-admin',
    name: 'Grand Archivist (Admin)',
    email: 'archivist@academy.grand',
    role: 'admin',
    roleLabel: 'Admin / Pengurus Perpustakaan',
    title: 'Grand Archivist & Chief Curator',
    class: 'Dewan Pengurus Pustaka Agung',
    avatar: '🧙‍♂️',
    color: '#D4AF37', // Gold
    badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40'
  },
  guru: {
    id: 'user-guru',
    name: 'Bpk. Hendra Wijaya, M.Pd.',
    email: 'hendra.wijaya@academy.grand',
    role: 'guru',
    roleLabel: 'Guru / Guild Mentor',
    title: 'Guild Mentor & Pengampu Sains',
    class: 'Fakultas Sains Alkimia Nusantara',
    avatar: '📜',
    color: '#38BDF8', // Sky Cyan
    badgeClass: 'bg-sky-500/20 text-sky-300 border-sky-500/40'
  },
  siswa: {
    id: 'user-siswa',
    name: 'Arya Pendragon',
    email: 'arya.pendragon@academy.grand',
    role: 'siswa',
    roleLabel: 'Siswa / Apprentice Scholar',
    title: 'Apprentice Scholar',
    guildId: 'ARC-2026-089',
    class: 'Kelas XI MIPA 2 • Akademi Sains & Arkanum',
    avatar: '⚔️',
    color: '#10B981', // Emerald
    badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
  }
};

export default function RoleSwitcherBar({
  currentUser,
  onSwitchRole,
  onOpenGatekeeperModal
}) {
  return (
    <aside
      aria-label="Demo role switcher bar"
      className="w-full border-b text-xs relative z-50 transition-colors"
      style={{
        backgroundColor: '#0A0908',
        borderColor: 'rgba(212, 175, 55, 0.35)'
      }}
    >
      <div className="max-w-7xl mx-auto px-4 py-1.5 flex flex-wrap items-center justify-between gap-2">
        {/* Left: Quick Label */}
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 font-cinzel font-bold text-amber-400">
            <Sparkles className="w-3.5 h-3.5" />
            <span>ROLE SWITCHER BAR</span>
          </span>
          <span className="hidden md:inline text-[11px] text-[#A89F91]">
            • Uji coba instan 3 Role tanpa ketik password
          </span>
        </div>

        {/* Middle: 3 Quick Switch Buttons */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Admin Button */}
          <button
            onClick={() => onSwitchRole(PRESET_USERS.admin)}
            className={`px-2.5 py-1 rounded-lg font-cinzel font-semibold flex items-center gap-1.5 transition-all text-[11px] ${
              currentUser.role === 'admin'
                ? 'bg-amber-500/30 text-amber-300 border border-amber-500/70 shadow-[0_0_10px_rgba(245,158,11,0.3)]'
                : 'text-[#A89F91] hover:text-[#F4E8C1] hover:bg-white/5 border border-transparent'
            }`}
          >
            <Crown className="w-3.5 h-3.5 text-amber-400" />
            <span>Admin</span>
            <span className="hidden sm:inline text-[10px] text-amber-400/80">(Archivist)</span>
          </button>

          {/* Guru Button */}
          <button
            onClick={() => onSwitchRole(PRESET_USERS.guru)}
            className={`px-2.5 py-1 rounded-lg font-cinzel font-semibold flex items-center gap-1.5 transition-all text-[11px] ${
              currentUser.role === 'guru'
                ? 'bg-sky-500/30 text-sky-300 border border-sky-500/70 shadow-[0_0_10px_rgba(56,189,248,0.3)]'
                : 'text-[#A89F91] hover:text-[#F4E8C1] hover:bg-white/5 border border-transparent'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5 text-sky-400" />
            <span>Guru</span>
            <span className="hidden sm:inline text-[10px] text-sky-400/80">(Bpk. Hendra)</span>
          </button>

          {/* Siswa Button */}
          <button
            onClick={() => onSwitchRole(PRESET_USERS.siswa)}
            className={`px-2.5 py-1 rounded-lg font-cinzel font-semibold flex items-center gap-1.5 transition-all text-[11px] ${
              currentUser.role === 'siswa'
                ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/70 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                : 'text-[#A89F91] hover:text-[#F4E8C1] hover:bg-white/5 border border-transparent'
            }`}
          >
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span>Siswa</span>
            <span className="hidden sm:inline text-[10px] text-emerald-400/80">(Arya)</span>
          </button>
        </div>

        {/* Right: Active Role Info & Gatekeeper Modal Trigger */}
        <div className="flex items-center gap-3">
          <div className="hidden lg:flex items-center gap-1.5 text-[11px]">
            <span className="text-[#A89F91]">Sedang Aktif:</span>
            <span className="text-[#F4E8C1] font-semibold flex items-center gap-1">
              <span>{currentUser.avatar}</span>
              <span>{currentUser.name}</span>
            </span>
          </div>

          <button
            onClick={onOpenGatekeeperModal}
            className="px-2.5 py-1 rounded-lg border border-[#D4AF37]/40 text-[#D4AF37] hover:bg-[#D4AF37]/15 flex items-center gap-1 text-[11px] font-cinzel transition-all"
            title="Buka form login email / ganti akun resmi"
          >
            <KeyRound className="w-3 h-3" />
            <span>Gatekeeper Login</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
