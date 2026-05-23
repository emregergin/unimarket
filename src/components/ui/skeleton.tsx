import { cn } from "@/lib/utils";

/**
 * Soft shimmer skeleton block. Use with explicit width/height via className.
 *   <Skeleton className="h-4 w-32" />
 */
export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "rounded-xl bg-gradient-to-r from-muted via-muted/40 to-muted bg-[length:200%_100%] animate-shimmer",
        className
      )}
      {...props}
    />
  );
}
