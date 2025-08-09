"use client";

import React, { useRef, useEffect, useState } from "react";
import {
  SidebarTrigger,
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Textarea } from "@/components/ui/textarea";

type Profile = {
  organizationName: string;
  venue: string;
  username: string;
  fb_page: string;
  venueName: string;
  display_name: string;
  beer_price?: number;
  cider_price?: number;
  drink_price?: number;
  logo_url?: string | null;
};

export default function Page() {
  const [profile, setProfile] = useState<Profile>();
  const [loading, setLoading] = useState(true);
  const [error] = useState("");
  const [saving, setSaving] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [beerPrice, setBeerPrice] = useState<number | "">("");
  const [ciderPrice, setCiderPrice] = useState<number | "">("");
  const [drinkPrice, setDrinkPrice] = useState<number | "">("");
  const [logoUrl, setLogoUrl] = useState<string | undefined>();
  const [logoUploading, setLogoUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState<{
    text: string;
    type: "success" | "error";
  }>();

  const showMessage = (text: string, type: "success" | "error") => {
    setMessage({ text, type });
    setTimeout(() => setMessage(undefined), 3000);
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/users/profile`,
          { credentials: "include" },
        );
        if (!response.ok) throw new Error("Failed to fetch profile");

        const data = await response.json();
        setProfile(data);
        setLogoUrl(data.logo_url || undefined);
        setBeerPrice(data.beer_price ?? "");
        setCiderPrice(data.cider_price ?? "");
        setDrinkPrice(data.drink_price ?? "");
        setDisplayName(data.display_name || "");
        setDescription(data.description || "");
      } catch {
        showMessage("Profile could not be fetched", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleUpdate = async () => {
    setSaving(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/users/display-name`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ display_name: displayName }),
        },
      );
      if (!response.ok) throw new Error("Failed to update display name");

      const updated = await response.json();
      setProfile((prev) =>
        prev ? { ...prev, display_name: updated.display_name } : prev,
      );
      showMessage("Display name updated", "success");
    } catch {
      showMessage("Display name could not be updated", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleSavePrices = async () => {
    setSaving(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/organizations/prices`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            beer_price: beerPrice === "" ? undefined : Number(beerPrice),
            cider_price: ciderPrice === "" ? undefined : Number(ciderPrice),
            drink_price: drinkPrice === "" ? undefined : Number(drinkPrice),
          }),
        },
      );
      if (!response.ok) throw new Error("Failed to update prices");
      showMessage("Prices updated", "success");
    } catch {
      showMessage("Prices could not be updated", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveDescription = async () => {
    setSaving(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/organizations/updateDescription`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ description }),
        },
      );

      if (!response.ok) throw new Error("Failed to update description");

      showMessage("Description updated", "success");
    } catch {
      showMessage("Description could not be updated", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoUploading(true);
    const formData = new FormData();
    formData.append("logo", file);

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/organizations/updateLogo`,
      { method: "POST", credentials: "include", body: formData },
    );
    if (response.ok) {
      const { logo_url } = await response.json();
      setLogoUrl(logo_url);
      showMessage("Logo uploaded!", "success");
    } else {
      showMessage("Logo upload failed", "error");
    }
    setLogoUploading(false);
  };

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        {message && (
          <div
            role="status"
            aria-live="polite"
            className={`fixed inset-x-4 top-4 z-50 rounded-lg px-4 py-2 text-white shadow-lg sm:inset-x-auto sm:right-4 ${
              message.type === "success" ? "bg-green-600" : "bg-red-600"
            }`}
          >
            {message.text}
          </div>
        )}

        <header className="flex h-14 items-center gap-2 border-b bg-background/60 backdrop-blur-sm sm:h-16">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 hidden h-4 sm:block"
            />
            <h1 className="text-base font-semibold sm:text-xl">Profile info</h1>
          </div>
        </header>

        {/* Page wrapper: tighter on mobile, centered content */}
        <div className="w-full px-4 py-6 sm:px-6 md:p-10">
          <main className="mx-auto w-full max-w-[46rem] md:max-w-3xl">
            <Card className="rounded-2xl shadow-lg">
              <CardContent className="space-y-6 p-4 sm:p-6 md:p-8">
                {loading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-6 w-3/4 sm:w-1/2" />
                    <Skeleton className="h-6 w-5/6 sm:w-2/3" />
                    <Skeleton className="h-6 w-2/3 sm:w-1/3" />
                  </div>
                ) : (profile ? (
                  <div className="space-y-6">
                    {/* Info grid */}
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <p className="break-words">
                        <strong>Organization:</strong>{" "}
                        {profile.organizationName}
                      </p>
                      <p className="break-words">
                        <strong>Venue:</strong> {profile.venueName}
                      </p>
                      <p className="break-words">
                        <strong>Username:</strong> {profile.username}
                      </p>
                      <p className="break-words">
                        <strong>Facebook page:</strong>{" "}
                        {profile.fb_page ? (
                          <a
                            href={`https://facebook.com/${profile.fb_page}`}
                            className="text-blue-600 underline underline-offset-2 hover:opacity-80"
                          >
                            {profile.fb_page}
                          </a>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </p>
                    </div>

                    <Separator />

                    {/* Logo upload: stack on mobile */}
                    <div>
                      <label className="mb-1 block text-sm font-medium">
                        Organization Logo
                      </label>
                      <div className="mb-2 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-4">
                          {logoUrl ? (
                            <Image
                              src={logoUrl}
                              alt="Logo preview"
                              width={64}
                              height={64}
                              className="rounded-full border bg-white object-contain"
                              sizes="64px"
                            />
                          ) : (
                            <div className="size-16 rounded-full border bg-muted" />
                          )}
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleLogoChange}
                            disabled={logoUploading}
                          />
                        </div>
                        <Button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={logoUploading}
                          className="w-full sm:w-auto"
                        >
                          {logoUploading
                            ? "Uploading..."
                            : "Upload/Change Logo"}
                        </Button>
                      </div>
                    </div>

                    <Separator />

                    {/* Display name: stack on mobile */}
                    <div>
                      <label className="mb-1 block text-sm font-medium">
                        Display Name (shown on pubquery.se)
                      </label>
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <Input
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          placeholder="Enter your display name"
                          className="w-full"
                        />
                        <Button
                          onClick={handleUpdate}
                          disabled={saving}
                          className="w-full sm:w-auto"
                        >
                          {saving ? "Saving..." : "Update"}
                        </Button>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <label className="mb-1 block text-sm font-medium">
                        Description
                      </label>
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <Textarea
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          placeholder="Write a short description for your organization..."
                          rows={3}
                          className="w-full"
                        />
                        <Button
                          onClick={handleSaveDescription}
                          disabled={saving}
                          className="w-full sm:h-full sm:w-auto"
                        >
                          {saving ? "Saving..." : "Update"}
                        </Button>
                      </div>
                    </div>

                    {/* Prices: single column on mobile, 3-up on sm+; button full-width on mobile */}
                    <div>
                      <label className="mb-1 block text-sm font-medium">
                        Drink Prices (kr)
                      </label>

                      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4 sm:pr-4">
                          <div>
                            <span className="mb-1 block text-xs text-muted-foreground">
                              Beer
                            </span>
                            <Input
                              type="number"
                              value={beerPrice}
                              onChange={(e) =>
                                setBeerPrice(
                                  e.target.value === ""
                                    ? ""
                                    : Number.parseInt(e.target.value),
                                )
                              }
                              placeholder="kr"
                              min={0}
                              className="w-full sm:w-28"
                              aria-label="Beer Price"
                              inputMode="numeric"
                            />
                          </div>
                          <div>
                            <span className="mb-1 block text-xs text-muted-foreground">
                              Cider
                            </span>
                            <Input
                              type="number"
                              value={ciderPrice}
                              onChange={(e) =>
                                setCiderPrice(
                                  e.target.value === ""
                                    ? ""
                                    : Number.parseInt(e.target.value),
                                )
                              }
                              placeholder="kr"
                              min={0}
                              className="w-full sm:w-28"
                              aria-label="Cider Price"
                              inputMode="numeric"
                            />
                          </div>
                          <div>
                            <span className="mb-1 block text-xs text-muted-foreground">
                              Drink
                            </span>
                            <Input
                              type="number"
                              value={drinkPrice}
                              onChange={(e) =>
                                setDrinkPrice(
                                  e.target.value === ""
                                    ? ""
                                    : Number.parseInt(e.target.value),
                                )
                              }
                              placeholder="kr"
                              min={0}
                              className="w-full sm:w-28"
                              aria-label="Drink Price"
                              inputMode="numeric"
                            />
                          </div>
                        </div>

                        <Button
                          onClick={handleSavePrices}
                          disabled={saving}
                          className="w-full sm:ml-auto sm:w-auto"
                        >
                          {saving ? "Saving..." : "Update"}
                        </Button>
                      </div>
                    </div>

                    <Separator />

                    <p className="text-sm text-muted-foreground">
                      Please contact{" "}
                      <a
                        href="mailto:info@pubquery.se"
                        className="text-blue-600 underline underline-offset-2"
                      >
                        info@pubquery.se
                      </a>{" "}
                      if any info is incorrect.
                    </p>
                  </div>
                ) : (
                  <p className="text-red-500">Failed to load profile info.</p>
                ))}
              </CardContent>
            </Card>

            {error && <p className="mt-4 text-sm text-red-500">{error}</p>}
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
