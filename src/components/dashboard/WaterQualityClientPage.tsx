"use client";

import { useEffect, useState, useCallback } from "react";
import { Header } from "./Header";
import { ParameterCard } from "./ParameterCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { initialWaterParameters, calculateStatus, normalizeParameter as getNormalizedValue, parameterUnits, parameterDisplayNames } from "@/lib/water-quality-config";
import type { WaterParameterData, StructuredAISummary, HourlyTrend, InstabilityInfo } from "@/types";
import { getAISummaryAction, normalizeParameterAction } from "@/app/dashboard/actions";
import { useToast } from "@/hooks/use-toast";
import { Loader2, AlertTriangle, Sparkles, FileText, Thermometer, Droplet, Wind, Activity, BarChart3, Brain } from "lucide-react";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import type { GenerateWaterQualitySummaryInput } from "@/ai/flows/generate-water-quality-summary";

const MAX_HISTORY_LENGTH = 20; // For live graphs
const SIMULATION_INTERVAL = 3000; // 3 seconds for live graph updates
const STATUS_NOTIFICATION_INTERVAL = 30000; // 30 seconds for status change checks

export default function WaterQualityClientPage() {
  const router = useRouter();
  const [parameters, setParameters] = useState<WaterParameterData[]>(initialWaterParameters);
  const [aiSummary, setAiSummary] = useState<StructuredAISummary | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [isNormalizing, setIsNormalizing] = useState<Record<string, boolean>>({});
  const [lastNotifiedStatus, setLastNotifiedStatus] = useState<Record<string, string>>({});

  const { toast } = useToast();

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      router.replace("/login");
    }
  }, [router]);

  // Initialize lastNotifiedStatus
  useEffect(() => {
    const initialStatuses: Record<string, string> = {};
    initialWaterParameters.forEach(p => {
      initialStatuses[p.id] = p.status;
    });
    setLastNotifiedStatus(initialStatuses);
  }, []);


  // Simulate live sensor data updates for graphs
  useEffect(() => {
    const intervalId = setInterval(() => {
      setParameters((prevParams) =>
        prevParams.map((param) => {
          let newValue = param.value;
          // Simulate fluctuation: up to 5% of a typical range for each parameter
          const fluctuationRange = param.id === 'ph' ? 0.2 : (param.id === 'salinity' ? 2 : (param.id === 'do' ? 0.5 : 1));
          const fluctuation = (Math.random() - 0.5) * fluctuationRange;
          newValue += fluctuation;

          // Clamp values to realistic ranges
          if (param.id === 'ph') newValue = Math.max(0, Math.min(14, newValue));
          else if (param.id === 'salinity') newValue = Math.max(0, Math.min(50, newValue));
          else if (param.id === 'do') newValue = Math.max(0, Math.min(20, newValue));
          else if (param.id === 'temperature') newValue = Math.max(0, Math.min(40, newValue));
          
          const newHistory = [...param.valueHistory, newValue].slice(-MAX_HISTORY_LENGTH);
          
          return { ...param, value: newValue, valueHistory: newHistory };
        })
      );
    }, SIMULATION_INTERVAL);
    return () => clearInterval(intervalId);
  }, []);

  // Update status and check for notifications periodically
   useEffect(() => {
    const statusUpdateIntervalId = setInterval(() => {
      let statusChanges: Array<{ name: string, oldStatus: string, newStatus: string}> = [];
      
      setParameters(prevParams => {
        const updatedParams = prevParams.map(param => {
          const { status: newStatus, color: newColor } = calculateStatus(param.id, param.value);
          if (newStatus !== param.status && newStatus !== lastNotifiedStatus[param.id]) {
             statusChanges.push({ name: param.name, oldStatus: lastNotifiedStatus[param.id] || param.status, newStatus });
          }
          return { ...param, status: newStatus, color: newColor };
        });
        return updatedParams;
      });

      if (statusChanges.length > 0) {
        const changedParamDetails = statusChanges.map(s => `${s.name} changed to ${s.newStatus}`).join(', ');
        setTimeout(() => { // Defer toast to avoid React warning during render
          toast({
            title: "Water Quality Alert",
            description: `Status updated: ${changedParamDetails}.`,
            variant: "default",
            duration: 5000,
          });
        }, 0);
        
        const newLastStatuses: Record<string, string> = {...lastNotifiedStatus};
        statusChanges.forEach(change => {
            newLastStatuses[change.name.toLowerCase().replace(/\s+/g, '')] = change.newStatus; // Assuming param.id is like this
        });
         setLastNotifiedStatus(prev => {
            const updated = {...prev};
            statusChanges.forEach(s => {
                const paramId = initialWaterParameters.find(p => p.name === s.name)?.id;
                if (paramId) updated[paramId] = s.newStatus;
            });
            return updated;
        });
      }
    }, STATUS_NOTIFICATION_INTERVAL);

    return () => clearInterval(statusUpdateIntervalId);
  }, [toast, lastNotifiedStatus]);


  const handleNormalizeParameter = useCallback(async (parameterId: string) => {
    setIsNormalizing(prev => ({ ...prev, [parameterId]: true }));
    const result = await normalizeParameterAction(parameterId);
    if (result.success && result.newValue !== undefined && result.newStatus) {
      setParameters((prevParams) =>
        prevParams.map((p) =>
          p.id === parameterId
            ? { ...p, value: result.newValue!, status: result.newStatus!, color: calculateStatus(parameterId, result.newValue!).color, valueHistory: [...p.valueHistory, result.newValue!].slice(-MAX_HISTORY_LENGTH) }
            : p
        )
      );
      toast({
        title: "Parameter Normalized",
        description: `${result.parameterName} has been reset to a normal value.`,
      });
    } else {
      toast({
        title: "Normalization Failed",
        description: result.error || `Could not normalize ${result.parameterName}.`,
        variant: "destructive",
      });
    }
    setIsNormalizing(prev => ({ ...prev, [parameterId]: false }));
  }, [toast]);

  const handleGenerateSummary = async () => {
    setIsLoadingSummary(true);
    setAiSummary(null);

    const aiInput: GenerateWaterQualitySummaryInput = parameters.reduce((acc, param) => {
      // Simulate recent hourly values for the AI
      // This is a simple simulation; a real app would fetch this from a database
      const recentHourlyValues: number[] = [];
      let lastVal = param.value;
      for (let i = 0; i < 3; i++) { // e.g., 3 previous hours
        const fluctuationRange = param.id === 'ph' ? 0.5 : (param.id === 'salinity' ? 5 : (param.id === 'do' ? 1 : 2));
        lastVal = lastVal + (Math.random() - 0.5) * fluctuationRange;
         // Clamp simulated hourly values
        if (param.id === 'ph') lastVal = Math.max(5, Math.min(9, lastVal)); // reasonable range for pH hourly
        else if (param.id === 'salinity') lastVal = Math.max(25, Math.min(45, lastVal));
        else if (param.id === 'do') lastVal = Math.max(3, Math.min(10, lastVal));
        else if (param.id === 'temperature') lastVal = Math.max(15, Math.min(35, lastVal));
        recentHourlyValues.unshift(parseFloat(lastVal.toFixed(2))); // Add to beginning, oldest first
      }
      
      acc[param.id as keyof GenerateWaterQualitySummaryInput] = {
        currentValue: parseFloat(param.value.toFixed(2)),
        status: param.status,
        recentHourlyValues: recentHourlyValues,
        unit: parameterUnits[param.id] || '',
      };
      return acc;
    }, {} as GenerateWaterQualitySummaryInput);
    
    const summaryResult = await getAISummaryAction(aiInput);
    
    // Adapt the AI flow's output to the StructuredAISummary type
    // This assumes summaryResult matches GenerateWaterQualitySummaryOutput
    if (summaryResult) {
       setAiSummary({
        overallAssessment: summaryResult.overallAssessment,
        detailedAnalysis: summaryResult.detailedAnalysis.map(da => ({
          parameter: parameterDisplayNames[da.parameter.toLowerCase().replace(/\s+/g, '')] || da.parameter, // Map to display name
          analysis: da.analysis
        })),
        hourlyTrendAnalysis: summaryResult.hourlyTrendAnalysis ? {
          introduction: summaryResult.hourlyTrendAnalysis.introduction,
          parameterTrends: summaryResult.hourlyTrendAnalysis.parameterTrends.map(pt => ({
            parameterName: parameterDisplayNames[pt.parameterName.toLowerCase().replace(/\s+/g, '')] || pt.parameterName,
            trendDescription: pt.trendDescription,
            averageHourlyChange: pt.averageHourlyChange
          }))
        } : undefined,
        instabilityDiagnosis: summaryResult.instabilityDiagnosis ? summaryResult.instabilityDiagnosis.map(id => ({
          parameterName: parameterDisplayNames[id.parameterName.toLowerCase().replace(/\s+/g, '')] || id.parameterName,
          problemDescription: id.problemDescription,
          possibleCauses: id.possibleCauses,
          basicRecommendations: id.basicRecommendations,
          predictiveInsights: id.predictiveInsights
        })) : undefined,
        generalRecommendations: summaryResult.generalRecommendations,
      });
    }

    setIsLoadingSummary(false);
  };
  
  const getIconForParameter = (paramId: string) => {
    switch(paramId) {
      case 'ph': return <Droplet className="mr-2 h-5 w-5 text-blue-500" />;
      case 'salinity': return <Activity className="mr-2 h-5 w-5 text-teal-500" />; // Using Activity for salinity variation
      case 'do': return <Wind className="mr-2 h-5 w-5 text-green-500" />;
      case 'temperature': return <Thermometer className="mr-2 h-5 w-5 text-red-500" />;
      default: return <FileText className="mr-2 h-5 w-5 text-gray-500" />;
    }
  };


  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <Header />
      <main className="flex-1 p-4 sm:p-6 md:p-8 container mx-auto">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
          {parameters.map((param) => (
            <ParameterCard
              key={param.id}
              parameter={param}
              onNormalize={handleNormalizeParameter}
              isNormalizing={!!isNormalizing[param.id]}
            />
          ))}
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
                <div>
                    <CardTitle className="text-2xl font-bold text-primary flex items-center">
                        <Brain className="mr-2 h-7 w-7"/> AI-Powered Water Quality Analysis
                    </CardTitle>
                    <CardDescription>
                        Get an intelligent summary of your water conditions and actionable insights.
                    </CardDescription>
                </div>
                <Button onClick={handleGenerateSummary} disabled={isLoadingSummary} size="lg">
                {isLoadingSummary ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                    <Sparkles className="mr-2 h-5 w-5" />
                )}
                Generate Full Analysis
                </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingSummary && (
              <div className="flex flex-col items-center justify-center p-10 text-muted-foreground">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <p className="text-lg">Generating your detailed water quality analysis...</p>
                <p>This may take a moment.</p>
              </div>
            )}
            {!isLoadingSummary && aiSummary && (
              <div className="space-y-6">
                <div className="p-4 border rounded-lg bg-background">
                  <h3 className="text-xl font-semibold text-primary mb-2 flex items-center"><FileText className="mr-2 h-5 w-5"/>Overall Assessment</h3>
                  <p className="text-foreground">{aiSummary.overallAssessment}</p>
                </div>

                {aiSummary.detailedAnalysis && aiSummary.detailedAnalysis.length > 0 && (
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="detailed-analysis">
                      <AccordionTrigger className="text-xl font-semibold text-primary hover:no-underline">
                        <div className="flex items-center"><Activity className="mr-2 h-5 w-5"/>Detailed Parameter Analysis</div>
                      </AccordionTrigger>
                      <AccordionContent className="pt-2 space-y-3">
                        {aiSummary.detailedAnalysis.map((item, index) => (
                          <div key={index} className="p-3 border rounded-md bg-background/50">
                            <h4 className="font-semibold text-md text-foreground flex items-center">
                              {getIconForParameter(item.parameter.toLowerCase().replace(" level", "").replace("dissolved oxygen", "do"))} 
                              {item.parameter}
                            </h4>
                            <p className="text-sm text-muted-foreground">{item.analysis}</p>
                          </div>
                        ))}
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                )}
                
                {aiSummary.hourlyTrendAnalysis && aiSummary.hourlyTrendAnalysis.parameterTrends.length > 0 && (
                   <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="hourly-trends">
                      <AccordionTrigger className="text-xl font-semibold text-primary hover:no-underline">
                        <div className="flex items-center"><BarChart3 className="mr-2 h-5 w-5"/>Hourly Trend Analysis</div>
                      </AccordionTrigger>
                      <AccordionContent className="pt-2 space-y-3">
                        <p className="text-sm text-muted-foreground mb-2">{aiSummary.hourlyTrendAnalysis.introduction}</p>
                        {aiSummary.hourlyTrendAnalysis.parameterTrends.map((trend: HourlyTrend, index: number) => (
                          <div key={index} className="p-3 border rounded-md bg-background/50">
                            <h4 className="font-semibold text-md text-foreground">{trend.parameterName}</h4>
                            <p className="text-sm text-muted-foreground">{trend.trendDescription}</p>
                            {trend.averageHourlyChange !== undefined && (
                                <p className="text-xs text-accent">Avg. Hourly Change: {trend.averageHourlyChange.toFixed(2)}</p>
                            )}
                          </div>
                        ))}
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                )}

                {aiSummary.instabilityDiagnosis && aiSummary.instabilityDiagnosis.length > 0 && (
                   <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="instability-diagnosis">
                      <AccordionTrigger className="text-xl font-semibold text-primary hover:no-underline">
                         <div className="flex items-center"><AlertTriangle className="mr-2 h-5 w-5 text-orange-500"/>Instability Diagnosis</div>
                      </AccordionTrigger>
                      <AccordionContent className="pt-2 space-y-4">
                        {aiSummary.instabilityDiagnosis.map((diag: InstabilityInfo, index: number) => (
                          <div key={index} className="p-3 border rounded-md bg-orange-500/10 border-orange-500/30">
                            <h4 className="font-semibold text-md text-orange-700">{diag.parameterName}</h4>
                            <p className="text-sm text-orange-600"><span className="font-medium">Problem:</span> {diag.problemDescription}</p>
                            <div className="mt-1">
                              <p className="text-xs text-orange-600 font-medium">Possible Causes:</p>
                              <ul className="list-disc list-inside text-xs text-orange-600">
                                {diag.possibleCauses.map((cause, i) => <li key={i}>{cause}</li>)}
                              </ul>
                            </div>
                            <div className="mt-1">
                              <p className="text-xs text-orange-600 font-medium">Recommendations:</p>
                              <ul className="list-disc list-inside text-xs text-orange-600">
                                {diag.basicRecommendations.map((rec, i) => <li key={i}>{rec}</li>)}
                              </ul>
                            </div>
                             {diag.predictiveInsights && <p className="text-xs text-orange-600 mt-1"><span className="font-medium">Predictions:</span> {diag.predictiveInsights}</p>}
                          </div>
                        ))}
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                )}

                {aiSummary.generalRecommendations && aiSummary.generalRecommendations.length > 0 && (
                  <div className="p-4 border rounded-lg bg-accent/10 border-accent/30">
                    <h3 className="text-xl font-semibold text-accent-foreground mb-2">General Recommendations</h3>
                    <ul className="list-disc list-inside space-y-1 text-foreground">
                      {aiSummary.generalRecommendations.map((rec, index) => (
                        <li key={index}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}

              </div>
            )}
            {!isLoadingSummary && !aiSummary && (
              <div className="text-center p-10 text-muted-foreground">
                <Sparkles className="mx-auto h-12 w-12 text-primary mb-4" />
                <p className="text-lg">Click the button above to generate your water quality analysis.</p>
                <p>The AI will provide insights based on current and historical data.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
