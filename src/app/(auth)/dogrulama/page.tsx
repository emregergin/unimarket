"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  GraduationCap,
  Mail,
  FileText,
  ShieldCheck,
  ArrowRight,
  KeyRound,
  CheckCircle2,
} from "lucide-react";
import { TopBar } from "@/components/nav/top-bar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { OtpInput } from "@/components/auth/otp-input";
import { sendOtpAction, verifyOtpAction } from "../actions";
import { isUniversityEmail, lookupUniversity } from "@/lib/auth/university-domains";

type Step = "email" | "code";

export default function VerificationPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const valid = /\.edu\.tr$/i.test(email.trim()) || isUniversityEmail(email.trim());
  const uni = lookupUniversity(email.trim());

  function sendCode() {
    setError(null);
    const fd = new FormData();
    fd.append("email", email.trim());
    startTransition(async () => {
      const res = await sendOtpAction(fd);
      if (!res.ok) return setError(res.error);
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
      router.replace("/kesfet");
      router.refresh();
    });
  }

  return (
    <>
      <TopBar title="Öğrenci Doğrulama" showBack />
      <main className="flex flex-col gap-6 px-5 pb-10 pt-2">
        {step === "email" ? (
          <>
            <div className="flex flex-col items-start gap-3">
              <Badge variant="success" size="lg">
                <ShieldCheck className="h-3.5 w-3.5" /> Sadece Doğrulanmış Öğrenciler
              </Badge>
              <h1 className="text-2xl font-bold tracking-tight">
                Üniversite e-postanı doğrula
              </h1>
              <p className="text-[15px] leading-relaxed text-muted-foreground">
                Güvenli bir topluluk için <strong>.edu.tr</strong> uzantılı e-posta
                adresini kullanarak öğrenci statünü doğrula. E-postana 6 haneli
                bir kod göndereceğiz.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <label className="text-sm font-medium">Üniversite e-postan</label>
              <Input
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="ad.soyad@boun.edu.tr"
                leftIcon={<Mail className="h-4 w-4" />}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <p className="text-[12px] text-muted-foreground">
                Örnek: <span className="text-foreground">@boun.edu.tr</span>,{" "}
                <span className="text-foreground">@metu.edu.tr</span>,{" "}
                <span className="text-foreground">@itu.edu.tr</span>
              </p>
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

            <Button size="lg" disabled={!valid || pending} onClick={sendCode}>
              {pending ? "Gönderiliyor…" : "Doğrulama Kodunu Gönder"}
              <ArrowRight className="h-4 w-4" />
            </Button>

            <div className="relative my-2 flex items-center gap-3">
              <div className="h-px flex-1 bg-border" />
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
                veya
              </span>
              <div className="h-px flex-1 bg-border" />
            </div>

            <Card className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-background">
                  <FileText className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">Belge ile doğrula</p>
                  <p className="text-[12px] text-muted-foreground">
                    .edu.tr e-postan yoksa öğrenci belgeni yükle.
                  </p>
                </div>
              </div>
              <Button variant="secondary" size="md" disabled>
                Belge Yükle (yakında)
              </Button>
            </Card>

            <div className="mt-2 flex items-start gap-2 rounded-2xl border border-border p-4">
              <GraduationCap className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <p className="text-[12px] leading-relaxed text-muted-foreground">
                Bilgilerin yalnızca öğrenci statünü doğrulamak için kullanılır.
                Profilinde yalnızca üniversite adın görünür.
              </p>
            </div>
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
            <OtpInput value={code} onChange={setCode} />
            {error && (
              <div className="rounded-2xl border border-destructive/40 bg-destructive/10 p-3 text-[13px] text-destructive">
                {error}
              </div>
            )}
            <Button size="lg" disabled={code.length !== 6 || pending} onClick={verifyCode}>
              <KeyRound className="h-4 w-4" />
              {pending ? "Doğrulanıyor…" : "Doğrula"}
            </Button>
            <button
              onClick={() => {
                setStep("email");
                setCode("");
                setError(null);
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
