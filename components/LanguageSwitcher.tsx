import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import type { Language } from '../types';
import { GlobeIcon } from './Icons';

export const LanguageSwitcher: React.FC = () => {
  const { language, setLanguage, t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const languages: { code: Language; name: string }[] = [
    { code: 'en', name: 'English' },
    { code: 'sr', name: 'Srpski' },
    { code: 'de', name: 'Deutsch' },
    { code: 'es', name: 'Español' },
  ];

  const handleLanguageChange = (langCode: Language) => {
    setLanguage(langCode);
    setIsOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 flex items-center justify-center rounded-full transition-all duration-300 bg-[var(--tab-bg)] text-[var(--tab-inactive-text)] hover:bg-white/20"
        aria-label="Change language"
      >
        <GlobeIcon className="w-5 h-5" />
      </button>
      {isOpen && (
        <div 
            className="absolute right-0 mt-2 w-40 bg-[var(--modal-bg)] backdrop-blur-xl rounded-lg shadow-2xl border border-[var(--card-border)] overflow-hidden"
            style={{ animation: 'language-dropdown-enter 0.2s ease-out' }}
        >
          <ul>
            {languages.map((lang) => (
              <li key={lang.code}>
                <button
                  onClick={() => handleLanguageChange(lang.code)}
                  className={`w-full text-left px-4 py-2 text-sm font-medium transition-colors ${
                    language === lang.code
                      ? 'bg-[var(--accent-primary)] text-[var(--text-on-accent)]'
                      : 'text-[var(--text-primary)] hover:bg-[var(--tab-bg)]'
                  }`}
                >
                  {lang.name}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
