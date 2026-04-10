"use client";

import { useEffect, useState, useCallback } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { MetricCard } from "@/components/ui/metric-card";
import { LiveIndicator } from "@/components/ui/live-indicator";
import { SignupChart } from "@/components/charts/signup-chart";
import { ItemsChart } from "@/components/charts/items-chart";
import { TopRecipesChart } from "@/components/charts/top-recipes-chart";
import { HouseholdSizeChart } from "@/components/charts/household-size-chart";
import { supabase } from "@/lib/supabase";
import { useRealtime } from "@/lib/use-realtime";
import { showToast } from "@/components/ui/toast";
import { Users, Home, Package, ChefHat, TrendingUp, BarChart3 } from "lucide-react";
import type { DashboardMetrics } from "@/types/database";

export default function OverviewPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [signupData, setSignupData] = useState<{ date: string; count: number }[] | null>(null);
  const [itemsData, setItemsData] = useState<{ date: string; count: number }[] | null>(null);
  const [topRecipes, setTopRecipes] = useState<{ name: string; count: number }[] | null>(null);
  const [householdSizes, setHouseholdSizes] = useState<{ name: string; value: number }[] | null>(null);

  useEffect(() => {
    fetchMetrics();
    fetchSignupData();
    fetchItemsData();
    fetchTopRecipes();
    fetchHouseholdSizes();
  }, []);

  const handleProfileChange = useCallback(() => {
    showToast("New user signed up!");
    setMetrics((prev) => prev ? { ...prev, totalUsers: prev.totalUsers + 1 } : prev);
  }, []);

  const handleItemChange = useCallback(() => {
    showToast("New item added to a pantry");
    setMetrics((prev) => prev ? { ...prev, totalItems: prev.totalItems + 1 } : prev);
  }, []);

  const { connected: profilesConnected } = useRealtime({
    table: "profiles",
    event: "INSERT",
    onRecord: handleProfileChange,
  });

  const { connected: itemsConnected } = useRealtime({
    table: "pantry_items",
    event: "INSERT",
    onRecord: handleItemChange,
  });

  const liveConnected = profilesConnected || itemsConnected;

  async function fetchMetrics() {
    const [profilesRes, householdsRes, itemsRes, recipesRes] = await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("households").select("id", { count: "exact", head: true }),
      supabase.from("pantry_items").select("id", { count: "exact", head: true }),
      supabase.from("recipe_cooked_history").select("id", { count: "exact", head: true }),
    ]);

    const totalUsers = profilesRes.count ?? 0;
    const activeHouseholds = householdsRes.count ?? 0;
    const totalItems = itemsRes.count ?? 0;
    const recipesCooked = recipesRes.count ?? 0;

    setMetrics({
      totalUsers,
      activeHouseholds,
      totalItems,
      recipesCooked,
      avgItemsPerHousehold: activeHouseholds > 0 ? totalItems / activeHouseholds : 0,
      avgRecipesPerUser: totalUsers > 0 ? recipesCooked / totalUsers : 0,
    });
  }

  async function fetchSignupData() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data } = await supabase
      .from("profiles")
      .select("created_at")
      .gte("created_at", thirtyDaysAgo.toISOString())
      .order("created_at")
      .returns<{ created_at: string }[]>();

    if (!data) {
      setSignupData([]);
      return;
    }

    const grouped = new Map<string, number>();
    for (let i = 0; i <= 30; i++) {
      const d = new Date();
      d.setDate(d.getDate() - (30 - i));
      grouped.set(d.toISOString().split("T")[0], 0);
    }
    data.forEach((p) => {
      const day = p.created_at.split("T")[0];
      grouped.set(day, (grouped.get(day) ?? 0) + 1);
    });

    setSignupData(
      Array.from(grouped.entries()).map(([date, count]) => ({ date, count }))
    );
  }

  async function fetchItemsData() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data } = await supabase
      .from("pantry_items")
      .select("created_at")
      .gte("created_at", thirtyDaysAgo.toISOString())
      .order("created_at")
      .returns<{ created_at: string }[]>();

    if (!data) {
      setItemsData([]);
      return;
    }

    const grouped = new Map<string, number>();
    for (let i = 0; i <= 30; i++) {
      const d = new Date();
      d.setDate(d.getDate() - (30 - i));
      grouped.set(d.toISOString().split("T")[0], 0);
    }
    data.forEach((item) => {
      const day = item.created_at.split("T")[0];
      grouped.set(day, (grouped.get(day) ?? 0) + 1);
    });

    setItemsData(
      Array.from(grouped.entries()).map(([date, count]) => ({ date, count }))
    );
  }

  async function fetchTopRecipes() {
    const { data } = await supabase
      .from("recipe_cooked_history")
      .select("recipe_title")
      .returns<{ recipe_title: string }[]>();

    if (!data) {
      setTopRecipes([]);
      return;
    }

    const counts = new Map<string, number>();
    data.forEach((r) => {
      const title = r.recipe_title || "Untitled";
      counts.set(title, (counts.get(title) ?? 0) + 1);
    });

    const sorted = Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }));

    setTopRecipes(sorted);
  }

  async function fetchHouseholdSizes() {
    const { data } = await supabase
      .from("households")
      .select("id, household_members(count)")
      .returns<{ id: string; household_members: { count: number }[] }[]>();

    if (!data) {
      setHouseholdSizes([]);
      return;
    }

    const sizeMap = new Map<string, number>();
    data.forEach((h) => {
      const memberCount = h.household_members?.[0]?.count ?? 1;
      const label = memberCount >= 5 ? "5+" : String(memberCount);
      sizeMap.set(label + " member" + (memberCount !== 1 ? "s" : ""), (sizeMap.get(label + " member" + (memberCount !== 1 ? "s" : "")) ?? 0) + 1);
    });

    setHouseholdSizes(
      Array.from(sizeMap.entries())
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => a.name.localeCompare(b.name))
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading text-3xl font-bold text-bark">Dashboard Overview</h1>
            <p className="mt-1 text-bark/60">
              Key metrics and analytics for Fridgenie
            </p>
          </div>
          <LiveIndicator connected={liveConnected} />
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <MetricCard
            title="Total Users"
            value={metrics?.totalUsers ?? null}
            icon={Users}
          />
          <MetricCard
            title="Households"
            value={metrics?.activeHouseholds ?? null}
            icon={Home}
          />
          <MetricCard
            title="Items Tracked"
            value={metrics?.totalItems ?? null}
            icon={Package}
          />
          <MetricCard
            title="Recipes Cooked"
            value={metrics?.recipesCooked ?? null}
            icon={ChefHat}
          />
          <MetricCard
            title="Avg Items/Household"
            value={metrics?.avgItemsPerHousehold ?? null}
            icon={TrendingUp}
          />
          <MetricCard
            title="Avg Recipes/User"
            value={metrics?.avgRecipesPerUser ?? null}
            icon={BarChart3}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <SignupChart data={signupData} />
          <ItemsChart data={itemsData} />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <TopRecipesChart data={topRecipes} />
          <HouseholdSizeChart data={householdSizes} />
        </div>
      </div>
    </DashboardLayout>
  );
}
