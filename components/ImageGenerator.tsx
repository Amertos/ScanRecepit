import React, { useState } from 'react';
import { useTranslation } from '../hooks/useTranslation';
import { generateImage } from '../services/geminiService';
import { ImageIcon, DownloadIcon } from './Icons';
import { ErrorMessage } from './ErrorMessage';

export const ImageGenerator: React.FC = () => {
    const { t } = useTranslation();
    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!prompt.trim() || isLoading) return;

        setIsLoading(true);
        setError(null);
        setGeneratedImage(null);

        try {
            const imageB64 = await generateImage(prompt);
            setGeneratedImage(imageB64);
        } catch (err) {
            console.error(err);
            setError('Failed to generate image. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-[var(--card-bg)] backdrop-blur-xl rounded-2xl shadow-lg p-6 md:p-8 border border-[var(--card-border)] card-enter">
            <h2 className="text-3xl font-bold text-[var(--text-heading)] mb-4">{t('imageGenerator.title')}</h2>
            <form onSubmit={handleGenerate} className="flex flex-col sm:flex-row items-center gap-3">
                <input
                    type="text"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder={t('imageGenerator.placeholder')}
                    className="flex-grow w-full p-3 bg-[var(--input-bg)] border border-gray-300/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] transition placeholder:text-[var(--text-secondary)] text-[var(--text-primary)]"
                    disabled={isLoading}
                />
                <button
                    type="submit"
                    disabled={isLoading || !prompt.trim()}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-[var(--accent-primary)] text-[var(--text-on-accent)] font-semibold rounded-lg shadow-lg hover:bg-[var(--accent-primary-hover)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--accent-primary)] transition-all duration-200 ease-in-out disabled:bg-[var(--accent-primary-disabled)] disabled:cursor-not-allowed"
                >
                    <ImageIcon className="w-5 h-5"/>
                    {t('imageGenerator.button')}
                </button>
            </form>
            {error && <ErrorMessage message={error} />}

            <div className="mt-8 aspect-square max-w-lg mx-auto bg-[var(--tab-bg)] rounded-lg flex items-center justify-center border border-[var(--card-border)] overflow-hidden">
                {isLoading && (
                    <div className="flex flex-col items-center text-[var(--text-secondary)]">
                        <svg className="animate-spin h-10 w-10 text-[var(--accent-primary)]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        <p className="mt-4 font-semibold">{t('imageGenerator.generating')}</p>
                    </div>
                )}
                {!isLoading && generatedImage && (
                    <div className="relative group w-full h-full">
                        <img src={`data:image/jpeg;base64,${generatedImage}`} alt={prompt} className="w-full h-full object-contain" />
                        <a
                            href={`data:image/jpeg;base64,${generatedImage}`}
                            download={`${prompt.substring(0, 20).replace(/\s/g, '_')}.jpeg`}
                            className="absolute bottom-4 right-4 bg-black/60 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            aria-label={t('imageGenerator.download')}
                        >
                            <DownloadIcon className="w-6 h-6" />
                        </a>
                    </div>
                )}
                 {!isLoading && !generatedImage && (
                     <div className="text-center text-[var(--text-secondary)] p-4">
                        <ImageIcon className="w-16 h-16 mx-auto opacity-20" />
                        <p className="mt-2">Your generated image will appear here.</p>
                     </div>
                 )}
            </div>
        </div>
    );
};