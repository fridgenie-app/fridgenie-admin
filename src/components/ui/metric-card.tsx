"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatNumber } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: number | null;
  icon: LucideIcon;
  description?: string;
}

export function MetricCard({ title, value, icon: Icon, description }: MetricCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-slate-400">{title}</p>
            {value === null ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <p className="text-3xl font-bold text-white">
                {typeof value === "number" && value % 1 !== 0
                  ? value.toFixed(1)
                  : formatNumber(value)}
              </p>
            )}
            {description && (
              <p className="text-xs text-slate-500">{description}</p>
            )}
          </div>
          <div className="rounded-lg bg-brand-red/10 p-3">
            <Icon className="h-6 w-6 text-brand-red" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
