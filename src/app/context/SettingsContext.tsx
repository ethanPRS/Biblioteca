import React, { createContext, useContext, useState } from 'react';

export interface AppSettings {
  libraryName: string;
  contactEmail: string;
  maxLoanDaysStudent: number;
  maxLoanDaysProf: number;
  maxBooksStudent: number;
  maxBooksProf: number;
  dailyFineAmount: number;
  fineCurrency: string;
  enableNotifications: boolean;
  autoReminders: boolean;
  maintenanceMode: boolean;
}

const DEFAULT_SETTINGS: AppSettings = {
  libraryName: 'Ducky University Bookstore',
  contactEmail: 'biblioteca@ducky.edu',
  maxLoanDaysStudent: 14,
  maxLoanDaysProf: 30,
  maxBooksStudent: 3,
  maxBooksProf: 10,
  dailyFineAmount: 10,
  fineCurrency: 'MXN',
  enableNotifications: true,
  autoReminders: true,
  maintenanceMode: false
};

interface SettingsContextType {
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
}

const SettingsContext = createContext<SettingsContextType | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
};
