"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface RecipeData {
  name: string;
  count: number;
}

interface TopRecipesChartProps {
  data: RecipeData[] | null;
}

export function TopRecipesChart({ data }: TopRecipesChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Top 10 Most Cooked Recipes</CardTitle>
      </CardHeader>
      <CardContent>
        {data === null ? (
          <Skeleton className="h-[300px] w-full" />
        ) : data.length === 0 ? (
          <div className="flex h-[300px] items-center justify-center text-slate-500">
            No recipe data yet
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data} layout="vertical" margin={{ left: 20 }}>
              <XAxis type="number" stroke="#94a3b8" fontSize={12} allowDecimals={false} />
              <YAxis
                type="category"
                dataKey="name"
                stroke="#94a3b8"
                fontSize={12}
                width={150}
                tickFormatter={(v) => (v.length > 20 ? v.slice(0, 20) + "..." : v)}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1e293b",
                  border: "1px solid #334155",
                  borderRadius: "8px",
                  color: "#f1f5f9",
                }}
              />
              <Bar dataKey="count" fill="#EF5350" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
