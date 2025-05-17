
import type { GenerateWaterQualitySummaryOutput } from "@/ai/flows/generate-water-quality-summary";

export interface User {
  id: string;
  email: string;
  name?: string;
  photoUrl?: string; // Added for profile picture
  idNumber?: string; // Added for NIK/NIM/NIP
}

export interface ParameterThresholds {
  normalMin: number;
  normalMax: number;
  // Specific thresholds for different statuses if more complex logic is needed
  low?: number;
  high?: number;
  tooAcidic?: number;
  tooAlkaline?: number;
  cold?: number;
  warm?: number;
}

export interface WaterParameterData {
  id: string;
  name: string;
  value: number;
  unit: string;
  status: string;
  color: string;
  valueHistory: number[]; // For the small graph
  thresholds: ParameterThresholds;
  recentHourlyValues?: number[]; // For AI summary generation
}

// Mirroring the structured AI output
export type AISummary = GenerateWaterQualitySummaryOutput;

export interface HourlyTrend {
  parameterName: string;
  trendDescription: string;
  averageHourlyChange?: number;
}

export interface InstabilityInfo {
  parameterName: string;
  problemDescription: string;
  possibleCauses: string[];
  basicRecommendations: string[];
  predictiveInsights?: string;
}

// Types for the Monthly Recap structure
export interface DailySensorReading {
  day: string;
  avgPh?: number | null;
  avgSalinity?: number | null;
  avgDo?: number | null;
  avgTemperature?: number | null;
  notes?: string;
}

export interface MonthlyRecap {
  recapTitle: string;
  sensorDataTable: DailySensorReading[];
  graphicalTrendSummary: string;
  dataSufficiencyNote?: string;
}

// Used for client-side AI summary state
export interface StructuredAISummary {
  overallAssessment: string;
  detailedAnalysis: Array<{ parameter: string; analysis: string }>;
  hourlyTrendAnalysis?: {
    introduction: string;
    parameterTrends: HourlyTrend[];
  };
  instabilityDiagnosis?: InstabilityInfo[];
  monthlyRecap?: MonthlyRecap;
}

    