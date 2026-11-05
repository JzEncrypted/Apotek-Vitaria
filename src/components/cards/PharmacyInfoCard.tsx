import React from 'react';
import { PharmacyInfo } from '../../types';
import { FAIcon } from '../common/FAIcon';

interface PharmacyInfoCardProps {
  info: PharmacyInfo;
  onViewDetails: () => void;
}

export const PharmacyInfoCard: React.FC<PharmacyInfoCardProps> = ({
  info,
  onViewDetails
}) => {
  const whatsappUrl = `https://wa.me/62${info.whatsapp.replace(/^0/, '')}`;

  return (
    <div className="bg-white rounded-3xl p-4 sm:p-5 border border-[#E7EBE4] shadow-soft-sm transition-all duration-200 hover:border-[#84A282]/50 hover:shadow-soft space-y-3.5">
      {/* Header Info */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#E6EEE3] text-[#587A58] flex items-center justify-center text-lg shrink-0 border border-[#84A282]/20 overflow-hidden shadow-xs">
            <img src="/vitaria.jpg" alt={info.name} className="w-full h-full object-cover" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-extrabold text-[#26382B] text-sm sm:text-base">
                {info.name}
              </h4>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#4E9B69]/10 text-[#4E9B69] text-[10px] font-bold border border-[#4E9B69]/20">
                <span className="w-1.5 h-1.5 rounded-full bg-[#4E9B69] animate-pulse" />
                <span>Buka</span>
              </span>
            </div>
            <p className="text-xs text-[#526352] mt-0.5 leading-snug">
              {info.address}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onViewDetails}
          className="w-8 h-8 rounded-full bg-[#F0F5ED] hover:bg-[#84A282] text-[#778477] hover:text-white flex items-center justify-center text-xs transition-colors shrink-0"
          title="Lihat Detail Lengkap"
        >
          <FAIcon name="chevronRight" />
        </button>
      </div>

      {/* 3 Explicit Info Rows Requested by User */}
      <div className="p-3 bg-[#F8FAF7] rounded-2xl border border-[#E3ECE1] space-y-2 text-xs">
        {/* 1. Jam Operasional */}
        <div className="flex items-start gap-2">
          <div className="w-5 h-5 rounded-md bg-[#E6EEE3] text-[#405A42] flex items-center justify-center shrink-0 mt-0.5">
            <FAIcon name="clock" className="text-[10px]" />
          </div>
          <div className="leading-snug">
            <span className="font-bold text-[#1F2E23]">Jam Operasional: </span>
            <span className="text-[#3F5442] font-medium">{info.openingHours}</span>
          </div>
        </div>

        {/* 2. Apoteker Penanggung Jawab (APJ) */}
        <div className="flex items-start gap-2">
          <div className="w-5 h-5 rounded-md bg-[#E6EEE3] text-[#405A42] flex items-center justify-center shrink-0 mt-0.5">
            <FAIcon name="doctor" className="text-[10px]" />
          </div>
          <div className="leading-snug">
            <span className="font-bold text-[#1F2E23]">Apoteker Penanggung Jawab (APJ): </span>
            <span className="text-[#3F5442] font-medium">
              {info.pharmacistName} ({info.sipApoteker})
            </span>
          </div>
        </div>

        {/* 3. Nomor WhatsApp */}
        <div className="flex items-start gap-2">
          <div className="w-5 h-5 rounded-md bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5">
            <FAIcon name="phone" className="text-[10px]" />
          </div>
          <div className="leading-snug">
            <span className="font-bold text-[#1F2E23]">Nomor WhatsApp: </span>
            <span className="text-[#3F5442] font-mono font-medium">{info.whatsapp} </span>
            <span className="text-[#556956]">
              (Tautan langsung{' '}
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="text-emerald-700 hover:text-emerald-900 font-bold underline break-all"
              >
                {whatsappUrl}
              </a>
              )
            </span>
          </div>
        </div>
      </div>

      {/* Direct Contact Button */}
      <div className="flex items-center gap-2 pt-0.5">
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noreferrer"
          className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-soft transition-colors"
        >
          <FAIcon name="phone" className="text-xs" />
          <span>Chat WhatsApp Resmi</span>
        </a>
        <button
          type="button"
          onClick={onViewDetails}
          className="px-3 py-2 rounded-xl bg-[#F0F5ED] hover:bg-[#E4ECE1] text-[#354D38] text-xs font-bold transition-colors"
        >
          Detail Apotek
        </button>
      </div>
    </div>
  );
};

export default PharmacyInfoCard;
