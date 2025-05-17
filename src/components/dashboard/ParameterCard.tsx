"use client";

import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { WaterParameterData } from "@/types";
import { LineChart, Line, ResponsiveContainer, YAxis, Tooltip as RechartsTooltip } from "recharts";
import { TrendingUp, SettingsBackupRestore } from "lucide-react";

interface ParameterCardProps {
  parameter: WaterParameterData;
  onNormalize: (parameterId: string) => void;
  isNormalizing: boolean;
}

export function ParameterCard({ parameter, onNormalize, isNormalizing }: ParameterCardProps) {
  const yAxisDomain = [
    Math.min(...parameter.valueHistory) - (parameter.id === 'ph' ? 0.5 : 5), // smaller adjustments for pH
    Math.max(...parameter.valueHistory) + (parameter.id === 'ph' ? 0.5 : 5),
  ];
  // Ensure domain is not NaN if history has identical values
  if (yAxisDomain[0] === yAxisDomain[1]) {
    yAxisDomain[0] -= (parameter.id === 'ph' ? 0.5 : 5);
    yAxisDomain[1] += (parameter.id === 'ph' ? 0.5 : 5);
  }


  return (
    <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-semibold text-primary">{parameter.name}</CardTitle>
        <span 
          className={`px-3 py-1 text-xs font-bold rounded-full ${parameter.color} ${parameter.color.replace('text-', 'bg-')}/10`}
        >
          {parameter.status}
        </span>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="flex items-end space-x-2 mb-2">
          <span className="text-4xl font-bold text-foreground">
            {parameter.value.toFixed(parameter.id === 'ph' ? 1 : 2)}
          </span>
          <span className="text-lg text-muted-foreground">{parameter.unit}</span>
        </div>
        <div className="h-20 w-full">
          {parameter.valueHistory && parameter.valueHistory.length > 1 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={parameter.valueHistory.map((val, i) => ({ name: i, value: val }))}>
                <defs>
                  <linearGradient id={`color-${parameter.id}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <YAxis domain={yAxisDomain} hide />
                 <RechartsTooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--popover))',
                    borderColor: 'hsl(var(--border))',
                    borderRadius: 'var(--radius)',
                    color: 'hsl(var(--popover-foreground))',
                    fontSize: '0.875rem', 
                  }}
                  itemStyle={{ color: 'hsl(var(--popover-foreground))' }}
                  formatter={(value: number) => [`${value.toFixed(2)} ${parameter.unit}`, parameter.name]}
                  labelFormatter={() => ''}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="hsl(var(--accent))"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: 'hsl(var(--primary))', stroke: 'hsl(var(--primary))' }}
                  fillOpacity={1} 
                  fill={`url(#color-${parameter.id})`}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <TrendingUp className="mr-2 h-5 w-5" />
              <span>Awaiting more data...</span>
            </div>
          )}
        </div>
      </CardContent>
       {parameter.status !== "Normal" && (
        <CardFooter>
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full text-accent-foreground border-accent hover:bg-accent/10"
            onClick={() => onNormalize(parameter.id)}
            disabled={isNormalizing}
          >
            <SettingsBackupRestore className="mr-2 h-4 w-4" />
            Normalize {parameter.name}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
