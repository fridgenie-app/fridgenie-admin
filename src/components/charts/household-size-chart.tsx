"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { GHIBLI_PALETTE, tooltipStyle } from "@/lib/chart-theme";

interface SizeData {
  name: string;
  value: number;
}

interface HouseholdSizeChartProps {
  data: SizeData[] | null;
}

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
          <div className="flex h-[300px] items-center justify-center text-bark/40">
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
                  <Cell key={`cell-${index}`} fill={GHIBLI_PALETTE[index % GHIBLI_PALETTE.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
              <Legend
                wrapperStyle={{ color: "#6B6B6B", fontSize: 12 }}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
