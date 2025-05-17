
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
  recentHourlyValues: z.array(z.number()).optional().describe('An array of recent hourly values for this parameter, if available. Oldest to newest, ideally covering several hours or days for trend analysis.'),
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

const WeeklySensorReadingSchema = z.object({
  day: z.string().describe("Day of the week or specific date for the reading (e.g., 'Monday', '2023-10-26')."),
  avgPh: z.number().optional().describe("Average pH for the day. Null if data unavailable."),
  avgSalinity: z.number().optional().describe("Average Salinity (ppt) for the day. Null if data unavailable."),
  avgDo: z.number().optional().describe("Average Dissolved Oxygen (mg/L) for the day. Null if data unavailable."),
  avgTemperature: z.number().optional().describe("Average Temperature (°C) for the day. Null if data unavailable."),
  notes: z.string().optional().describe("Any notable observations or summary for this day's readings (e.g., 'pH spiked briefly')."),
});

const WeeklyRecapSchema = z.object({
  recapTitle: z.string().describe("Title for the weekly recap section, e.g., 'Weekly Sensor Data Summary'."),
  sensorDataTable: z.array(WeeklySensorReadingSchema).describe("An array of daily sensor readings, ideally for the past 7 days. If data is insufficient for a full week, summarize available daily data and note the period covered. Each item should represent one day."),
  graphicalTrendSummary: z.string().describe("A textual summary describing the overall trends of key parameters (pH, Salinity, DO, Temperature) over the recapped period, as if narrating a multi-line graph. Highlight significant increases, decreases, stability, or fluctuations. For example: 'Over the past week, pH levels remained relatively stable around 7.2, while temperature showed a gradual increase from 24°C to 26°C. Dissolved oxygen experienced a dip mid-week but recovered.'"),
  dataSufficiencyNote: z.string().optional().describe("A note on data sufficiency if a full weekly recap cannot be generated (e.g., 'Data available for the past 3 days only. Weekly trends are based on this period.')."),
});

