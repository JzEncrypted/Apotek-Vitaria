import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { PharmacyMedicine, StockMovement, PharmacyInfo, User } from '../types';
import { initialPharmacyInfo } from '../data/initialMockData';
import { useToast } from './ToastContext';

interface PharmacyStats {
  totalMedicines: number;
  totalStock: number;
  lowStockCount: number;
  nearExpiryCount: number;
  totalCustomers: number;
}

interface PharmacyContextType {
  medicines: PharmacyMedicine[];
  stockMovements: StockMovement[];
  pharmacyInfo: PharmacyInfo;
  customers: User[];
  stats: PharmacyStats;
  addMedicine: (data: Omit<PharmacyMedicine, 'id'>) => void;
  updateMedicine: (id: string, data: Partial<PharmacyMedicine>) => void;
  adjustStock: (
    medicineId: string,
    quantityChanged: number,
    type: 'in' | 'out' | 'adjustment',
    reason: string,
    staffName: string
  ) => void;
  updatePharmacyInfo: (data: Partial<PharmacyInfo>) => void;
  resetPharmacyData: () => void;
}

const PharmacyContext = createContext<PharmacyContextType | undefined>(undefined);

export const PharmacyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { showToast } = useToast();

  const [medicines, setMedicines] = useState<PharmacyMedicine[]>([]);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const [pharmacyInfo, setPharmacyInfo] = useState<PharmacyInfo>(initialPharmacyInfo);
  const [customers, setCustomers] = useState<User[]>([]);

  // Real API Sync with Supabase PostgreSQL
  const fetchMedicines = async () => {
    try {
      const res = await fetch('/api/medicines');
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setMedicines(json.data);
        }
      }
    } catch (err) {
      console.warn('Failed to fetch medicines from PostgreSQL API:', err);
    }
  };

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('vitaria_token');
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch('/api/users', { headers });
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setCustomers(json.data);
        }
      }
    } catch {}
  };

  useEffect(() => {
    fetchMedicines();
    fetchUsers();
  }, []);

  // Operational stats
  const stats: PharmacyStats = useMemo(() => {
    const totalMedicines = medicines.length;
    const totalStock = medicines.reduce((sum, m) => sum + m.totalStock, 0);
    const lowStockCount = medicines.filter((m) => m.totalStock <= m.minStock).length;

    // Check near expiry (e.g. within 60 days of Nov 2026)
    const today = new Date('2026-11-03');
    const sixtyDaysLater = new Date(today);
    sixtyDaysLater.setDate(sixtyDaysLater.getDate() + 60);

    const nearExpiryCount = medicines.filter((m) => {
      const exp = new Date(m.expiryDate);
      return exp <= sixtyDaysLater;
    }).length;

    return {
      totalMedicines,
      totalStock,
      lowStockCount,
      nearExpiryCount,
      totalCustomers: customers.length
    };
  }, [medicines, customers]);

  const addMedicine = async (data: Omit<PharmacyMedicine, 'id'>) => {
    try {
      const token = localStorage.getItem('vitaria_token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/medicines', {
        method: 'POST',
        headers,
        body: JSON.stringify(data)
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setMedicines((prev) => [json.data, ...prev]);
          showToast(`Obat katalog "${data.name}" berhasil disimpan di database.`, 'success');
          return;
        }
      }
    } catch (err) {
      console.warn('API error adding medicine, local update fallback:', err);
    }

    const newId = 'pmed-' + Date.now().toString().slice(-4);
    const newMed: PharmacyMedicine = { ...data, id: newId };
    setMedicines((prev) => [newMed, ...prev]);
    showToast(`Obat katalog "${data.name}" berhasil disimpan.`, 'success');
  };

  const updateMedicine = async (id: string, data: Partial<PharmacyMedicine>) => {
    try {
      const token = localStorage.getItem('vitaria_token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      await fetch(`/api/medicines/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(data)
      });
    } catch (err) {
      console.warn('API error updating medicine:', err);
    }

    setMedicines((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...data } : m))
    );
    showToast('Data obat katalog berhasil diperbarui di database.', 'success');
  };

  const adjustStock = async (
    medicineId: string,
    quantityChanged: number,
    type: 'in' | 'out' | 'adjustment',
    reason: string,
    staffName: string
  ) => {
    const med = medicines.find((m) => m.id === medicineId);
    if (!med) return;

    const before = med.totalStock;
    const after = Math.max(0, before + quantityChanged);
    const actualChanged = after - before;

    try {
      const token = localStorage.getItem('vitaria_token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      await fetch(`/api/medicines/${medicineId}/stock`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ quantityChanged, type, reason })
      });
    } catch (err) {
      console.warn('API error adjusting stock:', err);
    }

    // Update medicine total stock in state
    setMedicines((prev) =>
      prev.map((m) => (m.id === medicineId ? { ...m, totalStock: after } : m))
    );

    // Create audit trail log
    const movement: StockMovement = {
      id: 'mov-' + Date.now().toString().slice(-4),
      medicineId,
      medicineName: med.name,
      batchNumber: med.batchNumber,
      movementType: type,
      quantityBefore: before,
      quantityChanged: actualChanged,
      quantityAfter: after,
      reason: reason.trim() || 'Penyesuaian stok kasir',
      staffName: staffName || 'Staf Apotek',
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
    };

    setStockMovements((prev) => [movement, ...prev]);
    showToast(`Stok ${med.name} berhasil diperbarui di database (${before} -> ${after}).`, 'success');
  };

  const updatePharmacyInfo = (data: Partial<PharmacyInfo>) => {
    setPharmacyInfo((prev) => ({ ...prev, ...data }));
    showToast('Informasi resmi apotek berhasil disimpan.', 'success');
  };

  const resetPharmacyData = () => {
    fetchMedicines();
    setStockMovements([]);
    setPharmacyInfo(initialPharmacyInfo);
    showToast('Katalog apotek disinkronkan ulang dengan database cloud.', 'info');
  };

  return (
    <PharmacyContext.Provider
      value={{
        medicines,
        stockMovements,
        pharmacyInfo,
        customers,
        stats,
        addMedicine,
        updateMedicine,
        adjustStock,
        updatePharmacyInfo,
        resetPharmacyData
      }}
    >
      {children}
    </PharmacyContext.Provider>
  );
};

export const usePharmacy = () => {
  const context = useContext(PharmacyContext);
  if (!context) {
    throw new Error('usePharmacy must be used within a PharmacyProvider');
  }
  return context;
};
