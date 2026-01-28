import React from 'react';
import { Users, Clock, Calendar } from 'lucide-react';

interface InfoScheduleProps {
  darkMode: boolean;
}

export const InfoSchedule: React.FC<InfoScheduleProps> = ({ darkMode }) => {
  return (
    <section className={`grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 print:gap-4`}>
      {/* Funcionárias */}
      <div className={`p-5 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border transition-all print:shadow-none print:border-slate-300 print:rounded-xl print:p-6 ${darkMode ? 'bg-slate-900 border-slate-800 shadow-xl' : 'bg-white border-slate-100 shadow-lg shadow-slate-200/40'}`}>
        <div className="flex items-center gap-3 mb-5 md:mb-8">
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-purple-600 text-white flex items-center justify-center font-black shadow-lg print:shadow-none">
            <Users size={20} className="md:w-6 md:h-6" />
          </div>
          <h3 className="font-black text-base md:text-xl tracking-tight uppercase">Funcionárias</h3>
        </div>
        <div className="space-y-3 md:space-y-4">
          <div className="p-3 md:p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
            <p className="text-sm md:text-base font-bold text-slate-900 dark:text-slate-100">Cláudia</p>
            <p className="text-[11px] md:text-[13px] text-slate-600 dark:text-slate-400 font-semibold">40h/semana sempre (5 dias × 8h)</p>
          </div>
          <div className="p-3 md:p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
            <p className="text-sm md:text-base font-bold text-slate-900 dark:text-slate-100">Irene</p>
            <p className="text-[11px] md:text-[13px] text-slate-600 dark:text-slate-400 font-semibold">40h/semana sempre (5 dias × 8h)</p>
          </div>
          <div className="p-3 md:p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
            <p className="text-sm md:text-base font-bold text-slate-900 dark:text-slate-100">Licínia</p>
            <p className="text-[11px] md:text-[13px] text-slate-600 dark:text-slate-400 font-semibold">20h/semana sempre (4 dias × 5h: Sex, Sáb, Dom, Seg)</p>
          </div>
        </div>
      </div>

      {/* Horários Semanais */}
      <div className={`p-5 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border transition-all print:shadow-none print:border-slate-300 print:rounded-xl print:p-6 ${darkMode ? 'bg-slate-900 border-slate-800 shadow-xl' : 'bg-white border-slate-100 shadow-lg shadow-slate-200/40'}`}>
        <div className="flex items-center gap-3 mb-5 md:mb-8">
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black shadow-lg print:shadow-none">
            <Clock size={20} className="md:w-6 md:h-6" />
          </div>
          <h3 className="font-black text-base md:text-xl tracking-tight uppercase">Horários Semanais</h3>
        </div>
        <div className="space-y-2.5 md:space-y-3 text-sm">
          <div className={`p-3 md:p-4 rounded-xl flex items-start gap-3 ${darkMode ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
            <span className="font-black text-base md:text-lg text-blue-600 dark:text-blue-400 min-w-12 md:min-w-14">M56</span>
            <div className="min-w-0">
              <p className="font-semibold text-slate-900 dark:text-slate-100">07:30–15:30 (8h)</p>
              <p className="text-[11px] md:text-xs text-slate-600 dark:text-slate-400">Cláudia / Irene</p>
            </div>
          </div>
          <div className={`p-3 md:p-4 rounded-xl flex items-start gap-3 ${darkMode ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
            <span className="font-black text-base md:text-lg text-blue-600 dark:text-blue-400 min-w-12 md:min-w-14">T6</span>
            <div className="min-w-0">
              <p className="font-semibold text-slate-900 dark:text-slate-100">13:00–21:00 (8h)</p>
              <p className="text-[11px] md:text-xs text-slate-600 dark:text-slate-400">Cláudia / Irene</p>
            </div>
          </div>
          <div className={`p-3 md:p-4 rounded-xl flex items-start gap-3 ${darkMode ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
            <span className="font-black text-base md:text-lg text-teal-600 dark:text-teal-400 min-w-12 md:min-w-14">178</span>
            <div className="min-w-0">
              <p className="font-semibold text-slate-900 dark:text-slate-100">07:30–12:30 (5h)</p>
              <p className="text-[11px] md:text-xs text-slate-600 dark:text-slate-400">Licínia</p>
            </div>
          </div>
          <div className={`p-3 md:p-4 rounded-xl flex items-start gap-3 ${darkMode ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
            <span className="font-black text-base md:text-lg text-teal-600 dark:text-teal-400 min-w-12 md:min-w-14">T94</span>
            <div className="min-w-0">
              <p className="font-semibold text-slate-900 dark:text-slate-100">15:30–20:30 (5h)</p>
              <p className="text-[11px] md:text-xs text-slate-600 dark:text-slate-400">Licínia</p>
            </div>
          </div>
          <div className={`p-3 md:p-4 rounded-xl flex items-start gap-3 ${darkMode ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
            <span className="font-black text-base md:text-lg text-amber-600 dark:text-amber-400 min-w-12 md:min-w-14">M151</span>
            <div className="min-w-0">
              <p className="font-semibold text-slate-900 dark:text-slate-100">11:30–19:30 (8h)</p>
              <p className="text-[11px] md:text-xs text-slate-600 dark:text-slate-400">Manual</p>
            </div>
          </div>
        </div>
      </div>

      {/* Folgas Semanais */}
      <div className={`lg:col-span-2 p-5 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border transition-all print:shadow-none print:border-slate-300 print:rounded-xl print:p-6 ${darkMode ? 'bg-slate-900 border-slate-800 shadow-xl' : 'bg-white border-slate-100 shadow-lg shadow-slate-200/40'}`}>
        <div className="flex items-center gap-3 mb-5 md:mb-8">
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black shadow-lg print:shadow-none">
            <Calendar size={20} className="md:w-6 md:h-6" />
          </div>
          <h3 className="font-black text-base md:text-xl tracking-tight uppercase">Folgas Semanais</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
          <div className={`p-3 md:p-4 rounded-xl ${darkMode ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
            <p className="font-bold text-slate-900 dark:text-slate-100 mb-1 text-sm md:text-base">Folga 1</p>
            <p className="text-[11px] md:text-xs text-slate-600 dark:text-slate-400 font-semibold">Sexta + Sábado em conjunto</p>
          </div>
          <div className={`p-3 md:p-4 rounded-xl ${darkMode ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
            <p className="font-bold text-slate-900 dark:text-slate-100 mb-1 text-sm md:text-base">Folga 2</p>
            <p className="text-[11px] md:text-xs text-slate-600 dark:text-slate-400 font-semibold">Sábado + Domingo em conjunto</p>
          </div>
          <div className={`p-3 md:p-4 rounded-xl ${darkMode ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
            <p className="font-bold text-slate-900 dark:text-slate-100 mb-1 text-sm md:text-base">Folga 3</p>
            <p className="text-[11px] md:text-xs text-slate-600 dark:text-slate-400 font-semibold">Domingo + Segunda em conjunto</p>
          </div>
        </div>
        <div className={`mt-4 p-3 md:p-4 rounded-xl flex items-start gap-2.5 ${darkMode ? 'bg-slate-800/30 border border-slate-700/50' : 'bg-slate-50 border border-slate-200'}`}>
          <span className="text-sm md:text-base font-black text-slate-900 dark:text-slate-100 min-w-8">DS</span>
          <div>
            <p className="text-[11px] md:text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Descanso Semanal</p>
          </div>
        </div>
        <div className={`mt-2.5 p-3 md:p-4 rounded-xl flex items-start gap-2.5 ${darkMode ? 'bg-slate-800/30 border border-slate-700/50' : 'bg-slate-50 border border-slate-200'}`}>
          <span className="text-sm md:text-base font-black text-slate-900 dark:text-slate-100 min-w-8">F</span>
          <div>
            <p className="text-[11px] md:text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Férias</p>
          </div>
        </div>
      </div>
    </section>
  );
};
