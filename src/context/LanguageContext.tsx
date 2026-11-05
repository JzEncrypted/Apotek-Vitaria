import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type LanguageCode = 'id' | 'en' | 'su';

export interface LanguageOption {
  code: LanguageCode;
  name: string;
  nativeName: string;
  subtitle: string;
}

export const LANGUAGES: LanguageOption[] = [
  {
    code: 'id',
    name: 'Bahasa Indonesia',
    nativeName: 'Indonesia',
    subtitle: 'Bahasa resmi aplikasi'
  },
  {
    code: 'en',
    name: 'English',
    nativeName: 'English (US)',
    subtitle: 'Global healthcare interface'
  },
  {
    code: 'su',
    name: 'Basa Sunda',
    nativeName: 'Sunda (Jawa Barat)',
    subtitle: 'Basa wewengkon Apotek Vitaria Bandung'
  }
];

// Lightweight dictionary for key headings & terms
const TRANSLATIONS: Record<LanguageCode, Record<string, string>> = {
  id: {
    home: 'Beranda',
    medications: 'Obat Saya',
    reminders: 'Reminder',
    history: 'Riwayat',
    profile: 'Profil',
    upcoming_title: 'Jadwal Minum Berikutnya',
    upcoming_subtitle: 'Geser kartu untuk melihat jadwal obat hari ini',
    view_all: 'Lihat Semua',
    mark_taken: 'Sudah Diminum',
    snooze: 'Tunda',
    all_taken_title: 'Semua Obat Hari Ini Telah Diminum',
    all_taken_desc: 'Kerja bagus! Seluruh jadwal minum obat untuk hari ini telah selesai dicatat.',
    today_progress: 'Progres Kesehatan Hari Ini',
    quick_actions: 'Aksi Cepat',
    add_med: 'Tambah Obat',
    app_language: 'Bahasa Aplikasi',
    change_language: 'Pilih Bahasa',
    lang_changed: 'Bahasa berhasil diubah ke',
    official_pharmacy: 'Informasi Apotek Resmi',
    open_now: 'Buka Sekarang',
    medical_disclaimer: 'Catatan Medis: Apotek Vitaria adalah sistem pengingat dan pendukung jadwal minum obat. Selalu ikuti petunjuk dokter atau apoteker Anda.'
  },
  en: {
    home: 'Home',
    medications: 'My Meds',
    reminders: 'Reminders',
    history: 'History',
    profile: 'Profile',
    upcoming_title: 'Upcoming Medications',
    upcoming_subtitle: 'Swipe cards to view all scheduled doses for today',
    view_all: 'View All',
    mark_taken: 'Take Dose',
    snooze: 'Snooze',
    all_taken_title: 'All Today’s Doses Completed',
    all_taken_desc: 'Great job! All your medication schedules for today have been taken.',
    today_progress: 'Today’s Medication Progress',
    quick_actions: 'Quick Actions',
    add_med: 'Add Med',
    app_language: 'App Language',
    change_language: 'Select Language',
    lang_changed: 'Language successfully changed to',
    official_pharmacy: 'Official Pharmacy Info',
    open_now: 'Open Now',
    medical_disclaimer: 'Medical Disclaimer: Apotek Vitaria is a schedule reminder support app. Always follow prescriptions and healthcare guidance.'
  },
  su: {
    home: 'Tepas',
    medications: 'Landong Abdi',
    reminders: 'Panginget',
    history: 'Raratan',
    profile: 'Profil',
    upcoming_title: 'Jadwal Nginum Landong Salajengna',
    upcoming_subtitle: 'Gereser kartu kanggo ningal sadaya jadwal landong',
    view_all: 'Tingal Sadayana',
    mark_taken: 'Parantos Diinum',
    snooze: 'Pondokeun',
    all_taken_title: 'Sadaya Landong Dinten Ieu Parantos Beres',
    all_taken_desc: 'Hatur nuhun! Sadaya jadwal nginum landong parantos rengse dinten ieu.',
    today_progress: 'Kamajengan Kaséhatan Dinten Ieu',
    quick_actions: 'Peta Gancang',
    add_med: 'Tambah Landong',
    app_language: 'Basa Aplikasi',
    change_language: 'Pilih Basa',
    lang_changed: 'Basa parantos dirobih kana',
    official_pharmacy: 'Inpormasi Resmi Apotek',
    open_now: 'Buka Ayeuna',
    medical_disclaimer: 'Catetan Kaséhatan: Apotek Vitaria mangrupikeun panginget jadwal nginum landong. Salawasna tuturkeun piwuruk dokter atanapi apotéker.'
  }
};

interface LanguageContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  currentOption: LanguageOption;
  t: (key: string, fallback?: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<LanguageCode>(() => {
    const saved = localStorage.getItem('vitaria_lang');
    return (saved as LanguageCode) || 'id';
  });

  useEffect(() => {
    localStorage.setItem('vitaria_lang', language);
  }, [language]);

  const setLanguage = (lang: LanguageCode) => {
    setLanguageState(lang);
  };

  const currentOption = LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];

  const t = (key: string, fallback?: string): string => {
    return TRANSLATIONS[language]?.[key] || fallback || TRANSLATIONS.id[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, currentOption, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
