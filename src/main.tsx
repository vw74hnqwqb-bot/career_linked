import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  GraduationCap, 
  Key, 
  ArrowRight, 
  RefreshCcw, 
  Sparkles,
  Info,
  BookOpen,
  LayoutGrid
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import './index.css';

// --- API Key Management (Protection) ---
const getActiveApiKey = () => {
  try {
    // 1. Try environment variable (provided by AI Studio or baked into Vite build)
    const envKey = process.env.GEMINI_API_KEY;
    if (envKey && envKey !== "MY_GEMINI_API_KEY" && envKey !== "") return envKey;
  } catch (e) {
    console.warn("Environment variable access failed", e);
  }
  
  // 2. Try localStorage (for standalone/manual use)
  const localKey = localStorage.getItem('GS_KEY');
  if (localKey && localKey.trim() !== "") return localKey;

  // 3. Built-in new API key provided by the user
  return "";
};

// --- AI Logic ---
const SYSTEM_PROMPT = `
# 역할 (Role)
고등학생 진로 연계 수행평가 컨설턴트입니다. 
융합 공식: [교과 개념] x [진로 도구] = [실천적 산출물]

# 🚫 절대 제약 조건
1. 1차원적 비유 금지. 실무/학술적 쓰임에 집중. 
2. 진로 계열에 따라 결과물의 '형태'가 완벽히 달라야 합니다.

# 출력 구조
[🎯 맞춤형 탐구 전략]
(탐구 주제, 핵심 도구, 예상 산출물 형태를 상세히 제안하세요.)

[💡 멘토의 실전 팁]
(심화 탐구 방향과 생기부 기록 포인트를 제언하세요.)
`;

async function fetchConsulting(subject: string, career: string, customKey?: string) {
  const apiKey = customKey || getActiveApiKey();
  if (!apiKey) throw new Error("API 키가 설정되지 않았습니다.");

  const ai = new GoogleGenAI({ apiKey });
  
  // Dynamic Model Cascade to avoid 403 permissions/denied access on preview models
  const models = ["gemini-3-flash-preview", "gemini-2.5-flash", "gemini-2.0-flash"];
  let lastError = null;

  for (const model of models) {
    try {
      const response = await ai.models.generateContent({
        model: model, 
        contents: `시스템 지침: ${SYSTEM_PROMPT}\n입력주제: ${subject}\n진로: ${career}`,
      });
      
      let displayName = "Gemini 3 Flash";
      if (model === "gemini-2.5-flash") displayName = "Gemini 2.5 Flash";
      if (model === "gemini-2.0-flash") displayName = "Gemini 2.0 Flash";

      return {
        text: response.text || "",
        modelUsed: displayName
      };
    } catch (err: any) {
      console.warn(`Model ${model} failed, trying next fallback...`, err);
      lastError = err;
    }
  }

  throw lastError || new Error("모든 제미나이 모델 호출에 실패했습니다.");
}

