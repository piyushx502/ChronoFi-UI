"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface PredictiveChartProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any; // The JSON data bubbled up from the AI tool call
}

export default function PredictiveChart({ data }: PredictiveChartProps) {
  if (!data) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-zinc-600">
        <p className="text-sm">Awaiting simulation...</p>
        <p className="text-xs mt-1 text-zinc-700">Ask the AI a question to trigger the LSTM engine.</p>
      </div>
    );
  }

  // Parse the data. If the AI returned the exact string block, we'd need to parse it.
  // Assuming `data` is the JSON object: 
  // { expected_50th_percentile: 4215696.44, worst_case_10th_percentile: 4136790.22, median_inflated_target: 8954238.48, total_principal_invested: 2900000 }
  
  // Since we only have final numbers, we'll draw a straight line from Year 0 (Principal) to Year X (Final)
  // In a real app, the backend would return the full array of 120 months.
  const chartData = [
    {
      year: "Today",
      expected: data.total_principal_invested || 0,
      worst: data.total_principal_invested || 0,
      target: data.total_principal_invested || 0,
    },
    {
      year: "Target Date",
      expected: data.expected_50th_percentile || 0,
      worst: data.worst_case_10th_percentile || 0,
      target: data.median_inflated_target || 0,
    }
  ];

  const formatYAxis = (tickItem: number) => {
    if (tickItem === 0) return "0";
    return `₹${(tickItem / 100000).toFixed(0)}L`; // Convert to Lakhs for Y Axis
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-lg shadow-xl">
          <p className="text-xs text-zinc-400 mb-2">{label}</p>
          {payload.map((p: any) => (
// eslint-disable-next-line @typescript-eslint/no-explicit-any
            <div key={p.dataKey} className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
              <p className="text-xs text-zinc-300">
                <span className="capitalize">{p.dataKey}: </span>
                <span className="font-mono font-medium text-zinc-100">
                  ₹{new Intl.NumberFormat('en-IN').format(p.value)}
                </span>
              </p>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={chartData} margin={{ top: 20, right: 20, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
        <XAxis 
          dataKey="year" 
          stroke="#52525b" 
          fontSize={12} 
          tickLine={false} 
          axisLine={false} 
          dy={10}
        />
        <YAxis 
          stroke="#52525b" 
          fontSize={12} 
          tickLine={false} 
          axisLine={false}
          tickFormatter={formatYAxis}
        />
        <Tooltip content={<CustomTooltip />} />
        
        {/* Target Line */}
        <Line 
          type="monotone" 
          dataKey="target" 
          stroke="#3b82f6" 
          strokeWidth={2} 
          strokeDasharray="5 5" 
          dot={false}
        />
        
        {/* Expected Line */}
        <Line 
          type="monotone" 
          dataKey="expected" 
          stroke="#10b981" 
          strokeWidth={2} 
          dot={{ fill: "#10b981", strokeWidth: 2, r: 4 }}
          activeDot={{ r: 6, fill: "#10b981", stroke: "#fff" }}
        />
        
        {/* Worst Case Line */}
        <Line 
          type="monotone" 
          dataKey="worst" 
          stroke="#f43f5e" 
          strokeWidth={2} 
          dot={{ fill: "#f43f5e", strokeWidth: 2, r: 4 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}


