import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { useMedication } from './context/MedicationContext';
import { usePharmacy } from './context/PharmacyContext';
import { SplashScreen } from './components/layout/SplashScreen';
import { CustomerBottomNav, CustomerTab } from './components/layout/CustomerBottomNav';
import { StaffBottomNav, StaffTab } from './components/layout/StaffBottomNav';

// Customer Pages
import { CustomerHome } from './pages/customer/Home';
import { Medications } from './pages/customer/Medications';
import { AddMedication } from './pages/customer/AddMedication';
import { Reminders } from './pages/customer/Reminders';
import { History } from './pages/customer/History';
import { Notifications } from './pages/customer/Notifications';
import { Profile } from './pages/customer/Profile';
import { PharmacyInfoModal } from './pages/customer/PharmacyInfoModal';
import { LiveChatDrawer } from './components/chat/LiveChatDrawer';
import { PharmacyStoreModal } from './pages/customer/PharmacyStoreModal';
import { MyOrdersModal } from './pages/customer/MyOrdersModal';
import { SalesReport } from './pages/staff/SalesReport';

// Staff Pages
import { StaffDashboard } from './pages/staff/Dashboard';
import { Catalog } from './pages/staff/Catalog';
import { AddEditMedicine } from './pages/staff/AddEditMedicine';
import { StockAdjustModal } from './pages/staff/StockAdjustModal';
import { Customers } from './pages/staff/Customers';
import { StaffProfile } from './pages/staff/StaffProfile';

// Auth Pages
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';
import { ForgotPassword } from './pages/auth/ForgotPassword';
import { UserMedication, PharmacyMedicine } from './types';

