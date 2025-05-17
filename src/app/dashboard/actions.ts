"use server";

import { generateWaterQualitySummary, type GenerateWaterQualitySummaryInput, type GenerateWaterQualitySummaryOutput } from "@/ai/flows/generate-water-quality-summary";
import { normalizeParameter as getNormalizedValue, calculateStatus, PARAMETER_THRESHOLDS, parameterDisplayNames } from "@/lib/water-quality-config";

export async function getAISummaryAction(
  input: GenerateWaterQualitySummaryInput
): Promise<GenerateWaterQualitySummaryOutput> {
  try {
    // Add a small delay to simulate network latency for demo purposes
    // await new Promise(resolve => setTimeout(resolve, 1500));
    const summary = await generateWaterQualitySummary(input);
    return summary;
  } catch (error) {
    console.error("Error getting AI summary:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    // Return a structured error response matching the output schema
    return {
      overallAssessment: `Failed to generate summary: ${errorMessage}`,
      detailedAnalysis: [],
      hourlyTrendAnalysis: {
        introduction: "Hourly trend analysis could not be performed due to an error.",
        parameterTrends: [],
      },
      instabilityDiagnosis: [],
      generalRecommendations: ["Please try generating the summary again later."],
    };
  }
}

export async function normalizeParameterAction(
  parameterId: string
): Promise<{ success: boolean; parameterName: string; newValue?: number; newStatus?: string; error?: string }> {
  try {
    // Add a small delay to simulate network latency
    // await new Promise(resolve => setTimeout(resolve, 500));
    
    if (!PARAMETER_THRESHOLDS[parameterId]) {
      return { success: false, parameterName: parameterId, error: "Invalid parameter ID." };
    }
    
    const newValue = getNormalizedValue(parameterId);
    const { status } = calculateStatus(parameterId, newValue);
    const displayName = parameterDisplayNames[parameterId] || parameterId;

    return { success: true, parameterName: displayName, newValue, newStatus: status };
  } catch (error) {
    console.error(`Error normalizing parameter ${parameterId}:`, error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return { success: false, parameterName: parameterId, error: `Failed to normalize: ${errorMessage}` };
  }
}
