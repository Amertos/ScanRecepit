import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { FileUpload } from './components/FileUpload';
import { LoadingSpinner } from './components/LoadingSpinner';
import { ErrorMessage } from './components/ErrorMessage';
import { analyzeReceiptImage, generateInsight, generateWeeklyAnalysis } from './services/geminiService';
import type { ReceiptData } from './types';
import { Chatbot } from './components/Chatbot';
import { WeeklyAnalytics } from './components/WeeklyAnalytics';
import { ReceiptHistory } from './components/ReceiptHistory';
import { ReceiptModal } from './components/ReceiptModal';
import { useTheme } from './hooks/useTheme';
import { useTranslation } from './hooks/useTranslation';

const App: React.FC = () => {
  const [theme, setTheme] = useTheme();
  const { t, language } = useTranslation();
  const [activeTab, setActiveTab] = useState<'scanner' | 'chat'>('scanner');
  const [receipts, setReceipts] = useState<ReceiptData[]>([]);
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptData | null>(null);
  const [weeklyAnalysis, setWeeklyAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [isGeneratingAnalysis, setIsGeneratingAnalysis] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    try {
      const storedReceipts = localStorage.getItem('scanSaveReceipts');
      if (storedReceipts) {
        setReceipts(JSON.parse(storedReceipts));
      }
    } catch (e) {
      console.error("Failed to parse receipts from localStorage", e);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('scanSaveReceipts', JSON.stringify(receipts));
  }, [receipts]);
  
  const handleWeeklyAnalysis = useCallback(async () => {
      if(receipts.length === 0) {
        setWeeklyAnalysis(null);
        return;
      }
      
      setIsGeneratingAnalysis(true);
      try {
        const analysis = await generateWeeklyAnalysis(receipts, language);
        setWeeklyAnalysis(analysis);
      } catch(err) {
        console.error("Failed to generate weekly analysis", err);
      } finally {
        setIsGeneratingAnalysis(false);
      }
  }, [receipts, language]);
  
  useEffect(() => {
    // Only run analysis when receipts change and tab is already scanner
    if (activeTab === 'scanner') {
        handleWeeklyAnalysis();
    }
  }, [receipts, activeTab, handleWeeklyAnalysis]); // Rerun when receipts change


  const handleFileSelect = async (file: File | null) => {
    if (!file) return;

    setIsAnalyzing(true);
    setError(null);
    setActiveTab('scanner');

    try {
      const analyzedData = await analyzeReceiptImage(file);
      const insight = await generateInsight(analyzedData, language);
      
      const newReceipt: ReceiptData = {
        ...analyzedData,
        id: `receipt-${Date.now()}`,
        insight: insight
      };
      
      setReceipts(prevReceipts => [newReceipt, ...prevReceipts]);
      setSelectedReceipt(newReceipt);
      // The useEffect on `receipts` will trigger the weekly analysis update.

    } catch (err) {
      console.error(err);
      setError(t('error.failedAnalysis'));
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDeleteReceipt = (id: string) => {
    setReceipts(prev => prev.filter(r => r.id !== id));
    if (selectedReceipt?.id === id) {
      setSelectedReceipt(null);
    }
  };
  
  const filteredReceipts = receipts.filter(receipt => {
    const query = searchQuery.toLowerCase();
    const translatedCategory = t(`category.${receipt.category}`).toLowerCase();
    return (
      receipt.storeName.toLowerCase().includes(query) ||
      translatedCategory.includes(query) ||
      receipt.items.some(item => item.description.toLowerCase().includes(query))
    );
  });
  
  const DashboardView: React.FC = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-2 space-y-6">
            <ReceiptHistory 
                receipts={filteredReceipts}
                onReceiptSelect={setSelectedReceipt}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                isHistoryEmpty={receipts.length === 0}
            />
        </div>
        <div className="space-y-6">
            <div className="bg-[var(--card-bg)] backdrop-blur-xl p-6 rounded-2xl shadow-lg border border-[var(--card-border)] card-enter">
              <h2 className="text-2xl font-bold text-[var(--text-heading)] mb-4">{t('dashboard.scanNewReceiptTitle')}</h2>
              <FileUpload onFileSelect={handleFileSelect} disabled={isAnalyzing} />
              {error && <ErrorMessage message={error} />}
            </div>
            <WeeklyAnalytics analysis={weeklyAnalysis} isLoading={isGeneratingAnalysis} />
        </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[var(--bg-color)] text-[var(--text-primary)] transition-colors">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} theme={theme} setTheme={setTheme} />
      {isAnalyzing && <LoadingSpinner />}
      <main className="container mx-auto px-4 md:px-8 py-8">
        <div className={`transition-all duration-300 ${activeTab === 'chat' ? 'max-w-6xl' : 'max-w-4xl'} mx-auto`}>
          {activeTab === 'scanner' ? <DashboardView /> : <Chatbot allReceipts={receipts} />}
        </div>
      </main>
      {selectedReceipt && (
        <ReceiptModal 
          receipt={selectedReceipt} 
          onClose={() => setSelectedReceipt(null)}
          onDelete={(id) => {
            handleDeleteReceipt(id);
            setSelectedReceipt(null);
          }}
        />
      )}
    </div>
  );
};

export default App;