import React, { useState } from 'react';
import { 
  FlaskConical, 
  BookOpen, 
  Sparkles, 
  User, 
  ShieldCheck, 
  Menu, 
  X,
  Volume2,
  VolumeX
} from 'lucide-react';

const toRoman = (num) => {
  const romans = [
    [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I'],
  ];
  let n = Math.max(1, num || 1);
  let res = '';
  for (const [val, sym] of romans) {
    while (n >= val) {
      res += sym;
      n -= val;
    }
  }
  return res;
};

export default function Navbar({
  activeTab,
  setActiveTab,
  scholar,
  activeLoansCount,
  soundEnabled = true,
  onToggleSound,
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'hall', label: 'The Great Hall', sub: 'Beranda Utama', icon: Sparkles },
    { id: 'vault', label: 'Vault of Tomes', sub: 'Katalog Pustaka', icon: BookOpen },
    { id: 'mixer', label: 'Alchemical Mixer', sub: 'Peramu Grimoire', icon: FlaskConical, isGlow: true },
    { id: 'sanctum', label: "Scholar's Sanctum", sub: 'Profil & Mana', icon: User, badge: activeLoansCount },
    { id: 'archivist', label: "Archivist's Chamber", sub: 'Kamar Kurator (Admin)', icon: ShieldCheck, isAdmin: true },
  ];

  return (
    <header className="sticky top-0 z-50 bg-obsidian/90 backdrop-blur-md border-b border-gold-alchemy/20 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo & Academy Sigil */}
          <button 
            onClick={() => setActiveTab('hall')}
            className="flex items-center gap-3 group text-left focus:outline-none"
          >
            <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-leather-light to-obsidian-deep border border-gold-alchemy/40 p-2.5 flex items-center justify-center shadow-alchemy group-hover:border-gold-alchemy transition-all">
              <FlaskConical className="w-6 h-6 text-gold-alchemy group-hover:scale-110 group-hover:rotate-12 transition-transform duration-300" />
              <Sparkles className="w-3 h-3 text-potion-emerald absolute top-1 right-1 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-cinzel font-bold text-lg sm:text-xl text-parchment tracking-wider group-hover:text-gold-alchemy transition-colors">
                  The Grand Alchemist's Archive
                </span>
              </div>
              <p className="text-[11px] font-sans text-parchment-muted tracking-widest uppercase flex items-center gap-1.5">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-potion-emerald animate-ping" />
                Sanctum of Arcane Wisdom & School Library
              </p>
            </div>
          </button>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden lg:flex items-center gap-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`relative px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex flex-col items-center group ${
                    isActive
                      ? 'bg-leather text-gold-alchemy border border-gold-alchemy/40 shadow-alchemy'
                      : 'text-parchment-muted hover:text-parchment hover:bg-leather/50 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-gold-alchemy' : 'text-parchment-muted group-hover:text-gold-alchemy'} ${item.isGlow ? 'animate-pulse text-potion-emerald' : ''}`} />
                    <span className="font-cinzel font-semibold tracking-wide">{item.label}</span>
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-potion-emerald text-obsidian font-bold">
                        {item.badge}
                      </span>
                    )}
                    {item.isAdmin && (
                      <span className="px-1 py-0.2 text-[9px] rounded bg-purple-950 text-purple-300 border border-purple-700/50">
                        Admin
                      </span>
                    )}
                  </div>
                  <span className={`text-[10px] ${isActive ? 'text-gold-light' : 'text-stone-500'} font-sans`}>
                    {item.sub}
                  </span>
                </button>
              );
            })}
          </nav>

          {/* Scholar Status Widget & Sound Toggle */}
          <div className="hidden md:flex items-center gap-2">
            {onToggleSound && (
              <button
                type="button"
                onClick={onToggleSound}
                title={soundEnabled ? 'Matikan Efek Suara Alkimia' : 'Nyalakan Efek Suara Alkimia'}
                aria-label={soundEnabled ? 'Mute sound' : 'Unmute sound'}
                className="p-2 rounded-full bg-leather-dark border border-gold-alchemy/25 hover:border-gold-alchemy/60 text-gold-alchemy transition-all"
              >
                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-parchment-muted" />}
              </button>
            )}
            <button
              onClick={() => setActiveTab('sanctum')}
              className="flex items-center gap-3 p-1.5 pr-3 rounded-full bg-leather-dark border border-gold-alchemy/25 hover:border-gold-alchemy/60 transition-all group"
            >
              <div className="w-8 h-8 rounded-full bg-gold-alchemy/15 border border-gold-alchemy/40 flex items-center justify-center text-gold-alchemy font-cinzel font-bold text-xs">
                {toRoman(scholar.level)}
              </div>
              <div className="text-left">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-parchment group-hover:text-gold-alchemy transition-colors">
                    {scholar.name.split(' ')[0]} {scholar.name.split(' ')[1]?.[0]}.
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-potion-emerald/20 text-potion-emerald font-bold border border-potion-emerald/30">
                    Lv.{scholar.level}
                  </span>
                </div>
                <div className="w-24 h-1.5 bg-obsidian rounded-full overflow-hidden mt-0.5 border border-stone-800">
                  <div 
                    className="h-full bg-gradient-to-r from-gold-alchemy to-potion-emerald transition-all duration-500" 
                    style={{ width: `${Math.min(100, (scholar.xp / scholar.maxXP) * 100)}%` }}
                  />
                </div>
              </div>
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden flex items-center gap-2">
            {onToggleSound && (
              <button
                type="button"
                onClick={onToggleSound}
                aria-label={soundEnabled ? 'Mute sound' : 'Unmute sound'}
                className="p-1.5 rounded-lg bg-leather border border-gold-alchemy/30 text-gold-alchemy"
              >
                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-parchment-muted" />}
              </button>
            )}
            <button
              onClick={() => setActiveTab('sanctum')}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-leather border border-gold-alchemy/30 text-xs text-gold-alchemy"
            >
              <User className="w-3.5 h-3.5" />
              <span>Lv.{scholar.level}</span>
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg bg-leather text-parchment border border-gold-alchemy/20 hover:border-gold-alchemy/50"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6 text-gold-alchemy" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-obsidian-deep/98 border-b border-gold-alchemy/25 px-4 pt-3 pb-5 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between p-3 rounded-xl text-left transition-all ${
                  isActive
                    ? 'bg-leather text-gold-alchemy border border-gold-alchemy/40 font-bold'
                    : 'text-parchment hover:bg-leather/50 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-5 h-5 ${isActive ? 'text-gold-alchemy' : 'text-parchment-muted'}`} />
                  <div>
                    <div className="font-cinzel text-sm">{item.label}</div>
                    <div className="text-xs text-parchment-muted">{item.sub}</div>
                  </div>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="px-2 py-0.5 text-xs rounded-full bg-potion-emerald text-obsidian font-bold">
                    {item.badge} Aktif
                  </span>
                )}
                {item.isAdmin && (
                  <span className="px-1.5 py-0.5 text-[10px] rounded bg-purple-950 text-purple-300 border border-purple-700">
                    Admin
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
}
