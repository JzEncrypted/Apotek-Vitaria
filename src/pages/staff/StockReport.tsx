import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { usePharmacy } from '../../context/PharmacyContext';
import { useToast } from '../../context/ToastContext';
import { PharmacyMedicine } from '../../types';
import { FAIcon } from '../../components/common/FAIcon';
import { StockAdjustModal } from './StockAdjustModal';

interface StockReportProps {
  onOpenStockAdjust?: (med: PharmacyMedicine) => void;
}

export const StockReport: React.FC<StockReportProps> = ({ onOpenStockAdjust }) => {
  const { medicines } = usePharmacy();
  const { showToast } = useToast();

  // Search & Filter States
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'critical' | 'low' | 'safe'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'stockAsc' | 'stockDesc' | 'nameAsc' | 'assetDesc'>('stockAsc');

  // Restock modal state
  const [adjustTarget, setAdjustTarget] = useState<PharmacyMedicine | null>(null);

  // Dynamic Categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    medicines.forEach((m) => {
      if (m.category) set.add(m.category);
    });
    return Array.from(set).sort();
  }, [medicines]);

  // Derived Financial & Stock Aggregations
  const totalSku = medicines.length;
  const totalPhysicalUnits = medicines.reduce((sum, m) => sum + (m.totalStock || 0), 0);
  
  const totalPurchaseAsset = medicines.reduce((sum, m) => {
    const buyPrice = m.purchasePrice || Math.round((m.sellingPrice || 0) * 0.8);
    return sum + (m.totalStock || 0) * buyPrice;
  }, 0);

  const outOfStockMeds = useMemo(() => medicines.filter((m) => (m.totalStock || 0) <= 0), [medicines]);
  const lowStockMeds = useMemo(
    () => medicines.filter((m) => (m.totalStock || 0) > 0 && (m.totalStock || 0) <= (m.minStock || 10)),
    [medicines]
  );
  const criticalItemsCount = outOfStockMeds.length + lowStockMeds.length;

  // Filtered & Sorted Medicines
  const filteredMedicines = useMemo(() => {
    return medicines
      .filter((m) => {
        // Status Filter
        const stock = m.totalStock || 0;
        const min = m.minStock || 10;
        if (statusFilter === 'critical' && stock > 0) return false;
        if (statusFilter === 'low' && (stock <= 0 || stock > min)) return false;
        if (statusFilter === 'safe' && stock <= min) return false;

        // Category Filter
        if (categoryFilter !== 'all' && m.category !== categoryFilter) return false;

        // Search Query Filter
        if (search.trim()) {
          const q = search.toLowerCase();
          const matchName = m.name?.toLowerCase().includes(q);
          const matchGeneric = (m as any).genericName?.toLowerCase()?.includes(q);
          const matchCategory = m.category?.toLowerCase().includes(q);
          const matchManufacturer = m.brand?.toLowerCase().includes(q) || (m as any).manufacturer?.toLowerCase().includes(q);
          const matchId = m.id?.toLowerCase().includes(q) || m.sku?.toLowerCase().includes(q);
          if (!matchName && !matchGeneric && !matchCategory && !matchManufacturer && !matchId) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        const stockA = a.totalStock || 0;
        const stockB = b.totalStock || 0;
        const buyA = a.purchasePrice || Math.round((a.sellingPrice || 0) * 0.8);
        const buyB = b.purchasePrice || Math.round((b.sellingPrice || 0) * 0.8);

        if (sortBy === 'stockAsc') return stockA - stockB;
        if (sortBy === 'stockDesc') return stockB - stockA;
        if (sortBy === 'nameAsc') return a.name.localeCompare(b.name);
        if (sortBy === 'assetDesc') return (stockB * buyB) - (stockA * buyA);
        return 0;
      });
  }, [medicines, search, statusFilter, categoryFilter, sortBy]);

  // Handle In-Place Stock Restock Action
  const handleOpenRestock = (med: PharmacyMedicine) => {
    if (onOpenStockAdjust) {
      onOpenStockAdjust(med);
    } else {
      setAdjustTarget(med);
    }
  };

  // Client-Side Excel Export
  const handleExportExcel = () => {
    try {
      const rows: Record<string, any>[] = filteredMedicines.map((m, idx) => {
        const stock = m.totalStock || 0;
        const min = m.minStock || 10;
        const buyPrice = m.purchasePrice || Math.round((m.sellingPrice || 0) * 0.8);
        const sellPrice = m.sellingPrice || 0;
        const status =
          stock <= 0 ? 'HABIS (KRITIS)' : stock <= min ? 'MENIPIS (PERLU RESTOCK)' : 'AMAN';

        return {
          'No.': idx + 1,
          'Kode SKU': m.sku || `SKU-${m.id.slice(-6).toUpperCase()}`,
          'Nama Obat': m.name,
          'Nama Generik': (m as any).genericName || '-',
          'Kategori': m.category || 'Obat Umum',
          'Bentuk Sediaan': m.dosageForm || 'Tablet',
          'Kekuatan Dosis': m.strength || '-',
          'Satuan': m.unit || 'Strip',
          'Stok Fisik Saat Ini': stock,
          'Batas Stok Minimum': min,
          'Status Ketersediaan': status,
          'Harga Beli Modal (Rp)': buyPrice,
          'Harga Jual Konsumen (Rp)': sellPrice,
          'Total Nilai Modal Stok (Rp)': stock * buyPrice,
          'Potensi Nilai Penjualan (Rp)': stock * sellPrice,
          'Golongan Obat': m.medicineClass || ((m as any).requiresPrescription ? 'Keras / Resep' : 'Bebas'),
          'Pabrik / Produsen': m.brand || (m as any).manufacturer || 'Industri Farmasi'
        };
      });

      // Add summary row
      rows.push({
        'No.': '',
        'Kode SKU': 'TOTAL KESELURUHAN',
        'Nama Obat': `${rows.length} SKU`,
        'Nama Generik': '',
        'Kategori': '',
        'Bentuk Sediaan': '',
        'Kekuatan Dosis': '',
        'Satuan': '',
        'Stok Fisik Saat Ini': filteredMedicines.reduce((sum, m) => sum + (m.totalStock || 0), 0),
        'Batas Stok Minimum': '',
        'Status Ketersediaan': '',
        'Harga Beli Modal (Rp)': '',
        'Harga Jual Konsumen (Rp)': '',
        'Total Nilai Modal Stok (Rp)': filteredMedicines.reduce((sum, m) => {
          const buy = m.purchasePrice || Math.round((m.sellingPrice || 0) * 0.8);
          return sum + (m.totalStock || 0) * buy;
        }, 0),
        'Potensi Nilai Penjualan (Rp)': filteredMedicines.reduce((sum, m) => sum + (m.totalStock || 0) * (m.sellingPrice || 0), 0),
        'Golongan Obat': '',
        'Pabrik / Produsen': ''
      });

      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Laporan Stok Farmasi');

      const todayStr = new Date().toISOString().slice(0, 10);
      XLSX.writeFile(workbook, `Laporan_Stok_Apotek_Vitaria_${todayStr}.xlsx`);
      showToast('Laporan stok obat berhasil diunduh dalam format Excel (.xlsx)', 'success');
    } catch (err: any) {
      // Fallback to server endpoint
      window.open('/api/reports/export-stock-excel', '_blank');
      showToast('Mengunduh laporan stok melalui server...', 'info');
    }
  };

  // Copy PBF Procurement Order Template to Clipboard
  const handleCopyPBFOrder = () => {
    const criticalList = medicines.filter((m) => (m.totalStock || 0) <= (m.minStock || 10));
    if (criticalList.length === 0) {
      showToast('Seluruh stok obat dalam kondisi aman, tidak ada kebutuhan PO mendesak.', 'info');
      return;
    }

    const todayStr = new Intl.DateTimeFormat('id-ID', {
      dateStyle: 'full'
    }).format(new Date());

    let text = `*SURAT PESANAN OBAT (PO) - APOTEK VITARIA MAGELANG*\n`;
    text += `Tanggal: ${todayStr}\n`;
    text += `Penanggung Jawab: apt. Sarinah Cantika, S.Farm. (SIPA: 19950512/SIPA_33.08/2022/2045)\n`;
    text += `Alamat: Jl. Mayjen Bambang Soegeng, Mertoyudan, Kab. Magelang\n`;
    text += `--------------------------------------------------\n`;
    text += `*DAFTAR PERMINTAAN RESTOCK LOGISTIK FARMASI:*\n\n`;

    criticalList.forEach((m, idx) => {
      const stock = m.totalStock || 0;
      const min = m.minStock || 10;
      const recommendedOrder = Math.max(min * 2 - stock, 10);
      const statusLabel = stock <= 0 ? '[HABIS TOTAL]' : '[MENIPIS]';
      text += `${idx + 1}. *${m.name}* (${m.dosageForm || 'Tablet'} ${m.strength || ''})\n`;
      text += `   - Status: ${statusLabel} | Sisa Stok: ${stock} ${m.unit || 'unit'} (Min: ${min})\n`;
      text += `   - Rekomendasi Pesan: *${recommendedOrder} ${m.unit || 'unit'}*\n`;
      text += `   - Kategori: ${m.category} | Golongan: ${m.medicineClass || 'Bebas'}\n\n`;
    });

    text += `--------------------------------------------------\n`;
    text += `Mohon konfirmasi ketersediaan barang, nomor batch, masa kedaluwarsa, dan faktur resmi PBF. Terima kasih.`;

    navigator.clipboard.writeText(text).then(() => {
      showToast('Format pesanan PBF berhasil disalin ke clipboard! Siap dikirim ke WhatsApp supplier.', 'success');
    }).catch(() => {
      showToast('Gagal menyalin format pesanan ke clipboard.', 'danger');
    });
  };

  return (
    <div className="w-full space-y-5">
      {/* Restock Adjustment Modal */}
      {adjustTarget && (
        <StockAdjustModal
          medicine={adjustTarget}
          onClose={() => setAdjustTarget(null)}
        />
      )}

      {/* Header & Main Actions */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="text-xs font-bold text-[#84A282] uppercase tracking-wider block">
            Manajemen Logistik & Gudang Farmasi
          </span>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#26382B]">
            Laporan Stok & Peringatan Dini Obat
          </h2>
          <p className="text-xs text-[#778477] mt-0.5">
            Audit kuantitas fisik rak farmasi, ambang batas stok minimum, valuasi modal, dan pencegahan stok kosong.
          </p>
        </div>

        {/* Action Buttons Header */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleCopyPBFOrder}
            className="px-3.5 py-2.5 rounded-2xl bg-white border border-[#D5E1D2] hover:border-[#84A282] text-[#344C36] hover:text-[#1F2E23] text-xs font-bold flex items-center gap-2 shadow-2xs transition-all active:scale-95 cursor-pointer"
            title="Salin rekapitulasi obat menipis untuk dikirimkan ke WhatsApp PBF / Supplier"
          >
            <FAIcon name="paperPlane" className="text-xs text-[#84A282]" />
            <span>Salin PO PBF</span>
          </button>

          <button
            type="button"
            onClick={handleExportExcel}
            className="px-4 py-2.5 rounded-2xl bg-[#2D7344] hover:bg-[#235C35] text-white text-xs font-bold flex items-center gap-2 shadow-soft transition-all active:scale-95 cursor-pointer"
            title="Unduh laporan audit stok lengkap dalam format Microsoft Excel (.xlsx)"
          >
            <FAIcon name="document" className="text-xs" />
            <span>Unduh Excel (.xlsx)</span>
          </button>
        </div>
      </header>

      {/* Early Warning Notification Alert Banner (Notifikasi Stok Menipis & Kritis) */}
      {criticalItemsCount > 0 ? (
        <div className="bg-gradient-to-r from-rose-50 via-amber-50 to-orange-50 border border-amber-300 rounded-3xl p-4 sm:p-5 shadow-soft-sm text-stone-800 animate-fadeIn space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-500 text-white flex items-center justify-center shrink-0 shadow-xs animate-pulse">
                <FAIcon name="alert" className="text-base" />
              </div>
              <div className="space-y-0.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-extrabold text-sm sm:text-base text-rose-950">
                    Peringatan Dini: Terdapat {criticalItemsCount} Obat Kritis & Menipis!
                  </span>
                  {outOfStockMeds.length > 0 && (
                    <span className="px-2 py-0.5 text-[10px] font-extrabold rounded-full bg-rose-600 text-white shadow-2xs">
                      {outOfStockMeds.length} HABIS TOTAL
                    </span>
                  )}
                  {lowStockMeds.length > 0 && (
                    <span className="px-2 py-0.5 text-[10px] font-extrabold rounded-full bg-amber-500 text-white shadow-2xs">
                      {lowStockMeds.length} DI BAWAH MINIMUM
                    </span>
                  )}
                </div>
                <p className="text-xs text-stone-700 leading-relaxed">
                  Obat-obat berikut berada pada batas kritis. Segera lakukan pengadaan ulang (restock) ke Pedagang Besar Farmasi (PBF) resmi untuk mencegah kekosongan layanan pasien.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Preview Chips of Critical Medicines */}
          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-amber-200/80">
            <span className="text-[11px] font-bold text-amber-950">Item Mendesak:</span>
            {[...outOfStockMeds, ...lowStockMeds].slice(0, 5).map((med) => (
              <button
                key={med.id}
                type="button"
                onClick={() => handleOpenRestock(med)}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition-transform active:scale-95 shadow-2xs ${
                  (med.totalStock || 0) <= 0
                    ? 'bg-rose-100 border border-rose-300 text-rose-800 hover:bg-rose-200'
                    : 'bg-amber-100 border border-amber-300 text-amber-900 hover:bg-amber-200'
                }`}
                title="Klik untuk langsung restock obat ini"
              >
                <span>{med.name}</span>
                <span className="opacity-75">({med.totalStock || 0} {med.unit})</span>
                <FAIcon name="plus" className="text-[9px]" />
              </button>
            ))}
            {criticalItemsCount > 5 && (
              <span className="text-[11px] text-stone-500 font-medium">
                +{criticalItemsCount - 5} obat lainnya
              </span>
            )}

            <div className="ml-auto flex items-center gap-2">
              <button
                type="button"
                onClick={() => setStatusFilter(statusFilter === 'all' ? 'critical' : 'all')}
                className="text-xs font-bold text-rose-800 hover:text-rose-950 underline cursor-pointer"
              >
                {statusFilter === 'critical' ? 'Tampilkan Semua Stok' : 'Filter Obat Kritis'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-emerald-50/80 border border-emerald-200 rounded-3xl p-4 flex items-center justify-between gap-3 text-emerald-900 shadow-soft-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-xs">
              <FAIcon name="circleCheck" className="text-base" />
            </div>
            <div>
              <p className="text-xs font-bold text-emerald-950">
                Semua Stok Inventaris Obat Dalam Kondisi Aman
              </p>
              <p className="text-[11px] text-emerald-800">
                Tidak ada obat yang berada di bawah ambang batas minimum (min stock). Pasokan farmasi terpenuhi.
              </p>
            </div>
          </div>
          <span className="text-xs font-extrabold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full shrink-0">
            100% Siap Layanan
          </span>
        </div>
      )}

      {/* 4 Summary Operational KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1: Total SKU */}
        <div className="bg-white rounded-3xl p-4 border border-[#E7EBE4] shadow-soft-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-[#778477] uppercase tracking-wider">
              Total SKU Obat
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#F0F5ED] text-[#587A58] flex items-center justify-center text-xs">
              <FAIcon name="pill" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-black text-[#1F2E23] leading-none block">
              {totalSku}
            </span>
            <span className="text-[11px] text-[#778477] font-medium mt-1 block">
              Item terdaftar di katalog
            </span>
          </div>
        </div>

        {/* Card 2: Total Unit Fisik */}
        <div className="bg-white rounded-3xl p-4 border border-[#E7EBE4] shadow-soft-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-[#778477] uppercase tracking-wider">
              Total Unit Fisik
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#4E9B69]/15 text-[#4E9B69] flex items-center justify-center text-xs">
              <FAIcon name="boxes" />
            </div>
          </div>
          <div>
            <span className="text-2xl font-black text-[#1F2E23] leading-none block">
              {totalPhysicalUnits.toLocaleString('id-ID')}
            </span>
            <span className="text-[11px] text-[#778477] font-medium mt-1 block">
              Unit obat tersimpan di rak
            </span>
          </div>
        </div>

        {/* Card 3: Nilai Aset Modal Stok */}
        <div className="bg-white rounded-3xl p-4 border border-[#E7EBE4] shadow-soft-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-[#778477] uppercase tracking-wider">
              Valuasi Modal Stok
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#3B82F6]/15 text-[#3B82F6] flex items-center justify-center text-xs">
              <FAIcon name="trendUp" />
            </div>
          </div>
          <div>
            <span className="text-xl sm:text-2xl font-black text-[#1F2E23] leading-none block">
              Rp {totalPurchaseAsset.toLocaleString('id-ID')}
            </span>
            <span className="text-[11px] text-[#778477] font-medium mt-1 block">
              Estimasi nilai beli inventaris
            </span>
          </div>
        </div>

        {/* Card 4: Item Menipis / Kritis */}
        <div className={`rounded-3xl p-4 border shadow-soft-sm flex flex-col justify-between ${
          criticalItemsCount > 0
            ? 'bg-gradient-to-br from-white to-rose-50/40 border-rose-200'
            : 'bg-white border-[#E7EBE4]'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-rose-800 uppercase tracking-wider">
              Stok Kritis / Habis
            </span>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs ${
              criticalItemsCount > 0 ? 'bg-rose-100 text-rose-600' : 'bg-stone-100 text-stone-500'
            }`}>
              <FAIcon name="alert" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-rose-700 leading-none block">
                {criticalItemsCount}
              </span>
              <span className="text-[11px] text-rose-800 font-semibold">
                item butuh restock
              </span>
            </div>
            <span className="text-[11px] text-[#778477] font-medium mt-1 block">
              Di bawah batas minimum
            </span>
          </div>
        </div>
      </div>

      {/* Filter, Search & Category Controls */}
      <div className="bg-white rounded-3xl p-4 border border-[#E7EBE4] shadow-soft-sm space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#778477] text-xs">
              <FAIcon name="search" />
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama obat, SKU, pabrik, atau kategori..."
              className="w-full pl-10 pr-4 py-2.5 bg-[#F7F9F5] border border-[#D5E1D2] focus:border-[#84A282] focus:ring-2 focus:ring-[#84A282]/20 rounded-2xl text-xs text-[#26382B] outline-none transition-all placeholder:text-[#9AA69A]"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#778477] hover:text-[#26382B]"
              >
                <FAIcon name="close" className="text-xs" />
              </button>
            )}
          </div>

          {/* Category Dropdown */}
          <div className="w-full sm:w-48">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full py-2.5 px-3 bg-[#F7F9F5] border border-[#D5E1D2] focus:border-[#84A282] focus:ring-2 focus:ring-[#84A282]/20 rounded-2xl text-xs font-semibold text-[#26382B] outline-none transition-all cursor-pointer"
            >
              <option value="all">Semua Kategori</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By Dropdown */}
          <div className="w-full sm:w-48">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full py-2.5 px-3 bg-[#F7F9F5] border border-[#D5E1D2] focus:border-[#84A282] focus:ring-2 focus:ring-[#84A282]/20 rounded-2xl text-xs font-semibold text-[#26382B] outline-none transition-all cursor-pointer"
            >
              <option value="stockAsc">Stok Terendah (Restock Prioritas)</option>
              <option value="stockDesc">Stok Tertinggi</option>
              <option value="nameAsc">Nama Obat (A-Z)</option>
              <option value="assetDesc">Nilai Modal Terbesar</option>
            </select>
          </div>
        </div>

        {/* Status Filter Tabs / Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-[#F0F5ED]">
          <span className="text-[11px] font-bold text-[#778477] mr-1">Status Stok:</span>
          
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              statusFilter === 'all'
                ? 'bg-[#84A282] text-white shadow-xs'
                : 'bg-[#F7F9F5] text-[#526352] hover:bg-[#EAEFE7]'
            }`}
          >
            Semua ({totalSku})
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('critical')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              statusFilter === 'critical'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
            <span>Habis Total ({outOfStockMeds.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('low')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              statusFilter === 'low'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
            }`}
          >
            <span>Menipis ({lowStockMeds.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('safe')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              statusFilter === 'safe'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
            }`}
          >
            Stok Aman ({totalSku - criticalItemsCount})
          </button>

          <span className="ml-auto text-xs text-[#778477] font-semibold">
            Menampilkan <strong>{filteredMedicines.length}</strong> dari {totalSku} SKU
          </span>
        </div>
      </div>

      {/* Stock Inventory Table (Desktop / Tablet) */}
      <div className="bg-white rounded-3xl border border-[#E7EBE4] shadow-soft-sm overflow-hidden hidden md:block">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAFBF9] border-b border-[#E7EBE4] text-[#556956] uppercase text-[10px] font-extrabold tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Obat & SKU</th>
                <th className="py-3.5 px-3">Kategori</th>
                <th className="py-3.5 px-3 w-48">Stok Saat Ini vs Min</th>
                <th className="py-3.5 px-3">Status</th>
                <th className="py-3.5 px-3 text-right">Harga Beli / Jual</th>
                <th className="py-3.5 px-3 text-right">Nilai Modal</th>
                <th className="py-3.5 px-4 text-center">Aksi Cepat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAEFE8]">
              {filteredMedicines.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#778477]">
                    <div className="w-12 h-12 mx-auto rounded-full bg-[#F0F5ED] text-[#84A282] flex items-center justify-center text-lg mb-2">
                      <FAIcon name="boxes" />
                    </div>
                    <p className="font-bold text-sm text-[#26382B]">Tidak Ada Data Obat Ditemukan</p>
                    <p className="text-xs text-[#778477] mt-0.5">
                      Coba sesuaikan kata kunci pencarian atau reset filter status Anda.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredMedicines.map((med) => {
                  const stock = med.totalStock || 0;
                  const min = med.minStock || 10;
                  const buyPrice = med.purchasePrice || Math.round((med.sellingPrice || 0) * 0.8);
                  const sellPrice = med.sellingPrice || 0;
                  const assetValue = stock * buyPrice;

                  // Progress percentage relative to healthy target (target = 2 * minStock)
                  const targetHealthyStock = Math.max(min * 2, 20);
                  const stockPercent = Math.min(100, Math.round((stock / targetHealthyStock) * 100));

                  const isOutOfStock = stock <= 0;
                  const isLowStock = !isOutOfStock && stock <= min;

                  return (
                    <tr
                      key={med.id}
                      className={`hover:bg-[#F9FAF8] transition-colors ${
                        isOutOfStock ? 'bg-rose-50/30' : isLowStock ? 'bg-amber-50/20' : ''
                      }`}
                    >
                      {/* Name & SKU */}
                      <td className="py-3 px-4">
                        <div className="font-extrabold text-sm text-[#26382B] leading-tight">
                          {med.name}
                        </div>
                        <div className="text-[11px] text-[#778477] flex items-center gap-1.5 mt-0.5">
                          <span className="font-mono text-[10px] text-[#84A282]">
                            {med.sku || `SKU-${med.id.slice(-6).toUpperCase()}`}
                          </span>
                          <span>•</span>
                          <span>{med.dosageForm || 'Tablet'} {med.strength || ''}</span>
                        </div>
                        {med.brand && (
                          <span className="text-[10px] text-stone-500 block">
                            Pabrik: {med.brand}
                          </span>
                        )}
                      </td>

                      {/* Category & Class */}
                      <td className="py-3 px-3">
                        <span className="inline-block px-2 py-0.5 rounded-lg bg-[#F0F5ED] text-[#344C36] font-semibold text-[11px]">
                          {med.category || 'Umum'}
                        </span>
                        <span className="block text-[10px] text-[#778477] mt-0.5">
                          {med.medicineClass || ((med as any).requiresPrescription ? 'Keras / Resep' : 'Bebas')}
                        </span>
                      </td>

                      {/* Stock Level with Progress Bar */}
                      <td className="py-3 px-3">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="font-extrabold text-[#1F2E23]">
                            {stock} <span className="font-normal text-[11px] text-[#778477]">{med.unit || 'unit'}</span>
                          </span>
                          <span className="text-[10px] text-[#778477]">
                            Min: {min}
                          </span>
                        </div>
                        {/* Interactive Progress Bar */}
                        <div className="w-full bg-[#E5EBE3] rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              isOutOfStock
                                ? 'w-0'
                                : isLowStock
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                            }`}
                            style={{ width: isOutOfStock ? '0%' : `${Math.max(5, stockPercent)}%` }}
                          />
                        </div>
                        <span className="text-[9px] text-[#778477] mt-0.5 block">
                          {isOutOfStock
                            ? 'Stok kosong di rak'
                            : isLowStock
                            ? `${stock} unit sisa (Batas min: ${min})`
                            : 'Stok mencukupi'}
                        </span>
                      </td>

                      {/* Status Badge */}
                      <td className="py-3 px-3">
                        {isOutOfStock ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-800 border border-rose-300">
                            <FAIcon name="alert" className="text-[9px]" />
                            <span>Habis</span>
                          </span>
                        ) : isLowStock ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300">
                            <FAIcon name="alert" className="text-[9px]" />
                            <span>Menipis</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            <FAIcon name="circleCheck" className="text-[9px]" />
                            <span>Aman</span>
                          </span>
                        )}
                      </td>

                      {/* Price Beli & Jual */}
                      <td className="py-3 px-3 text-right">
                        <div className="font-semibold text-xs text-[#26382B]">
                          Rp {sellPrice.toLocaleString('id-ID')}
                        </div>
                        <div className="text-[10px] text-[#778477]">
                          Modal: Rp {buyPrice.toLocaleString('id-ID')}
                        </div>
                      </td>

                      {/* Total Asset Valuation */}
                      <td className="py-3 px-3 text-right">
                        <div className="font-extrabold text-xs text-[#1F2E23]">
                          Rp {assetValue.toLocaleString('id-ID')}
                        </div>
                        <div className="text-[10px] text-[#778477]">
                          Omset: Rp {(stock * sellPrice).toLocaleString('id-ID')}
                        </div>
                      </td>

                      {/* Quick Restock Action Button */}
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleOpenRestock(med)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer ${
                            isOutOfStock
                              ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-soft-sm'
                              : isLowStock
                              ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-soft-sm'
                              : 'bg-[#F0F5ED] hover:bg-[#E2EDE0] text-[#344C36] border border-[#CBD8C7]'
                          }`}
                          title="Sesuaikan stok obat atau catat penerimaan faktur baru"
                        >
                          <FAIcon name="plus" className="text-[10px]" />
                          <span>Restock</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View (For Phones / Handheld) */}
      <div className="space-y-3 md:hidden">
        {filteredMedicines.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 border border-[#E7EBE4] text-center text-[#778477] shadow-soft-sm">
            <div className="w-10 h-10 mx-auto rounded-full bg-[#F0F5ED] text-[#84A282] flex items-center justify-center text-sm mb-2">
              <FAIcon name="boxes" />
            </div>
            <p className="font-bold text-xs text-[#26382B]">Tidak ada obat yang cocok</p>
            <p className="text-[11px] text-[#778477] mt-0.5">Silakan reset kata kunci atau filter.</p>
          </div>
        ) : (
          filteredMedicines.map((med) => {
            const stock = med.totalStock || 0;
            const min = med.minStock || 10;
            const buyPrice = med.purchasePrice || Math.round((med.sellingPrice || 0) * 0.8);
            const sellPrice = med.sellingPrice || 0;
            const assetValue = stock * buyPrice;

            const isOutOfStock = stock <= 0;
            const isLowStock = !isOutOfStock && stock <= min;

            return (
              <div
                key={med.id}
                className={`bg-white rounded-3xl p-4 border shadow-soft-sm space-y-3 transition-colors ${
                  isOutOfStock
                    ? 'border-rose-300 bg-rose-50/20'
                    : isLowStock
                    ? 'border-amber-300 bg-amber-50/15'
                    : 'border-[#E7EBE4]'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-[#84A282]">
                      {med.sku || `SKU-${med.id.slice(-6).toUpperCase()}`}
                    </span>
                    <h3 className="font-extrabold text-sm text-[#26382B] leading-tight">
                      {med.name}
                    </h3>
                    <p className="text-[11px] text-[#778477] mt-0.5">
                      {med.category} • {med.dosageForm} {med.strength}
                    </p>
                  </div>

                  <div>
                    {isOutOfStock ? (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-800 border border-rose-300 inline-flex items-center gap-1">
                        <FAIcon name="alert" className="text-[9px]" />
                        <span>Habis</span>
                      </span>
                    ) : isLowStock ? (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300 inline-flex items-center gap-1">
                        <FAIcon name="alert" className="text-[9px]" />
                        <span>Menipis</span>
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300 inline-flex items-center gap-1">
                        <FAIcon name="circleCheck" className="text-[9px]" />
                        <span>Aman</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Stock Progress on Mobile */}
                <div className="bg-[#FAFBF9] rounded-2xl p-3 border border-[#EAEFE8] space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-[#556956] font-medium">Stok Fisik:</span>
                    <span className="font-extrabold text-[#1F2E23]">
                      {stock} {med.unit || 'unit'}{' '}
                      <span className="text-[10px] font-normal text-[#778477]">
                        (Min: {min})
                      </span>
                    </span>
                  </div>
                  <div className="w-full bg-[#E5EBE3] rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        isOutOfStock ? 'w-0' : isLowStock ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{
                        width: isOutOfStock
                          ? '0%'
                          : `${Math.min(100, Math.max(8, (stock / (min * 2)) * 100))}%`
                      }}
                    />
                  </div>
                </div>

                {/* Pricing & Asset valuation */}
                <div className="flex justify-between items-center text-xs pt-1 border-t border-[#F0F5ED]">
                  <div>
                    <span className="text-[10px] text-[#778477] block">
                      Harga Jual: Rp {sellPrice.toLocaleString('id-ID')}
                    </span>
                    <span className="font-extrabold text-[#1F2E23]">
                      Modal: Rp {assetValue.toLocaleString('id-ID')}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleOpenRestock(med)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow-2xs active:scale-95 cursor-pointer ${
                      isOutOfStock
                        ? 'bg-rose-600 text-white hover:bg-rose-700'
                        : isLowStock
                        ? 'bg-amber-600 text-white hover:bg-amber-700'
                        : 'bg-[#84A282] text-white hover:bg-[#688C66]'
                    }`}
                  >
                    <FAIcon name="plus" className="text-[10px]" />
                    <span>Restock Obat</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
