
import React from 'react';
import { ShiftType } from '../types';
import { SHIFT_DETAILS } from '../constants';
import { Umbrella, Flag } from 'lucide-react';

interface ShiftBadgeProps {
  shift: ShiftType;
  onClick?: () => void;
  className?: string;
}

export const ShiftBadge: React.FC<ShiftBadgeProps> = ({ shift, onClick, className = '' }) => {
  const details = SHIFT_DETAILS[shift];
  
  const getIcon = () => {
    switch (shift) {
      case ShiftType.F: return <Umbrella size={10} className="mb-0.5" />;
      case ShiftType.FP: return <Flag size={10} className="mb-0.5" />;
      default: return null;
    }
  };

  const isSpecial = shift === ShiftType.FP || shift === ShiftType.F;
  const isHoliday = shift === ShiftType.FP;

  return (
    <div
      onClick={onClick}
      className={`
        px-2 py-1.5 rounded-lg text-[10px] md:text-xs font-black border transition-all cursor-pointer 
        hover:scale-105 active:scale-95 flex flex-col items-center justify-center text-center relative overflow-hidden
        ${details.color} ${className}
      `}
      title={`${details.label} (${details.hours}h) | Status: ${details.time}`}
    >
      {/* Padrão visual pontilhado para feriados */}
      {isHoliday && (
        <div className="absolute inset-0 opacity-10 pointer-events-none" 
             style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 0)', backgroundSize: '4px 4px' }} />
      )}
      
      <div className="flex items-center gap-1 relative z-10">
        {getIcon()}
        <span className="leading-none tracking-tighter">{shift}</span>
      </div>
      
      {!isSpecial && (
        <span className="text-[7px] md:text-[8px] opacity-60 font-bold mt-0.5 hidden sm:block relative z-10">
          {details.time !== '-' ? details.time : details.label}
        </span>
      )}
      
      {isSpecial && (
        <span className="text-[7px] uppercase font-black tracking-widest mt-0.5 opacity-50 relative z-10">
          {shift === ShiftType.F ? 'Férias' : 'Feriado'}
        </span>
      )}
    </div>
  );
};
