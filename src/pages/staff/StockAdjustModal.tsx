import React, { useState } from 'react';
import { usePharmacy } from '../../context/PharmacyContext';
import { useAuth } from '../../context/AuthContext';
import { PharmacyMedicine } from '../../types';
import { FAIcon } from '../../components/common/FAIcon';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';

interface StockAdjustModalProps {
  medicine: PharmacyMedicine | null;
  onClose: () => void;
}

export const StockAdjustModal: React.FC<StockAdjustModalProps> = ({
  medicine,
  onClose
}) => {
  const { adjustStock } = usePharmacy();
  const { currentUser } = useAuth();

  const [type, setType] = useState<'in' | 'out' | 'adjustment'>('in');
  const [quantity, setQuantity] = useState<number>(10);
  const [reason, setReason] = useState<string>('');
  const [errorReason, setErrorReason] = useState('');

  if (!medicine) return null;

  const currentStock = medicine.totalStock;
  const quantityChanged = type === 'out' ? -Math.abs(quantity) : Math.abs(quantity);
  const stockAfter = Math.max(0, currentStock + quantityChanged);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setErrorReason('Alasan penyesuaian stok wajib diisi untuk audit log.');
      return;
    }

    adjustStock(
      medicine.id,
      quantityChanged,
      type,
      reason.trim(),
      currentUser.name
    );

    onClose();
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-[#E7EBE4] space-y-4 animate-in zoom-in-95 z-10">
        <div className="flex items-start justify-between pb-3 border-b border-[#E7EBE4]">
          <div>
            <span className="text-[10px] font-bold text-[#84A282] uppercase tracking-wider block">
              Mutasi & Penyesuaian Stok
            </span>
            <h3 className="font-extrabold text-base text-[#26382B]">
              {medicine.name}
            </h3>
            <p className="text-xs text-[#778477]">Batch: {medicine.batchNumber}</p>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#F0F5ED] hover:bg-[#E6EEE3] text-[#778477] flex items-center justify-center"
          >
            <FAIcon name="close" className="text-xs" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Current vs Target Preview */}
          <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-[#F7F9F5] border border-[#E7EBE4] text-center">
            <div>
              <span className="text-[10px] text-[#778477] block">Stok Saat Ini:</span>
              <span className="text-base font-extrabold text-[#26382B]">
                {currentStock} {medicine.unit}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-[#778477] block">Stok Sesudah:</span>
              <span className="text-base font-extrabold text-[#587A58]">
                {stockAfter} {medicine.unit}
              </span>
            </div>
          </div>

          {/* Movement Type */}
          <div>
            <label className="block text-xs font-semibold text-[#26382B] mb-1.5">
              Jenis Perubahan Stok
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'in', label: 'Tambah (+)', icon: 'plus' },
                { id: 'out', label: 'Kurang (-)', icon: 'minus' },
                { id: 'adjustment', label: 'Koreksi Fisik', icon: 'refresh' }
              ].map((item) => (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => setType(item.id as any)}
                  className={`py-2 px-2 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1 transition-all ${
                    type === item.id
                      ? 'bg-[#E6EEE3] border-[#84A282] text-[#587A58] font-bold shadow-sm'
                      : 'bg-white border-[#E7EBE4] text-[#778477]'
                  }`}
                >
                  <FAIcon name={item.icon as any} className="text-[10px]" />
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          <Input
            label="Jumlah Perubahan *"
            type="number"
            min={1}
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
            required
          />

          <Input
            label="Alasan Perubahan (Wajib Audit) *"
            placeholder="Misal: Penerimaan PBF Faktur #991, Penyerahan Resep, Retur Rusak..."
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              if (errorReason) setErrorReason('');
            }}
            error={errorReason}
            required
          />

          <div className="text-[11px] text-[#778477] bg-[#E6EEE3]/40 p-2.5 rounded-xl border border-[#84A282]/20">
            Perubahan stok ini akan dicatat atas nama petugas: <strong className="text-[#26382B]">{currentUser.name}</strong>.
          </div>

          <div className="grid grid-cols-2 gap-2.5 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Batal
            </Button>
            <Button type="submit" variant="primary">
              Simpan Mutasi
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StockAdjustModal;
