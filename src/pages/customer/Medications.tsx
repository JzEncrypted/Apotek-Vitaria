import React, { useState, useMemo } from 'react';
import { useMedication } from '../../context/MedicationContext';
import { useOrder } from '../../context/OrderContext';
import { UserMedication } from '../../types';
import { FAIcon } from '../../components/common/FAIcon';
import { MedicationCard } from '../../components/cards/MedicationCard';
import { EmptyState } from '../../components/common/EmptyState';
import { BottomSheet } from '../../components/common/BottomSheet';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';

interface MedicationsProps {
  onOpenAddModal: () => void;
  onEditMedication: (medication: UserMedication) => void;
}

export const Medications: React.FC<MedicationsProps> = ({
  onOpenAddModal,
  onEditMedication
}) => {
  const { medications, deleteMedication, updateMedication } = useMedication();
  const { orders } = useOrder();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'completed' | 'paused'>('all');
  const [selectedMed, setSelectedMed] = useState<UserMedication | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Purchased medicines from pharmacy that are NOT yet in the user's active medications
  const unscheduledPurchases = useMemo(() => {
    const list: Array<{
      name: string;
      dosageForm: string;
      strength: string;
      category?: string;
      unit: string;
      instructions?: string;
    }> = [];
    const scheduledNames = new Set(medications.map((m) => m.name.toLowerCase().trim()));
    const seen = new Set<string>();

    orders.forEach((o) => {
      if (o.orderStatus === 'cancelled') return;
      o.items.forEach((item) => {
        const key = item.medicineName.toLowerCase().trim();
        if (!scheduledNames.has(key) && !seen.has(key)) {
          seen.add(key);
          list.push({
            name: item.medicineName,
            dosageForm: item.dosageForm || 'tablet',
            strength: item.strength || '500 mg',
            category: item.category || 'Obat Apotek Vitaria',
            unit: item.unit || 'Tablet',
            instructions: item.instructions || 'Sesudah Makan'
          });
        }
      });
    });
    return list;
  }, [orders, medications]);

  const filteredMeds = useMemo(() => {
    return medications.filter((med) => {
      const matchSearch =
        med.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        med.category.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchSearch) return false;
      if (activeFilter === 'all') return true;
      return med.status === activeFilter;
    });
  }, [medications, searchQuery, activeFilter]);

  const handleToggleStatus = (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'active' ? 'paused' : 'active';
    updateMedication(id, { status: nextStatus });
    if (selectedMed?.id === id) {
      setSelectedMed({ ...selectedMed, status: nextStatus });
    }
  };

  const handleDelete = (id: string) => {
    deleteMedication(id);
    setSelectedMed(null);
    setDeleteConfirmId(null);
  };

  return (
    <div className="w-full max-w-lg mx-auto px-4 py-5 space-y-5 pb-24">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-[#26382B] tracking-tight">Obat Saya</h2>
          <p className="text-xs text-[#778477] mt-0.5">
            Kelola semua obat pribadi dan jadwal konsumsi
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          icon="plus"
          onClick={onOpenAddModal}
          className="shadow-soft"
        >
          Tambah
        </Button>
      </header>

      {/* Search Input */}
      <div className="relative">
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#778477] text-xs">
          <FAIcon name="search" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cari nama atau kategori obat..."
          className="w-full bg-white border border-[#E7EBE4] rounded-2xl pl-9 pr-4 py-2.5 text-xs text-[#26382B] placeholder-[#778477]/60 focus:outline-none focus:ring-2 focus:ring-[#84A282]/30 focus:border-[#84A282]"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#778477] hover:text-[#26382B] text-xs"
          >
            <FAIcon name="close" />
          </button>
        )}
      </div>

      {/* Unscheduled Purchased Medicines Banner */}
      {unscheduledPurchases.length > 0 && !searchQuery && (
        <div className="bg-gradient-to-br from-[#F0F5ED] to-[#E6EEE3] rounded-3xl p-4 border border-[#84A282]/40 shadow-soft-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-[#587A58] text-white flex items-center justify-center text-xs shadow-xs">
                <FAIcon name="bell" />
              </div>
              <div>
                <h4 className="text-xs font-extrabold text-[#26382B]">
                  Obat dari Pembelian Apotek Vitaria
                </h4>
                <p className="text-[10px] text-[#587A58] font-medium">
                  {unscheduledPurchases.length} obat belum dijadwalkan pengingat minumnya
                </p>
              </div>
            </div>
            <span className="text-[10px] font-bold text-[#587A58] bg-white/80 px-2 py-0.5 rounded-full border border-[#84A282]/30">
              Rekomendasi
            </span>
          </div>

          <div className="space-y-2">
            {unscheduledPurchases.map((up, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl p-3 border border-[#84A282]/20 flex items-center justify-between gap-3 shadow-xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-[#F0F5ED] text-[#587A58] flex items-center justify-center text-xs shrink-0">
                    <FAIcon
                      name={
                        up.dosageForm.toLowerCase().includes('sirup')
                          ? 'syrup'
                          : up.dosageForm.toLowerCase().includes('kapsul')
                          ? 'capsule'
                          : 'tablet'
                      }
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[#26382B] truncate">{up.name}</p>
                    <p className="text-[10px] text-[#778477]">
                      {up.strength} • {up.dosageForm}
                    </p>
                  </div>
                </div>

                <Button
                  variant="primary"
                  size="sm"
                  icon="plus"
                  onClick={() =>
                    onEditMedication({
                      id: '',
                      userId: '',
                      name: up.name,
                      dosageForm: (up.dosageForm.toLowerCase().includes('sirup')
                        ? 'sirup'
                        : up.dosageForm.toLowerCase().includes('kapsul')
                        ? 'kapsul'
                        : 'tablet') as any,
                      strength: up.strength,
                      category: up.category || 'Obat Apotek Vitaria',
                      dosePerTake: '1',
                      doseUnit: up.unit || 'Tablet',
                      frequency: '3x Sehari',
                      times: ['07:00', '13:00', '19:00'],
                      instructions: (up.instructions as any) || 'Sesudah Makan',
                      startDate: new Date().toISOString().slice(0, 10),
                      status: 'active',
                      reminderEnabled: true,
                      reminderSound: true,
                      createdAt: new Date().toISOString()
                    })
                  }
                  className="shrink-0 text-xs py-1.5 px-3"
                >
                  Pasang Pengingat
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {[
          { id: 'all', label: 'Semua' },
          { id: 'active', label: 'Aktif' },
          { id: 'completed', label: 'Selesai' },
          { id: 'paused', label: 'Dihentikan' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveFilter(tab.id as any)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              activeFilter === tab.id
                ? 'bg-[#84A282] text-white shadow-soft-sm'
                : 'bg-white border border-[#E7EBE4] text-[#778477] hover:bg-[#F0F5ED]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Medications List */}
      <div className="space-y-3">
        {filteredMeds.length > 0 ? (
          filteredMeds.map((med) => (
            <MedicationCard
              key={med.id}
              medication={med}
              onSelect={(m) => setSelectedMed(m)}
              onEdit={(m) => onEditMedication(m)}
              onDelete={(id) => setDeleteConfirmId(id)}
              onToggleStatus={handleToggleStatus}
            />
          ))
        ) : (
          <EmptyState
            icon="pill"
            title={searchQuery ? 'Obat Tidak Ditemukan' : 'Belum Ada Obat Tersimpan'}
            description={
              searchQuery
                ? `Tidak ada obat dengan kata kunci "${searchQuery}". Coba kata kunci lain.`
                : 'Mulai atur jadwal konsumsi obat agar kamu tidak pernah melewatkan waktu minum obat.'
            }
            actionLabel={searchQuery ? 'Reset Pencarian' : 'Tambahkan Obat Pertama'}
            onAction={searchQuery ? () => setSearchQuery('') : onOpenAddModal}
            actionIcon={searchQuery ? 'refresh' : 'plus'}
          />
        )}
      </div>

      {/* Medication Detail Bottom Sheet */}
      <BottomSheet
        isOpen={Boolean(selectedMed)}
        onClose={() => setSelectedMed(null)}
        title={selectedMed?.name}
        subtitle={selectedMed ? `${selectedMed.category} • ${selectedMed.strength}` : undefined}
      >
        {selectedMed && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E7EBE4]">
              <span className="text-xs font-bold text-[#778477]">Status Penggunaan</span>
              <Badge variant={selectedMed.status} />
            </div>

            {/* Dosage Information */}
            <div className="bg-[#F7F9F5] rounded-2xl p-3.5 space-y-2 border border-[#E7EBE4]">
              <div className="flex justify-between text-xs">
                <span className="text-[#778477]">Dosis per konsumsi:</span>
                <span className="font-bold text-[#26382B]">
                  {selectedMed.dosePerTake} {selectedMed.doseUnit}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[#778477]">Frekuensi:</span>
                <span className="font-bold text-[#26382B]">{selectedMed.frequency}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[#778477]">Instruksi:</span>
                <span className="font-bold text-[#587A58]">{selectedMed.instructions}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[#778477]">Jadwal Pengingat:</span>
                <span className="font-bold text-[#26382B]">{selectedMed.times.join(', ')} WIB</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[#778477]">Mulai konsumsi:</span>
                <span className="font-semibold text-[#26382B]">{selectedMed.startDate}</span>
              </div>
              {selectedMed.endDate && (
                <div className="flex justify-between text-xs">
                  <span className="text-[#778477]">Target selesai:</span>
                  <span className="font-semibold text-[#26382B]">{selectedMed.endDate}</span>
                </div>
              )}
            </div>

            {/* Notes */}
            {selectedMed.notes && (
              <div className="bg-white rounded-2xl p-3.5 border border-[#E7EBE4] space-y-1">
                <span className="text-[11px] font-bold text-[#778477] uppercase tracking-wider">
                  Catatan Khusus
                </span>
                <p className="text-xs text-[#26382B] leading-relaxed">{selectedMed.notes}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-2 space-y-2">
              <Button
                variant="outline"
                size="md"
                fullWidth
                icon="edit"
                onClick={() => {
                  const m = selectedMed;
                  setSelectedMed(null);
                  onEditMedication(m);
                }}
              >
                Ubah Informasi Obat
              </Button>

              <Button
                variant={selectedMed.status === 'active' ? 'secondary' : 'primary'}
                size="md"
                fullWidth
                icon={selectedMed.status === 'active' ? 'minus' : 'circleCheck'}
                onClick={() => handleToggleStatus(selectedMed.id, selectedMed.status)}
              >
                {selectedMed.status === 'active' ? 'Nonaktifkan Sementara' : 'Aktifkan Kembali'}
              </Button>

              <Button
                variant="danger"
                size="md"
                fullWidth
                icon="delete"
                onClick={() => {
                  const id = selectedMed.id;
                  setSelectedMed(null);
                  setDeleteConfirmId(id);
                }}
              >
                Hapus Obat
              </Button>
            </div>
          </div>
        )}
      </BottomSheet>

      {/* Delete Confirmation Dialog */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setDeleteConfirmId(null)}
          />
          <div className="relative bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-[#E7EBE4] text-center space-y-4 animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-[#D96A68]/15 text-[#D96A68] mx-auto flex items-center justify-center text-xl">
              <FAIcon name="alert" />
            </div>
            <div>
              <h3 className="font-bold text-base text-[#26382B]">Hapus Obat Pribadi?</h3>
              <p className="text-xs text-[#778477] mt-1 leading-relaxed">
                Tindakan ini akan menghapus obat beserta seluruh jadwal reminder yang terkait.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2.5 pt-2">
              <Button
                variant="outline"
                size="md"
                onClick={() => setDeleteConfirmId(null)}
              >
                Batal
              </Button>
              <Button
                variant="danger"
                size="md"
                onClick={() => handleDelete(deleteConfirmId)}
              >
                Ya, Hapus
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Medications;
