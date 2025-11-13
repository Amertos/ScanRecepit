import React from 'react';
import type { ReceiptData } from '../types';
import { getCategoryIcon } from './getCategoryIcon';
import { formatCurrency } from '../utils/currency';
import { useTranslation } from '../hooks/useTranslation';

interface ReceiptDisplayProps {
  data: ReceiptData;
}

export const ReceiptDisplay: React.FC<ReceiptDisplayProps> = ({ data }) => {
  const CategoryIcon = getCategoryIcon(data.category);
  const { t } = useTranslation();

  return (
    <div className="border border-[var(--card-border)] rounded-lg p-4 space-y-4">
      <div className="text-center pb-4 border-b border-[var(--card-border)]">
        <h2 className="text-xl font-bold text-[var(--text-heading)]">{data.storeName}</h2>
        <p className="text-sm text-[var(--text-secondary)]">{data.date}</p>
        <div className="mt-2 flex items-center justify-center gap-2">
            <div className="w-4 h-4 text-[var(--accent-primary)]">
                <CategoryIcon />
            </div>
            <span className="text-sm font-medium text-[var(--accent-primary)]">
                {t(`category.${data.category}`)}
            </span>
        </div>
      </div>
      
      <div className="space-y-2">
        <h3 className="text-md font-semibold text-[var(--text-primary)]">{t('receipt.items')}</h3>
        <ul className="space-y-1 text-sm">
          {data.items.map((item, index) => (
            <li key={index} className="flex justify-between items-center text-[var(--text-secondary)]">
              <span>{item.description}</span>
              <span className="font-mono">{formatCurrency(item.price, data.currency)}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="pt-4 border-t border-[var(--card-border)] space-y-2">
        {data.subtotal > 0 && (
          <div className="flex justify-between text-sm text-[var(--text-secondary)]">
            <span>{t('receipt.subtotal')}</span>
            <span className="font-mono">{formatCurrency(data.subtotal, data.currency)}</span>
          </div>
        )}
        {data.tax > 0 && (
          <div className="flex justify-between text-sm text-[var(--text-secondary)]">
            <span>{t('receipt.tax')}</span>
            <span className="font-mono">{formatCurrency(data.tax, data.currency)}</span>
          </div>
        )}
        <div className="flex justify-between text-lg font-bold text-[var(--text-heading)]">
          <span>{t('receipt.total')}</span>
          <span className="font-mono">{formatCurrency(data.total, data.currency)}</span>
        </div>
      </div>
    </div>
  );
};