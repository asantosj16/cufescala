import React from 'react';
import { ShiftType } from '../types';
import { SHIFT_DETAILS } from '../constants';

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

  return (
    <div className={`mt-4 p-3 md:p-4 rounded-lg border transition-all ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
      <p className="text-xs md:text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 uppercase tracking-wide">Legenda de Turnos</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-2">
        {shifts.map((shift) => {
          const details = SHIFT_DETAILS[shift];
          return (
            <div key={shift} className="flex items-center gap-2">
              <div className={`px-2 py-1 rounded text-xs font-bold whitespace-nowrap border ${details.color}`}>
                {shift}
              </div>
              <span className="text-[10px] md:text-xs text-slate-600 dark:text-slate-400 hidden sm:inline truncate" title={details.label}>
                {details.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
