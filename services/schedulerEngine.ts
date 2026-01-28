
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
  [0, 1], // Índice 0: Domingo + Segunda
  [5, 6], // Índice 1: Sexta + Sábado
  [6, 0], // Índice 2: Sábado + Domingo
];

// Folgas aleatórias para Irene: (Sábado+Domingo), (Sexta+Sábado), (Domingo+Segunda)
const IRENE_RANDOM_OFFS = [
  [0, 1], // Índice 0: Domingo + Segunda
  [5, 6], // Índice 1: Sexta + Sábado
  [6, 0], // Índice 2: Sábado + Domingo
];

// Função genérica para gerar folgas aleatórias
// Retorna um mapa de semana ISO -> padrão de folga para evitar conflitos
// Garante que SEMPRE haja as 3 folgas em cada mês (2 dias consecutivos cada)
// com 4 semanas selecionadas do mês
// Usa ordem válida: [0,1], [1,2] ou [0,1], [2,1] para evitar conflitos
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
  
  // Seleciona 3 semanas das 4
  const selectedWeeks = shuffled.slice(0, 3);
  
  // Constrói a ordem de padrões para evitar sobreposições
  // staffOffsPattern[0] = [0,1] (Domingo+Segunda) - sempre primeiro, não conflita
  // staffOffsPattern[1] = [5,6] (Sexta+Sábado)
  // staffOffsPattern[2] = [6,0] (Sábado+Domingo)
  // Ordem válidas: [0], [1], [2] ou [0], [2], [1]
  // Ambas válidas! [0]→[1] OK, [1]→[2] OK. E [0]→[2] OK, [2]→[1] OK.
  
  let patterns: number[][];
  
  if (seed % 2 === 0) {
    // Ordem 1: [0,1], [5,6], [6,0]
    patterns = [staffOffsPattern[0], staffOffsPattern[1], staffOffsPattern[2]];
  } else {
    // Ordem 2: [0,1], [6,0], [5,6]
    patterns = [staffOffsPattern[0], staffOffsPattern[2], staffOffsPattern[1]];
  }
  
  // Aloca os padrões para as 3 semanas selecionadas
  const weekOffMap: Record<number, number[]> = {};
  for (let i = 0; i < selectedWeeks.length; i++) {
    weekOffMap[selectedWeeks[i]] = patterns[i];
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
