import React from 'react';
import type { Theme } from '../types';
import { SunIcon, MoonIcon, StarsIcon } from './Icons';
import { useTranslation } from '../hooks/useTranslation';

interface ThemeSwitcherProps {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const themes: { name: Theme; icon: React.FC<React.SVGProps<SVGSVGElement>> }[] = [
  { name: 'light', icon: SunIcon },
  { name: 'dark', icon: MoonIcon },
  { name: 'nebula', icon: StarsIcon },
];

export const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({ theme, setTheme }) => {
  const { t } = useTranslation();
  
  return (
    <div className="flex items-center p-1 rounded-full bg-[var(--tab-bg)]">
      {themes.map((tItem) => (
        <button
          key={tItem.name}
          onClick={() => setTheme(tItem.name)}
          className={`w-8 h-8 flex items-center justify-center rounded-full transition-all duration-300 ${
            theme === tItem.name
              ? 'bg-[var(--tab-active-bg)] text-[var(--tab-active-text)] shadow-md'
              : 'text-[var(--tab-inactive-text)] hover:bg-white/20'
          }`}
          aria-label={t(`themeSwitcher.${tItem.name}`)}
        >
          <tItem.icon className="w-5 h-5" />
        </button>
      ))}
    </div>
  );
};