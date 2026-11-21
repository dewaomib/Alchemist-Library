import React from 'react';
import { Shield, LayoutGrid } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function ThemeToggle({ compact = false, className = '' }) {
  const { theme, setTheme } = useTheme();
  const isModern = theme === 'modern';

  return (
    <div
      role="group"
      aria-label="Pengalih Tema Tampilan"
      className={`theme-toggle-pill inline-flex items-center p-0.5 rounded-xl border transition-all shrink-0 ${
        isModern
          ? 'bg-[#F1F5F9] border-[#CBD5E1] shadow-sm'
          : 'bg-[#0D0B09] border-[#D4AF37]/30'
      } ${className}`}
    >
      <button
        type="button"
        onClick={() => setTheme('classic')}
        aria-pressed={!isModern}
        title="Tema Klasik (Medieval Fantasy — Obsidian Wood)"
        className={`theme-toggle-btn inline-flex items-center gap-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
          compact ? 'px-2 py-1 text-[11px]' : 'px-2.5 py-1.5 text-xs'
        } ${
          !isModern
            ? 'bg-[#D4AF37]/20 text-[#F4E8C1] border border-[#D4AF37]/60 shadow-[0_0_10px_rgba(212,175,55,0.2)]'
            : 'text-[#475569] hover:text-[#0F172A] border border-transparent'
        }`}
      >
        <Shield className={`w-3.5 h-3.5 shrink-0 ${!isModern ? 'text-[#D4AF37]' : 'text-[#64748B]'}`} />
        <span>Klasik</span>
      </button>

      <button
        type="button"
        onClick={() => setTheme('modern')}
        aria-pressed={isModern}
        title="Tema Modern (Clean Contemporary Light)"
        className={`theme-toggle-btn inline-flex items-center gap-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
          compact ? 'px-2 py-1 text-[11px]' : 'px-2.5 py-1.5 text-xs'
        } ${
          isModern
            ? 'bg-[#2563EB] text-white border border-[#2563EB] shadow-sm'
            : 'text-[#A89F91] hover:text-[#F4E8C1] border border-transparent'
        }`}
      >
        <LayoutGrid className={`w-3.5 h-3.5 shrink-0 ${isModern ? 'text-white' : 'text-[#A89F91]'}`} />
        <span>Modern</span>
      </button>
    </div>
  );
}
