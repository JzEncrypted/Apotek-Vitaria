import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { 
  UserMedication, 
  MedicationScheduleItem, 
  MedicationLog, 
  AppNotification, 
  ScheduleStatus 
} from '../types';
import { useToast } from './ToastContext';

interface MedicationContextType {
  medications: UserMedication[];
  schedules: MedicationScheduleItem[];
  logs: MedicationLog[];
  notifications: AppNotification[];
  complianceRate: number;
  todayStats: {
    total: number;
    taken: number;
    remaining: number;
    activeMeds: number;
  };
  addMedication: (data: Omit<UserMedication, 'id' | 'userId' | 'createdAt'>) => void;
  updateMedication: (id: string, data: Partial<UserMedication>) => void;
  deleteMedication: (id: string) => void;
  markSchedule: (scheduleId: string, status: 'taken' | 'snoozed' | 'missed', note?: string) => void;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  deleteNotification: (id: string) => void;
  resetToInitial: () => void;
}

const MedicationContext = createContext<MedicationContextType | undefined>(undefined);

export const MedicationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { showToast } = useToast();

  const [medications, setMedications] = useState<UserMedication[]>([]);
  const [schedules, setSchedules] = useState<MedicationScheduleItem[]>([]);
  const [logs, setLogs] = useState<MedicationLog[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  // Real Database Sync with Supabase PostgreSQL
  const fetchCloudMedications = async () => {
    try {
      const token = localStorage.getItem('vitaria_token');
      if (!token) return;

      const res = await fetch('/api/medications', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.medications)) {
          setMedications(json.medications);

          // Regenerate today's schedules from user's active cloud medications
          const today = new Date().toISOString().split('T')[0];
          const generatedSchedules: MedicationScheduleItem[] = [];

          json.medications.forEach((med: UserMedication) => {
            (med.times || ['08:00']).forEach((time: string, idx: number) => {
              generatedSchedules.push({
                id: `sch-${med.id}-${idx}`,
                userMedicationId: med.id,
                medicationName: med.name,
                dosage: `${med.dosePerTake || '1'} ${med.doseUnit || 'Tablet'} (${med.strength || ''})`,
                dosageForm: med.dosageForm || 'tablet',
                scheduledTime: time,
                date: today,
                instructions: med.instructions || 'Sesudah Makan',
                status: 'upcoming' as ScheduleStatus
              });
            });
          });

          setSchedules(generatedSchedules);

          if (Array.isArray(json.logs)) {
            setLogs(
              json.logs.map((l: any) => ({
                id: l.id,
                userMedicationId: l.medicationId,
                medicationName: '',
                dosage: '',
                dosageForm: 'tablet',
                scheduledTime: l.scheduleTime,
                actionTime: l.actualTime,
                status: l.status,
                date: today,
                note: l.note
              }))
            );
          }
        }
      }
    } catch (err) {
      console.warn('Failed to fetch cloud medications:', err);
    }
  };

  useEffect(() => {
    fetchCloudMedications();
  }, []);

  // Calculations
  const todayStats = useMemo(() => {
    const total = schedules.length;
    const taken = schedules.filter((s) => s.status === 'taken').length;
    const remaining = total - taken;
    const activeMeds = medications.filter((m) => m.status === 'active').length;
    return { total, taken, remaining, activeMeds };
  }, [schedules, medications]);

  const complianceRate = useMemo(() => {
    if (logs.length === 0) return 100;
    const takenCount = logs.filter((l) => l.status === 'taken').length;
    return Math.round((takenCount / logs.length) * 100);
  }, [logs]);

  // Actions
  const addMedication = async (data: Omit<UserMedication, 'id' | 'userId' | 'createdAt'>) => {
    const token = localStorage.getItem('vitaria_token');
    const today = new Date().toISOString().split('T')[0];

    try {
      if (token) {
        const res = await fetch('/api/medications', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(data)
        });

        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            const savedMed: UserMedication = json.data;
            setMedications((prev) => [savedMed, ...prev]);

            const newSchedules: MedicationScheduleItem[] = (savedMed.times || ['08:00']).map((time, idx) => ({
              id: `sch-${savedMed.id}-${idx}`,
              userMedicationId: savedMed.id,
              medicationName: savedMed.name,
              dosage: `${savedMed.dosePerTake} ${savedMed.doseUnit} (${savedMed.strength})`,
              dosageForm: savedMed.dosageForm,
              scheduledTime: time,
              date: today,
              instructions: savedMed.instructions,
              status: 'upcoming' as ScheduleStatus
            }));

            setSchedules((prev) => [...prev, ...newSchedules]);
            showToast(`Obat "${data.name}" berhasil disimpan di database cloud.`, 'success');
            return;
          }
        }
      }
    } catch (err) {
      console.warn('Failed to save medication to cloud, using local state:', err);
    }

    const newId = 'med-' + Date.now().toString().slice(-4);
    const newMed: UserMedication = {
      ...data,
      id: newId,
      userId: 'usr-customer',
      createdAt: today
    };

    setMedications((prev) => [newMed, ...prev]);

    const newSchedules: MedicationScheduleItem[] = (data.times || ['08:00']).map((time, idx) => ({
      id: `sch-${newId}-${idx}`,
      userMedicationId: newId,
      medicationName: data.name,
      dosage: `${data.dosePerTake} ${data.doseUnit} (${data.strength})`,
      dosageForm: data.dosageForm,
      scheduledTime: time,
      date: today,
      instructions: data.instructions,
      status: 'upcoming' as ScheduleStatus
    }));

    setSchedules((prev) => [...prev, ...newSchedules]);
    showToast(`Obat "${data.name}" berhasil ditambahkan.`, 'success');
  };

  const updateMedication = (id: string, data: Partial<UserMedication>) => {
    setMedications((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...data } : m))
    );
    showToast('Informasi obat berhasil diperbarui.', 'success');
  };

  const deleteMedication = async (id: string) => {
    const target = medications.find((m) => m.id === id);
    setMedications((prev) => prev.filter((m) => m.id !== id));
    setSchedules((prev) => prev.filter((s) => s.userMedicationId !== id));

    try {
      const token = localStorage.getItem('vitaria_token');
      if (token) {
        await fetch(`/api/medications/${id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` }
        });
      }
    } catch {}

    showToast(`Obat ${target ? `"${target.name}"` : ''} telah dihapus dari database.`, 'info');
  };

  const markSchedule = async (
    scheduleId: string, 
    status: 'taken' | 'snoozed' | 'missed', 
    note?: string
  ) => {
    const targetSchedule = schedules.find((s) => s.id === scheduleId);
    if (!targetSchedule) return;

    const now = new Date();
    const actionTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes()
    ).padStart(2, '0')}`;
    const todayStr = now.toISOString().split('T')[0];

    // Update schedule
    setSchedules((prev) =>
      prev.map((s) =>
        s.id === scheduleId
          ? {
              ...s,
              status,
              takenAt: status === 'taken' ? actionTimeStr : undefined
            }
          : s
      )
    );

    // Add to logs
    const newLog: MedicationLog = {
      id: 'log-' + Date.now().toString().slice(-4),
      userMedicationId: targetSchedule.userMedicationId,
      medicationName: targetSchedule.medicationName,
      dosage: targetSchedule.dosage,
      dosageForm: targetSchedule.dosageForm,
      scheduledTime: targetSchedule.scheduledTime,
      actionTime: actionTimeStr,
      status,
      date: todayStr,
      note: note || (status === 'taken' ? 'Diminum sesuai petunjuk' : status === 'snoozed' ? 'Pengingat ditunda' : 'Jadwal terlewat')
    };

    setLogs((prev) => [newLog, ...prev]);

    try {
      const token = localStorage.getItem('vitaria_token');
      if (token) {
        await fetch('/api/medications/log', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            medicationId: targetSchedule.userMedicationId,
            scheduleTime: targetSchedule.scheduledTime,
            status,
            note: newLog.note
          })
        });
      }
    } catch {}

    if (status === 'taken') {
      showToast(`${targetSchedule.medicationName} dicatat sudah diminum.`, 'success');
    } else if (status === 'snoozed') {
      showToast(`Pengingat ${targetSchedule.medicationName} ditunda.`, 'warning');
    } else {
      showToast(`${targetSchedule.medicationName} ditandai terlewat.`, 'danger');
    }
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const markAllNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    showToast('Semua notifikasi ditandai telah dibaca.', 'info');
  };

  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const resetToInitial = () => {
    fetchCloudMedications();
    showToast('Jadwal obat disinkronkan ulang dengan database cloud.', 'info');
  };

  return (
    <MedicationContext.Provider
      value={{
        medications,
        schedules,
        logs,
        notifications,
        complianceRate,
        todayStats,
        addMedication,
        updateMedication,
        deleteMedication,
        markSchedule,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        deleteNotification,
        resetToInitial
      }}
    >
      {children}
    </MedicationContext.Provider>
  );
};

export const useMedication = () => {
  const context = useContext(MedicationContext);
  if (!context) {
    throw new Error('useMedication must be used within a MedicationProvider');
  }
  return context;
};
