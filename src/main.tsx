import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, GraduationCap, ArrowRight, Loader2, BookOpen, UserCircle, RefreshCcw, LayoutGrid, Info } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

// AI Logic
const getApiKey = () => {
  try {
    const envKey = process.env.GEMINI_API_KEY;
    if (envKey && envKey !== "MY_GEMINI_API_KEY") return envKey;
  } catch (e) {
    // process might be missing in some environments
  }
  return localStorage.getItem('CUSTOM_GEMINI_API_KEY') || "";
};

const SYSTEM_PROMPT = `
# 역할 (Role)
당신은 고등학생의 모든 교과 수행평가(국영수사과 등)를 학생의 희망 진로와 연결하여 '실천적이고 구체적인 탐구 방향'으로 기획해주는 1:1 진로 연계 전문 컨설턴트입니다.

# 핵심 임무 (Core Task)
학생이 입력한 [과목 및 수행평가 주제]와 [희망 진로]를 분석하여, 아래의 '융합 공식'에 따라 학술적으로 깊이 있고 실효성 있는 탐구 방향을 제안하세요.

💡 융합 공식: [교과의 핵심 개념/원리/현상] × [희망 진로의 전공 도구/방법론] = [실천적 산출물 기획]

# 🚫 3대 절대 제약 조건 (Crucial Constraints)
1. 1차원적 비유 및 클리셰 절대 금지
   - 교과 개념을 진로에 억지로 빗대어 해석하지 마세요.
2. 진로 계열별 맞춤 해결 강제
   - 진로 계열에 따라 결과물의 '형태'가 완벽히 달라야 합니다.
3. 기계적인 고정 문장 틀(Template) 사용 금지
   - 과목의 특성(수학의 논리, 역사의 흐름, 문학의 맥락 등)에 맞춰 가장 자연스러운 흐름으로 조언하세요.

# 📝 출력 양식 (Output Format)
아래의 두 가지 항목만 출력하세요. 친절하고 명쾌한 전문가의 구어체 (~해 보는 건 어떨까요?, ~하는 방향을 추천합니다.)를 사용합니다.

**[🎯 맞춤형 탐구 전략]**
(구체적인 결과물 형태를 명시해주세요.)

**[💡 멘토의 실전 팁]**
(평가자를 사로잡을 핵심 어필 포인트를 추천해주세요.)
`;

async function getConsulting(subject: string, career: string, customApiKey?: string) {
  const apiKey = customApiKey || getApiKey();
  if (!apiKey) throw new Error("API_KEY_MISSING");
  
  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `과목 및 주제: ${subject}\n희망 진로: ${career}`,
    config: { systemInstruction: SYSTEM_PROMPT, temperature: 0.7 }
  });
  return response.text || "결과를 생성할 수 없습니다.";
}

