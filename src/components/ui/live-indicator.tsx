"use client";

interface LiveIndicatorProps {
  connected: boolean;
}

export function LiveIndicator({ connected }: LiveIndicatorProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="relative flex h-2.5 w-2.5">
        {connected && (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-forest opacity-75" />
        )}
        <span
          className={`relative inline-flex h-2.5 w-2.5 rounded-full ${
            connected ? "bg-forest" : "bg-bark/30"
          }`}
        />
      </span>
      <span className="text-xs font-medium text-bark/50">
        {connected ? "Live" : "Connecting..."}
      </span>
    </div>
  );
}
