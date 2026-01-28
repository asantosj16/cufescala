
import { format, getDay, getISOWeek, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { ShiftType, StaffName, DailyShift, CustomOverrides, RotationType, StaffConfig } from '../types';

const DS_GROUPS = {
  DS1: [5, 6], // Sex + Sab
  DS2: [6, 0], // Sab + Dom
  DS3: [0, 1], // Dom + Seg
  CUSTOM: []
};

// Folgas para Cláudia (aplicadas às 4 semanas do mês)
// Semana 1: Sexta + Sábado, Semana 2: Domingo + Segunda, Semana 3: Sábado + Domingo, Semana 4: sem folga
const CLAUDIA_RANDOM_OFFS = [
  [5, 6], // Semana 1: Sexta + Sábado
  [0, 1], // Semana 2: Domingo + Segunda
  [6, 0], // Semana 3: Sábado + Domingo
  [],     // Semana 4: sem folga especial (segue rotação normal)
];

// Folgas para Irene (aplicadas às 4 semanas do mês)
// Semana 1: Sábado + Domingo, Semana 2: Sexta + Sábado, Semana 3: Domingo + Segunda, Semana 4: sem folga
const IRENE_RANDOM_OFFS = [
  [6, 0], // Semana 1: Sábado + Domingo
  [5, 6], // Semana 2: Sexta + Sábado
  [0, 1], // Semana 3: Domingo + Segunda
  [],     // Semana 4: sem folga especial (segue rotação normal)
];

// Função genérica para gerar folgas fixas
// Retorna um mapa de semana ISO -> padrão de folga
// Aplica os padrões sequencialmente às 4 primeiras semanas do mês
const generateWeeklyOffs = (year: number, month: number, staffOffsPattern: number[][]): Record<number, number[]> => {
  // Obtém semanas ISO do mês
  const start = startOfMonth(new Date(year, month));
  const end = endOfMonth(start);
  const days = eachDayOfInterval({ start, end });
  
  const weeksInMonth = new Set<number>();
  days.forEach(day => {
    weeksInMonth.add(getISOWeek(day));
  });
  
  // Pega as 4 primeiras semanas reais do mês em ordem
  const weeks = Array.from(weeksInMonth).sort((a, b) => a - b).slice(0, 4);
  
  // Aloca os padrões sequencialmente às 4 semanas
  const weekOffMap: Record<number, number[]> = {};
  for (let i = 0; i < weeks.length && i < staffOffsPattern.length; i++) {
    weekOffMap[weeks[i]] = staffOffsPattern[i];
  }
  
  return weekOffMap;
};

// Gera folgas para Cláudia
const generateClaudiaRandomOffs = (year: number, month: number): Record<number, number[]> => {
  return generateWeeklyOffs(year, month, CLAUDIA_RANDOM_OFFS);
};

// Gera folgas para Irene
const generateIreneRandomOffs = (year: number, month: number): Record<number, number[]> => {
  return generateWeeklyOffs(year, month, IRENE_RANDOM_OFFS);
};

// Folgas para Licínia (aplicadas às 4 semanas do mês)
// Semana 1-3: sem folga especial (segue rotação normal), Semana 4: Sábado + Domingo
const LICINIA_WEEKLY_OFFS = [
  [],     // Semana 1: sem folga especial (segue rotação normal)
  [],     // Semana 2: sem folga especial (segue rotação normal)
  [],     // Semana 3: sem folga especial (segue rotação normal)
  [6, 0], // Semana 4: Sábado + Domingo
];

// Gera folgas para Licínia
const generateLiciniaWeeklyOffs = (year: number, month: number): Record<number, number[]> => {
  return generateWeeklyOffs(year, month, LICINIA_WEEKLY_OFFS);
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
  
  // Gera o mapa de folgas: semana ISO -> padrão de folga
  const claudiaWeeklyOffs = generateClaudiaRandomOffs(year, month);
  const ireneWeeklyOffs = generateIreneRandomOffs(year, month);
  const liciniaWeeklyOffs = generateLiciniaWeeklyOffs(year, month);

  // Primeiro passo: gera shifts para Cláudia e Irene para identificar quando ambas trabalham juntas
  const claudiaShifts: Record<string, ShiftType> = {};
  const ireneShifts: Record<string, ShiftType> = {};

  days.forEach((day) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    const isoWeek = getISOWeek(day);
    const dayOfWeek = getDay(day);

    // Calcula shifts de Cláudia
    const claudiaConfig = configs['Cláudia'];
    if (!overrides[`Cláudia-${dateStr}`]) {
      let claudiaOffDays: number[] = [];
      if (claudiaWeeklyOffs[isoWeek]) {
        claudiaOffDays = claudiaWeeklyOffs[isoWeek];
      }
      
      if (claudiaOffDays.includes(dayOfWeek)) {
        claudiaShifts[dateStr] = ShiftType.DS;
      } else {
        const weekDiff = isoWeek - refWeek;
        const isReferenceParity = Math.abs(weekDiff) % 2 === 0;
        claudiaShifts[dateStr] = isReferenceParity ? claudiaConfig.startShift : 
          (claudiaConfig.startShift === ShiftType.M56 ? ShiftType.T6 : ShiftType.M56);
      }
    } else {
      claudiaShifts[dateStr] = overrides[`Cláudia-${dateStr}`];
    }

    // Calcula shifts de Irene
    const ireneConfig = configs['Irene'];
    if (!overrides[`Irene-${dateStr}`]) {
      let ireneOffDays: number[] = [];
      if (ireneWeeklyOffs[isoWeek]) {
        ireneOffDays = ireneWeeklyOffs[isoWeek];
      } else {
        ireneOffDays = DS_GROUPS[ireneConfig.offDayGroup] || [];
      }
      
      if (ireneOffDays.includes(dayOfWeek)) {
        ireneShifts[dateStr] = ShiftType.DS;
      } else {
        const weekDiff = isoWeek - refWeek;
        const isReferenceParity = Math.abs(weekDiff) % 2 === 0;
        ireneShifts[dateStr] = isReferenceParity ? ireneConfig.startShift : 
          (ireneConfig.startShift === ShiftType.M56 ? ShiftType.T6 : ShiftType.M56);
      }
    } else {
      ireneShifts[dateStr] = overrides[`Irene-${dateStr}`];
    }
  });

  // Segundo passo: gera shifts para todos
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
      } else if (staff === 'Licínia') {
        // Para Licínia, verifica se a semana ISO tem um padrão de folga
        if (liciniaWeeklyOffs[isoWeek]) {
          offDays = liciniaWeeklyOffs[isoWeek];
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
          // Lógica específica Licínia: trabalha sexta a segunda
          // Padrão semanal define quando tem folga (semana 4: sáb+dom, semanas 1-3: normal)
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
