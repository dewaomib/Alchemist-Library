import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Check,
  Copy,
  MessageCircle,
  Phone,
  Send,
  UserRound,
  Users,
  X
} from 'lucide-react';
import {
  buildReminderMessage,
  buildWhatsAppUrl,
  formatDateID,
  getContactOptions,
  getLoanTiming
} from '../utils/loanUtils';

export default function WhatsAppReminderModal({
  isOpen,
  onClose,
  loan,
  book,
  member,
  onSent
}) {
  const contactOptions = useMemo(() => getContactOptions(loan, member), [loan, member]);
  const [recipientId, setRecipientId] = useState('student');
  const [message, setMessage] = useState('');
  const [feedback, setFeedback] = useState('');

  const timing = loan ? getLoanTiming(loan) : null;

  useEffect(() => {
    if (!isOpen || !loan) return;
    const first = contactOptions[0]?.id || 'student';
    setRecipientId(first);
    setFeedback('');
    setMessage('');
  }, [isOpen, loan?.id, contactOptions.length]);

  useEffect(() => {
    if (!isOpen || !loan) return;
    const recipient = contactOptions.find((option) => option.id === recipientId) || contactOptions[0];
    if (!recipient) return;
    setMessage(
      buildReminderMessage({
        loan,
        book,
        member,
        recipient: recipient.id
      })
    );
    setFeedback('');
  }, [isOpen, loan?.id, recipientId, book?.id, member?.id, contactOptions]);

  const selectedContact =
    contactOptions.find((option) => option.id === recipientId) || contactOptions[0];

  if (!isOpen || !loan) return null;

  const handleOpenWhatsApp = () => {
    if (!selectedContact?.phone) {
      setFeedback('Nomor WhatsApp penerima belum tersedia. Pilih penerima lain atau salin pesan.');
      return;
    }
    const url = buildWhatsAppUrl(selectedContact.phone, message);
    if (!url) {
      setFeedback('Nomor WhatsApp tidak valid.');
      return;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
    setFeedback('WhatsApp dibuka di tab baru. Tekan kirim di aplikasi WhatsApp.');
    onSent?.({
      loan,
      recipient: selectedContact,
      message
    });
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setFeedback('Template pesan berhasil disalin ke clipboard.');
    } catch {
      setFeedback('Browser memblokir clipboard. Silakan salin teks secara manual.');
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Kirim Pengingat WhatsApp"
      className="fixed inset-0 z-[68] bg-black/85 backdrop-blur-md flex items-start sm:items-center justify-center p-3 sm:p-6 overflow-y-auto"
    >
      <div
        className="w-full max-w-2xl rounded-2xl border shadow-2xl my-4 overflow-hidden"
        style={{
          backgroundColor: 'var(--theme-surface)',
          borderColor: '#25D366',
          boxShadow: 'var(--theme-shadow-modal)'
        }}
      >
        <header
          className="px-4 sm:px-6 py-4 border-b flex items-start justify-between gap-3"
          style={{
            borderColor: 'var(--theme-border)',
            backgroundColor: 'var(--theme-surface-alt)'
          }}
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-[#25D366]/15 border border-[#25D366]/45 text-[#25D366] flex items-center justify-center shrink-0">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-cinzel font-bold text-lg text-[#F4E8C1]">
                Kirim Pengingat WhatsApp
              </h2>
              <p className="text-[11px] sm:text-xs text-[#A89F91] mt-0.5">
                Template otomatis berdasarkan status jatuh tempo. Anda dapat mengedit pesan sebelum mengirim.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg bg-black/30 border border-white/10 text-[#A89F91] hover:text-[#F4E8C1] hover:border-[#25D366]/50"
            aria-label="Tutup"
          >
            <X className="w-4 h-4" />
          </button>
        </header>

        <div className="p-4 sm:p-6 space-y-4">
          <div className="p-3 rounded-xl bg-black/30 border border-white/10 space-y-1.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-cinzel font-bold text-sm text-[#F4E8C1]">
                {book?.title || loan.bookTitle}
              </h3>
              {timing && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full border ${timing.badgeClass}`}>
                  {timing.label}
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-[#A89F91]">
              <span>
                Peminjam: <strong className="text-[#F4E8C1]">{loan.borrowerName}</strong>
              </span>
              <span>
                Kelas: <strong className="text-[#F4E8C1]">{loan.className || '-'}</strong>
              </span>
              <span>
                Jatuh tempo: <strong className="text-amber-300">{formatDateID(loan.dueDate)}</strong>
              </span>
            </div>
          </div>

          <div>
            <p className="text-[10px] font-cinzel text-[#D4AF37] mb-2">PILIH PENERIMA PESAN:</p>
            {contactOptions.length === 0 ? (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                Nomor WhatsApp siswa, wali, dan wali kelas belum tersedia. Perbarui data anggota atau salin pesan di bawah.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {contactOptions.map((option) => {
                  const isActive = recipientId === option.id;
                  const Icon = option.id === 'homeroom' ? Users : UserRound;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setRecipientId(option.id)}
                      className={`text-left p-2.5 rounded-xl border transition-all ${
                        isActive
                          ? 'bg-[#25D366]/12 border-[#25D366]/70'
                          : 'bg-black/25 border-white/10 hover:border-[#25D366]/35'
                      }`}
                    >
                      <span className="flex items-center gap-1.5 text-[10px] font-cinzel font-bold text-[#F4E8C1]">
                        <Icon className="w-3.5 h-3.5 text-[#25D366]" />
                        {option.label}
                        {isActive && <Check className="w-3 h-3 text-[#25D366] ml-auto" />}
                      </span>
                      <span className="block text-[10px] text-[#A89F91] truncate mt-0.5">
                        {option.name}
                      </span>
                      <span className="flex items-center gap-1 text-[9px] text-emerald-300 mt-0.5">
                        <Phone className="w-2.5 h-2.5" />
                        {option.description}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between gap-2 mb-1">
              <label className="text-[10px] font-cinzel text-[#D4AF37]">
                TEMPLATE PESAN (DAPAT DIEDIT):
              </label>
              <button
                type="button"
                onClick={handleCopy}
                className="text-[10px] text-[#A89F91] hover:text-[#F4E8C1] flex items-center gap-1"
              >
                <Copy className="w-3 h-3" />
                Salin pesan
              </button>
            </div>
            <textarea
              rows={10}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              className="w-full p-3 rounded-xl text-[11px] leading-relaxed bg-[#12100E] border border-[#25D366]/30 text-[#F4E8C1] focus:outline-none focus:border-[#25D366]/70"
            />
          </div>

          {feedback && (
            <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-[11px] text-emerald-300">
              {feedback}
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-1">
            <p className="text-[9px] text-[#A89F91] flex items-center gap-1.5">
              <Send className="w-3 h-3" />
              Tautan wa.me akan membuka aplikasi WhatsApp / WhatsApp Web.
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2.5 rounded-xl text-xs font-cinzel font-semibold bg-white/5 text-[#F4E8C1] border border-white/10 hover:border-white/25"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={handleOpenWhatsApp}
                disabled={!selectedContact?.phone}
                className={`px-4 py-2.5 rounded-xl text-xs font-cinzel font-bold flex items-center gap-1.5 transition-all ${
                  selectedContact?.phone
                    ? 'bg-[#25D366] text-[#0B1F12] hover:brightness-110'
                    : 'bg-white/10 text-[#A89F91] cursor-not-allowed'
                }`}
              >
                <MessageCircle className="w-4 h-4" />
                Buka WhatsApp
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
