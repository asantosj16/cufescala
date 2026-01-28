
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  addMonths, 
  subMonths, 
  getDay,
  parseISO,
  getISOWeek
} from 'date-fns';
import { pt } from 'date-fns/locale';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Trash2, 
  AlertTriangle, 
  Star, 
  Upload, 
  Database, 
  Save, 
  RefreshCw, 
  Moon, 
  Sun, 
  Printer, 
  Settings, 
  X, 
  FileSpreadsheet,
  Clock,
  TrendingUp,
  UserCheck
} from 'lucide-react';

import { ShiftType, StaffName, CustomOverrides, RotationType, StaffConfig, OffDayGroup } from './types';
import { STAFF_LIST, SHIFT_DETAILS } from './constants';
import { generateSchedule } from './services/schedulerEngine';
import { ShiftBadge } from './components/ShiftBadge';
import { InfoSchedule } from './components/InfoSchedule';
import { AlertsLegend } from './components/AlertsLegend';
import { WeeklyAlertsPanel } from './components/WeeklyAlertsPanel';
import { storage } from './services/storageService';

const DEFAULT_CONFIGS: Record<StaffName, StaffConfig> = {
  'Cláudia': { rotation: RotationType.ALTERNATING, offDayGroup: 'DS1', startShift: ShiftType.T6 },
  'Irene': { rotation: RotationType.ALTERNATING, offDayGroup: 'DS2', startShift: ShiftType.M56 },
  'Licínia': { rotation: RotationType.WEEKEND_COVER, offDayGroup: 'CUSTOM', startShift: ShiftType.M56 },
};

// Limites de horas semanais
const WEEKLY_HOUR_LIMITS: Record<StaffName, number> = {
  'Cláudia': 40,
  'Irene': 40,
  'Licínia': 20,
};

