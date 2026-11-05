import React from 'react';
import { LiquidNavbar, NimbusIcons, LiquidNavItem } from '../ui/liquid-glass-navbar';

export type StaffTab = 'dashboard' | 'medicines' | 'customers' | 'reports' | 'profile';

interface StaffBottomNavProps {
  activeTab: StaffTab;
  onTabChange: (tab: StaffTab) => void;
  lowStockCount?: number;
}

const STAFF_TABS: StaffTab[] = ['dashboard', 'medicines', 'customers', 'reports', 'profile'];

export const StaffBottomNav: React.FC<StaffBottomNavProps> = ({
  activeTab,
  onTabChange,
  lowStockCount = 0
}) => {
  const activeIndex = Math.max(0, STAFF_TABS.indexOf(activeTab));

  const items: LiquidNavItem[] = [
    { label: 'Dashboard', icon: NimbusIcons.dashboard, fx: 'glow' },
    { 
      label: 'Obat', 
      icon: NimbusIcons.pill, 
      fx: 'drop',
      badge: lowStockCount > 0 ? lowStockCount : undefined
    },
    { label: 'Pelanggan', icon: NimbusIcons.users, fx: 'wave' },
    { label: 'Laporan', icon: NimbusIcons.report, fx: 'pop' },
    { label: 'Profil', icon: NimbusIcons.user, fx: 'spin' },
  ];

  return (
    <div 
      aria-label="Navigasi Petugas Mobile"
      className="fixed sm:absolute bottom-1.5 left-0 right-0 z-40 flex justify-center pointer-events-none px-2 select-none"
      style={{ paddingBottom: 'max(0.1rem, env(safe-area-inset-bottom))' }}
    >
      <div className="pointer-events-auto">
        <LiquidNavbar
          active={activeIndex}
          onChange={(index) => {
            const tab = STAFF_TABS[index];
            if (tab) onTabChange(tab);
          }}
          items={items}
          tone="light"
          sound={true}
        />
      </div>
    </div>
  );
};

export default StaffBottomNav;
