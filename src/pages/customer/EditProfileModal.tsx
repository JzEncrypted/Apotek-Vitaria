import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { FAIcon } from '../../components/common/FAIcon';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { AvatarCanvasCropper } from '../../components/profile/AvatarCanvasCropper';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, updateProfile } = useAuth();
  const { showToast } = useToast();

  const [name, setName] = useState(currentUser?.name || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [avatarPreview, setAvatarPreview] = useState<string>(currentUser?.avatarUrl || '');

  // Raw file uploaded for cropping
  const [rawImageSrc, setRawImageSrc] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Swipe / Drag to slide down state
  const [dragOffset, setDragOffset] = useState(0);
  const startYRef = useRef<number | null>(null);
  const isDraggingRef = useRef(false);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setName(currentUser?.name || '');
      setPhone(currentUser?.phone || '');
      setEmail(currentUser?.email || '');
      setAvatarPreview(currentUser?.avatarUrl || '');
      setRawImageSrc(null);
      setDragOffset(0);

      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handleKeyDown);

      return () => {
        document.body.style.overflow = originalOverflow;
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isOpen, currentUser, onClose]);

  if (!isOpen) return null;

  // Touch drag-to-dismiss handlers on the drag handle
  const handleTouchStart = (e: React.TouchEvent) => {
    startYRef.current = e.touches[0].clientY;
    isDraggingRef.current = true;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDraggingRef.current || startYRef.current === null) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - startYRef.current;
    if (diff > 0) {
      setDragOffset(diff);
    }
  };

  const handleTouchEnd = () => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    if (dragOffset > 90) {
      onClose();
    } else {
      setDragOffset(0);
    }
    startYRef.current = null;
  };

  // Image Selection Handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Mohon pilih file gambar yang valid (JPG, PNG, atau WebP).', 'danger');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      showToast('Ukuran gambar maksimal adalah 10 MB.', 'danger');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setRawImageSrc(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
    // Reset file input so same file can be picked again if desired
    e.target.value = '';
  };

  // Cropper callbacks
  const handleCropComplete = (croppedBase64: string) => {
    setAvatarPreview(croppedBase64);
    setRawImageSrc(null);
    showToast('Foto profil berhasil dipotong. Klik "Simpan Perubahan" untuk menerapkan.', 'success');
  };

  const handleCropCancel = () => {
    setRawImageSrc(null);
  };

  // Submit profile changes
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Nama lengkap tidak boleh kosong.', 'danger');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await updateProfile({
        name: name.trim(),
        phone: phone.trim(),
        avatarUrl: avatarPreview
      });

      if (res && res.success) {
        showToast('Profil Anda berhasil diperbarui di database.', 'success');
        onClose();
      } else {
        showToast(res?.message || 'Gagal menyimpan profil.', 'danger');
      }
    } catch {
      showToast('Terjadi kendala saat memperbarui profil.', 'danger');
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center animate-fadeIn select-none">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Slideable Bottom Sheet Container */}
      <div
        style={{
          transform: `translateY(${dragOffset}px)`,
          transition: isDraggingRef.current ? 'none' : 'transform 0.25s cubic-bezier(0.2, 0.9, 0.3, 1)'
        }}
        className="relative bg-white w-full max-w-md max-h-[90vh] rounded-t-[36px] sm:rounded-3xl shadow-2xl border-t sm:border border-[#E7EBE4] flex flex-col overflow-hidden z-10"
      >
        {/* Top Drag Handle Bar (Swipe down to close) */}
        <div
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="pt-3 pb-2 flex flex-col items-center justify-center cursor-grab active:cursor-grabbing hover:bg-stone-50/50 transition-colors"
        >
          <div className="w-12 h-1.5 rounded-full bg-stone-300" />
          <span className="text-[10px] text-stone-400 font-medium mt-1">Tarik ke bawah untuk menutup</span>
        </div>

        {/* Modal Header */}
        <div className="px-5 py-3 border-b border-[#E7EBE4] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[#E6EEE3] text-[#587A58] flex items-center justify-center text-sm font-bold border border-[#84A282]/30 shadow-xs">
              <FAIcon name="edit" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-[#26382B]">Ubah Data Profil</h3>
              <p className="text-[11px] text-[#778477]">Perbarui informasi identitas dan foto akun Anda</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#F0F5ED] hover:bg-stone-200 text-[#587A58] flex items-center justify-center transition-colors"
            title="Tutup"
          >
            <FAIcon name="close" className="text-xs" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1 overscroll-contain">
          {rawImageSrc ? (
            /* Interactive Canvas Cropper Mode */
            <AvatarCanvasCropper
              imageSrc={rawImageSrc}
              onCropComplete={handleCropComplete}
              onCancel={handleCropCancel}
            />
          ) : (
            /* Standard Profile Edit Form */
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Avatar Uploader Section */}
              <div className="flex flex-col items-center space-y-2 py-1">
                <div className="relative group">
                  <div className="w-24 h-24 rounded-full overflow-hidden border-3 border-[#84A282] shadow-soft bg-[#E6EEE3] flex items-center justify-center">
                    {avatarPreview ? (
                      <img
                        src={avatarPreview}
                        alt="Foto Profil"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <FAIcon name="user" className="text-3xl text-[#587A58]" />
                    )}
                  </div>

                  {/* Camera overlay button */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[#587A58] hover:bg-[#466346] active:scale-95 text-white flex items-center justify-center shadow-md border-2 border-white transition-all"
                    title="Ganti Foto Profil"
                  >
                    <FAIcon name="camera" className="text-xs" />
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3.5 py-1.5 rounded-xl bg-[#F0F5ED] hover:bg-[#E6EEE3] active:bg-[#DCE7D8] text-[#587A58] text-xs font-bold transition-all border border-[#84A282]/30 flex items-center gap-1.5 shadow-xs"
                  >
                    <FAIcon name="image" className="text-xs" />
                    <span>Upload & Crop Foto Baru</span>
                  </button>

                  {avatarPreview && avatarPreview !== currentUser?.avatarUrl && (
                    <button
                      type="button"
                      onClick={() => setAvatarPreview(currentUser?.avatarUrl || '')}
                      className="px-2.5 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-600 text-xs font-semibold transition-all"
                      title="Kembalikan ke foto sebelumnya"
                    >
                      Batal Ganti Foto
                    </button>
                  )}
                </div>
                <p className="text-[10px] text-stone-400">
                  Dukung format JPG, PNG, atau WebP dengan fitur potong/crop kanvas interaktif
                </p>
              </div>

              {/* Form Input Fields */}
              <div className="space-y-3 pt-1">
                <Input
                  label="Nama Lengkap *"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Masukkan nama lengkap"
                  required
                />

                <Input
                  label="Nomor WhatsApp / Telepon *"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Contoh: 087819622174"
                  required
                />

                <Input
                  label="Alamat Email Akun"
                  type="email"
                  value={email}
                  disabled
                  helperText="Alamat email terdaftar tersinkron dengan akun autentikasi Anda."
                />
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2.5 pt-3 border-t border-[#E7EBE4]">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="border-stone-200 text-stone-600 hover:bg-stone-100"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  icon="check"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default EditProfileModal;
