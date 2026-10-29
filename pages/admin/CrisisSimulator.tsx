
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../components/Button';
import { useNavigate } from 'react-router-dom';
import { 
  ShieldAlert, Play, ArrowLeft, Bot, RefreshCw, AlertTriangle, 
  Target, Zap, Loader2, Printer, FileDown, Save, MessageSquareText, Settings2 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { FacilityProfile, SimulatorConfig } from '../../types';
import { generateCrisisScenario } from '../../services/geminiService';
// Fix: Import useApp to access Gemini API keys from the application context
import { useApp } from '../../context/AppContext';

const CrisisSimulator = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  // Fix: Extract Gemini API keys from the application state provided by AppContext
  const { geminiApiKey, geminiApiKeySecondary } = useApp();
  const [loading, setLoading] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [scenario, setScenario] = useState<any>(null);
  const [customSituations, setCustomSituations] = useState('');
  const [facilityProfile, setFacilityProfile] = useState<FacilityProfile | null>(null);

  useEffect(() => {
    const loadConfig = async () => {
        const profileSnap = await getDoc(doc(db, 'system', 'facility_profile'));
        if (profileSnap.exists()) setFacilityProfile(profileSnap.data() as FacilityProfile);
        
        const configSnap = await getDoc(doc(db, 'system', 'simulator_config'));
        if (configSnap.exists()) {
            const data = configSnap.data() as SimulatorConfig;
            setCustomSituations(data.customSituations || '');
        }
    };
    loadConfig();
  }, []);

  const saveConfig = async () => {
      setSavingSettings(true);
      try {
          await setDoc(doc(db, 'system', 'simulator_config'), {
              customSituations,
              updatedAt: Date.now()
          });
      } catch (e) { alert("فشل حفظ الإعدادات"); }
      setSavingSettings(false);
  };

  const handlePrint = () => {
      const element = document.getElementById('scenario-content');
      if (!element) return;
      
      const printWindow = window.open('', '_blank');
      if (printWindow) {
          printWindow.document.write(`
            <html>
                <head>
                    <title>ERS System Crisis Scenario</title>
                    <style>
                        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700&display=swap');
                        body { font-family: 'Cairo', sans-serif; direction: rtl; padding: 40px; color: #1f2937; }
                        h4 { color: #1976d2; border-bottom: 2px solid #eee; padding-bottom: 10px; margin-top: 0; }
                        .bg-gray-50 { background: #f9fafb !important; padding: 25px; border-radius: 15px; border: 1px solid #e5e7eb; margin-bottom: 25px; }
                        .grid { display: flex; gap: 30px; margin-top: 25px; }
                        .grid > div { flex: 1; }
                        ul { padding-right: 20px; list-style-type: none; }
                        li { margin-bottom: 12px; font-weight: bold; background: #fff; padding: 10px; border-radius: 8px; border-right: 4px solid #1976d2; }
                        .no-print { display: none !important; }
                    </style>
                </head>
                <body>
                    <div style="text-align:center; border-bottom: 3px solid #1976d2; padding-bottom: 15px; margin-bottom: 30px;">
                        <h2 style="color:#1976d2; margin-bottom: 5px;">تقرير محاكي الأزمات الذكي ERS System</h2>
                        <p style="font-size:12px; color:#6b7280;">تاريخ التوليد: ${new Date().toLocaleString('ar-EG')}</p>
                    </div>
                    ${element.innerHTML}
                    <script>
                        window.onload = () => {
                            setTimeout(() => {
                                window.print();
                                window.onafterprint = () => window.close();
                            }, 500);
                        };
                    </script>
                </body>
            </html>
          `);
          printWindow.document.close();
      }
  };

  const handleExportPDF = () => {
      const element = document.getElementById('scenario-content');
      if (!element) return;
      
      const opt = {
          margin: 15,
          filename: `ERS_Scenario_${Date.now()}.pdf`,
          image: { type: 'jpeg', quality: 1.0 },
          html2canvas: { scale: 3, useCORS: true, logging: false },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };
      
      // @ts-ignore
      if (window.html2pdf) {
          // @ts-ignore
          window.html2pdf().set(opt).from(element).save();
      } else {
          alert("أداة PDF غير محملة بعد، يرجى المحاولة مرة أخرى.");
      }
  };

  const handleGenerateScenario = async () => {
    setLoading(true);
    try {
      // Fix: Pass geminiApiKey and geminiApiKeySecondary as required by the generateCrisisScenario function signature
      const result = await generateCrisisScenario(facilityProfile, customSituations, geminiApiKey, geminiApiKeySecondary);
      setScenario(result);
    } catch (e: any) {
      console.error("Simulator Error:", e);
      alert(`فشل توليد السيناريو: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8 pb-10 px-2 sm:px-0">
      <div className="flex items-center justify-between border-b pb-4 dark:border-gray-700 gap-4 no-print">
        <h2 className="text-xl sm:text-2xl font-black text-gray-800 dark:text-white flex items-center gap-2 tracking-tight">
          <ShieldAlert className="text-primary shrink-0" size={24} /> {t('simulated_emergencies')}
        </h2>
        <Button variant="outline" onClick={() => navigate('/admin')} className="rounded-xl shrink-0">
          <ArrowLeft size={16} className="mr-1 rtl:rotate-180" /> {t('back')}
        </Button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-[2rem] p-6 shadow-md border border-gray-100 dark:border-gray-700 space-y-4 no-print">
          <div className="flex items-center gap-2 text-primary font-black text-xs uppercase tracking-widest">
              <Settings2 size={16} /> تخصيص محتوى المحاكي
          </div>
          <p className="text-[10px] text-gray-400 font-bold">أدخل أنواع الحوادث أو المواقف التي تريد أن يركز عليها الذكاء الاصطناعي عند التوليد:</p>
          <textarea 
            value={customSituations}
            onChange={(e) => setCustomSituations(e.target.value)}
            placeholder="مثال: تسريب غاز في المعمل الكيميائي، حريق في غرفة الخوادم بالدور الثالث..."
            className="w-full p-4 rounded-2xl bg-gray-50 dark:bg-gray-900 border-none outline-none focus:ring-2 focus:ring-primary min-h-[100px] font-bold text-sm dark:text-white shadow-inner"
          />
          <div className="flex justify-end">
              <Button onClick={saveConfig} disabled={savingSettings} className="rounded-xl py-2 px-6 text-xs font-black">
                  {savingSettings ? <Loader2 className="animate-spin" /> : <><Save size={14} className="mr-1"/> حفظ المواقف المخصصة</>}
              </Button>
          </div>
      </div>

      <div className="bg-indigo-600 rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-10 text-white shadow-xl shadow-indigo-500/20 relative overflow-hidden no-print">
         <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 sm:gap-8">
            <div className="bg-white/20 p-5 rounded-3xl shrink-0"><Bot size={48} className="sm:w-16 sm:h-16"/></div>
            <div className="flex-1 text-center md:text-right">
                <h3 className="text-2xl sm:text-3xl font-black mb-3">توليد سيناريو مؤسسي</h3>
                <p className="text-indigo-100 font-medium leading-relaxed text-sm sm:text-base italic">تقوم وحدة ERS الذكية بربط بيانات منشأتك والمواقف المخصصة أعلاه لإنشاء تجربة تدريبية دقيقة ومتقدمة.</p>
                <button 
                  onClick={handleGenerateScenario}
                  disabled={loading}
                  className="mt-6 bg-white text-indigo-600 px-8 py-4 rounded-2xl font-black flex items-center gap-3 mx-auto md:mx-0 hover:scale-105 transition-all shadow-lg active:scale-95 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="animate-spin" size={20} /> : <Play size={20} fill="currentColor" />} {scenario ? 'توليد سيناريو مختلف' : 'بدء المحاكاة الآن'}
                </button>
            </div>
         </div>
      </div>

      <AnimatePresence>
        {scenario && (
          <motion.div 
            id="scenario-content"
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="bg-white dark:bg-gray-800 rounded-[2rem] sm:rounded-[2.5rem] shadow-xl p-6 sm:p-10 border border-gray-100 dark:border-gray-700 space-y-8"
          >
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b dark:border-gray-700 pb-6">
                <div>
                    <h4 className="text-xl sm:text-2xl font-black text-primary leading-tight">{scenario.title}</h4>
                    <span className={`mt-2 inline-block px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${scenario.difficulty === 'صعب' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>مستوى الصعوبة: {scenario.difficulty}</span>
                </div>
                <div className="flex gap-2 no-print">
                    <button onClick={handlePrint} className="p-3 bg-gray-50 dark:bg-gray-700 text-gray-500 hover:text-primary rounded-xl transition-all border border-gray-100 dark:border-gray-600 shadow-sm" title="طباعة">
                        <Printer size={20} />
                    </button>
                    <button onClick={handleExportPDF} className="p-3 bg-gray-50 dark:bg-gray-700 text-gray-500 hover:text-primary rounded-xl transition-all border border-gray-100 dark:border-gray-600 shadow-sm" title="تصدير PDF">
                        <FileDown size={20} />
                    </button>
                </div>
            </div>

            <div className="space-y-4">
                <h5 className="font-black flex items-center gap-2 text-gray-700 dark:text-white text-sm sm:text-base">
                    <AlertTriangle size={18} className="text-orange-500"/> تفاصيل الأزمة الميدانية
                </h5>
                <div className="text-gray-600 dark:text-gray-300 leading-loose font-bold bg-gray-50 dark:bg-gray-900/50 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 text-sm sm:text-base italic shadow-inner">
                    "{scenario.description}"
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                    <h5 className="font-black flex items-center gap-2 text-gray-700 dark:text-white text-sm sm:text-base">
                        <Zap className="text-blue-500" size={18}/> التحديات الحرجة
                    </h5>
                    <ul className="space-y-3">
                        {scenario.challenges.map((c: any, i: number) => (
                            <li key={i} className="bg-blue-50 dark:bg-blue-900/10 text-blue-700 dark:text-blue-300 p-4 rounded-2xl text-xs sm:text-sm font-black border-r-4 border-blue-400 flex items-center gap-3 shadow-sm">
                                <span className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center text-[10px] shrink-0">{i+1}</span>
                                {c}
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="space-y-4">
                    <h5 className="font-black flex items-center gap-2 text-gray-700 dark:text-white text-sm sm:text-base">
                        <Target className="text-green-500" size={18}/> مؤشرات النجاح (KPIs)
                    </h5>
                    <ul className="space-y-3">
                        {scenario.goals.map((g: any, i: number) => (
                            <li key={i} className="bg-green-50 dark:bg-green-900/10 text-green-700 dark:text-blue-300 p-4 rounded-2xl text-xs sm:text-sm font-black border-r-4 border-green-400 flex items-center gap-3 shadow-sm">
                                <span className="w-5 h-5 rounded-full bg-green-500 text-white flex items-center justify-center text-[10px] shrink-0">{i+1}</span>
                                {g}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            <div className="hidden print:block border-t pt-10 mt-20 text-[10px] text-gray-400 font-bold flex justify-between">
                <span>ERS System - محاكي الأزمات الذكي</span>
                <span>تاريخ التوليد: ${new Date().toLocaleString('ar-EG')}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; -webkit-print-color-adjust: exact; }
          #scenario-content { border: none !important; box-shadow: none !important; padding: 0 !important; }
        }
      `}</style>
    </div>
  );
};

export default CrisisSimulator;
