
import React from 'react';
import { useTranslation } from '../hooks/useTranslation';

interface ErrorMessageProps {
  message: string;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ message }) => {
  const { t } = useTranslation();
  return (
    <div className="mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
      <strong className="font-bold">{t('error.title')} </strong>
      <span className="block sm:inline">{message}</span>
    </div>
  );
};