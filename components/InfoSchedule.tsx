import React from 'react';
import { Users, Clock, Calendar } from 'lucide-react';

interface InfoScheduleProps {
  darkMode: boolean;
}

export const InfoSchedule: React.FC<InfoScheduleProps> = ({ darkMode }) => {
  return (
    <section className={`grid grid-cols-1 gap-2 md:gap-3 print:gap-2 mb-3`}>
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
    </section>
  );
};
