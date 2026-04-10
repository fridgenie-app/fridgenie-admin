"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface SizeData {
  name: string;
  value: number;
}

interface HouseholdSizeChartProps {
  data: SizeData[] | null;
}

const COLORS = ["#E53935", "#EF5350", "#F44336", "#E57373", "#EF9A9A", "#FFCDD2", "#FF8A80", "#FF5252"];

export function HouseholdSizeChart({ data }: HouseholdSizeChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Household Size Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        {data === null ? (
          <Skeleton className="h-[300px] w-full" />
        ) : data.length === 0 ? (
          <div className="flex h-[300px] items-center justify-center text-slate-500">
            No household data yet
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) =>
                  `${name} (${(percent * 100).toFixed(0)}%)`
                }
              >
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1e293b",
                  border: "1px solid #334155",
                  borderRadius: "8px",
                  color: "#f1f5f9",
                }}
              />
              <Legend
                wrapperStyle={{ color: "#94a3b8", fontSize: 12 }}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
