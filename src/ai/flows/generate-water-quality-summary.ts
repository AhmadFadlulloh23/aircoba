'use server';
/**
 * @fileOverview A water quality summary AI agent.
 *
 * - generateWaterQualitySummary - A function that handles the water quality summary process.
 * - GenerateWaterQualitySummaryInput - The input type for the generateWaterQualitySummary function.
 * - GenerateWaterQualitySummaryOutput - The return type for the generateWaterQualitySummary function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ParameterDetailSchema = z.object({
  currentValue: z.number().describe('The current measured value of the parameter.'),
  status: z.string().describe('The current status of the parameter (e.g., Normal, Low, High, Too Acidic).'),
  recentHourlyValues: z.array(z.number()).optional().describe('An array of recent hourly values for this parameter, if available. Oldest to newest.'),
  unit: z.string().describe('The unit of measurement for this parameter (e.g., pH, ppt, mg/L, °C).'),
});

const GenerateWaterQualitySummaryInputSchema = z.object({
  ph: ParameterDetailSchema.describe('Details for pH Level.'),
  salinity: ParameterDetailSchema.describe('Details for Salinity.'),
  do: ParameterDetailSchema.describe('Details for Dissolved Oxygen (DO).'),
  temperature: ParameterDetailSchema.describe('Details for Temperature.'),
});
export type GenerateWaterQualitySummaryInput = z.infer<typeof GenerateWaterQualitySummaryInputSchema>;

const DetailedAnalysisSchema = z.object({
  parameter: z.string().describe("The name of the parameter being analyzed (e.g., pH Level, Salinity)."),
  analysis: z.string().describe("A detailed plain-English analysis of this specific parameter's current condition and implications."),
});

const HourlyTrendSchema = z.object({
  parameterName: z.string().describe("The name of the parameter (e.g., pH Level, Salinity)."),
  trendDescription: z.string().describe("A textual description of the hourly trend (e.g., 'pH has been stable', 'Temperature shows a slight upward trend')."),
  averageHourlyChange: z.number().optional().describe("The average change per hour, if calculable and significant."),
});

const InstabilityDiagnosisSchema = z.object({
  parameterName: z.string().describe("The name of the unstable parameter."),
  problemDescription: z.string().describe("A description of the instability observed from hourly trends."),
  possibleCauses: z.array(z.string()).describe("A list of possible causes for this instability."),
  basicRecommendations: z.array(z.string()).describe("A list of basic recommendations or investigation steps."),
  predictiveInsights: z.string().optional().describe("Potential future implications or predictions if the instability is not addressed."),
});

const GenerateWaterQualitySummaryOutputSchema = z.object({
  overallAssessment: z.string().describe('A high-level, plain-English overview of the current water quality.'),
  detailedAnalysis: z.array(DetailedAnalysisSchema).describe("An array providing detailed analysis for each water parameter based on its current value and status."),
  hourlyTrendAnalysis: z.object({
    introduction: z.string().describe("A brief introduction to the hourly trend analysis section."),
    parameterTrends: z.array(HourlyTrendSchema).describe("An array describing the observed hourly trend for each parameter based on recentHourlyValues. If no hourly data, this can be an empty array or state that data is unavailable."),
  }).optional().describe("Analysis of trends based on recent hourly values. Describe as if explaining a visual graph."),
  instabilityDiagnosis: z.array(InstabilityDiagnosisSchema).optional().describe("Diagnosis for parameters showing significant instability based on hourly trends. If all parameters are stable or hourly data is insufficient, this can be an empty array or state that no major instabilities were detected."),
  generalRecommendations: z.array(z.string()).describe('General, actionable recommendations based on the overall water quality assessment, current values, and observed trends.'),
});
export type GenerateWaterQualitySummaryOutput = z.infer<typeof GenerateWaterQualitySummaryOutputSchema>;


export async function generateWaterQualitySummary(input: GenerateWaterQualitySummaryInput): Promise<GenerateWaterQualitySummaryOutput> {
  return generateWaterQualitySummaryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateWaterQualitySummaryPrompt',
  input: {schema: GenerateWaterQualitySummaryInputSchema},
  output: {schema: GenerateWaterQualitySummaryOutputSchema},
  prompt: `You are an expert water quality analyst for aquaculture or environmental monitoring.
Your task is to provide a comprehensive summary based on the provided water quality data.

Current Water Quality Parameters:
- pH Level: Current Value: {{{ph.currentValue}}} (Unit: {{{ph.unit}}}), Status: {{{ph.status}}}
  Recent Hourly pH Values (oldest to newest): {{#if ph.recentHourlyValues}} {{{json ph.recentHourlyValues}}} {{else}} Not Available {{/if}}
- Salinity: Current Value: {{{salinity.currentValue}}} (Unit: {{{salinity.unit}}}), Status: {{{salinity.status}}}
  Recent Hourly Salinity Values (oldest to newest): {{#if salinity.recentHourlyValues}} {{{json salinity.recentHourlyValues}}} {{else}} Not Available {{/if}}
- Dissolved Oxygen (DO): Current Value: {{{do.currentValue}}} (Unit: {{{do.unit}}}), Status: {{{do.status}}}
  Recent Hourly DO Values (oldest to newest): {{#if do.recentHourlyValues}} {{{json do.recentHourlyValues}}} {{else}} Not Available {{/if}}
- Temperature: Current Value: {{{temperature.currentValue}}} (Unit: {{{temperature.unit}}}), Status: {{{temperature.status}}}
  Recent Hourly Temperature Values (oldest to newest): {{#if temperature.recentHourlyValues}} {{{json temperature.recentHourlyValues}}} {{else}} Not Available {{/if}}

Please generate the following structured analysis:

1.  **Overall Assessment**: A high-level, plain-English overview of the current water quality.

2.  **Detailed Analysis (for each parameter)**:
    For each parameter (pH, Salinity, DO, Temperature), provide a specific analysis covering:
    - Its current value and status.
    - Potential implications of this status (e.g., for aquatic life, system health).
    - Briefly mention common causes if the status is not 'Normal'.

3.  **Hourly Trend Analysis (if recentHourlyValues are provided)**:
    - Introduction: Briefly state that this section analyzes hourly trends.
    - For each parameter with hourly data:
        - Describe the trend textually (e.g., "stable", "slight increase", "fluctuating"). Imagine you are describing a line graph of these values over the last few hours.
        - If possible and relevant, mention the average hourly change or rate of change.

4.  **Instability Diagnosis (if significant instabilities are detected from hourly trends)**:
    - If any parameters show significant or concerning instability (e.g., rapid changes, consistently out of normal range based on trends):
        - Identify the parameter.
        - Describe the problem observed from its hourly trend.
        - List 2-3 possible causes for this instability.
        - Suggest 2-3 basic recommendations or investigation steps to address it.
        - Optionally, provide predictive insights on what might happen if the instability continues.
    - If all parameters are stable or hourly data is insufficient for this diagnosis, state that clearly (e.g., "No major instabilities detected from available hourly data.").

5.  **General Recommendations**:
    - Provide 2-4 general, actionable recommendations based on the overall assessment, current values, and any observed trends. These should be practical steps the user can take.

Ensure your language is clear, concise, and easy for a non-expert to understand, but also scientifically sound.
Focus on providing actionable insights.
Structure your output strictly according to the defined JSON schema for GenerateWaterQualitySummaryOutput.
If hourly data is not available for a parameter, state that in the trend analysis for that parameter.
If hourly data is not available for any parameter, the hourlyTrendAnalysis and instabilityDiagnosis sections should reflect this (e.g., by stating data is insufficient).
`,
});

const generateWaterQualitySummaryFlow = ai.defineFlow(
  {
    name: 'generateWaterQualitySummaryFlow',
    inputSchema: GenerateWaterQualitySummaryInputSchema,
    outputSchema: GenerateWaterQualitySummaryOutputSchema,
  },
  async (input) => {
    try {
      const {output} = await prompt(input);
      if (!output) {
        // Fallback or default structure if AI output is unexpectedly null
        // This helps ensure the function always returns something matching the schema.
        return {
          overallAssessment: "AI analysis could not be completed at this time. Please check parameter inputs.",
          detailedAnalysis: [],
          hourlyTrendAnalysis: {
            introduction: "Hourly trend data was not fully processed.",
            parameterTrends: [],
          },
          instabilityDiagnosis: [],
          generalRecommendations: ["Verify sensor readings and ensure all data is being correctly reported."],
        };
      }
      // Ensure all parts of the output schema are present, even if empty arrays/default text
      return {
        overallAssessment: output.overallAssessment || "No overall assessment provided.",
        detailedAnalysis: output.detailedAnalysis || [],
        hourlyTrendAnalysis: output.hourlyTrendAnalysis || {
          introduction: "Hourly trend analysis not available or data insufficient.",
          parameterTrends: [],
        },
        instabilityDiagnosis: output.instabilityDiagnosis || [],
        generalRecommendations: output.generalRecommendations || ["No specific recommendations at this time."],
      };
    } catch (error) {
      console.error("Error in generateWaterQualitySummaryFlow:", error);
      // Construct a more detailed error-case output matching the schema
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during AI processing.";
      return {
        overallAssessment: `AI analysis failed: ${errorMessage}`,
        detailedAnalysis: [],
        hourlyTrendAnalysis: {
          introduction: "Hourly trend analysis could not be performed due to an error.",
          parameterTrends: [],
        },
        instabilityDiagnosis: [],
        generalRecommendations: ["An error occurred while generating the summary. Please try again later or check system logs."],
      };
    }
  }
);