// --- Custom Markdown & Math Formatter ---
const renderMathText = (math: string): React.ReactNode => {
  let text = math;
  const replacements: {[key: string]: string} = {
    '\\theta': 'θ',
    '\\alpha': 'α',
    '\\beta': 'β',
    '\\gamma': 'γ',
    '\\delta': 'δ',
    '\\pi': 'π',
    '\\sigma': 'σ',
    '\\omega': 'ω',
    '\\infty': '∞',
    '\\times': '×',
    '\\div': '÷',
    '\\pm': '±',
    '\\neq': '≠',
    '\\le': '≤',
    '\\ge': '≥',
    '\\approx': '≈',
    '\\rightarrow': '→',
    '\\lambda': 'λ',
    '\\mu': 'μ',
    '\\phi': 'φ',
    '\\rho': 'ρ',
    '\\tau': 'τ',
    '\\partial': '∂',
    '\\nabla': '∇',
    '\\int': '∫',
    '\\sum': '∑',
    '\\sqrt': '√',
    '\\cdot': '·',
    '\\arctan': 'arctan',
    '\\sin': 'sin',
    '\\cos': 'cos',
    '\\tan': 'tan',
    '\\log': 'log',
    '\\ln': 'ln',
    '\\deg': '°',
  };

  for (const [key, val] of Object.entries(replacements)) {
    text = text.replaceAll(key, val);
  }

  const parts: React.ReactNode[] = [];
  let currentWord = '';
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '^') {
      if (currentWord) {
        parts.push(currentWord);
        currentWord = '';
      }
      let content = '';
      if (text[i + 1] === '{') {
        let j = i + 2;
        let braceCount = 1;
        while (j < text.length && braceCount > 0) {
          if (text[j] === '{') braceCount++;
          else if (text[j] === '}') braceCount--;
          if (braceCount > 0) content += text[j];
          j++;
        }
        i = j - 1;
      } else {
        content = text[i + 1] || '';
        i++;
      }
      parts.push(<sup key={`sup-${i}`} className="text-[10px] leading-none select-none">{content}</sup>);
    } else if (char === '_') {
      if (currentWord) {
        parts.push(currentWord);
        currentWord = '';
      }
      let content = '';
      if (text[i + 1] === '{') {
        let j = i + 2;
        let braceCount = 1;
        while (j < text.length && braceCount > 0) {
          if (text[j] === '{') braceCount++;
          else if (text[j] === '}') braceCount--;
          if (braceCount > 0) content += text[j];
          j++;
        }
        i = j - 1;
      } else {
        content = text[i + 1] || '';
        i++;
      }
      parts.push(<sub key={`sub-${i}`} className="text-[10px] leading-none select-none">{content}</sub>);
    } else {
      currentWord += char;
    }
  }
  
  if (currentWord) {
    parts.push(currentWord);
  }

  return <>{parts}</>;
};

