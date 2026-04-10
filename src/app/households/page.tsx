"use client";

import { useEffect, useState, useMemo } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/lib/supabase";
import { formatDate } from "@/lib/utils";
import { Search } from "lucide-react";
import type { HouseholdRow } from "@/types/database";

export default function HouseholdsPage() {
  const [households, setHouseholds] = useState<HouseholdRow[] | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchHouseholds();
  }, []);

  async function fetchHouseholds() {
    const { data } = await supabase
      .from("households")
      .select("*")
      .order("created_at", { ascending: false });

    if (!data) {
      setHouseholds([]);
      return;
    }

    const rows: HouseholdRow[] = await Promise.all(
      data.map(async (h) => {
        const [membersRes, itemsRes, recipesRes] = await Promise.all([
          supabase
            .from("household_members")
            .select("id", { count: "exact", head: true })
            .eq("household_id", h.id),
          supabase
            .from("pantry_items")
            .select("id", { count: "exact", head: true })
            .eq("household_id", h.id),
          supabase
            .from("recipe_cooked_history")
            .select("id", { count: "exact", head: true })
            .eq("household_id", h.id),
        ]);

        return {
          id: h.id,
          name: h.name,
          created_at: h.created_at,
          member_count: membersRes.count ?? 0,
          items_count: itemsRes.count ?? 0,
          recipes_cooked: recipesRes.count ?? 0,
        };
      })
    );

    setHouseholds(rows);
  }

  const filtered = useMemo(() => {
    if (!households) return null;
    if (!search) return households;
    const q = search.toLowerCase();
    return households.filter((h) => h.name.toLowerCase().includes(q));
  }, [households, search]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Households</h1>
          <p className="mt-1 text-slate-400">
            View all Fridgenie households and their activity
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <Input
                  placeholder="Search households..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <span className="text-sm text-slate-400">
                {filtered?.length ?? 0} households
              </span>
            </div>
          </CardHeader>
          <CardContent>
            {filtered === null ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Household</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Members</TableHead>
                    <TableHead>Pantry Items</TableHead>
                    <TableHead>Recipes Cooked</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-slate-500">
                        No households found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((h) => (
                      <TableRow key={h.id}>
                        <TableCell className="font-medium text-white">
                          {h.name}
                        </TableCell>
                        <TableCell>{formatDate(h.created_at)}</TableCell>
                        <TableCell>{h.member_count}</TableCell>
                        <TableCell>{h.items_count}</TableCell>
                        <TableCell>{h.recipes_cooked}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
