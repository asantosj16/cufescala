
import { ShiftType, StaffName } from './types';

export const STAFF_LIST: StaffName[] = ['Cláudia', 'Irene', 'Licínia'];

export const SHIFT_DETAILS: Record<ShiftType, { label: string; time: string; hours: number; color: string }> = {
  [ShiftType.M56]: { label: 'Manhã (8h)', time: '07:30–15:30', hours: 8, color: 'bg-blue-100 text-blue-700 border-blue-200' },
  [ShiftType.T6]: { label: 'Tarde (8h)', time: '13:00–21:00', hours: 8, color: 'bg-orange-100 text-orange-700 border-orange-200' },
  [ShiftType.S178]: { label: 'Manhã L (5h)', time: '07:30–12:30', hours: 5, color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  [ShiftType.T94]: { label: 'Tarde L (5h)', time: '15:30–20:30', hours: 5, color: 'bg-purple-100 text-purple-700 border-purple-200' },
  [ShiftType.M151]: { label: 'Manual (8h)', time: '11:30–19:30', hours: 8, color: 'bg-slate-100 text-slate-700 border-slate-200' },
  [ShiftType.DS]: { label: 'Descanso', time: '-', hours: 0, color: 'bg-rose-100 text-rose-700 border-rose-200' },
  [ShiftType.F]: { label: 'Férias', time: 'AUSENTE', hours: 0, color: 'bg-yellow-100 text-yellow-800 border-yellow-300 shadow-sm' },
  [ShiftType.FP]: { label: 'Feriado', time: 'FERIADO', hours: 0, color: 'bg-amber-200 text-amber-900 border-amber-400 ring-1 ring-amber-500/30' },
};

export const WEEKEND_OFFS = [
  { id: 'DS1', label: 'Sex + Sab', days: [5, 6] },
  { id: 'DS2', label: 'Sab + Dom', days: [6, 0] },
  { id: 'DS3', label: 'Dom + Seg', days: [0, 1] },
];
