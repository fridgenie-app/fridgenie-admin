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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";

const navItems = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/users", label: "Users", icon: Users },
  { href: "/households", label: "Households", icon: Home },
  { href: "/activity", label: "Activity", icon: Activity },
];

export function Sidebar() {
  const pathname = usePathname();
  const { signOut, profile } = useAuth();
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-slate-800 bg-slate-950">
      <div className="flex h-16 items-center gap-2 border-b border-slate-800 px-6">
        <ChefHat className="h-7 w-7 text-brand-red" />
        <span className="text-lg font-bold text-white">Fridgenie Admin</span>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => {
          const fullHref = basePath + item.href;
          const isActive =
            item.href === "/"
              ? pathname === "/" || pathname === basePath + "/"
              : pathname.startsWith(fullHref) || pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-brand-red/10 text-brand-red"
                  : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-800 p-4">
        <div className="mb-3 truncate px-3 text-xs text-slate-500">
          {profile?.email || "Admin"}
        </div>
        <button
          onClick={signOut}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-200"
        >
          <LogOut className="h-5 w-5" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
