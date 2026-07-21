"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Home,
  Activity,
  LogOut,
  ChefHat,
  TrendingUp,
  Package,
  Mic,
  Globe,
  DollarSign,
  FileDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";

const coreNavItems = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/cost", label: "Cost", icon: DollarSign },
  { href: "/users", label: "Users", icon: Users },
  { href: "/households", label: "Households", icon: Home },
  { href: "/activity", label: "Activity", icon: Activity },
];

const analyticsNavItems = [
  { href: "/analytics/retention", label: "Retention", icon: TrendingUp },
  { href: "/analytics/items", label: "Item Analytics", icon: Package },
  { href: "/analytics/recipes", label: "Recipe Analytics", icon: ChefHat },
  { href: "/analytics/voice", label: "Voice & Features", icon: Mic },
  { href: "/analytics/geo", label: "Geographic", icon: Globe },
  { href: "/analytics/revenue", label: "Revenue", icon: DollarSign },
];

const toolNavItems = [
  { href: "/exports", label: "Reports & Export", icon: FileDown },
];

export function Sidebar() {
  const pathname = usePathname();
  const { signOut, profile } = useAuth();
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

  function isActive(href: string) {
    const fullHref = basePath + href;
    if (href === "/") {
      return pathname === "/" || pathname === basePath + "/";
    }
    return pathname.startsWith(fullHref) || pathname.startsWith(href);
  }

  function renderNavItem(item: { href: string; label: string; icon: React.ElementType }) {
    const active = isActive(item.href);
    return (
      <Link
        key={item.href}
        href={item.href}
        className={cn(
          "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
          active
            ? "bg-tomato/10 text-tomato"
            : "text-ink/60 hover:bg-tomato/5 hover:text-ink"
        )}
      >
        <item.icon className="h-4.5 w-4.5" />
        {item.label}
      </Link>
    );
  }

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-tomato/10 bg-paper-card">
      <div className="flex h-16 items-center gap-2 border-b border-tomato/10 px-6">
        <ChefHat className="h-7 w-7 text-tomato" />
        <span className="font-heading text-lg font-bold text-ink-strong">Fridgenie Admin</span>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto p-4">
        <div className="space-y-1">
          <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-ink/40">Core</p>
          {coreNavItems.map(renderNavItem)}
        </div>

        <div className="space-y-1">
          <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-ink/40">Analytics</p>
          {analyticsNavItems.map(renderNavItem)}
        </div>

        <div className="space-y-1">
          <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-ink/40">Tools</p>
          {toolNavItems.map(renderNavItem)}
        </div>
      </nav>

      <div className="border-t border-tomato/10 p-4">
        <div className="mb-3 truncate px-3 text-xs text-ink/40">
          {profile?.email || "Admin"}
        </div>
        <button
          onClick={signOut}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-ink/60 transition-colors hover:bg-tomato/5 hover:text-ink"
        >
          <LogOut className="h-4.5 w-4.5" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
