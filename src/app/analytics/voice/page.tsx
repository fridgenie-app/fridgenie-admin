"use client";

import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Mic, Camera, PenLine, Smartphone, CheckCircle } from "lucide-react";

const features = [
  {
    name: "Voice Commands",
    icon: Mic,
    description: "Voice-based item addition and pantry management",
    status: "pending",
  },
  {
    name: "Receipt Scanning",
    icon: Camera,
    description: "OCR-based grocery receipt scanning",
    status: "pending",
  },
  {
    name: "Manual Entry",
    icon: PenLine,
    description: "Traditional form-based item addition",
    status: "active",
  },
  {
    name: "Barcode Scanning",
    icon: Smartphone,
    description: "Product barcode lookup and auto-fill",
    status: "pending",
  },
];

const dataChecklist = [
  { label: "Create voice_usage_logs table in Supabase", done: false },
  { label: "Add input_method column to pantry_items table", done: false },
  { label: "Implement receipt scan event tracking", done: false },
  { label: "Add feature_usage analytics table", done: false },
  { label: "Connect barcode scan event logging", done: false },
];

export default function VoiceAnalyticsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="font-heading text-3xl font-bold text-ink-strong">Voice & Feature Usage</h1>
          <p className="mt-1 text-ink/60">Track how users interact with Fridgenie features</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <Card key={feature.name}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-3">
                    <div className="rounded-xl bg-tomato/10 p-3 w-fit">
                      <feature.icon className="h-6 w-6 text-tomato" />
                    </div>
                    <div>
                      <h3 className="font-heading font-semibold text-ink-strong">{feature.name}</h3>
                      <p className="text-xs text-ink/50 mt-1">{feature.description}</p>
                    </div>
                    <div className="text-2xl font-bold text-ink/20">--</div>
                    <p className="text-xs text-ink/30">
                      {feature.status === "active" ? "Data source available" : "Data source not yet configured"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Input Method Distribution</CardTitle>
            <CardDescription>Manual vs Voice vs Scan ratio</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex h-[200px] items-center justify-center">
              <div className="text-center">
                <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-tomato/10">
                  <Mic className="h-8 w-8 text-tomato/30" />
                </div>
                <p className="font-heading font-semibold text-ink/60">Analytics Coming Soon</p>
                <p className="mt-1 text-sm text-ink/40 max-w-md">
                  Once input method tracking is added to the pantry_items table, this chart will show the ratio of manual entries vs voice commands vs receipt scans.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Setup Checklist</CardTitle>
            <CardDescription>Complete these steps to enable feature usage tracking</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dataChecklist.map((item, i) => (
                <div key={i} className="flex items-center gap-3 rounded-xl px-4 py-3 bg-paper">
                  <CheckCircle className={`h-5 w-5 ${item.done ? "text-tomato" : "text-ink/20"}`} />
                  <span className={`text-sm ${item.done ? "text-ink line-through" : "text-ink/70"}`}>
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
