import React, { useEffect } from 'react';
import type { ReceiptData } from '../types';
import { ReceiptDisplay } from './ReceiptDisplay';
import { CategoryChart } from './CategoryChart';
import { InsightCard } from './InsightCard';
import { TrashIcon } from './Icons';
import { useTranslation } from '../hooks/useTranslation';

interface ReceiptModalProps {
  receipt: ReceiptData;
  onClose: () => void;
  onDelete: (id: string) => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ receipt, onClose, onDelete }) => {
  const { t } = useTranslation();

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  const handleDelete = () => {
    if (window.confirm(t('modal.deleteConfirm'))) {
        onDelete(receipt.id);
    }
  }

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-40 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-[var(--modal-bg)] backdrop-blur-xl rounded-2xl shadow-2xl flex flex-col w-full max-w-lg md:max-w-2xl lg:max-w-4xl max-h-[90vh] modal-enter border border-[var(--card-border)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 md:p-8 border-b border-[var(--card-border)]">
            <div className="flex justify-between items-start">
                <h2 className="text-3xl font-bold text-[var(--text-heading)]">{t('modal.title')}</h2>
                <button
                    onClick={onClose}
                    className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors text-3xl leading-none"
                    aria-label={t('modal.close')}
                >
                    &times;
                </button>
            </div>
        </div>
        
        <div className="p-6 md:p-8 overflow-y-auto flex-grow">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                <ReceiptDisplay data={receipt} />
                {receipt.insight && <InsightCard insight={receipt.insight} />}
                </div>
                <div className="bg-[var(--card-bg)] p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">{t('modal.itemBreakdown')}</h3>
                    <CategoryChart items={receipt.items} currency={receipt.currency} />
                </div>
            </div>
        </div>

        <div className="p-4 md:p-6 border-t border-[var(--card-border)] text-right">
             <button
                onClick={handleDelete}
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-600/80 text-white font-semibold rounded-lg shadow-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200 ease-in-out"
                aria-label={t('modal.deleteButton')}
            >
                <TrashIcon className="w-5 h-5"/>
                {t('modal.deleteButton')}
            </button>
        </div>
      </div>
    </div>
  );
};