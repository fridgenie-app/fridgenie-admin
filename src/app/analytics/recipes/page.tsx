"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricCard } from "@/components/ui/metric-card";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/lib/supabase";
import { chartColors, tooltipStyle } from "@/lib/chart-theme";
import { ChefHat, Heart, Percent, Clock } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";

export default function RecipeAnalyticsPage() {
  const [totalRecipes, setTotalRecipes] = useState<number | null>(null);
  const [totalCooked, setTotalCooked] = useState<number | null>(null);
  const [totalFavorited, setTotalFavorited] = useState<number | null>(null);
  const [completionRate, setCompletionRate] = useState<number | null>(null);
  const [topFavorited, setTopFavorited] = useState<{ name: string; count: number }[] | null>(null);
  const [cookingOverTime, setCookingOverTime] = useState<{ date: string; count: number }[] | null>(null);

  useEffect(() => {
    fetchFunnel();
    fetchTopFavorited();
    fetchCookingOverTime();
  }, []);

  async function fetchFunnel() {
    const [recipesRes, cookedRes, favRes] = await Promise.all([
      supabase.from("fridgenie_recipes").select("id", { count: "exact", head: true }),
      supabase.from("recipe_cooked_history").select("id", { count: "exact", head: true }),
      supabase.from("user_favorites").select("id", { count: "exact", head: true }),
    ]);

    const recipes = recipesRes.count ?? 0;
    const cooked = cookedRes.count ?? 0;
    const fav = favRes.count ?? 0;

    setTotalRecipes(recipes);
    setTotalCooked(cooked);
    setTotalFavorited(fav);
    setCompletionRate(recipes > 0 ? Math.round((cooked / recipes) * 100) : 0);
  }

  async function fetchTopFavorited() {
    const { data } = await supabase
      .from("user_favorites")
      .select("recipe_id")
      .returns<{ recipe_id: string }[]>();

    if (!data || data.length === 0) { setTopFavorited([]); return; }

    const counts = new Map<string, number>();
    data.forEach((f) => counts.set(f.recipe_id, (counts.get(f.recipe_id) ?? 0) + 1));

    const topIds = Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    const { data: recipes } = await supabase
      .from("fridgenie_recipes")
      .select("id, title")
      .in("id", topIds.map(([id]) => id));

    const titleMap = new Map<string, string>();
    recipes?.forEach((r) => titleMap.set(r.id, r.title));

    setTopFavorited(
      topIds.map(([id, count]) => ({
        name: titleMap.get(id) || "Unknown",
        count,
      }))
    );
  }

  async function fetchCookingOverTime() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data } = await supabase
      .from("recipe_cooked_history")
      .select("cooked_at")
      .gte("cooked_at", thirtyDaysAgo.toISOString());

    const grouped = new Map<string, number>();
    for (let i = 0; i <= 30; i++) {
      const d = new Date();
      d.setDate(d.getDate() - (30 - i));
      grouped.set(d.toISOString().split("T")[0], 0);
    }

    data?.forEach((c) => {
      const day = c.cooked_at.split("T")[0];
      grouped.set(day, (grouped.get(day) ?? 0) + 1);
    });

    setCookingOverTime(
      Array.from(grouped.entries()).map(([date, count]) => ({ date, count }))
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="font-heading text-3xl font-bold text-bark">Recipe Analytics</h1>
          <p className="mt-1 text-bark/60">Recipe engagement and discovery funnel</p>
        </div>

        <div>
          <h2 className="font-heading text-lg font-semibold text-bark mb-4">Discovery Funnel</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <MetricCard title="Total Recipes" value={totalRecipes} icon={ChefHat} description="Created" />
            <MetricCard title="Favorited" value={totalFavorited} icon={Heart} description="User saves" />
            <MetricCard title="Cooked" value={totalCooked} icon={ChefHat} description="Times cooked" />
            <MetricCard title="Cook Rate" value={completionRate} icon={Percent} description="Cooked / Created %" />
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Most Favorited Recipes</CardTitle>
            </CardHeader>
            <CardContent>
              {topFavorited === null ? (
                <Skeleton className="h-[300px] w-full" />
              ) : topFavorited.length === 0 ? (
                <div className="flex h-[300px] items-center justify-center text-bark/40">No favorites data yet</div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={topFavorited} layout="vertical" margin={{ left: 20 }}>
                    <XAxis type="number" stroke={chartColors.axis} fontSize={12} allowDecimals={false} />
                    <YAxis
                      type="category"
                      dataKey="name"
                      stroke={chartColors.axis}
                      fontSize={11}
                      width={140}
                      tickFormatter={(v) => v.length > 20 ? v.slice(0, 20) + "..." : v}
                    />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Bar dataKey="count" fill={chartColors.coral} radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cooking Frequency (Last 30 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              {cookingOverTime === null ? (
                <Skeleton className="h-[300px] w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={cookingOverTime}>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                    <XAxis
                      dataKey="date"
                      stroke={chartColors.axis}
                      fontSize={12}
                      tickFormatter={(v) => new Date(v).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    />
                    <YAxis stroke={chartColors.axis} fontSize={12} allowDecimals={false} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Line type="monotone" dataKey="count" stroke={chartColors.forest} strokeWidth={2} dot={{ fill: chartColors.forest, r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Average Time from Save to Cook</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex h-[120px] items-center justify-center">
              <div className="text-center">
                <Clock className="mx-auto mb-2 h-8 w-8 text-bark/20" />
                <p className="text-bark/40">Requires tracking save-to-cook timestamps per user</p>
                <p className="text-xs text-bark/30 mt-1">Coming soon with enhanced event tracking</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
