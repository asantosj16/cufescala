
export enum ShiftType {
  M56 = 'M56', // 07:30–15:30 (8h)
  T6 = 'T6',   // 13:00–21:00 (8h)
  S178 = '178', // 07:30–12:30 (5h)
  T94 = 'T94', // 15:30–20:30 (5h)
  M151 = 'M151', // 11:30–19:30 (8h)
  DS = 'DS',   // Descanso
  F = 'F',     // Férias
  FP = 'FP'    // Feriado Público
}

export type StaffName = 'Cláudia' | 'Irene' | 'Licínia';

export enum RotationType {
  ALTERNATING = 'Alternante (M/T)',
  FIXED_MORNING = 'Fixo Manhã',
  FIXED_AFTERNOON = 'Fixo Tarde',
  WEEKEND_COVER = 'Cobertura Fim de Semana'
}

export type OffDayGroup = 'DS1' | 'DS2' | 'DS3' | 'CUSTOM';

export interface StaffConfig {
  rotation: RotationType;
  offDayGroup: OffDayGroup;
  startShift: ShiftType.M56 | ShiftType.T6; // Para alternantes, qual inicia na semana de referência
}

export interface DailyShift {
  staffId: StaffName;
  date: string; // ISO format YYYY-MM-DD
  shift: ShiftType;
}

export interface CustomOverrides {
  [key: string]: ShiftType;
}