const parseInlineText = (text: string, isDark?: boolean): React.ReactNode[] => {
  if (!text) return [];
  
  const nodes: React.ReactNode[] = [];
  let currentIndex = 0;

  while (currentIndex < text.length) {
    const remaining = text.substring(currentIndex);
    
    const codeMatch = remaining.match(/`([^`]+)`/);
    const boldMatch = remaining.match(/\*\*([^*]+)\*\*/);
    const mathMatch = remaining.match(/\$([^$]+)\$/);

    let firstMatchIndex = Infinity;
    let matchType: 'code' | 'bold' | 'math' | null = null;
    let matchedString = '';
    let innerContent = '';

    if (codeMatch && codeMatch.index !== undefined && codeMatch.index < firstMatchIndex) {
      firstMatchIndex = codeMatch.index;
      matchType = 'code';
      matchedString = codeMatch[0];
      innerContent = codeMatch[1];
    }
    if (boldMatch && boldMatch.index !== undefined && boldMatch.index < firstMatchIndex) {
      firstMatchIndex = boldMatch.index;
      matchType = 'bold';
      matchedString = boldMatch[0];
      innerContent = boldMatch[1];
    }
    if (mathMatch && mathMatch.index !== undefined && mathMatch.index < firstMatchIndex) {
      firstMatchIndex = mathMatch.index;
      matchType = 'math';
      matchedString = mathMatch[0];
      innerContent = mathMatch[1];
    }

    if (matchType === null) {
      nodes.push(remaining);
      break;
    }

    if (firstMatchIndex > 0) {
      nodes.push(remaining.substring(0, firstMatchIndex));
    }

    const key = `${currentIndex}-${firstMatchIndex}`;
    if (matchType === 'code') {
      nodes.push(
        <code key={key} className={isDark ? "font-mono text-[14px] bg-slate-800 text-pink-300 px-1.5 py-0.5 rounded border border-slate-700" : "font-mono text-[14px] bg-slate-100 text-pink-600 px-1.5 py-0.5 rounded border border-slate-200"}>
          {innerContent}
        </code>
      );
    } else if (matchType === 'bold') {
      nodes.push(
        <strong key={key} className={isDark ? "font-black text-white bg-white/20 px-1.5 py-0.5 rounded border-b-2 border-indigo-400/50" : "font-extrabold text-slate-900 bg-indigo-50/70 px-1 py-0.5 rounded border-b-2 border-indigo-200/50"}>
          {innerContent}
        </strong>
      );
    } else if (matchType === 'math') {
      const cleanMath = renderMathText(innerContent);
      nodes.push(
        <span key={key} className={isDark ? "font-serif italic text-indigo-200 font-semibold bg-indigo-950/70 px-1.5 py-0.5 rounded tracking-wide inline-flex items-center gap-0.5 mx-0.5 shadow-sm border border-indigo-800/60" : "font-serif italic text-indigo-700 font-semibold bg-indigo-50/50 px-1.5 py-0.5 rounded tracking-wide inline-flex items-center gap-0.5 mx-0.5 shadow-sm border border-indigo-100/40"}>
          {cleanMath}
        </span>
      );
    }

    currentIndex += firstMatchIndex + matchedString.length;
  }

  return nodes;
};

interface MarkdownRendererProps {
  text: string;
  isDark?: boolean;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ text, isDark }) => {
  if (!text) return null;

  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  
  let currentListItems: React.ReactNode[] = [];
  let currentListType: 'bullet' | 'ordered' | null = null;

  const flushList = (key: string) => {
    if (currentListItems.length > 0) {
      if (currentListType === 'bullet') {
        elements.push(
          <ul key={`list-bullet-${key}`} className={`list-disc pl-6 my-4 space-y-2.5 ${isDark ? "text-slate-100" : "text-slate-700"}`}>
            {currentListItems}
          </ul>
        );
      } else if (currentListType === 'ordered') {
        elements.push(
          <ol key={`list-ordered-${key}`} className={`list-decimal pl-6 my-4 space-y-2.5 ${isDark ? "text-slate-100" : "text-slate-700"}`}>
            {currentListItems}
          </ol>
        );
      }
      currentListItems = [];
      currentListType = null;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    if (trimmed.startsWith('### ')) {
      flushList(`h3-${i}`);
      elements.push(
        <h3 key={`h3-${i}`} className={`text-lg font-bold mt-6 mb-3 flex items-center gap-2 border-l-4 pl-3 ${isDark ? "text-white border-indigo-400" : "text-slate-900 border-indigo-500"}`}>
          {parseInlineText(trimmed.substring(4), isDark)}
        </h3>
      );
    } else if (trimmed.startsWith('## ')) {
      flushList(`h2-${i}`);
      elements.push(
        <h2 key={`h2-${i}`} className={`text-xl font-bold mt-8 mb-4 border-b pb-2 ${isDark ? "text-indigo-200 border-indigo-800/40" : "text-indigo-950 border-indigo-100/50"}`}>
          {parseInlineText(trimmed.substring(3), isDark)}
        </h2>
      );
    } else if (trimmed.startsWith('# ')) {
      flushList(`h1-${i}`);
      elements.push(
        <h1 key={`h1-${i}`} className={`text-2xl font-black mt-10 mb-5 border-b-2 pb-2 ${isDark ? "text-indigo-100 border-indigo-700/50" : "text-indigo-950 border-indigo-100"}`}>
          {parseInlineText(trimmed.substring(2), isDark)}
        </h1>
      );
    } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      if (currentListType !== 'bullet') {
        flushList(`switch-bullet-${i}`);
        currentListType = 'bullet';
      }
      currentListItems.push(
        <li key={`li-b-${i}`} className="leading-relaxed pl-1 text-[15px]">
          {parseInlineText(trimmed.substring(2), isDark)}
        </li>
      );
    } else if (/^\d+\.\s/.test(trimmed)) {
      if (currentListType !== 'ordered') {
        flushList(`switch-ordered-${i}`);
        currentListType = 'ordered';
      }
      const match = trimmed.match(/^(\d+)\.\s(.*)/);
      const content = match ? match[2] : trimmed;
      currentListItems.push(
        <li key={`li-o-${i}`} className="leading-relaxed pl-1 text-[15px]">
          {parseInlineText(content, isDark)}
        </li>
      );
    } else if (trimmed.startsWith('> ')) {
      flushList(`bq-${i}`);
      elements.push(
        <blockquote key={`bq-${i}`} className={`border-l-4 pl-4 py-2.5 my-4 rounded-r-2xl italic text-[15px] ${isDark ? "border-indigo-400 bg-slate-800/60 text-slate-200" : "border-indigo-500 bg-indigo-50/40 text-slate-600"}`}>
          {parseInlineText(trimmed.substring(2), isDark)}
        </blockquote>
      );
    } else if (trimmed === '---' || trimmed === '***') {
      flushList(`div-${i}`);
      elements.push(<hr key={`hr-${i}`} className={isDark ? "my-6 border-slate-800" : "my-6 border-slate-200"} />);
    } else if (trimmed === '') {
      flushList(`empty-${i}`);
    } else {
      flushList(`para-${i}`);
      elements.push(
        <p key={`p-${i}`} className={`leading-relaxed text-[15px] mb-4 ${isDark ? "text-white font-medium" : "text-slate-700"}`}>
          {parseInlineText(line, isDark)}
        </p>
      );
    }
  }

  flushList('final');

  return <div className="space-y-1">{elements}</div>;
};

function App() {
  const [subject, setSubject] = useState('');
  const [career, setCareer] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [modelUsed, setModelUsed] = useState<string>("Gemini 3 Flash");
  
  // API Key Management
  const [apiKey, setApiKey] = useState(getActiveApiKey());
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [tempKey, setTempKey] = useState('');

  // Auto-show modal if no key is found at start (and not inside AI Studio dev environment if possible)
  useEffect(() => {
    if (!apiKey) {
      setShowKeyModal(true);
    }
  }, []);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Refresh key state in case it changed in localStorage or env
    const currentKey = apiKey || getActiveApiKey();
    if (!currentKey) {
      setShowKeyModal(true);
      return; 
    }
    
    setLoading(true);
    setResult(null);
    try {
      const res = await fetchConsulting(subject, career, currentKey);
      setResult(res.text);
      setModelUsed(res.modelUsed);
    } catch (err: any) {
      console.error("Gemini Error:", err);
      const msg = err.message || '';
      const fullError = typeof err === 'object' ? JSON.stringify(err) : String(err);
      
      if (msg.toLowerCase().includes('api key') || msg.includes('403') || msg.includes('not authorized')) {
        alert('API 키 권한 오류 (403): 프로젝트에 API가 활성화되어 있지 않거나 키가 올바르지 않습니다.');
        setShowKeyModal(true);
      } else if (msg.includes('429') || msg.toLowerCase().includes('quota')) {
        alert('할당량 초과 (429): 현재 모델의 무료 사용량을 모두 소진했습니다. 잠시 후 다시 시도하거나 다른 API 키를 사용해주세요.');
      } else {
        alert(`오류가 발생했습니다:\n${msg}\n\n상세 정보: ${fullError.substring(0, 100)}...`);
      }
    } finally { setLoading(false); }
  };

  const saveKey = (key: string) => {
    const trimmed = key.trim();
    if (trimmed.length < 15) {
      alert('올바른 API 키 형식이 아닙니다. 입력값을 확인해주세요.');
      return;
    }
    localStorage.setItem('GS_KEY', trimmed);
    setApiKey(trimmed);
    setShowKeyModal(false);
    alert('API 키가 안전하게 저장되었습니다.');
  };

  const resetApiKey = () => {
    if (confirm('저장된 API 키를 초기화하시겠습니까?')) {
      localStorage.removeItem('GS_KEY');
      setApiKey(process.env.GEMINI_API_KEY || "");
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <header className="flex justify-between items-center bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
              <GraduationCap size={28} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">CareerPath Pro</h1>
              <p className="text-[10px] text-indigo-600 font-bold uppercase tracking-widest">AI Academic Assistant</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setShowKeyModal(true)} 
              className="p-3 hover:bg-slate-100 rounded-2xl transition-colors flex items-center gap-2"
              title="API 키 설정"
            >
              <Key size={18} className={apiKey ? "text-indigo-600" : "text-slate-400"} />
              <span className="text-xs font-bold text-slate-500 hidden md:inline">API KEY</span>
            </button>
          </div>
        </header>

        {/* Modal */}
        <AnimatePresence>
          {showKeyModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }} 
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white p-8 rounded-3xl shadow-2xl max-w-md w-full border border-white/20"
              >
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-xl font-bold mb-1">🔑 API 키 설정</h3>
                    <p className="text-slate-500 text-sm">보안을 위해 키는 브라우저에만 저장됩니다.</p>
                  </div>
                  <button onClick={() => setShowKeyModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
                </div>

                <div className="space-y-4">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 italic text-[11px] text-slate-500 leading-relaxed">
                    구글 AI 스튜디오에서 발급받은 'AIza...'로 시작하는 키를 입력하세요.
                  </div>
                  
                  <div className="relative">
                    <input 
                      type="password" 
                      placeholder="API 키를 입력하세요" 
                      value={tempKey}
                      onChange={(e) => setTempKey(e.target.value)}
                      className="w-full h-12 px-5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-medium" 
                    />
                  </div>

                  <div className="flex gap-2">
                    <button 
                      onClick={() => saveKey(tempKey)}
                      className="flex-1 h-12 bg-indigo-600 text-white font-bold rounded-xl hover:bg-slate-900 transition-all shadow-lg shadow-indigo-100"
                    >
                      저장하기
                    </button>
                    {localStorage.getItem('GS_KEY') && (
                      <button 
                        onClick={resetApiKey}
                        className="px-4 h-12 bg-red-50 text-red-600 rounded-xl font-bold hover:bg-red-600 hover:text-white transition-all"
                      >
                        삭제
                      </button>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 text-center">AI Studio 환경에서는 자동으로 키가 연동되나,<br/>외부 환경이나 오류 시 직접 입력이 필요할 수 있습니다.</p>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {!result ? (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="md:col-span-8">
              <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm h-full flex flex-col">
                <div className="mb-8">
                  <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3 leading-tight">
                    수행평가에 <span className="text-indigo-600 underline underline-offset-8 decoration-indigo-100">진로</span>를 더하다.
                  </h2>
                  <p className="text-slate-500 leading-relaxed text-sm">평범한 숙제를 나만의 특별한 전공 탐구 스토리로 바꾸는 학술적 설계를 시작하세요.</p>
                </div>
                
                <form onSubmit={handleAnalyze} className="space-y-6">
                  <div className="space-y-1">
                    <div className="flex justify-between items-end mb-1">
                      <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Subject & Topic</label>
                      <span className="text-[10px] text-indigo-500 font-bold bg-indigo-50 px-2.5 py-1 rounded-full flex items-center gap-1.5 animate-pulse">
                        <Info size={12} /> 교과서 개념을 구체적으로 적어주세요
                      </span>
                    </div>
                    <div className="relative">
                      <BookOpen size={18} className="absolute left-4 top-4 text-slate-400" />
                      <textarea 
                        value={subject} 
                        onChange={e => setSubject(e.target.value)} 
                        placeholder="예: 생명과학2 - 효소의 활성과 온도 실험을 통해 인체 내부 피드백 기전 탐구" 
                        className="w-full h-40 px-5 pl-12 pt-4 bg-slate-50 border border-slate-200 rounded-3xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-medium resize-none shadow-inner" 
                        required 
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1 block">Target Career</label>
                    <div className="relative">
                      <LayoutGrid size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input 
                        type="text" 
                        value={career} 
                        onChange={e => setCareer(e.target.value)} 
                        placeholder="희망 진로 (예: 종양내과 전문의, 컴공 보안 전문가)" 
                        className="w-full h-14 px-5 pl-12 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-medium shadow-inner" 
                        required 
                      />
                    </div>
                  </div>

                  <button 
                    disabled={loading || !subject || !career} 
                    className="w-full h-16 bg-indigo-600 hover:bg-slate-900 disabled:bg-slate-200 text-white font-bold rounded-2xl shadow-xl shadow-indigo-100 flex items-center justify-center gap-3 transition-all group scale-100 active:scale-95"
                  >
                    {loading ? (
                      <div className="animate-spin h-6 w-6 border-3 border-white border-t-transparent rounded-full" />
                    ) : (
                      <>탐구 모델 설계 시작하기 <ArrowRight size={22} className="group-hover:translate-x-1.5 transition-transform" /></>
                    )}
                  </button>
                </form>
              </div>
            </motion.div>
            
            <div className="md:col-span-4 space-y-6">
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="bg-slate-900 rounded-3xl p-8 text-white shadow-lg overflow-hidden relative group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                  <Sparkles size={100} />
                </div>
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 mb-3">Core Philosophy</h3>
                <p className="text-xl font-bold leading-tight relative z-10">교과 속 핵심 개념을<br/>전공자의 시각으로<br/>재해석합니다.</p>
              </motion.div>

              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>
                  How To Use
                </h3>
                <ul className="text-[12px] space-y-4 text-slate-600 font-medium">
                  {[
                    "제안된 탐구 키워드로 논문을 검색하세요.",
                    "산출물 형태를 실제 수행 결과로 만듭니다.",
                    "탐구 동기와 변화를 세특에 기록해 보세요."
                  ].map((step, i) => (
                    <li key={i} className="flex gap-4 items-start">
                      <span className="shrink-0 w-6 h-6 rounded-lg bg-slate-50 flex items-center justify-center font-bold text-indigo-500 text-[10px] border border-slate-100">{i+1}</span>
                      <span className="leading-snug">{step}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>

              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="bg-indigo-50 rounded-3xl p-6 border border-indigo-100">
                <p className="text-[11px] text-indigo-900 leading-relaxed italic">
                  "단순한 지식 나열보다, <strong>'나의 관심사가 어떻게 확장되었는지'</strong>를 보여주는 것이 입시의 핵심입니다."
                </p>
              </motion.div>
            </div>
          </div>
        ) : (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="grid grid-cols-1 md:grid-cols-12 gap-6 pb-20">
            <div className="md:col-span-4 space-y-6">
              <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm flex flex-col items-center text-center gap-6">
                <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center text-4xl border border-indigo-100 shadow-inner">🎓</div>
                <div>
                  <h3 className="text-2xl font-bold text-slate-900">{career}</h3>
                  <p className="text-xs text-indigo-600 font-bold uppercase tracking-widest mt-1">Consulting Target</p>
                </div>
                <div className="w-full bg-slate-50 p-5 rounded-2xl text-left border border-slate-100 shadow-inner">
                  <p className="text-[9px] text-slate-400 font-bold uppercase mb-2">Selected Topic</p>
                  <p className="text-sm font-semibold text-slate-700 leading-relaxed line-clamp-3">{subject}</p>
                </div>
                <button 
                  onClick={() => setResult(null)} 
                  className="w-full h-14 bg-slate-100 hover:bg-slate-900 hover:text-white text-slate-600 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all"
                >
                  <RefreshCcw size={18} /> 다른 주제 설계하기
                </button>
              </div>
            </div>

            <div className="md:col-span-8 space-y-6">
              <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 flex flex-col overflow-hidden">
                <div className="bg-indigo-600 px-8 py-7 text-white flex justify-between items-center relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-20 rotate-12"><Sparkles size={120} /></div>
                  <h3 className="text-xl font-bold flex items-center gap-3 relative z-10">
                    <Sparkles size={24} /> 🎯 나만의 탐구 전략
                  </h3>
                  <span className="text-[10px] bg-white/20 backdrop-blur px-3 py-1.5 rounded-full font-bold uppercase tracking-widest relative z-10">{modelUsed}</span>
                </div>
                <div className="p-8 text-slate-700 leading-relaxed font-medium text-[16px]">
                  <MarkdownRenderer text={result.split('[💡 멘토의 실전 팁]')[0].replace('[🎯 맞춤형 탐구 전략]', '').trim()} />
                </div>
              </div>

              <div className="bg-slate-900 rounded-3xl p-8 text-white shadow-2xl flex flex-col md:flex-row gap-8 items-center border border-slate-800">
                <div className="w-20 h-20 shrink-0 bg-indigo-500 rounded-3xl flex items-center justify-center text-4xl shadow-lg rotate-3">💡</div>
                <div className="flex-1 text-center md:text-left">
                  <h4 className="text-xl font-bold mb-2 text-indigo-400 flex items-center gap-2 justify-center md:justify-start">
                    멘토의 실전 팁
                  </h4>
                  <div className="text-slate-300 text-[15px] leading-relaxed">
                    <MarkdownRenderer text={result.split('[💡 멘토의 실전 팁]')[1]?.trim() || "더 깊이 있는 탐구를 위해 학술 자료 검색(RISS, DBpia)을 통한 심화 문헌 조사를 추천합니다."} isDark={true} />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        <footer className="pt-20 pb-12 flex flex-col sm:flex-row justify-between items-center gap-6 text-[10px] text-slate-400 font-bold uppercase tracking-widest border-t border-slate-200/50">
          <p>© 2026 Academic Career Consulting Lab.</p>
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div> System Online</span>
            <div className="w-1 h-1 bg-slate-300 rounded-full"></div>
            <span>V3.0 Extended Engine</span>
          </div>
        </footer>
      </div>
    </div>
  );
}

const rootElement = document.getElementById('root');
if (rootElement) {
  // Use a global to hold the root to avoid double-initialization in some environments
  // @ts-ignore
  if (!window.__reactRoot) {
    // @ts-ignore
    window.__reactRoot = ReactDOM.createRoot(rootElement);
  }
  // @ts-ignore
  window.__reactRoot.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

