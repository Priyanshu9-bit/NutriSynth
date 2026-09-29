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
  Copy,
  Check,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  ThumbsUp,
  ThumbsDown,
  Clock,
  Flame,
  ChefHat,
  Apple,
  HelpCircle,
  Plus
} from 'lucide-react';
import {
  generateChatResponse,
  type ChatMessage,
  type ChatAction,
  type ChatFoodCard
} from '@/lib/aiChatbot';
import type { UserProfile, NutritionResult, MealItem } from '@/lib/calculations';
import type { RecipeItem } from '@/data/personalizedRecipes';
import type { View } from '@/components/Layout';
import { playChecklistSound, playAddProgressSound, playWaterDropSound } from '@/lib/soundEffects';

interface ChatbotProps {
  currentPhase: string;
  profile: UserProfile | null;
  result: NutritionResult | null;
  onNavigate: (view: View) => void;
  onStartPlan: () => void;
  onEditProfile: () => void;
  onRegenerate: () => void;
  onAddMeal?: (meal: MealItem) => void;
}

const TOPIC_PRESETS = [
  { id: 'all', label: '✨ All Topics', prompt: '' },
  { id: 'recipes', label: '🍲 Recipe Finder', prompt: 'Suggest a high-protein dinner recipe' },
  { id: 'calories', label: '🍎 Calorie Lookup', prompt: 'How many calories in an apple?' },
  { id: 'water', label: '💧 Water Target', prompt: 'How much water should I drink for my weight?' },
  { id: 'vitamins', label: '🧬 Vitamin Check', prompt: 'I feel tired, what vitamins could I be missing?' },
  { id: 'portions', label: '✋ Hand Portions', prompt: 'How do I measure food without a scale?' }
];

