import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useMedication } from '../../context/MedicationContext';
import { FAIcon } from '../../components/common/FAIcon';
import { EmptyState } from '../../components/common/EmptyState';
import { CustomerTab } from '../../components/layout/CustomerBottomNav';

interface NotificationsProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tab: CustomerTab) => void;
}

export const Notifications: React.FC<NotificationsProps> = ({
  isOpen,
  onClose,
  onNavigateTab
}) => {
  const {
    notifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification
  } = useMedication();

  const [activeTab, setActiveTab] = useState<'all' | 'reminder' | 'info' | 'system'>('all');

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredNotifs = notifications.filter((n) => {
    if (activeTab === 'all') return true;
    return n.type === activeTab;
  });

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'reminder':
        return { icon: 'bell', bg: 'bg-[#D99B42]/15 text-[#D99B42]' };
      case 'info':
        return { icon: 'info', bg: 'bg-[#648BB7]/15 text-[#648BB7]' };
      case 'system':
      default:
        return { icon: 'shield', bg: 'bg-[#84A282]/15 text-[#587A58]' };
    }
  };

  const handleItemClick = (notif: any) => {
    markNotificationAsRead(notif.id);
    if (notif.linkTab) {
      onClose();
      onNavigateTab(notif.linkTab as CustomerTab);
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return createPortal(
    <div className="fixed inset-0 z-50 flex justify-center bg-black/30 backdrop-blur-xs animate-fadeIn">
      {/* Full Page Mobile Container */}
      <div className="w-full max-w-lg h-full bg-[#F7F9F5] flex flex-col shadow-2xl animate-slideInRight">
        {/* Top Header Bar */}
        <header className="bg-white border-b border-[#E5EAE3] px-4 py-3.5 flex items-center justify-between shrink-0 shadow-xs">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-full hover:bg-[#F0F4EE] flex items-center justify-center text-[#526352] transition-colors"
              aria-label="Kembali"
            >
              <FAIcon name="arrowLeft" className="text-base" />
            </button>
            <div>
              <h2 className="text-base font-extrabold text-[#1F2E23] leading-tight flex items-center gap-2">
                <span>Pusat Notifikasi</span>
                {unreadCount > 0 && (
                  <span className="text-[10px] font-bold text-white bg-[#84A282] px-2 py-0.5 rounded-full">
                    {unreadCount} baru
                  </span>
                )}
              </h2>
              <p className="text-[11px] text-[#778477]">
                Pemberitahuan jadwal minum obat & aktivitas akun
              </p>
            </div>
          </div>

          {unreadCount > 0 && (
            <button
              type="button"
              onClick={markAllNotificationsAsRead}
              className="text-xs font-bold text-[#587A58] hover:text-[#3B543B] transition-colors px-2 py-1 rounded-lg hover:bg-[#F0F5ED]"
            >
              Tandai Semua
            </button>
          )}
        </header>

        {/* Category Filters Bar */}
        <div className="bg-white/80 border-b border-[#E5EAE3] px-4 py-2.5 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0 backdrop-blur-sm">
          {[
            { id: 'all', label: 'Semua', count: notifications.length },
            { id: 'reminder', label: 'Pengingat Obat', count: notifications.filter(n => n.type === 'reminder').length },
            { id: 'info', label: 'Info Apotek', count: notifications.filter(n => n.type === 'info').length },
            { id: 'system', label: 'Sistem', count: notifications.filter(n => n.type === 'system').length }
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                activeTab === tab.id
                  ? 'bg-[#84A282] text-white shadow-soft-sm'
                  : 'bg-[#F0F5ED] text-[#637563] hover:text-[#26382B] hover:bg-[#E4ECE1]'
              }`}
            >
              <span>{tab.label}</span>
              {tab.count > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    activeTab === tab.id
                      ? 'bg-white/30 text-white'
                      : 'bg-white text-[#778477]'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Scrollable Notification List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredNotifs.length > 0 ? (
            filteredNotifs.map((item) => {
              const iconConfig = getNotifIcon(item.type);
              return (
                <div
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  className={`p-4 rounded-3xl border transition-all cursor-pointer relative group ${
                    item.isRead
                      ? 'bg-white border-[#E7EBE4] shadow-2xs'
                      : 'bg-[#F2F7F0] border-[#C3D7BF] shadow-soft-sm'
                  }`}
                >
                  {/* Unread Accent Dot */}
                  {!item.isRead && (
                    <span className="absolute top-4 right-4 w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-xs" />
                  )}

                  <div className="flex items-start gap-3.5 pr-6">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center text-sm shrink-0 shadow-2xs ${iconConfig.bg}`}
                    >
                      <FAIcon name={iconConfig.icon as any} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className="font-extrabold text-xs sm:text-sm text-[#26382B]">
                        {item.title}
                      </h4>
                      <p className="text-xs text-[#5C6E5C] mt-1 leading-relaxed">
                        {item.message}
                      </p>
                      <div className="flex items-center gap-3 mt-2 text-[10px] text-[#778477]">
                        <span>{item.timestamp}</span>
                        {item.linkTab && (
                          <span className="text-[#587A58] font-bold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                            <span>Buka Halaman</span>
                            <FAIcon name="arrowRight" className="text-[8px]" />
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Delete Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNotification(item.id);
                    }}
                    className="absolute bottom-3 right-3 text-[#92A292] hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors"
                    title="Hapus notifikasi"
                    aria-label="Hapus notifikasi"
                  >
                    <FAIcon name="trash" className="text-xs" />
                  </button>
                </div>
              );
            })
          ) : (
            <div className="py-12">
              <EmptyState
                icon="bell"
                title="Tidak Ada Notifikasi"
                description="Semua pemberitahuan jadwal obat dan informasi apotek akan muncul di sini."
              />
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default Notifications;
