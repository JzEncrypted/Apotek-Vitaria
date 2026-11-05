import React, { useState } from 'react';
import { useOrder, OrderTransaction } from '../../context/OrderContext';
import { usePharmacy } from '../../context/PharmacyContext';
import { PharmacyMedicine } from '../../types';
import { FAIcon } from '../../components/common/FAIcon';
import { StockReport } from './StockReport';

export interface SalesReportProps {
  initialSubTab?: 'sales' | 'stock';
  onOpenStockAdjust?: (med: PharmacyMedicine) => void;
}

export const SalesReport: React.FC<SalesReportProps> = ({
  initialSubTab = 'sales',
  onOpenStockAdjust
}) => {
  const { orders, verifyPayment, verifyPrescription, updateOrderStatus, exportExcel } = useOrder();
  const { stats } = usePharmacy();

  const [reportSubTab, setReportSubTab] = useState<'sales' | 'stock'>(initialSubTab);
  const [search, setSearch] = useState('');
  const [filterPayment, setFilterPayment] = useState<string>('all');
  const [filterTime, setFilterTime] = useState<'today' | 'week' | 'month' | 'all'>('all');

  // Modals
  const [verifyingOrder, setVerifyingOrder] = useState<OrderTransaction | null>(null);
  const [verifyingPrescriptionOrder, setVerifyingPrescriptionOrder] = useState<OrderTransaction | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [prescriptionRejectReason, setPrescriptionRejectReason] = useState('');
  const [printingOrder, setPrintingOrder] = useState<OrderTransaction | null>(null);
  const [statusTargetOrder, setStatusTargetOrder] = useState<OrderTransaction | null>(null);

  // Financial Stats Computation
  const paidOrders = orders.filter((o) => o.paymentStatus === 'paid');
  const totalRevenue = paidOrders.reduce((sum, o) => sum + o.grandTotal, 0);
  const totalTransactions = paidOrders.length;
  const pendingVerifications = orders.filter((o) => o.paymentStatus === 'verifying').length;
  const pendingPrescriptions = orders.filter((o) => o.orderStatus === 'pending_prescription').length;
  const averageOrderValue = totalTransactions > 0 ? Math.round(totalRevenue / totalTransactions) : 0;

  // Filtered Orders
  const filteredOrders = orders.filter((o) => {
    if (filterPayment === 'resep') {
      if (o.orderStatus !== 'pending_prescription' && !o.prescriptionUrl) return false;
    } else if (filterPayment !== 'all' && o.paymentStatus !== filterPayment) {
      return false;
    }

    if (filterTime === 'today') {
      const todayShort = '03 Nov';
      if (!o.createdAt.includes(todayShort)) return false;
    }

    if (search) {
      const q = search.toLowerCase();
      const matchInvoice = o.invoiceNumber.toLowerCase().includes(q);
      const matchName = o.customerName.toLowerCase().includes(q);
      const matchPhone = o.customerPhone.includes(q);
      const matchItem = o.items.some((i) => i.medicineName.toLowerCase().includes(q));
      if (!matchInvoice && !matchName && !matchPhone && !matchItem) return false;
    }

    return true;
  });

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-5 space-y-5 pb-24 lg:pb-8">
      {/* Subtab Switcher: Penjualan vs Stok Obat */}
      <div className="bg-[#EAEFE7] p-1.5 rounded-2xl flex items-center gap-1.5 shadow-inner">
        <button
          type="button"
          onClick={() => setReportSubTab('sales')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            reportSubTab === 'sales'
              ? 'bg-white text-[#1F2E23] shadow-soft'
              : 'text-[#526352] hover:text-[#1F2E23]'
          }`}
        >
          <FAIcon name="document" className="text-xs text-[#84A282]" />
          <span>Laporan Penjualan & Kasir</span>
        </button>

        <button
          type="button"
          onClick={() => setReportSubTab('stock')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            reportSubTab === 'stock'
              ? 'bg-white text-[#1F2E23] shadow-soft'
              : 'text-[#526352] hover:text-[#1F2E23]'
          }`}
        >
          <FAIcon name="boxes" className="text-xs text-[#84A282]" />
          <span>Laporan Stok & Peringatan Logistik</span>
          {stats.lowStockCount > 0 && (
            <span className="px-2 py-0.5 text-[10px] font-black rounded-full bg-rose-600 text-white animate-pulse shadow-2xs">
              {stats.lowStockCount} Kritis
            </span>
          )}
        </button>
      </div>

      {reportSubTab === 'stock' ? (
        <StockReport onOpenStockAdjust={onOpenStockAdjust} />
      ) : (
        <>
          {/* Printable Invoice Modal */}
      {printingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-[#D5E1D2] space-y-4 max-h-[90vh] overflow-y-auto">
            {/* Pharmacy Receipt Header */}
            <div className="text-center pb-3 border-b-2 border-dashed border-[#CBD5C8]">
              <div className="w-12 h-12 mx-auto mb-2 rounded-2xl overflow-hidden border border-[#84A282]/30 shadow-xs">
                <img src="/vitaria.jpg" alt="Apotek Vitaria" className="w-full h-full object-cover" />
              </div>
              <h3 className="font-extrabold text-base text-[#1F2E23]">APOTEK VITARIA MAGELANG</h3>
              <p className="text-[10px] text-[#556956]">
                Jl. Mayjen Bambang Soegeng, Mertoyudan, Kab. Magelang • WhatsApp: 0878-1962-2174
              </p>
              <p className="text-[10px] text-[#556956] font-mono">
                SIA: 503/0088/SIA/DPMPTSP/2022 • SIPA: 19950512/SIPA_33.08/2022/2045
              </p>
              <p className="text-[10px] font-bold text-[#354D38] mt-0.5">
                APJ: apt. Sarinah Cantika, S.Farm.
              </p>
            </div>

            {/* Invoice Meta */}
            <div className="text-xs space-y-1 font-mono text-[#2B3E2F]">
              <div className="flex justify-between">
                <span>No. Faktur:</span>
                <span className="font-bold">{printingOrder.invoiceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>Waktu:</span>
                <span>{printingOrder.createdAt}</span>
              </div>
              <div className="flex justify-between">
                <span>Pelanggan:</span>
                <span className="font-bold">{printingOrder.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span>Metode Bayar:</span>
                <span className="uppercase">{printingOrder.paymentMethod}</span>
              </div>
            </div>

            {/* Items Table */}
            <div className="border-t border-b border-[#E0E7DE] py-2 space-y-1.5 text-xs">
              {printingOrder.items.map((item, i) => (
                <div key={i} className="flex justify-between">
                  <div className="min-w-0 pr-2">
                    <span className="font-bold block truncate">{item.medicineName}</span>
                    <span className="text-[10px] text-[#778477]">
                      {item.quantity} x Rp {item.unitPrice.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <span className="font-bold shrink-0">
                    Rp {item.totalPrice.toLocaleString('id-ID')}
                  </span>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="text-xs space-y-1">
              <div className="flex justify-between text-[#778477]">
                <span>Subtotal:</span>
                <span>Rp {printingOrder.subtotal.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between text-[#778477]">
                <span>Ongkos Kirim:</span>
                <span>Rp {printingOrder.deliveryFee.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between text-base font-extrabold text-[#1F2E23] pt-1 border-t border-[#E0E7DE]">
                <span>TOTAL AKHIR:</span>
                <span>Rp {printingOrder.grandTotal.toLocaleString('id-ID')}</span>
              </div>
            </div>

            {/* Stamp LUNAS */}
            <div className="p-2.5 rounded-xl bg-emerald-50 border-2 border-emerald-500 text-center font-extrabold text-xs text-emerald-800 tracking-wider uppercase">
              ✓ LUNAS - RESMI APOTEK VITARIA
            </div>

            {/* Print & Close Actions */}
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 py-2.5 bg-[#84A282] hover:bg-[#688C66] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-soft transition-colors"
              >
                <FAIcon name="document" className="text-xs" />
                <span>Cetak Struk / PDF</span>
              </button>
              <button
                type="button"
                onClick={() => setPrintingOrder(null)}
                className="px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-semibold transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Verify Payment Proof Modal */}
      {verifyingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl border border-[#D5E1D2] space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#EAEFE8]">
              <h3 className="text-sm font-bold text-[#1F2E23]">Verifikasi Bukti Transfer</h3>
              <button
                type="button"
                onClick={() => setVerifyingOrder(null)}
                className="w-7 h-7 rounded-full bg-stone-100 flex items-center justify-center text-xs"
              >
                <FAIcon name="close" />
              </button>
            </div>

            <div className="space-y-1 text-xs">
              <p className="text-[#778477]">
                Invoice: <strong className="text-[#1F2E23]">{verifyingOrder.invoiceNumber}</strong>
              </p>
              <p className="text-[#778477]">
                Pelanggan: <strong className="text-[#1F2E23]">{verifyingOrder.customerName}</strong>
              </p>
              <p className="text-[#778477]">
                Total: <strong className="text-emerald-700 font-bold">Rp {verifyingOrder.grandTotal.toLocaleString('id-ID')}</strong>
              </p>
            </div>

            {/* Proof Photo Display */}
            {verifyingOrder.paymentProofUrl ? (
              <div className="rounded-2xl overflow-hidden border border-[#D5E1D2] bg-black/5 max-h-56 flex items-center justify-center">
                <img
                  src={verifyingOrder.paymentProofUrl}
                  alt="Bukti Transfer"
                  className="max-h-56 w-auto object-contain"
                />
              </div>
            ) : (
              <div className="p-4 bg-stone-100 rounded-2xl text-center text-xs text-[#778477]">
                Tidak ada foto bukti transfer terlampir.
              </div>
            )}

            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  verifyPayment(verifyingOrder.id, true);
                  setVerifyingOrder(null);
                }}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-soft transition-colors"
              >
                <FAIcon name="circleCheck" className="text-xs" />
                <span>Terima Pembayaran (Lunas)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  verifyPayment(verifyingOrder.id, false, rejectReason || 'Bukti transfer tidak valid/buram');
                  setVerifyingOrder(null);
                  setRejectReason('');
                }}
                className="w-full py-2 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-bold transition-colors"
              >
                Tolak Bukti Pembayaran
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Update Status Modal */}
      {statusTargetOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl border border-[#D5E1D2] space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#EAEFE8]">
              <h3 className="text-sm font-bold text-[#1F2E23]">Perbarui Status Pesanan</h3>
              <button
                type="button"
                onClick={() => setStatusTargetOrder(null)}
                className="w-7 h-7 rounded-full bg-stone-100 flex items-center justify-center text-xs"
              >
                <FAIcon name="close" />
              </button>
            </div>

            <p className="text-xs text-[#526352]">
              Pilih status terkini untuk pesanan <strong>{statusTargetOrder.invoiceNumber}</strong>:
            </p>

            <div className="grid grid-cols-1 gap-2 text-xs">
              {[
                { status: 'processing', label: 'Sedang Disiapkan Obat' },
                { status: 'shipped', label: 'Sedang Diantar Kurir Apotek' },
                { status: 'completed', label: 'Selesai Diterima Pasien' },
                { status: 'cancelled', label: 'Batalkan Pesanan' }
              ].map((opt) => (
                <button
                  key={opt.status}
                  type="button"
                  onClick={() => {
                    updateOrderStatus(statusTargetOrder.id, opt.status as any);
                    setStatusTargetOrder(null);
                  }}
                  className={`p-3 rounded-2xl border text-left font-bold transition-all ${
                    statusTargetOrder.orderStatus === opt.status
                      ? 'bg-[#84A282] text-white border-[#84A282]'
                      : 'bg-[#F7F9F5] hover:bg-[#EAEFE7] border-[#D5E1D2] text-[#2B3E2F]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Verify Prescription Modal */}
      {verifyingPrescriptionOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl border border-[#D5E1D2] space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#EAEFE8]">
              <div>
                <span className="text-[10px] font-bold text-[#84A282] uppercase tracking-wider block">
                  Verifikasi Klinis Farmasi
                </span>
                <h3 className="text-sm sm:text-base font-extrabold text-[#1F2E23]">
                  Pemeriksaan Resep Dokter
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setVerifyingPrescriptionOrder(null);
                  setPrescriptionRejectReason('');
                }}
                className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-xs text-stone-600 transition-colors"
              >
                <FAIcon name="close" />
              </button>
            </div>

            {/* Apoteker Penanggung Jawab Banner */}
            <div className="p-3 bg-[#F0F5ED] rounded-2xl border border-[#D5E1D2] flex items-center justify-between">
              <div>
                <p className="text-[10px] text-[#556956]">Apoteker Penanggung Jawab (APJ):</p>
                <p className="text-xs font-bold text-[#203322]">apt. Sarinah Cantika, S.Farm.</p>
                <p className="text-[9px] text-[#778477] font-mono">SIPA: 19950512/SIPA_33.08/2022/2045</p>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-mono font-bold text-[#354D38] bg-white px-2 py-1 rounded-lg border border-[#CBD8C7]">
                  {verifyingPrescriptionOrder.invoiceNumber}
                </span>
              </div>
            </div>

            {/* Patient & Prescription Details */}
            <div className="space-y-1.5 text-xs text-[#2B3E2F]">
              <div className="flex justify-between">
                <span className="text-[#778477]">Nama Pasien:</span>
                <span className="font-bold">{verifyingPrescriptionOrder.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#778477]">Kontak WhatsApp:</span>
                <span className="font-mono">{verifyingPrescriptionOrder.customerPhone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#778477]">Waktu Pemesanan:</span>
                <span>{verifyingPrescriptionOrder.createdAt}</span>
              </div>
            </div>

            {/* Prescribed Items in Order */}
            <div className="border border-[#E0E7DE] rounded-2xl p-3 bg-[#FAFBF9] space-y-2">
              <span className="text-[10px] font-extrabold uppercase text-[#556956] tracking-wider block">
                Daftar Obat Resep yang Dipesan:
              </span>
              <div className="space-y-1">
                {verifyingPrescriptionOrder.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center text-xs border-b border-[#EAEFE8] last:border-0 pb-1 last:pb-0">
                    <div>
                      <span className="font-bold text-[#1F2E23]">{item.medicineName}</span>
                      <span className="text-[10px] text-[#778477] block">{item.dosageForm} {item.strength}</span>
                    </div>
                    <span className="font-bold text-[#354D38]">{item.quantity} {item.unit}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Prescription Image */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-[#556956] block">Foto Resep Dokter Pasien:</span>
              {verifyingPrescriptionOrder.prescriptionUrl ? (
                <div className="rounded-2xl overflow-hidden border border-[#CBD8C7] bg-stone-900 flex items-center justify-center max-h-72">
                  <img
                    src={verifyingPrescriptionOrder.prescriptionUrl}
                    alt="Foto Resep Dokter"
                    className="max-h-72 w-full object-contain"
                  />
                </div>
              ) : (
                <div className="p-4 bg-stone-100 rounded-2xl text-center text-xs text-rose-600 font-medium">
                  Tidak ada foto resep dokter terlampir pada pesanan ini.
                </div>
              )}
            </div>

            {/* Rejection Reason Input (Optional) */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-[#556956] block">
                Catatan / Alasan Penolakan (Jika resep tidak sah/buram):
              </label>
              <input
                type="text"
                value={prescriptionRejectReason}
                onChange={(e) => setPrescriptionRejectReason(e.target.value)}
                placeholder="Contoh: Resep tidak bertanda tangan dokter, atau foto terlalu buram..."
                className="w-full bg-[#F4F7F2] border border-[#CBD8C7] focus:border-[#84A282] focus:ring-2 focus:ring-[#84A282]/20 rounded-xl px-3 py-2 text-xs text-[#1F2E23] outline-none"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  verifyPrescription(verifyingPrescriptionOrder.id, true);
                  setVerifyingPrescriptionOrder(null);
                  setPrescriptionRejectReason('');
                }}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-soft transition-colors cursor-pointer"
              >
                <FAIcon name="circleCheck" className="text-xs" />
                <span>Setujui Resep (Sah)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  verifyPrescription(
                    verifyingPrescriptionOrder.id,
                    false,
                    prescriptionRejectReason || 'Resep tidak terbaca / tidak memenuhi standar legalitas apotek'
                  );
                  setVerifyingPrescriptionOrder(null);
                  setPrescriptionRejectReason('');
                }}
                className="py-2.5 px-4 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Tolak Resep
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="text-xs font-bold text-[#84A282] uppercase tracking-wider block">
            Manajemen Keuangan & Kasir
          </span>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#26382B]">
            Laporan Penjualan & Transaksi
          </h2>
          <p className="text-xs text-[#778477] mt-0.5">
            Audit omset farmasi, verifikasi pembayaran pasien, dan unduh laporan resmi Excel
          </p>
        </div>

        {/* Export to Excel Action Button */}
        <button
          type="button"
          onClick={exportExcel}
          className="px-4 py-2.5 rounded-2xl bg-[#2D7344] hover:bg-[#235C35] text-white text-xs font-bold flex items-center gap-2 shadow-soft transition-all active:scale-95 shrink-0 cursor-pointer"
          title="Unduh laporan dalam format Microsoft Excel (.xlsx)"
        >
          <FAIcon name="document" className="text-xs" />
          <span>Unduh Excel (.xlsx)</span>
        </button>
      </header>

      {/* Pending Prescription Alert Banner */}
      {pendingPrescriptions > 0 && (
        <div className="bg-amber-50 border border-amber-300 rounded-3xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-900 shadow-soft-sm animate-fadeIn">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-bold shrink-0 shadow-xs">
              <FAIcon name="document" className="text-sm" />
            </div>
            <div>
              <p className="text-xs font-bold text-amber-950">
                Ada {pendingPrescriptions} Pesanan Menunggu Verifikasi Resep Dokter
              </p>
              <p className="text-[11px] text-amber-800">
                Apoteker (apt. Sarinah Cantika, S.Farm.) wajib memeriksa keabsahan foto resep sebelum obat disiapkan.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              const orderToVerify = orders.find((o) => o.orderStatus === 'pending_prescription');
              if (orderToVerify) setVerifyingPrescriptionOrder(orderToVerify);
            }}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-soft transition-colors cursor-pointer shrink-0"
          >
            Periksa Resep Sekarang
          </button>
        </div>
      )}

      {/* 4 Financial KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white rounded-3xl p-4 border border-[#E7EBE4] shadow-soft-sm">
          <span className="text-[11px] font-bold text-[#778477] uppercase tracking-wider block">
            Total Omset Lunas
          </span>
          <span className="text-xl sm:text-2xl font-black text-[#1F2E23] mt-1 block">
            Rp {totalRevenue.toLocaleString('id-ID')}
          </span>
          <span className="text-[10px] text-emerald-700 font-semibold mt-1 inline-block bg-emerald-50 px-2 py-0.5 rounded-full">
            {totalTransactions} pesanan lunas
          </span>
        </div>

        <div className="bg-white rounded-3xl p-4 border border-[#D99B42]/30 shadow-soft-sm bg-gradient-to-br from-white to-[#D99B42]/5">
          <span className="text-[11px] font-bold text-[#A87220] uppercase tracking-wider block">
            Perlu Verifikasi
          </span>
          <span className="text-xl sm:text-2xl font-black text-[#A87220] mt-1 block">
            {pendingVerifications}
          </span>
          <span className="text-[10px] text-[#A87220] font-medium mt-1 block">
            Bukti transfer masuk
          </span>
        </div>

        <div className="bg-white rounded-3xl p-4 border border-[#E7EBE4] shadow-soft-sm">
          <span className="text-[11px] font-bold text-[#778477] uppercase tracking-wider block">
            Rata-rata Order (AOV)
          </span>
          <span className="text-xl sm:text-2xl font-black text-[#1F2E23] mt-1 block">
            Rp {averageOrderValue.toLocaleString('id-ID')}
          </span>
          <span className="text-[10px] text-[#778477] font-medium mt-1 block">
            Nilai keranjang rata-rata
          </span>
        </div>

        <div className="bg-white rounded-3xl p-4 border border-[#84A282]/40 shadow-soft-sm bg-gradient-to-br from-white to-[#84A282]/10">
          <span className="text-[11px] font-bold text-[#496547] uppercase tracking-wider block">
            Metode Paling Populer
          </span>
          <span className="text-xl sm:text-2xl font-black text-[#1F2E23] mt-1 block">
            QRIS & Transfer
          </span>
          <span className="text-[10px] text-[#587A58] font-semibold mt-1 block">
            Transaksi non-tunai dominan
          </span>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-white rounded-3xl p-4 border border-[#E7EBE4] shadow-soft-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#778477] text-xs">
              <FAIcon name="search" />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari No. Faktur, Nama Pasien, No. HP, atau Nama Obat..."
              className="w-full bg-[#F4F7F2] border border-[#CBD8C7] focus:border-[#84A282] focus:ring-2 focus:ring-[#84A282]/20 rounded-2xl pl-9 pr-4 py-2 text-xs text-[#1F2E23] placeholder-[#778477]/70 outline-none transition-all"
            />
          </div>

          {/* Filter Toolbar Group */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
            {/* Time Filter */}
            <div className="flex items-center gap-1 bg-[#F0F5ED] p-0.5 rounded-xl">
              {[
                { id: 'all', label: 'Semua Waktu' },
                { id: 'today', label: 'Hari Ini' }
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setFilterTime(t.id as any)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                    filterTime === t.id
                      ? 'bg-white text-[#26382B] shadow-2xs'
                      : 'text-[#637563] hover:text-[#26382B]'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Payment Status Filter */}
            <div className="flex items-center gap-1">
              {[
                { id: 'all', label: 'Semua Status' },
                { id: 'resep', label: `Resep Dokter${pendingPrescriptions > 0 ? ` (${pendingPrescriptions})` : ''}` },
                { id: 'paid', label: 'Lunas' },
                { id: 'verifying', label: 'Verifikasi' },
                { id: 'pending', label: 'Menunggu' }
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFilterPayment(f.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    filterPayment === f.id
                      ? 'bg-[#84A282] text-white shadow-soft-sm'
                      : f.id === 'resep' && pendingPrescriptions > 0
                      ? 'bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200'
                      : 'bg-[#F0F5ED] text-[#587A58] hover:bg-[#E5EFE2]'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Transactions Data Table */}
      <div className="bg-white rounded-3xl border border-[#E7EBE4] shadow-soft-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#F0F5ED] text-[#405A42] font-extrabold border-b border-[#E0E7DE]">
                <th className="py-3.5 px-4 whitespace-nowrap">No. Faktur</th>
                <th className="py-3.5 px-4 whitespace-nowrap">Waktu</th>
                <th className="py-3.5 px-4 whitespace-nowrap">Pelanggan</th>
                <th className="py-3.5 px-4 whitespace-nowrap">Rincian Obat</th>
                <th className="py-3.5 px-4 whitespace-nowrap text-right">Total (Rp)</th>
                <th className="py-3.5 px-4 whitespace-nowrap text-center">Metode</th>
                <th className="py-3.5 px-4 whitespace-nowrap text-center">Status Bayar</th>
                <th className="py-3.5 px-4 whitespace-nowrap text-center">Pengiriman</th>
                <th className="py-3.5 px-4 whitespace-nowrap text-center">Aksi Kasir</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAEFE8]">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-10 text-center text-[#778477]">
                    Tidak ada transaksi yang cocok dengan filter pencarian.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-[#F9FAF8] transition-colors">
                    {/* Invoice */}
                    <td className="py-3 px-4 font-mono font-bold text-[#1F2E23] whitespace-nowrap">
                      {order.invoiceNumber}
                    </td>

                    {/* Time */}
                    <td className="py-3 px-4 text-[#778477] whitespace-nowrap">
                      {order.createdAt}
                    </td>

                    {/* Customer */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="font-bold text-[#1F2E23] block">{order.customerName}</span>
                      <span className="text-[10px] text-[#778477]">{order.customerPhone}</span>
                    </td>

                    {/* Items */}
                    <td className="py-3 px-4 max-w-[220px]">
                      <p className="line-clamp-2 text-[#526352]">
                        {order.items.map((i) => `${i.medicineName} (${i.quantity} ${i.unit})`).join(', ')}
                      </p>
                    </td>

                    {/* Total */}
                    <td className="py-3 px-4 text-right font-extrabold text-[#1F2E23] whitespace-nowrap">
                      Rp {order.grandTotal.toLocaleString('id-ID')}
                    </td>

                    {/* Payment Method */}
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <span className="uppercase font-mono text-[10px] font-bold bg-[#EAF2E8] text-[#405A42] px-2 py-0.5 rounded-md">
                        {order.paymentMethod}
                      </span>
                    </td>

                    {/* Payment Status */}
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      {order.paymentStatus === 'paid' ? (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                          Lunas
                        </span>
                      ) : order.paymentStatus === 'verifying' ? (
                        <button
                          type="button"
                          onClick={() => setVerifyingOrder(order)}
                          className="text-[10px] font-bold text-amber-700 bg-amber-100 hover:bg-amber-200 px-2 py-0.5 rounded-full transition-colors cursor-pointer"
                        >
                          Cek Bukti Transfer
                        </button>
                      ) : order.paymentStatus === 'failed' ? (
                        <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full">
                          Ditolak
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-stone-600 bg-stone-100 px-2 py-0.5 rounded-full">
                          Belum Bayar
                        </span>
                      )}
                    </td>

                    {/* Order Status */}
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      {order.orderStatus === 'pending_prescription' ? (
                        <button
                          type="button"
                          onClick={() => setVerifyingPrescriptionOrder(order)}
                          className="text-[10px] font-bold text-amber-800 bg-amber-100 hover:bg-amber-200 border border-amber-300 px-2.5 py-1 rounded-full transition-colors inline-flex items-center gap-1 cursor-pointer animate-pulse"
                          title="Klik untuk periksa foto resep dokter"
                        >
                          <FAIcon name="document" className="text-[10px]" />
                          <span>Perlu Cek Resep</span>
                        </button>
                      ) : order.orderStatus === 'prescription_rejected' ? (
                        <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-2.5 py-0.5 rounded-full inline-block">
                          Resep Ditolak
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setStatusTargetOrder(order)}
                          className="text-[11px] font-semibold text-[#405A42] hover:underline"
                        >
                          {order.orderStatus === 'completed'
                            ? 'Selesai Diterima'
                            : order.orderStatus === 'shipped'
                            ? 'Sedang Diantar'
                            : order.orderStatus === 'processing'
                            ? 'Sedang Disiapkan'
                            : 'Menunggu'}
                        </button>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setPrintingOrder(order)}
                          className="p-1.5 rounded-lg bg-[#F0F5ED] hover:bg-[#84A282] text-[#405A42] hover:text-white transition-colors"
                          title="Cetak Faktur Resmi"
                        >
                          <FAIcon name="document" className="text-xs" />
                        </button>

                        {order.prescriptionUrl && (
                          <button
                            type="button"
                            onClick={() => setVerifyingPrescriptionOrder(order)}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                              order.orderStatus === 'pending_prescription'
                                ? 'bg-amber-500 text-white shadow-soft'
                                : 'bg-[#EBF2EA] text-[#405A42] hover:bg-[#84A282] hover:text-white'
                            }`}
                            title="Periksa Foto Resep Dokter"
                          >
                            <FAIcon name="document" className="text-xs" />
                          </button>
                        )}

                        {order.paymentStatus === 'verifying' && (
                          <button
                            type="button"
                            onClick={() => setVerifyingOrder(order)}
                            className="p-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-800 transition-colors"
                            title="Verifikasi Bukti Transfer"
                          >
                            <FAIcon name="eye" className="text-xs" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
        </>
      )}
    </div>
  );
};

export default SalesReport;
