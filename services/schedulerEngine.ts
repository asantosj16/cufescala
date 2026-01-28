
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
  [5, 6], // Semana 1: Sexta + Sábado
  [6, 0], // Semana 2: Sábado + Domingo
  [0, 1], // Semana 3: Domingo + Segunda
];

// Folgas aleatórias para Irene: (Sábado+Domingo), (Sexta+Sábado), (Domingo+Segunda)
const IRENE_RANDOM_OFFS = [
  [6, 0], // Semana 1: Sábado + Domingo
  [5, 6], // Semana 2: Sexta + Sábado
  [0, 1], // Semana 3: Domingo + Segunda
];

// Função genérica para gerar folgas aleatórias
// Retorna um mapa de semana ISO -> padrão de folga para evitar conflitos
// Garante que SEMPRE haja as 3 folgas em cada mês (2 dias consecutivos cada)
// com 4 semanas selecionadas do mês
const generateRandomOffs = (year: number, month: number, staffOffsPattern: number[][]): Record<number, number[]> => {
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
  
  // Pega as 4 primeiras semanas reais do mês
  const weeks = Array.from(weeksInMonth).sort((a, b) => a - b).slice(0, 4);
  
  // Embaralha as 4 semanas selecionadas de forma determinística
  const shuffled = [...weeks];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor((seed * 9973 + i * 137) % (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  
  // Aloca os 3 tipos de folga para as 3 primeiras semanas embaralhadas
  // A 4ª semana não recebe folga especial (segue rotação normal)
  // Cada semana com folga tem exatamente UM padrão de folga (2 dias consecutivos)
  const weekOffMap: Record<number, number[]> = {};
  for (let i = 0; i < 3 && i < shuffled.length; i++) {
    weekOffMap[shuffled[i]] = staffOffsPattern[i];
  }
  
  return weekOffMap;
};

// Gera folgas aleatórias para Cláudia
const generateClaudiaRandomOffs = (year: number, month: number): Record<number, number[]> => {
  return generateRandomOffs(year, month, CLAUDIA_RANDOM_OFFS);
};

// Gera folgas aleatórias para Irene
const generateIreneRandomOffs = (year: number, month: number): Record<number, number[]> => {
  return generateRandomOffs(year, month, IRENE_RANDOM_OFFS);
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
  
  // Gera o mapa de folgas aleatórias: semana ISO -> padrão de folga
  const claudiaWeeklyOffs = generateClaudiaRandomOffs(year, month);
  const ireneWeeklyOffs = generateIreneRandomOffs(year, month);

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

      let offDays: number[] = [];
      
      if (staff === 'Cláudia') {
        // Para Cláudia, verifica se a semana ISO tem um padrão de folga
        if (claudiaWeeklyOffs[isoWeek]) {
          offDays = claudiaWeeklyOffs[isoWeek];
        }
      } else if (staff === 'Irene') {
        // Para Irene, verifica se a semana ISO tem um padrão de folga
        if (ireneWeeklyOffs[isoWeek]) {
          offDays = ireneWeeklyOffs[isoWeek];
        } else {
          // Para outros, usa a configuração padrão
          offDays = DS_GROUPS[config.offDayGroup] || [];
        }
      } else {
        // Para outros, usa a configuração padrão
        offDays = DS_GROUPS[config.offDayGroup] || [];
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