const weekdayNamesShort = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const App: React.FC = () => {
  // Inicializa em Fevereiro de 2026
  const [currentDate, setCurrentDate] = useState(new Date(2026, 1, 1)); 
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('cuf-theme') !== 'light');
  const [showSettings, setShowSettings] = useState(false);
  
  const [configs, setConfigs] = useState<Record<StaffName, StaffConfig>>(() => {
    try {
      const saved = localStorage.getItem('cuf-roster-configs');
      return saved ? JSON.parse(saved) : DEFAULT_CONFIGS;
    } catch { return DEFAULT_CONFIGS; }
  });

  const [overrides, setOverrides] = useState<CustomOverrides>(() => {
    try {
      const saved = localStorage.getItem('cuf-overrides-v3');
      return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  });
  
  const [holidays, setHolidays] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('cuf-holidays-v3');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const [editingShift, setEditingShift] = useState<{ staff: StaffName, date: string } | null>(null);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'idle'>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('cuf-theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  useEffect(() => {
    setSaveStatus('saving');
    const timeout = setTimeout(() => {
      Promise.all([
        storage.saveData('cuf-overrides-v3', overrides),
        storage.saveData('cuf-holidays-v3', holidays),
        storage.saveData('cuf-roster-configs', configs),
      ]).then(() => {
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      }).catch(err => {
        console.error('Erro ao salvar dados:', err);
        setSaveStatus('idle');
      });
    }, 300); // Debounce de 300ms para evitar salvar a cada mudança
    
    return () => clearTimeout(timeout);
  }, [overrides, holidays, configs]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthShifts = useMemo(() => {
    const baseShifts = generateSchedule(year, month, overrides, configs);
    return baseShifts.map(s => {
      if (holidays.includes(s.date)) return { ...s, shift: ShiftType.FP };
      return s;
    });
  }, [year, month, overrides, holidays, configs]);

  const monthDays = useMemo(() => eachDayOfInterval({
    start: startOfMonth(currentDate),
    end: endOfMonth(currentDate),
  }), [currentDate]);

  const conflicts = useMemo(() => {
    const alerts: Record<string, { message: string, details: string }> = {};
    STAFF_LIST.forEach(staff => {
      const weeklyData: Record<number, { hours: number, dates: string[] }> = {};
      monthShifts.filter(s => s.staffId === staff).forEach(s => {
        const d = parseISO(s.date);
        const week = getISOWeek(d);
        if (!weeklyData[week]) weeklyData[week] = { hours: 0, dates: [] };
        weeklyData[week].hours += SHIFT_DETAILS[s.shift]?.hours || 0;
        weeklyData[week].dates.push(format(d, 'dd/MM'));
      });

      Object.entries(weeklyData).forEach(([week, data]) => {
        const limit = WEEKLY_HOUR_LIMITS[staff];
        if (data.hours > limit) {
          const conflictInfo = {
            message: `Semana ${week}: ${data.hours}h/${limit}h`,
            details: `Excesso de ${data.hours - limit}h na semana ${week}.`
          };
          monthShifts
            .filter(s => s.staffId === staff && getISOWeek(parseISO(s.date)) === Number(week))
            .forEach(s => {
              alerts[`${staff}-${s.date}`] = conflictInfo;
            });
        }
      });
    });
    return alerts;
  }, [monthShifts]);

  const getStaffShift = (staff: StaffName, date: string) => 
    monthShifts.find(s => s.staffId === staff && s.date === date)?.shift || ShiftType.DS;

  const calculateActualHours = (staff: StaffName): number => 
    monthShifts.filter(s => s.staffId === staff).reduce((acc, curr) => {
      // Conta apenas turnos reais trabalhados (ignora férias, feriados e descansos)
      if (curr.shift === ShiftType.F || curr.shift === ShiftType.FP || curr.shift === ShiftType.DS) {
        return acc;
      }
      return acc + (SHIFT_DETAILS[curr.shift]?.hours || 0);
    }, 0);

  const calculateTargetHours = (staff: StaffName): number => {
    // Calcula horas esperadas: número de dias úteis (excluindo domingos, sábados, feriados) x 8h/dia
    let targetHours = 0;
    let workDays = 0;
    
    monthDays.forEach(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const dayOfWeek = getDay(day);
      
      // Pula finais de semana e feriados públicos
      if ([0, 6].includes(dayOfWeek) || holidays.includes(dateStr)) {
        return;
      }
      
      workDays++;
    });
    
    // Horas base por tipo de staff: Licínia trabalha 20h/semana, outros 40h/semana
    if (staff === 'Licínia') {
      // Licínia: 5h dia (trabalha Sexta a Segunda)
      // Conta aproximadamente 4 dias por semana
      targetHours = Math.round((workDays / 5) * 20); // 20 horas por semana, 5 dias úteis
    } else {
      // Cláudia e Irene: 8h dia (segunda a sexta)
      targetHours = workDays * 8;
    }
    
    return targetHours;
  };

  const calculateYearlyBalance = (staff: StaffName) => {
    const actual = calculateActualHours(staff);
    const target = calculateTargetHours(staff);
    return actual - target;
  };

  const calculateYearlyActualHours = (staff: StaffName): number => {
    let totalHours = 0;
    // Calcula horas reais trabalhadas de janeiro a dezembro
    for (let m = 0; m < 12; m++) {
      const baseShifts = generateSchedule(year, m, overrides, configs);
      const monthlyShifts = baseShifts.map(s => {
        const dateStr = s.date;
        if (holidays.includes(dateStr)) return { ...s, shift: ShiftType.FP };
        return s;
      });
      
      totalHours += monthlyShifts
        .filter(s => s.staffId === staff)
        .filter(s => s.shift !== ShiftType.F && s.shift !== ShiftType.FP && s.shift !== ShiftType.DS)
        .reduce((acc, curr) => acc + (SHIFT_DETAILS[curr.shift]?.hours || 0), 0);
    }
    return totalHours;
  };

  const calculateYearlyTargetHours = (staff: StaffName): number => {
    let totalHours = 0;
    // Calcula horas esperadas de janeiro a dezembro
    for (let m = 0; m < 12; m++) {
      const monthStart = new Date(year, m, 1);
      const monthEnd = endOfMonth(monthStart);
      const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
      
      let workDays = 0;
      days.forEach(day => {
        const dateStr = format(day, 'yyyy-MM-dd');
        const dayOfWeek = getDay(day);
        if (![0, 6].includes(dayOfWeek) && !holidays.includes(dateStr)) {
          workDays++;
        }
      });
      
      if (staff === 'Licínia') {
        totalHours += Math.round((workDays / 5) * 20);
      } else {
        totalHours += workDays * 8;
      }
    }
    return totalHours;
  };

  const getStaffBalance = () => {
    return STAFF_LIST.map(staff => ({
      name: staff,
      actual: calculateYearlyActualHours(staff),
      target: calculateYearlyTargetHours(staff),
      balance: calculateYearlyActualHours(staff) - calculateYearlyTargetHours(staff),
    }));
  };

  const exportCSV = () => {
    const csvRows = [["Funcionária", "Data", "Tipo de Turno/Ausência", "Horas"]];
    monthShifts.forEach(s => {
      csvRows.push([s.staffId, s.date, SHIFT_DETAILS[s.shift].label, SHIFT_DETAILS[s.shift].hours.toString()]);
    });
    const csvContent = "data:text/csv;charset=utf-8," + csvRows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `escala-cuf-${format(currentDate, 'yyyy-MM')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportJSON = async () => {
    try {
      const jsonData = await storage.exportAllData();
      const link = document.createElement("a");
      link.setAttribute("href", `data:application/json;charset=utf-8,${encodeURIComponent(jsonData)}`);
      link.setAttribute("download", `escala-cuf-backup-${format(new Date(), 'yyyy-MM-dd-HHmmss')}.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      alert('Erro ao exportar dados JSON.');
    }
  };

  const resetRotation = () => {
    if (window.confirm('Reativar rotação automática para este mês? Isto removerá os ajustes manuais de TODAS as funcionárias em ' + format(currentDate, 'MMMM', { locale: pt }) + '.')) {
      const newOverrides = { ...overrides };
      const startStr = format(startOfMonth(currentDate), 'yyyy-MM-dd');
      const endStr = format(endOfMonth(currentDate), 'yyyy-MM-dd');
      
      Object.keys(newOverrides).forEach(key => {
        const [, date] = key.split('-');
        if (date >= startStr && date <= endStr) {
          delete newOverrides[key];
        }
      });
      setOverrides(newOverrides);
    }
  };

  const resetIndividualRotation = (staff: StaffName) => {
    if (window.confirm(`Deseja reativar a rotação automática para ${staff} em todos os meses? Todos os ajustes manuais desta funcionária serão apagados.`)) {
      const newOverrides = { ...overrides };
      Object.keys(newOverrides).forEach(key => {
        if (key.startsWith(`${staff}-`)) {
          delete newOverrides[key];
        }
      });
      setOverrides(newOverrides);
    }
  };

  const manualSave = async () => {
    setSaveStatus('saving');
    try {
      await Promise.all([
        storage.saveData('cuf-overrides-v3', overrides),
        storage.saveData('cuf-holidays-v3', holidays),
        storage.saveData('cuf-roster-configs', configs),
      ]);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (err) {
      console.error('Erro ao salvar dados:', err);
      setSaveStatus('idle');
    }
  };

  const clearAllOverrides = () => {
    if (window.confirm('Deseja REATIVAR A ROTAÇÃO GLOBAL? Esta ação apagará TODOS os ajustes manuais de TODOS os meses para TODAS as funcionárias.')) {
      setOverrides({});
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      <header className={`sticky top-0 z-40 border-b backdrop-blur-md px-4 py-4 md:px-8 print:hidden ${darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white/80 border-slate-200'}`}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-xl text-white shadow-lg shrink-0"><CalendarIcon size={24} /></div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-black tracking-tight truncate">Escala CUF Trindade</h1>
                {saveStatus === 'saving' && (
                  <span className="hidden sm:inline-flex items-center gap-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-tight">
                    <span className="inline-block w-2 h-2 bg-blue-600 rounded-full animate-pulse"></span>
                    Sincronizando...
                  </span>
                )}
                {saveStatus === 'saved' && (
                  <span className="hidden sm:inline-flex items-center gap-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-tight">
                    <span className="inline-block w-2 h-2 bg-emerald-600 rounded-full"></span>
                    Salvo
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest truncate">Gestão Operacional • 2026</p>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-3 w-full md:w-auto justify-between md:justify-end">
            <div className={`flex items-center gap-1 p-1 rounded-xl border flex-1 md:flex-none ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-100 border-slate-200'}`}>
              <button onClick={() => setCurrentDate(subMonths(currentDate, 1))} className="p-2 hover:bg-blue-600 hover:text-white rounded-lg transition-all" disabled={currentDate <= new Date(2026, 0, 1)}><ChevronLeft size={16} /></button>
              <div className="px-2 sm:px-4 font-black text-xs sm:text-sm flex-1 min-w-[100px] sm:min-w-[140px] text-center capitalize">{format(currentDate, 'MMMM yyyy', { locale: pt })}</div>
              <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="p-2 hover:bg-blue-600 hover:text-white rounded-lg transition-all" disabled={currentDate >= new Date(2026, 11, 1)}><ChevronRight size={16} /></button>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setShowSettings(true)} className={`p-2.5 rounded-xl border transition-all ${darkMode ? 'bg-slate-800 border-slate-700 hover:bg-slate-700' : 'bg-white border-slate-200 hover:bg-slate-50 shadow-sm'}`} title="Configurações">
                <Settings size={20} />
              </button>
              <button onClick={() => setDarkMode(!darkMode)} className={`p-2.5 rounded-xl border transition-all ${darkMode ? 'bg-slate-800 border-slate-700 text-yellow-400 hover:bg-slate-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 shadow-sm'}`}>
                {darkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-4 md:py-6 md:px-8 space-y-6 md:space-y-8">
        
        {/* Título Visível na Impressão - Qualidade HD */}
        <div className="hidden print:block text-center mb-8 border-b-2 border-slate-900 pb-6">
          <div className="flex items-center justify-center gap-4 mb-2">
             <div className="bg-slate-900 text-white p-2 rounded-lg font-black text-xl">CUF</div>
             <h1 className="text-3xl font-black uppercase tracking-[0.2em] text-slate-900">Escala de Serviço • Unidade Trindade</h1>
          </div>
          <p className="text-xl font-bold text-slate-700 capitalize">{format(currentDate, 'MMMM yyyy', { locale: pt })}</p>
          <div className="mt-4 flex justify-center gap-12 text-sm font-bold text-slate-500 uppercase tracking-widest">
            <span>Emitido em: {format(new Date(), "dd/MM/yyyy 'às' HH:mm")}</span>
            <span>Versão HD 4.5</span>
          </div>
        </div>

        {/* Painel de Controle */}
        <section className={`p-4 md:p-6 rounded-[2rem] border flex flex-col gap-4 md:gap-6 print:hidden ${darkMode ? 'bg-slate-900 border-slate-800 shadow-2xl' : 'bg-white border-slate-200 shadow-xl shadow-slate-200/50'}`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4 md:pb-6">
            <div className="flex items-center gap-4">
              <div className="p-2.5 bg-blue-500/10 rounded-2xl text-blue-500"><Database size={20} /></div>
              <div>
                <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Dados & Escala</h2>
                <p className="text-[10px] font-bold text-slate-500 hidden sm:block">Ações de sistema e relatórios</p>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
              <button onClick={manualSave} className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-[11px] font-black transition-all flex items-center justify-center gap-2 shadow-lg hover:scale-105 active:scale-95 ${darkMode ? 'bg-emerald-600 text-white hover:bg-emerald-500' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}>
                <Save size={14} /> SALVAR
              </button>
              <button onClick={() => window.print()} className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl text-[11px] font-black transition-all flex items-center justify-center gap-2 shadow-lg hover:scale-105 active:scale-95 ${darkMode ? 'bg-indigo-600 text-white hover:bg-indigo-500' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}>
                <Printer size={14} /> IMPRIMIR HD
              </button>
              <button onClick={clearAllOverrides} className={`px-4 py-2.5 rounded-xl text-[11px] font-black transition-all flex items-center justify-center gap-2 border hover:scale-105 active:scale-95 ${darkMode ? 'bg-rose-950/30 text-rose-400 border-rose-500/20 hover:bg-rose-600 hover:text-white' : 'bg-rose-50 text-rose-700 border-rose-100 hover:bg-rose-600 hover:text-white'}`}>
                <Trash2 size={14} /> REATIVAR TUDO
              </button>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <button onClick={resetRotation} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1.5 border ${darkMode ? 'bg-blue-900/20 border-blue-800 text-blue-400' : 'bg-blue-50 border-blue-100 text-blue-700 hover:bg-blue-100'}`}>
              <RefreshCw size={12} /> REATIVAR ROTAÇÃO (MÊS)
            </button>
            <button onClick={exportCSV} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1.5 border ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'}`}>
              <FileSpreadsheet size={12} /> CSV
            </button>
            <button onClick={exportJSON} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1.5 border ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'}`}>
              <Database size={12} /> BACKUP JSON
            </button>
            <button onClick={() => fileInputRef.current?.click()} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1.5 border ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'}`}>
              <Upload size={12} /> RESTAURAR JSON
            </button>
            <input type="file" ref={fileInputRef} onChange={async (e) => {
               const file = e.target.files?.[0];
               if (file) {
                 const reader = new FileReader();
                 reader.onload = async (ev) => {
                   try {
                     const data = JSON.parse(ev.target?.result as string);
                     if (data.overrides) {
                       setOverrides(data.overrides);
                       await storage.saveData('cuf-overrides-v3', data.overrides);
                     }
                     if (data.holidays) {
                       setHolidays(data.holidays);
                       await storage.saveData('cuf-holidays-v3', data.holidays);
                     }
                     if (data.configs) {
                       setConfigs(data.configs);
                       await storage.saveData('cuf-roster-configs', data.configs);
                     }
                     setSaveStatus('saved');
                     setTimeout(() => setSaveStatus('idle'), 2000);
                     alert('Dados restaurados com sucesso!');
                   } catch (err) {
                     alert('Erro ao carregar ficheiro JSON.');
                   }
                 };
                 reader.readAsText(file);
               }
            }} className="hidden" accept=".json" />
          </div>
        </section>

        {/* Informações de Funcionárias, Horários e Folgas */}
        <InfoSchedule darkMode={darkMode} staffBalance={getStaffBalance()} />

        {/* Legenda de Turnos e Horários Semanais */}
        <AlertsLegend darkMode={darkMode} />

        {/* Resumo de Horas & Saldo - Responsivo e HD */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {STAFF_LIST.map(staff => {
            const actual = calculateActualHours(staff);
            const target = calculateTargetHours(staff);
            const balance = actual - target;
            const isPos = balance > 0;
            const isNeg = balance < 0;

            return (
              <div key={staff} className={`group relative p-5 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 print:shadow-none print:border-slate-300 print:rounded-xl print:p-6 ${darkMode ? 'bg-slate-900 border-slate-800 shadow-xl' : 'bg-white border-slate-100 shadow-lg shadow-slate-200/40'}`}>
                <div className="flex items-center justify-between mb-4 md:mb-8">
                  <div className="flex items-center gap-3 md:gap-5">
                    <div className="w-10 h-10 md:w-14 md:h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 text-white flex items-center justify-center font-black text-lg md:text-2xl shadow-lg print:shadow-none print:from-slate-700 print:to-slate-800">{staff.charAt(0)}</div>
                    <div>
                      <h3 className="font-black text-base md:text-xl tracking-tight">{staff}</h3>
                      <p className="text-[8px] md:text-[10px] opacity-40 font-black uppercase tracking-[0.15em]">{configs[staff].rotation}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center justify-end gap-1.5 text-blue-500 print:text-slate-800">
                      <Clock size={14} className="md:w-[18px] md:h-[18px]" />
                      <span className="text-xl md:text-3xl font-black tabular-nums">{actual}</span>
                    </div>
                    <div className="text-[8px] md:text-[10px] font-black opacity-30 uppercase tracking-[0.15em]">Horas Efetivadas</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5 md:gap-4">
                  <div className={`p-2.5 md:p-4 rounded-2xl md:rounded-3xl border flex flex-col items-center justify-center ${darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-100'} print:bg-white print:border-slate-300`}>
                    <p className="text-[7px] md:text-[9px] font-black opacity-40 uppercase tracking-widest mb-0.5 md:mb-1.5">Meta Esperada</p>
                    <p className="font-black text-xs md:text-base">{target}</p>
                    <p className="text-[6px] md:text-[8px] font-bold opacity-50 mt-1">horas</p>
                  </div>
                  
                  <div className={`p-2.5 md:p-4 rounded-2xl md:rounded-3xl border-2 flex flex-col items-center justify-center transition-all ${
                    isPos ? (darkMode ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-700') :
                    isNeg ? (darkMode ? 'bg-rose-950/30 border-rose-500/40 text-rose-400' : 'bg-rose-50 border-rose-200 text-rose-700') :
                    (darkMode ? 'bg-slate-800/50 border-slate-700 text-slate-400' : 'bg-slate-50 border-slate-100 text-slate-500')
                  } print:bg-white print:border-slate-400 print:text-slate-900`}>
                    <div className="flex items-center gap-1 mb-1 md:mb-2">
                      <TrendingUp size={8} className="opacity-60 md:w-[10px] md:h-[10px]" />
                      <p className="text-[7px] md:text-[9px] font-black uppercase tracking-widest opacity-80">Saldo</p>
                    </div>
                    <div className="flex items-baseline gap-1 mb-1">
                      <p className="font-black text-sm md:text-lg tabular-nums leading-none">
                        {balance === 0 ? '0' : isPos ? `+${balance}` : balance}
                      </p>
                      <p className="text-[7px] md:text-[9px] font-bold opacity-70">h</p>
                    </div>
                    <p className="text-[7px] md:text-[8px] font-bold opacity-60">
                      {isPos ? 'Excesso' : isNeg ? 'Falta' : 'Equilibrado'}
                    </p>
                  </div>
                </div>

                <div className="mt-4 md:mt-6 w-full h-1 md:h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden print:hidden">
                   <div 
                     className={`h-full transition-all duration-700 ease-out rounded-full ${isPos ? 'bg-emerald-500' : isNeg ? 'bg-rose-500' : 'bg-blue-500'}`}
                     style={{ width: `${Math.min(Math.max((actual / (target || 1)) * 100, 0), 100)}%` }}
                   />
                </div>
              </div>
            );
          })}
        </section>

        {/* Tabela de Escala */}
        <div className={`relative overflow-hidden rounded-[1.5rem] md:rounded-[2.5rem] border shadow-2xl transition-all print:shadow-none print:border-slate-300 print:rounded-none ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
          <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-black/5 dark:from-white/5 pointer-events-none z-10 sm:hidden"></div>
          
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full border-collapse min-w-[1000px] md:min-w-[1400px]">
              <thead>
                <tr className={`border-b ${darkMode ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                  <th className={`sticky left-0 z-30 p-4 md:p-6 text-left font-black border-r text-[9px] md:text-xs uppercase tracking-[0.2em] shadow-xl md:shadow-none ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200'} print:bg-white print:border-slate-300 print:shadow-none`}>Funcionária</th>
                  {monthDays.map(day => {
                    const dateStr = format(day, 'yyyy-MM-dd');
                    const isWeekend = [0, 6].includes(getDay(day));
                    const isHoliday = holidays.includes(dateStr);
                    return (
                      <th key={dateStr} className={`p-2 md:p-4 text-center border-r min-w-[60px] md:min-w-[85px] relative transition-colors ${isHoliday ? 'bg-amber-500/20' : isWeekend ? (darkMode ? 'bg-slate-800/40' : 'bg-slate-100/50') : ''} ${darkMode ? 'border-slate-700' : 'border-slate-200'} print:bg-white print:border-slate-200`}>
                        <button onClick={() => setHolidays(prev => prev.includes(dateStr) ? prev.filter(d => d !== dateStr) : [...prev, dateStr])} className={`absolute top-1 right-1 md:top-2 md:right-2 transition-all print:hidden ${isHoliday ? 'text-amber-500 scale-110' : 'text-slate-300 opacity-20 hover:opacity-100'}`}><Star size={10} fill={isHoliday ? "currentColor" : "none"} /></button>
                        <div className={`text-[7px] md:text-[10px] font-black uppercase tracking-widest ${isHoliday ? 'text-amber-500' : 'opacity-40'}`}>{weekdayNamesShort[getDay(day)]}</div>
                        <div className={`text-xs md:text-lg font-black ${isHoliday ? 'text-amber-600' : ''}`}>{format(day, 'd')}</div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {STAFF_LIST.map((staff) => (
                  <tr key={staff} className={`border-b group transition-colors ${darkMode ? 'border-slate-800 hover:bg-slate-800/40' : 'border-slate-100 hover:bg-slate-50/60'}`}>
                    <td className={`sticky left-0 z-20 p-4 md:p-6 border-r shadow-2xl font-black text-[11px] md:text-sm ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} print:bg-white print:border-slate-300 print:shadow-none`}>{staff}</td>
                    {monthDays.map(day => {
                      const dateStr = format(day, 'yyyy-MM-dd');
                      const shift = getStaffShift(staff, dateStr);
                      const isHoliday = holidays.includes(dateStr);
                      const isManual = !!overrides[`${staff}-${dateStr}`];
                      const conflict = conflicts[`${staff}-${dateStr}`];
                      return (
                        <td key={dateStr} className={`p-1.5 md:p-3 border-r text-center ${isHoliday ? 'bg-amber-500/5' : ''} ${darkMode ? 'border-slate-800' : 'border-slate-100'} print:border-slate-200`}>
                          <div className="flex flex-col items-center justify-center min-h-[50px] md:min-h-[70px] relative">
                            <ShiftBadge 
                              shift={shift} 
                              onClick={() => setEditingShift({ staff, date: dateStr })} 
                              className={`print:border-slate-400 print:text-slate-900 print:bg-white ${isManual ? 'ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-slate-900 shadow-xl scale-110 z-10' : ''}`} 
                            />
                            {isManual && <div className="absolute -bottom-2 w-1.5 h-1.5 bg-blue-500 rounded-full shadow-lg print:hidden" />}
                            {conflict && (
                              <div 
                                className="absolute -top-1 -right-1 md:-top-2 md:-right-2 text-rose-500 animate-pulse cursor-help z-20 p-1 bg-white dark:bg-slate-900 rounded-full shadow-xl border border-rose-100 print:hidden" 
                                title={`${conflict.message}\n${conflict.details}`}
                              >
                                <AlertTriangle size={12} className="md:w-[16px] md:h-[16px]" />
                              </div>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Configurações Modais */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-300">
          <div className={`w-full max-w-2xl rounded-[2rem] sm:rounded-[2.5rem] shadow-[0_0_50px_rgba(0,0,0,0.3)] overflow-hidden border flex flex-col max-h-[90vh] ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
            <div className={`p-5 md:p-8 flex items-center justify-between border-b shrink-0 ${darkMode ? 'border-slate-800' : 'border-slate-100'}`}>
              <div className="flex items-center gap-3 text-blue-500">
                <div className="p-2.5 bg-blue-500/10 rounded-2xl"><Settings size={24} /></div>
                <div>
                  <h3 className="text-lg md:text-2xl font-black tracking-tight">Definições da Equipa</h3>
                  <p className="text-[9px] font-bold opacity-40 uppercase tracking-widest">Ajustes de rotas e folgas</p>
                </div>
              </div>
              <button onClick={() => setShowSettings(false)} className="p-3 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"><X size={24} /></button>
            </div>
            <div className="p-5 md:p-8 space-y-6 overflow-y-auto custom-scrollbar flex-1">
              {STAFF_LIST.map(staff => (
                <div key={staff} className={`p-4 md:p-6 rounded-[1.5rem] md:rounded-[2rem] border transition-all ${darkMode ? 'border-slate-800 bg-slate-800/40' : 'border-slate-100 bg-slate-50/50'}`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 md:mb-6">
                    <div className="flex items-center gap-3 md:gap-4">
                      <div className="w-8 h-8 md:w-12 md:h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-sm md:text-xl shadow-lg shadow-blue-600/20">{staff.charAt(0)}</div>
                      <h4 className="font-black text-lg md:text-2xl text-blue-500">{staff}</h4>
                    </div>
                    {/* Opção para reativar rotação individual */}
                    <button 
                      onClick={() => resetIndividualRotation(staff)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all border ${darkMode ? 'bg-rose-900/20 border-rose-500/20 text-rose-400 hover:bg-rose-600 hover:text-white' : 'bg-rose-50 border-rose-100 text-rose-700 hover:bg-rose-600 hover:text-white'}`}
                    >
                      <RefreshCw size={10} /> Reativar Rotação Individual
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-5">
                    <div className="space-y-1">
                      <label className="block text-[8px] md:text-[10px] font-black uppercase opacity-40 tracking-[0.15em] ml-2">Rotação</label>
                      <select 
                        value={configs[staff].rotation}
                        onChange={(e) => setConfigs(prev => ({ ...prev, [staff]: { ...prev[staff], rotation: e.target.value as RotationType } }))}
                        className={`w-full p-2.5 md:p-4 rounded-xl md:rounded-2xl border-2 text-[11px] md:text-sm font-bold outline-none focus:ring-4 focus:ring-blue-500/20 transition-all ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}
                      >
                        {Object.values(RotationType).map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[8px] md:text-[10px] font-black uppercase opacity-40 tracking-[0.15em] ml-2">Folgas (DS)</label>
                      <select 
                        value={configs[staff].offDayGroup}
                        onChange={(e) => setConfigs(prev => ({ ...prev, [staff]: { ...prev[staff], offDayGroup: e.target.value as OffDayGroup } }))}
                        className={`w-full p-2.5 md:p-4 rounded-xl md:rounded-2xl border-2 text-[11px] md:text-sm font-bold outline-none focus:ring-4 focus:ring-blue-500/20 transition-all ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}
                      >
                        <option value="DS1">DS1 (Sex+Sab)</option>
                        <option value="DS2">DS2 (Sab+Dom)</option>
                        <option value="DS3">DS3 (Dom+Seg)</option>
                        <option value="CUSTOM">Específico</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[8px] md:text-[10px] font-black uppercase opacity-40 tracking-[0.15em] ml-2">Início</label>
                      <select 
                        value={configs[staff].startShift}
                        disabled={configs[staff].rotation !== RotationType.ALTERNATING}
                        onChange={(e) => setConfigs(prev => ({ ...prev, [staff]: { ...prev[staff], startShift: e.target.value as ShiftType.M56 | ShiftType.T6 } }))}
                        className={`w-full p-2.5 md:p-4 rounded-xl md:rounded-2xl border-2 text-[11px] md:text-sm font-bold outline-none focus:ring-4 focus:ring-blue-500/20 transition-all ${darkMode ? 'bg-slate-800 border-slate-700 disabled:opacity-30' : 'bg-white border-slate-200 disabled:opacity-30'}`}
                      >
                        <option value={ShiftType.M56}>Manhã</option>
                        <option value={ShiftType.T6}>Tarde</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className={`p-5 md:p-8 border-t bg-slate-50/50 dark:bg-slate-950/50 shrink-0 ${darkMode ? 'border-slate-800' : 'border-slate-100'}`}>
              <button onClick={() => setShowSettings(false)} className="w-full py-4 md:py-6 bg-blue-600 text-white font-black rounded-2xl md:rounded-3xl shadow-2xl hover:bg-blue-700 transition-all uppercase tracking-[0.2em] text-[11px] md:text-sm">Aplicar Configurações</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Edição de Turno */}
      {editingShift && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in zoom-in-95 duration-200">
          <div className={`w-full max-w-md rounded-[2.5rem] shadow-[0_0_40px_rgba(0,0,0,0.3)] overflow-hidden border flex flex-col max-h-[90vh] ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
            <div className={`p-5 md:p-8 flex items-center justify-between border-b shrink-0 ${darkMode ? 'border-slate-800' : 'border-slate-100'}`}>
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 md:w-14 md:h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black text-lg md:text-2xl shadow-lg">{editingShift.staff.charAt(0)}</div>
                <div>
                  <h3 className="text-lg md:text-2xl font-black tracking-tight truncate max-w-[150px]">{editingShift.staff}</h3>
                  <p className="text-[9px] md:text-xs font-bold opacity-40 uppercase tracking-widest">{format(parseISO(editingShift.date), "dd 'de' MMMM", { locale: pt })}</p>
                </div>
              </div>
              <button onClick={() => setEditingShift(null)} className="p-3 opacity-50 hover:opacity-100 transition-opacity"><X size={24} /></button>
            </div>
            <div className="p-5 md:p-8 grid grid-cols-2 gap-3 md:gap-4 overflow-y-auto custom-scrollbar">
              {Object.keys(SHIFT_DETAILS).map(key => {
                const sKey = key as ShiftType;
                if (sKey === ShiftType.FP) return null;
                const isSel = getStaffShift(editingShift.staff, editingShift.date) === sKey;
                return (
                  <button key={key} onClick={() => { setOverrides(prev => ({ ...prev, [`${editingShift.staff}-${editingShift.date}`]: sKey })); setEditingShift(null); }} className={`group p-3 md:p-6 rounded-[1.5rem] md:rounded-[2rem] border-2 transition-all flex flex-col items-center gap-1 md:gap-3 ${isSel ? 'border-blue-500 bg-blue-500/10 shadow-xl scale-105' : 'border-transparent bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700'}`}>
                    <span className={`font-black text-lg md:text-2xl transition-colors ${isSel ? 'text-blue-500' : 'text-slate-600 dark:text-slate-300'}`}>{sKey}</span>
                    <span className="text-[8px] md:text-[10px] font-black opacity-40 uppercase tracking-widest text-center leading-tight">{SHIFT_DETAILS[sKey].label}</span>
                  </button>
                );
              })}
            </div>
            <div className={`p-5 border-t text-center ${darkMode ? 'border-slate-800 bg-slate-900' : 'border-slate-100 bg-slate-50'}`}>
              <button onClick={() => setEditingShift(null)} className="text-[10px] font-black uppercase tracking-widest opacity-50 hover:opacity-100 transition-opacity px-8 py-2">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      <footer className="max-w-7xl mx-auto px-8 py-12 md:py-16 opacity-30 text-center print:hidden">
        <div className="flex items-center justify-center gap-4 mb-3">
           <div className="w-8 md:w-10 h-px bg-slate-400" />
           <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.4em]">CUF Trindade • 2026</span>
           <div className="w-8 md:w-10 h-px bg-slate-400" />
        </div>
        <p className="text-[8px] md:text-[9px] font-bold uppercase tracking-widest">Plataforma Avançada v4.5 HD High Fidelity</p>
      </footer>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: ${darkMode ? '#334155' : '#cbd5e1'};
          border-radius: 20px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: ${darkMode ? '#475569' : '#94a3b8'};
        }

        @media print {
          @page {
            size: landscape;
            margin: 5mm;
          }
          body {
            background: white !important;
            color: black !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .print\\:hidden {
            display: none !important;
          }
          main {
            padding: 0 !important;
            margin: 0 !important;
            max-width: 100% !important;
          }
          section {
            box-shadow: none !important;
            border-radius: 8px !important;
            border: 1px solid #e2e8f0 !important;
            margin-bottom: 20px !important;
            page-break-inside: avoid;
          }
          .overflow-x-auto {
            overflow: visible !important;
          }
          table {
            min-width: 100% !important;
            font-size: 7.5pt !important;
            border-collapse: collapse !important;
            table-layout: fixed !important;
            width: 100% !important;
          }
          th, td {
            border: 0.5px solid #94a3b8 !important;
            padding: 3px !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
            white-space: nowrap !important;
          }
          .sticky {
            position: static !important;
            box-shadow: none !important;
          }
          .ring-2, .ring-offset-2, .ring-offset-4, .shadow-2xl, .shadow-xl {
            box-shadow: none !important;
            outline: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default App;
