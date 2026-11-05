import React from 'react';
import { LiquidNavbar, NimbusIcons, LiquidNavItem } from '../ui/liquid-glass-navbar';

export type CustomerTab = 'home' | 'medications' | 'reminders' | 'history' | 'profile';

interface CustomerBottomNavProps {
  activeTab: CustomerTab;
  onTabChange: (tab: CustomerTab) => void;
  unresolvedRemindersCount?: number;
}

const CUSTOMER_TABS: CustomerTab[] = ['home', 'medications', 'reminders', 'history', 'profile'];

export const CustomerBottomNav: React.FC<CustomerBottomNavProps> = ({
  activeTab,
  onTabChange,
  unresolvedRemindersCount = 0
}) => {
  const activeIndex = Math.max(0, CUSTOMER_TABS.indexOf(activeTab));

  const items: LiquidNavItem[] = [
    { label: 'Beranda', icon: NimbusIcons.home, fx: 'glow' },
    { label: 'Obat', icon: NimbusIcons.pill, fx: 'drop' },
    { 
      label: 'Reminder', 
      icon: NimbusIcons.bell, 
      fx: 'pop',
      badge: unresolvedRemindersCount > 0 ? unresolvedRemindersCount : undefined
    },
    { label: 'Riwayat', icon: NimbusIcons.history, fx: 'spin' },
    { label: 'Profil', icon: NimbusIcons.user, fx: 'wave' },
  ];

  return (
    <div 
      aria-label="Navigasi Pelanggan"
      className="fixed sm:absolute bottom-1.5 left-0 right-0 z-40 flex justify-center pointer-events-none px-2 select-none"
      style={{ paddingBottom: 'max(0.1rem, env(safe-area-inset-bottom))' }}
    >
      <div className="pointer-events-auto">
        <LiquidNavbar
          active={activeIndex}
          onChange={(index) => {
            const tab = CUSTOMER_TABS[index];
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

export default CustomerBottomNav;
