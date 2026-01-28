
import { format, getDay, getISOWeek, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { ShiftType, StaffName, DailyShift, CustomOverrides, RotationType, StaffConfig } from '../types';

const DS_GROUPS = {
  DS1: [5, 6], // Sex + Sab
  DS2: [6, 0], // Sab + Dom
  DS3: [0, 1], // Dom + Seg
  CUSTOM: []
};

// Folgas aleatórias para Cláudia: (Sexta+Sábado), (Sábado+Domingo), (Domingo+Segunda)
const CLAUDIA_RANDOM_OFFS = [
  [5, 6], // Sexta + Sábado
  [6, 0], // Sábado + Domingo
  [0, 1], // Domingo + Segunda
];

// Gera folgas aleatórias para Cláudia no mês
const generateClaudiaRandomOffs = (year: number, month: number): number[][] => {
  // Seed determinístico baseado no mês/ano para consistência
  const seed = year * 12 + month;
  
  // Obtém semanas ISO do mês
  const start = startOfMonth(new Date(year, month));
  const end = endOfMonth(start);
  const days = eachDayOfInterval({ start, end });
  
  const weeksInMonth = new Set<number>();
  days.forEach(day => {
    weeksInMonth.add(getISOWeek(day));
  });
  
  const weeks = Array.from(weeksInMonth).sort((a, b) => a - b);
  
  // Embaralha as semanas de forma determinística
  const shuffled = [...weeks];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor((seed * 9973 + i * 137) % (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  
  // Aloca os 3 tipos de folga para as primeiras 3 semanas disponíveis
  const weekOffMap: Record<number, number[]> = {};
  for (let i = 0; i < Math.min(3, shuffled.length); i++) {
    weekOffMap[shuffled[i]] = CLAUDIA_RANDOM_OFFS[i];
  }
  
  return Object.values(weekOffMap);
};

export const generateSchedule = (
  year: number, 
  month: number, 
  overrides: CustomOverrides,
  configs: Record<StaffName, StaffConfig>
): DailyShift[] => {
  const shifts: DailyShift[] = [];
  const start = startOfMonth(new Date(year, month));
  const end = endOfMonth(start);
  const days = eachDayOfInterval({ start, end });

  // Semana de referência fixa (Semana 10 de 2026 como base de rotação conforme pedido original)
  const refWeek = 10;
  
  // Gera as folgas aleatórias para Cláudia
  const claudiaRandomOffs = generateClaudiaRandomOffs(year, month);

  days.forEach((day) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    const isoWeek = getISOWeek(day);
    const dayOfWeek = getDay(day);

    Object.entries(configs).forEach(([name, config]) => {
      const staff = name as StaffName;
      const key = `${staff}-${dateStr}`;

      if (overrides[key]) {
        shifts.push({ staffId: staff, date: dateStr, shift: overrides[key] });
        return;
      }

      let offDays = DS_GROUPS[config.offDayGroup] || [];
      
      // Para Cláudia, aplica folgas aleatórias ao invés da configuração padrão
      if (staff === 'Cláudia') {
        offDays = [];
        claudiaRandomOffs.forEach(offPair => {
          if (offPair.includes(dayOfWeek)) {
            offDays.push(dayOfWeek);
          }
        });
      }

      const isOffDay = offDays.includes(dayOfWeek);

      if (isOffDay) {
        shifts.push({ staffId: staff, date: dateStr, shift: ShiftType.DS });
        return;
      }

      let shift: ShiftType = ShiftType.DS;

      switch (config.rotation) {
        case RotationType.ALTERNATING:
          const weekDiff = isoWeek - refWeek;
          const isReferenceParity = Math.abs(weekDiff) % 2 === 0;
          if (isReferenceParity) {
            shift = config.startShift;
          } else {
            shift = config.startShift === ShiftType.M56 ? ShiftType.T6 : ShiftType.M56;
          }
          break;
        case RotationType.FIXED_MORNING:
          shift = ShiftType.M56;
          break;
        case RotationType.FIXED_AFTERNOON:
          shift = ShiftType.T6;
          break;
        case RotationType.WEEKEND_COVER:
          // Lógica específica Licínia: Sex a Seg
          if ([5, 6, 0, 1].includes(dayOfWeek)) {
            shift = (isoWeek % 2 === 0) ? ShiftType.S178 : ShiftType.T94;
          } else {
            shift = ShiftType.DS;
          }
          break;
      }

      shifts.push({ staffId: staff, date: dateStr, shift });
    });
  });

  return shifts;
};
