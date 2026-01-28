import React from 'react';
import { Users, Clock, Calendar } from 'lucide-react';

interface InfoScheduleProps {
  darkMode: boolean;
}

export const InfoSchedule: React.FC<InfoScheduleProps> = ({ darkMode }) => {
  return (
    <section className={`grid grid-cols-1 lg:grid-cols-2 gap-2 md:gap-3 print:gap-2 mb-3`}>
      {/* Funcionárias */}
      <div className={`p-2.5 md:p-3 rounded-lg md:rounded-xl border transition-all print:shadow-none print:border-slate-300 print:rounded-lg print:p-3 ${darkMode ? 'bg-slate-900 border-slate-800 shadow-md' : 'bg-white border-slate-100 shadow-sm shadow-slate-200/30'}`}>
        <div className="flex items-center gap-2 mb-2.5 md:mb-3">
          <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-purple-600 text-white flex items-center justify-center font-black shadow-sm print:shadow-none">
            <Users size={14} className="md:w-4 md:h-4" />
          </div>
          <h3 className="font-bold text-xs md:text-sm tracking-tight uppercase">Funcionárias</h3>
        </div>
        <div className="space-y-1.5 md:space-y-2">
          <div className="p-1.5 md:p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
            <p className="text-xs md:text-sm font-bold text-slate-900 dark:text-slate-100">Cláudia</p>
            <p className="text-[9px] md:text-[10px] text-slate-600 dark:text-slate-400 font-semibold leading-tight">40h/semana (5 dias × 8h)</p>
          </div>
          <div className="p-1.5 md:p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
            <p className="text-xs md:text-sm font-bold text-slate-900 dark:text-slate-100">Irene</p>
            <p className="text-[9px] md:text-[10px] text-slate-600 dark:text-slate-400 font-semibold leading-tight">40h/semana (5 dias × 8h)</p>
          </div>
          <div className="p-1.5 md:p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
            <p className="text-xs md:text-sm font-bold text-slate-900 dark:text-slate-100">Licínia</p>
            <p className="text-[9px] md:text-[10px] text-slate-600 dark:text-slate-400 font-semibold leading-tight">20h/semana (4 dias × 5h)</p>
          </div>
        </div>
      </div>

      {/* Horários Semanais */}
      <div className={`p-2.5 md:p-3 rounded-lg md:rounded-xl border transition-all print:shadow-none print:border-slate-300 print:rounded-lg print:p-3 ${darkMode ? 'bg-slate-900 border-slate-800 shadow-md' : 'bg-white border-slate-100 shadow-sm shadow-slate-200/30'}`}>
        <div className="flex items-center gap-2 mb-2.5 md:mb-3">
          <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-black shadow-sm print:shadow-none">
            <Clock size={14} className="md:w-4 md:h-4" />
          </div>
          <h3 className="font-bold text-xs md:text-sm tracking-tight uppercase">Horários</h3>
        </div>
        <div className="space-y-1 md:space-y-1.5 text-[10px] md:text-xs">
          <div className={`p-1.5 md:p-2 rounded-lg flex items-start gap-2 ${darkMode ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
            <span className="font-black text-xs md:text-sm text-blue-600 dark:text-blue-400 min-w-8">M56</span>
            <div className="min-w-0">
              <p className="font-semibold text-slate-900 dark:text-slate-100 leading-tight">07:30–15:30 (8h)</p>
              <p className="text-[8px] md:text-[9px] text-slate-600 dark:text-slate-400">Cláudia / Irene</p>
            </div>
          </div>
          <div className={`p-1.5 md:p-2 rounded-lg flex items-start gap-2 ${darkMode ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
            <span className="font-black text-xs md:text-sm text-blue-600 dark:text-blue-400 min-w-8">T6</span>
            <div className="min-w-0">
              <p className="font-semibold text-slate-900 dark:text-slate-100 leading-tight">13:00–21:00 (8h)</p>
              <p className="text-[8px] md:text-[9px] text-slate-600 dark:text-slate-400">Cláudia / Irene</p>
            </div>
          </div>
          <div className={`p-1.5 md:p-2 rounded-lg flex items-start gap-2 ${darkMode ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
            <span className="font-black text-xs md:text-sm text-teal-600 dark:text-teal-400 min-w-8">178</span>
            <div className="min-w-0">
              <p className="font-semibold text-slate-900 dark:text-slate-100 leading-tight">07:30–12:30 (5h)</p>
              <p className="text-[8px] md:text-[9px] text-slate-600 dark:text-slate-400">Licínia</p>
            </div>
          </div>
          <div className={`p-1.5 md:p-2 rounded-lg flex items-start gap-2 ${darkMode ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
            <span className="font-black text-xs md:text-sm text-teal-600 dark:text-teal-400 min-w-8">T94</span>
            <div className="min-w-0">
              <p className="font-semibold text-slate-900 dark:text-slate-100 leading-tight">15:30–20:30 (5h)</p>
              <p className="text-[8px] md:text-[9px] text-slate-600 dark:text-slate-400">Licínia</p>
            </div>
          </div>
          <div className={`p-1.5 md:p-2 rounded-lg flex items-start gap-2 ${darkMode ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
            <span className="font-black text-xs md:text-sm text-amber-600 dark:text-amber-400 min-w-8">M151</span>
            <div className="min-w-0">
              <p className="font-semibold text-slate-900 dark:text-slate-100 leading-tight">11:30–19:30 (8h)</p>
              <p className="text-[8px] md:text-[9px] text-slate-600 dark:text-slate-400">Manual</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
