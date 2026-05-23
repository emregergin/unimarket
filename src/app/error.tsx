"use client";
import { useEffect } from "react";
import { AlertCircle, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error("[unimarket] route error:", error);
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="grid h-16 w-16 place-items-center rounded-full bg-destructive/10 text-destructive">
        <AlertCircle className="h-7 w-7" />
      </div>
      <div className="flex flex-col gap-1">
        <h1 className="text-lg font-semibold">Bir şeyler ters gitti</h1>
        <p className="max-w-[280px] text-[13px] text-muted-foreground">
          Üzgünüz, sayfa yüklenirken bir hata oluştu. Tekrar denemek ister misin?
        </p>
        {error.digest && (
          <p className="mt-2 text-[10px] font-mono text-muted-foreground/70">
            Hata kodu: {error.digest}
          </p>
        )}
      </div>
      <Button onClick={reset}>
        <RotateCw className="h-4 w-4" />
        Tekrar Dene
      </Button>
    </main>
  );
}
