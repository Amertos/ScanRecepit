import React, { useState, useEffect, useRef, useMemo } from 'react';
import { GoogleGenAI, Chat, Content } from "@google/genai";
import type { ReceiptData, ChatMessage, ChatSession } from '../types';
import { SendIcon, SparklesIcon, PlusIcon, MessageIcon, TrashIcon, MenuIcon, MicrophoneIcon, MapPinIcon } from './Icons';
import { useTranslation } from '../hooks/useTranslation';
import { generateChatTitle } from '../services/geminiService';

// Fix: Add type definitions for the Web Speech API to resolve TypeScript errors.
// The default DOM typings do not include SpeechRecognition.
interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
}

interface SpeechRecognitionEvent extends Event {
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  readonly transcript: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: (this: SpeechRecognition, ev: Event) => any;
  onend: (this: SpeechRecognition, ev: Event) => any;
  onerror: (this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any;
  onresult: (this: SpeechRecognition, ev: SpeechRecognitionEvent) => any;
  start(): void;
  stop(): void;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

interface Location {
    latitude: number;
    longitude: number;
}

const NEW_CHAT_TITLE = "New Chat";

const renderMessageContent = (text: string) => {
    const lines = text.split('\n').filter(line => line.trim() !== '');
    return lines.map((line, index) => {
        const boldRegex = /\*\*(.*?)\*\*/g;
        const linkRegex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
        
        // Fix: Replaced `JSX.Element` with `React.ReactNode` to fix "Cannot find namespace 'JSX'" error.
        let processedLine: React.ReactNode[] = [line];

        // Fix: Replaced `JSX.Element` with `React.ReactNode` to fix "Cannot find namespace 'JSX'" error.
        let tempProcessedLineForLinks: React.ReactNode[] = [];
        processedLine.forEach((segment, segIndex) => {
            if (typeof segment === 'string') {
                const parts = segment.split(linkRegex);
                for (let i = 0; i < parts.length; i++) {
                    if (i % 3 === 0) {
                        tempProcessedLineForLinks.push(parts[i]);
                    } else if (i % 3 === 1) {
                        const linkText = parts[i];
                        const linkUrl = parts[i + 1];
                        tempProcessedLineForLinks.push(
                            <a key={`${index}-link-${segIndex}-${i}`} href={linkUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[var(--accent-primary)] underline hover:opacity-80">
                                <MapPinIcon className="w-4 h-4 flex-shrink-0" />
                                {linkText}
                            </a>
                        );
                        i++;
                    }
                }
            } else {
                tempProcessedLineForLinks.push(segment);
            }
        });
        processedLine = tempProcessedLineForLinks;

        // Fix: Replaced `JSX.Element` with `React.ReactNode` to fix "Cannot find namespace 'JSX'" error.
        let tempProcessedLineForBold: React.ReactNode[] = [];
        processedLine.forEach((segment, segIndex) => {
            if (typeof segment === 'string') {
                const parts = segment.split(boldRegex);
                for (let i = 0; i < parts.length; i++) {
                    if (i % 2 === 0) {
                        tempProcessedLineForBold.push(parts[i]);
                    } else {
                        tempProcessedLineForBold.push(<strong key={`${index}-bold-${segIndex}-${i}`} className="font-bold">{parts[i]}</strong>);
                    }
                }
            } else {
                tempProcessedLineForBold.push(segment);
            }
        });
        processedLine = tempProcessedLineForBold;
        
        return <p key={index}>{processedLine}</p>;
    });
};


export const Chatbot: React.FC<{ allReceipts: ReceiptData[] }> = ({ allReceipts }) => {
  const { t, language } = useTranslation();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [chatInstance, setChatInstance] = useState<Chat | null>(null);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [location, setLocation] = useState<Location | null>(null);
  const [mapsFooter, setMapsFooter] = useState<string>('');
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isSpeechSupported = useMemo(() => typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window), []);

  const activeSession = useMemo(() => {
    return sessions.find(s => s.id === activeSessionId) || null;
  }, [sessions, activeSessionId]);

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
    handleNewChat();
  }, []);

  useEffect(() => {
    if (sessions.length > 0) {
      localStorage.setItem('scanSaveChatSessions', JSON.stringify(sessions));
    }
    if (activeSessionId) {
      localStorage.setItem('scanSaveActiveSessionId', activeSessionId);
    }
  }, [sessions, activeSessionId]);
  
