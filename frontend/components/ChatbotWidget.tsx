'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, User, Sparkles, Settings, ArrowLeft, Key, Check, AlertCircle } from 'lucide-react';
import { api } from '../lib/api';

interface Message {
  sender: 'user' | 'bot';
  text: string;
}

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [message, setMessage] = useState('');
  const [geminiKey, setGeminiKey] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'bot',
      text: "Hi! I am your **AegisScore AI Advisor**. Ask me any credit scoring, financial analytics, or risk management questions!\n\n*Tip:* To enable unlimited AI capabilities (answering any general query), click the **Gear (⚙️) icon** above to add a Google Gemini API Key."
    }
  ]);
  const [suggestions, setSuggestions] = useState<string[]>([
    'How do I improve my score?',
    'What is credit utilization?',
    'What is a good DTI ratio?'
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load API key from local storage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedKey = localStorage.getItem('creditguard_gemini_api_key') || '';
      setGeminiKey(savedKey);
    }
  }, [isOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen && !showSettings) {
      scrollToBottom();
    }
  }, [messages, isOpen, showSettings]);

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    const userMsg = textToSend.trim();
    setMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
    setMessage('');
    setIsLoading(true);

    try {
      const key = typeof window !== 'undefined' ? localStorage.getItem('creditguard_gemini_api_key') || '' : '';
      
      const response = await api.post<{ reply: string; suggested_questions: string[] }>('/chatbot', {
        message: userMsg
      }, {
        headers: {
          'X-Gemini-Key': key
        }
      });

      setMessages(prev => [...prev, { sender: 'bot', text: response.reply }]);
      if (response.suggested_questions && response.suggested_questions.length > 0) {
        setSuggestions(response.suggested_questions);
      }
    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        { sender: 'bot', text: "Sorry, I ran into an error. Please check your connection or try again." }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSettings = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('creditguard_gemini_api_key', geminiKey.trim());
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        setShowSettings(false);
      }, 1000);
    }
  };

  const handleClearSettings = () => {
    setGeminiKey('');
    if (typeof window !== 'undefined') {
      localStorage.removeItem('creditguard_gemini_api_key');
    }
  };

  const formatMessage = (text: string) => {
    let formatted = text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code class="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-[11px] font-mono font-bold">$1</code>')
      .replace(/\n/g, '<br/>');
    return <span dangerouslySetInnerHTML={{ __html: formatted }} />;
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-sky-500 hover:bg-sky-600 text-white p-4 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95 animate-bounce"
          style={{ animationDuration: '3s' }}
        >
          <MessageSquare className="w-6 h-6" />
        </button>
      )}

      {/* Chat Box */}
      {isOpen && (
        <div className="w-96 h-[520px] glass-panel rounded-2xl shadow-2xl border-slate-200/50 dark:border-slate-800/80 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-300">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 dark:from-slate-900 dark:to-slate-950 p-4 text-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="bg-sky-500/20 p-1.5 rounded-lg text-sky-400">
                <Sparkles className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm tracking-tight">AI Financial Advisor</h3>
                <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse"></span>
                  Active Expert
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className={`p-1.5 rounded-lg transition-colors ${showSettings ? 'bg-sky-500 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                title="AI Settings"
              >
                <Settings className="w-4.5 h-4.5" />
              </button>
              <button
                onClick={() => {
                  setIsOpen(false);
                  setShowSettings(false);
                }}
                className="text-slate-400 hover:text-white p-1.5 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>
          </div>

          {/* Settings Pane */}
          {showSettings ? (
            <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-slate-50/50 dark:bg-slate-950/40 text-xs flex flex-col">
              <div className="flex items-center gap-2 text-slate-800 dark:text-white font-extrabold border-b border-slate-200/40 dark:border-slate-800/40 pb-2">
                <Key className="w-4 h-4 text-sky-500" />
                <span>AI Configuration</span>
              </div>

              <p className="text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">
                To unlock general AI conversations that can answer any non-financial or complex query, provide a **Google Gemini API Key**.
              </p>
              
              <div className="bg-sky-500/5 border border-sky-500/10 p-3 rounded-xl flex gap-2 text-[11px] leading-relaxed text-sky-600 dark:text-sky-400 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  Your key is saved locally in your own browser's secure cache (`localStorage`) and is only used to connect directly with the Google Generative Language service.
                </span>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-slate-400">Gemini API Key</label>
                <input
                  type="password"
                  placeholder="AIzaSy..."
                  value={geminiKey}
                  onChange={(e) => setGeminiKey(e.target.value)}
                  className="w-full glass-input px-3.5 py-2.5 rounded-xl font-mono text-xs focus:ring-2 focus:ring-sky-500/20"
                />
              </div>

              <div className="flex gap-2 pt-2 mt-auto">
                <button
                  onClick={handleSaveSettings}
                  className="flex-1 bg-sky-500 hover:bg-sky-600 text-white font-bold py-2.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5"
                >
                  {saveSuccess ? <Check className="w-4 h-4" /> : null}
                  {saveSuccess ? 'Saved!' : 'Save Key'}
                </button>
                <button
                  onClick={handleClearSettings}
                  disabled={!geminiKey}
                  className="border border-slate-200/50 dark:border-slate-800/80 hover:bg-slate-500/5 text-slate-655 font-bold px-4 py-2.5 rounded-xl transition-colors disabled:opacity-50"
                >
                  Clear
                </button>
              </div>

              <a
                href="https://aistudio.google.com/"
                target="_blank"
                rel="noreferrer"
                className="text-[10px] font-bold text-sky-500 hover:underline text-center mt-2"
              >
                Get a free Gemini API key from Google AI Studio →
              </a>
            </div>
          ) : (
            <>
              {/* Messages Area */}
              <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/20 dark:bg-slate-950/20">
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex gap-2.5 max-w-[85%] ${
                      msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''
                    }`}
                  >
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-white ${
                      msg.sender === 'user' ? 'bg-sky-500' : 'bg-slate-700 dark:bg-slate-800'
                    }`}>
                      {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4 text-sky-400" />}
                    </div>
                    <div className={`p-3 rounded-2xl text-xs leading-relaxed shadow-sm ${
                      msg.sender === 'user'
                        ? 'bg-sky-500 text-white rounded-tr-none'
                        : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-100 dark:border-slate-800 rounded-tl-none'
                    }`}>
                      {formatMessage(msg.text)}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex gap-2.5 max-w-[85%]">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center bg-slate-700 dark:bg-slate-800 text-sky-400 shrink-0">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl rounded-tl-none border border-slate-100 dark:border-slate-800 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-bounce" style={{ animationDelay: '0ms' }}></span>
                      <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-bounce" style={{ animationDelay: '150ms' }}></span>
                      <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-bounce" style={{ animationDelay: '300ms' }}></span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Suggestions */}
              {suggestions.length > 0 && (
                <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-800/40 bg-white/40 dark:bg-slate-950/20">
                  <div className="flex flex-wrap gap-1.5">
                    {suggestions.map((s, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSend(s)}
                        className="text-[10px] font-semibold text-sky-600 dark:text-sky-400 bg-sky-500/5 hover:bg-sky-500/10 border border-sky-500/10 dark:border-sky-400/10 px-2.5 py-1 rounded-full transition-colors truncate max-w-[200px]"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Input Footer */}
              <div className="p-3 border-t border-slate-200/30 dark:border-slate-800/30 bg-white/65 dark:bg-slate-900/50 flex gap-2">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend(message)}
                  placeholder="Ask a financial question..."
                  className="flex-1 glass-input px-3.5 py-2.5 rounded-xl text-xs focus:ring-2 focus:ring-sky-500/20 transition-all"
                />
                <button
                  onClick={() => handleSend(message)}
                  disabled={isLoading || !message.trim()}
                  className="bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white p-2.5 rounded-xl flex items-center justify-center shadow-md transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
