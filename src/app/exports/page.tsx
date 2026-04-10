"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import { exportToCsv, exportToExcel, exportToPdf } from "@/lib/utils";
import {
  FileSpreadsheet,
  FileText,
  FileDown,
  Mail,
  Calendar,
  Download,
} from "lucide-react";

export default function ExportsPage() {
  const [exporting, setExporting] = useState<string | null>(null);
  const [scheduleEmail, setScheduleEmail] = useState("");
  const [scheduleFreq, setScheduleFreq] = useState("weekly");
  const [scheduleSaved, setScheduleSaved] = useState(false);

  async function handleExport(type: string, format: "csv" | "excel") {
    setExporting(type);

    let data: Record<string, unknown>[] = [];
    const filename = `fridgenie-${type}-${new Date().toISOString().split("T")[0]}`;

    if (type === "users") {
      const { data: profiles } = await supabase.from("profiles").select("*");
      data = (profiles ?? []).map((p) => ({
        email: p.email,
        display_name: p.display_name ?? "",
        is_admin: p.is_admin,
        created_at: p.created_at,
      }));
    } else if (type === "households") {
      const { data: households } = await supabase.from("households").select("*");
      data = (households ?? []).map((h) => ({
        name: h.name,
        created_by: h.created_by,
        created_at: h.created_at,
      }));
    } else if (type === "items") {
      const { data: items } = await supabase.from("pantry_items").select("*");
      data = (items ?? []).map((i) => ({
        name: i.name,
        quantity: i.quantity,
        unit: i.unit ?? "",
        category: i.category ?? "",
        expiry_date: i.expiry_date ?? "",
        created_at: i.created_at,
      }));
    } else if (type === "recipes") {
      const { data: recipes } = await supabase.from("fridgenie_recipes").select("*");
      data = (recipes ?? []).map((r) => ({
        title: r.title,
        description: r.description ?? "",
        created_at: r.created_at,
      }));
    } else if (type === "activity") {
      const { data: cooks } = await supabase
        .from("recipe_cooked_history")
        .select("*")
        .order("cooked_at", { ascending: false })
        .limit(500);
      data = (cooks ?? []).map((c) => ({
        recipe_title: c.recipe_title,
        cooked_at: c.cooked_at,
        user_id: c.user_id,
      }));
    }

    if (format === "csv") {
      exportToCsv(data, `${filename}.csv`);
    } else {
      exportToExcel(data, `${filename}.xlsx`);
    }

    setExporting(null);
  }

  function handlePdfExport() {
    setExporting("pdf");
    exportToPdf("export-dashboard-summary", "fridgenie-dashboard-report.pdf").then(() => {
      setExporting(null);
    });
  }

  function handleSaveSchedule() {
    const schedules = JSON.parse(localStorage.getItem("fridgenie_report_schedules") || "[]");
    schedules.push({
      email: scheduleEmail,
      frequency: scheduleFreq,
      created_at: new Date().toISOString(),
    });
    localStorage.setItem("fridgenie_report_schedules", JSON.stringify(schedules));
    setScheduleSaved(true);
    setTimeout(() => setScheduleSaved(false), 3000);
  }

  const exportItems = [
    { type: "users", label: "Users", icon: FileSpreadsheet, description: "All user profiles and metadata" },
    { type: "households", label: "Households", icon: FileSpreadsheet, description: "Household names and creation data" },
    { type: "items", label: "Pantry Items", icon: FileSpreadsheet, description: "All tracked pantry items with categories" },
    { type: "recipes", label: "Recipes", icon: FileSpreadsheet, description: "All created recipes" },
    { type: "activity", label: "Cook History", icon: FileSpreadsheet, description: "Recent cooking activity (last 500)" },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="font-heading text-3xl font-bold text-bark">Reports & Export</h1>
          <p className="mt-1 text-bark/60">Export data and generate reports</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Data Exports</CardTitle>
            <CardDescription>Download your Fridgenie data in CSV or Excel format</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {exportItems.map((item) => (
                <div
                  key={item.type}
                  className="flex items-center justify-between rounded-2xl bg-cream px-5 py-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="rounded-xl bg-forest/10 p-2.5">
                      <item.icon className="h-5 w-5 text-forest" />
                    </div>
                    <div>
                      <p className="font-medium text-bark">{item.label}</p>
                      <p className="text-xs text-bark/40">{item.description}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleExport(item.type, "csv")}
                      disabled={exporting === item.type}
                    >
                      <Download className="mr-1.5 h-3.5 w-3.5" />
                      CSV
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleExport(item.type, "excel")}
                      disabled={exporting === item.type}
                    >
                      <Download className="mr-1.5 h-3.5 w-3.5" />
                      Excel
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>PDF Dashboard Report</CardTitle>
            <CardDescription>Generate a visual PDF snapshot of the current dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <div id="export-dashboard-summary" className="mb-4 rounded-2xl bg-cream p-6">
              <div className="flex items-center gap-3 mb-4">
                <FileText className="h-6 w-6 text-forest" />
                <h3 className="font-heading font-semibold text-bark">Fridgenie Dashboard Summary</h3>
              </div>
              <p className="text-sm text-bark/60">
                The PDF report will capture a snapshot of your dashboard overview including key metrics, charts, and trends.
                Navigate to the Dashboard Overview page first for the most complete report.
              </p>
            </div>
            <Button onClick={handlePdfExport} disabled={exporting === "pdf"}>
              <FileDown className="mr-2 h-4 w-4" />
              {exporting === "pdf" ? "Generating..." : "Generate PDF Report"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Scheduled Reports</CardTitle>
            <CardDescription>Set up recurring email reports (requires backend cron service)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-w-md">
              <div className="space-y-2">
                <label className="text-sm font-medium text-bark/70">Report Type</label>
                <select className="flex h-9 w-full rounded-lg border border-forest/20 bg-white px-3 py-1 text-sm text-bark">
                  <option>Weekly Summary</option>
                  <option>User Growth Report</option>
                  <option>Item Analytics Report</option>
                  <option>Recipe Engagement Report</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-bark/70">Frequency</label>
                <div className="flex gap-2">
                  {["daily", "weekly", "monthly"].map((f) => (
                    <Button
                      key={f}
                      variant={scheduleFreq === f ? "default" : "secondary"}
                      size="sm"
                      onClick={() => setScheduleFreq(f)}
                    >
                      <Calendar className="mr-1.5 h-3.5 w-3.5" />
                      {f.charAt(0).toUpperCase() + f.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-bark/70">Email Recipient</label>
                <Input
                  type="email"
                  placeholder="admin@fridgenie.app"
                  value={scheduleEmail}
                  onChange={(e) => setScheduleEmail(e.target.value)}
                />
              </div>
              <Button onClick={handleSaveSchedule} disabled={!scheduleEmail}>
                <Mail className="mr-2 h-4 w-4" />
                {scheduleSaved ? "Saved!" : "Save Schedule"}
              </Button>
              <p className="text-xs text-bark/30">
                Note: Email delivery requires a backend cron service (e.g., Supabase Edge Functions, Vercel Cron).
                Schedules are saved locally for now.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
