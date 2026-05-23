"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { CheckCircle2, AlertCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Variant = "success" | "error" | "info";

interface Toast {
  id: string;
  message: string;
  variant: Variant;
}

interface ToastContextValue {
  toast: (message: string, variant?: Variant) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

/**
 * Wrap once at the root. Lightweight: no portal, no animations beyond a fade,
 * mobile-first (bottom-center, above the nav).
 */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);
  const timers = useRef<Map<string, number>>(new Map());

  const dismiss = useCallback((id: string) => {
    setItems((prev) => prev.filter((t) => t.id !== id));
    const t = timers.current.get(id);
    if (t) {
      clearTimeout(t);
      timers.current.delete(id);
    }
  }, []);

  const toast = useCallback(
    (message: string, variant: Variant = "info") => {
      const id = crypto.randomUUID();
      setItems((prev) => [...prev, { id, message, variant }]);
      const handle = window.setTimeout(() => dismiss(id), 3500);
      timers.current.set(id, handle);
    },
    [dismiss]
  );

  const value = useMemo(() => ({ toast }), [toast]);

  useEffect(() => {
    const map = timers.current;
    return () => {
      map.forEach((h) => clearTimeout(h));
      map.clear();
    };
  }, []);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="pointer-events-none fixed inset-x-0 bottom-24 z-50 mx-auto flex max-w-md flex-col items-center gap-2 px-4"
      >
        {items.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const variantClass = {
    success: "bg-success-bg text-success border-success/30",
    error: "bg-destructive/10 text-destructive border-destructive/30",
    info: "bg-background text-foreground border-border",
  }[toast.variant];

  const Icon = toast.variant === "error" ? AlertCircle : CheckCircle2;
  const showIcon = toast.variant !== "info";

  return (
    <div
      role="status"
      className={cn(
        "pointer-events-auto flex w-full items-start gap-2 rounded-2xl border px-4 py-3 shadow-cardHover animate-fadeIn",
        variantClass
      )}
    >
      {showIcon && <Icon className="mt-0.5 h-4 w-4 shrink-0" />}
      <p className="flex-1 text-[13px] leading-relaxed">{toast.message}</p>
      <button
        onClick={onDismiss}
        aria-label="Kapat"
        className="grid h-5 w-5 place-items-center rounded-full opacity-60 hover:opacity-100"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}
