import React, { useState, useEffect } from 'react';
import { usePharmacy } from '../../context/PharmacyContext';
import { PharmacyMedicine, DosageForm, MedicineClass } from '../../types';
import { FAIcon } from '../../components/common/FAIcon';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { BottomSheet } from '../../components/common/BottomSheet';

interface AddEditMedicineProps {
  isOpen: boolean;
  onClose: () => void;
  editTarget?: PharmacyMedicine | null;
}

export const AddEditMedicine: React.FC<AddEditMedicineProps> = ({
  isOpen,
  onClose,
  editTarget
}) => {
  const { addMedicine, updateMedicine } = usePharmacy();

  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [category, setCategory] = useState('Analgesik & Antipiretik');
  const [brand, setBrand] = useState('Kimia Farma');
  const [dosageForm, setDosageForm] = useState<DosageForm>('tablet');
  const [strength, setStrength] = useState('500 mg');
  const [medicineClass, setMedicineClass] = useState<MedicineClass>('Bebas');
  const [description, setDescription] = useState('');
  const [usageInstructions, setUsageInstructions] = useState('Sesuai anjuran pada kemasan atau resep dokter.');
  const [totalStock, setTotalStock] = useState<number>(50);
  const [unit, setUnit] = useState('Strip (10 Tablet)');
  const [minStock, setMinStock] = useState<number>(15);
  const [purchasePrice, setPurchasePrice] = useState<number>(8000);
  const [sellingPrice, setSellingPrice] = useState<number>(12000);
  const [batchNumber, setBatchNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('2027-12-31');
  const [storageLocation, setStorageLocation] = useState('Rak A-01 (Suhu Kamar)');
  const [errorName, setErrorName] = useState('');

  useEffect(() => {
    if (editTarget) {
      setName(editTarget.name);
      setSku(editTarget.sku);
      setCategory(editTarget.category);
      setBrand(editTarget.brand);
      setDosageForm(editTarget.dosageForm);
      setStrength(editTarget.strength);
      setMedicineClass(editTarget.medicineClass);
      setDescription(editTarget.description);
      setUsageInstructions(editTarget.usageInstructions);
      setTotalStock(editTarget.totalStock);
      setUnit(editTarget.unit);
      setMinStock(editTarget.minStock);
      setPurchasePrice(editTarget.purchasePrice);
      setSellingPrice(editTarget.sellingPrice);
      setBatchNumber(editTarget.batchNumber);
      setExpiryDate(editTarget.expiryDate);
      setStorageLocation(editTarget.storageLocation);
    } else {
      setName('');
      setSku(`MED-${Math.floor(100 + Math.random() * 900)}`);
      setCategory('Analgesik & Antipiretik');
      setBrand('Kimia Farma');
      setDosageForm('tablet');
      setStrength('500 mg');
      setMedicineClass('Bebas');
      setDescription('');
      setUsageInstructions('Sesuai anjuran pada kemasan atau resep dokter.');
      setTotalStock(50);
      setUnit('Strip (10 Tablet)');
      setMinStock(15);
      setPurchasePrice(8000);
      setSellingPrice(12000);
      setBatchNumber(`BCH-${new Date().getFullYear()}${String(Math.floor(100 + Math.random() * 900))}`);
      setExpiryDate('2027-12-31');
      setStorageLocation('Rak A-01 (Suhu Kamar)');
    }
    setErrorName('');
  }, [editTarget, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorName('Nama obat wajib diisi.');
      return;
    }

    if (editTarget) {
      updateMedicine(editTarget.id, {
        name: name.trim(),
        sku: sku.trim(),
        category: category.trim(),
        brand: brand.trim(),
        dosageForm,
        strength: strength.trim(),
        medicineClass,
        description: description.trim(),
        usageInstructions: usageInstructions.trim(),
        totalStock: Number(totalStock),
        unit: unit.trim(),
        minStock: Number(minStock),
        purchasePrice: Number(purchasePrice),
        sellingPrice: Number(sellingPrice),
        batchNumber: batchNumber.trim(),
        expiryDate,
        storageLocation: storageLocation.trim()
      });
    } else {
      addMedicine({
        name: name.trim(),
        sku: sku.trim(),
        category: category.trim(),
        brand: brand.trim(),
        dosageForm,
        strength: strength.trim(),
        medicineClass,
        description: description.trim(),
        usageInstructions: usageInstructions.trim(),
        totalStock: Number(totalStock),
        unit: unit.trim(),
        minStock: Number(minStock),
        purchasePrice: Number(purchasePrice),
        sellingPrice: Number(sellingPrice),
        batchNumber: batchNumber.trim(),
        expiryDate,
        storageLocation: storageLocation.trim(),
        isActive: true
      });
    }

    onClose();
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={editTarget ? 'Edit Data Obat Apotek' : 'Tambah Obat Katalog Baru'}
      subtitle="Identitas farmasi, nomor batch, masa berlaku & kontrol stok"
      maxHeight="max-h-[92vh]"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pb-4">
        {/* Identitas Obat */}
        <section aria-labelledby="section-staff-sheet-id" className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-[#587A58] uppercase tracking-wider">
            <FAIcon name="pill" />
            <h4 id="section-staff-sheet-id">1. Identitas & Klasifikasi</h4>
          </div>

          <Input
            label="Nama Obat Resmi *"
            placeholder="Misal: Paracetamol 500 mg"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (errorName) setErrorName('');
            }}
            error={errorName}
            required
          />

          <div className="grid grid-cols-2 gap-2.5">
            <Input
              label="Kode SKU"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              required
            />
            <Input
              label="Merk / Pabrikan"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <Input
              label="Kategori"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
            />
            <Input
              label="Kekuatan"
              value={strength}
              onChange={(e) => setStrength(e.target.value)}
              required
            />
          </div>

          {/* Klasifikasi */}
          <div>
            <label className="block text-xs font-semibold text-[#26382B] mb-1.5">
              Klasifikasi Regulasi
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'Bebas', label: 'Bebas' },
                { id: 'Bebas Terbatas', label: 'Terbatas (W)' },
                { id: 'Keras / Resep', label: 'Keras (K)' }
              ].map((item) => (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => setMedicineClass(item.id as MedicineClass)}
                  className={`py-2 px-1 text-center rounded-xl text-xs font-semibold border transition-all ${
                    medicineClass === item.id
                      ? 'bg-[#E6EEE3] border-[#84A282] text-[#587A58] font-bold shadow-sm'
                      : 'bg-white border-[#E7EBE4] text-[#778477]'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Stok & Harga */}
        <section aria-labelledby="section-staff-sheet-stok" className="space-y-3 pt-3 border-t border-[#E7EBE4]">
          <div className="flex items-center gap-2 text-xs font-bold text-[#587A58] uppercase tracking-wider">
            <FAIcon name="boxes" />
            <h4 id="section-staff-sheet-stok">2. Inventaris & Harga</h4>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <Input
              label="Stok Awal"
              type="number"
              value={totalStock}
              onChange={(e) => setTotalStock(Number(e.target.value))}
              required
            />
            <Input
              label="Satuan"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              required
            />
            <Input
              label="Batas Min"
              type="number"
              value={minStock}
              onChange={(e) => setMinStock(Number(e.target.value))}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <Input
              label="Harga Beli (HNA) (Rp)"
              type="number"
              value={purchasePrice}
              onChange={(e) => setPurchasePrice(Number(e.target.value))}
            />
            <Input
              label="Harga Jual (Rp)"
              type="number"
              value={sellingPrice}
              onChange={(e) => setSellingPrice(Number(e.target.value))}
              required
            />
          </div>
        </section>

        {/* Batch & Expired */}
        <section aria-labelledby="section-staff-sheet-batch" className="space-y-3 pt-3 border-t border-[#E7EBE4]">
          <div className="flex items-center gap-2 text-xs font-bold text-[#587A58] uppercase tracking-wider">
            <FAIcon name="calendar" />
            <h4 id="section-staff-sheet-batch">3. Batch & Lokasi</h4>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <Input
              label="Nomor Batch"
              value={batchNumber}
              onChange={(e) => setBatchNumber(e.target.value)}
              required
            />
            <Input
              label="Tgl Kedaluwarsa"
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              required
            />
          </div>

          <Input
            label="Lokasi Penyimpanan"
            value={storageLocation}
            onChange={(e) => setStorageLocation(e.target.value)}
            required
          />

          <div>
            <label className="block text-xs font-semibold text-[#26382B] mb-1">
              Deskripsi & Indikasi
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Indikasi medis..."
              className="w-full bg-white border border-[#E7EBE4] rounded-2xl p-2.5 text-xs text-[#26382B] focus:outline-none focus:ring-2 focus:ring-[#84A282]/30"
            />
          </div>
        </section>

        <div className="pt-2 sticky bottom-0 bg-white">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            icon="circleCheck"
            className="shadow-soft"
          >
            {editTarget ? 'Simpan Perubahan' : 'Simpan Obat'}
          </Button>
        </div>
      </form>
    </BottomSheet>
  );
};

export default AddEditMedicine;
