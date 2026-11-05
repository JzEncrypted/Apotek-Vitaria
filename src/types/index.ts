export type Role = 'customer' | 'staff' | 'admin';

export interface User {
  id: string;
  name: string;
  phone: string;
  email?: string;
  role: Role;
  avatarUrl?: string;
  registeredAt: string;
  status: 'active' | 'suspended';
}

export type DosageForm = 
  | 'tablet' 
  | 'kapsul' 
  | 'sirup' 
  | 'salep' 
  | 'tetes' 
  | 'inhaler' 
  | 'lainnya';

export type MedicationStatus = 'active' | 'completed' | 'paused';

export interface UserMedication {
  id: string;
  userId: string;
  name: string;
  dosageForm: DosageForm;
  strength: string; // e.g. "500 mg"
  category: string; // e.g. "Vitamin", "Antibiotik", "Analgesik"
  dosePerTake: string; // e.g. "1"
  doseUnit: string; // e.g. "Tablet", "Sendok Teh (5ml)"
  frequency: string; // e.g. "3x Sehari", "2x Sehari", "1x Sehari"
  times: string[]; // e.g. ["07:00", "13:00", "19:00"]
  instructions: 'Sesudah Makan' | 'Sebelum Makan' | 'Bersama Makan' | 'Sesuai Petunjuk';
  startDate: string;
  endDate?: string;
  status: MedicationStatus;
  reminderEnabled: boolean;
  reminderSound: boolean;
  notes?: string;
  createdAt: string;
}

export type ScheduleStatus = 'upcoming' | 'due' | 'taken' | 'snoozed' | 'missed';

export interface MedicationScheduleItem {
  id: string;
  userMedicationId: string;
  medicationName: string;
  dosage: string;
  dosageForm: DosageForm;
  scheduledTime: string; // HH:mm
  date: string; // YYYY-MM-DD
  instructions: string;
  status: ScheduleStatus;
  takenAt?: string;
}

export interface MedicationLog {
  id: string;
  userMedicationId?: string;
  medicationName: string;
  dosage: string;
  dosageForm: DosageForm;
  scheduledTime: string; // e.g. "08:00"
  actionTime: string; // e.g. "08:05" or "12:30"
  status: 'taken' | 'snoozed' | 'missed';
  date: string;
  note?: string;
}

export type MedicineClass = 'Bebas' | 'Bebas Terbatas' | 'Keras / Resep';

export interface PharmacyMedicine {
  id: string;
  name: string;
  sku: string;
  category: string;
  brand: string;
  dosageForm: DosageForm;
  strength: string;
  description: string;
  usageInstructions: string;
  medicineClass: MedicineClass;
  totalStock: number;
  unit: string;
  minStock: number;
  purchasePrice: number;
  sellingPrice: number;
  expiryDate: string;
  batchNumber: string;
  storageLocation: string;
  isActive: boolean;
}

export interface StockMovement {
  id: string;
  medicineId: string;
  medicineName: string;
  batchNumber: string;
  movementType: 'in' | 'out' | 'adjustment';
  quantityBefore: number;
  quantityChanged: number;
  quantityAfter: number;
  reason: string;
  staffName: string;
  createdAt: string;
}

export interface PharmacyInfo {
  name: string;
  tagline: string;
  description: string;
  address: string;
  village: string;
  district: string;
  city: string;
  province: string;
  postalCode: string;
  phone: string;
  whatsapp: string;
  email: string;
  openingHours: string;
  pharmacistName: string;
  sipApoteker: string;
  siaApotek: string;
  mapsUrl: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'reminder' | 'info' | 'system';
  timestamp: string;
  isRead: boolean;
  linkTab?: string;
}
