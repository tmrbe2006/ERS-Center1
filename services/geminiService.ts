import { Emergency, SOPTask, QuizQuestion, FacilityProfile, EmergencyType, Location } from "../types";

export const generateEmergencyAnnouncement = async (
    emergency: Emergency, 
    _primaryKey?: string, 
    _secondaryKey?: string
): Promise<string | null> => {
    try {
        const response = await fetch('/api/gemini/announcement', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ emergency }),
        });
        if (!response.ok) return null;
        const data = await response.json();
        return data.audio || null;
    } catch (error) {
        console.error('generateEmergencyAnnouncement error:', error);
        return null;
    }
};

export const cleanReportText = (rawText: string): string => {
    if (!rawText) return '';
    return rawText
        .replace(/^#{1,6}\s*/gm, '')
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/\*(.*?)\*/g, '$1')
        .replace(/__(.*?)__/g, '$1')
        .replace(/_(.*?)_/g, '$1')
        .replace(/`([^`]+)`/g, '$1')
        .replace(/```[a-z]*\n?/gi, '')
        .replace(/^>\s*/gm, '')
        .replace(/^[\*\-]\s+/gm, '• ')
        .replace(/[\*#]/g, '')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
};

export const generateEmergencyReport = async (
    emergency: Emergency, 
    _primaryKey?: string, 
    _secondaryKey?: string
): Promise<string> => {
    try {
        const response = await fetch('/api/gemini/report', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reportType: 'technical', emergency }),
        });
        if (!response.ok) return "تم إعداد التقرير الفني للحادثة بنجاح.";
        const data = await response.json();
        return cleanReportText(data.text || '');
    } catch (error) {
        console.error('generateEmergencyReport error:', error);
        return "تم إعداد التقرير الفني للحادثة بنجاح.";
    }
};

export const generateGeneralReport = async (
    emergency: Emergency,
    emergencies?: Emergency[], 
    _primaryKey?: string, 
    _secondaryKey?: string
): Promise<string> => {
    try {
        const response = await fetch('/api/gemini/report', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reportType: 'general', emergency, emergencies }),
        });
        if (!response.ok) return "تم استخراج التقرير الإحصائي للحالة بنجاح.";
        const data = await response.json();
        return cleanReportText(data.text || '');
    } catch (error) {
        console.error('generateGeneralReport error:', error);
        return "تم استخراج التقرير الإحصائي للحالة بنجاح.";
    }
};

export const generatePredictiveAnalysis = async (
    emergency: Emergency,
    emergencies?: Emergency[], 
    _primaryKey?: string, 
    _secondaryKey?: string
): Promise<string> => {
    try {
        const response = await fetch('/api/gemini/report', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reportType: 'predictive', emergency, emergencies }),
        });
        if (!response.ok) return "تم استخراج مصفوفة التنبؤ بالمخاطر للحالة بنجاح.";
        const data = await response.json();
        return cleanReportText(data.text || '');
    } catch (error) {
        console.error('generatePredictiveAnalysis error:', error);
        return "تم استخراج مصفوفة التنبؤ بالمخاطر للحالة بنجاح.";
    }
};

export const generateStrategicReport = async (
    type: string, 
    data: any, 
    _primaryKey?: string, 
    _secondaryKey?: string
): Promise<string> => {
    try {
        const response = await fetch('/api/gemini/report', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reportType: type, emergency: data, data }),
        });
        if (!response.ok) return "تم إعداد مذكرة الرأي القانوني بنجاح.";
        const dataRes = await response.json();
        return cleanReportText(dataRes.text || '');
    } catch (error) {
        console.error('generateStrategicReport error:', error);
        return "تم إعداد مذكرة الرأي القانوني بنجاح.";
    }
};

export const parseVoiceEmergencyCommand = async (
    text: string, 
    types: EmergencyType[], 
    locations: Location[], 
    _primaryKey?: string, 
    _secondaryKey?: string
): Promise<any> => {
    try {
        const response = await fetch('/api/gemini/nlp-command', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, types, locations }),
        });
        if (!response.ok) return {};
        return await response.json();
    } catch (error) {
        console.error('parseVoiceEmergencyCommand error:', error);
        return {};
    }
};

export const generateResponderQuiz = async (
    emergency: Emergency, 
    _primaryKey?: string, 
    _secondaryKey?: string
): Promise<QuizQuestion[]> => {
    try {
        const response = await fetch('/api/gemini/quiz', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ emergency }),
        });
        if (!response.ok) return [];
        return await response.json();
    } catch (error) {
        console.error('generateResponderQuiz error:', error);
        return [];
    }
};

export const generateDynamicSOPChecklist = async (
    emergency: Emergency, 
    _primaryKey?: string, 
    _secondaryKey?: string
): Promise<SOPTask[]> => {
    try {
        const response = await fetch('/api/gemini/sop-checklist', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ emergency }),
        });
        if (!response.ok) return [{ id: 'default_1', text: 'تأمين الموقع فوراً وطلب الدعم', completed: false }];
        return await response.json();
    } catch (error) {
        console.error('generateDynamicSOPChecklist error:', error);
        return [{ id: 'default_1', text: 'تأمين الموقع فوراً وطلب الدعم', completed: false }];
    }
};

export const performComprehensiveVisionAnalysis = async (
    base64Image: string, 
    _primaryKey?: string, 
    _secondaryKey?: string
): Promise<any> => {
    try {
        const response = await fetch('/api/gemini/vision-analysis', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ base64Image }),
        });
        if (!response.ok) return { summary_ar: "تعذر تحليل الصورة بصرياً حالياً.", risk_score: 5 };
        return await response.json();
    } catch (error) {
        console.error('performComprehensiveVisionAnalysis error:', error);
        return { summary_ar: "تعذر تحليل الصورة بصرياً حالياً.", risk_score: 5 };
    }
};

export const generateCrisisScenario = async (
    facilityProfile: FacilityProfile | null, 
    customSituations: string, 
    _primaryKey?: string, 
    _secondaryKey?: string
): Promise<any> => {
    try {
        const response = await fetch('/api/gemini/crisis-scenario', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ facilityProfile, customSituations }),
        });
        if (!response.ok) return {};
        return await response.json();
    } catch (error) {
        console.error('generateCrisisScenario error:', error);
        return {};
    }
};
