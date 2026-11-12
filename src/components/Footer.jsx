import React from 'react';
import { FlaskConical, Sparkles, Scroll, Shield, Heart } from 'lucide-react';

export default function Footer({ setActiveTab }) {
  return (
    <footer className="mt-20 border-t border-gold-alchemy/20 bg-obsidian-deep/90 relative overflow-hidden">
      {/* Decorative magical aura */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-1 bg-gradient-to-r from-transparent via-gold-alchemy to-transparent opacity-50" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          
          {/* Brand & Academy Lore */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2.5">
              <FlaskConical className="w-6 h-6 text-gold-alchemy" />
              <h3 className="font-cinzel text-lg font-bold text-parchment">
                The Grand Alchemist's Archive
              </h3>
            </div>
            <p className="text-sm text-parchment-muted max-w-md leading-relaxed font-sans">
              Perpustakaan digital bertema alkimia fantasi untuk sekolah dan cendekiawan muda. Memadukan kurikulum sains, sastra nusantara, dan teknologi dalam kemasan grimoire petualangan yang memikat rasa ingin tahu.
            </p>
            <div className="flex items-center gap-4 text-xs text-gold-light/80 pt-1 font-cinzel">
              <span>✦ Ignis Aurum Probat</span>
              <span>✦ Scientia Mentem Ditavit</span>
            </div>
          </div>

          {/* Quick Nav Lore */}
          <div>
            <h4 className="font-cinzel text-xs font-bold uppercase tracking-widest text-gold-alchemy mb-3">
              Kamar-Kamar Arsip
            </h4>
            <ul className="space-y-2 text-sm text-parchment-muted">
              <li>
                <button onClick={() => setActiveTab('hall')} className="hover:text-gold-alchemy transition-colors">
                  The Great Hall (Beranda Utama)
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('vault')} className="hover:text-gold-alchemy transition-colors">
                  Vault of Tomes (Katalog Buku)
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('mixer')} className="hover:text-gold-alchemy transition-colors">
                  Alchemical Mixer (Rekomendasi Ramuan)
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('sanctum')} className="hover:text-gold-alchemy transition-colors">
                  Scholar's Sanctum (Profil Cendekiawan)
                </button>
              </li>
              <li>
                <button onClick={() => setActiveTab('archivist')} className="hover:text-gold-alchemy transition-colors">
                  Archivist's Chamber (Ruang Kurator)
                </button>
              </li>
            </ul>
          </div>

          {/* Library Hours & Seal */}
          <div className="space-y-3">
            <h4 className="font-cinzel text-xs font-bold uppercase tracking-widest text-gold-alchemy mb-3">
              Jam Buka Sanctum
            </h4>
            <div className="text-xs text-parchment-muted space-y-1.5 font-sans">
              <p className="flex justify-between">
                <span>Senin - Jumat:</span>
                <span className="text-parchment font-medium">07:00 - 16:30 WIB</span>
              </p>
              <p className="flex justify-between">
                <span>Sabtu (Riset Eksperimen):</span>
                <span className="text-parchment font-medium">08:00 - 13:00 WIB</span>
              </p>
              <p className="flex justify-between text-stone-500">
                <span>Hari Minggu & Libur Sihir:</span>
                <span>Tutup</span>
              </p>
            </div>
            <div className="pt-2 text-xs text-stone-400 border-t border-stone-800">
              <p>📍 Kubah Utama Lt. 2, Gedung Perpustakaan Sentral Akademi</p>
            </div>
          </div>

        </div>

        <div className="border-t border-gold-alchemy/15 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-stone-500">
          <p>© 2026 The Grand Alchemist's Archive. Ditempa untuk Cendekiawan Muda Nusantara.</p>
          <div className="flex items-center gap-1 mt-2 sm:mt-0 text-stone-400">
            <span>Diberdayakan oleh Ramuan Pengetahuan & React 19</span>
            <Sparkles className="w-3.5 h-3.5 text-gold-alchemy ml-1" />
          </div>
        </div>
      </div>
    </footer>
  );
}
