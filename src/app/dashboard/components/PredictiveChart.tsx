"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface PredictiveChartProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any; // Trajectory from What-If scenario engine or legacy forecast
}

export default function PredictiveChart({ data }: PredictiveChartProps) {
  if (!data) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-zinc-600">
        <p className="text-sm">Awaiting simulation...</p>
        <p className="text-xs mt-1 text-zinc-700">Ask the AI a what-if question or select a scenario to compare trajectories.</p>
      </div>
    );
  }

  // Check if this is our full What-If trajectory dataset
  const hasTrajectory = Boolean(data.trajectory && Array.isArray(data.trajectory) && data.trajectory.length > 0);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let chartData: any[] = [];

  if (hasTrajectory) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    chartData = data.trajectory.map((pt: any) => ({
      year: pt.year === 0 ? "Today" : `Yr ${pt.year}`,
      age: pt.age,
      baseline: pt.baseline_expected,
      scenario: pt.modified_expected,
      baselineWorst: pt.baseline_worst,
      scenarioWorst: pt.modified_worst,
      target: pt.target_corpus,
    }));
  } else {
    // Legacy 2-point fallback
    chartData = [
      {
        year: "Today",
        baseline: data.total_principal_invested || 0,
        scenario: data.total_principal_invested || 0,
        target: data.total_principal_invested || 0,
      },
      {
        year: "Target Date",
        baseline: data.expected_50th_percentile || 0,
        scenario: data.expected_50th_percentile || 0,
        target: data.median_inflated_target || 0,
      }
    ];
  }

  const formatYAxis = (tickItem: number) => {
    if (tickItem === 0) return "0";
    if (tickItem >= 10000000) return `₹${(tickItem / 10000000).toFixed(1)}Cr`;
    return `₹${(tickItem / 100000).toFixed(0)}L`;
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-lg shadow-xl text-xs z-50">
          <p className="font-semibold text-zinc-200 mb-2 border-b border-zinc-800 pb-1">{label}</p>
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {payload.map((p: any) => (
            <div key={p.dataKey} className="flex items-center justify-between gap-4 mb-1">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                <span className="text-zinc-400 capitalize">{p.name || p.dataKey}:</span>
              </div>
              <span className="font-mono font-medium text-zinc-100">
                ₹{new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(p.value)}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
        <XAxis 
          dataKey="year" 
          stroke="#52525b" 
          fontSize={11} 
          tickLine={false} 
          axisLine={false} 
          dy={10}
        />
        <YAxis 
          stroke="#52525b" 
          fontSize={11} 
          tickLine={false} 
          axisLine={false}
          tickFormatter={formatYAxis}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend 
          wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }}
          iconType="plainline"
        />
        
        {/* Target Inflation Corpus Line */}
        <Line 
          type="monotone" 
          dataKey="target" 
          name="Inflated Target"
          stroke="#3b82f6" 
          strokeWidth={2} 
          strokeDasharray="4 4" 
          dot={false}
        />
        
        {/* Baseline Plan Line (No Loan) */}
        <Line 
          type="monotone" 
          dataKey="baseline" 
          name="Baseline Plan"
          stroke="#10b981" 
          strokeWidth={2.5} 
          dot={false}
          activeDot={{ r: 5, fill: "#10b981", stroke: "#fff" }}
        />
        
        {/* Modified Scenario Line (With Decision/Car Loan) */}
        <Line 
          type="monotone" 
          dataKey="scenario" 
          name="Scenario (With Loan)"
          stroke="#f59e0b" 
          strokeWidth={2.5} 
          dot={false}
          activeDot={{ r: 5, fill: "#f59e0b", stroke: "#fff" }}
        />

        {hasTrajectory && (
          <>
            <Line 
              type="monotone" 
              dataKey="baselineWorst" 
              name="Baseline 10th %ile"
              stroke="#059669" 
              strokeWidth={1} 
              strokeDasharray="2 2"
              dot={false}
            />
            <Line 
              type="monotone" 
              dataKey="scenarioWorst" 
              name="Scenario 10th %ile"
              stroke="#dc2626" 
              strokeWidth={1} 
              strokeDasharray="2 2"
              dot={false}
            />
          </>
        )}
      </LineChart>
    </ResponsiveContainer>
  );
}
