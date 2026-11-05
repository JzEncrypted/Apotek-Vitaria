import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useOrder, OrderItem } from '../../context/OrderContext';
import { FAIcon } from '../../components/common/FAIcon';
import { Badge } from '../../components/common/Badge';

interface MyOrdersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddMedicationReminder?: (med: {
    name: string;
    dosageForm: string;
    strength: string;
    category?: string;
  }) => void;
  onReorderMedicine?: (item: OrderItem) => void;
  onOpenConsultation?: () => void;
}

export const MyOrdersModal: React.FC<MyOrdersModalProps> = ({
  isOpen,
  onClose,
  onAddMedicationReminder,
  onReorderMedicine,
  onOpenConsultation
}) => {
  const { orders } = useOrder();
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedProofUrl, setSelectedProofUrl] = useState<string | null>(null);

  if (!isOpen) return null;

  const filteredOrders = orders.filter((o) => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'active') return o.orderStatus !== 'completed' && o.orderStatus !== 'cancelled';
    if (filterStatus === 'completed') return o.orderStatus === 'completed';
    return true;
  });

  const getOrderStatusBadge = (status: string) => {
    switch (status) {
      case 'pending_prescription':
        return (
          <span className="text-[10px] font-bold text-amber-900 bg-amber-100 border border-amber-300 px-2.5 py-0.5 rounded-full flex items-center gap-1">
            <FAIcon name="document" className="text-[9px]" />
            <span>Verifikasi Resep APJ</span>
          </span>
        );
      case 'prescription_rejected':
        return (
          <span className="text-[10px] font-bold text-rose-800 bg-rose-100 border border-rose-300 px-2.5 py-0.5 rounded-full">
            Resep Ditolak
          </span>
        );
      case 'completed':
        return <Badge variant="active" label="Selesai Diterima" showIcon={false} />;
      case 'shipped':
        return <Badge variant="active" label="Sedang Diantar Kurir" showIcon={false} />;
      case 'processing':
        return <Badge variant="snoozed" label="Sedang Disiapkan" showIcon={false} />;
      case 'cancelled':
        return <Badge variant="missed" label="Dibatalkan" showIcon={false} />;
      default:
        return <Badge variant="paused" label="Menunggu Proses" showIcon={false} />;
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">Lunas</span>;
      case 'verifying':
        return <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">Verifikasi Bukti</span>;
      case 'failed':
        return <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full">Ditolak</span>;
      default:
        return <span className="text-[10px] font-bold text-stone-700 bg-stone-100 px-2 py-0.5 rounded-full">Belum Bayar</span>;
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex justify-center bg-black/40 backdrop-blur-xs animate-fadeIn">
      {/* Lightbox for payment proof */}
      {selectedProofUrl && (
        <div
          className="fixed inset-0 z-[60] bg-black/90 flex flex-col items-center justify-center p-4 backdrop-blur-md animate-fadeIn"
          onClick={() => setSelectedProofUrl(null)}
        >
          <div className="w-full max-w-sm flex items-center justify-between pb-3 text-white">
            <span className="text-sm font-bold">Bukti Transfer Pembayaran</span>
            <button
              type="button"
              onClick={() => setSelectedProofUrl(null)}
              className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center"
            >
              <FAIcon name="close" className="text-sm" />
            </button>
          </div>
          <img
            src={selectedProofUrl}
            alt="Bukti Transfer"
            className="max-h-[75vh] w-auto rounded-2xl object-contain border border-white/20"
          />
        </div>
      )}

      {/* Main Container */}
      <div className="w-full max-w-lg h-full bg-[#F7F9F5] flex flex-col shadow-2xl animate-slideInRight">
        {/* Header */}
        <header className="bg-white border-b border-[#E5EAE3] px-4 py-3 flex items-center justify-between shrink-0 shadow-xs">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-full hover:bg-[#F0F4EE] flex items-center justify-center text-[#526352] transition-colors"
              aria-label="Kembali"
            >
              <FAIcon name="arrowLeft" className="text-base" />
            </button>
            <div>
              <h2 className="text-sm sm:text-base font-extrabold text-[#1F2E23] leading-tight">
                Pesanan & Riwayat Beli
              </h2>
              <p className="text-[11px] text-[#778477]">
                Lacak status transaksi dan sambungkan obat ke jadwal pengingat
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {onOpenConsultation && (
              <button
                type="button"
                onClick={onOpenConsultation}
                className="w-8 h-8 rounded-full hover:bg-[#F0F4EE] text-[#587A58] flex items-center justify-center transition-colors"
                title="Konsultasi Apoteker"
              >
                <FAIcon name="chat" className="text-xs" />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full hover:bg-[#F0F4EE] text-[#778477] flex items-center justify-center"
              aria-label="Tutup"
            >
              <FAIcon name="close" className="text-sm" />
            </button>
          </div>
        </header>

        {/* Filter Pills */}
        <div className="bg-white border-b border-[#E5EAE3] px-4 py-2 flex items-center gap-1.5 shrink-0">
          {[
            { id: 'all', label: 'Semua Pesanan' },
            { id: 'active', label: 'Sedang Berjalan' },
            { id: 'completed', label: 'Selesai' }
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setFilterStatus(item.id)}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                filterStatus === item.id
                  ? 'bg-[#84A282] text-white shadow-soft-sm'
                  : 'bg-[#F0F5ED] text-[#587A58] hover:bg-[#E2EDE0]'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Orders Stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
          {filteredOrders.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 border border-[#E7EBE4] text-center space-y-3 mt-6">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-[#F0F5ED] text-[#587A58] flex items-center justify-center text-xl">
                <FAIcon name="boxes" />
              </div>
              <h4 className="text-sm font-bold text-[#1F2E23]">Belum Ada Riwayat Pesanan</h4>
              <p className="text-xs text-[#778477] max-w-xs mx-auto">
                Obat yang Anda pesan di Apotek Vitaria akan tercatat di sini dan bisa langsung dijadikan pengingat minum obat.
              </p>
            </div>
          ) : (
            filteredOrders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-3xl p-4.5 border border-[#E5EAE3] shadow-soft-sm space-y-3 hover:border-[#84A282]/40 transition-all"
              >
                {/* Invoice Top Header */}
                <div className="flex items-center justify-between pb-2.5 border-b border-[#EAEFE8] text-xs">
                  <div>
                    <span className="font-mono font-extrabold text-[#1F2E23] block">
                      {order.invoiceNumber}
                    </span>
                    <span className="text-[10px] text-[#778477]">{order.createdAt}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {getOrderStatusBadge(order.orderStatus)}
                    {getPaymentStatusBadge(order.paymentStatus)}
                  </div>
                </div>

                {/* Purchased Medicines Items */}
                <div className="space-y-2">
                  {order.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="bg-[#F7F9F5] rounded-2xl p-3 border border-[#E5EAE3] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                    >
                      <div className="flex items-start gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-white text-[#587A58] flex items-center justify-center text-xs shrink-0 border border-[#84A282]/20 shadow-2xs">
                          <FAIcon name="pill" />
                        </div>
                        <div className="min-w-0">
                          <h5 className="font-extrabold text-xs text-[#1F2E23] truncate">
                            {item.medicineName}
                          </h5>
                          <p className="text-[10px] text-[#778477]">
                            {item.quantity} {item.unit} • Rp {item.totalPrice.toLocaleString('id-ID')}
                          </p>
                          {item.instructions && (
                            <p className="text-[10px] text-[#526352] mt-0.5 line-clamp-1 italic">
                              "{item.instructions}"
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Action: 1-Click "Jadikan Pengingat Minum Obat" */}
                      <div className="flex items-center gap-1.5 self-end sm:self-auto">
                        <button
                          type="button"
                          onClick={() => {
                            if (onAddMedicationReminder) {
                              onAddMedicationReminder({
                                name: item.medicineName,
                                dosageForm: item.dosageForm,
                                strength: item.strength,
                                category: item.category
                              });
                            }
                          }}
                          className="px-2.5 py-1.5 bg-[#84A282] hover:bg-[#688C66] text-white rounded-xl text-[10px] font-bold flex items-center gap-1 shadow-2xs transition-colors active:scale-95"
                          title="Tambahkan langsung ke jadwal minum obat harian"
                        >
                          <FAIcon name="bell" className="text-[9px]" />
                          <span>Jadikan Pengingat</span>
                        </button>

                        {onReorderMedicine && (
                          <button
                            type="button"
                            onClick={() => onReorderMedicine(item)}
                            className="px-2 py-1.5 bg-white border border-[#D5E1D2] hover:bg-[#F0F5ED] text-[#405A42] rounded-xl text-[10px] font-bold transition-colors"
                            title="Beli ulang obat ini"
                          >
                            <FAIcon name="refresh" className="text-[9px]" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Delivery & Payment Summary */}
                <div className="pt-2 border-t border-[#EAEFE8] flex items-center justify-between text-xs">
                  <div className="text-[11px] text-[#587A58] flex items-center gap-1.5">
                    <FAIcon name={order.deliveryMethod === 'delivery' ? 'location' : 'boxes'} className="text-[10px]" />
                    <span className="truncate max-w-[200px]">
                      {order.deliveryMethod === 'delivery' ? order.shippingAddress : 'Ambil di Apotek Vitaria Magelang'}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-[#778477] block">Total Transaksi:</span>
                    <span className="text-sm font-extrabold text-[#1F2E23]">
                      Rp {order.grandTotal.toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>

                {/* Prescription Attachment Preview */}
                {order.prescriptionUrl && (
                  <div className="p-2.5 rounded-2xl bg-amber-50/80 border border-amber-200 flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-2">
                      <FAIcon name="document" className="text-amber-700 text-xs" />
                      <span className="font-bold text-amber-950">Resep Dokter Fisik Terlampir</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedProofUrl(order.prescriptionUrl || null)}
                      className="px-2.5 py-1 bg-amber-200/80 hover:bg-amber-300 text-amber-950 rounded-xl text-[10px] font-bold flex items-center gap-1 transition-colors"
                    >
                      <FAIcon name="image" className="text-[9px]" />
                      <span>Lihat Resep</span>
                    </button>
                  </div>
                )}

                {/* Payment Proof Button if transfer */}
                {order.paymentProofUrl && (
                  <div className="pt-1 flex items-center justify-between text-[11px]">
                    <span className="text-[#778477]">Bukti Transfer Terlampir:</span>
                    <button
                      type="button"
                      onClick={() => setSelectedProofUrl(order.paymentProofUrl || null)}
                      className="text-[#587A58] font-bold hover:underline flex items-center gap-1"
                    >
                      <FAIcon name="image" className="text-[10px]" />
                      <span>Lihat Bukti Foto</span>
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default MyOrdersModal;
