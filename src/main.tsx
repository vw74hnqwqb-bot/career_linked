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
import './index.css';

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

async function fetchConsulting(subject: string, career: string, apiKey: string) {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
  const payload = {
    contents: [{ parts: [{ text: `시스템 지침: ${SYSTEM_PROMPT}\n입력주제: ${subject}\n진로: ${career}` }] }]
  };
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await response.json();
  if (data.error) throw new Error(data.error.message);
  return data.candidates[0].content.parts[0].text;
}

// Removed duplicate or broken Icon helper, using lucide-react components directly.

function App() {
  const [subject, setSubject] = useState('');
  const [career, setCareer] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState(localStorage.getItem('GEMINI_KEY') || '');
  const [showKeyModal, setShowKeyModal] = useState(!apiKey);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey) { setShowKeyModal(true); return; }
    setLoading(true);
    try {
      const res = await fetchConsulting(subject, career, apiKey);
      setResult(res);
    } catch (err: any) {
      alert('오류: ' + err.message);
      if (err.message.includes('API_KEY')) setShowKeyModal(true);
    } finally { setLoading(false); }
  };

  const saveKey = (key: string) => {
    localStorage.setItem('GEMINI_KEY', key);
    setApiKey(key);
    setShowKeyModal(false);
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
              <p className="text-[10px] text-indigo-600 font-bold uppercase tracking-widest">AI Career Consulting System</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setShowKeyModal(true)} 
              className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
              title="API 키 설정"
            >
              <Key size={18} className="text-slate-400" />
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
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white p-8 rounded-3xl shadow-2xl max-w-md w-full"
              >
                <h3 className="text-xl font-bold mb-2">🔑 API Key Required</h3>
                <p className="text-slate-500 text-sm mb-6">Gemini API 키가 필요합니다. 구글 AI 스튜디오에서 발급받은 키를 입력해주세요.</p>
                <input 
                  type="password" 
                  id="key-input" 
                  placeholder="AIza..." 
                  className="w-full h-12 px-5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-medium mb-4" 
                />
                <div className="flex gap-2">
                  <button 
                    onClick={() => {
                        const input = document.getElementById('key-input') as HTMLInputElement;
                        saveKey(input.value);
                    }} 
                    className="flex-1 h-12 bg-indigo-600 text-white font-bold rounded-xl"
                  >
                    저장 및 시작
                  </button>
                  <button 
                    onClick={() => setShowKeyModal(false)} 
                    className="px-4 h-12 bg-slate-100 text-slate-500 rounded-xl font-bold"
                  >
                    닫기
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {!result ? (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="md:col-span-8 bento-card-wrapper">
              <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm h-full flex flex-col justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-slate-900 mb-2">
                    수행평가에 <span className="text-indigo-600 underline underline-offset-8 decoration-indigo-200">진로</span>를 더하다.
                  </h2>
                  <p className="text-slate-500 mb-8 leading-relaxed italic text-sm">정보를 구체적으로 적을수록 AI의 제안이 더 정교해집니다.</p>
                  
                  <form onSubmit={handleAnalyze} className="space-y-6">
                    <div className="space-y-1">
                      <div className="flex justify-between items-end">
                        <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1 block">Subject & Topic</label>
                        <span className="text-[10px] text-indigo-500 font-bold mb-1 bg-indigo-50 px-2.5 py-1 rounded-full flex items-center gap-1">
                          <Info size={11} /> 교과서 개념을 포함해 상세히 적어주세요
                        </span>
                      </div>
                      <div className="relative">
                        <BookOpen size={16} className="absolute left-4 top-4 text-slate-400" />
                        <textarea 
                          value={subject} 
                          onChange={e => setSubject(e.target.value)} 
                          placeholder="예: 생명과학2 - 효소의 활성과 온도 실험을 통해 인체 내부 피드백 기전 탐구" 
                          className="w-full h-36 px-5 pl-11 pt-3 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-medium resize-none shadow-inner" 
                          required 
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1 block">Target Career</label>
                      <input 
                        type="text" 
                        value={career} 
                        onChange={e => setCareer(e.target.value)} 
                        placeholder="희망 진로를 입력하세요 (예: 종양내과 전문의, 자율주행 소프트웨어 개발자)" 
                        className="w-full h-12 px-5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-medium shadow-inner" 
                        required 
                      />
                    </div>

                    <button 
                      disabled={loading || !subject || !career} 
                      className="w-full h-14 bg-indigo-600 hover:bg-slate-900 disabled:bg-slate-200 text-white font-bold rounded-2xl shadow-xl shadow-indigo-100 flex items-center justify-center gap-2 transition-all group"
                    >
                      {loading ? (
                        <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                      ) : (
                        <>나만의 탐구 전략 설계하기 <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" /></>
                      )}
                    </button>
                  </form>
                </div>
              </div>
            </motion.div>
            
            <div className="md:col-span-4 space-y-6">
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="bg-indigo-900 rounded-3xl p-6 text-white shadow-lg flex flex-col items-center text-center">
                <div className="flex items-center gap-2 mb-3 self-start">
                  <LayoutGrid size={14} className="text-white/70" />
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-indigo-300">Fusion Logic</h3>
                </div>
                <p className="text-sm font-bold leading-tight">교과원리 × 전공도구<br/>= 실천적 산출물</p>
              </motion.div>

              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>
                  How To Use
                </h3>
                <ul className="text-[11px] space-y-3 text-slate-600 font-medium">
                  {[
                    "AI가 제안한 탐구 방향과 산출물을 확인합니다.",
                    "제안된 키워드를 학술 사이트에서 심화 검색합니다.",
                    "실제 실험/보고서를 만들어 세특 기록을 준비합니다."
                  ].map((step, i) => (
                    <li key={i} className="flex gap-3 leading-snug">
                      <span className="font-bold text-indigo-500 tabular-nums">0{i+1}</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>

              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="bg-slate-900 rounded-3xl p-6 text-white shadow-lg">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles size={14} className="text-indigo-400" />
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-indigo-300">Final Tip</h3>
                </div>
                <p className="text-[11px] text-indigo-100 leading-relaxed">
                  탐구 결과뿐만 아니라 <strong>'나의 궁금증이 어떻게 해결되었는지'</strong>를 중심으로 기록하는 것이 가장 효과적입니다.
                </p>
              </motion.div>
            </div>
          </div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 md:grid-cols-12 gap-6 pb-20">
            <div className="md:col-span-4 bg-white rounded-3xl p-8 border border-slate-200 shadow-sm flex flex-col items-center text-center gap-6">
              <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center text-3xl border border-indigo-100">🎓</div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">{career} 지망</h3>
                <p className="text-xs text-indigo-600 font-bold uppercase tracking-widest">Consulting Report</p>
              </div>
              <div className="w-full bg-slate-50 p-5 rounded-2xl text-left border border-slate-100 shadow-inner">
                <p className="text-[9px] text-slate-400 font-bold uppercase mb-1">Analysis Target</p>
                <p className="text-sm font-semibold text-slate-700 leading-tight">{subject}</p>
              </div>
              <button 
                onClick={() => setResult(null)} 
                className="w-full h-12 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors"
              >
                <RefreshCcw size={16} /> 다시 분석하기
              </button>
            </div>

            <div className="md:col-span-8 bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
              <div className="bg-indigo-600 px-8 py-6 text-white flex justify-between items-center">
                <h3 className="text-lg font-bold flex items-center gap-3">
                  <Sparkles size={20} /> 🎯 맞춤형 탐구 전략
                </h3>
              </div>
              <div className="p-8 text-slate-700 leading-relaxed whitespace-pre-wrap text-[15px]">
                {result.split('[💡 멘토의 실전 팁]')[0].replace('[🎯 맞춤형 탐구 전략]', '').trim()}
              </div>
            </div>

            <div className="md:col-span-12 bg-slate-900 rounded-3xl p-8 text-white shadow-xl flex flex-col md:flex-row gap-8 items-center border border-slate-800">
              <div className="w-20 h-20 shrink-0 bg-white/5 rounded-3xl flex items-center justify-center text-4xl border border-white/10 shadow-2xl">💡</div>
              <div className="flex-1 text-center md:text-left">
                <h4 className="text-xl font-bold mb-2 text-indigo-400">멘토의 실전 팁</h4>
                <p className="text-slate-300 text-[15px] leading-relaxed">
                  {result.split('[💡 멘토의 실전 팁]')[1]?.trim() || "더 깊이 있는 탐구를 위해 학술 자료 검색(RISS, DBpia)을 추천합니다."}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        <footer className="pt-20 pb-12 flex flex-col sm:flex-row justify-between items-center gap-4 text-[10px] text-slate-400 font-bold uppercase tracking-widest border-t border-slate-200/50">
          <p>© 2026 Academic Consulting Lab.</p>
          <div className="flex items-center gap-6">
            <span>Powered by Gemini 1.5</span>
            <div className="w-1 h-1 bg-slate-300 rounded-full"></div>
            <span>Expert System V2.1</span>
          </div>
        </footer>
      </div>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(<React.StrictMode><App /></React.StrictMode>);
