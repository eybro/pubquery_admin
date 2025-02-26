"use client";

import React, { useEffect, useState } from "react";
import {
  SidebarTrigger,
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type Profile = {
  organizationName: string;
  venue: string;
  username: string;
  fb_page: string;
  venueName: string;
};

export default function Page() {
  const [profile, setProfile] = useState<Profile>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
      } catch (error) {
        if (error instanceof Error) {
          setError(error.message);
        } else {
          setError("An unknown error occurred");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <h1 className="text-xl font-semibold">Profile info</h1>
          </div>
        </header>

        <div className="flex w-full justify-start p-6 md:p-10">
          <div className="w-full max-w-3xl">
            <Card className="rounded-2xl shadow-lg">
              <CardContent className="space-y-6 p-8">
                {loading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-6 w-1/2" />
                    <Skeleton className="h-6 w-2/3" />
                    <Skeleton className="h-6 w-1/3" />
                  </div>
                ) : profile ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <p>
                        <strong>Organization:</strong>{" "}
                        {profile.organizationName}
                      </p>
                      <p>
                        <strong>Venue:</strong> {profile.venueName}
                      </p>
                      <p>
                        <strong>Username:</strong> {profile.username}
                      </p>
                      <p>
                        <strong>Facebook page:</strong>{" "}
                        <a
                          href={
                            profile.fb_page
                              ? `https://facebook.com/${profile.fb_page}`
                              : "#"
                          }
                          className="text-blue-600 hover:underline"
                        >
                          {profile.fb_page}
                        </a>
                      </p>
                    </div>
                    <Separator />
                    <p className="text-sm text-muted-foreground">
                      Please contact{" "}
                      <a
                        href="mailto:info@pubquery.se"
                        className="text-blue-600 hover:underline"
                      >
                        info@pubquery.se
                      </a>{" "}
                      if any info is incorrect.
                    </p>
                  </div>
                ) : (
                  <p className="text-red-500">Failed to load profile info.</p>
                )}
              </CardContent>
            </Card>
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
