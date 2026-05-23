import * as React from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-2xl bg-muted/60 dark:bg-muted/40 p-5", className)}
      {...props}
    />
  );
}
