import React from 'react';
import { ShiftType } from '../types';
import { SHIFT_DETAILS } from '../constants';
import { Clock } from 'lucide-react';

interface AlertsLegendProps {
  darkMode: boolean;
}

export const AlertsLegend: React.FC<AlertsLegendProps> = ({ darkMode }) => {
  const shifts = [
    ShiftType.M56,
    ShiftType.T6,
    ShiftType.S178,
    ShiftType.T94,
    ShiftType.M151,
    ShiftType.DS,
    ShiftType.F,
    ShiftType.FP,
  ];

  const schedules = [
    { code: 'M56', time: '07:30–15:30 (8h)', staff: 'Cláudia / Irene' },
    { code: 'T6', time: '13:00–21:00 (8h)', staff: 'Cláudia / Irene' },
    { code: '178', time: '07:30–12:30 (5h)', staff: 'Licínia' },
    { code: 'T94', time: '15:30–20:30 (5h)', staff: 'Licínia' },
    { code: 'M151', time: '11:30–19:30 (8h)', staff: 'Manual' },
  ];

  return (
    <div className="space-y-3">
      {/* Horários Semanais */}
      <div className={`p-4 md:p-5 rounded-lg border transition-all ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
        <div className="flex items-center gap-3 mb-3">
          <div className={`p-2 rounded-lg ${darkMode ? 'bg-blue-500/20' : 'bg-blue-100'}`}>
            <Clock size={16} className={darkMode ? 'text-blue-400' : 'text-blue-600'} />
          </div>
          <p className={`text-xs md:text-sm font-bold ${darkMode ? 'text-slate-300' : 'text-slate-700'} uppercase tracking-wide`}>Horários Semanais</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
          {schedules.map((schedule) => (
            <div key={schedule.code} className={`p-2.5 md:p-3 rounded-lg ${darkMode ? 'bg-slate-800/50' : 'bg-white border border-slate-100'}`}>
              <p className={`text-xs md:text-sm font-bold ${darkMode ? 'text-slate-200' : 'text-slate-900'}`}>{schedule.code}</p>
              <p className={`text-[10px] md:text-xs ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>{schedule.time}</p>
              <p className={`text-[9px] md:text-[10px] ${darkMode ? 'text-slate-500' : 'text-slate-500'} mt-1`}>{schedule.staff}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Legenda de Turnos */}
      <div className={`p-4 md:p-5 rounded-lg border transition-all ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
        <p className={`text-xs md:text-sm font-bold ${darkMode ? 'text-slate-300' : 'text-slate-700'} mb-3 uppercase tracking-wide`}>Legenda de Turnos</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-2">
          {shifts.map((shift) => {
            const details = SHIFT_DETAILS[shift];
            return (
              <div key={shift} className="flex items-center gap-2">
                <div className={`px-2 py-1 rounded text-xs font-bold whitespace-nowrap border ${details.color}`}>
                  {shift}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
