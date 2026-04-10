"use client";

import { useEffect, useState, useMemo } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { formatDate, exportToCsv } from "@/lib/utils";
import { Search, Download, Shield, ShieldOff } from "lucide-react";
import type { UserRow } from "@/types/database";

export default function UsersPage() {
  const [users, setUsers] = useState<UserRow[] | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (!profiles) {
      setUsers([]);
      return;
    }

    const userRows: UserRow[] = await Promise.all(
      profiles.map(async (p) => {
        const [householdRes, itemsRes, recipesRes] = await Promise.all([
          supabase
            .from("household_members")
            .select("id", { count: "exact", head: true })
            .eq("user_id", p.id),
          supabase
            .from("pantry_items")
            .select("id", { count: "exact", head: true })
            .eq("added_by", p.id),
          supabase
            .from("recipe_cooked_history")
            .select("id", { count: "exact", head: true })
            .eq("user_id", p.id),
        ]);

        return {
          id: p.id,
          email: p.email,
          display_name: p.display_name,
          created_at: p.created_at,
          is_admin: p.is_admin ?? false,
          household_count: householdRes.count ?? 0,
          items_count: itemsRes.count ?? 0,
          recipes_cooked: recipesRes.count ?? 0,
        };
      })
    );

    setUsers(userRows);
  }

  async function toggleAdmin(userId: string, currentValue: boolean) {
    await supabase
      .from("profiles")
      .update({ is_admin: !currentValue })
      .eq("id", userId);

    setUsers(
      (prev) =>
        prev?.map((u) =>
          u.id === userId ? { ...u, is_admin: !currentValue } : u
        ) ?? null
    );
  }

  const filtered = useMemo(() => {
    if (!users) return null;
    if (!search) return users;
    const q = search.toLowerCase();
    return users.filter(
      (u) =>
        u.email.toLowerCase().includes(q) ||
        (u.display_name && u.display_name.toLowerCase().includes(q))
    );
  }, [users, search]);

  function handleExport() {
    if (!filtered) return;
    exportToCsv(
      filtered.map((u) => ({
        email: u.email,
        display_name: u.display_name ?? "",
        created_at: u.created_at,
        is_admin: u.is_admin,
        household_count: u.household_count,
        items_count: u.items_count,
        recipes_cooked: u.recipes_cooked,
      })),
      "fridgenie-users.csv"
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading text-3xl font-bold text-bark">Users</h1>
            <p className="mt-1 text-bark/60">
              Manage and view all Fridgenie users
            </p>
          </div>
          <Button variant="secondary" onClick={handleExport} disabled={!filtered}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-bark/40" />
                <Input
                  placeholder="Search by email or name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <span className="text-sm text-bark/60">
                {filtered?.length ?? 0} users
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
                    <TableHead>User</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Households</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Recipes</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-bark/40">
                        No users found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium text-bark">
                              {user.display_name || "No name"}
                            </div>
                            <div className="text-xs text-bark/40">
                              {user.email}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{formatDate(user.created_at)}</TableCell>
                        <TableCell>{user.household_count}</TableCell>
                        <TableCell>{user.items_count}</TableCell>
                        <TableCell>{user.recipes_cooked}</TableCell>
                        <TableCell>
                          {user.is_admin ? (
                            <Badge variant="default">Admin</Badge>
                          ) : (
                            <Badge variant="secondary">User</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleAdmin(user.id, user.is_admin)}
                            title={user.is_admin ? "Remove admin" : "Make admin"}
                          >
                            {user.is_admin ? (
                              <ShieldOff className="h-4 w-4" />
                            ) : (
                              <Shield className="h-4 w-4" />
                            )}
                          </Button>
                        </TableCell>
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
