"use client";

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";

const data = [
  { date: "Jan 24", calls: 0 },
  { date: "Jan 26", calls: 0 },
  { date: "Jan 28", calls: 2 },
  { date: "Jan 30", calls: 0 },
  { date: "Feb 01", calls: 4 },
  { date: "Feb 03", calls: 6 },
  { date: "Feb 05", calls: 2 },
  { date: "Feb 07", calls: 5 },
  { date: "Feb 09", calls: 3 },
  { date: "Feb 11", calls: 1 },
  { date: "Feb 13", calls: 3 },
  { date: "Feb 15", calls: 0 },
  { date: "Feb 17", calls: 0 },
  { date: "Feb 19", calls: 0 },
  { date: "Feb 21", calls: 8 },
  { date: "Feb 23", calls: 0 },
];

export default function TimeSeriesGraph() {
  return (
    <div className="h-[400px] w-full"> {/* Increased height and added width */}
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <XAxis
            dataKey="date"
            stroke="#888888"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="rounded-lg border bg-background p-2 shadow-sm">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex flex-col">
                        <span className="text-[0.70rem] uppercase text-muted-foreground">
                          Calls
                        </span>
                        <span className="font-bold text-muted-foreground">
                          {payload[0].value}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />
          <Line
            type="monotone"
            dataKey="calls"
            stroke="#4A90E2"
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}