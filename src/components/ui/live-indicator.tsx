"use client";

interface LiveIndicatorProps {
  connected: boolean;
}

export function LiveIndicator({ connected }: LiveIndicatorProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="relative flex h-2.5 w-2.5">
        {connected && (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-tomato opacity-75" />
        )}
        <span
          className={`relative inline-flex h-2.5 w-2.5 rounded-full ${
            connected ? "bg-tomato" : "bg-ink/30"
          }`}
        />
      </span>
      <span className="text-xs font-medium text-ink/50">
        {connected ? "Live" : "Connecting..."}
      </span>
    </div>
  );
}
