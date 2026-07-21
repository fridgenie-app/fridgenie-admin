"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { getCost } from "@/lib/admin-api";
import { chartColors, tooltipStyle } from "@/lib/chart-theme";
import { AlertTriangle } from "lucide-react";
import type { CostRow } from "@/types/database";

function usd(n: number): string {
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  });
}

interface Grouped {
  key: string;
  model: string;
  fn: string;
  provider: string;
  calls: number;
  input_tokens: number;
  output_tokens: number;
  cost_usd: number;
  unpriced: boolean;
}

export default function CostPage() {
  const [rows, setRows] = useState<CostRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getCost()
      .then((data) => setRows(data.map((r) => ({ ...r, cost_usd: Number(r.cost_usd) }))))
      .catch((e) => setError(e.message ?? "Failed to load cost report"));
  }, []);

  const total30d = useMemo(
    () => (rows ? rows.reduce((sum, r) => sum + Number(r.cost_usd ?? 0), 0) : 0),
    [rows]
  );

  const dailyData = useMemo(() => {
    if (!rows) return [];
    const byDay = new Map<string, number>();
    for (const r of rows) {
      byDay.set(r.usage_date, (byDay.get(r.usage_date) ?? 0) + Number(r.cost_usd ?? 0));
    }
    return Array.from(byDay.entries())
      .map(([date, cost]) => ({ date, cost: Number(cost.toFixed(4)) }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [rows]);

  const grouped = useMemo<Grouped[]>(() => {
    if (!rows) return [];
    const map = new Map<string, Grouped>();
    for (const r of rows) {
      const key = `${r.model}__${r.function}`;
      const g = map.get(key) ?? {
        key,
        model: r.model ?? "unknown",
        fn: r.function ?? "unknown",
        provider: r.provider ?? "",
        calls: 0,
        input_tokens: 0,
        output_tokens: 0,
        cost_usd: 0,
        unpriced: false,
      };
      g.calls += Number(r.calls ?? 0);
      g.input_tokens += Number(r.input_tokens ?? 0);
      g.output_tokens += Number(r.output_tokens ?? 0);
      g.cost_usd += Number(r.cost_usd ?? 0);
      g.unpriced = g.unpriced || Boolean(r.unpriced);
      map.set(key, g);
    }
    return Array.from(map.values()).sort((a, b) => b.cost_usd - a.cost_usd);
  }, [rows]);

  const hasUnpriced = grouped.some((g) => g.unpriced);
  const loading = rows === null && !error;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading text-3xl font-bold text-ink-strong">AI Cost</h1>
            <p className="mt-1 text-ink/60">AI usage and spend over the last 30 days</p>
          </div>
          {hasUnpriced && (
            <Badge variant="warning" className="gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5" />
              Some models are unpriced — set them in ai_model_pricing
            </Badge>
          )}
        </div>

        {error && (
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-tomato">Could not load cost report: {error}</p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="p-6">
            <p className="text-sm font-medium text-ink/60">Total spend (last 30 days)</p>
            {loading ? (
              <Skeleton className="mt-2 h-10 w-40" />
            ) : (
              <p className="mt-1 font-heading text-4xl font-bold text-ink-strong">
                {usd(total30d)}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Daily Cost</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : dailyData.length === 0 ? (
              <div className="flex h-[300px] items-center justify-center text-ink/40">
                No usage recorded in this window
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                  <XAxis
                    dataKey="date"
                    stroke={chartColors.axis}
                    fontSize={12}
                    tickFormatter={(v) =>
                      new Date(v).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })
                    }
                  />
                  <YAxis
                    stroke={chartColors.axis}
                    fontSize={12}
                    tickFormatter={(v) => `$${v}`}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(v: number) => [usd(Number(v)), "Cost"]}
                    labelFormatter={(v) =>
                      new Date(v).toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })
                    }
                  />
                  <Bar dataKey="cost" fill={chartColors.tomato} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>By Model &amp; Function</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Model</TableHead>
                    <TableHead>Function</TableHead>
                    <TableHead className="text-right">Calls</TableHead>
                    <TableHead className="text-right">Input tokens</TableHead>
                    <TableHead className="text-right">Output tokens</TableHead>
                    <TableHead className="text-right">Cost</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {grouped.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-ink/40">
                        No usage data
                      </TableCell>
                    </TableRow>
                  ) : (
                    grouped.map((g) => (
                      <TableRow key={g.key}>
                        <TableCell className="font-medium text-ink-strong">
                          <div className="flex items-center gap-2">
                            {g.model}
                            {g.unpriced && (
                              <Badge variant="warning" className="gap-1">
                                <AlertTriangle className="h-3 w-3" />
                                unpriced
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{g.fn}</TableCell>
                        <TableCell className="text-right">
                          {g.calls.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          {g.input_tokens.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          {g.output_tokens.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {usd(g.cost_usd)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