export const App: React.FC = () => {
  const { role, isAuthenticated } = useAuth();
  const { schedules } = useMedication();
  const { stats } = usePharmacy();

  // Splash Screen State
  const [showSplash, setShowSplash] = useState(true);

  // Navigation states
  const [customerTab, setCustomerTab] = useState<CustomerTab>('home');
  const [staffTab, setStaffTab] = useState<StaffTab>('dashboard');
  const [staffReportSubTab, setStaffReportSubTab] = useState<'sales' | 'stock'>('sales');

  // Customer Bottom Sheets & Modals
  const [isAddMedOpen, setIsAddMedOpen] = useState(false);
  const [editMedTarget, setEditMedTarget] = useState<UserMedication | null>(null);
  const [isPharmacyModalOpen, setIsPharmacyModalOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isStoreOpen, setIsStoreOpen] = useState(false);
  const [isMyOrdersOpen, setIsMyOrdersOpen] = useState(false);

  // Staff Bottom Sheets & Modals
  const [isAddStaffMedOpen, setIsAddStaffMedOpen] = useState(false);
  const [editStaffMedTarget, setEditStaffMedTarget] = useState<PharmacyMedicine | null>(null);
  const [stockAdjustTarget, setStockAdjustTarget] = useState<PharmacyMedicine | null>(null);
  const [isStaffChatOpen, setIsStaffChatOpen] = useState(false);
  const [staffChatCustomer, setStaffChatCustomer] = useState<{ name: string; avatarUrl?: string } | null>(null);

  // Auth subpage state
  const [authView, setAuthView] = useState<'login' | 'register' | 'forgot'>('login');

  // Due reminders count
  const dueRemindersCount = schedules.filter((s) => s.status === 'due').length;

  const handleOpenAddMedication = () => {
    setEditMedTarget(null);
    setIsAddMedOpen(true);
  };

  const handleEditCustomerMed = (med: UserMedication) => {
    setEditMedTarget(med);
    setIsAddMedOpen(true);
  };

  const handleOpenAddStaffMed = () => {
    setEditStaffMedTarget(null);
    setIsAddStaffMedOpen(true);
  };

  const handleEditStaffMed = (med: PharmacyMedicine) => {
    setEditStaffMedTarget(med);
    setIsAddStaffMedOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#F7F9F5] flex items-center justify-center p-0 sm:py-6 selection:bg-[#84A282]/20 font-sans text-[#26382B]">
      {/* Cinematic Splash Screen */}
      {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}

      {/* Clean Native Mobile App Container (True Mobile Experience) */}
      <div className="w-full max-w-md h-[100dvh] sm:h-[860px] sm:max-h-[920px] bg-[#F7F9F5] sm:rounded-[36px] sm:shadow-2xl sm:border sm:border-[#E7EBE4] flex flex-col relative overflow-hidden">
        {!isAuthenticated ? (
          /* Authentication Screen */
          <div className="flex-1 flex flex-col justify-center p-4 overflow-y-auto">
            {authView === 'login' && (
              <Login
                onGoToRegister={() => setAuthView('register')}
                onGoToForgot={() => setAuthView('forgot')}
              />
            )}
            {authView === 'register' && (
              <Register onGoToLogin={() => setAuthView('login')} />
            )}
            {authView === 'forgot' && (
              <ForgotPassword onBackToLogin={() => setAuthView('login')} />
            )}
          </div>
        ) : role === 'customer' ? (
          /* CUSTOMER APPLICATION FLOW */
          <div className="flex-1 flex flex-col justify-between min-h-0 h-full overflow-hidden relative">
            <main className="flex-1 overflow-y-auto overscroll-contain pb-24">
              <div key={customerTab} className="page-enter">
                {customerTab === 'home' && (
                  <CustomerHome
                    onNavigateTab={(tab) => setCustomerTab(tab)}
                    onOpenAddModal={handleOpenAddMedication}
                    onOpenPharmacyModal={() => setIsPharmacyModalOpen(true)}
                    onOpenNotifications={() => setIsNotificationsOpen(true)}
                    onOpenChat={() => setIsChatOpen(true)}
                    onOpenStore={() => setIsStoreOpen(true)}
                    onOpenMyOrders={() => setIsMyOrdersOpen(true)}
                  />
                )}
                {customerTab === 'medications' && (
                  <Medications
                    onOpenAddModal={handleOpenAddMedication}
                    onEditMedication={handleEditCustomerMed}
                  />
                )}
                {customerTab === 'reminders' && (
                  <Reminders onOpenAddModal={handleOpenAddMedication} />
                )}
                {customerTab === 'history' && <History />}
                {customerTab === 'profile' && (
                  <Profile
                    onOpenPharmacyModal={() => setIsPharmacyModalOpen(true)}
                    onOpenChat={() => setIsChatOpen(true)}
                    onOpenMyOrders={() => setIsMyOrdersOpen(true)}
                  />
                )}
              </div>
            </main>

            {/* Customer 5-Tab Bottom Navigation (Silky Smooth Liquid Glass) */}
            <CustomerBottomNav
              activeTab={customerTab}
              onTabChange={(tab) => setCustomerTab(tab)}
              unresolvedRemindersCount={dueRemindersCount}
            />

            {/* Bottom Sheet: Tambah / Edit Obat (Slide up from bottom with grab handle line) */}
            <AddMedication
              isOpen={isAddMedOpen}
              editTarget={editMedTarget}
              onClose={() => {
                setIsAddMedOpen(false);
                setEditMedTarget(null);
              }}
            />

            {/* Bottom Sheet: Pusat Notifikasi */}
            <Notifications
              isOpen={isNotificationsOpen}
              onClose={() => setIsNotificationsOpen(false)}
              onNavigateTab={(tab) => setCustomerTab(tab)}
            />

            {/* Modal: Informasi Resmi Apotek Vitaria */}
            <PharmacyInfoModal
              isOpen={isPharmacyModalOpen}
              onClose={() => setIsPharmacyModalOpen(false)}
            />

            {/* Live Chat Drawer: Konsultasi Apoteker */}
            <LiveChatDrawer
              isOpen={isChatOpen}
              onClose={() => setIsChatOpen(false)}
            />

            {/* Modal & Katalog Pembelian Obat Apotek Vitaria */}
            <PharmacyStoreModal
              isOpen={isStoreOpen}
              onClose={() => setIsStoreOpen(false)}
              onOpenConsultation={() => {
                setIsStoreOpen(false);
                setIsChatOpen(true);
              }}
              onOpenMyOrders={() => {
                setIsStoreOpen(false);
                setIsMyOrdersOpen(true);
              }}
            />

            {/* Modal: Pesanan Saya & Integrasi Pengingat */}
            <MyOrdersModal
              isOpen={isMyOrdersOpen}
              onClose={() => setIsMyOrdersOpen(false)}
              onAddMedicationReminder={(med) => {
                setIsMyOrdersOpen(false);
                setEditMedTarget({
                  id: '',
                  userId: '',
                  name: med.name,
                  dosageForm: (med.dosageForm as any) || 'tablet',
                  strength: med.strength,
                  category: med.category || 'Obat Bebas',
                  dosePerTake: '1',
                  doseUnit: 'Tablet',
                  frequency: '3x Sehari',
                  times: ['07:00', '13:00', '19:00'],
                  instructions: 'Sesudah Makan',
                  startDate: new Date().toISOString().slice(0, 10),
                  status: 'active',
                  reminderEnabled: true,
                  reminderSound: true,
                  createdAt: new Date().toISOString()
                });
                setIsAddMedOpen(true);
              }}
              onReorderMedicine={() => {
                setIsMyOrdersOpen(false);
                setIsStoreOpen(true);
              }}
              onOpenConsultation={() => {
                setIsMyOrdersOpen(false);
                setIsChatOpen(true);
              }}
            />
          </div>
        ) : (
          /* STAFF (PETUGAS) APPLICATION FLOW */
          <div className="flex-1 flex flex-col justify-between min-h-0 h-full overflow-hidden relative">
            <main className="flex-1 overflow-y-auto overscroll-contain pb-24">
              <div key={staffTab} className="page-enter">
                {staffTab === 'dashboard' && (
                  <StaffDashboard
                    onNavigateTab={(tab, subTab) => {
                      setStaffTab(tab);
                      if (subTab) setStaffReportSubTab(subTab);
                    }}
                    onOpenAddMedicine={handleOpenAddStaffMed}
                    onOpenStockAdjust={(med) => setStockAdjustTarget(med)}
                    onOpenChat={() => {
                      setStaffChatCustomer({ name: 'Budi Santoso' });
                      setIsStaffChatOpen(true);
                    }}
                  />
                )}
                {staffTab === 'medicines' && (
                  <Catalog
                    onOpenAddMedicine={handleOpenAddStaffMed}
                    onEditMedicine={handleEditStaffMed}
                    onOpenStockAdjust={(med) => setStockAdjustTarget(med)}
                  />
                )}
                {staffTab === 'customers' && (
                  <Customers
                    onOpenChatWithCustomer={(customer) => {
                      setStaffChatCustomer(customer);
                      setIsStaffChatOpen(true);
                    }}
                  />
                )}
                {staffTab === 'reports' && (
                  <SalesReport
                    initialSubTab={staffReportSubTab}
                    onOpenStockAdjust={(med) => setStockAdjustTarget(med)}
                  />
                )}
                {staffTab === 'profile' && <StaffProfile />}
              </div>
            </main>

            {/* Staff Mobile Bottom Navigation */}
            <StaffBottomNav
              activeTab={staffTab}
              onTabChange={(tab) => setStaffTab(tab)}
              lowStockCount={stats.lowStockCount}
            />

            {/* Bottom Sheet: Tambah / Edit Obat Katalog Apotek */}
            <AddEditMedicine
              isOpen={isAddStaffMedOpen}
              editTarget={editStaffMedTarget}
              onClose={() => {
                setIsAddStaffMedOpen(false);
                setEditStaffMedTarget(null);
              }}
            />

            {/* Modal: Penyesuaian Stok Apotek */}
            <StockAdjustModal
              medicine={stockAdjustTarget}
              onClose={() => setStockAdjustTarget(null)}
            />

            {/* Live Chat Drawer: Konsultasi Petugas / Apoteker Dua Arah */}
            <LiveChatDrawer
              isOpen={isStaffChatOpen}
              onClose={() => setIsStaffChatOpen(false)}
              staffMode={true}
              customerName={staffChatCustomer?.name || 'Budi Santoso'}
              customerAvatar={staffChatCustomer?.avatarUrl}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
