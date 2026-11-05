import { 
  User, 
  UserMedication, 
  MedicationScheduleItem, 
  MedicationLog, 
  PharmacyMedicine, 
  StockMovement, 
  PharmacyInfo, 
  AppNotification 
} from '../types';

export const initialCustomer: User = {
  id: '',
  name: 'Pelanggan Baru',
  phone: '',
  email: '',
  role: 'customer',
  avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
  registeredAt: new Date().toISOString().slice(0, 10),
  status: 'active'
};

export const initialStaff: User = {
  id: '',
  name: 'Petugas Apotek',
  phone: '',
  email: '',
  role: 'staff',
  avatarUrl: '/vitaria.jpg',
  registeredAt: new Date().toISOString().slice(0, 10),
  status: 'active'
};

export const initialPharmacyInfo: PharmacyInfo = {
  name: 'Apotek Vitaria',
  tagline: 'Your Health, Our Care',
  description: 'Apotek resmi terpercaya yang berfokus pada ketepatan terapi obat, ketersediaan produk berkualitas, serta pendampingan kesehatan berkelanjutan bagi seluruh keluarga.',
  address: 'Jl. Mayjen Bambang Soegeng, Glagak, Sumberrejo, Kecamatan Mertoyudan, Kabupaten Magelang, Jawa Tengah 56172',
  village: 'Sumberrejo',
  district: 'Kecamatan Mertoyudan',
  city: 'Kabupaten Magelang',
  province: 'Jawa Tengah',
  postalCode: '56172',
  phone: '087819622174',
  whatsapp: '087819622174',
  email: 'layanan@apotekvitaria.id',
  openingHours: 'Senin - Minggu: 08.00 - 21.00 WIB',
  pharmacistName: 'apt. Sarinah Cantika, S.Farm.',
  sipApoteker: 'SIPA: 19950512/SIPA_33.08/2022/2045',
  siaApotek: 'SIA: 503/0088/SIA/DPMPTSP/2022',
  mapsUrl: 'https://maps.google.com/?q=Jl.+Mayjen+Bambang+Soegeng,+Mertoyudan,+Magelang'
};

// Clean Production: 0 Records
export const initialUserMedications: UserMedication[] = [];
export const initialSchedules: MedicationScheduleItem[] = [];
export const initialLogs: MedicationLog[] = [];
export const initialPharmacyMedicines: PharmacyMedicine[] = [];
export const initialStockMovements: StockMovement[] = [];
export const initialCustomersList: User[] = [];
export const initialNotifications: AppNotification[] = [];
