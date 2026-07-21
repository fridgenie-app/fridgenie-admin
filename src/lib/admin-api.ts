"use client";

import { supabase } from "./supabase";
import type { Overview, CostRow, UserRow } from "@/types/database";

async function authHeaders(): Promise<HeadersInit> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) throw new Error("Not authenticated");
  return { Authorization: `Bearer ${token}` };
}

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch {
      /* ignore parse errors */
    }
    throw new Error(message);
  }
  return res.json() as Promise<T>;
}

export async function getOverview(): Promise<Overview> {
  const res = await fetch("/api/admin/overview", {
    headers: await authHeaders(),
    cache: "no-store",
  });
  return handle<Overview>(res);
}

export async function getCost(from?: string, to?: string): Promise<CostRow[]> {
  const params = new URLSearchParams();
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  const qs = params.toString();
  const res = await fetch(`/api/admin/cost${qs ? `?${qs}` : ""}`, {
    headers: await authHeaders(),
    cache: "no-store",
  });
  return handle<CostRow[]>(res);
}

export async function getUsers(): Promise<UserRow[]> {
  const res = await fetch("/api/admin/users", {
    headers: await authHeaders(),
    cache: "no-store",
  });
  return handle<UserRow[]>(res);
}

export async function setTier(
  userId: string,
  tier: "free" | "pro"
): Promise<void> {
  const res = await fetch("/api/admin/set-tier", {
    method: "POST",
    headers: { ...(await authHeaders()), "Content-Type": "application/json" },
    body: JSON.stringify({ userId, tier }),
  });
  await handle<{ ok: true }>(res);
}

export async function setDeleted(
  userId: string,
  deleted: boolean
): Promise<void> {
  const res = await fetch("/api/admin/set-deleted", {
    method: "POST",
    headers: { ...(await authHeaders()), "Content-Type": "application/json" },
    body: JSON.stringify({ userId, deleted }),
  });
  await handle<{ ok: true }>(res);
}
