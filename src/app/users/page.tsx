"use client";

import { useEffect, useState, useMemo } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
import { showToast } from "@/components/ui/toast";
import { getUsers, setTier, setDeleted } from "@/lib/admin-api";
import { formatDate, exportToCsv } from "@/lib/utils";
import { Search, Download, Crown, Trash2, RotateCcw } from "lucide-react";
import type { UserRow } from "@/types/database";

export default function UsersPage() {
  const [users, setUsers] = useState<UserRow[] | null>(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    try {
      const data = await getUsers();
      setUsers(data);
    } catch (e) {
      setError((e as Error).message ?? "Failed to load users");
      setUsers([]);
    }
  }

  async function handleTier(user: UserRow) {
    const next = user.subscription_tier === "pro" ? "free" : "pro";
    setBusy(user.id);
    // optimistic
    setUsers((prev) =>
      prev?.map((u) => (u.id === user.id ? { ...u, subscription_tier: next } : u)) ?? null
    );
    try {
      await setTier(user.id, next);
      showToast(next === "pro" ? "Granted Pro" : "Revoked Pro", "success");
      await fetchUsers();
    } catch (e) {
      showToast((e as Error).message ?? "Failed to update tier", "warning");
      await fetchUsers();
    } finally {
      setBusy(null);
    }
  }

  async function handleDeleted(user: UserRow) {
    const next = !user.deleted_at;
    setBusy(user.id);
    setUsers((prev) =>
      prev?.map((u) =>
        u.id === user.id
          ? { ...u, deleted_at: next ? new Date().toISOString() : null }
          : u
      ) ?? null
    );
    try {
      await setDeleted(user.id, next);
      showToast(next ? "User soft-deleted" : "User restored", "success");
      await fetchUsers();
    } catch (e) {
      showToast((e as Error).message ?? "Failed to update status", "warning");
      await fetchUsers();
    } finally {
      setBusy(null);
    }
  }

  const filtered = useMemo(() => {
    if (!users) return null;
    if (!search) return users;
    const q = search.toLowerCase();
    return users.filter(
      (u) =>
        (u.email && u.email.toLowerCase().includes(q)) || u.id.toLowerCase().includes(q)
    );
  }, [users, search]);

  function handleExport() {
    if (!filtered) return;
    exportToCsv(
      filtered.map((u) => ({
        id: u.id,
        email: u.email ?? "",
        subscription_tier: u.subscription_tier,
        is_admin: u.is_admin,
        status: u.deleted_at ? "deleted" : "active",
        created_at: u.created_at,
        last_active_at: u.last_active_at ?? "",
      })),
      "fridgenie-users.csv"
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading text-3xl font-bold text-ink-strong">Users</h1>
            <p className="mt-1 text-ink/60">Manage and view all Fridgenie users</p>
          </div>
          <Button variant="secondary" onClick={handleExport} disabled={!filtered}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>

        {error && (
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-tomato">Could not load users: {error}</p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" />
                <Input
                  placeholder="Search by email or id..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <span className="text-sm text-ink/60">{filtered?.length ?? 0} users</span>
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
                    <TableHead>Tier</TableHead>
                    <TableHead>Admin</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Last active</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-ink/40">
                        No users found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((user) => {
                      const isPro = user.subscription_tier === "pro";
                      const isDeleted = Boolean(user.deleted_at);
                      return (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div className="font-medium text-ink-strong">
                              {user.email || "—"}
                            </div>
                            <div className="text-xs text-ink/40">{user.id}</div>
                          </TableCell>
                          <TableCell>
                            {isPro ? (
                              <Badge variant="default">Pro</Badge>
                            ) : (
                              <Badge variant="secondary">Free</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {user.is_admin ? (
                              <Badge variant="outline">Admin</Badge>
                            ) : (
                              <span className="text-ink/30">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {isDeleted ? (
                              <Badge variant="warning">Deleted</Badge>
                            ) : (
                              <Badge variant="success">Active</Badge>
                            )}
                          </TableCell>
                          <TableCell>{formatDate(user.created_at)}</TableCell>
                          <TableCell>
                            {user.last_active_at ? formatDate(user.last_active_at) : "—"}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                disabled={busy === user.id}
                                onClick={() => handleTier(user)}
                                title={isPro ? "Revoke Pro" : "Grant Pro"}
                              >
                                <Crown className="mr-1.5 h-4 w-4" />
                                {isPro ? "Revoke Pro" : "Grant Pro"}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                disabled={busy === user.id}
                                onClick={() => handleDeleted(user)}
                                title={isDeleted ? "Restore" : "Soft-delete"}
                              >
                                {isDeleted ? (
                                  <RotateCcw className="mr-1.5 h-4 w-4" />
                                ) : (
                                  <Trash2 className="mr-1.5 h-4 w-4" />
                                )}
                                {isDeleted ? "Restore" : "Soft-delete"}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
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
