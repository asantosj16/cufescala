import React from 'react';
import { Users, TrendingUp, TrendingDown } from 'lucide-react';
import { StaffName } from '../types';

interface StaffBalance {
  name: StaffName;
  actual: number;
  target: number;
  balance: number;
}

interface InfoScheduleProps {
  darkMode: boolean;
  staffBalance?: StaffBalance[];
}

export const InfoSchedule: React.FC<InfoScheduleProps> = ({ darkMode, staffBalance = [] }) => {
  const staffData = [
    { name: 'Cláudia' as StaffName, schedule: '40h/semana (5 dias × 8h)' },
    { name: 'Irene' as StaffName, schedule: '40h/semana (5 dias × 8h)' },
    { name: 'Licínia' as StaffName, schedule: '20h/semana (4 dias × 5h)' },
  ];

  const getBalanceInfo = (name: StaffName) => {
    return staffBalance.find(b => b.name === name);
  };

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
          {staffData.map((staff) => {
            const balance = getBalanceInfo(staff.name);
            const isPositive = balance && balance.balance > 0;
            const isNegative = balance && balance.balance < 0;

            return (
              <div key={staff.name} className={`p-1.5 md:p-2 rounded-lg ${darkMode ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs md:text-sm font-bold text-slate-900 dark:text-slate-100">{staff.name}</p>
                    <p className="text-[9px] md:text-[10px] text-slate-600 dark:text-slate-400 font-semibold leading-tight">{staff.schedule}</p>
                  </div>
                  {balance && (
                    <div className={`flex items-center gap-1 px-2 py-1 rounded text-[10px] md:text-xs font-bold whitespace-nowrap ${
                      isPositive 
                        ? darkMode 
                          ? 'bg-emerald-500/20 text-emerald-400' 
                          : 'bg-emerald-100 text-emerald-700'
                        : isNegative
                        ? darkMode
                          ? 'bg-rose-500/20 text-rose-400'
                          : 'bg-rose-100 text-rose-700'
                        : darkMode
                        ? 'bg-slate-700 text-slate-300'
                        : 'bg-slate-200 text-slate-700'
                    }`}>
                      {isPositive ? (
                        <>
                          <TrendingUp size={12} />
                          +{balance.balance}h
                        </>
                      ) : isNegative ? (
                        <>
                          <TrendingDown size={12} />
                          {balance.balance}h
                        </>
                      ) : (
                        `${balance.balance}h`
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
