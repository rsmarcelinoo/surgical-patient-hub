/**
 * SettingsContext
 * 
 * Provides application-wide settings including language and theme preferences.
 * Settings are persisted to localStorage.
 */

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

type Language = "en" | "pt";
type Theme = "light" | "dark";

interface SettingsContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    // Navigation
    "nav.dashboard": "Dashboard",
    "nav.calendar": "Calendar",
    "nav.list": "List View",
    "nav.settings": "Settings",
    "nav.kanbanBoards": "Kanban Boards",
    "nav.hospitals": "Hospitals",
    "nav.addHospital": "Add Hospital",
    // Settings page
    "settings.title": "Settings",
    "settings.language": "Language",
    "settings.theme": "Theme",
    "settings.lightMode": "Light Mode",
    "settings.darkMode": "Dark Mode",
    "settings.english": "English",
    "settings.portuguese": "Portuguese",
    // Common
    "common.save": "Save",
    "common.cancel": "Cancel",
    "common.add": "Add",
    "common.edit": "Edit",
    "common.delete": "Delete",
    "common.search": "Search",
    "common.filter": "Filter",
    "common.noResults": "No results found",
    // Patient
    "patient.episodes": "Episodes",
    "patient.surgeries": "Surgeries",
    "patient.consultations": "Consultations",
    "patient.comments": "Comments",
    "patient.attachments": "Attachments",
    "patient.addEpisode": "Add Episode",
    "patient.addConsultation": "Add Consultation",
    "patient.addComment": "Add Comment",
    // Calendar
    "calendar.title": "Calendar",
    "calendar.noSurgeries": "No surgeries scheduled for this date",
    "calendar.allHospitals": "All Hospitals",
    "calendar.allStatus": "All Status",
  },
  pt: {
    // Navigation
    "nav.dashboard": "Painel",
    "nav.calendar": "Calendário",
    "nav.list": "Lista",
    "nav.settings": "Definições",
    "nav.kanbanBoards": "Quadros Kanban",
    "nav.hospitals": "Hospitais",
    "nav.addHospital": "Adicionar Hospital",
    // Settings page
    "settings.title": "Definições",
    "settings.language": "Idioma",
    "settings.theme": "Tema",
    "settings.lightMode": "Modo Claro",
    "settings.darkMode": "Modo Escuro",
    "settings.english": "Inglês",
    "settings.portuguese": "Português",
    // Common
    "common.save": "Guardar",
    "common.cancel": "Cancelar",
    "common.add": "Adicionar",
    "common.edit": "Editar",
    "common.delete": "Eliminar",
    "common.search": "Pesquisar",
    "common.filter": "Filtrar",
    "common.noResults": "Sem resultados",
    // Patient
    "patient.episodes": "Episódios",
    "patient.surgeries": "Cirurgias",
    "patient.consultations": "Consultas",
    "patient.comments": "Comentários",
    "patient.attachments": "Anexos",
    "patient.addEpisode": "Adicionar Episódio",
    "patient.addConsultation": "Adicionar Consulta",
    "patient.addComment": "Adicionar Comentário",
    // Calendar
    "calendar.title": "Calendário",
    "calendar.noSurgeries": "Sem cirurgias agendadas para esta data",
    "calendar.allHospitals": "Todos os Hospitais",
    "calendar.allStatus": "Todos os Estados",
  },
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem("app-language");
    return (saved as Language) || "en";
  });

  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = localStorage.getItem("app-theme");
    return (saved as Theme) || "light";
  });

  /** Update language and persist to localStorage */
  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("app-language", lang);
  };

  /** Update theme and persist to localStorage */
  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem("app-theme", newTheme);
  };

  /** Apply theme to document */
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
  }, [theme]);

  /** Translate function */
  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <SettingsContext.Provider value={{ language, setLanguage, theme, setTheme, t }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
}
