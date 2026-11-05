import React, { useState, useEffect, useMemo } from 'react';
import { useMedication } from '../../context/MedicationContext';
import { useOrder } from '../../context/OrderContext';
import { UserMedication, DosageForm } from '../../types';
import { FAIcon } from '../../components/common/FAIcon';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { BottomSheet } from '../../components/common/BottomSheet';

interface AddMedicationProps {
  isOpen: boolean;
  onClose: () => void;
  editTarget?: UserMedication | null;
}

export const AddMedication: React.FC<AddMedicationProps> = ({ isOpen, onClose, editTarget }) => {
  const { addMedication, updateMedication } = useMedication();
  const { orders } = useOrder();

  const [name, setName] = useState('');
  const [dosageForm, setDosageForm] = useState<DosageForm>('tablet');
  const [strength, setStrength] = useState('500 mg');
  const [category, setCategory] = useState('Umum');
  const [dosePerTake, setDosePerTake] = useState('1');
  const [doseUnit, setDoseUnit] = useState('Tablet');
  const [frequency, setFrequency] = useState('1x Sehari');
  const [times, setTimes] = useState<string[]>(['08:00']);
  const [instructions, setInstructions] = useState<
    'Sesudah Makan' | 'Sebelum Makan' | 'Bersama Makan' | 'Sesuai Petunjuk'
  >('Sesudah Makan');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [reminderSound, setReminderSound] = useState(true);
  const [notes, setNotes] = useState('');
  const [errorName, setErrorName] = useState('');
  const [selectedSourceMedicine, setSelectedSourceMedicine] = useState<string | null>(null);

  // Extract purchased medicines from user's pharmacy orders
  const purchasedMedicines = useMemo(() => {
    const list: Array<{
      medicineId: string;
      medicineName: string;
      dosageForm: string;
      strength: string;
      category?: string;
      instructions?: string;
      unit: string;
      orderDate: string;
    }> = [];
    const seen = new Set<string>();

    orders.forEach((o) => {
      if (o.orderStatus === 'cancelled') return;
      o.items.forEach((item) => {
        const key = item.medicineName.toLowerCase().trim();
        if (!seen.has(key)) {
          seen.add(key);
          list.push({
            medicineId: item.medicineId,
            medicineName: item.medicineName,
            dosageForm: item.dosageForm || 'tablet',
            strength: item.strength || '500 mg',
            category: item.category || 'Obat Apotek Vitaria',
            instructions: item.instructions || 'Sesudah Makan',
            unit: item.unit || 'Tablet',
            orderDate: o.createdAt
          });
        }
      });
    });
    return list;
  }, [orders]);

  // Sync state with editTarget when opening
  useEffect(() => {
    if (editTarget) {
      setName(editTarget.name);
      setDosageForm(editTarget.dosageForm);
      setStrength(editTarget.strength);
      setCategory(editTarget.category);
      setDosePerTake(editTarget.dosePerTake);
      setDoseUnit(editTarget.doseUnit);
      setFrequency(editTarget.frequency);
      setTimes(editTarget.times);
      setInstructions(editTarget.instructions);
      setStartDate(editTarget.startDate);
      setEndDate(editTarget.endDate || '');
      setReminderEnabled(editTarget.reminderEnabled);
      setReminderSound(editTarget.reminderSound);
      setNotes(editTarget.notes || '');
    } else {
      setName('');
      setDosageForm('tablet');
      setStrength('500 mg');
      setCategory('Umum');
      setDosePerTake('1');
      setDoseUnit('Tablet');
      setFrequency('1x Sehari');
      setTimes(['08:00']);
      setInstructions('Sesudah Makan');
      setStartDate(new Date().toISOString().split('T')[0]);
      setEndDate('');
      setReminderEnabled(true);
      setReminderSound(true);
      setNotes('');
    }
    setErrorName('');
  }, [editTarget, isOpen]);

  const dosageForms: { id: DosageForm; label: string; icon: string }[] = [
    { id: 'tablet', label: 'Tablet', icon: 'tablet' },
    { id: 'kapsul', label: 'Kapsul', icon: 'capsule' },
    { id: 'sirup', label: 'Sirup', icon: 'syrup' },
    { id: 'salep', label: 'Salep', icon: 'salep' },
    { id: 'tetes', label: 'Tetes', icon: 'drops' },
    { id: 'inhaler', label: 'Inhaler', icon: 'inhaler' }
  ];

  const frequencyOptions = [
    { label: '1x Sehari', times: ['08:00'] },
    { label: '2x Sehari', times: ['08:00', '20:00'] },
    { label: '3x Sehari', times: ['07:00', '13:00', '19:00'] },
    { label: '4x Sehari', times: ['06:00', '12:00', '18:00', '22:00'] },
    { label: 'Jika Perlu', times: ['12:00'] }
  ];

  const handleFrequencyChange = (freqLabel: string) => {
    setFrequency(freqLabel);
    const matched = frequencyOptions.find((f) => f.label === freqLabel);
    if (matched) {
      setTimes(matched.times);
    }
  };

  const handleTimeChange = (index: number, newTime: string) => {
    const updated = [...times];
    updated[index] = newTime;
    setTimes(updated);
  };

  const handleSelectPurchasedMedicine = (pm: typeof purchasedMedicines[0]) => {
    setName(pm.medicineName);

    // Normalize dosageForm
    const df = pm.dosageForm.toLowerCase();
    let normalizedDf: DosageForm = 'tablet';
    if (df.includes('kapsul')) normalizedDf = 'kapsul';
    else if (df.includes('sirup')) normalizedDf = 'sirup';
    else if (df.includes('salep') || df.includes('krim')) normalizedDf = 'salep';
    else if (df.includes('tetes')) normalizedDf = 'tetes';
    else if (df.includes('inhaler')) normalizedDf = 'inhaler';
    setDosageForm(normalizedDf);

    setStrength(pm.strength);
    setCategory(pm.category || 'Obat Apotek Vitaria');
    setDoseUnit(pm.unit || (normalizedDf === 'sirup' ? 'Sendok Takar (5ml)' : 'Tablet'));
    setInstructions((pm.instructions as any) || 'Sesudah Makan');

    // Smart frequency recommendation
    const medLower = pm.medicineName.toLowerCase();
    if (medLower.includes('amoxicillin') || medLower.includes('cefixime') || medLower.includes('antasida')) {
      handleFrequencyChange('3x Sehari');
    } else if (medLower.includes('cetirizine') || medLower.includes('vitamin')) {
      handleFrequencyChange('1x Sehari');
    } else {
      handleFrequencyChange('3x Sehari');
    }

    setSelectedSourceMedicine(pm.medicineName);
    setErrorName('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorName('Nama obat wajib diisi.');
      return;
    }

    if (editTarget && editTarget.id) {
      updateMedication(editTarget.id, {
        name: name.trim(),
        dosageForm,
        strength: strength.trim(),
        category: category.trim(),
        dosePerTake,
        doseUnit,
        frequency,
        times,
        instructions,
        startDate,
        endDate: endDate || undefined,
        reminderEnabled,
        reminderSound,
        notes: notes.trim()
      });
    } else {
      addMedication({
        name: name.trim(),
        dosageForm,
        strength: strength.trim(),
        category: category.trim(),
        dosePerTake,
        doseUnit,
        frequency,
        times,
        instructions,
        startDate,
        endDate: endDate || undefined,
        status: 'active',
        reminderEnabled,
        reminderSound,
        notes: notes.trim()
      });
    }

    onClose();
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={editTarget ? 'Ubah Informasi Obat' : 'Tambah Obat Pribadi'}
      subtitle="Atur dosis, jadwal alarm notifikasi, dan cara konsumsi"
      maxHeight="max-h-[92vh]"
    >
      <form onSubmit={handleSubmit} className="space-y-5 pb-4">
        {/* Quick-Picker: Obat dari Riwayat Pembelian Apotek Vitaria */}
        {!editTarget?.id && purchasedMedicines.length > 0 && (
          <div className="bg-gradient-to-br from-[#F0F5ED] to-[#E6EEE3] rounded-3xl p-4 border border-[#84A282]/35 shadow-xs space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-[#587A58] text-white flex items-center justify-center text-[10px] shadow-xs">
                  <FAIcon name="boxes" />
                </div>
                <span className="text-xs font-extrabold text-[#26382B]">
                  Pilih dari Obat yang Anda Beli
                </span>
              </div>
              <span className="text-[10px] bg-[#84A282]/25 text-[#26382B] font-bold px-2 py-0.5 rounded-full">
                Otomatis
              </span>
            </div>

            <p className="text-[11px] text-[#587A58] leading-relaxed">
              Ketuk obat yang pernah Anda beli di Apotek Vitaria untuk mengisi nama, sediaan, dan dosis otomatis:
            </p>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5 no-scrollbar">
              {purchasedMedicines.map((pm, idx) => {
                const isSelected = selectedSourceMedicine === pm.medicineName || name === pm.medicineName;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectPurchasedMedicine(pm)}
                    className={`shrink-0 p-2.5 rounded-2xl border text-left transition-all btn-press flex items-center gap-2.5 ${
                      isSelected
                        ? 'bg-[#587A58] text-white border-[#587A58] shadow-sm'
                        : 'bg-white hover:bg-[#F9FAF8] active:bg-[#F0F4EE] text-[#26382B] border-[#84A282]/30 shadow-xs'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs shrink-0 ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-[#E6EEE3] text-[#587A58]'
                      }`}
                    >
                      <FAIcon
                        name={
                          pm.dosageForm.toLowerCase().includes('sirup')
                            ? 'syrup'
                            : pm.dosageForm.toLowerCase().includes('kapsul')
                            ? 'capsule'
                            : 'tablet'
                        }
                      />
                    </div>
                    <div className="pr-1">
                      <p className="text-xs font-bold leading-tight line-clamp-1">{pm.medicineName}</p>
                      <p className={`text-[10px] mt-0.5 ${isSelected ? 'text-white/80' : 'text-[#778477]'}`}>
                        {pm.strength} • {pm.dosageForm}
                      </p>
                    </div>
                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-white/20 text-white flex items-center justify-center text-[10px] shrink-0 ml-1">
                        <FAIcon name="check" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {selectedSourceMedicine && (
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#587A58] pt-1">
                <FAIcon name="circleCheck" className="text-xs" />
                <span>
                  Obat <b>{selectedSourceMedicine}</b> berhasil dipilih! Sediaan dan dosis terisi otomatis.
                </span>
              </div>
            )}
          </div>
        )}

        {/* Section 1: Informasi Obat */}
        <section aria-labelledby="section-sheet-info" className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-[#587A58] uppercase tracking-wider">
            <FAIcon name="pill" />
            <h4 id="section-sheet-info">1. Identitas Obat</h4>
          </div>

          <Input
            label="Nama Obat *"
            placeholder="Misal: Paracetamol, Vitamin C 500 mg"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (errorName) setErrorName('');
            }}
            error={errorName}
            icon="pill"
            required
          />

          <div>
            <label className="block text-xs font-semibold text-[#26382B] mb-1.5">
              Bentuk Sediaan
            </label>
            <div className="grid grid-cols-3 gap-2">
              {dosageForms.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => {
                    setDosageForm(item.id);
                    if (item.id === 'sirup') setDoseUnit('Sendok Takar (5ml)');
                    else if (item.id === 'kapsul') setDoseUnit('Kapsul');
                    else if (item.id === 'tetes') setDoseUnit('Tetes');
                    else if (item.id === 'salep') setDoseUnit('Olesan Tipis');
                    else if (item.id === 'inhaler') setDoseUnit('Semprotan');
                    else setDoseUnit('Tablet');
                  }}
                  className={`py-2 px-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all btn-press ${
                    dosageForm === item.id
                      ? 'bg-[#E6EEE3] border-[#84A282] text-[#587A58] shadow-sm font-bold'
                      : 'bg-[#F7F9F5] border-[#E7EBE4] text-[#778477] hover:bg-white'
                  }`}
                >
                  <FAIcon name={item.icon as any} className="text-xs" />
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <Input
              label="Kekuatan Obat"
              placeholder="500 mg"
              value={strength}
              onChange={(e) => setStrength(e.target.value)}
            />
            <Input
              label="Kategori"
              placeholder="Vitamin, Alergi"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
          </div>
        </section>

        {/* Section 2: Dosis & Instruksi */}
        <section aria-labelledby="section-sheet-dosis" className="space-y-3 pt-3 border-t border-[#E7EBE4]">
          <div className="flex items-center gap-2 text-xs font-bold text-[#587A58] uppercase tracking-wider">
            <FAIcon name="sliders" />
            <h4 id="section-sheet-dosis">2. Atur Dosis</h4>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <Input
              label="Dosis Sekali Minum"
              placeholder="1"
              value={dosePerTake}
              onChange={(e) => setDosePerTake(e.target.value)}
            />
            <Input
              label="Satuan Dosis"
              placeholder="Tablet"
              value={doseUnit}
              onChange={(e) => setDoseUnit(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#26382B] mb-1.5">
              Instruksi Konsumsi
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                'Sesudah Makan',
                'Sebelum Makan',
                'Bersama Makan',
                'Sesuai Petunjuk'
              ].map((inst) => (
                <button
                  type="button"
                  key={inst}
                  onClick={() => setInstructions(inst as any)}
                  className={`py-2 px-2.5 rounded-xl text-xs font-medium border text-left transition-all ${
                    instructions === inst
                      ? 'bg-[#E6EEE3] border-[#84A282] text-[#587A58] font-bold'
                      : 'bg-white border-[#E7EBE4] text-[#778477]'
                  }`}
                >
                  {inst}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Section 3: Jadwal & Pengingat */}
        <section aria-labelledby="section-sheet-jadwal" className="space-y-3 pt-3 border-t border-[#E7EBE4]">
          <div className="flex items-center gap-2 text-xs font-bold text-[#587A58] uppercase tracking-wider">
            <FAIcon name="clock" />
            <h4 id="section-sheet-jadwal">3. Jadwal Alarm Notifikasi</h4>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#26382B] mb-1.5">
              Frekuensi Minum
            </label>
            <div className="flex flex-wrap gap-1.5">
              {frequencyOptions.map((f) => (
                <button
                  type="button"
                  key={f.label}
                  onClick={() => handleFrequencyChange(f.label)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    frequency === f.label
                      ? 'bg-[#84A282] text-white shadow-sm'
                      : 'bg-[#F0F5ED] text-[#778477] hover:text-[#26382B]'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Times array */}
          <div className="bg-[#F7F9F5] rounded-2xl p-3 border border-[#E7EBE4] space-y-1.5">
            <span className="text-[11px] font-semibold text-[#26382B] block">
              Jam Alarm Notifikasi:
            </span>
            <div className="grid grid-cols-2 gap-2">
              {times.map((t, idx) => (
                <div key={idx} className="flex items-center gap-1.5 bg-white p-2 rounded-xl border border-[#E7EBE4]">
                  <FAIcon name="clock" className="text-xs text-[#84A282]" />
                  <input
                    type="time"
                    value={t}
                    onChange={(e) => handleTimeChange(idx, e.target.value)}
                    className="w-full text-xs font-bold text-[#26382B] bg-transparent focus:outline-none"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <Input
              label="Mulai Konsumsi"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <Input
              label="Selesai (Opsional)"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          {/* Toggles */}
          <div className="space-y-2 pt-1">
            <label className="flex items-center justify-between p-2.5 rounded-xl bg-[#F7F9F5] border border-[#E7EBE4] cursor-pointer">
              <span className="text-xs font-bold text-[#26382B]">Aktifkan Pengingat</span>
              <input
                type="checkbox"
                checked={reminderEnabled}
                onChange={(e) => setReminderEnabled(e.target.checked)}
                className="w-4 h-4 text-[#84A282] rounded accent-[#84A282]"
              />
            </label>
            <label className="flex items-center justify-between p-2.5 rounded-xl bg-[#F7F9F5] border border-[#E7EBE4] cursor-pointer">
              <span className="text-xs font-bold text-[#26382B]">Bunyikan Suara Alarm</span>
              <input
                type="checkbox"
                checked={reminderSound}
                onChange={(e) => setReminderSound(e.target.checked)}
                className="w-4 h-4 text-[#84A282] rounded accent-[#84A282]"
              />
            </label>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#26382B] mb-1">
              Catatan Tambahan (Opsional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Misal: Diminum setelah makan siang..."
              rows={2}
              className="w-full bg-white border border-[#E7EBE4] rounded-2xl p-2.5 text-xs text-[#26382B] focus:outline-none focus:ring-2 focus:ring-[#84A282]/30"
            />
          </div>
        </section>

        {/* Sticky Action Button */}
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

export default AddMedication;
