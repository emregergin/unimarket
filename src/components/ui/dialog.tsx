"use client";
import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  /** Mobile sheet-style (slides up from bottom) vs centered card */
  variant?: "sheet" | "center";
}

/**
 * Accessible modal dialog.
 *  - Locks body scroll while open
 *  - ESC to close
 *  - Click-outside to close
 *  - Focus is moved to the close button on open, restored on close
 *  - Mobile-first: defaults to bottom-sheet variant
 */
export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  variant = "sheet",
}: DialogProps) {
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const previousActiveRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    previousActiveRef.current = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    // Move focus after the dialog has mounted
    const t = setTimeout(() => closeBtnRef.current?.focus(), 50);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
      clearTimeout(t);
      previousActiveRef.current?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? "dialog-title" : undefined}
      aria-describedby={description ? "dialog-desc" : undefined}
      className="fixed inset-0 z-50 flex animate-fadeIn"
    >
      <button
        aria-label="Kapat"
        tabIndex={-1}
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
      />
      <div
        className={cn(
          "relative z-10 mx-auto flex w-full max-w-md flex-col bg-background shadow-cardHover safe-bottom",
          variant === "sheet"
            ? "mt-auto rounded-t-3xl border-t border-border"
            : "my-auto rounded-3xl border border-border"
        )}
      >
        {variant === "sheet" && (
          <div className="flex justify-center pt-2">
            <span className="h-1 w-10 rounded-full bg-border" />
          </div>
        )}
        <div className="flex items-start justify-between px-5 pt-3">
          <div className="flex flex-col gap-1">
            {title && (
              <h2 id="dialog-title" className="text-lg font-semibold tracking-tight">
                {title}
              </h2>
            )}
            {description && (
              <p id="dialog-desc" className="text-[13px] text-muted-foreground">
                {description}
              </p>
            )}
          </div>
          <button
            ref={closeBtnRef}
            onClick={onClose}
            aria-label="Kapat"
            className="grid h-9 w-9 place-items-center rounded-full text-muted-foreground active:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="px-5 pb-5 pt-3">{children}</div>
      </div>
    </div>
  );
}