  useEffect(() => {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setLocation({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                });
            },
            (error) => {
                console.error("Geolocation error:", error);
            }
        );
    }
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  useEffect(scrollToBottom, [activeSession?.messages]);

  useEffect(() => {
    if (!isSpeechSupported) {
      console.warn("Speech recognition not supported by this browser.");
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = language;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
    };

    recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
            .map((result) => result[0])
            .map((result) => result.transcript)
            .join('');
        setUserInput(transcript);
    };
    
    recognitionRef.current = recognition;

    return () => {
        if (recognitionRef.current) {
          recognitionRef.current.stop();
        }
    };
  }, [language, isSpeechSupported]);
  
  useEffect(() => {
    if (!activeSession) return;

    let systemInstruction = `You are 'Savvy', a friendly and insightful financial assistant for the ScanSave app. Respond only in the language with this code: ${language}. You have access to the user's complete receipt history in JSON format. Your primary role is to analyze this data to answer questions, identify spending trends, and offer personalized savings tips. Be concise, friendly, and use simple formatting. Do not use markdown syntax like '##' or '***'. When asked about locations, stores, or directions, you MUST use your tools to provide accurate, up-to-date information.`;
    if (allReceipts.length > 0) {
      systemInstruction += ` Here is the user's receipt data: ${JSON.stringify(allReceipts)}`;
    }

    const formattedHistory = activeSession.messages.map(m => ({
      role: m.role,
      parts: [{ text: m.text }],
    })) as Content[];

    const tools: any[] = [{googleMaps: {}}];
    const toolConfig: any = {};
    if (location) {
        toolConfig.retrievalConfig = {
            latLng: {
                latitude: location.latitude,
                longitude: location.longitude
            }
        }
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    const newChat = ai.chats.create({
      model: 'gemini-2.5-flash',
      history: formattedHistory,
      config: { 
        systemInstruction: systemInstruction,
        tools: tools,
        ...(Object.keys(toolConfig).length > 0 && { toolConfig: toolConfig }),
      },
    });
    setChatInstance(newChat);
    
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

  }, [activeSession, allReceipts, language, t, location]);


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
    setMapsFooter('');
    const textToSend = userInput;
    setUserInput('');

    try {
      const response = await chatInstance.sendMessage({ message: textToSend });
      let modelText = response.text;
      
      const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (groundingChunks && groundingChunks.length > 0) {
          const mapLinks = groundingChunks
              .filter(chunk => chunk.maps && chunk.maps.uri)
              .map(chunk => `[${chunk.maps.title}](${chunk.maps.uri})`)
              .join('\n');
          
          if (mapLinks) {
              modelText += `\n\n**${t('chatbot.sources')}:**\n${mapLinks}`;
              setMapsFooter(t('chatbot.mapsFooter'));
          }
      }

      const modelMessage: ChatMessage = { role: 'model', text: modelText };
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

  const handleListenToggle = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
        recognitionRef.current.stop();
    } else {
        recognitionRef.current.start();
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
                    <div className={`p-3 rounded-2xl max-w-lg shadow-md transition-colors prose-p:my-1 prose-strong:text-[var(--text-heading)] ${msg.role === 'user' ? 'bg-[var(--accent-primary)] text-[var(--text-on-accent)] rounded-br-none' : 'bg-[var(--modal-bg)] text-[var(--text-primary)] rounded-bl-none'}`}>
                        {renderMessageContent(msg.text)}
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
            
            <div className="border-t border-[var(--card-border)]">
                <form onSubmit={handleSendMessage} className="flex items-center gap-3 p-4 transition-colors">
                <input
                    type="text"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    placeholder={t('chatbot.inputPlaceholder')}
                    className="flex-grow p-3 bg-[var(--input-bg)] border border-gray-300/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] transition placeholder:text-[var(--text-secondary)] text-[var(--text-primary)]"
                    disabled={isLoading}
                    aria-label={t('chatbot.inputPlaceholder')}
                />
                 {isSpeechSupported && (
                    <button
                        type="button"
                        onClick={handleListenToggle}
                        className={`p-3 rounded-lg transition-colors flex-shrink-0 ${
                            isListening
                            ? 'bg-red-500/20 text-red-500 animate-pulse'
                            : 'text-[var(--text-secondary)] hover:bg-[var(--tab-bg)]'
                        }`}
                        aria-label={isListening ? 'Stop listening' : 'Start listening'}
                        >
                        <MicrophoneIcon className="w-6 h-6" />
                    </button>
                )}
                <button
                    type="submit"
                    disabled={isLoading || !userInput.trim()}
                    className="p-3 bg-[var(--accent-primary)] text-[var(--text-on-accent)] rounded-lg hover:bg-[var(--accent-primary-hover)] disabled:bg-[var(--accent-primary-disabled)] disabled:cursor-not-allowed transition-colors flex-shrink-0 shadow-lg"
                    aria-label={t('chatbot.send')}
                >
                    <SendIcon />
                </button>
                </form>
                 {mapsFooter && <p className="text-xs text-center text-[var(--text-secondary)] pb-2">{mapsFooter}</p>}
            </div>
        </div>
    </div>
  );
};