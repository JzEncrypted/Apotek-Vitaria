import React from 'react';
import { FAIcon, IconKey } from '../common/FAIcon';
import { StaffTab } from './StaffBottomNav';
import { useAuth } from '../../context/AuthContext';

interface StaffSidebarProps {
  activeTab: StaffTab;
  onTabChange: (tab: StaffTab) => void;
  lowStockCount?: number;
}

export const StaffSidebar: React.FC<StaffSidebarProps> = ({
  activeTab,
  onTabChange,
  lowStockCount = 0
}) => {
  const { currentUser } = useAuth();

  const menuItems: { id: StaffTab; label: string; icon: IconKey; badge?: number }[] = [
    { id: 'dashboard', label: 'Dashboard Operasional', icon: 'trendUp' },
    { 
      id: 'medicines', 
      label: 'Katalog & Stok Obat', 
      icon: 'pill',
      badge: lowStockCount > 0 ? lowStockCount : undefined
    },
    { id: 'customers', label: 'Data Pelanggan', icon: 'users' },
    { id: 'reports', label: 'Laporan Penjualan', icon: 'document' },
    { id: 'profile', label: 'Profil Staf', icon: 'user' }
  ];

  return (
    <aside 
      aria-label="Sidebar Petugas Desktop"
      className="hidden lg:flex w-64 bg-white border-r border-[#E7EBE4] flex-col justify-between p-5 min-h-screen shrink-0"
    >
      <div>
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-2 py-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#84A282] to-[#587A58] flex items-center justify-center text-white shadow-soft">
            <FAIcon name="heartPulse" className="text-lg" />
          </div>
          <div>
            <h2 className="font-bold text-[#26382B] text-base leading-tight">Apotek Vitaria</h2>
            <p className="text-[11px] font-medium text-[#778477]">Panel Khusus Petugas</p>
          </div>
        </div>

        {/* Navigation List */}
        <nav aria-label="Navigasi Menu Petugas" className="space-y-1">
          {menuItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-[#E6EEE3] text-[#587A58] font-bold shadow-sm'
                    : 'text-[#778477] hover:bg-[#F0F5ED] hover:text-[#26382B]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <FAIcon
                    name={item.icon}
                    className={`text-base ${isActive ? 'text-[#587A58]' : 'text-[#778477]'}`}
                  />
                  <span>{item.label}</span>
                </div>

                {item.badge !== undefined && (
                  <span className="px-2 py-0.5 rounded-full bg-[#D96A68] text-white text-[10px] font-bold">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Staff Account Summary */}
      <div className="pt-4 border-t border-[#E7EBE4] px-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#E6EEE3] text-[#587A58] flex items-center justify-center font-bold text-xs border border-[#84A282]/30 overflow-hidden">
            {currentUser.avatarUrl ? (
              <img src={currentUser.avatarUrl} alt={currentUser.name} className="w-full h-full object-cover" />
            ) : (
              <FAIcon name="doctor" />
            )}
          </div>
          <div>
            <p className="text-xs font-bold text-[#26382B] truncate max-w-[120px]">{currentUser.name}</p>
            <p className="text-[10px] text-[#778477]">Staf Farmasi</p>
          </div>
        </div>
        <div className="w-2.5 h-2.5 rounded-full bg-[#4E9B69]" title="Online" />
      </div>
    </aside>
  );
};

export default StaffSidebar;
