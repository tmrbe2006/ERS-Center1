
import { useState, useRef, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useTranslation } from 'react-i18next';
import { Button } from '../components/Button';
import { generateEmergencyReport, generateGeneralReport, generatePredictiveAnalysis, generateStrategicReport, cleanReportText } from '../services/geminiService';
import { Bot, FileText, BarChart2, ArrowLeft, Loader2, BrainCircuit, ShieldCheck, Gavel, FileDown, Search, History, RefreshCw, Calendar, Clock, AlertCircle, Printer, Filter, ChevronDown, Share2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { EmergencyStatus } from '../types';

const AiReports = () => {
  const { emergencies, updateEmergencyReport, geminiApiKey, geminiApiKeySecondary } = useApp();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reportType, setReportType] = useState<'standard' | 'legal' | 'audit' | 'training' | 'general' | 'predictive'>('standard');
  const [report, setReport] = useState<string>('');
  const [generating, setGenerating] = useState(false);
  const [caseSearch, setCaseSearch] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Filter States
  const [timeFilter, setTimeFilter] = useState<'24h' | 'week' | 'month' | 'custom'>('month');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('00:00');
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [endTime, setEndTime] = useState('23:59');
  
  const reportRef = useRef<HTMLDivElement>(null);

  const filteredEmergencies = useMemo(() => {
    let list = emergencies.filter(e => e.status === EmergencyStatus.CLOSED);
    const now = Date.now();

    if (timeFilter === '24h') {
        list = list.filter(e => (now - (e.closedAt || e.createdAt)) < 86400000);
    } else if (timeFilter === 'week') {
        list = list.filter(e => (now - (e.closedAt || e.createdAt)) < 604800000);
    } else if (timeFilter === 'month') {
        list = list.filter(e => (now - (e.closedAt || e.createdAt)) < 2592000000);
    } else if (timeFilter === 'custom' && startDate && endDate) {
        try {
            const startTs = new Date(`${startDate}T${startTime}`).getTime();
            const endTs = new Date(`${endDate}T${endTime}`).getTime();
            list = list.filter(e => {
                const caseTs = (e.closedAt || e.createdAt);
                return caseTs >= startTs && caseTs <= endTs;
            });
        } catch (e) {
            console.error("Invalid Date/Time Format");
        }
    }

    return list
      .filter(e => e.typeName.toLowerCase().includes(caseSearch.toLowerCase()))
      .sort((a, b) => (b.closedAt || b.createdAt || 0) - (a.closedAt || a.createdAt || 0));
  }, [emergencies, caseSearch, timeFilter, startDate, startTime, endDate, endTime]);

  useEffect(() => {
    if (!selectedId && filteredEmergencies.length > 0) {
      setSelectedId(filteredEmergencies[0].id);
    }
  }, [filteredEmergencies, selectedId]);

  useEffect(() => {
    if (selectedId && reportType === 'standard') {
      const selected = emergencies.find(e => e.id === selectedId);
      if (selected?.aiReport) {
        setReport(cleanReportText(selected.aiReport));
        setError(null);
      } else {
        setReport('');
      }
    }
  }, [selectedId, reportType, emergencies]);

  const handleGenerate = async () => {
    if (generating) return;
    setGenerating(true);
    setError(null);
    setReport(''); 
    
    try {
        const selected = filteredEmergencies.find(e => e.id === selectedId) || filteredEmergencies[0];
        if (!selected) {
            throw new Error("يرجى اختيار بلاغ من القائمة أولاً لتوليد التقرير عليه.");
        }

        let result = '';
        if (reportType === 'general') {
            result = await generateGeneralReport(selected, filteredEmergencies, geminiApiKey, geminiApiKeySecondary);
        } else if (reportType === 'predictive') {
            result = await generatePredictiveAnalysis(selected, emergencies, geminiApiKey, geminiApiKeySecondary);
        } else if (['legal', 'audit', 'training'].includes(reportType)) {
            result = await generateStrategicReport(reportType as any, selected, geminiApiKey, geminiApiKeySecondary);
        } else {
            result = await generateEmergencyReport(selected, geminiApiKey, geminiApiKeySecondary);
            if (result) {
                await updateEmergencyReport(selected.id, cleanReportText(result));
            }
        }
        
        if (!result) throw new Error(t('ai_processing'));
        setReport(cleanReportText(result));
    } catch (e: any) { 
        setError(e.message || t('no_data'));
        setReport('');
    } finally {
        setGenerating(false);
    }
  };

  const handlePrint = () => {
    const content = reportRef.current;
    if (!content) return;
    const printWindow = window.open('', '_blank');
    if (printWindow) {
        printWindow.document.write(`
            <html lang="ar" dir="rtl">
                <head>
                    <title>ERS System AI Report</title>
                    <style>
                        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700&display=swap');
                        body { 
                            font-family: 'Cairo', Arial, sans-serif; 
                            direction: rtl; 
                            padding: 40px; 
                            line-height: 1.8; 
                            color: #1f2937;
                            text-rendering: optimizeLegibility;
                            -webkit-font-smoothing: antialiased;
                        }
                        h3 { color: #1976d2; border-right: 5px solid #1976d2; padding-right: 15px; margin-top: 30px; }
                        p { margin-bottom: 15px; }
                        hr { border: none; border-top: 1px solid #eee; margin: 30px 0; }
                        .report-header { text-align:center; margin-bottom: 40px; border-bottom: 2px solid #1976d2; padding-bottom: 20px; }
                    </style>
                </head>
                <body>
                    <div class="report-header">
                        <h1 style="color:#1976d2; margin-bottom: 5px;">تقرير الذكاء الاصطناعي - ERS System</h1>
                        <p style="color:#6b7280;">تاريخ التقرير: ${new Date().toLocaleDateString('ar-EG')}</p>
                    </div>
                    <div dir="rtl">
                        ${content.innerHTML}
                    </div>
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
    if (!report || !reportRef.current) return;
    const element = reportRef.current;
    
    const opt = {
      margin: 15,
      filename: `ERS_Report_${new Date().getTime()}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, letterRendering: false },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait', compress: true }
    };
    
    // @ts-ignore
    window.html2pdf().set(opt).from(element).save();
  };

  const handleShare = async () => {
    if (!report || !reportRef.current) return;
    try {
      const element = reportRef.current;
      const fileName = `ERS_Report_${new Date().getTime()}.pdf`;
      const opt = {
        margin: 15,
        filename: fileName,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, letterRendering: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait', compress: true }
      };
      
      // @ts-ignore
      const pdfBlob = await window.html2pdf().set(opt).from(element).output('blob');
      const file = new File([pdfBlob], fileName, { type: 'application/pdf' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'تقرير ذكاء اصطناعي - ERS System',
          text: 'مرفق تقرير الاستجابة الذكي من نظام ERS System.'
        });
      } else {
        // إذا كانت المشاركة غير مدعومة (مثل المتصفحات المكتبية)، نقوم بتحميل الملف
        handleExportPDF();
      }
    } catch (e) {
      console.error("Share failed, falling back to download", e);
      handleExportPDF();
    }
  };

  return (
    <div className="flex flex-col gap-4 min-h-[calc(100vh-120px)] px-1 sm:px-4 pb-20 overflow-hidden">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-700 gap-4">
            <div>
                <h2 className="text-xl sm:text-2xl font-black text-primary flex items-center gap-3"><Bot /> {t('ai_reports')}</h2>
                <p className="text-[9px] sm:text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Intelligence & Predictive Center</p>
            </div>
            <Button variant="outline" onClick={() => navigate('/admin')} className="w-full sm:w-auto rounded-xl py-2 text-sm font-black"><ArrowLeft size={16} className="mr-2 rtl:rotate-180" /> {t('back')}</Button>
        </div>

        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 flex-1 overflow-hidden">
            {/* Sidebar Controls */}
            <div className="w-full lg:w-1/3 bg-white dark:bg-gray-800 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col overflow-hidden">
                <div className="p-4 sm:p-6 border-b dark:border-gray-700 space-y-5">
                    {/* Period Filtering */}
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2"><Filter size={12}/> {t('report_period')}</label>
                        <div className="grid grid-cols-2 gap-2">
                            <button onClick={() => setTimeFilter('24h')} className={`py-2 px-1 rounded-xl text-[10px] font-black border-2 transition-all ${timeFilter === '24h' ? 'bg-primary text-white border-primary' : 'bg-gray-50 dark:bg-gray-900 border-transparent text-gray-500'}`}>آخر 24 ساعة</button>
                            <button onClick={() => setTimeFilter('week')} className={`py-2 px-1 rounded-xl text-[10px] font-black border-2 transition-all ${timeFilter === 'week' ? 'bg-primary text-white border-primary' : 'bg-gray-50 dark:bg-gray-900 border-transparent text-gray-500'}`}>آخر أسبوع</button>
                            <button onClick={() => setTimeFilter('month')} className={`py-2 px-1 rounded-xl text-[10px] font-black border-2 transition-all ${timeFilter === 'month' ? 'bg-primary text-white border-primary' : 'bg-gray-50 dark:bg-gray-900 border-transparent text-gray-500'}`}>آخر شهر</button>
                            <button onClick={() => setTimeFilter('custom')} className={`py-2 px-1 rounded-xl text-[10px] font-black border-2 transition-all ${timeFilter === 'custom' ? 'bg-primary text-white border-primary' : 'bg-gray-50 dark:bg-gray-900 border-transparent text-gray-500'}`}>فترة مخصصة</button>
                        </div>
                    </div>

                    <AnimatePresence>
                        {timeFilter === 'custom' && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="space-y-3 pt-2 border-t dark:border-gray-700 overflow-hidden">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-[8px] font-bold text-gray-400 uppercase">من تاريخ</label>
                                        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full p-2 bg-gray-50 dark:bg-gray-700 rounded-lg text-[10px] dark:text-white border-none outline-none font-bold" />
                                        <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="w-full p-2 bg-gray-50 dark:bg-gray-700 rounded-lg text-[10px] dark:text-white border-none outline-none font-bold" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[8px] font-bold text-gray-400 uppercase">إلى تاريخ</label>
                                        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full p-2 bg-gray-50 dark:bg-gray-700 rounded-lg text-[10px] dark:text-white border-none outline-none font-bold" />
                                        <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="w-full p-2 bg-gray-50 dark:bg-gray-700 rounded-lg text-[10px] dark:text-white border-none outline-none font-bold" />
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="relative">
                        <Search className="absolute left-3 top-3 text-gray-400" size={16} />
                        <input 
                            type="text" 
                            placeholder={t('search_placeholder')} 
                            value={caseSearch}
                            onChange={(e) => setCaseSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-2xl text-xs font-bold border-none outline-none focus:ring-2 focus:ring-primary dark:text-white shadow-inner"
                        />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                        <ReportTypeBtn active={reportType === 'general'} icon={<BarChart2 size={14}/>} label={t('statistical_analysis')} onClick={() => setReportType('general')} />
                        <ReportTypeBtn active={reportType === 'predictive'} icon={<BrainCircuit size={14}/>} label={t('risk_prediction')} onClick={() => setReportType('predictive')} />
                        <ReportTypeBtn active={reportType === 'legal'} icon={<Gavel size={14}/>} label={t('legal_opinion')} onClick={() => setReportType('legal')} />
                        <ReportTypeBtn active={reportType === 'standard'} icon={<FileText size={14}/>} label={t('technical_report')} onClick={() => setReportType('standard')} />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-hide bg-gray-50/30">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest px-2 mb-2">البلاغات المطابقة ({filteredEmergencies.length})</p>
                    {filteredEmergencies.map(e => (
                        <motion.div 
                            key={e.id} 
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setSelectedId(e.id)} 
                            className={`p-4 rounded-2xl cursor-pointer transition-all border-2 ${selectedId === e.id ? 'bg-primary/5 border-primary' : 'bg-white dark:bg-gray-800 border-transparent hover:border-gray-100 shadow-sm'}`}
                        >
                            <div className="flex justify-between items-center mb-1">
                                <span className={`font-black text-[11px] ${selectedId === e.id ? 'text-primary' : 'dark:text-white'}`}>{e.typeName}</span>
                                {e.aiReport && <ShieldCheck size={14} className="text-green-500" />}
                            </div>
                            <div className="flex justify-between items-center">
                                <div className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">{e.locationName}</div>
                                <div className="text-[8px] text-gray-300 font-mono">{new Date(e.createdAt).toLocaleString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</div>
                            </div>
                        </motion.div>
                    ))}
                    {filteredEmergencies.length === 0 && (
                        <div className="p-10 text-center text-gray-400 text-[10px] font-bold italic">{t('no_matching_alerts')}</div>
                    )}
                </div>
            </div>

            {/* Main Preview Area */}
            <div className="flex-1 bg-white dark:bg-gray-800 rounded-[2rem] shadow-xl border border-gray-100 dark:border-gray-700 flex flex-col overflow-hidden">
                <div className="p-4 sm:p-5 border-b dark:border-gray-700 flex flex-col sm:flex-row justify-between items-center bg-gray-50 dark:bg-gray-900/30 gap-4">
                    <h3 className="font-black dark:text-white text-xs sm:text-sm flex items-center gap-2">
                        <Bot className="text-primary" size={18}/> {t('report_preview')}
                    </h3>
                    <div className="flex gap-2 w-full sm:w-auto">
                        <Button onClick={handleGenerate} disabled={generating} className="flex-1 sm:flex-none text-[10px] py-2 px-6 rounded-xl font-black shadow-lg">
                            {generating ? <Loader2 className="animate-spin" size={16} /> : (report ? "تحديث التقرير" : "توليد التقرير الآن")}
                        </Button>
                        <div className="flex gap-1">
                            <button onClick={handleShare} disabled={!report || generating} className="p-2.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-primary hover:bg-primary/10 disabled:opacity-30 transition-all shadow-sm" title="مشاركة PDF">
                                <Share2 size={20}/>
                            </button>
                            <button onClick={handlePrint} disabled={!report || generating} className="p-2.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-primary hover:bg-primary/10 disabled:opacity-30 transition-all shadow-sm" title="طباعة">
                                <Printer size={20}/>
                            </button>
                            <button onClick={handleExportPDF} disabled={!report || generating} className="p-2.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-primary hover:bg-primary/10 disabled:opacity-30 transition-all shadow-sm" title="تصدير PDF">
                                <FileDown size={20}/>
                            </button>
                        </div>
                    </div>
                </div>
                
                <div className="flex-1 overflow-y-auto bg-[#fafafa] dark:bg-gray-900 p-4 sm:p-12">
                    <div 
                        ref={reportRef} 
                        className="max-w-3xl mx-auto bg-white dark:bg-gray-800 p-8 sm:p-16 shadow-2xl rounded-sm border border-gray-100 dark:border-gray-700 min-h-full font-serif"
                        dir={i18n.dir()}
                    >
                        {generating ? (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-4 py-20">
                                 <Loader2 size={48} className="animate-spin text-primary opacity-20" />
                                 <p className="font-black text-xs uppercase tracking-widest text-primary animate-pulse">{t('ai_processing')}</p>
                            </div>
                        ) : error ? (
                            <div className="text-red-500 text-center py-10">
                                <AlertCircle size={48} className="mx-auto mb-4" />
                                <p className="font-black text-sm uppercase">{error}</p>
                            </div>
                        ) : report ? (
                            <div className="space-y-6 text-right break-words leading-relaxed selection:bg-primary/20" style={{ textRendering: 'optimizeLegibility' }}>
                                {report.split('\n\n').map((block, bIdx) => {
                                    const trimmed = block.trim();
                                    if (!trimmed) return null;
                                    const lines = trimmed.split('\n').map(l => l.trim()).filter(Boolean);
                                    
                                    const hasHeaderPattern = lines.some(l => l.startsWith('التاريخ:') || l.startsWith('اسم الحالة:'));

                                    if (hasHeaderPattern) {
                                        const dateLine = lines.find(l => l.startsWith('التاريخ:')) || '';
                                        const caseLine = lines.find(l => l.startsWith('اسم الحالة:')) || '';
                                        const timeLine = lines.find(l => l.startsWith('توقيت حالة الطوارئ:')) || '';
                                        const metaLine = lines.find(l => l.startsWith('الموقع:')) || '';
                                        const otherLines = lines.filter(l => !l.startsWith('التاريخ:') && !l.startsWith('اسم الحالة:') && !l.startsWith('توقيت حالة الطوارئ:') && !l.startsWith('الموقع:') && !l.startsWith('---'));

                                        return (
                                            <div key={bIdx} className="mb-8">
                                                <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-2 border-primary/20 rounded-2xl p-5 sm:p-6 mb-6 shadow-sm">
                                                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-primary/15 pb-3 mb-3 text-xs font-bold text-gray-600 dark:text-gray-300">
                                                        <span className="text-primary font-black">{dateLine}</span>
                                                        <span className="font-mono text-[11px] bg-white dark:bg-gray-800 px-3 py-1 rounded-full border border-primary/20 shadow-xs">{metaLine.split('|').find(s => s.includes('المرجع')) || 'ERS-OFFICIAL'}</span>
                                                    </div>
                                                    <h3 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                                                        <span className="w-2.5 h-2.5 rounded-full bg-primary inline-block"></span>
                                                        {caseLine}
                                                    </h3>
                                                    <p className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
                                                        {timeLine}
                                                    </p>
                                                    <div className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                                        {metaLine}
                                                    </div>
                                                </div>

                                                {otherLines.map((other, oIdx) => (
                                                    <h2 key={oIdx} className="text-lg sm:text-xl font-black text-primary border-r-4 border-primary pr-3 mt-4 mb-2">
                                                        {other}
                                                    </h2>
                                                ))}
                                            </div>
                                        );
                                    }

                                    const isMainTitle = bIdx === 0 && (lines[0].startsWith('تقرير') || lines[0].startsWith('مذكرة'));
                                    const isSectionHeader = /^(أولاً|ثانياً|ثالثاً|رابعاً|خامساً|سادساً|سابعاً|الموضوع|الملف المرجعي|رقم المرجع|تاريخ الإصدار):?/i.test(lines[0]);

                                    if (isMainTitle) {
                                        return (
                                            <div key={bIdx} className="border-b-2 border-primary/20 pb-5 mb-8">
                                                <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white leading-tight">
                                                    {lines[0]}
                                                </h2>
                                                {lines.slice(1).map((sub, sIdx) => (
                                                    <p key={sIdx} className="text-xs text-primary font-bold mt-1.5 flex items-center gap-2">
                                                        <span className="inline-block w-2 h-2 rounded-full bg-primary"></span>
                                                        {sub}
                                                    </p>
                                                ))}
                                            </div>
                                        );
                                    }

                                    if (isSectionHeader) {
                                        return (
                                            <div key={bIdx} className="mt-8 mb-4 bg-gray-50/80 dark:bg-gray-700/20 p-4 sm:p-5 rounded-2xl border-r-4 border-primary shadow-sm">
                                                <h3 className="text-base sm:text-lg font-black text-primary mb-3">
                                                    {lines[0]}
                                                </h3>
                                                <div className="space-y-2">
                                                    {lines.slice(1).map((line, lIdx) => {
                                                        const isBullet = line.startsWith('•');
                                                        const isNumbered = /^[0-9١-٩]+[\.\)]/.test(line);
                                                        return (
                                                            <div key={lIdx} className={`text-xs sm:text-sm text-gray-700 dark:text-gray-300 font-medium leading-[1.9] ${isBullet ? 'pr-2 flex items-start gap-2' : isNumbered ? 'pr-2 font-semibold text-gray-800 dark:text-gray-200' : ''}`}>
                                                                {isBullet ? (
                                                                    <>
                                                                        <span className="text-primary mt-1 shrink-0 font-bold">•</span>
                                                                        <span>{line.replace(/^•\s*/, '')}</span>
                                                                    </>
                                                                ) : (
                                                                    line
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    }

                                    return (
                                        <div key={bIdx} className="space-y-2">
                                            {lines.map((line, lIdx) => {
                                                const isBullet = line.startsWith('•');
                                                const isNumbered = /^[0-9١-٩]+[\.\)]/.test(line);
                                                return (
                                                    <p key={lIdx} className={`text-xs sm:text-sm text-gray-700 dark:text-gray-300 font-medium leading-[1.9] ${isBullet ? 'pr-2 flex items-start gap-2' : isNumbered ? 'pr-2 font-semibold text-gray-800 dark:text-gray-200' : ''}`}>
                                                        {isBullet ? (
                                                            <>
                                                                <span className="text-primary mt-1 shrink-0 font-bold">•</span>
                                                                <span>{line.replace(/^•\s*/, '')}</span>
                                                            </>
                                                        ) : (
                                                            line
                                                        )}
                                                    </p>
                                                );
                                            })}
                                        </div>
                                    );
                                })}
                                <div className="mt-14 pt-8 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center opacity-60 no-print">
                                    <div className="text-[10px] font-black uppercase tracking-wider text-gray-500">ERS System Intelligent Report Engine</div>
                                    <div className="text-[10px] font-mono text-gray-400">{new Date().toLocaleString('ar-EG')}</div>
                                </div>
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400 py-20 opacity-20">
                                <FileText size={64} />
                                <p className="text-xs font-black mt-4 uppercase tracking-widest">حدد معايير الفلترة واضغط توليد</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};

const ReportTypeBtn = ({ icon, label, active, onClick }: any) => (
    <button onClick={onClick} className={`flex items-center justify-center gap-2 p-3 rounded-xl transition-all border-2 ${active ? 'bg-primary text-white border-primary shadow-lg' : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-700 text-gray-500 hover:border-primary/30'}`}>
        {icon} <span className="text-[9px] font-black whitespace-nowrap">{label}</span>
    </button>
);

export default AiReports;
