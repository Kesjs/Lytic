import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { en } from './dictionaries/en';
import { fr } from './dictionaries/fr';

type Language = 'fr' | 'en';
type Dictionary = typeof fr;

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: Dictionary;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Language>('fr');

  useEffect(() => {
    // Check local storage on mount
    const savedLang = localStorage.getItem('reflet_lang') as Language;
    if (savedLang && (savedLang === 'fr' || savedLang === 'en')) {
      setLang(savedLang);
    } else {
      // Default to user's browser language if possible, else fr
      const browserLang = navigator.language.startsWith('en') ? 'en' : 'fr';
      setLang(browserLang);
    }
  }, []);

  const handleSetLang = (newLang: Language) => {
    setLang(newLang);
    localStorage.setItem('reflet_lang', newLang);
  };

  const t = useMemo(() => {
    return lang === 'en' ? en : fr;
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang: handleSetLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
}
