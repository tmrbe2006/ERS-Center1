
import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '../../components/Button';
import { ArrowLeft, FileText, Search, RotateCcw, Filter, Calendar, Users, Printer } from 'lucide-react';
import { EmergencyStatus } from '../../types';

const CaseReports = () => {
  const { emergencies, users } = useApp();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [statusFilter, setStatusFilter] = useState<string>('closed'); 
  const [typeNameSearch, setTypeNameSearch] = useState('');
  const [creatorFilter, setCreatorFilter] = useState('');
  const [closerFilter, setCloserFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const getUserName = (userId?: string) => {
    if (!userId) return 'N/A';
    const user = users.find(u => u.id === userId);
    return user ? user.name : userId;
  };

  const handlePrint = () => {
    const element = document.getElementById('reports-table-container');
    if (!element) return;
    const printWindow = window.open('', '_blank');
    if (printWindow) {
        printWindow.document.write(`
            <html>
                <head>
                    <title>Cases Report</title>
                    <style>
                        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700&display=swap');
                        body { font-family: 'Cairo', sans-serif; direction: rtl; padding: 40px; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        th, td { border: 1px solid #ddd; padding: 10px; text-align: right; font-size: 11px; }
                        th { background: #f4f4f4; font-weight: bold; }
                        .no-print { display: none !important; }
                    </style>
                </head>
                <body>
                    <h2 style="text-align:center; color:#1976d2;">سجل بلاغات الطوارئ ERS System</h2>
                    <p style="text-align:center;">تاريخ الاستخراج: ${new Date().toLocaleString('ar-EG')}</p>
                    ${element.innerHTML}
                    <script>
                        window.onload = () => {
                            window.print();
                            window.onafterprint = () => window.close();
                        };
                    </script>
                </body>
            </html>
        `);
        printWindow.document.close();
    }
  };

  const filteredCases = useMemo(() => {
    return emergencies.filter(e => {
      if (typeNameSearch && !e.typeName.toLowerCase().includes(typeNameSearch.toLowerCase())) return false;
      
      if (statusFilter !== 'all') {
          if (statusFilter === 'active' && e.status !== EmergencyStatus.ACTIVE) return false;
          if (statusFilter === 'closed' && e.status !== EmergencyStatus.CLOSED) return false;
      }
      
      const creatorName = e.creatorName?.toLowerCase() || '';
      if (creatorFilter && !creatorName.includes(creatorFilter.toLowerCase())) return false;
      
      const closerName = getUserName(e.closedBy).toLowerCase();
      if (closerFilter && !closerName.includes(closerFilter.toLowerCase())) return false;
      
      const caseDate = new Date(e.createdAt).setHours(0,0,0,0);
      if (startDate) {
        const start = new Date(startDate).setHours(0,0,0,0);
        if (caseDate < start) return false;
      }
      if (endDate) {
        const end = new Date(endDate).setHours(23,59,59,999);
        if (caseDate > end) return false;
      }
      return true;
    }).sort((a, b) => {
      const timeA = a.closedAt || a.createdAt || 0;
      const timeB = b.closedAt || b.createdAt || 0;
      return timeB - timeA;
    });
  }, [emergencies, typeNameSearch, statusFilter, creatorFilter, closerFilter, startDate, endDate, users]);

  return (
    <div className="space-y-6 max-w-full overflow-hidden pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-4 dark:border-gray-700 px-2 sm:px-0">
        <h2 className="text-xl sm:text-2xl font-black text-gray-800 dark:text-white flex items-center gap-2">
          <FileText size={24} className="text-primary" /> {t('status_reports')}
        </h2>
        <div className="flex gap-2 w-full md:w-auto no-print">
            <Button variant="outline" onClick={handlePrint} className="rounded-xl flex-1 md:flex-none">
                <Printer size={16} className="mr-2" /> {t('print')}
            </Button>
            <Button variant="outline" onClick={() => navigate('/admin')} className="rounded-xl flex-1 md:flex-none">
                <ArrowLeft size={16} className="mr-2 rtl:rotate-180" /> {t('back')}
            </Button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[2.5rem] shadow-sm border border-gray-50 dark:border-gray-700 space-y-4 mx-2 sm:mx-0 no-print">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2 flex items-center gap-1"><Search size={10}/> بحث باسم الحالة</label>
                  <input 
                    type="text" 
                    value={typeNameSearch} 
                    onChange={(e) => setTypeNameSearch(e.target.value)} 
                    placeholder="مثلاً: حريق، تسريب..." 
                    className="w-full p-3 bg-gray-50 dark:bg-gray-900 border-none rounded-2xl dark:text-white outline-none text-sm font-bold shadow-inner" 
                  />
              </div>
              <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2 flex items-center gap-1"><Filter size={10}/> فلترة الحالة</label>
                  <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full p-3 bg-gray-50 dark:bg-gray-900 border-none rounded-2xl dark:text-white outline-none text-sm font-bold shadow-inner">
                      <option value="all">الكل</option>
                      <option value="closed">مغلقة فقط</option>
                      <option value="active">نشطة فقط</option>
                  </select>
              </div>
              <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2 flex items-center gap-1"><Calendar size={10}/> من تاريخ</label>
                  <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full p-3 bg-gray-50 dark:bg-gray-900 border-none rounded-2xl dark:text-white text-xs font-bold shadow-inner" />
              </div>
              <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2 flex items-center gap-1"><Calendar size={10}/> إلى تاريخ</label>
                  <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full p-3 bg-gray-50 dark:bg-gray-900 border-none rounded-2xl dark:text-white text-xs font-bold shadow-inner" />
              </div>
          </div>
      </div>

      <div id="reports-table-container" className="bg-white dark:bg-gray-800 rounded-[1.5rem] sm:rounded-[2.5rem] shadow-sm border border-gray-50 dark:border-gray-700 overflow-hidden mx-2 sm:mx-0">
         <div className="overflow-x-auto">
             <table className="min-w-full divide-y divide-gray-50 dark:divide-gray-700">
                 <thead className="bg-gray-50/50 dark:bg-gray-900/50">
                     <tr>
                         <th className="px-4 sm:px-6 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">نوع الطوارئ</th>
                         <th className="px-4 sm:px-6 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">غير المعنيين</th>
                         <th className="px-4 sm:px-6 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">أغلق بواسطة</th>
                         <th className="px-4 sm:px-6 py-4 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest no-print">Replay</th>
                     </tr>
                 </thead>
                 <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-50 dark:divide-gray-700">
                     {filteredCases.map(c => (
                         <tr key={c.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors">
                             <td className="px-4 sm:px-6 py-5 whitespace-nowrap">
                                <div className="text-sm font-black dark:text-white">{c.typeName}</div>
                                <div className="text-[10px] text-gray-400 font-bold uppercase">{c.locationName}</div>
                                <div className="text-[9px] text-primary font-mono mt-1">{new Date(c.createdAt).toLocaleDateString()}</div>
                             </td>
                             <td className="px-4 sm:px-6 py-5 whitespace-nowrap">
                                <div className="flex items-center gap-2">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${c.dismissedBy?.length ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-400'}`}>
                                        <Users size={14} className="mr-1"/> {c.dismissedBy?.length || 0}
                                    </div>
                                    <span className="text-[10px] text-gray-400 font-bold">فرد</span>
                                </div>
                             </td>
                             <td className="px-4 sm:px-6 py-5 whitespace-nowrap">
                                {c.status === 'closed' ? (
                                    <div className="flex items-center gap-2">
                                        <div className="w-7 h-7 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-600 flex items-center justify-center font-black text-[10px] uppercase">{getUserName(c.closedBy)?.charAt(0)}</div>
                                        <span className="text-xs font-bold dark:text-gray-300">{getUserName(c.closedBy)}</span>
                                    </div>
                                ) : (
                                    <span className="text-[10px] font-black text-red-500 uppercase animate-pulse">نشطة حالياً</span>
                                )}
                             </td>
                             <td className="px-4 sm:px-6 py-5 whitespace-nowrap text-center no-print">
                                 <button 
                                    onClick={() => navigate(`/admin/playback/${c.id}`)}
                                    className="p-2 sm:p-2.5 bg-primary text-white rounded-xl hover:scale-105 transition-all text-[10px] font-black shadow-lg shadow-primary/20"
                                 >
                                     <RotateCcw size={14}/>
                                 </button>
                             </td>
                         </tr>
                     ))}
                     {filteredCases.length === 0 && (
                        <tr>
                            <td colSpan={4} className="p-10 text-center text-gray-400 font-bold italic text-xs">لا توجد بلاغات تطابق معايير البحث</td>
                        </tr>
                     )}
                 </tbody>
             </table>
         </div>
      </div>
    </div>
  );
};

export default CaseReports;
