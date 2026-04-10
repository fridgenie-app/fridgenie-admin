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
import { chartColors, tooltipStyle } from "@/lib/chart-theme";

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
          <div className="flex h-[300px] items-center justify-center text-bark/40">
            No recipe data yet
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data} layout="vertical" margin={{ left: 20 }}>
              <XAxis type="number" stroke={chartColors.axis} fontSize={12} allowDecimals={false} />
              <YAxis
                type="category"
                dataKey="name"
                stroke={chartColors.axis}
                fontSize={12}
                width={150}
                tickFormatter={(v) => (v.length > 20 ? v.slice(0, 20) + "..." : v)}
              />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="count" fill={chartColors.forest} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