export function Chatbot({
  currentPhase,
  profile,
  result,
  onNavigate,
  onStartPlan,
  onEditProfile,
  onRegenerate,
  onAddMeal,
}: ChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showTooltip, setShowTooltip] = useState(true);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [feedbackGiven, setFeedbackGiven] = useState<Record<string, 'up' | 'down'>>({});
  const [selectedTopic, setSelectedTopic] = useState('all');

  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'welcome-msg',
      sender: 'assistant',
      text: `👋 **Hi there! I'm your NutriSynth AI Nutritionist.**\n\nI can look up calories, suggest tailored recipes, explain formulas in plain English, and help you build lifelong healthy habits.\n\n*What would you like to know or log today?*`,
      timestamp: new Date(),
      suggestedQuestions: [
        'What should I eat for dinner?',
        'How many calories in 2 boiled eggs?',
        'How much water should I drink daily?',
        'How do I measure food without a scale?'
      ],
      actions: result
        ? [
            { label: '📊 Today\'s Food', type: 'navigate', target: 'dashboard' },
            { label: '🍲 Meal Ideas', type: 'navigate', target: 'planner' },
            { label: '🧬 Vitamin Check', type: 'navigate', target: 'deficiency' }
          ]
        : [
            { label: '🚀 Build My Plan (60s)', type: 'startOnboarding' },
            { label: '📖 Learn How It Works', type: 'navigate', target: 'how-it-works' }
          ]
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  // Auto-scroll to bottom of conversation
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping, isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setShowTooltip(false);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
    } else {
      // Stop speech if closed
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        setSpeakingMsgId(null);
      }
    }
  }, [isOpen]);

  // Dismiss tooltip after 14 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowTooltip(false);
    }, 14000);
    return () => clearTimeout(timer);
  }, []);

  // Web Speech API: Voice Recognition Setup
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        setIsListening(false);
        handleSendMessage(transcript);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) {
      alert('Voice dictation is not supported by your current browser.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
        playWaterDropSound();
      } catch (err) {
        console.warn('Speech recognition error:', err);
      }
    }
  };

  // Text to Speech
  const toggleSpeech = (text: string, msgId: string) => {
    if (!('speechSynthesis' in window)) return;

    if (speakingMsgId === msgId) {
      window.speechSynthesis.cancel();
      setSpeakingMsgId(null);
    } else {
      window.speechSynthesis.cancel();
      // Clean markdown tags for natural speech
      const cleanText = text.replace(/[*#`_•]/g, ' ').replace(/\n+/g, '. ');
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.onend = () => setSpeakingMsgId(null);
      utterance.onerror = () => setSpeakingMsgId(null);

      setSpeakingMsgId(msgId);
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleSendMessage = (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text) return;

    playChecklistSound(true);

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Realistic smart response delay (350 - 550ms)
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
        recipeCard: response.recipeCard,
        foodCard: response.foodCard,
      };

      setIsTyping(false);
      setMessages((prev) => [...prev, assistantMessage]);
      playWaterDropSound();
    }, 450);
  };

  const handleActionClick = (action: ChatAction) => {
    playAddProgressSound();

    if (action.type === 'navigate' && action.target) {
      onNavigate(action.target as View);
    } else if (action.type === 'startOnboarding') {
      onStartPlan();
    } else if (action.type === 'editProfile') {
      onEditProfile();
    } else if (action.type === 'logMeal' && action.meal) {
      if (onAddMeal) {
        onAddMeal(action.meal);
      }
      const confirmMsg: ChatMessage = {
        id: `assistant-confirm-${Date.now()}`,
        sender: 'assistant',
        text: `✅ **Logged to Today!**\n\n**${action.meal.name}** (+${action.meal.details.calories} kcal, ${action.meal.details.protein}g protein) has been added to your daily food intake. Your dashboard totals and progress dials have been updated!`,
        timestamp: new Date(),
        actions: [{ label: '📊 View Dashboard', type: 'navigate', target: 'dashboard' }],
      };
      setMessages((prev) => [...prev, confirmMsg]);
    } else if (action.type === 'regenerate') {
      onRegenerate();
      const confirmMsg: ChatMessage = {
        id: `assistant-confirm-${Date.now()}`,
        sender: 'assistant',
        text: `✨ **Daily Meal Schedule Reshuffled!**\n\nI have recalculated your meal recommendations with fresh choices matching your exact daily calorie and protein budget.`,
        timestamp: new Date(),
        actions: [{ label: '📊 View Dashboard', type: 'navigate', target: 'dashboard' }],
      };
      setMessages((prev) => [...prev, confirmMsg]);
    }
  };

  const handleClearChat = () => {
    playWaterDropSound();
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    setSpeakingMsgId(null);

    setMessages([
      {
        id: `welcome-${Date.now()}`,
        sender: 'assistant',
        text: `✨ **Chat history refreshed!** How can I help your nutrition journey today?`,
        timestamp: new Date(),
        suggestedQuestions: [
          'What should I eat for dinner?',
          'How many calories in an apple?',
          'How much water should I drink?',
        ],
      },
    ]);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleFeedback = (msgId: string, type: 'up' | 'down') => {
    playChecklistSound(true);
    setFeedbackGiven((prev) => ({ ...prev, [msgId]: type }));
  };

  // Helper to render markdown-like simple text formatting
  const renderFormattedText = (raw: string) => {
    const lines = raw.split('\n');
    return (
      <div className="space-y-1.5 text-xs sm:text-sm leading-relaxed">
        {lines.map((line, idx) => {
          if (!line.trim()) {
            return <div key={idx} className="h-1" />;
          }

          // Header 3
          if (line.startsWith('### ')) {
            return (
              <div key={idx} className="font-display font-bold text-stone-900 dark:text-white text-sm pt-1 flex items-center gap-1.5">
                {line.replace('### ', '')}
              </div>
            );
          }

          // Bullet points
          if (line.trim().startsWith('• ') || line.trim().startsWith('- ')) {
            const content = line.trim().substring(2);
            return (
              <div key={idx} className="flex items-start gap-1.5 pl-1 text-stone-700 dark:text-[#CBD5E1]">
                <span className="text-[#22C55E] font-bold leading-none mt-1.5">•</span>
                <span dangerouslySetInnerHTML={{ __html: formatInline(content) }} />
              </div>
            );
          }

          // Numbered list
          if (/^\d+\.\s/.test(line.trim())) {
            return (
              <div key={idx} className="pl-1 text-stone-700 dark:text-[#CBD5E1] font-medium">
                <span dangerouslySetInnerHTML={{ __html: formatInline(line) }} />
              </div>
            );
          }

          return (
            <p
              key={idx}
              className="text-stone-700 dark:text-[#CBD5E1]"
              dangerouslySetInnerHTML={{ __html: formatInline(line) }}
            />
          );
        })}
      </div>
    );
  };

  const formatInline = (str: string) => {
    return str
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-stone-900 dark:text-[#F8FAFC]">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="italic text-stone-600 dark:text-[#8492A6]">$1</em>')
      .replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-[#34D399] text-xs font-mono border border-emerald-500/20">$1</code>');
  };

  return (
    <>
      {/* FLOATING ACTION BUTTON CONTAINER */}
      <aside aria-label="NutriSynth AI Chatbot" className="fixed bottom-5 right-5 z-50 flex flex-col items-end pointer-events-auto">
        {/* Floating Greeting Bubble */}
        {!isOpen && showTooltip && (
          <div className="mb-3 max-w-xs bg-white dark:bg-[#0B0F0E] rounded-2xl p-3.5 shadow-2xl border border-stone-200/80 dark:border-[#1E293B] animate-fade-in flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#22C55E] to-[#2DD4BF] flex items-center justify-center text-[#07111F] shrink-0 shadow-sm font-bold">
              <Sparkles className="w-4 h-4 text-[#07111F]" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-stone-900 dark:text-[#F8FAFC]">Ask NutriSynth AI</p>
                <button
                  onClick={() => setShowTooltip(false)}
                  className="text-stone-400 hover:text-stone-600 dark:hover:text-[#F8FAFC] p-0.5"
                  aria-label="Dismiss message"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-[11px] text-stone-500 dark:text-[#8492A6] leading-snug mt-1">
                Ask about calories in any food, recipe ideas, water targets, or deficiency checks!
              </p>
              <button
                onClick={() => setIsOpen(true)}
                className="mt-2 text-xs font-bold text-emerald-600 dark:text-[#34D399] hover:text-emerald-700 dark:hover:text-[#2DD4BF] flex items-center gap-1 group"
              >
                <span>Chat with AI</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>
        )}

        {/* Floating Chat Launcher Button */}
        <button
          onClick={() => setIsOpen((prev) => !prev)}
          className={`group flex items-center gap-2.5 px-4 py-3 rounded-full shadow-xl transition-all duration-300 ${
            isOpen
              ? 'bg-stone-900 dark:bg-[#101D2D] text-white dark:text-[#F8FAFC] border border-stone-800 dark:border-[#1E293B] hover:bg-stone-800 dark:hover:bg-[#101D2D]/80'
              : 'bg-gradient-to-r from-[#22C55E] to-[#2DD4BF] text-[#07111F] font-bold shadow-lg shadow-emerald-500/20 hover:scale-105 active:scale-95'
          }`}
          aria-label={isOpen ? 'Close AI Chat' : 'Open AI Chat'}
        >
          {isOpen ? (
            <>
              <ChevronDown className="w-5 h-5 transition-transform group-hover:translate-y-0.5" />
              <span className="text-sm font-bold pr-1">Close Chat</span>
            </>
          ) : (
            <>
              <div className="relative">
                <Bot className="w-5 h-5 transition-transform group-hover:scale-110" />
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#07111F] rounded-full border-2 border-[#2DD4BF] animate-pulse" />
              </div>
              <span className="text-sm font-bold tracking-tight">Ask AI Nutritionist</span>
              <Sparkles className="w-4 h-4 text-[#07111F]" />
            </>
          )}
        </button>

        {/* CHAT WINDOW MODAL */}
        {isOpen && (
          <div
            className={`fixed bottom-20 right-4 sm:right-6 rounded-3xl bg-white dark:bg-[#07111F] shadow-2xl border border-stone-200/90 dark:border-[#1E293B] flex flex-col overflow-hidden z-50 animate-fade-in-scale transition-all duration-200 ${
              isExpanded
                ? 'w-[95vw] sm:w-[620px] h-[86vh] max-h-[850px]'
                : 'w-[360px] sm:w-[440px] max-w-[calc(100vw-2rem)] h-[600px] max-h-[calc(100vh-6.5rem)]'
            }`}
            role="dialog"
            aria-label="NutriSynth AI Chat Assistant"
          >
            {/* Header */}
            <div className="px-4 py-3 bg-[#07111F] text-white flex items-center justify-between border-b border-[#1E293B] shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-[#22C55E] to-[#2DD4BF] flex items-center justify-center text-[#07111F] shadow-sm font-bold">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h2 className="text-sm font-bold font-display text-[#F8FAFC] tracking-wide">NutriSynth AI</h2>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-emerald-500/15 text-[#34D399] border border-emerald-500/30">
                      Live Assistant
                    </span>
                  </div>
                  <p className="text-[11px] text-[#8492A6] leading-tight">Instant food lookup & tailored meal guidance</p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {/* Maximize / Minimize Window */}
                <button
                  onClick={() => setIsExpanded((prev) => !prev)}
                  title={isExpanded ? 'Restore window size' : 'Expand window'}
                  className="p-1.5 rounded-xl text-[#8492A6] hover:text-[#F8FAFC] hover:bg-[#101D2D] transition-colors"
                >
                  {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>

                {/* Clear Conversation */}
                <button
                  onClick={handleClearChat}
                  title="Clear conversation"
                  className="p-1.5 rounded-xl text-[#8492A6] hover:text-[#F8FAFC] hover:bg-[#101D2D] transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                {/* Close Button */}
                <button
                  onClick={() => setIsOpen(false)}
                  title="Close chat"
                  className="p-1.5 rounded-xl text-[#8492A6] hover:text-[#F8FAFC] hover:bg-[#101D2D] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Active Target Banner */}
            {result && profile && (
              <div className="px-3.5 py-2 bg-emerald-500/10 dark:bg-[#101D2D] border-b border-[#1E293B] flex items-center justify-between text-xs text-stone-800 dark:text-[#CBD5E1] shrink-0">
                <div className="flex items-center gap-2 truncate">
                  <span className="w-2 h-2 rounded-full bg-[#22C55E] shrink-0 animate-pulse" />
                  <span className="truncate font-medium">
                    Target: <strong className="text-[#F8FAFC]">{result.tdee} kcal</strong> ({profile.goal})
                  </span>
                </div>
                <span className="text-[11px] text-emerald-700 dark:text-[#34D399] font-mono font-bold shrink-0 ml-1">
                  P:{result.proteinG}g C:{result.carbG}g F:{result.fatG}g
                </span>
              </div>
            )}

            {/* Message History */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-stone-50/60 dark:bg-[#07111F]">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`flex items-start gap-2.5 max-w-[90%] sm:max-w-[85%] ${
                      msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
                    }`}
                  >
                    {/* Avatar */}
                    <div
                      className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5 shadow-xs ${
                        msg.sender === 'user'
                          ? 'bg-stone-800 dark:bg-[#101D2D] text-white dark:text-[#CBD5E1]'
                          : 'bg-gradient-to-br from-[#22C55E] to-[#2DD4BF] text-[#07111F] font-bold'
                      }`}
                    >
                      {msg.sender === 'user' ? (
                        <User className="w-4 h-4" />
                      ) : (
                        <Bot className="w-4 h-4" />
                      )}
                    </div>

                    {/* Bubble Content */}
                    <div
                      className={`p-3.5 rounded-2xl shadow-sm text-sm relative group ${
                        msg.sender === 'user'
                          ? 'bg-gradient-to-r from-[#22C55E] to-[#2DD4BF] text-[#07111F] font-medium rounded-tr-sm shadow-md'
                          : 'bg-white dark:bg-[#0B0F0E] border border-stone-200/90 dark:border-[#1E293B] text-stone-800 dark:text-[#CBD5E1] rounded-tl-sm'
                      }`}
                    >
                      {msg.sender === 'assistant' ? (
                        renderFormattedText(msg.text)
                      ) : (
                        <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                      )}

                      {/* Embedded Recipe Card */}
                      {msg.recipeCard && (
                        <div className="mt-3 p-3 rounded-xl bg-stone-50 dark:bg-[#101D2D] border border-stone-200 dark:border-[#1E293B] space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-xs text-stone-900 dark:text-[#F8FAFC] flex items-center gap-1.5">
                              <span>{msg.recipeCard.icon}</span>
                              <span>{msg.recipeCard.name}</span>
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-[#34D399] border border-emerald-500/30">
                              {msg.recipeCard.calories} kcal
                            </span>
                          </div>
                          <div className="grid grid-cols-4 gap-1 text-center text-[10px]">
                            <div className="p-1 rounded bg-white dark:bg-[#0B0F0E]">
                              <span className="text-stone-400 dark:text-[#8492A6] block">Prot</span>
                              <strong className="text-emerald-600 dark:text-[#34D399]">{msg.recipeCard.protein}g</strong>
                            </div>
                            <div className="p-1 rounded bg-white dark:bg-[#0B0F0E]">
                              <span className="text-stone-400 dark:text-[#8492A6] block">Carb</span>
                              <strong className="text-[#60A5FA]">{msg.recipeCard.carbs}g</strong>
                            </div>
                            <div className="p-1 rounded bg-white dark:bg-[#0B0F0E]">
                              <span className="text-stone-400 dark:text-[#8492A6] block">Fat</span>
                              <strong className="text-amber-500">{msg.recipeCard.fat}g</strong>
                            </div>
                            <div className="p-1 rounded bg-white dark:bg-[#0B0F0E]">
                              <span className="text-stone-400 dark:text-[#8492A6] block">Time</span>
                              <strong className="text-stone-700 dark:text-[#F8FAFC]">{msg.recipeCard.cookTimeMin}m</strong>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Embedded Food Card */}
                      {msg.foodCard && (
                        <div className="mt-3 p-3 rounded-xl bg-stone-50 dark:bg-[#101D2D] border border-stone-200 dark:border-[#1E293B] space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-stone-900 dark:text-[#F8FAFC] flex items-center gap-1.5">
                              <Apple className="w-3.5 h-3.5 text-[#22C55E]" />
                              <span>{msg.foodCard.name}</span>
                            </span>
                            <span className="text-xs font-black text-emerald-600 dark:text-[#34D399]">
                              {msg.foodCard.calories} kcal
                            </span>
                          </div>
                          <div className="grid grid-cols-4 gap-1 text-center text-[10px]">
                            <div className="p-1 rounded bg-white dark:bg-[#0B0F0E]">
                              <span className="text-stone-400 dark:text-[#8492A6] block">Protein</span>
                              <strong className="text-emerald-600 dark:text-[#34D399]">{msg.foodCard.protein}g</strong>
                            </div>
                            <div className="p-1 rounded bg-white dark:bg-[#0B0F0E]">
                              <span className="text-stone-400 dark:text-[#8492A6] block">Carbs</span>
                              <strong className="text-[#60A5FA]">{msg.foodCard.carbs}g</strong>
                            </div>
                            <div className="p-1 rounded bg-white dark:bg-[#0B0F0E]">
                              <span className="text-stone-400 dark:text-[#8492A6] block">Fats</span>
                              <strong className="text-amber-500">{msg.foodCard.fat}g</strong>
                            </div>
                            <div className="p-1 rounded bg-white dark:bg-[#0B0F0E]">
                              <span className="text-stone-400 dark:text-[#8492A6] block">Fiber</span>
                              <strong className="text-stone-700 dark:text-[#F8FAFC]">{msg.foodCard.fiber || 0}g</strong>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Assistant Message Actions Toolbar */}
                      {msg.sender === 'assistant' && (
                        <div className="mt-2.5 pt-2 border-t border-stone-100 dark:border-[#1E293B] flex items-center justify-between gap-2 flex-wrap">
                          {/* Left: Interactive Buttons */}
                          {msg.actions && msg.actions.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {msg.actions.map((act, actIdx) => (
                                <button
                                  key={actIdx}
                                  onClick={() => handleActionClick(act)}
                                  className="inline-flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-bold bg-emerald-500/15 text-emerald-700 dark:text-[#34D399] border border-emerald-500/30 hover:bg-emerald-500/25 transition-all active:scale-95 shadow-2xs"
                                >
                                  {act.type === 'logMeal' && <Plus className="w-3.5 h-3.5 text-[#22C55E]" />}
                                  <span>{act.label}</span>
                                  {act.type !== 'logMeal' && <ArrowRight className="w-3 h-3 text-[#22C55E]" />}
                                </button>
                              ))}
                            </div>
                          )}

                          {/* Right: Message Utility Tools (Listen, Copy, Feedback) */}
                          <div className="flex items-center gap-1 ml-auto text-stone-400 dark:text-[#8492A6]">
                            {/* Read Aloud Text-to-Speech */}
                            <button
                              onClick={() => toggleSpeech(msg.text, msg.id)}
                              className="p-1 rounded-lg hover:bg-stone-100 dark:hover:bg-[#101D2D] hover:text-emerald-600 dark:hover:text-[#34D399] transition-colors"
                              title={speakingMsgId === msg.id ? 'Stop reading' : 'Read answer aloud'}
                            >
                              {speakingMsgId === msg.id ? (
                                <VolumeX className="w-3.5 h-3.5 text-[#34D399] animate-pulse" />
                              ) : (
                                <Volume2 className="w-3.5 h-3.5" />
                              )}
                            </button>

                            {/* Copy Message */}
                            <button
                              onClick={() => copyToClipboard(msg.text, msg.id)}
                              className="p-1 rounded-lg hover:bg-stone-100 dark:hover:bg-[#101D2D] hover:text-emerald-600 dark:hover:text-[#34D399] transition-colors"
                              title="Copy answer"
                            >
                              {copiedId === msg.id ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-[#34D399]" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>

                            {/* Thumbs Up / Down */}
                            <button
                              onClick={() => handleFeedback(msg.id, 'up')}
                              className={`p-1 rounded-lg hover:bg-stone-100 dark:hover:bg-[#101D2D] transition-colors ${
                                feedbackGiven[msg.id] === 'up' ? 'text-[#34D399] font-bold' : ''
                              }`}
                              title="Helpful"
                            >
                              <ThumbsUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleFeedback(msg.id, 'down')}
                              className={`p-1 rounded-lg hover:bg-stone-100 dark:hover:bg-[#101D2D] transition-colors ${
                                feedbackGiven[msg.id] === 'down' ? 'text-rose-500 font-bold' : ''
                              }`}
                              title="Not helpful"
                            >
                              <ThumbsDown className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Suggested follow-up questions */}
                  {msg.suggestedQuestions && msg.suggestedQuestions.length > 0 && (
                    <div className="mt-2 pl-9 flex flex-wrap gap-1.5">
                      {msg.suggestedQuestions.map((q, qIdx) => (
                        <button
                          key={qIdx}
                          onClick={() => handleSendMessage(q)}
                          className="text-[11px] text-stone-600 dark:text-[#CBD5E1] bg-white dark:bg-[#0B0F0E] border border-stone-200 dark:border-[#1E293B] rounded-full px-3 py-1 hover:bg-emerald-500/10 hover:text-emerald-700 dark:hover:text-[#34D399] hover:border-emerald-500/30 transition-all text-left flex items-center gap-1 shadow-2xs active:scale-95"
                        >
                          <Lightbulb className="w-2.5 h-2.5 text-amber-500 shrink-0" />
                          <span>{q}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  <span className="text-[10px] text-stone-400 dark:text-[#8492A6] mt-1 px-1">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}

              {/* Typing indicator */}
              {isTyping && (
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-[#22C55E] to-[#2DD4BF] text-[#07111F] flex items-center justify-center shadow-sm font-bold">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="bg-white dark:bg-[#0B0F0E] border border-stone-200/80 dark:border-[#1E293B] rounded-2xl rounded-tl-sm px-4 py-2.5 shadow-sm flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-bounce" />
                    <span className="w-2 h-2 rounded-full bg-[#2DD4BF] animate-bounce [animation-delay:0.2s]" />
                    <span className="w-2 h-2 rounded-full bg-[#60A5FA] animate-bounce [animation-delay:0.4s]" />
                    <span className="text-xs text-stone-400 dark:text-[#8492A6] font-medium ml-1">Analyzing nutrition data...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Topic Filters Carousel */}
            <div className="px-3 py-2 bg-stone-100/90 dark:bg-[#0B0F0E] border-t border-stone-200/80 dark:border-[#1E293B] flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
              {TOPIC_PRESETS.map((topic) => (
                <button
                  key={topic.id}
                  onClick={() => {
                    playChecklistSound(true);
                    setSelectedTopic(topic.id);
                    if (topic.prompt) {
                      handleSendMessage(topic.prompt);
                    }
                  }}
                  className={`text-[11px] whitespace-nowrap px-2.5 py-1 rounded-xl font-bold transition-all shrink-0 ${
                    selectedTopic === topic.id
                      ? 'bg-gradient-to-r from-[#22C55E] to-[#2DD4BF] text-[#07111F] shadow-xs'
                      : 'bg-white dark:bg-[#101D2D] text-stone-600 dark:text-[#CBD5E1] border border-stone-200 dark:border-[#1E293B] hover:border-emerald-500/50'
                  }`}
                >
                  {topic.label}
                </button>
              ))}
            </div>

            {/* Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="p-3 bg-white dark:bg-[#0B0F0E] border-t border-stone-200/80 dark:border-[#1E293B] flex items-center gap-2 shrink-0"
            >
              {/* Voice Input Microphone Button */}
              <button
                type="button"
                onClick={toggleVoiceInput}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all shrink-0 ${
                  isListening
                    ? 'bg-rose-600 text-white animate-pulse shadow-md'
                    : 'bg-stone-100 dark:bg-[#101D2D] text-stone-500 dark:text-[#8492A6] hover:bg-stone-200 dark:hover:bg-[#101D2D]/80 border border-stone-200 dark:border-[#1E293B]'
                }`}
                title={isListening ? 'Listening... click to stop' : 'Click to speak your question'}
              >
                {isListening ? <Mic className="w-4 h-4 animate-spin" /> : <Mic className="w-4 h-4" />}
              </button>

              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={isListening ? 'Listening to you speak...' : 'Ask about calories, recipes, vitamins, water...'}
                className="flex-1 bg-stone-100 dark:bg-[#07111F] text-stone-900 dark:text-[#F8FAFC] text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-stone-200 dark:border-[#1E293B] focus:outline-none focus:border-[#2DD4BF] transition-all placeholder:text-stone-400 dark:placeholder:text-[#8492A6]"
                disabled={isTyping}
              />

              <button
                type="submit"
                disabled={!input.trim() || isTyping}
                className="w-10 h-10 rounded-xl bg-gradient-to-r from-[#22C55E] to-[#2DD4BF] text-[#07111F] font-bold flex items-center justify-center hover:opacity-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95 shadow-sm shrink-0"
                aria-label="Send question"
              >
                <Send className="w-4 h-4 text-[#07111F]" />
              </button>
            </form>
          </div>
        )}
      </aside>
    </>
  );
}
