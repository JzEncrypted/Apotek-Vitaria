import React, { useState } from 'react';
import { usePharmacy } from '../../context/PharmacyContext';
import { useChat } from '../../context/ChatContext';
import { FAIcon } from '../../components/common/FAIcon';
import { Badge } from '../../components/common/Badge';

interface CustomersProps {
  onOpenChatWithCustomer?: (customer: { name: string; avatarUrl?: string }) => void;
}

export const Customers: React.FC<CustomersProps> = ({ onOpenChatWithCustomer }) => {
  const { customers } = usePharmacy();
  const { unreadCount } = useChat();
  const [search, setSearch] = useState('');

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search) ||
      (c.email && c.email.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-5 space-y-5 pb-24 lg:pb-8">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="text-xs font-bold text-[#84A282] uppercase tracking-wider block">
            Direktori Pasien & Layanan Farmasi
          </span>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#26382B]">
            Data Pelanggan & Konsultasi
          </h2>
          <p className="text-xs text-[#778477] mt-0.5">
            Kelola verifikasi akun pelanggan dan hubungi langsung melalui saluran konsultasi realtime
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3.5 py-1.5 rounded-2xl bg-white border border-[#D5E1D2] text-[#405643] text-xs font-bold flex items-center gap-2 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{customers.length} Pasien Terdaftar</span>
          </div>
        </div>
      </header>

      {/* Realtime Consultation Quick Access Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-[#EAF2E7] via-white to-[#F2F7F0] border border-[#D7E4D3] p-4 shadow-soft-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-[#84A282] text-white flex items-center justify-center text-sm shadow-xs shrink-0">
            <FAIcon name="consultation" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs sm:text-sm font-bold text-[#1F2E23]">
                Ruang Live Chat Konsultasi Apoteker
              </h3>
              {unreadCount > 0 && (
                <span className="text-[10px] font-bold text-white bg-rose-500 px-2 py-0.5 rounded-full animate-bounce">
                  {unreadCount} pesan baru
                </span>
              )}
            </div>
            <p className="text-xs text-[#526352] mt-0.5">
              Tanggapi resep dokter, dosis obat, dan pesan suara dari pasien secara langsung
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() =>
            onOpenChatWithCustomer &&
            onOpenChatWithCustomer({
              name: 'Budi Santoso',
              avatarUrl: customers[0]?.avatarUrl
            })
          }
          className="px-4 py-2.5 bg-[#84A282] hover:bg-[#688C66] text-white text-xs font-bold rounded-2xl flex items-center gap-2 shadow-soft active:scale-95 transition-all shrink-0 cursor-pointer"
        >
          <FAIcon name="chat" className="text-xs" />
          <span>Buka Obrolan Pasien</span>
        </button>
      </div>

      {/* Privacy Guardrail Notice (PRD Section 6.5 & UU PDP) */}
      <div className="p-4 rounded-3xl bg-[#F0F5EE] border border-[#D5E1D2] flex items-start gap-3 shadow-2xs">
        <div className="w-8 h-8 rounded-xl bg-[#84A282] text-white flex items-center justify-center text-xs shrink-0 mt-0.5">
          <FAIcon name="shield" />
        </div>
        <div className="text-xs text-[#26382B] leading-relaxed">
          <strong className="font-bold text-[#4B6B4A] block mb-0.5">
            Kepatuhan Perlindungan Privasi Medis (UU PDP)
          </strong>
          Sesuai standar kerahasiaan farmasi, riwayat konsumsi pribadi pelanggan terenkripsi. Seluruh konsultasi ditangani secara etis dan profesional oleh Apoteker berlisensi.
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#778477] text-xs">
          <FAIcon name="search" />
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari nama, nomor telepon, atau email pelanggan..."
          className="w-full bg-white border border-[#E7EBE4] focus:border-[#84A282] focus:ring-2 focus:ring-[#84A282]/20 rounded-2xl pl-10 pr-4 py-3 text-xs text-[#26382B] placeholder-[#778477]/60 shadow-2xs outline-none transition-all"
        />
      </div>

      {/* Customer Modern Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {filtered.map((customer) => (
          <div
            key={customer.id}
            className="bg-white rounded-3xl p-5 border border-[#E7EBE4] shadow-soft-sm hover:border-[#84A282]/40 hover:shadow-soft transition-all flex flex-col justify-between"
          >
            <div>
              {/* Card Header: Customer ID & Status Badge */}
              <div className="flex items-center justify-between pb-3 border-b border-[#EAEFE8]">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-lg bg-[#F0F5ED] text-[#4C6C4B] font-bold">
                  {customer.id}
                </span>
                <Badge
                  variant={customer.status === 'active' ? 'active' : 'paused'}
                  label={customer.status === 'active' ? 'Akun Aktif' : 'Ditangguhkan'}
                  showIcon={false}
                />
              </div>

              {/* Customer Avatar & Bio */}
              <div className="flex items-center gap-3.5 mt-3.5">
                <div className="relative w-12 h-12 min-w-[48px] min-h-[48px] max-w-[48px] max-h-[48px] aspect-square rounded-2xl bg-[#E6EEE3] text-[#587A58] flex items-center justify-center font-bold text-sm border border-[#84A282]/20 overflow-hidden shrink-0 shadow-2xs">
                  {customer.avatarUrl ? (
                    <img
                      src={customer.avatarUrl}
                      alt={customer.name}
                      className="w-full h-full object-cover aspect-square block"
                    />
                  ) : (
                    <FAIcon name="user" className="text-base" />
                  )}
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full z-10" />
                </div>

                <div className="min-w-0">
                  <h4 className="font-extrabold text-sm text-[#26382B] truncate">
                    {customer.name}
                  </h4>
                  <p className="text-xs text-[#778477] mt-0.5 flex items-center gap-1">
                    <FAIcon name="phone" className="text-[10px] text-[#84A282]" />
                    <span>{customer.phone}</span>
                  </p>
                  {customer.email && (
                    <p className="text-[11px] text-[#778477] mt-0.5 flex items-center gap-1 truncate">
                      <FAIcon name="email" className="text-[10px] text-[#84A282]" />
                      <span>{customer.email}</span>
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Card Footer: Metadata & Real-time Chat Action Button */}
            <div className="mt-4 pt-3.5 border-t border-[#EAEFE8] space-y-2.5">
              <div className="flex items-center justify-between text-[11px] text-[#778477]">
                <span>Terdaftar:</span>
                <span className="font-semibold text-[#26382B]">{customer.registeredAt}</span>
              </div>

              <button
                type="button"
                onClick={() =>
                  onOpenChatWithCustomer &&
                  onOpenChatWithCustomer({
                    name: customer.name,
                    avatarUrl: customer.avatarUrl
                  })
                }
                className="w-full py-2.5 px-3 rounded-2xl bg-[#F0F5ED] hover:bg-[#84A282] text-[#405A42] hover:text-white text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-2xs active:scale-[0.98] group cursor-pointer"
              >
                <FAIcon name="chat" className="text-xs text-[#84A282] group-hover:text-white transition-colors" />
                <span>Konsultasi & Chat Pasien</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 ml-1" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Customers;
