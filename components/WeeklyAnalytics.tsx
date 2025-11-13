import React from 'react';
import { SparklesIcon } from './Icons';
import { useTranslation } from '../hooks/useTranslation';

interface WeeklyAnalyticsProps {
  analysis: string | null;
  isLoading: boolean;
}

export const WeeklyAnalytics: React.FC<WeeklyAnalyticsProps> = ({ analysis, isLoading }) => {
  const { t } = useTranslation();

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="space-y-3 animate-pulse">
            <div className="h-4 bg-[var(--skeleton-bg)] rounded w-3/4"></div>
            <div className="h-4 bg-[var(--skeleton-bg)] rounded w-1/2"></div>
            <div className="h-4 bg-[var(--skeleton-bg)] rounded w-5/6"></div>
        </div>
      );
    }
    
    if (!analysis) {
        return <p className="text-[var(--text-secondary)]">{t('dashboard.weeklySummaryEmpty')}</p>;
    }

    if (analysis === "dashboard.weeklySummaryNotEnoughData") {
        return <p className="text-[var(--text-secondary)]">{t(analysis)}</p>;
    }

    return analysis.split('\n').map((line, index) => {
        if (line.startsWith('**') && line.endsWith('**')) {
            return <p key={index} className="font-bold text-[var(--text-heading)] mt-2">{line.replace(/\*\*/g, '')}</p>;
        }
        return <p key={index} className="text-[var(--text-primary)]">{line}</p>;
    });
  };

  return (
    <div className="bg-[var(--card-bg)] backdrop-blur-xl p-6 rounded-2xl shadow-lg border border-[var(--card-border)] card-enter transition-colors">
      <div className="flex items-center mb-4">
        <div className="w-8 h-8 flex items-center justify-center bg-[var(--accent-primary)] text-[var(--text-on-accent)] rounded-full mr-3 shadow-md">
            <SparklesIcon className="w-5 h-5"/>
        </div>
        <h2 className="text-2xl font-bold text-[var(--text-heading)]">{t('dashboard.weeklySummaryTitle')}</h2>
      </div>
      <div className="text-md space-y-1">
        {renderContent()}
      </div>
    </div>
  );
};