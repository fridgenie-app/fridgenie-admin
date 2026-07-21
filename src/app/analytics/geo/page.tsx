"use client";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Globe, MapPin } from "lucide-react";

export default function GeoAnalyticsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="font-heading text-3xl font-bold text-ink-strong">Geographic Analytics</h1>
          <p className="mt-1 text-ink/60">User distribution by location</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>User Map</CardTitle>
              <CardDescription>Geographic distribution of users</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex h-[350px] items-center justify-center rounded-2xl bg-paper border-2 border-dashed border-tomato/10">
                <div className="text-center">
                  <Globe className="mx-auto mb-3 h-12 w-12 text-tomato/20" />
                  <p className="font-heading font-semibold text-ink/50">Map Visualization</p>
                  <p className="mt-1 text-sm text-ink/30 max-w-sm">
                    Add timezone or country fields to the profiles table to enable geographic analytics
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Top Regions</CardTitle>
              <CardDescription>Users by country/timezone</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {["United States", "Canada", "United Kingdom", "Australia", "Germany"].map((country, i) => (
                  <div key={country} className="flex items-center justify-between rounded-xl bg-paper px-4 py-3">
                    <div className="flex items-center gap-3">
                      <MapPin className="h-4 w-4 text-tomato/30" />
                      <span className="text-sm text-ink/40">{country}</span>
                    </div>
                    <span className="text-sm font-medium text-ink/20">--</span>
                  </div>
                ))}
                <p className="text-center text-xs text-ink/30 pt-2">
                  Placeholder data — requires user location tracking
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>How to Enable</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm text-ink/60">
              <p>To enable geographic analytics, add one of the following to your profiles table:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li><code className="rounded bg-tomato/10 px-1.5 py-0.5 text-tomato text-xs">timezone TEXT</code> — Captures user timezone from device settings</li>
                <li><code className="rounded bg-tomato/10 px-1.5 py-0.5 text-tomato text-xs">country TEXT</code> — Derived from IP geolocation during signup</li>
                <li><code className="rounded bg-tomato/10 px-1.5 py-0.5 text-tomato text-xs">locale TEXT</code> — Device locale for language/region analysis</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
