"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricCard } from "@/components/ui/metric-card";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/lib/supabase";
import { chartColors, tooltipStyle, CHART_PALETTE } from "@/lib/chart-theme";
import { formatDate } from "@/lib/utils";
import { Package, AlertTriangle, Layers, TrendingUp } from "lucide-react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  LineChart,
  Line,
} from "recharts";

export default function ItemAnalyticsPage() {
  const [topItems, setTopItems] = useState<{ name: string; count: number }[] | null>(null);
  const [categoryData, setCategoryData] = useState<{ name: string; value: number }[] | null>(null);
  const [expiringCount, setExpiringCount] = useState<number | null>(null);
  const [totalItems, setTotalItems] = useState<number | null>(null);
  const [avgItemsData, setAvgItemsData] = useState<{ date: string; count: number }[] | null>(null);
  const [expiringItems, setExpiringItems] = useState<{ name: string; expiry_date: string; household_id: string }[] | null>(null);

  useEffect(() => {
    fetchTopItems();
    fetchCategories();
    fetchExpiring();
    fetchTotalItems();
    fetchAvgItemsOverTime();
  }, []);

  async function fetchTopItems() {
    const { data } = await supabase
      .from("pantry_items")
      .select("name")
      .returns<{ name: string }[]>();

    if (!data) { setTopItems([]); return; }

    const counts = new Map<string, number>();
    data.forEach((i) => {
      const name = i.name.toLowerCase().trim();
      counts.set(name, (counts.get(name) ?? 0) + 1);
    });

    setTopItems(
      Array.from(counts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 20)
        .map(([name, count]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), count }))
    );
  }

  async function fetchCategories() {
    const { data } = await supabase
      .from("pantry_items")
      .select("category")
      .returns<{ category: string | null }[]>();

    if (!data) { setCategoryData([]); return; }

    const counts = new Map<string, number>();
    data.forEach((i) => {
      const cat = i.category || "Uncategorized";
      counts.set(cat, (counts.get(cat) ?? 0) + 1);
    });

    setCategoryData(
      Array.from(counts.entries()).map(([name, value]) => ({ name, value }))
    );
  }

  async function fetchExpiring() {
    const now = new Date();
    const week = new Date(now.getTime() + 7 * 86400000);

    const { data, count } = await supabase
      .from("pantry_items")
      .select("name, expiry_date, household_id", { count: "exact" })
      .gte("expiry_date", now.toISOString().split("T")[0])
      .lte("expiry_date", week.toISOString().split("T")[0])
      .order("expiry_date")
      .limit(20);

    setExpiringCount(count ?? 0);
    setExpiringItems(data ?? []);
  }

  async function fetchTotalItems() {
    const { count } = await supabase
      .from("pantry_items")
      .select("id", { count: "exact", head: true });
    setTotalItems(count ?? 0);
  }

  async function fetchAvgItemsOverTime() {
    const { data } = await supabase
      .from("pantry_items")
      .select("created_at")
      .order("created_at");

    if (!data) { setAvgItemsData([]); return; }

    const now = new Date();
    const days: { date: string; count: number }[] = [];

    for (let i = 30; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const itemsBefore = data.filter((item) => item.created_at.split("T")[0] <= dateStr).length;
      days.push({ date: dateStr, count: itemsBefore });
    }

    setAvgItemsData(days);
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="font-heading text-3xl font-bold text-ink-strong">Item Analytics</h1>
          <p className="mt-1 text-ink/60">Pantry item trends and insights</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard title="Total Items" value={totalItems} icon={Package} />
          <MetricCard title="Expiring Soon" value={expiringCount} icon={AlertTriangle} description="Within 7 days" />
          <MetricCard title="Categories" value={categoryData?.length ?? null} icon={Layers} />
          <MetricCard title="Top Item Count" value={topItems?.[0]?.count ?? null} icon={TrendingUp} description={topItems?.[0]?.name ?? ""} />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Most Added Items (Top 20)</CardTitle>
            </CardHeader>
            <CardContent>
              {topItems === null ? (
                <Skeleton className="h-[400px] w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={topItems.slice(0, 15)} layout="vertical" margin={{ left: 20 }}>
                    <XAxis type="number" stroke={chartColors.axis} fontSize={12} />
                    <YAxis
                      type="category"
                      dataKey="name"
                      stroke={chartColors.axis}
                      fontSize={11}
                      width={120}
                      tickFormatter={(v) => v.length > 18 ? v.slice(0, 18) + "..." : v}
                    />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="count" fill={chartColors.tomatoLight} radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Items by Category</CardTitle>
            </CardHeader>
            <CardContent>
              {categoryData === null ? (
                <Skeleton className="h-[400px] w-full" />
              ) : categoryData.length === 0 ? (
                <div className="flex h-[400px] items-center justify-center text-ink/40">No category data</div>
              ) : (
                <ResponsiveContainer width="100%" height={400}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      outerRadius={130}
                      dataKey="value"
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    >
                      {categoryData.map((_, i) => (
                        <Cell key={i} fill={CHART_PALETTE[i % CHART_PALETTE.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend wrapperStyle={{ color: "#6B6B6B", fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Total Items Over Time (Last 30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            {avgItemsData === null ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={avgItemsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                  <XAxis
                    dataKey="date"
                    stroke={chartColors.axis}
                    fontSize={12}
                    tickFormatter={(v) => new Date(v).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  />
                  <YAxis stroke={chartColors.axis} fontSize={12} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Line type="monotone" dataKey="count" stroke={chartColors.tomato} strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Expiring Soon (Next 7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            {expiringItems === null ? (
              <Skeleton className="h-[200px] w-full" />
            ) : expiringItems.length === 0 ? (
              <p className="text-center text-ink/40 py-8">No items expiring within 7 days</p>
            ) : (
              <div className="space-y-2">
                {expiringItems.map((item, i) => (
                  <div key={i} className="flex items-center justify-between rounded-xl bg-tomato/5 px-4 py-2.5">
                    <span className="font-medium text-ink">{item.name}</span>
                    <span className="text-sm text-tomato-dark">{formatDate(item.expiry_date)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
