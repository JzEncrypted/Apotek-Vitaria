import React, { useState } from 'react';
import { UserMedication } from '../../types';
import { FAIcon } from '../common/FAIcon';
import { Badge } from '../common/Badge';

interface MedicationCardProps {
  medication: UserMedication;
  onSelect: (medication: UserMedication) => void;
  onEdit: (medication: UserMedication) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string, currentStatus: string) => void;
}

export const MedicationCard: React.FC<MedicationCardProps> = ({
  medication,
  onSelect,
  onEdit,
  onDelete,
  onToggleStatus
}) => {
  const [showMenu, setShowMenu] = useState(false);

  const getDosageIcon = (form: string) => {
    switch (form) {
      case 'kapsul':
        return 'capsule';
      case 'sirup':
        return 'syrup';
      case 'salep':
        return 'salep';
      case 'tetes':
        return 'drops';
      default:
        return 'pill';
    }
  };

  return (
    <div className="relative bg-white rounded-3xl p-4 sm:p-5 border border-[#E7EBE4] shadow-soft-sm transition-all duration-200 hover:border-[#84A282]/40 hover:shadow-soft">
      <div className="flex items-start justify-between gap-3">
        {/* Medication Info (Clickable for detail) */}
        <div
          onClick={() => onSelect(medication)}
          className="flex items-start gap-3.5 flex-1 cursor-pointer"
        >
          <div className="w-12 h-12 rounded-2xl bg-[#F0F5ED] text-[#587A58] flex items-center justify-center text-xl shrink-0 border border-[#84A282]/20 mt-0.5">
            <FAIcon name={getDosageIcon(medication.dosageForm)} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-bold text-[#26382B] text-sm sm:text-base leading-snug">
                {medication.name}
              </h4>
              <Badge variant={medication.status} />
            </div>

            <p className="text-[11px] text-[#778477] font-medium mt-0.5">
              {medication.category} • {medication.dosePerTake} {medication.doseUnit} ({medication.strength})
            </p>

            <div className="flex items-center gap-2 mt-2 flex-wrap text-xs">
              <span className="px-2 py-0.5 rounded-lg bg-[#F0F5ED] text-[#587A58] font-semibold text-[11px]">
                {medication.frequency}
              </span>
              <span className="text-[#778477] text-[11px] flex items-center gap-1">
                <FAIcon name="clock" className="text-[10px]" />
                {medication.times.join(', ')}
              </span>
            </div>
          </div>
        </div>

        {/* Kebab Action Menu */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="w-8 h-8 rounded-full hover:bg-[#F0F5ED] text-[#778477] hover:text-[#26382B] flex items-center justify-center transition-colors"
            aria-label="Menu Aksi Obat"
          >
            <FAIcon name="kebab" />
          </button>

          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-20"
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute right-0 top-9 w-44 bg-white rounded-2xl shadow-soft-lg border border-[#E7EBE4] p-1.5 z-30 animate-in fade-in zoom-in-95 duration-150">
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onSelect(medication);
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-[#26382B] hover:bg-[#F0F5ED] flex items-center gap-2"
                >
                  <FAIcon name="info" className="text-[#84A282] text-xs" />
                  <span>Lihat Detail</span>
                </button>
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onEdit(medication);
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-[#26382B] hover:bg-[#F0F5ED] flex items-center gap-2"
                >
                  <FAIcon name="edit" className="text-[#84A282] text-xs" />
                  <span>Edit Obat</span>
                </button>
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onToggleStatus(
                      medication.id,
                      medication.status === 'active' ? 'paused' : 'active'
                    );
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-[#D99B42] hover:bg-[#F0F5ED] flex items-center gap-2"
                >
                  <FAIcon name="minus" className="text-xs" />
                  <span>
                    {medication.status === 'active' ? 'Nonaktifkan' : 'Aktifkan Kembali'}
                  </span>
                </button>
                <div className="my-1 border-t border-[#E7EBE4]" />
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onDelete(medication.id);
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-[#D96A68] hover:bg-[#D96A68]/10 flex items-center gap-2"
                >
                  <FAIcon name="delete" className="text-xs" />
                  <span>Hapus Obat</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MedicationCard;
