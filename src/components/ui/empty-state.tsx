import Link from "next/link";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: { label: string; href: string };
  className?: string;
}

/**
 * Consistent empty-state used across feed, favorites, reservations, chats.
 */
export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center gap-3 py-16 text-center", className)}>
      <div
        aria-hidden="true"
        className="grid h-14 w-14 place-items-center rounded-full bg-muted text-muted-foreground"
      >
        {icon}
      </div>
      <p className="text-sm font-medium">{title}</p>
      {description && (
        <p className="max-w-[260px] text-[12px] leading-relaxed text-muted-foreground">
          {description}
        </p>
      )}
      {action && (
        <Link
          href={action.href}
          className="mt-1 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground active:scale-95 transition"
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}