// App Component
function App() {
  const [subject, setSubject] = useState('');
  const [career, setCareer] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [showKeyInput, setShowKeyInput] = useState(!getApiKey());
  const [tempApiKey, setTempApiKey] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !career) return;
    
    setLoading(true);
    setResult(null);
    try {
      const response = await getConsulting(subject, career);
      setResult(response);
    } catch (error: any) {
      if (error.message === "API_KEY_MISSING") {
        setShowKeyInput(true);
      } else {
        console.error(error);
        alert('오류가 발생했습니다. API 키를 확인해주세요.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSaveKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (tempApiKey.startsWith('AIza')) {
      localStorage.setItem('CUSTOM_GEMINI_API_KEY', tempApiKey);
      setShowKeyInput(false);
      alert('API 키가 저장되었습니다.');
    } else {
      alert('올바른 Gemini API 키를 입력해주세요.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
              <GraduationCap size={28} />
            </div>
            <div>
              <h1 className="text-xl font-bold leading-tight text-slate-900">CareerPath Professional</h1>
              <p className="text-[10px] text-indigo-600 font-bold tracking-widest uppercase">1:1 진로 연계 수행평가 컨설팅 System</p>
            </div>
          </div>
          <div className="hidden md:flex gap-6 italic text-xs font-bold text-slate-400">
            {getApiKey() ? 'AI CONSULTANT ONLINE · GEMINI 3.0 FLASH' : 'API KEY REQUIRED'}
          </div>
        </header>

        {showKeyInput && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bento-card-indigo p-8 mb-6 border-2 border-indigo-400">
            <h3 className="text-xl font-bold mb-2">🔑 Gemini API 키가 필요합니다</h3>
            <p className="text-indigo-200 text-sm mb-6">GitHub 등 외부 환경에서 실행하려면 Gemini API 키가 필요합니다. 구글 AI 스튜디오에서 키를 발급받아 입력해주세요.</p>
            <form onSubmit={handleSaveKey} className="flex flex-col sm:flex-row gap-3">
              <input 
                type="password" 
                placeholder="AIza..." 
                value={tempApiKey}
                onChange={(e) => setTempApiKey(e.target.value)}
                className="input-field bg-white/10 text-white placeholder:text-white/30 border-white/20 flex-1"
                required
              />
              <button type="submit" className="px-8 py-3 bg-white text-indigo-900 font-bold rounded-xl hover:bg-indigo-50 transition-colors">키 저장하기</button>
            </form>
            <p className="mt-4 text-[10px] text-indigo-300">입력하신 키는 브라우저의 localStorage에만 안전하게 저장됩니다.</p>
          </motion.div>
        )}

        {!result ? (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Left: Input Section */}
            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="md:col-span-8 bento-card p-8 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-2">
                  <h2 className="text-3xl font-bold text-slate-900">수행평가에 <span className="text-indigo-600 underline underline-offset-8 decoration-indigo-200">진로</span>를 더하다.</h2>
                  {!getApiKey() ? (
                    <span className="px-2 py-1 bg-red-50 text-red-600 text-[10px] font-bold rounded animate-pulse">API KEY NEEDED</span>
                  ) : (
                    localStorage.getItem('CUSTOM_GEMINI_API_KEY') && (
                      <button 
                        onClick={() => {
                          if(confirm('저장된 API 키를 삭제할까요?')) {
                            localStorage.removeItem('CUSTOM_GEMINI_API_KEY');
                            window.location.reload();
                          }
                        }}
                        className="px-2 py-1 bg-slate-100 text-slate-500 hover:text-red-600 text-[9px] font-bold rounded transition-colors"
                      >
                        API KEY RESET
                      </button>
                    )
                  )}
                </div>
                <p className="text-slate-500 mb-8 leading-relaxed">평범한 주제를 나만의 특별한 스토리로 바꾸는 학술적 설계를 시작하세요.</p>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-1">
                      <div className="flex justify-between items-end">
                        <label className="input-label">Subject & Topic</label>
                        <span className="text-[10px] text-indigo-500 font-bold mb-1 bg-indigo-50 px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm border border-indigo-100">
                          <Info size={11} /> 정보를 구체적으로 적을수록 상담 정확도가 높아집니다
                        </span>
                      </div>
                      <div className="relative">
                        <BookOpen size={16} className="absolute left-4 top-4 text-slate-400" />
                        <textarea
                          value={subject}
                          onChange={(e) => setSubject(e.target.value)}
                          placeholder="어떤 주제인가요? 교과서의 개념이나 본인이 궁금했던 점을 상세히 적어주세요. (예: 생명과학2 - 효소의 활성과 온도 실험을 통해 인체 내부 피드백 기전 탐구)"
                          className="input-field pl-11 pt-3 h-32 resize-none"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="input-label">Target Career</label>
                      <div className="relative">
                        <UserCircle size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          value={career}
                          onChange={(e) => setCareer(e.target.value)}
                          placeholder="희망 진로를 입력하세요 (예: 뇌과학자, 반도체 설계자)"
                          className="input-field pl-11"
                          required
                        />
                      </div>
                    </div>
                  </div>
                  <button type="submit" disabled={loading || !subject || !career} className="w-full h-14 bg-indigo-600 hover:bg-slate-900 disabled:bg-slate-200 text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-2 group shadow-xl shadow-indigo-100">
                    {loading ? <Loader2 className="animate-spin" size={20} /> : <>나만의 탐구 전략 설계하기 <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" /></>}
                  </button>
                </form>
              </div>
            </motion.div>

            {/* Right: Info Cards */}
            <div className="md:col-span-4 space-y-6">
              {/* Compact Fusion Formula */}
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="bento-card-indigo p-5 flex flex-col items-center text-center">
                <div className="flex items-center gap-2 mb-3 self-start">
                  <LayoutGrid size={14} className="text-white/70" />
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-indigo-300">Fusion Logic</h3>
                </div>
                <p className="text-sm font-bold text-white leading-tight">교과원리 × 전공도구<br/>= 실천적 산출물</p>
              </motion.div>

              {/* How to Use Card */}
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="bento-card p-5 border-indigo-100 shadow-indigo-50/50">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>
                  How To Use
                </h3>
                <ul className="space-y-2.5">
                  {[
                    "AI가 제안한 탐구 방향과 산출물을 확인합니다.",
                    "제안된 키워드를 학술 사이트에서 심화 검색합니다.",
                    "실제 실험/보고서를 만들어 세특 기록을 준비합니다."
                  ].map((step, i) => (
                    <li key={i} className="flex gap-3 text-[11px] text-slate-600 leading-snug">
                      <span className="font-bold text-indigo-500 tabular-nums">0{i+1}</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>

              {/* Consultant Tip Card */}
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="bento-card-dark p-5 bg-indigo-950">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles size={14} className="text-indigo-400" />
                  <h3 className="text-[10px] font-bold uppercase tracking-widest text-indigo-300">Final Tip</h3>
                </div>
                <p className="text-[11px] text-indigo-100 leading-relaxed">
                  탐구 결과뿐만 아니라 <strong>'나의 궁금증이 어떻게 해결되었는지'</strong>를 중심으로 기록하는 것이 대학 평가자의 마음을 움직이는 가장 큰 포인트입니다.
                </p>
              </motion.div>
            </div>
          </div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-4 bento-card flex flex-col gap-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center text-2xl border border-slate-200 shadow-sm">👤</div>
                <div><h3 className="font-bold text-slate-900 text-lg">상담 분석</h3><p className="text-xs text-indigo-600 font-bold uppercase">{career} 지망</p></div>
              </div>
              <div className="space-y-4">
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100"><p className="input-label">Topic</p><p className="text-sm font-semibold text-slate-700">{subject}</p></div>
                <button onClick={() => {setResult(null); setSubject(''); setCareer('');}} className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors"><RefreshCcw size={16} /> 다시 시작</button>
              </div>
            </div>
            <div className="md:col-span-8 bento-card p-0 overflow-hidden flex flex-col">
              <div className="bg-indigo-600 px-8 py-6 text-white flex justify-between items-center"><h3 className="text-lg font-bold flex items-center gap-3"><Sparkles size={20} /> 🎯 맞춤형 탐구 전략</h3></div>
              <div className="p-8"><p className="text-lg leading-relaxed text-slate-600 whitespace-pre-wrap">{result.split('[💡 멘토의 실전 팁]')[0].replace('[🎯 맞춤형 탐구 전략]', '').trim()}</p></div>
            </div>
            <div className="md:col-span-12 bento-card-dark flex flex-col md:flex-row gap-8 items-center bg-slate-900">
              <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center text-3xl shrink-0">💡</div>
              <div className="flex-1"><h3 className="text-xl font-bold mb-2">멘토의 실전 팁</h3><p className="text-slate-400 text-lg leading-relaxed whitespace-pre-wrap">{result.split('[💡 멘토의 실전 팁]')[1]?.trim() || ""}</p></div>
            </div>
          </motion.div>
        )}

        <footer className="pt-8 pb-12 flex flex-col md:flex-row justify-between items-center text-[10px] text-slate-400 font-bold uppercase tracking-widest gap-4">
          <p>© 2026 AI Career Consulting Lab.</p>
          <p>Verified Academic Integrity System V.4.2</p>
        </footer>
      </div>
    </div>
  );
}

// Render
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
