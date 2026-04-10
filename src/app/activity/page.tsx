"use client";

import { useEffect, useState, useCallback } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { LiveIndicator } from "@/components/ui/live-indicator";
import { supabase } from "@/lib/supabase";
import { useRealtime } from "@/lib/use-realtime";
import { showToast } from "@/components/ui/toast";
import { formatDateTime, exportToCsv } from "@/lib/utils";
import { RefreshCw, UserPlus, Package, ChefHat, Download } from "lucide-react";
import type { ActivityItem } from "@/types/database";

const typeConfig = {
  signup: { icon: UserPlus, color: "text-forest", badge: "success" as const, label: "Signup" },
  item_added: { icon: Package, color: "text-forest", badge: "secondary" as const, label: "Item Added" },
  recipe_cooked: { icon: ChefHat, color: "text-coral-dark", badge: "default" as const, label: "Cooked" },
  item_removed: { icon: Package, color: "text-coral", badge: "warning" as const, label: "Removed" },
};

export default function ActivityPage() {
  const [activities, setActivities] = useState<ActivityItem[] | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchActivity = useCallback(async () => {
    const results: ActivityItem[] = [];

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

    results.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    setActivities(results.slice(0, 50));
  }, []);

  useEffect(() => {
    fetchActivity();
  }, [fetchActivity]);

  const handleNewActivity = useCallback(() => {
    showToast("New activity detected");
    fetchActivity();
  }, [fetchActivity]);

  const { connected } = useRealtime({
    table: "pantry_items",
    event: "INSERT",
    onRecord: handleNewActivity,
  });

  async function handleRefresh() {
    setRefreshing(true);
    await fetchActivity();
    setRefreshing(false);
  }

  function handleExport() {
    if (!activities) return;
    exportToCsv(
      activities.map((a) => ({
        type: a.type,
        description: a.description,
        user_email: a.user_email ?? "",
        timestamp: a.timestamp,
      })),
      "fridgenie-activity.csv"
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading text-3xl font-bold text-bark">Activity</h1>
            <p className="mt-1 text-bark/60">Recent activity across Fridgenie</p>
          </div>
          <div className="flex items-center gap-3">
            <LiveIndicator connected={connected} />
            <Button variant="secondary" onClick={handleExport} disabled={!activities}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button variant="secondary" onClick={handleRefresh} disabled={refreshing}>
              <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
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
              <p className="text-center text-bark/40 py-8">No activity yet</p>
            ) : (
              <div className="space-y-1">
                {activities.map((activity) => {
                  const config = typeConfig[activity.type];
                  const Icon = config.icon;
                  return (
                    <div
                      key={activity.id}
                      className="flex items-center gap-4 rounded-xl p-3 transition-colors hover:bg-forest/5"
                    >
                      <div className={`rounded-full bg-forest/10 p-2 ${config.color}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-bark">
                          {activity.description}
                        </p>
                        {activity.user_email && (
                          <p className="text-xs text-bark/40 truncate">
                            {activity.user_email}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <Badge variant={config.badge}>{config.label}</Badge>
                        <span className="text-xs text-bark/40 whitespace-nowrap">
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
