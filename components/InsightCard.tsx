import React from 'react';
import { SparklesIcon } from './Icons';
import { useTranslation } from '../hooks/useTranslation';

interface InsightCardProps {
  insight: string;
}

export const InsightCard: React.FC<InsightCardProps> = ({ insight }) => {
  const { t } = useTranslation();
  return (
    <div className="mt-6 bg-[var(--accent-primary)]/10 border-l-4 border-[var(--accent-primary)] text-[var(--text-primary)] p-4 rounded-r-lg">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <div className="h-5 w-5 text-[var(--accent-primary)]">
            <SparklesIcon />
          </div>
        </div>
        <div className="ml-3">
          <p className="text-sm font-medium">
            <span className="font-bold">{t('insight.title')}</span> {insight}
          </p>
        </div>
      </div>
    </div>
  );
};