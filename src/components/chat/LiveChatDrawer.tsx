import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useChat } from '../../context/ChatContext';
import { FAIcon } from '../common/FAIcon';
import { VoiceNotePlayer } from './VoiceNotePlayer';
import { VoiceNoteRecorder } from './VoiceNoteRecorder';

interface LiveChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  staffMode?: boolean;
  customerName?: string;
  customerAvatar?: string;
}

export const LiveChatDrawer: React.FC<LiveChatDrawerProps> = ({
  isOpen,
  onClose,
  staffMode = false,
  customerName = 'Budi Santoso',
  customerAvatar
}) => {
  const { messages, pharmacist, isTyping, sendMessage, markAsRead, clearChat } = useChat();
  const [inputText, setInputText] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [activeLightboxImage, setActiveLightboxImage] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const textInputRef = useRef<HTMLInputElement | null>(null);

  // Mark all as read when opening chat
  useEffect(() => {
    if (isOpen) {
      markAsRead();
      // Lock body scroll
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Scroll to bottom on new message or typing indicator
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping, isOpen]);

  if (!isOpen) return null;

  const handleSendTextMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() && !selectedImage) return;

    sendMessage({
      text: inputText.trim() || undefined,
      imageUrl: selectedImage || undefined,
      sender: staffMode ? 'pharmacist' : 'customer'
    });

    setInputText('');
    setSelectedImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleVoiceNoteRecorded = (audioUrl: string, duration: number) => {
    sendMessage({
      audioUrl,
      audioDuration: duration,
      sender: staffMode ? 'pharmacist' : 'customer'
    });
    setIsRecordingAudio(false);
  };

  const handleSuggestionClick = (text: string) => {
    sendMessage({
      text,
      sender: staffMode ? 'pharmacist' : 'customer'
    });
  };

  const renderStatusCheck = (status: 'sent' | 'delivered' | 'read') => {
    if (status === 'sent') {
      return (
        <span title="Terkirim" className="inline-flex text-white/70 ml-1">
          <FAIcon name="check" className="text-[10px]" />
        </span>
      );
    }
    if (status === 'delivered') {
      return (
        <span title="Diterima" className="inline-flex text-white/70 ml-1">
          <FAIcon name="checkDouble" className="text-[10px]" />
        </span>
      );
    }
    return (
      <span title="Telah dibaca oleh Apoteker" className="inline-flex text-emerald-300 ml-1">
        <FAIcon name="checkDouble" className="text-[10px]" />
      </span>
    );
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm animate-fadeIn">
      {/* Lightbox Modal for Photo Inspection */}
      {activeLightboxImage && (
        <div
          className="fixed inset-0 z-[60] bg-black/90 flex flex-col items-center justify-center p-4 backdrop-blur-md animate-fadeIn"
          onClick={() => setActiveLightboxImage(null)}
        >
          <div className="w-full max-w-lg flex items-center justify-between pb-3 text-white">
            <span className="text-sm font-medium flex items-center gap-2">
              <FAIcon name="image" className="text-emerald-400" />
              Foto Resep / Dokumen Obat
            </span>
            <button
              type="button"
              onClick={() => setActiveLightboxImage(null)}
              className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
              aria-label="Tutup"
            >
              <FAIcon name="close" className="text-sm" />
            </button>
          </div>
          <div className="max-w-md max-h-[80vh] overflow-hidden rounded-2xl border border-white/20 shadow-2xl">
            <img
              src={activeLightboxImage}
              alt="Foto Resep Penuh"
              className="max-h-[80vh] w-auto object-contain select-none"
            />
          </div>
        </div>
      )}

      {/* Main Drawer Container (Max-width 480px on desktop, full width on mobile) */}
      <div className="w-full max-w-lg h-full bg-[#F7F9F5] flex flex-col shadow-2xl animate-slideInRight">
        {/* Top Header */}
        <header className="bg-white border-b border-[#E5EAE3] px-4 py-3 flex items-center justify-between shrink-0 shadow-sm z-10">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-full hover:bg-[#F0F4EE] flex items-center justify-center text-[#526352] transition-colors"
              aria-label="Kembali"
            >
              <FAIcon name="arrowLeft" className="text-base" />
            </button>

            {/* Avatar & Online Status */}
            <div className="relative">
              {staffMode ? (
                customerAvatar ? (
                  <img
                    src={customerAvatar}
                    alt={customerName}
                    className="w-10 h-10 rounded-full object-cover border border-[#84A282]/30 shadow-sm"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-[#E6EEE3] text-[#587A58] flex items-center justify-center font-bold text-sm border border-[#84A282]/30 shadow-sm">
                    <FAIcon name="user" />
                  </div>
                )
              ) : (
                <img
                  src={pharmacist.avatarUrl}
                  alt={pharmacist.name}
                  className="w-10 h-10 rounded-full object-cover border border-[#84A282]/30 shadow-sm"
                />
              )}
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full shadow-sm" />
            </div>

            <div>
              <h2 className="text-sm font-bold text-[#1F2E23] leading-tight flex items-center gap-1.5">
                {staffMode ? customerName : pharmacist.name}
              </h2>
              <p className="text-[11px] text-[#587A58] font-medium flex items-center gap-1">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {staffMode ? 'Pasien Terverifikasi • Online' : `Online • ${pharmacist.sipa}`}
              </p>
            </div>
          </div>

          {/* Action Menu / Reset */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setShowClearConfirm(true)}
              className="w-8 h-8 rounded-full hover:bg-rose-50 text-[#778477] hover:text-rose-600 flex items-center justify-center transition-colors"
              title="Bersihkan Percakapan"
              aria-label="Bersihkan Percakapan"
            >
              <FAIcon name="trash" className="text-xs" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full hover:bg-[#F0F4EE] text-[#778477] flex items-center justify-center transition-colors"
              title="Tutup Chat"
              aria-label="Tutup Chat"
            >
              <FAIcon name="close" className="text-sm" />
            </button>
          </div>
        </header>

        {/* Clear Chat Confirmation Modal */}
        {showClearConfirm && (
          <div className="bg-rose-50 border-b border-rose-200 px-4 py-2.5 flex items-center justify-between text-xs text-rose-800 animate-fadeIn">
            <span>Hapus semua riwayat konsultasi ini?</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  clearChat();
                  setShowClearConfirm(false);
                }}
                className="px-2.5 py-1 bg-rose-600 text-white rounded-lg font-medium text-xs hover:bg-rose-700 transition-colors"
              >
                Hapus
              </button>
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="px-2 py-1 text-stone-600 hover:text-stone-800 transition-colors"
              >
                Batal
              </button>
            </div>
          </div>
        )}

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-[#F7F9F5]">
          {/* Pharmacy Verification & Disclaimer Box */}
          <div className="bg-[#EBF1E8] border border-[#D5E1D1] rounded-2xl p-3.5 text-center shadow-xs">
            <div className="w-8 h-8 mx-auto mb-2 bg-[#84A282] text-white rounded-full flex items-center justify-center">
              <FAIcon name="shield" className="text-xs" />
            </div>
            <p className="text-xs font-semibold text-[#293B2D]">
              Layanan Konsultasi Farmasi Apotek Vitaria
            </p>
            <p className="text-[11px] text-[#576A5A] mt-1 leading-relaxed">
              Seluruh konsultasi dilayani langsung oleh Tenaga Kefarmasian berlisensi resmi. Informasi bersifat rahasia dan aman.
            </p>
          </div>

          {/* Quick Suggestions Pills */}
          <div className="pt-1">
            <p className="text-[10px] font-semibold tracking-wider uppercase text-[#778477] mb-2 px-1 flex items-center gap-1.5">
              <FAIcon name="chat" className="text-[10px] text-[#84A282]" />
              {staffMode ? 'Template Jawaban Apoteker' : 'Pertanyaan Cepat'}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {(staffMode
                ? [
                    { label: 'Dosis: 1 tablet sesudah makan', icon: 'pill' as const },
                    { label: 'Resep terverifikasi, obat disiapkan', icon: 'check' as const },
                    { label: 'Obat siap diambil di apotek', icon: 'boxes' as const },
                    { label: 'Bisa pesan antar ke alamat hari ini', icon: 'clock' as const }
                  ]
                : [
                    { label: 'Tanya dosis obat', icon: 'pill' as const },
                    { label: 'Efek samping obat', icon: 'alert' as const },
                    { label: 'Kirim resep dokter', icon: 'document' as const },
                    { label: 'Bisa pesan antar hari ini?', icon: 'clock' as const }
                  ]
              ).map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSuggestionClick(item.label)}
                  className="px-3 py-1.5 bg-white border border-[#D9E3D6] hover:border-[#84A282] hover:bg-[#F2F7F0] rounded-full text-[11px] font-medium text-[#384C3C] shadow-2xs transition-all flex items-center gap-1.5 active:scale-95"
                >
                  <FAIcon name={item.icon} className="text-[10px] text-[#84A282]" />
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Messages List */}
          {messages.map((msg) => {
            const isMe = staffMode ? msg.sender === 'pharmacist' : msg.sender === 'customer';

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} animate-fadeIn`}
              >
                {/* Bubble Container */}
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 shadow-sm text-sm ${
                    isMe
                      ? 'bg-[#84A282] text-white rounded-br-xs'
                      : 'bg-white text-[#203024] border border-[#E1E8DE] rounded-bl-xs'
                  }`}
                >
                  {/* Sender Name for other party */}
                  {!isMe && (
                    <div className="text-[11px] font-bold text-[#4B6B4A] mb-1 flex items-center gap-1">
                      <FAIcon name={staffMode ? 'user' : 'doctor'} className="text-[10px]" />
                      <span>{msg.senderName}</span>
                    </div>
                  )}

                  {/* Image Attachment (Prescription / Medicine Photo) */}
                  {msg.imageUrl && (
                    <div className="mb-2">
                      <div
                        onClick={() => setActiveLightboxImage(msg.imageUrl || null)}
                        className="relative group rounded-xl overflow-hidden cursor-pointer border border-black/10 bg-black/5 hover:opacity-95 transition-all"
                      >
                        <img
                          src={msg.imageUrl}
                          alt="Lampiran Resep"
                          className="max-h-56 w-auto object-cover rounded-xl"
                        />
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs gap-1 font-medium">
                          <FAIcon name="eye" className="text-xs" />
                          <span>Perbesar</span>
                        </div>
                      </div>
                      {msg.imageCaption && (
                        <p className="mt-1 text-xs opacity-90">{msg.imageCaption}</p>
                      )}
                    </div>
                  )}

                  {/* Audio Voice Note Player */}
                  {msg.audioUrl && (
                    <div className="my-1">
                      <VoiceNotePlayer
                        audioUrl={msg.audioUrl}
                        duration={msg.audioDuration}
                        isOwnMessage={isMe}
                      />
                    </div>
                  )}

                  {/* Text Message */}
                  {msg.text && (
                    <p className="leading-relaxed whitespace-pre-wrap break-words">{msg.text}</p>
                  )}

                  {/* Timestamp & Read Receipts */}
                  <div
                    className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${
                      isMe ? 'text-white/80' : 'text-[#778477]'
                    }`}
                  >
                    <span>{msg.timestamp}</span>
                    {isMe && renderStatusCheck(msg.status)}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Typing Indicator Bubble */}
          {!staffMode && isTyping && (
            <div className="flex items-center gap-2 animate-fadeIn">
              <img
                src={pharmacist.avatarUrl}
                alt="Apoteker"
                className="w-7 h-7 rounded-full object-cover border border-[#84A282]/30"
              />
              <div className="bg-white border border-[#E1E8DE] px-3.5 py-2.5 rounded-2xl rounded-bl-xs shadow-sm flex items-center gap-2">
                <span className="text-xs text-[#526352] font-medium">
                  Apoteker sedang mengetik
                </span>
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#84A282] animate-bounce" />
                  <span
                    className="w-1.5 h-1.5 rounded-full bg-[#84A282] animate-bounce"
                    style={{ animationDelay: '150ms' }}
                  />
                  <span
                    className="w-1.5 h-1.5 rounded-full bg-[#84A282] animate-bounce"
                    style={{ animationDelay: '300ms' }}
                  />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Bottom Input Area */}
        <div className="bg-white border-t border-[#E5EAE3] p-3 shrink-0">
          {/* Selected Image Thumbnail Preview before sending */}
          {selectedImage && (
            <div className="mb-2 relative inline-block animate-fadeIn">
              <div className="relative rounded-xl overflow-hidden border-2 border-[#84A282] w-20 h-20 shadow-md">
                <img
                  src={selectedImage}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedImage(null);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                className="absolute -top-2 -right-2 w-6 h-6 bg-rose-500 hover:bg-rose-600 text-white rounded-full flex items-center justify-center shadow-md transition-colors"
                title="Hapus foto"
                aria-label="Hapus foto"
              >
                <FAIcon name="close" className="text-[10px]" />
              </button>
            </div>
          )}

          {/* Conditional Voice Note Recorder vs Text Input */}
          {isRecordingAudio ? (
            <VoiceNoteRecorder
              onRecordingComplete={handleVoiceNoteRecorded}
              onCancel={() => setIsRecordingAudio(false)}
            />
          ) : (
            <form onSubmit={handleSendTextMessage} className="flex items-center gap-2">
              {/* Attachment File Input (Hidden) */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
                id="chat-image-upload"
              />

              {/* Photo Attachment Button */}
              <label
                htmlFor="chat-image-upload"
                className="w-10 h-10 rounded-xl bg-[#F0F4EE] hover:bg-[#E2EBE0] text-[#526352] flex items-center justify-center cursor-pointer transition-colors shrink-0"
                title="Kirim Foto / Resep"
                aria-label="Kirim Foto / Resep"
              >
                <FAIcon name="image" className="text-base" />
              </label>

              {/* Text Input */}
              <div className="flex-1 relative">
                <input
                  ref={textInputRef}
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Ketik pertanyaan atau konsultasi..."
                  className="w-full bg-[#F3F6F1] border border-[#CBD5C8] focus:border-[#84A282] focus:ring-2 focus:ring-[#84A282]/20 rounded-xl px-3.5 py-2.5 text-xs text-[#1F2E23] placeholder-[#8A978A] outline-none transition-all"
                />
              </div>

              {/* Microphone / Record Audio Button (if no text/image) */}
              {!inputText.trim() && !selectedImage ? (
                <button
                  type="button"
                  onClick={() => setIsRecordingAudio(true)}
                  className="w-10 h-10 rounded-xl bg-[#84A282] hover:bg-[#688C66] text-white flex items-center justify-center transition-all shadow-sm active:scale-95 shrink-0"
                  title="Perekam Suara (Voice Note)"
                  aria-label="Perekam Suara (Voice Note)"
                >
                  <FAIcon name="microphone" className="text-sm" />
                </button>
              ) : (
                /* Send Button */
                <button
                  type="submit"
                  className="w-10 h-10 rounded-xl bg-[#84A282] hover:bg-[#688C66] text-white flex items-center justify-center transition-all shadow-sm active:scale-95 shrink-0"
                  title="Kirim Pesan"
                  aria-label="Kirim Pesan"
                >
                  <FAIcon name="paperPlane" className="text-sm" />
                </button>
              )}
            </form>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
