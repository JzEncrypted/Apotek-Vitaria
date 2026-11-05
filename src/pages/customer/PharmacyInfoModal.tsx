import React from 'react';
import { usePharmacy } from '../../context/PharmacyContext';
import { FAIcon } from '../../components/common/FAIcon';
import { Button } from '../../components/common/Button';

interface PharmacyInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PharmacyInfoModal: React.FC<PharmacyInfoModalProps> = ({
  isOpen,
  onClose
}) => {
  const { pharmacyInfo } = usePharmacy();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex flex-col justify-end sm:justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative z-10 w-full max-w-lg mx-auto bg-white rounded-t-[32px] sm:rounded-3xl shadow-2xl border border-[#E7EBE4] overflow-hidden max-h-[90vh] flex flex-col animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#E7EBE4] flex items-center justify-between sticky top-0 bg-white z-20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white border border-[#E7EBE4] overflow-hidden shadow-soft-sm shrink-0">
              <img src="/vitaria.jpg" alt={pharmacyInfo.name} className="w-full h-full object-cover" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-[#26382B]">
                {pharmacyInfo.name}
              </h3>
              <p className="text-[11px] text-[#778477]">
                Informasi Resmi & Layanan Konsultasi
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#F0F5ED] hover:bg-[#E6EEE3] text-[#778477] flex items-center justify-center transition-colors"
            aria-label="Tutup"
          >
            <FAIcon name="close" className="text-sm" />
          </button>
        </div>

        {/* Content Scroll Area */}
        <div className="p-5 space-y-5 overflow-y-auto">
          {/* Pharmacy Short Description */}
          <div className="bg-[#F7F9F5] rounded-2xl p-4 border border-[#E7EBE4]">
            <p className="text-xs text-[#26382B] leading-relaxed">
              {pharmacyInfo.description}
            </p>
          </div>

          {/* Operational Hours */}
          <div className="bg-[#E6EEE3]/60 rounded-2xl p-4 border border-[#84A282]/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#84A282] text-white flex items-center justify-center text-xs">
                <FAIcon name="clock" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-[#587A58] uppercase">
                  Jam Operasional Apotek
                </span>
                <p className="text-xs font-bold text-[#26382B] mt-0.5">
                  Jam Operasional: {pharmacyInfo.openingHours}
                </p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-[#4E9B69] text-white text-[10px] font-bold">
              Buka
            </span>
          </div>

          {/* Pharmacist in Charge */}
          <div className="p-4 rounded-2xl border border-[#E7EBE4] space-y-1.5">
            <span className="text-[11px] font-bold text-[#778477] uppercase tracking-wider block">
              Apoteker Penanggung Jawab
            </span>
            <div className="flex items-center gap-3 pt-1">
              <div className="w-10 h-10 rounded-2xl bg-[#F0F5ED] text-[#587A58] flex items-center justify-center text-base">
                <FAIcon name="doctor" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#26382B]">
                  Apoteker Penanggung Jawab (APJ): {pharmacyInfo.pharmacistName} ({pharmacyInfo.sipApoteker})
                </h4>
                <p className="text-[10px] text-[#778477] mt-0.5 font-mono">{pharmacyInfo.siaApotek}</p>
              </div>
            </div>
          </div>

          {/* WhatsApp Direct Link */}
          <div className="p-4 rounded-2xl border border-emerald-200 bg-emerald-50/50 space-y-1.5">
            <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
              Kontak WhatsApp Resmi
            </span>
            <p className="text-xs text-[#26382B]">
              <span className="font-bold">Nomor WhatsApp:</span>{' '}
              <span className="font-mono">{pharmacyInfo.whatsapp}</span>{' '}
              <span>(Tautan langsung{' '}
                <a
                  href={`https://wa.me/62${pharmacyInfo.whatsapp.replace(/^0/, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-emerald-700 font-bold underline hover:text-emerald-900"
                >
                  https://wa.me/62{pharmacyInfo.whatsapp.replace(/^0/, '')}
                </a>
              )</span>
            </p>
          </div>

          {/* Location and Address */}
          <div className="p-4 rounded-2xl border border-[#E7EBE4] space-y-2">
            <span className="text-[11px] font-bold text-[#778477] uppercase tracking-wider block">
              Alamat Lengkap
            </span>
            <p className="text-xs text-[#26382B] leading-relaxed">
              {pharmacyInfo.address}, Kelurahan {pharmacyInfo.village}, Kecamatan {pharmacyInfo.district}, {pharmacyInfo.city}, {pharmacyInfo.province} {pharmacyInfo.postalCode}
            </p>
          </div>

          {/* Direct CTA Buttons */}
          <div className="grid grid-cols-2 gap-2.5 pt-2">
            <a
              href={`https://wa.me/62${pharmacyInfo.whatsapp.replace(/^0/, '')}?text=Halo%20Apotek%20Vitaria,%20saya%20ingin%20konsultasi%20mengenai%20obat`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-[#4E9B69] hover:bg-[#43875a] text-white text-xs font-bold shadow-soft btn-press transition-colors"
            >
              <FAIcon name="phone" className="text-xs" />
              <span>Chat WhatsApp</span>
            </a>

            <a
              href={`tel:${pharmacyInfo.phone}`}
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-[#F0F5ED] hover:bg-[#E6EEE3] text-[#26382B] text-xs font-bold border border-[#E7EBE4] btn-press transition-colors"
            >
              <FAIcon name="phone" className="text-xs text-[#84A282]" />
              <span>Telepon Apotek</span>
            </a>
          </div>

          <a
            href={pharmacyInfo.mapsUrl}
            target="_blank"
            rel="noreferrer"
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl border border-[#E7EBE4] hover:bg-[#F7F9F5] text-[#587A58] text-xs font-semibold btn-press transition-colors block text-center"
          >
            <FAIcon name="location" className="text-xs" />
            <span>Petunjuk Arah di Google Maps</span>
          </a>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#E7EBE4] bg-[#F7F9F5]">
          <Button variant="outline" size="sm" fullWidth onClick={onClose}>
            Tutup
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PharmacyInfoModal;
