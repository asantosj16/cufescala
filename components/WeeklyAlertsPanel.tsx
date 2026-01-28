import React, { useMemo } from 'react';
import { AlertTriangle, TrendingUp, Clock } from 'lucide-react';
import { StaffName, ShiftType } from '../types';
import { STAFF_LIST, SHIFT_DETAILS } from '../constants';
import { parseISO, getISOWeek, format } from 'date-fns';

interface WeeklyAlertsPanelProps {
  darkMode: boolean;
  monthShifts: Array<{ staffId: StaffName; date: string; shift: ShiftType }>;
  weeklyLimits: Record<StaffName, number>;
}

interface WeeklyAlert {
  staff: StaffName;
  week: number;
  hours: number;
  limit: number;
  excess: number;
  dates: string[];
}

export const WeeklyAlertsPanel: React.FC<WeeklyAlertsPanelProps> = ({ 
  darkMode, 
  monthShifts, 
  weeklyLimits 
}) => {
  const weeklyAlerts = useMemo(() => {
    const alerts: WeeklyAlert[] = [];
    
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
        const limit = weeklyLimits[staff];
        if (data.hours > limit) {
          alerts.push({
            staff,
            week: Number(week),
            hours: data.hours,
            limit,
            excess: data.hours - limit,
            dates: data.dates,
          });
        }
      });
    });

    return alerts.sort((a, b) => {
      if (a.week !== b.week) return a.week - b.week;
      return b.excess - a.excess;
    });
  }, [monthShifts, weeklyLimits]);

  if (weeklyAlerts.length === 0) return null;

  return (
    <div className={`p-4 md:p-6 rounded-lg border transition-all ${darkMode ? 'bg-rose-950/20 border-rose-500/30' : 'bg-rose-50 border-rose-200'}`}>
      <div className="flex items-center gap-3 mb-4">
        <div className={`p-2.5 rounded-lg ${darkMode ? 'bg-rose-500/20' : 'bg-rose-100'}`}>
          <AlertTriangle size={18} className={darkMode ? 'text-rose-400' : 'text-rose-600'} />
        </div>
        <div>
          <h3 className={`text-sm md:text-base font-bold ${darkMode ? 'text-rose-400' : 'text-rose-700'}`}>
            Alertas de Horas Excedentes
          </h3>
          <p className={`text-[11px] md:text-xs ${darkMode ? 'text-rose-300/60' : 'text-rose-600/70'}`}>
            {weeklyAlerts.length} {weeklyAlerts.length === 1 ? 'semana' : 'semanas'} com excesso de horas
          </p>
        </div>
      </div>

      <div className="space-y-2.5">
        {weeklyAlerts.map((alert, idx) => (
          <div 
            key={`${alert.staff}-${alert.week}-${idx}`}
            className={`p-3 md:p-4 rounded-lg flex items-start gap-3 ${darkMode ? 'bg-slate-800/40 border border-rose-500/20' : 'bg-white border border-rose-100'}`}
          >
            <div className={`min-w-fit px-3 py-1.5 rounded-md font-bold text-sm ${darkMode ? 'bg-rose-500/20 text-rose-400' : 'bg-rose-100 text-rose-700'}`}>
              {alert.staff}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2">
                <div>
                  <p className={`text-xs md:text-sm font-bold ${darkMode ? 'text-slate-200' : 'text-slate-900'}`}>
                    Semana {alert.week}: {alert.hours}h / {alert.limit}h
                  </p>
                  <p className={`text-[10px] md:text-xs ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                    {alert.dates.join(', ')}
                  </p>
                </div>
                
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg whitespace-nowrap ${darkMode ? 'bg-rose-500/10 text-rose-400' : 'bg-rose-100 text-rose-700'}`}>
                  <TrendingUp size={14} />
                  <span className="font-bold text-xs md:text-sm">+{alert.excess}h</span>
                </div>
              </div>

              {/* Barra de progresso */}
              <div className={`mt-2 h-1.5 rounded-full overflow-hidden ${darkMode ? 'bg-slate-700/40' : 'bg-slate-200'}`}>
                <div 
                  className="h-full bg-gradient-to-r from-amber-500 to-rose-500 transition-all duration-500"
                  style={{ width: `${Math.min((alert.hours / alert.limit) * 100, 100)}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer informativo */}
      <div className={`mt-4 p-3 rounded-lg flex items-start gap-2 ${darkMode ? 'bg-slate-800/50' : 'bg-white border border-rose-100'}`}>
        <Clock size={14} className={`mt-0.5 flex-shrink-0 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`} />
        <p className={`text-[10px] md:text-xs leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-700'}`}>
          O total de horas trabalhadas em algumas semanas ultrapassou o limite permitido. 
          Considere distribuir os turnos para manter o equilíbrio.
        </p>
      </div>
    </div>
  );
};
