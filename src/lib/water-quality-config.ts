import type { WaterParameterData, ParameterThresholds } from '@/types';

export const PARAMETER_THRESHOLDS: Record<string, ParameterThresholds> = {
  ph: { normalMin: 6.5, normalMax: 8.5, tooAcidic: 6.49, tooAlkaline: 8.51 },
  salinity: { normalMin: 32.0, normalMax: 38.0, low: 31.99, high: 38.01 },
  do: { normalMin: 5.5, normalMax: 7.5, low: 5.49, high: 7.51 }, // Dissolved Oxygen
  temperature: { normalMin: 22.0, normalMax: 28.0, cold: 21.99, warm: 28.01 },
};

export function calculateStatus(parameterId: string, value: number): { status: string; color: string } {
  const thresholds = PARAMETER_THRESHOLDS[parameterId];
  if (!thresholds) return { status: 'Unknown', color: 'text-gray-500' };

  switch (parameterId) {
    case 'ph':
      if (value < thresholds.normalMin) return { status: 'Too Acidic', color: 'text-orange-500' };
      if (value > thresholds.normalMax) return { status: 'Too Alkaline', color: 'text-purple-500' };
      return { status: 'Normal', color: 'text-green-500' };
    case 'salinity':
      if (value < thresholds.normalMin) return { status: 'Low', color: 'text-blue-500' };
      if (value > thresholds.normalMax) return { status: 'High', color: 'text-red-500' };
      return { status: 'Normal', color: 'text-green-500' };
    case 'do':
      if (value < thresholds.normalMin) return { status: 'Low', color: 'text-yellow-500' };
      if (value > thresholds.normalMax) return { status: 'High', color: 'text-red-500' }; // High DO can also be an issue
      return { status: 'Normal', color: 'text-green-500' };
    case 'temperature':
      if (value < thresholds.normalMin) return { status: 'Cold', color: 'text-blue-400' };
      if (value > thresholds.normalMax) return { status: 'Warm', color: 'text-red-400' };
      return { status: 'Normal', color: 'text-green-500' };
    default:
      return { status: 'Normal', color: 'text-green-500' };
  }
}

export const initialWaterParameters: WaterParameterData[] = [
  {
    id: 'ph',
    name: 'pH Level',
    value: 7.2,
    unit: '',
    status: 'Normal',
    color: 'text-green-500',
    valueHistory: Array(15).fill(7.2),
    thresholds: PARAMETER_THRESHOLDS.ph,
  },
  {
    id: 'salinity',
    name: 'Salinity',
    value: 35.5,
    unit: 'ppt',
    status: 'Normal',
    color: 'text-green-500',
    valueHistory: Array(15).fill(35.5),
    thresholds: PARAMETER_THRESHOLDS.salinity,
  },
  {
    id: 'do',
    name: 'Dissolved Oxygen',
    value: 6.8,
    unit: 'mg/L',
    status: 'Normal',
    color: 'text-green-500',
    valueHistory: Array(15).fill(6.8),
    thresholds: PARAMETER_THRESHOLDS.do,
  },
  {
    id: 'temperature',
    name: 'Temperature',
    value: 25.0,
    unit: '°C',
    status: 'Normal',
    color: 'text-green-500',
    valueHistory: Array(15).fill(25.0),
    thresholds: PARAMETER_THRESHOLDS.temperature,
  },
];

export function normalizeParameter(parameterId: string): number {
  switch (parameterId) {
    case 'ph': return 7.0;
    case 'salinity': return 35.0;
    case 'do': return 6.5;
    case 'temperature': return 25.0;
    default: return 0;
  }
}

export const parameterUnits: Record<string, string> = {
  ph: '',
  salinity: 'ppt',
  do: 'mg/L',
  temperature: '°C',
};

export const parameterDisplayNames: Record<string, string> = {
  ph: 'pH Level',
  salinity: 'Salinity',
  do: 'Dissolved Oxygen',
  temperature: 'Temperature',
};
