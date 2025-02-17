"use client";
import React from "react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  SidebarTrigger,
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { AppSidebar } from "@/components/app-sidebar";

export default function Page() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [successMessage, setSuccessMessage] = useState<string | undefined>();

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    // Reset error and success messages
    setError(undefined);
    setSuccessMessage(undefined);

    try {
      // Example API request
      const response = await fetch(
        "https://sea-lion-app-d2vet.ondigitalocean.app/api/users/change-password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ newPassword: password }), // Send the new password
        },
      );

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage(data.message);
      } else {
        setError(data.error || "An error occurred");
      }
    } catch {
      setError("An error occurred while resetting the password");
    }
  };

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <h1 className="text-xl font-semibold">Reset Password</h1>
          </div>
        </header>
        <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
          <div className="w-full max-w-sm">
            <h3 className="mb-4 text-center">Reset Your Password</h3>
            <form onSubmit={handleResetPassword}>
              <div className="mb-4">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700"
                >
                  New Password
                </label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter new password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-2"
                  required
                />
              </div>
              <div className="mb-4">
                <label
                  htmlFor="confirm-password"
                  className="block text-sm font-medium text-gray-700"
                >
                  Confirm Password
                </label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="mt-2"
                  required
                />
              </div>
              {error && (
                <div className="mb-4 text-sm text-red-500">{error}</div>
              )}
              {successMessage && (
                <div className="mb-4 text-sm text-green-500">
                  {successMessage}
                </div>
              )}
              <Button type="submit" className="w-full">
                Reset Password
              </Button>
            </form>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
