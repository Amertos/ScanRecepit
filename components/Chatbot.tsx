import React, { useState, useEffect, useRef, useMemo } from 'react';
import { GoogleGenAI, Chat, Content } from "@google/genai";
import type { ReceiptData, ChatMessage, ChatSession } from '../types';
import { SendIcon, SparklesIcon, PlusIcon, MessageIcon, TrashIcon, MenuIcon } from './Icons';
import { useTranslation } from '../hooks/useTranslation';
import { generateChatTitle } from '../services/geminiService';

const NEW_CHAT_TITLE = "New Chat";

export const Chatbot: React.FC<{ allReceipts: ReceiptData[] }> = ({ allReceipts }) => {
  const { t, language } = useTranslation();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [chatInstance, setChatInstance] = useState<Chat | null>(null);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeSession = useMemo(() => {
    return sessions.find(s => s.id === activeSessionId) || null;
  }, [sessions, activeSessionId]);

  // Load sessions from localStorage on mount
  useEffect(() => {
    try {
      const storedSessions = localStorage.getItem('scanSaveChatSessions');
      if (storedSessions) {
        const parsedSessions = JSON.parse(storedSessions);
        if (parsedSessions.length > 0) {
          setSessions(parsedSessions);
          setActiveSessionId(localStorage.getItem('scanSaveActiveSessionId') || parsedSessions[0].id);
          return;
        }
      }
    } catch (e) {
      console.error("Failed to parse chat sessions from localStorage", e);
    }
    // If no sessions, create a new one
    handleNewChat();
  }, []);

  // Save sessions and active session ID to localStorage
  useEffect(() => {
    if (sessions.length > 0) {
      localStorage.setItem('scanSaveChatSessions', JSON.stringify(sessions));
    }
    if (activeSessionId) {
      localStorage.setItem('scanSaveActiveSessionId', activeSessionId);
    }
  }, [sessions, activeSessionId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  useEffect(scrollToBottom, [activeSession?.messages]);
  
  // Initialize or re-initialize chat instance when active session changes
  useEffect(() => {
    if (!activeSession) return;

    let systemInstruction = `You are 'Savvy', a friendly and insightful financial assistant for the ScanSave app. Respond only in the language with this code: ${language}. You have access to the user's complete receipt history in JSON format. Your primary role is to analyze this data to answer questions, identify spending trends, and offer personalized savings tips. Be concise, friendly, and use simple formatting. Do not use markdown syntax like '##' or '***'.`;
    if (allReceipts.length > 0) {
      systemInstruction += ` Here is the user's receipt data: ${JSON.stringify(allReceipts)}`;
    }

    const formattedHistory = activeSession.messages.map(m => ({
      role: m.role,
      parts: [{ text: m.text }],
    })) as Content[];

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    const newChat = ai.chats.create({
      model: 'gemini-2.5-flash',
      history: formattedHistory,
      config: { systemInstruction: systemInstruction },
    });
    setChatInstance(newChat);
    
    // If it's a brand new chat, add the initial greeting
    if(activeSession.messages.length === 0) {
        setIsLoading(true);
        const greeting: ChatMessage = {
            role: 'model',
            text: allReceipts.length > 0 
                ? t('chatbot.greetingWithData')
                : t('chatbot.greetingWithoutData')
        };
        updateSessionMessages(activeSession.id, [greeting]);
        setIsLoading(false);
    }

  }, [activeSession, allReceipts, language, t]);


  const updateSessionMessages = (sessionId: string, messages: ChatMessage[]) => {
    setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, messages } : s));
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() || !chatInstance || isLoading || !activeSession) return;

    const userMessage: ChatMessage = { role: 'user', text: userInput };
    const updatedMessages = [...activeSession.messages, userMessage];
    updateSessionMessages(activeSession.id, updatedMessages);
    
    setIsLoading(true);
    const textToSend = userInput;
    setUserInput('');

    try {
      const response = await chatInstance.sendMessage({ message: textToSend });
      const modelMessage: ChatMessage = { role: 'model', text: response.text };
      const finalMessages = [...updatedMessages, modelMessage];
      updateSessionMessages(activeSession.id, finalMessages);

      if (activeSession.title === NEW_CHAT_TITLE && finalMessages.length >= 2) {
          const conversationStart = `${finalMessages[0].text} ${finalMessages[1].text}`;
          const newTitle = await generateChatTitle(conversationStart, language);
          setSessions(prev => prev.map(s => s.id === activeSession.id ? { ...s, title: newTitle } : s));
      }

    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage: ChatMessage = { role: 'model', text: t('chatbot.error') };
      updateSessionMessages(activeSession.id, [...updatedMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleNewChat = () => {
    const newSession: ChatSession = {
      id: `session-${Date.now()}`,
      title: NEW_CHAT_TITLE,
      startTime: Date.now(),
      messages: [],
    };
    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
    setIsSidebarOpen(false);
  };
  
  const handleDeleteSession = (e: React.MouseEvent, sessionIdToDelete: string) => {
    e.stopPropagation();
    const remainingSessions = sessions.filter(s => s.id !== sessionIdToDelete);
    setSessions(remainingSessions);
    if (activeSessionId === sessionIdToDelete) {
        if(remainingSessions.length > 0) {
            setActiveSessionId(remainingSessions[0].id);
        } else {
            handleNewChat();
        }
    }
  };

  return (
    <div className="bg-[var(--card-bg)] backdrop-blur-xl rounded-2xl shadow-lg flex h-[75vh] max-h-[700px] border border-[var(--card-border)] card-enter transition-colors overflow-hidden relative">
        {/* Sidebar */}
        <div className={`absolute top-0 left-0 w-full h-full bg-[var(--card-bg)] z-20 transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:static md:w-1/3 md:transform-none md:z-auto flex flex-col border-r border-[var(--card-border)]`}>
            <div className="p-3 border-b border-[var(--card-border)] flex items-center gap-2">
                <button 
                    onClick={handleNewChat}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[var(--accent-primary)] text-[var(--text-on-accent)] font-semibold rounded-lg shadow-md hover:bg-[var(--accent-primary-hover)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--accent-primary)] transition-all"
                >
                    <PlusIcon className="w-5 h-5" />
                    {t('chatbot.newChat')}
                </button>
                <button 
                    onClick={() => setIsSidebarOpen(false)}
                    className="p-2 text-[var(--text-secondary)] hover:bg-[var(--tab-bg)] rounded-lg md:hidden"
                    aria-label="Close menu"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>
            <div className="flex-grow overflow-y-auto p-2 space-y-1">
                {sessions.map(session => (
                    <button
                        key={session.id}
                        onClick={() => {
                            setActiveSessionId(session.id);
                            setIsSidebarOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 p-2 rounded-lg text-left transition-colors group ${activeSessionId === session.id ? 'bg-[var(--accent-primary)]/20' : 'hover:bg-[var(--tab-bg)]'}`}
                    >
                       <MessageIcon className="w-5 h-5 text-[var(--text-secondary)] flex-shrink-0" />
                       <span className="flex-grow text-sm font-medium text-[var(--text-primary)] truncate">{session.title}</span>
                       <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                           <button onClick={(e) => handleDeleteSession(e, session.id)} className="p-1 text-[var(--text-secondary)] hover:text-red-500 rounded-full hover:bg-red-500/10">
                               <TrashIcon className="w-4 h-4" />
                           </button>
                       </div>
                    </button>
                ))}
            </div>
        </div>
        
        {/* Main Chat Window */}
        <div className="w-full md:w-2/3 flex flex-col h-full">
            {/* Mobile Header */}
            <div className="p-3 border-b border-[var(--card-border)] flex items-center justify-between md:hidden">
                <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-[var(--text-secondary)] hover:bg-[var(--tab-bg)] rounded-lg">
                    <MenuIcon className="w-6 h-6" />
                </button>
                <h3 className="font-semibold text-sm text-[var(--text-primary)] truncate px-2">
                    {activeSession?.title === NEW_CHAT_TITLE ? t('chatbot.newChat') : activeSession?.title}
                </h3>
                <div className="w-10"></div> {/* Spacer */}
            </div>

            <div className="flex-grow overflow-y-auto p-6 space-y-6">
            {activeSession?.messages.map((msg, index) => (
                <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                    {msg.role === 'model' && (
                    <div className="w-8 h-8 rounded-full bg-[var(--accent-primary)] text-[var(--text-on-accent)] flex items-center justify-center flex-shrink-0 shadow-md">
                        <SparklesIcon className="w-5 h-5"/>
                    </div>
                    )}
                    <div className={`p-3 rounded-2xl max-w-lg shadow-md transition-colors ${msg.role === 'user' ? 'bg-[var(--accent-primary)] text-[var(--text-on-accent)] rounded-br-none' : 'bg-[var(--modal-bg)] text-[var(--text-primary)] rounded-bl-none'}`}>
                    {msg.text.split('\n').map((line, i) => <p key={i}>{line}</p>)}
                    </div>
                </div>
            ))}
            {isLoading && (
                <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-[var(--accent-primary)] text-[var(--text-on-accent)] flex items-center justify-center flex-shrink-0 shadow-md">
                    <SparklesIcon className="w-5 h-5"/>
                    </div>
                    <div className="p-3 rounded-2xl bg-[var(--modal-bg)] text-[var(--text-primary)] rounded-bl-none shadow-md">
                    <div className="flex items-center space-x-1.5">
                        <span className="w-2 h-2 bg-[var(--accent-primary)] rounded-full animate-pulse" style={{ animationDelay: '0s' }}></span>
                        <span className="w-2 h-2 bg-[var(--accent-primary)] rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></span>
                        <span className="w-2 h-2 bg-[var(--accent-primary)] rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></span>
                    </div>
                    </div>
                </div>
            )}
            <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="flex items-center gap-3 border-t border-[var(--card-border)] p-4 transition-colors">
            <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder={t('chatbot.inputPlaceholder')}
                className="flex-grow p-3 bg-[var(--input-bg)] border border-gray-300/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] transition placeholder:text-[var(--text-secondary)] text-[var(--text-primary)]"
                disabled={isLoading}
                aria-label={t('chatbot.inputPlaceholder')}
            />
            <button
                type="submit"
                disabled={isLoading || !userInput.trim()}
                className="p-3 bg-[var(--accent-primary)] text-[var(--text-on-accent)] rounded-lg hover:bg-[var(--accent-primary-hover)] disabled:bg-[var(--accent-primary-disabled)] disabled:cursor-not-allowed transition-colors flex-shrink-0 shadow-lg"
                aria-label={t('chatbot.send')}
            >
                <SendIcon />
            </button>
            </form>
        </div>
    </div>
  );
};