import { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  X,
  Send,
  Sparkles,
  Bot,
  User,
  RotateCcw,
  ChevronDown,
  ArrowRight,
  Lightbulb,
  ExternalLink,
  Copy,
  Check
} from 'lucide-react';
import { generateChatResponse, type ChatMessage, type ChatAction } from '@/lib/aiChatbot';
import type { UserProfile, NutritionResult } from '@/lib/calculations';
import type { View } from '@/components/Layout';

interface ChatbotProps {
  currentPhase: string;
  profile: UserProfile | null;
  result: NutritionResult | null;
  onNavigate: (view: View) => void;
  onStartPlan: () => void;
  onEditProfile: () => void;
  onRegenerate: () => void;
}

const INITIAL_SUGGESTIONS = [
  'How are my calories & macros calculated?',
  'How do I check vitamin deficiencies?',
  'How do I scan or search food?',
  'How do I export my plan as PDF?'
];

export function Chatbot({
  currentPhase,
  profile,
  result,
  onNavigate,
  onStartPlan,
  onEditProfile,
  onRegenerate,
}: ChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasOpenedBefore, setHasOpenedBefore] = useState(false);
  const [showTooltip, setShowTooltip] = useState(true);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'welcome-msg',
      sender: 'assistant',
      text: `👋 **Hi there! I'm your NutriSynth AI Assistant.**\n\nI can answer any questions about our website, metabolic formulas (BMR/TDEE), meal plans, food scanning, or deficiency risk checks.\n\n*What would you like to know or do?*`,
      timestamp: new Date(),
      suggestedQuestions: INITIAL_SUGGESTIONS,
      actions: result
        ? [
            { label: '📊 View Dashboard', type: 'navigate', target: 'dashboard' },
            { label: '🧬 Deficiency Check', type: 'navigate', target: 'deficiency' }
          ]
        : [
            { label: '🚀 Build My Plan', type: 'startOnboarding' },
            { label: '📖 How It Works', type: 'navigate', target: 'how-it-works' }
          ]
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom of conversation
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping, isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setHasOpenedBefore(true);
      setShowTooltip(false);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
    }
  }, [isOpen]);

  // Dismiss tooltip after 10 seconds if not clicked
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowTooltip(false);
    }, 12000);
    return () => clearTimeout(timer);
  }, []);

  const handleSendMessage = (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Realistic smart response delay (400 - 600ms)
    setTimeout(() => {
      const response = generateChatResponse(text, {
        phase: currentPhase,
        profile,
        result,
      });

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        text: response.text,
        timestamp: new Date(),
        actions: response.actions,
        suggestedQuestions: response.suggestedQuestions,
      };

      setIsTyping(false);
      setMessages((prev) => [...prev, assistantMessage]);
    }, 500);
  };

  const handleActionClick = (action: ChatAction) => {
    if (action.type === 'navigate' && action.target) {
      onNavigate(action.target as View);
    } else if (action.type === 'startOnboarding') {
      onStartPlan();
    } else if (action.type === 'editProfile') {
      onEditProfile();
    } else if (action.type === 'regenerate') {
      onRegenerate();
      const confirmMsg: ChatMessage = {
        id: `assistant-confirm-${Date.now()}`,
        sender: 'assistant',
        text: `✨ **Meal Plan Regenerated!**\n\nI have reshuffled your meal recommendations on your Dashboard with fresh recipes matching your exact calorie and macro targets.`,
        timestamp: new Date(),
        actions: [{ label: '📊 View Dashboard', type: 'navigate', target: 'dashboard' }],
      };
      setMessages((prev) => [...prev, confirmMsg]);
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        sender: 'assistant',
        text: `✨ Chat history cleared! How can I assist you with NutriSynth today?`,
        timestamp: new Date(),
        suggestedQuestions: INITIAL_SUGGESTIONS,
      },
    ]);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Helper to render markdown-like simple text formatting
  const renderFormattedText = (raw: string) => {
    const lines = raw.split('\n');
    return (
      <div className="space-y-1.5 text-sm leading-relaxed">
        {lines.map((line, idx) => {
          if (!line.trim()) {
            return <div key={idx} className="h-1" />;
          }

          // Header 3
          if (line.startsWith('### ')) {
            return (
              <div key={idx} className="font-display font-bold text-stone-900 text-sm pt-1">
                {line.replace('### ', '')}
              </div>
            );
          }

          // Bullet points
          if (line.trim().startsWith('• ') || line.trim().startsWith('- ')) {
            const content = line.trim().substring(2);
            return (
              <div key={idx} className="flex items-start gap-1.5 pl-1 text-stone-700">
                <span className="text-brand-600 font-bold leading-none mt-1.5">•</span>
                <span dangerouslySetInnerHTML={{ __html: formatInline(content) }} />
              </div>
            );
          }

          // Numbered list
          if (/^\d+\.\s/.test(line.trim())) {
            return (
              <div key={idx} className="pl-1 text-stone-700 font-medium">
                <span dangerouslySetInnerHTML={{ __html: formatInline(line) }} />
              </div>
            );
          }

          return (
            <p
              key={idx}
              className="text-stone-700"
              dangerouslySetInnerHTML={{ __html: formatInline(line) }}
            />
          );
        })}
      </div>
    );
  };

  const formatInline = (str: string) => {
    return str
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-stone-900">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="italic text-stone-600">$1</em>')
      .replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 rounded bg-brand-50 text-brand-800 text-xs font-mono border border-brand-200/50">$1</code>');
  };

  return (
    <>
      {/* FLOATING ACTION BUTTON CONTAINER - strictly fixed over page, zero layout shift */}
      <aside aria-label="NutriSynth AI Chatbot" className="fixed bottom-5 right-5 z-50 flex flex-col items-end pointer-events-auto">
        {/* Floating Greeting Bubble (shows initially until opened or dismissed) */}
        {!isOpen && showTooltip && (
          <div className="mb-3 max-w-xs bg-white dark:bg-[#121824] rounded-2xl p-3 shadow-xl border border-stone-200/80 dark:border-stone-800 animate-fade-in flex items-start gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-brand-100 dark:bg-brand-950/60 flex items-center justify-center text-brand-700 dark:text-brand-300 shrink-0">
              <Sparkles className="w-4 h-4 text-brand-600 dark:text-brand-400" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-semibold text-stone-900 dark:text-white">Need help with NutriSynth?</p>
              <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-snug mt-0.5">
                Ask our AI about meal plans, calories, formulas, or deficiency checks!
              </p>
              <button
                onClick={() => setIsOpen(true)}
                className="mt-2 text-xs font-semibold text-brand-700 dark:text-brand-400 hover:text-brand-800 dark:hover:text-brand-300 flex items-center gap-1"
              >
                Chat with AI <ArrowRight className="w-3 h-3" />
              </button>
            </div>
            <button
              onClick={() => setShowTooltip(false)}
              className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 p-0.5"
              aria-label="Dismiss message"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Chat Toggle Button */}
        <button
          onClick={() => setIsOpen((prev) => !prev)}
          className={`group flex items-center gap-2.5 px-4 py-3 rounded-full shadow-lg transition-all duration-300 ${
            isOpen
              ? 'bg-stone-900 dark:bg-stone-800 text-white hover:bg-stone-800 dark:hover:bg-stone-700'
              : 'bg-gradient-to-r from-brand-600 to-emerald-600 text-white hover:shadow-glow hover:scale-105'
          }`}
          aria-label={isOpen ? 'Close AI Chat' : 'Open AI Chat'}
        >
          {isOpen ? (
            <>
              <ChevronDown className="w-5 h-5 transition-transform group-hover:translate-y-0.5" />
              <span className="text-sm font-semibold pr-1">Close Chat</span>
            </>
          ) : (
            <>
              <div className="relative">
                <Bot className="w-5 h-5 transition-transform group-hover:scale-110" />
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-300 rounded-full border-2 border-white dark:border-stone-900 animate-pulse" />
              </div>
              <span className="text-sm font-semibold">Ask AI</span>
              <Sparkles className="w-3.5 h-3.5 text-brand-200" />
            </>
          )}
        </button>

        {/* CHAT WINDOW MODAL / POPUP */}
        {isOpen && (
          <div
            className="fixed bottom-20 right-4 sm:right-6 w-[360px] sm:w-[410px] max-w-[calc(100vw-2rem)] h-[580px] max-h-[calc(100vh-6.5rem)] rounded-2xl bg-white dark:bg-[#121824] shadow-2xl border border-stone-200/90 dark:border-stone-800 flex flex-col overflow-hidden z-50 animate-fade-in-scale"
            role="dialog"
            aria-label="NutriSynth AI Chat Assistant"
          >
            {/* Header */}
            <div className="px-4 py-3.5 bg-stone-900 text-white flex items-center justify-between border-b border-stone-800 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-500 to-emerald-400 flex items-center justify-center text-white shadow-sm">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h2 className="text-xs font-bold font-display text-white tracking-wide">NutriSynth AI</h2>
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-brand-900/80 text-brand-300 border border-brand-700/50">
                      Assistant
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-400 leading-tight">Instant answers & site guidance</p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={handleClearChat}
                  title="Clear conversation"
                  className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  title="Close chat"
                  className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Context Notice Bar (if user has active plan) */}
            {result && profile && (
              <div className="px-3.5 py-1.5 bg-brand-50/80 dark:bg-brand-950/40 border-b border-brand-100 dark:border-brand-900/60 flex items-center justify-between text-[11px] text-brand-900 dark:text-brand-200 shrink-0">
                <div className="flex items-center gap-1.5 truncate">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-500 shrink-0" />
                  <span className="truncate">
                    Active Target: <strong>{result.tdee} kcal</strong> ({profile.goal})
                  </span>
                </div>
                <span className="text-[10px] text-brand-700 dark:text-brand-300 font-mono shrink-0 ml-1">
                  P:{result.proteinG}g C:{result.carbG}g F:{result.fatG}g
                </span>
              </div>
            )}

            {/* Message History */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-stone-50/50 dark:bg-[#0c1017]">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`flex items-start gap-2 max-w-[88%] ${
                      msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
                    }`}
                  >
                    {/* Avatar */}
                    <div
                      className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                        msg.sender === 'user'
                          ? 'bg-stone-700 dark:bg-stone-600 text-white'
                          : 'bg-brand-600 text-white'
                      }`}
                    >
                      {msg.sender === 'user' ? (
                        <User className="w-3.5 h-3.5" />
                      ) : (
                        <Bot className="w-3.5 h-3.5" />
                      )}
                    </div>

                    {/* Bubble Content */}
                    <div
                      className={`p-3 rounded-2xl shadow-sm text-sm relative group ${
                        msg.sender === 'user'
                          ? 'bg-brand-600 text-white rounded-tr-sm'
                          : 'bg-white dark:bg-[#182030] border border-stone-200/80 dark:border-stone-700/70 text-stone-800 dark:text-stone-100 rounded-tl-sm'
                      }`}
                    >
                      {msg.sender === 'assistant' ? (
                        renderFormattedText(msg.text)
                      ) : (
                        <p className="whitespace-pre-wrap">{msg.text}</p>
                      )}

                      {/* Copy message button on assistant response */}
                      {msg.sender === 'assistant' && (
                        <button
                          onClick={() => copyToClipboard(msg.text, msg.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity absolute top-2 right-2 p-1 rounded hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
                          title="Copy answer"
                        >
                          {copiedId === msg.id ? (
                            <Check className="w-3 h-3 text-brand-600 dark:text-brand-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      )}

                      {/* Interactive Action Buttons */}
                      {msg.actions && msg.actions.length > 0 && (
                        <div className="mt-3 pt-2.5 border-t border-stone-100 dark:border-stone-700/60 flex flex-wrap gap-1.5">
                          {msg.actions.map((act, actIdx) => (
                            <button
                              key={actIdx}
                              onClick={() => handleActionClick(act)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 border border-brand-200/60 dark:border-brand-800/60 hover:bg-brand-100 dark:hover:bg-brand-900/80 transition-all active:scale-95"
                            >
                              <span>{act.label}</span>
                              <ArrowRight className="w-3 h-3 text-brand-500" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Suggested follow-up questions */}
                  {msg.suggestedQuestions && msg.suggestedQuestions.length > 0 && (
                    <div className="mt-2 pl-8 flex flex-wrap gap-1.5">
                      {msg.suggestedQuestions.map((q, qIdx) => (
                        <button
                          key={qIdx}
                          onClick={() => handleSendMessage(q)}
                          className="text-[11px] text-stone-600 dark:text-stone-300 bg-white dark:bg-[#182030] border border-stone-200 dark:border-stone-700 rounded-full px-2.5 py-1 hover:bg-stone-100 dark:hover:bg-stone-700 hover:text-brand-700 dark:hover:text-brand-300 hover:border-brand-200 dark:hover:border-brand-700 transition-colors text-left flex items-center gap-1 shadow-2xs"
                        >
                          <Lightbulb className="w-2.5 h-2.5 text-amber-500 shrink-0" />
                          <span>{q}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  <span className="text-[10px] text-stone-400 dark:text-stone-500 mt-1 px-1">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}

              {/* Typing indicator */}
              {isTyping && (
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-brand-600 text-white flex items-center justify-center">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                  <div className="bg-white dark:bg-[#182030] border border-stone-200/80 dark:border-stone-700 rounded-2xl rounded-tl-sm px-3.5 py-2.5 shadow-sm flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-brand-500 animate-bounce" />
                    <span className="w-2 h-2 rounded-full bg-brand-500 animate-bounce [animation-delay:0.2s]" />
                    <span className="w-2 h-2 rounded-full bg-brand-500 animate-bounce [animation-delay:0.4s]" />
                    <span className="text-xs text-stone-400 font-medium ml-1">NutriSynth AI thinking...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Suggestion Pills above input */}
            <div className="px-3 py-1.5 bg-white dark:bg-[#121824] border-t border-stone-100 dark:border-stone-800 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
              <button
                onClick={() => handleSendMessage('How does NutriSynth calculate BMR and macros?')}
                className="text-[11px] whitespace-nowrap px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-brand-50 dark:hover:bg-brand-950/60 hover:text-brand-700 dark:hover:text-brand-300 transition-colors shrink-0"
              >
                🔬 Macro Formula
              </button>
              <button
                onClick={() => handleSendMessage('How do I scan or log food?')}
                className="text-[11px] whitespace-nowrap px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-brand-50 dark:hover:bg-brand-950/60 hover:text-brand-700 dark:hover:text-brand-300 transition-colors shrink-0"
              >
                📷 Food Scanner
              </button>
              <button
                onClick={() => handleSendMessage('How do I check vitamin deficiencies?')}
                className="text-[11px] whitespace-nowrap px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-brand-50 dark:hover:bg-brand-950/60 hover:text-brand-700 dark:hover:text-brand-300 transition-colors shrink-0"
              >
                🧬 Deficiency Test
              </button>
              <button
                onClick={() => handleSendMessage('How do I export my meal plan as PDF?')}
                className="text-[11px] whitespace-nowrap px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-brand-50 dark:hover:bg-brand-950/60 hover:text-brand-700 dark:hover:text-brand-300 transition-colors shrink-0"
              >
                📄 Export PDF/PPT
              </button>
            </div>

            {/* Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="p-3 bg-white dark:bg-[#121824] border-t border-stone-200/80 dark:border-stone-800 flex items-center gap-2 shrink-0"
            >
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask any question about our website..."
                className="flex-1 bg-stone-100 dark:bg-[#0c1017] text-stone-900 dark:text-stone-100 text-sm px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 focus:outline-none focus:border-brand-500 focus:bg-white dark:focus:bg-[#0c1017] transition-all placeholder:text-stone-400 dark:placeholder:text-stone-500"
                disabled={isTyping}
              />
              <button
                type="submit"
                disabled={!input.trim() || isTyping}
                className="w-10 h-10 rounded-xl bg-brand-600 text-white flex items-center justify-center hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95 shadow-sm shrink-0"
                aria-label="Send question"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}
      </aside>
    </>
  );
}
