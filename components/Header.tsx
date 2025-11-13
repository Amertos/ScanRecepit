import React from 'react';
import { LogoIcon, ChatIcon, ScanTabIcon } from './Icons';
import { ThemeSwitcher } from './ThemeSwitcher';
import type { Theme } from '../types';
import { useTranslation } from '../hooks/useTranslation';
import { LanguageSwitcher } from './LanguageSwitcher';

interface HeaderProps {
  activeTab: 'scanner' | 'chat';
  setActiveTab: (tab: 'scanner' | 'chat') => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab, theme, setTheme }) => {
  const { t } = useTranslation();

  const tabs = [
    { id: 'scanner', name: t('header.dashboard'), icon: <ScanTabIcon /> },
    { id: 'chat', name: t('header.chat'), icon: <ChatIcon /> },
  ];

  return (
    <header className="bg-[var(--header-bg)] backdrop-blur-xl shadow-lg sticky top-0 z-20 border-b border-[var(--header-border)] transition-colors">
      <div className="container mx-auto px-4 md:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center">
            <div className="h-8 w-8 text-[var(--accent-primary)] mr-3">
              <LogoIcon />
            </div>
            <h1 className="text-2xl font-bold text-[var(--text-heading)] tracking-tight hidden sm:block">
              ScanSave
            </h1>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="flex items-center space-x-1 bg-[var(--tab-bg)] p-1 rounded-full">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'scanner' | 'chat')}
                className={`flex items-center justify-center gap-2 px-3 sm:px-4 py-1.5 text-sm font-semibold rounded-full transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:ring-opacity-50 ${
                  activeTab === tab.id
                    ? 'bg-[var(--tab-active-bg)] text-[var(--tab-active-text)] shadow-md'
                    : 'text-[var(--tab-inactive-text)] hover:bg-white/20'
                }`}
                aria-current={activeTab === tab.id ? 'page' : undefined}
              >
                <div className="w-5 h-5">{tab.icon}</div>
                <span className="hidden sm:inline">{tab.name}</span>
              </button>
            ))}
          </div>
          <LanguageSwitcher />
          <ThemeSwitcher theme={theme} setTheme={setTheme} />
        </div>
      </div>
    </header>
  );
};