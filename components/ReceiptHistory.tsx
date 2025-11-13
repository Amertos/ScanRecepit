import React from 'react';
import type { ReceiptData } from '../types';
import { LogoIcon, SearchIcon, DownloadIcon } from './Icons';
import { getCategoryIcon } from './getCategoryIcon';
import { formatCurrency } from '../utils/currency';
import { useTranslation } from '../hooks/useTranslation';

interface ReceiptHistoryProps {
  receipts: ReceiptData[];
  onReceiptSelect: (receipt: ReceiptData) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isHistoryEmpty: boolean;
}

const ReceiptCard: React.FC<{ receipt: ReceiptData; onSelect: () => void }> = ({ receipt, onSelect }) => {
  const cardRef = React.useRef<HTMLButtonElement>(null);
  const { t } = useTranslation();
  const CategoryIcon = getCategoryIcon(receipt.category);

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    const card = cardRef.current;
    if (!card) return;
    const { left, top, width, height } = card.getBoundingClientRect();
    const x = (e.clientX - left - width / 2) / 15;
    const y = (e.clientY - top - height / 2) / 15;
    card.style.transform = `perspective(1000px) rotateY(${x}deg) rotateX(${-y}deg) scale(1.05)`;
  };

  const handleMouseLeave = () => {
    const card = cardRef.current;
    if (!card) return;
    card.style.transform = 'perspective(1000px) rotateY(0deg) rotateX(0deg) scale(1)';
  };

  return (
    <button
      ref={cardRef}
      onClick={onSelect}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="w-full bg-[var(--card-bg)] backdrop-blur-md p-4 rounded-xl shadow-lg border border-[var(--card-border)] text-left transition-all duration-300 ease-out"
      style={{ transformStyle: 'preserve-3d' }}
    >
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
            <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] rounded-lg">
                <CategoryIcon className="w-5 h-5"/>
            </div>
            <div>
              <p className="font-bold text-lg text-[var(--text-primary)]">{receipt.storeName}</p>
              <p className="text-sm text-[var(--text-secondary)]">{receipt.date}</p>
            </div>
        </div>
        <div className="text-right">
          <p className="text-xl font-mono font-bold text-[var(--accent-primary)]">{formatCurrency(receipt.total, receipt.currency)}</p>
          <p className="text-xs text-[var(--text-secondary)] mt-1">{t(`category.${receipt.category}`)}</p>
        </div>
      </div>
    </button>
  );
};

export const ReceiptHistory: React.FC<ReceiptHistoryProps> = ({ receipts, onReceiptSelect, searchQuery, setSearchQuery, isHistoryEmpty }) => {
  const { t } = useTranslation();

  const exportToCSV = (data: ReceiptData[]) => {
    if (data.length === 0) return;
    
    const headers = t('history.exportCSVHeaders').split(',');
    
    const rows = data.flatMap(receipt => 
        receipt.items.map(item => [
            `"${receipt.id}"`,
            `"${receipt.storeName}"`,
            `"${receipt.date}"`,
            `"${t(`category.${receipt.category}`)}"`,
            receipt.subtotal,
            receipt.tax,
            receipt.total,
            `"${receipt.currency}"`,
            `"${item.description.replace(/"/g, '""')}"`, // Escape double quotes
            item.price
        ].join(','))
    );

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `scansave_receipts_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isHistoryEmpty) {
    return (
      <div className="text-center p-8 bg-[var(--card-bg)] backdrop-blur-xl rounded-2xl shadow-lg border border-[var(--card-border)] card-enter">
        <div className="mx-auto text-[var(--accent-primary)] w-16 h-16 flex items-center justify-center bg-[var(--accent-primary)]/10 rounded-full">
          <LogoIcon className="h-10 w-10" />
        </div>
        <h3 className="mt-4 text-2xl font-bold text-[var(--text-heading)]">{t('dashboard.welcomeTitle')}</h3>
        <p className="mt-2 text-md text-[var(--text-secondary)]">{t('dashboard.welcomeLine1')}</p>
        <p className="mt-1 text-md text-[var(--text-secondary)]">{t('dashboard.welcomeLine2')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 card-enter" style={{ animationDelay: '200ms' }}>
       <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h2 className="text-2xl font-bold text-[var(--text-heading)]">{t('dashboard.historyTitle', { count: receipts.length })}</h2>
        <div className="flex items-center gap-2">
           <div className="relative flex-grow">
              <input 
                type="text"
                placeholder={t('history.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-[var(--input-bg)] border border-[var(--card-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] transition placeholder:text-[var(--text-secondary)] text-[var(--text-primary)]"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--text-secondary)]">
                <SearchIcon className="w-5 h-5"/>
              </div>
           </div>
           <button 
             onClick={() => exportToCSV(receipts)}
             disabled={receipts.length === 0}
             className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[var(--accent-primary)] text-[var(--text-on-accent)] font-semibold rounded-lg shadow-md hover:bg-[var(--accent-primary-hover)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--accent-primary)] transition-all duration-200 ease-in-out disabled:bg-[var(--accent-primary-disabled)] disabled:cursor-not-allowed"
             aria-label={t('history.export')}
           >
              <DownloadIcon className="w-5 h-5"/>
              <span className="hidden sm:inline">{t('history.export')}</span>
           </button>
        </div>
      </div>
      
      {receipts.length > 0 ? (
        <div className="space-y-3">
          {receipts.map((receipt, index) => (
            <div key={receipt.id} className="card-enter" style={{ opacity: 0, animationDelay: `${index * 100}ms` }}>
              <ReceiptCard receipt={receipt} onSelect={() => onReceiptSelect(receipt)} />
            </div>
          ))}
        </div>
      ) : (
         <div className="text-center py-10">
            <p className="text-[var(--text-secondary)]">{t('history.noResults')}</p>
         </div>
      )}
    </div>
  );
};