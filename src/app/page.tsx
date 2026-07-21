"use client";

import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { MetricCard } from "@/components/ui/metric-card";
import { Card, CardContent } from "@/components/ui/card";
import { getOverview } from "@/lib/admin-api";
import {
  Users,
  Crown,
  Trash2,
  Sunrise,
  CalendarDays,
  CalendarRange,
  Home,
  Package,
  ChefHat,
  Sparkles,
  DollarSign,
} from "lucide-react";
import type { Overview } from "@/types/database";

function formatUsd(n: number | undefined | null): string {
  const v = typeof n === "number" ? n : 0;
  return v.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-3 font-heading text-lg font-semibold text-ink-strong">
      {children}
    </h2>
  );
}

export default function OverviewPage() {
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getOverview()
      .then(setData)
      .catch((e) => setError(e.message ?? "Failed to load overview"));
  }, []);

  const num = (v: keyof Overview): number | null =>
    data ? Number(data[v] ?? 0) : null;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="font-heading text-3xl font-bold text-ink-strong">
            Dashboard Overview
          </h1>
          <p className="mt-1 text-ink/60">
            Key metrics and AI spend for Fridgenie
          </p>
        </div>

        {error && (
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-tomato">
                Could not load overview: {error}
              </p>
            </CardContent>
          </Card>
        )}

        <section>
          <SectionTitle>Users</SectionTitle>
          <div className="grid gap-4 md:grid-cols-3">
            <MetricCard title="Total Users" value={num("total_users")} icon={Users} />
            <MetricCard title="Pro Users" value={num("pro_users")} icon={Crown} />
            <MetricCard title="Deleted" value={num("deleted_users")} icon={Trash2} />
          </div>
        </section>

        <section>
          <SectionTitle>Active Users</SectionTitle>
          <div className="grid gap-4 md:grid-cols-3">
            <MetricCard title="DAU" value={num("dau")} icon={Sunrise} description="Daily active" />
            <MetricCard title="WAU" value={num("wau")} icon={CalendarDays} description="Weekly active" />
            <MetricCard title="MAU" value={num("mau")} icon={CalendarRange} description="Monthly active" />
          </div>
        </section>

        <section>
          <SectionTitle>Content</SectionTitle>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard title="Households" value={num("households")} icon={Home} />
            <MetricCard title="Pantry Items" value={num("pantry_items")} icon={Package} />
            <MetricCard title="Recipes Cooked" value={num("recipes_cooked")} icon={ChefHat} />
            <MetricCard title="AI Recipes" value={num("ai_recipes")} icon={Sparkles} />
          </div>
        </section>

        <section>
          <SectionTitle>AI Spend</SectionTitle>
          <div className="grid gap-4 md:grid-cols-3">
            <MetricCard
              title="Today"
              value={data ? formatUsd(data.cost_today_usd) : null}
              icon={DollarSign}
            />
            <MetricCard
              title="Last 7 days"
              value={data ? formatUsd(data.cost_7d_usd) : null}
              icon={DollarSign}
            />
            <MetricCard
              title="Last 30 days"
              value={data ? formatUsd(data.cost_30d_usd) : null}
              icon={DollarSign}
            />
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
