// components/login-form.tsx
"use client";
import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function LoginForm({ className, ...props }: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<React.ReactNode>();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError("");

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/users/login`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username: email, password }),
      },
    );

    if (!response.ok) {
      const raw = await response.text().catch(() => "");
      const j = JSON.parse(raw);
      if (j?.error || j?.message) {
        setError(j.error || j.message);
      } else {
        setError("An unknown error occurred");
      }

      if (response.status === 403) {
  setError(
    <>
      Forbidden. Are you trying to log in to the counter app? Please go to{" "}
      <a
        href="https://counter.pubquery.se"
        target="_blank"
        rel="noopener noreferrer"
        className="underline underline-offset-4"
      >
        counter.pubquery.se
      </a>
      .
    </>
  );
  return;
}
    }

    router.push("/dashboard");
  } catch (error_: unknown) {
    setError(
      error_ instanceof Error ? error_.message : "An error occurred. Please try again."
    );
  }
};

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Login</CardTitle>
          <CardDescription>
            Behöver ditt klubbmästeri / sektion / förening ett konto? Kontakta info@pubquery.se
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div className="grid gap-2">
              <Label htmlFor="email">Username or email</Label>
              <Input
                id="email"
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="username"
                required
              />
            </div>
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
               <Link
                href="/forgot-password"
                className="rounded-sm text-xs text-blue-600 underline-offset-4 hover:text-blue-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/20"
              >
                Forgot password?
              </Link>
                            </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button type="submit" className="w-full">Login</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
