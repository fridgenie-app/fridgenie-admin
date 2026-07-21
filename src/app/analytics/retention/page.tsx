"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricCard } from "@/components/ui/metric-card";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/lib/supabase";
import { chartColors, tooltipStyle } from "@/lib/chart-theme";
import { Users, TrendingUp, Activity, Percent } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface ActiveUsersMetrics {
  dau: number;
  wau: number;
  mau: number;
  stickiness: number;
}

interface DailyActiveData {
  date: string;
  count: number;
}

interface CohortRow {
  week: string;
  total: number;
  week1: number;
  week2: number;
  week3: number;
  week4: number;
}

export default function RetentionPage() {
  const [metrics, setMetrics] = useState<ActiveUsersMetrics | null>(null);
  const [dauData, setDauData] = useState<DailyActiveData[] | null>(null);
  const [cohorts, setCohorts] = useState<CohortRow[] | null>(null);

  useEffect(() => {
    fetchActiveUsers();
    fetchDauOverTime();
    fetchCohorts();
  }, []);

  async function fetchActiveUsers() {
    const now = new Date();
    const day1 = new Date(now); day1.setDate(day1.getDate() - 1);
    const day7 = new Date(now); day7.setDate(day7.getDate() - 7);
    const day30 = new Date(now); day30.setDate(day30.getDate() - 30);

    const [itemsDay, itemsWeek, itemsMonth, cooksDay, cooksWeek, cooksMonth] = await Promise.all([
      supabase.from("pantry_items").select("added_by").gte("created_at", day1.toISOString()),
      supabase.from("pantry_items").select("added_by").gte("created_at", day7.toISOString()),
      supabase.from("pantry_items").select("added_by").gte("created_at", day30.toISOString()),
      supabase.from("user_cooked_recipes").select("user_id").gte("cooked_at", day1.toISOString()),
      supabase.from("user_cooked_recipes").select("user_id").gte("cooked_at", day7.toISOString()),
      supabase.from("user_cooked_recipes").select("user_id").gte("cooked_at", day30.toISOString()),
    ]);

    const uniqueUsers = (items: { added_by?: string; user_id?: string }[] | null, cooks: { added_by?: string; user_id?: string }[] | null) => {
      const set = new Set<string>();
      items?.forEach((i) => { if ((i as { added_by: string }).added_by) set.add((i as { added_by: string }).added_by); });
      cooks?.forEach((c) => { if ((c as { user_id: string }).user_id) set.add((c as { user_id: string }).user_id); });
      return set.size;
    };

    const dau = uniqueUsers(itemsDay.data, cooksDay.data);
    const wau = uniqueUsers(itemsWeek.data, cooksWeek.data);
    const mau = uniqueUsers(itemsMonth.data, cooksMonth.data);

    setMetrics({
      dau,
      wau,
      mau,
      stickiness: mau > 0 ? Math.round((dau / mau) * 100) : 0,
    });
  }

  async function fetchDauOverTime() {
    const days: DailyActiveData[] = [];
    const now = new Date();

    const { data: items } = await supabase
      .from("pantry_items")
      .select("added_by, created_at")
      .gte("created_at", new Date(now.getTime() - 30 * 86400000).toISOString());

    const { data: cooks } = await supabase
      .from("user_cooked_recipes")
      .select("user_id, cooked_at")
      .gte("cooked_at", new Date(now.getTime() - 30 * 86400000).toISOString());

    for (let i = 30; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const users = new Set<string>();

      items?.forEach((item) => {
        if (item.created_at.startsWith(dateStr)) users.add(item.added_by);
      });
      cooks?.forEach((cook) => {
        if (cook.cooked_at.startsWith(dateStr)) users.add(cook.user_id);
      });

      days.push({ date: dateStr, count: users.size });
    }

    setDauData(days);
  }

  async function fetchCohorts() {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, created_at")
      .order("created_at");

    if (!profiles || profiles.length === 0) {
      setCohorts([]);
      return;
    }

    const { data: items } = await supabase
      .from("pantry_items")
      .select("added_by, created_at");
    const { data: cooks } = await supabase
      .from("user_cooked_recipes")
      .select("user_id, cooked_at");

    const userActivity = new Map<string, Set<string>>();
    items?.forEach((i) => {
      if (!userActivity.has(i.added_by)) userActivity.set(i.added_by, new Set());
      userActivity.get(i.added_by)!.add(i.created_at.split("T")[0]);
    });
    cooks?.forEach((c) => {
      if (!userActivity.has(c.user_id)) userActivity.set(c.user_id, new Set());
      userActivity.get(c.user_id)!.add(c.cooked_at.split("T")[0]);
    });

    const weekMap = new Map<string, { users: string[]; signupDate: Date }>();
    profiles.forEach((p) => {
      const d = new Date(p.created_at);
      const weekStart = new Date(d);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const key = weekStart.toISOString().split("T")[0];
      if (!weekMap.has(key)) weekMap.set(key, { users: [], signupDate: weekStart });
      weekMap.get(key)!.users.push(p.id);
    });

    const cohortRows: CohortRow[] = [];
    const sortedWeeks = Array.from(weekMap.entries()).sort((a, b) => a[0].localeCompare(b[0])).slice(-4);

    sortedWeeks.forEach(([week, { users, signupDate }]) => {
      const total = users.length;
      const retentionAtWeek = (weekOffset: number) => {
        const weekStart = new Date(signupDate.getTime() + weekOffset * 7 * 86400000);
        const weekEnd = new Date(weekStart.getTime() + 7 * 86400000);
        let active = 0;
        users.forEach((uid) => {
          const dates = userActivity.get(uid);
          if (dates) {
            const dateArr = Array.from(dates);
            for (let di = 0; di < dateArr.length; di++) {
              const dt = new Date(dateArr[di]);
              if (dt >= weekStart && dt < weekEnd) { active++; break; }
            }
          }
        });
        return total > 0 ? Math.round((active / total) * 100) : 0;
      };

      cohortRows.push({
        week,
        total,
        week1: retentionAtWeek(1),
        week2: retentionAtWeek(2),
        week3: retentionAtWeek(3),
        week4: retentionAtWeek(4),
      });
    });

    setCohorts(cohortRows);
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="font-heading text-3xl font-bold text-ink-strong">Retention Analytics</h1>
          <p className="mt-1 text-ink/60">User engagement and retention metrics</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard title="DAU" value={metrics?.dau ?? null} icon={Users} description="Daily Active Users" />
          <MetricCard title="WAU" value={metrics?.wau ?? null} icon={TrendingUp} description="Weekly Active Users" />
          <MetricCard title="MAU" value={metrics?.mau ?? null} icon={Activity} description="Monthly Active Users" />
          <MetricCard title="Stickiness" value={metrics?.stickiness ?? null} icon={Percent} description="DAU/MAU Ratio %" />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Daily Active Users (Last 30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            {dauData === null ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dauData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                  <XAxis
                    dataKey="date"
                    stroke={chartColors.axis}
                    fontSize={12}
                    tickFormatter={(v) => new Date(v).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  />
                  <YAxis stroke={chartColors.axis} fontSize={12} allowDecimals={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Line type="monotone" dataKey="count" stroke={chartColors.tomato} strokeWidth={2} dot={{ fill: chartColors.tomato, r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Retention Cohorts (Weekly)</CardTitle>
          </CardHeader>
          <CardContent>
            {cohorts === null ? (
              <Skeleton className="h-[200px] w-full" />
            ) : cohorts.length === 0 ? (
              <p className="text-center text-ink/40 py-8">Not enough data for cohort analysis</p>
            ) : (
              <div className="overflow-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-tomato/10">
                      <th className="px-4 py-2 text-left font-medium text-ink/50">Cohort Week</th>
                      <th className="px-4 py-2 text-right font-medium text-ink/50">Users</th>
                      <th className="px-4 py-2 text-right font-medium text-ink/50">Week 1</th>
                      <th className="px-4 py-2 text-right font-medium text-ink/50">Week 2</th>
                      <th className="px-4 py-2 text-right font-medium text-ink/50">Week 3</th>
                      <th className="px-4 py-2 text-right font-medium text-ink/50">Week 4</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cohorts.map((c) => (
                      <tr key={c.week} className="border-b border-tomato/5">
                        <td className="px-4 py-2 font-medium text-ink">{c.week}</td>
                        <td className="px-4 py-2 text-right text-ink/80">{c.total}</td>
                        {[c.week1, c.week2, c.week3, c.week4].map((val, i) => (
                          <td key={i} className="px-4 py-2 text-right">
                            <span
                              className="inline-block rounded-lg px-2 py-0.5 text-xs font-medium"
                              style={{
                                backgroundColor: `rgba(182, 63, 57,${Math.max(0.05, val / 100)})`,
                                color: val > 50 ? "white" : "#2B1E1B",
                              }}
                            >
                              {val}%
                            </span>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
