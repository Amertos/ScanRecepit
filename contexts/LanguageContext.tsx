import React, { createContext, useState, useEffect, useCallback } from 'react';
import type { Language } from '../types';

export interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string, options?: { [key: string]: string | number }) => string;
}

export const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('en');
  const [translations, setTranslations] = useState<any>(null);

  useEffect(() => {
    const storedLang = localStorage.getItem('scanSaveLanguage') as Language | null;
    if (storedLang && ['en', 'sr', 'de', 'es'].includes(storedLang)) {
      setLanguageState(storedLang);
    } else {
      const browserLang = navigator.language.split('-')[0] as Language;
      if (['en', 'sr', 'de', 'es'].includes(browserLang)) {
        setLanguageState(browserLang);
      }
    }
  }, []);

  useEffect(() => {
    const loadTranslations = async () => {
      try {
        const response = await fetch(`/locales/${language}.json`);
        if (!response.ok) {
          throw new Error(`Failed to load translations for ${language}`);
        }
        const data = await response.json();
        setTranslations(data);
      } catch (error) {
        console.error(error);
        // Fallback to English if loading fails
        if (language !== 'en') {
            setLanguageState('en');
        } else {
            console.error("Failed to load base English translations.");
        }
      }
    };

    loadTranslations();
  }, [language]);

  const setLanguage = (lang: Language) => {
    setTranslations(null); // Invalidate current translations to show loading state
    setLanguageState(lang);
    localStorage.setItem('scanSaveLanguage', lang);
  };

  const t = useCallback((key: string, options?: { [key: string]: string | number }) => {
    if (!translations) {
      return key;
    }
    const keys = key.split('.');
    let result = translations;
    for (const k of keys) {
      result = result?.[k];
      if (result === undefined) {
        return key;
      }
    }

    if (typeof result !== 'string') {
        return key;
    }

    if (options) {
      result = result.replace(/{(\w+)}/g, (placeholder: string, placeholderName: string) => {
        return options[placeholderName] !== undefined ? String(options[placeholderName]) : placeholder;
      });
    }

    return result;
  }, [translations]);

  if (!translations) {
    return null; // Don't render the app until the initial translations are loaded
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};