const GenerateWaterQualitySummaryOutputSchema = z.object({
  overallAssessment: z.string().describe('A high-level, plain-English overview of the current water quality.'),
  detailedAnalysis: z.array(DetailedAnalysisSchema).describe("An array providing detailed analysis for each water parameter based on its current value and status."),
  hourlyTrendAnalysis: z.object({
    introduction: z.string().describe("A brief introduction to the hourly trend analysis section."),
    parameterTrends: z.array(HourlyTrendSchema).describe("An array describing the observed hourly trend for each parameter based on recentHourlyValues. If no hourly data, this can be an empty array or state that data is unavailable."),
  }).optional().describe("Analysis of trends based on recent hourly values. Describe as if explaining a visual graph."),
  instabilityDiagnosis: z.array(InstabilityDiagnosisSchema).optional().describe("Diagnosis for parameters showing significant instability based on hourly trends. If all parameters are stable or hourly data is insufficient, this can be an empty array or state that no major instabilities were detected."),
  weeklyRecap: WeeklyRecapSchema.optional().describe("A recap of sensor data, ideally for the past week, presented with data for a table and a textual description of graphical trends. If less than a week's data is available from recentHourlyValues, base the recap on the available data and mention the shorter timeframe."),
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
Your task is to provide a comprehensive summary based on the provided water quality data. The 'recentHourlyValues' field for each parameter contains data points that can be used to infer daily averages and weekly trends if enough data is present (e.g., 24 points = 1 day, 168 points = 1 week). Assume these hourly values are sequential and represent the most recent period leading up to the 'currentValue'.

Current Water Quality Parameters:
- pH Level: Current Value: {{{ph.currentValue}}} (Unit: {{{ph.unit}}}), Status: {{{ph.status}}}
  Recent Hourly pH Values (oldest to newest, if available): {{#if ph.recentHourlyValues}} (contains {{ph.recentHourlyValues.length}} data points) {{else}} Not Available {{/if}}
- Salinity: Current Value: {{{salinity.currentValue}}} (Unit: {{{salinity.unit}}}), Status: {{{salinity.status}}}
  Recent Hourly Salinity Values (oldest to newest, if available): {{#if salinity.recentHourlyValues}} (contains {{salinity.recentHourlyValues.length}} data points) {{else}} Not Available {{/if}}
- Dissolved Oxygen (DO): Current Value: {{{do.currentValue}}} (Unit: {{{do.unit}}}), Status: {{{do.status}}}
  Recent Hourly DO Values (oldest to newest, if available): {{#if do.recentHourlyValues}} (contains {{do.recentHourlyValues.length}} data points) {{else}} Not Available {{/if}}
- Temperature: Current Value: {{{temperature.currentValue}}} (Unit: {{{temperature.unit}}}), Status: {{{temperature.status}}}
  Recent Hourly Temperature Values (oldest to newest, if available): {{#if temperature.recentHourlyValues}} (contains {{temperature.recentHourlyValues.length}} data points) {{else}} Not Available {{/if}}

Please generate the following structured analysis:

1.  **Overall Assessment**: A high-level, plain-English overview of the current water quality.

2.  **Detailed Analysis (for each parameter)**:
    For each parameter (pH, Salinity, DO, Temperature), provide a specific analysis covering:
    - Its current value and status.
    - Potential implications of this status (e.g., for aquatic life, system health).
    - Briefly mention common causes if the status is not 'Normal'.

3.  **Hourly Trend Analysis (if recentHourlyValues are provided and sufficient)**:
    - Introduction: Briefly state that this section analyzes short-term hourly trends if data is present.
    - For each parameter with hourly data:
        - Describe the trend textually (e.g., "stable", "slight increase", "fluctuating"). Imagine you are describing a line graph of these values over the last few hours.
        - If possible and relevant, mention the average hourly change or rate of change.
    - If hourly data is insufficient for meaningful short-term trends for a parameter, state that.

4.  **Instability Diagnosis (if significant instabilities are detected from hourly trends)**:
    - If any parameters show significant or concerning instability from their hourly trends:
        - Identify the parameter.
        - Describe the problem observed from its hourly trend.
        - List 2-3 possible causes for this instability.
        - Suggest 2-3 basic recommendations or investigation steps to address it.
        - Optionally, provide predictive insights on what might happen if the instability continues.
    - If all parameters are stable or hourly data is insufficient for this diagnosis, state that clearly.

5.  **Weekly Sensor Data Recap (based on recentHourlyValues if available)**:
    - Title: Provide a suitable title like "Weekly Sensor Data Summary" or "Sensor Data Recap (Past X Days)" if less than a week's data.
    - Data Sufficiency Note: If 'recentHourlyValues' represent less than 7 days of data (e.g., less than 168 hourly points), explicitly state the period covered (e.g., "Based on data from the last 3 days."). If data is very sparse (e.g. less than 24 hourly points total), state that a weekly/daily recap is not possible.
    - Sensor Data Table:
        - Provide an array of objects, where each object represents a day.
        - For each day, calculate/estimate average values for pH, Salinity, DO, and Temperature using the hourly data. If hourly data for a specific parameter is not available for a day, its average can be null or omitted.
        - Include a 'day' field (e.g., "Day 1", "Day 2", or specific dates if they can be inferred). If inferring days, assume the last data point in recentHourlyValues is from "Today" or the most recent day.
        - Include a 'notes' field for any brief daily observations.
    - Graphical Trend Summary:
        - Provide a textual summary describing the overall trends of key parameters (pH, Salinity, DO, Temperature) over the recapped period (e.g., "Over the past week, pH levels showed a slight increase..."). This should be a narrative describing a visual line graph.

Ensure your language is clear, concise, and easy for a non-expert to understand, but also scientifically sound.
Focus on providing actionable insights where appropriate (instability diagnosis).
Structure your output strictly according to the defined JSON schema for GenerateWaterQualitySummaryOutput.
If hourly data is not available for a parameter, state that in the trend analysis for that parameter.
If hourly data is insufficient for any substantial part of the analysis (e.g. weekly recap), clearly state this limitation.
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
        return {
          overallAssessment: "AI analysis could not be completed at this time. Please check parameter inputs.",
          detailedAnalysis: [],
          hourlyTrendAnalysis: {
            introduction: "Hourly trend data was not fully processed.",
            parameterTrends: [],
          },
          instabilityDiagnosis: [],
          weeklyRecap: {
            recapTitle: "Weekly Recap Not Available",
            sensorDataTable: [],
            graphicalTrendSummary: "Insufficient data for weekly graphical trend summary.",
            dataSufficiencyNote: "AI analysis could not determine data sufficiency for weekly recap.",
          },
        };
      }
      return {
        overallAssessment: output.overallAssessment || "No overall assessment provided.",
        detailedAnalysis: output.detailedAnalysis || [],
        hourlyTrendAnalysis: output.hourlyTrendAnalysis || {
          introduction: "Hourly trend analysis not available or data insufficient.",
          parameterTrends: [],
        },
        instabilityDiagnosis: output.instabilityDiagnosis || [],
        weeklyRecap: output.weeklyRecap || {
            recapTitle: "Weekly Recap Data Incomplete",
            sensorDataTable: [],
            graphicalTrendSummary: "Graphical trend summary could not be generated.",
            dataSufficiencyNote: "Data for weekly recap may be incomplete.",
        },
      };
    } catch (error) {
      console.error("Error in generateWaterQualitySummaryFlow:", error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during AI processing.";
      return {
        overallAssessment: `AI analysis failed: ${errorMessage}`,
        detailedAnalysis: [],
        hourlyTrendAnalysis: {
          introduction: "Hourly trend analysis could not be performed due to an error.",
          parameterTrends: [],
        },
        instabilityDiagnosis: [],
        weeklyRecap: {
            recapTitle: "Weekly Recap Failed",
            sensorDataTable: [],
            graphicalTrendSummary: `Error generating graphical trend summary: ${errorMessage}`,
            dataSufficiencyNote: "An error occurred while processing data for the weekly recap.",
        },
      };
    }
  }
);

    