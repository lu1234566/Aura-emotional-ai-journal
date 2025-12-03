
import React, { useState, useRef, useEffect } from 'react';
import { X, ArrowRight, Sparkles, PenTool, CheckCircle2, Loader2 } from 'lucide-react';
import { useAppStore } from '../../store/useStore';
import { ApiService } from '../../services/api';

const STEPS = [
  { 
    label: "Hoje eu me senti...", 
    placeholder: "cansado, inspirado, confuso...", 
    color: "text-blue-400" 
  },
  { 
    label: "O que mais me afetou foi...", 
    placeholder: "uma conversa, o clima, uma notícia...", 
    color: "text-purple-400" 
  },
  { 
    label: "Eu gostaria de ter...", 
    placeholder: "dito não, descansado mais, abraçado alguém...", 
    color: "text-pink-400" 
  },
  { 
    label: "No fundo, eu aprendi que...", 
    placeholder: "tudo passa, sou forte, preciso de tempo...", 
    color: "text-emerald-400" 
  }
];

export const WordTherapyModal = ({ onClose }: { onClose: () => void }) => {
  const { user, saveReport, reports, isLight, isOnline } = useAppStore();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>(Array(STEPS.length).fill(""));
  const [isProcessing, setIsProcessing] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-focus on step change
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [step]);

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      setStep(s => s + 1);
    } else {
      finishSession();
    }
  };

  const handleBack = () => {
    if (step > 0) setStep(s => s - 1);
  };

  const handleChange = (val: string) => {
    const newAnswers = [...answers];
    newAnswers[step] = val;
    setAnswers(newAnswers);
  };

  const finishSession = async () => {
    setIsProcessing(true);
    try {
      // Construct narrative
      const narrative = answers.map((ans, i) => {
        // Remove trailing punctuation from prompt if exists to flow better
        const prompt = STEPS[i].label.replace(/\.\.\.$/, ""); 
        return `${prompt} ${ans}.`;
      }).join("\n\n");

      // Process via existing API pipeline
      const partialReport = await ApiService.processDiaryEntry(
        narrative,
        user!.id,
        undefined, // no image
        undefined, // no audio
        undefined, // no location
        reports
      );

      const fullReport: any = {
        id: Date.now().toString(),
        ...partialReport
      };

      await saveReport(fullReport);
      onClose();
    } catch (e) {
      console.error(e);
      alert("Erro ao salvar sessão.");
      setIsProcessing(false);
    }
  };

  const currentStep = STEPS[step];
  const progress = ((step + 1) / STEPS.length) * 100;
  const isLastStep = step === STEPS.length - 1;

  const bgClass = isLight ? 'bg-[#f8fafc]' : 'bg-[#09090b]';
  const textClass = isLight ? 'text-slate-800' : 'text-slate-100';

  return (
    <div className={`fixed inset-0 z-[60] ${bgClass} flex flex-col animate-fade-in`}>
      {/* Header */}
      <div className="flex justify-between items-center p-6">
        <div className="flex items-center gap-2 opacity-50">
          <PenTool size={18} />
          <span className="text-xs font-bold uppercase tracking-widest">Terapia da Palavra</span>
        </div>
        <button onClick={onClose} disabled={isProcessing} className="p-2 hover:opacity-50 transition-opacity">
          <X size={24} className={textClass} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col justify-center px-8 max-w-2xl mx-auto w-full">
        
        {isProcessing ? (
          <div className="text-center space-y-6 animate-pulse">
            <Sparkles size={48} className="mx-auto text-cyan-500" />
            <h2 className={`text-2xl font-light ${textClass}`}>Tecendo seus pensamentos...</h2>
            <p className="text-sm opacity-50">A IA está gerando um poema e orientações para você.</p>
          </div>
        ) : (
          <div className="space-y-8 animate-slide-up">
            <div className="space-y-2">
               <span className="text-xs font-mono opacity-40">PASSO {step + 1} DE {STEPS.length}</span>
               <h2 className={`text-3xl md:text-4xl font-light leading-tight ${currentStep.color}`}>
                 {currentStep.label}
               </h2>
            </div>

            <textarea
              ref={inputRef}
              value={answers[step]}
              onChange={(e) => handleChange(e.target.value)}
              placeholder={currentStep.placeholder}
              className={`w-full bg-transparent border-b-2 border-dashed ${isLight ? 'border-slate-300 text-slate-800 placeholder:text-slate-400' : 'border-slate-700 text-white placeholder:text-slate-600'} text-xl md:text-2xl py-4 outline-none resize-none focus:border-cyan-500 transition-colors h-32 leading-relaxed`}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  if (answers[step].trim()) handleNext();
                }
              }}
            />

            <div className="flex items-center justify-between pt-4">
               {step > 0 ? (
                 <button onClick={handleBack} className="text-sm opacity-50 hover:opacity-100 transition-opacity">
                   Voltar
                 </button>
               ) : <div></div>}

               <button
                 onClick={handleNext}
                 disabled={!answers[step].trim()}
                 className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold transition-all ${
                   answers[step].trim() 
                     ? (isLastStep ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' : 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/30') 
                     : 'bg-slate-700/20 text-slate-500 cursor-not-allowed'
                 }`}
               >
                 {isLastStep ? "Finalizar" : "Próximo"}
                 {isLastStep ? <CheckCircle2 size={18} /> : <ArrowRight size={18} />}
               </button>
            </div>
          </div>
        )}

      </div>

      {/* Progress Bar */}
      <div className="h-1 bg-slate-200 dark:bg-slate-900 w-full mt-auto">
        <div 
          className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 transition-all duration-500 ease-out" 
          style={{ width: `${progress}%` }}
        ></div>
      </div>
    </div>
  );
};
