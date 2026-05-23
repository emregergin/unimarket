"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, useTransition } from "react";
import { Mail, ArrowRight, KeyRound, CheckCircle2 } from "lucide-react";
import { TopBar } from "@/components/nav/top-bar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { OtpInput } from "@/components/auth/otp-input";
import { sendOtpAction, verifyOtpAction } from "../actions";
import { isUniversityEmail } from "@/lib/auth/university-domains";

type Step = "email" | "code";

export default function LoginPage() {
  return (
    <Suspense fallback={<TopBar title="Giriş Yap" showBack />}>
      <LoginPageInner />
    </Suspense>
  );
}

function LoginPageInner() {
  const router = useRouter();
  const params = useSearchParams();
  const redirectTo = params.get("redirect") ?? "/kesfet";

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  function sendCode() {
    setError(null);
    const fd = new FormData();
    fd.append("email", email.trim());
    startTransition(async () => {
      const res = await sendOtpAction(fd);
      if (!res.ok) return setError(res.error);
      setInfo(res.message ?? null);
      setStep("code");
    });
  }

  function verifyCode() {
    setError(null);
    const fd = new FormData();
    fd.append("email", email.trim());
    fd.append("token", code);
    startTransition(async () => {
      const res = await verifyOtpAction(fd);
      if (!res.ok) return setError(res.error);
      router.replace(isUniversityEmail(email) ? redirectTo : "/dogrulama");
      router.refresh();
    });
  }

  return (
    <>
      <TopBar title={step === "email" ? "Giriş Yap" : "Kodu Onayla"} showBack />
      <main className="flex flex-col gap-6 px-5 pb-10 pt-2">
        {step === "email" ? (
          <>
            <div className="flex flex-col gap-2">
              <h1 className="text-2xl font-bold tracking-tight">Tekrar hoş geldin</h1>
              <p className="text-[15px] text-muted-foreground">
                E-postana 6 haneli giriş kodu göndereceğiz. Şifre yok.
              </p>
            </div>
            <Input
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="ad.soyad@boun.edu.tr"
              leftIcon={<Mail className="h-4 w-4" />}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {error && <ErrorBanner message={error} />}
            <Button size="lg" disabled={!emailValid || pending} onClick={sendCode}>
              {pending ? "Gönderiliyor…" : "Kodu Gönder"}
              <ArrowRight className="h-4 w-4" />
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Hesabın yok mu?{" "}
              <Link href="/kayit" className="font-medium text-foreground underline">
                Kayıt ol
              </Link>
            </p>
          </>
        ) : (
          <>
            <div className="flex flex-col gap-2">
              <h1 className="text-2xl font-bold tracking-tight">6 haneli kodu gir</h1>
              <p className="text-[15px] text-muted-foreground">
                <span className="font-medium text-foreground">{email}</span> adresine
                gönderdiğimiz kodu aşağıya yaz.
              </p>
            </div>
            {info && (
              <div className="flex items-start gap-2 rounded-2xl bg-success-bg p-3 text-success">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                <p className="text-[13px]">{info}</p>
              </div>
            )}
            <OtpInput value={code} onChange={setCode} />
            {error && <ErrorBanner message={error} />}
            <Button
              size="lg"
              disabled={code.length !== 6 || pending}
              onClick={verifyCode}
            >
              <KeyRound className="h-4 w-4" />
              {pending ? "Doğrulanıyor…" : "Onayla ve Giriş Yap"}
            </Button>
            <button
              onClick={() => {
                setStep("email");
                setCode("");
                setError(null);
                setInfo(null);
              }}
              className="text-center text-sm text-muted-foreground underline"
            >
              E-posta adresini değiştir
            </button>
          </>
        )}
      </main>
    </>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-destructive/40 bg-destructive/10 p-3 text-[13px] text-destructive">
      {message}
    </div>
  );
}
