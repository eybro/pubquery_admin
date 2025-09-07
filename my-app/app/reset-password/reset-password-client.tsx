"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const API_BASE = process.env.NEXT_PUBLIC_API_URL; // change to `${API_BASE}/api` if needed

export default function ResetPasswordClient() {
  const sp = useSearchParams();
  const router = useRouter();
  const token = sp.get("token") || "";

  const [checking, setChecking] = useState(true);
  const [valid, setValid] = useState<boolean | undefined>();
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [err, setErr] = useState<string | undefined>();
  const [ok, setOk] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const disabled = useMemo(() => {
    if (!pw || !pw2) return true;
    if (pw !== pw2) return true;
    if (pw.length < 6) return true;
    return false;
  }, [pw, pw2]);

  useEffect(() => {
    let cancelled = false;
    const verify = async () => {
      if (!token || token.length < 10) {
        setValid(false);
        setChecking(false);
        return;
      }
      try {
        const res = await fetch(
          `${API_BASE}/api/auth/verify-password-reset?token=${encodeURIComponent(token)}`,
          {
            method: "GET",
            cache: "no-store",
            referrerPolicy: "no-referrer",
          }
        );
        const data = await res.json().catch(() => ({}));
        if (!cancelled) setValid(Boolean(data?.valid));
      } catch {
        if (!cancelled) setValid(false);
      } finally {
        if (!cancelled) setChecking(false);
      }
    };
    verify();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(undefined);
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: pw }),
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || "Reset failed");
      }
      setOk(true);
    } catch {
      setErr("Could not reset password. The link may have expired. Request a new one.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-svh w-full items-start justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <Card>
          <CardHeader>
            <CardTitle>Reset password</CardTitle>
            <CardDescription>Choose a new password for your account.</CardDescription>
          </CardHeader>
          <CardContent>
            {(() => {
              if (checking) {
                return <p className="text-sm">Verifying link…</p>;
              }
              if (valid === false) {
                return (
                  <div className="space-y-4">
                    <p className="text-sm text-red-600">This reset link is invalid or has expired.</p>
                    <Link href="/forgot-password" className="text-sm underline underline-offset-4">
                      Request a new reset link
                    </Link>
                  </div>
                );
              }
              if (ok) {
                return (
                  <div className="space-y-4">
                    <p className="text-sm">Your password has been changed successfully.</p>
                    <Button className="w-full" onClick={() => router.push("/login")}>
                      Go to login
                    </Button>
                  </div>
                );
              }
              return (
                <form onSubmit={onSubmit} className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="pw">New password</Label>
                    <Input
                      id="pw"
                      type="password"
                      value={pw}
                      onChange={(e) => setPw(e.target.value)}
                      autoComplete="new-password"
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="pw2">Confirm new password</Label>
                    <Input
                      id="pw2"
                      type="password"
                      value={pw2}
                      onChange={(e) => setPw2(e.target.value)}
                      autoComplete="new-password"
                      required
                    />
                  </div>
                  {pw && pw2 && pw !== pw2 && (
                    <p className="text-sm text-red-500">Passwords do not match.</p>
                  )}
                  {pw && pw.length < 6 && (
                    <p className="text-sm text-muted-foreground">Use at least 6 characters.</p>
                  )}
                  {err && <p className="text-sm text-red-600">{err}</p>}
                  <Button type="submit" className="w-full" disabled={disabled || submitting}>
                    {submitting ? "Saving…" : "Set new password"}
                  </Button>
                </form>
              );
            })()}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
