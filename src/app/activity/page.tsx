"use client";

import { useEffect, useState, useCallback } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/lib/supabase";
import { formatDateTime } from "@/lib/utils";
import { RefreshCw, UserPlus, Package, ChefHat } from "lucide-react";
import type { ActivityItem } from "@/types/database";

const typeConfig = {
  signup: { icon: UserPlus, color: "text-emerald-400", badge: "success" as const, label: "Signup" },
  item_added: { icon: Package, color: "text-blue-400", badge: "secondary" as const, label: "Item Added" },
  recipe_cooked: { icon: ChefHat, color: "text-brand-red", badge: "default" as const, label: "Cooked" },
  item_removed: { icon: Package, color: "text-amber-400", badge: "warning" as const, label: "Removed" },
};

export default function ActivityPage() {
  const [activities, setActivities] = useState<ActivityItem[] | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchActivity = useCallback(async () => {
    const results: ActivityItem[] = [];

    // Fetch recent signups
    const { data: signups } = await supabase
      .from("profiles")
      .select("id, email, created_at")
      .order("created_at", { ascending: false })
      .limit(20)
      .returns<{ id: string; email: string; created_at: string }[]>();

    if (signups) {
      signups.forEach((s) => {
        results.push({
          id: `signup-${s.id}`,
          type: "signup",
          description: `New user signed up`,
          user_email: s.email,
          timestamp: s.created_at,
        });
      });
    }

    // Fetch recent pantry items
    const { data: items } = await supabase
      .from("pantry_items")
      .select("id, name, added_by, created_at")
      .order("created_at", { ascending: false })
      .limit(20)
      .returns<{ id: string; name: string; added_by: string; created_at: string }[]>();

    if (items) {
      items.forEach((item) => {
        results.push({
          id: `item-${item.id}`,
          type: "item_added",
          description: `Added "${item.name}" to pantry`,
          timestamp: item.created_at,
        });
      });
    }

    // Fetch recent cook history
    const { data: cooks } = await supabase
      .from("recipe_cooked_history")
      .select("id, recipe_title, user_id, cooked_at")
      .order("cooked_at", { ascending: false })
      .limit(20)
      .returns<{ id: string; recipe_title: string; user_id: string; cooked_at: string }[]>();

    if (cooks) {
      cooks.forEach((c) => {
        results.push({
          id: `cook-${c.id}`,
          type: "recipe_cooked",
          description: `Cooked "${c.recipe_title}"`,
          timestamp: c.cooked_at,
        });
      });
    }

    // Sort by timestamp descending
    results.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    setActivities(results.slice(0, 50));
  }, []);

  useEffect(() => {
    fetchActivity();
  }, [fetchActivity]);

  async function handleRefresh() {
    setRefreshing(true);
    await fetchActivity();
    setRefreshing(false);
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Activity</h1>
            <p className="mt-1 text-slate-400">Recent activity across Fridgenie</p>
          </div>
          <Button variant="secondary" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Activity Feed</CardTitle>
          </CardHeader>
          <CardContent>
            {activities === null ? (
              <div className="space-y-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : activities.length === 0 ? (
              <p className="text-center text-slate-500 py-8">No activity yet</p>
            ) : (
              <div className="space-y-1">
                {activities.map((activity) => {
                  const config = typeConfig[activity.type];
                  const Icon = config.icon;
                  return (
                    <div
                      key={activity.id}
                      className="flex items-center gap-4 rounded-lg p-3 transition-colors hover:bg-slate-800/50"
                    >
                      <div className={`rounded-full bg-slate-800 p-2 ${config.color}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-200">
                          {activity.description}
                        </p>
                        {activity.user_email && (
                          <p className="text-xs text-slate-500 truncate">
                            {activity.user_email}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <Badge variant={config.badge}>{config.label}</Badge>
                        <span className="text-xs text-slate-500 whitespace-nowrap">
                          {formatDateTime(activity.timestamp)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
