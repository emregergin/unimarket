"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Mail, User as UserIcon, ArrowRight, KeyRound, CheckCircle2, ShieldCheck } from "lucide-react";
import { TopBar } from "@/components/nav/top-bar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { OtpInput } from "@/components/auth/otp-input";
import { sendOtpAction, verifyOtpAction } from "../actions";
import { isUniversityEmail, lookupUniversity } from "@/lib/auth/university-domains";

type Step = "form" | "code";

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("form");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const trimmedEmail = email.trim();
  const eduOk = isUniversityEmail(trimmedEmail);
  const uni = lookupUniversity(trimmedEmail);
  const formValid = name.trim().length >= 2 && eduOk;

  function sendCode() {
    setError(null);
    const fd = new FormData();
    fd.append("email", trimmedEmail);
    startTransition(async () => {
      const res = await sendOtpAction(fd);
      if (!res.ok) return setError(res.error);
      setStep("code");
    });
  }

  function verifyCode() {
    setError(null);
    const fd = new FormData();
    fd.append("email", trimmedEmail);
    fd.append("token", code);
    startTransition(async () => {
      const res = await verifyOtpAction(fd);
      if (!res.ok) return setError(res.error);
      router.replace("/kesfet");
      router.refresh();
    });
  }

  return (
    <>
      <TopBar title={step === "form" ? "Hesap Oluştur" : "Kodu Onayla"} showBack />
      <main className="flex flex-col gap-6 px-5 pb-10 pt-2">
        {step === "form" ? (
          <>
            <div className="flex flex-col gap-3">
              <Badge variant="success" size="lg" className="self-start">
                <ShieldCheck className="h-3.5 w-3.5" /> Sadece Doğrulanmış Öğrenciler
              </Badge>
              <h1 className="text-2xl font-bold tracking-tight">Aramıza katıl</h1>
              <p className="text-[15px] leading-relaxed text-muted-foreground">
                Üniversite e-postanla kayıt ol — sadece doğrulanmış öğrenciler
                alışveriş yapabilir.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <Input
                placeholder="Ad Soyad"
                leftIcon={<UserIcon className="h-4 w-4" />}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <Input
                type="email"
                inputMode="email"
                placeholder="ad.soyad@boun.edu.tr"
                leftIcon={<Mail className="h-4 w-4" />}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              {uni && (
                <div className="flex items-center gap-2 rounded-2xl bg-success-bg px-3 py-2 text-success">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="text-[13px] font-medium">{uni.name} algılandı</span>
                </div>
              )}
            </div>

            {error && (
              <div className="rounded-2xl border border-destructive/40 bg-destructive/10 p-3 text-[13px] text-destructive">
                {error}
              </div>
            )}

            <Button size="lg" disabled={!formValid || pending} onClick={sendCode}>
              {pending ? "Gönderiliyor…" : "Devam Et"} <ArrowRight className="h-4 w-4" />
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Zaten hesabın var mı?{" "}
              <Link href="/giris" className="font-medium text-foreground underline">
                Giriş yap
              </Link>
            </p>
          </>
        ) : (
          <>
            <div className="flex flex-col gap-2">
              <h1 className="text-2xl font-bold tracking-tight">6 haneli kodu gir</h1>
              <p className="text-[15px] text-muted-foreground">
                <span className="font-medium text-foreground">{trimmedEmail}</span> adresine
                gönderdiğimiz kodu yaz.
              </p>
            </div>
            <OtpInput value={code} onChange={setCode} />
            {error && (
              <div className="rounded-2xl border border-destructive/40 bg-destructive/10 p-3 text-[13px] text-destructive">
                {error}
              </div>
            )}
            <Button size="lg" disabled={code.length !== 6 || pending} onClick={verifyCode}>
              <KeyRound className="h-4 w-4" />
              {pending ? "Doğrulanıyor…" : "Hesabı Oluştur"}
            </Button>
            <button
              onClick={() => {
                setStep("form");
                setCode("");
                setError(null);
              }}
              className="text-center text-sm text-muted-foreground underline"
            >
              Bilgileri değiştir
            </button>
          </>
        )}
      </main>
    </>
  );
}
