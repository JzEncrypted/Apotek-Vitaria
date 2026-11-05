import React, { useState, useMemo } from 'react';
import { usePharmacy } from '../../context/PharmacyContext';
import { PharmacyMedicine } from '../../types';
import { FAIcon } from '../../components/common/FAIcon';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { EmptyState } from '../../components/common/EmptyState';

interface CatalogProps {
  onOpenAddMedicine: () => void;
  onEditMedicine: (med: PharmacyMedicine) => void;
  onOpenStockAdjust: (med: PharmacyMedicine) => void;
}

export const Catalog: React.FC<CatalogProps> = ({
  onOpenAddMedicine,
  onEditMedicine,
  onOpenStockAdjust
}) => {
  const { medicines } = usePharmacy();
  const [search, setSearch] = useState('');
  const [filterStock, setFilterStock] = useState<'all' | 'low' | 'available' | 'nearExpiry'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = useMemo(() => {
    const list = Array.from(new Set(medicines.map((m) => m.category)));
    return ['all', ...list];
  }, [medicines]);

  const filtered = useMemo(() => {
    return medicines.filter((m) => {
      const matchSearch =
        m.name.toLowerCase().includes(search.toLowerCase()) ||
        m.sku.toLowerCase().includes(search.toLowerCase()) ||
        m.brand.toLowerCase().includes(search.toLowerCase());

      if (!matchSearch) return false;

      if (selectedCategory !== 'all' && m.category !== selectedCategory) {
        return false;
      }

      if (filterStock === 'low') {
        return m.totalStock <= m.minStock;
      }
      if (filterStock === 'available') {
        return m.totalStock > m.minStock;
      }
      if (filterStock === 'nearExpiry') {
        const today = new Date('2026-11-03');
        const sixtyDaysLater = new Date(today);
        sixtyDaysLater.setDate(sixtyDaysLater.getDate() + 60);
        return new Date(m.expiryDate) <= sixtyDaysLater;
      }

      return true;
    });
  }, [medicines, search, filterStock, selectedCategory]);

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-5 space-y-5 pb-24 lg:pb-8">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#26382B]">
            Katalog & Manajemen Stok Obat
          </h2>
          <p className="text-xs text-[#778477] mt-0.5">
            Daftar resmi obat apotek, nomor batch, masa kedaluwarsa, dan kontrol stok
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          icon="plus"
          onClick={onOpenAddMedicine}
          className="shadow-soft"
        >
          Tambah Obat Baru
        </Button>
      </header>

      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-2.5">
        <div className="relative flex-1">
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#778477] text-xs">
            <FAIcon name="search" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama obat, SKU, atau merk..."
            className="w-full bg-white border border-[#E7EBE4] rounded-2xl pl-9 pr-4 py-2.5 text-xs text-[#26382B] placeholder-[#778477]/60 focus:outline-none focus:ring-2 focus:ring-[#84A282]/30 focus:border-[#84A282]"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#778477] text-xs"
            >
              <FAIcon name="close" />
            </button>
          )}
        </div>

        {/* Stock Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {[
            { id: 'all', label: 'Semua' },
            { id: 'available', label: 'Stok Cukup' },
            { id: 'low', label: 'Stok Menipis' },
            { id: 'nearExpiry', label: 'Dekat Expired' }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setFilterStock(item.id as any)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                filterStock === item.id
                  ? 'bg-[#84A282] text-white shadow-soft-sm'
                  : 'bg-white border border-[#E7EBE4] text-[#778477] hover:bg-[#F0F5ED]'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
        <span className="text-[#778477] font-semibold text-[11px] mr-1 shrink-0">
          Kategori:
        </span>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-2.5 py-1 rounded-xl text-[11px] font-medium whitespace-nowrap transition-colors ${
              selectedCategory === cat
                ? 'bg-[#E6EEE3] text-[#587A58] font-bold border border-[#84A282]/30'
                : 'text-[#778477] hover:text-[#26382B]'
            }`}
          >
            {cat === 'all' ? 'Semua Kategori' : cat}
          </button>
        ))}
      </div>

      {/* Catalog Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filtered.map((med) => {
            const isLowStock = med.totalStock <= med.minStock;
            return (
              <div
                key={med.id}
                className={`bg-white rounded-3xl p-5 border shadow-soft-sm transition-all hover:shadow-soft flex flex-col justify-between ${
                  isLowStock ? 'border-[#D99B42]/40 bg-[#FFFDF9]' : 'border-[#E7EBE4]'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-[#F0F5ED] text-[#587A58] font-bold">
                        {med.sku}
                      </span>
                      <Badge
                        variant={
                          med.medicineClass === 'Bebas'
                            ? 'bebas'
                            : med.medicineClass === 'Bebas Terbatas'
                            ? 'bebasTerbatas'
                            : 'keras'
                        }
                      />
                    </div>

                    {isLowStock ? (
                      <Badge variant="lowStock" />
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-[#4E9B69]/10 text-[#4E9B69] text-[10px] font-bold">
                        Tersedia
                      </span>
                    )}
                  </div>

                  <h3 className="font-extrabold text-base text-[#26382B] mt-2">
                    {med.name}
                  </h3>
                  <p className="text-xs text-[#778477] mt-0.5">
                    {med.brand} • {med.strength} • {med.category}
                  </p>

                  {/* Stock and Price details */}
                  <div className="grid grid-cols-2 gap-2 my-3 p-3 rounded-2xl bg-[#F7F9F5] border border-[#E7EBE4] text-xs">
                    <div>
                      <span className="text-[10px] text-[#778477] block">Stok Tersedia:</span>
                      <span
                        className={`text-sm font-extrabold ${
                          isLowStock ? 'text-[#D99B42]' : 'text-[#26382B]'
                        }`}
                      >
                        {med.totalStock} {med.unit}
                      </span>
                      <span className="text-[10px] text-[#778477] block mt-0.5">
                        Min: {med.minStock} {med.unit}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-[#778477] block">Harga Jual:</span>
                      <span className="text-sm font-extrabold text-[#587A58]">
                        Rp {med.sellingPrice.toLocaleString('id-ID')}
                      </span>
                      <span className="text-[10px] text-[#778477] block mt-0.5 truncate">
                        Exp: {med.expiryDate}
                      </span>
                    </div>
                  </div>

                  <p className="text-[11px] text-[#778477]">
                    Batch: <span className="font-mono text-[#26382B]">{med.batchNumber}</span> • Lokasi: {med.storageLocation}
                  </p>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-[#E7EBE4]">
                  <Button
                    variant="outline"
                    size="sm"
                    icon="edit"
                    onClick={() => onEditMedicine(med)}
                  >
                    Edit Data
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    icon="boxes"
                    onClick={() => onOpenStockAdjust(med)}
                  >
                    Atur Stok
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon="boxes"
          title="Obat Tidak Ditemukan"
          description="Tidak ada obat katalog yang cocok dengan filter pencarian ini."
          actionLabel="Tambah Obat Baru"
          onAction={onOpenAddMedicine}
        />
      )}
    </div>
  );
};

export default Catalog;
