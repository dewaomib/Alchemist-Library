import React from 'react';
import { X, AlertCircle, XCircle } from 'lucide-react';

export default function RejectionReasonModal({
  loan,
  isOpen,
  onClose,
  reason,
  onReasonChange,
  onConfirm
}) {
  if (!isOpen || !loan) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div
        className="max-w-lg w-full rounded-2xl border p-6 sm:p-8 space-y-5 relative shadow-2xl animate-fadeIn"
        style={{
          backgroundColor: 'var(--theme-surface)',
          borderColor: 'var(--theme-danger)',
          boxShadow: 'var(--theme-shadow-modal)'
        }}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 text-[#A89F91] hover:text-[#F4E8C1] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0">
            <XCircle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-cinzel uppercase tracking-wider text-rose-400 block">
              PERSETUJUAN DITOLAK • GRAND ARCHIVIST
            </span>
            <h3 className="font-cinzel text-xl font-bold text-[#F4E8C1]">
              Tolak Permintaan Peminjaman
            </h3>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 space-y-1 text-xs">
          <p className="text-[#A89F91]">
            Peminjam:{' '}
            <strong className="text-[#F4E8C1]">{loan.requesterName}</strong> ({loan.requesterRole === 'guru' ? 'Guru' : 'Siswa'})
          </p>
          <p className="text-[#A89F91]">
            Grimoire: <strong className="text-[#D4AF37]">{loan.bookTitle}</strong> ({loan.quantity} Eksemplar)
          </p>
          {loan.className && (
            <p className="text-[#A89F91]">
              Kelas / Keperluan: <span className="text-[#F4E8C1]">{loan.className}</span>
            </p>
          )}
        </div>

        <div>
          <label className="block text-xs font-cinzel text-[#D4AF37] mb-2 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
            <span>ALASAN PENOLAKAN (AKAN DITAMPILKAN KEPADA PEMINJAM):</span>
          </label>
          <textarea
            rows={3}
            value={reason}
            onChange={(e) => onReasonChange(e.target.value)}
            placeholder="Contoh: Stok buku fisik sedang dialokasikan untuk ujian praktikum, atau buku sedang dalam pemeliharaan jilid..."
            className="w-full p-3 rounded-xl text-xs bg-[#12100E] border border-rose-500/40 text-[#F4E8C1] placeholder-[#A89F91]/50 focus:outline-none focus:border-rose-400"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs text-[#A89F91] hover:text-[#F4E8C1] transition-colors"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-5 py-2.5 rounded-xl font-cinzel font-bold text-xs bg-rose-600 hover:bg-rose-500 text-white transition-colors flex items-center gap-1.5 shadow-lg"
          >
            <XCircle className="w-4 h-4" />
            <span>Konfirmasi Tolak Pinjaman</span>
          </button>
        </div>
      </div>
    </div>
  );
}
