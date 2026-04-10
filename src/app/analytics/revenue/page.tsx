"use client";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DollarSign, TrendingUp, UserMinus, Target } from "lucide-react";

const metrics = [
  { title: "MRR", icon: DollarSign, description: "Monthly Recurring Revenue" },
  { title: "ARR", icon: TrendingUp, description: "Annual Recurring Revenue" },
  { title: "Churn Rate", icon: UserMinus, description: "Monthly churn %" },
  { title: "LTV", icon: Target, description: "Customer Lifetime Value" },
];

export default function RevenueAnalyticsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="font-heading text-3xl font-bold text-bark">Revenue</h1>
          <p className="mt-1 text-bark/60">Monetization metrics and financial overview</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {metrics.map((m) => (
            <Card key={m.title}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-bark/60">{m.title}</p>
                    <p className="text-3xl font-bold text-bark/20">--</p>
                    <p className="text-xs text-bark/30">{m.description}</p>
                  </div>
                  <div className="rounded-xl bg-forest/10 p-3">
                    <m.icon className="h-6 w-6 text-forest/30" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Revenue Over Time</CardTitle>
            <CardDescription>Monthly revenue trend</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex h-[300px] items-center justify-center rounded-2xl bg-cream border-2 border-dashed border-forest/10">
              <div className="text-center">
                <DollarSign className="mx-auto mb-3 h-12 w-12 text-forest/20" />
                <p className="font-heading font-semibold text-bark/50">Revenue Chart</p>
                <p className="mt-1 text-sm text-bark/30 max-w-md">
                  Connect a payment provider (Stripe, RevenueCat, etc.) to populate revenue data
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Getting Started with Monetization</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl bg-cream p-5">
                <h3 className="font-heading font-semibold text-bark mb-2">Stripe Integration</h3>
                <p className="text-sm text-bark/60">
                  For web-based subscriptions. Add your Stripe API keys and webhook endpoint to track MRR, churn, and LTV.
                </p>
              </div>
              <div className="rounded-2xl bg-cream p-5">
                <h3 className="font-heading font-semibold text-bark mb-2">RevenueCat</h3>
                <p className="text-sm text-bark/60">
                  For iOS/Android in-app purchases. Connect RevenueCat to automatically sync subscription data.
                </p>
              </div>
              <div className="rounded-2xl bg-cream p-5">
                <h3 className="font-heading font-semibold text-bark mb-2">Freemium Tiers</h3>
                <p className="text-sm text-bark/60">
                  Consider premium features like advanced recipe suggestions, multi-household support, or AI-powered meal planning.
                </p>
              </div>
              <div className="rounded-2xl bg-cream p-5">
                <h3 className="font-heading font-semibold text-bark mb-2">Conversion Tracking</h3>
                <p className="text-sm text-bark/60">
                  Track free-to-paid conversion rates, trial completions, and upgrade triggers to optimize monetization.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
