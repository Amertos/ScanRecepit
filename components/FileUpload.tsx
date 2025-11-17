import React, { useRef } from 'react';
import { UploadIcon, CameraIcon } from './Icons';
import { useTranslation } from '../hooks/useTranslation';

interface FileUploadProps {
  onFileSelect: (file: File | null) => void;
  disabled?: boolean;
  onTakePhotoClick: () => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, disabled, onTakePhotoClick }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { t } = useTranslation();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files ? event.target.files[0] : null;
    onFileSelect(file);
    event.target.value = ''; // Reset file input
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/png, image/jpeg, image/webp"
        disabled={disabled}
      />
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={onTakePhotoClick}
          disabled={disabled}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[var(--accent-primary)] text-[var(--text-on-accent)] font-semibold rounded-lg shadow-lg hover:bg-[var(--accent-primary-hover)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--accent-primary)] transition-all duration-200 ease-in-out transform hover:scale-105 active:scale-100 disabled:bg-[var(--accent-primary-disabled)] disabled:cursor-not-allowed disabled:transform-none"
        >
          <CameraIcon />
          {t('upload.takePhoto')}
        </button>
        <button
          onClick={handleButtonClick}
          disabled={disabled}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-500/20 text-[var(--text-primary)] font-semibold rounded-lg shadow-lg hover:bg-gray-500/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--accent-primary)] transition-all duration-200 ease-in-out transform hover:scale-105 active:scale-100 disabled:bg-[var(--accent-primary-disabled)] disabled:cursor-not-allowed disabled:transform-none"
        >
          <UploadIcon />
          {t('upload.button')}
        </button>
      </div>
    </div>
  );
};