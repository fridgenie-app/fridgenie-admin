"use client";

import { useEffect, useState } from "react";
import { supabase } from "./supabase";
import type { RealtimeChannel } from "@supabase/supabase-js";

type PostgresChangeEvent = "INSERT" | "UPDATE" | "DELETE" | "*";

interface UseRealtimeOptions {
  table: string;
  event?: PostgresChangeEvent;
  schema?: string;
  onRecord?: (payload: { new: Record<string, unknown>; old: Record<string, unknown>; eventType: string }) => void;
}

export function useRealtime({ table, event = "*", schema = "public", onRecord }: UseRealtimeOptions) {
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const channel: RealtimeChannel = supabase
      .channel(`realtime-${table}`)
      .on(
        "postgres_changes" as never,
        { event, schema, table },
        (payload: { new: Record<string, unknown>; old: Record<string, unknown>; eventType: string }) => {
          onRecord?.(payload);
        }
      )
      .subscribe((status: string) => {
        setConnected(status === "SUBSCRIBED");
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, event, schema, onRecord]);

  return { connected };
}
