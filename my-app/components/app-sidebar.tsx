"use client";
import { useState } from "react";
import * as React from "react";
import {
  Settings2,
  Beer,
  User,
  PartyPopper,
  CircleUserRound,
  Activity, // ⬅️ add this
} from "lucide-react";

import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NavMain } from "@/components/nav-main";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useRouter } from "next/navigation";

const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
    organizationName: "ShadCN",
  },
  navMain: [
    {
      title: "Pubs",
      url: "/dashboard",
      icon: Beer,
      isActive: true,
      items: [
        { title: "Upcoming Pubs", url: "/dashboard" },
        { title: "Past Pubs", url: "/dashboard/history" },
      ],
    },
    {
      title: "Dinners",
      url: "/dinners",
      icon: PartyPopper,
      items: [{ title: "Upcoming Dinners", url: "/dinners" }],
    },
    {
      title: "Profile",
      url: "/profile",
      icon: CircleUserRound,
      items: [{ title: "Profile info", url: "/profile" }],
    },
    {
      title: "Settings",
      url: "/settings/reset-password",
      icon: Settings2,
      items: [{ title: "Reset Password", url: "/settings/reset-password" }],
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [user, setUser] = React.useState<
    | {
        organizationName: string;
        organization_id: number;
        id: number;
        username: string;
        role: string;
      }
    | undefined
  >();
  const router = useRouter();
  const [error, setError] = useState<string | undefined>();
  const [organizations, setOrganizations] = React.useState<
    { id: number; name: string }[]
  >([]);

  React.useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/profile`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => setUser(data))
      .catch(() =>
        setUser({
          id: 0,
          username: "Guest",
          organizationName: "Demo",
          role: "ORG_ADMIN",
          organization_id: 0,
        }),
      );
  }, []);

  React.useEffect(() => {
    if (user?.role === "SUPER_ADMIN") {
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/organizations`, {
        credentials: "include",
      })
        .then((res) => res.json())
        .then((data) => setOrganizations(data))
        .catch((error_) => setError(error_.message));
    }
  }, [user]);

  // ⬇️ Dynamic nav: append Super-Admin item only when applicable
  const navItems = React.useMemo(() => {
    if (user?.role !== "SUPER_ADMIN") return data.navMain;
    return [
      // put it on top; move below if you prefer it later in the list
      {
        title: "Admin",
        url: "/super-admin",
        icon: Activity,
        items: [{ title: "Monitoring", url: "/super-admin" }],
      },
      ...data.navMain,
    ];
  }, [user?.role]);

  const handleLogout = async () => {
    setError(undefined);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/users/logout`,
        { method: "POST", credentials: "include" },
      );
      if (!response.ok) throw new Error("Failed to log out. Please try again.");
      router.push("/login");
    } catch {
      setError("Failed to log out. Please try again.");
    }
  };

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="/profile">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <User className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">
                    {user ? user.organizationName : ""}
                  </span>
                  <span className="truncate text-xs">
                    {user ? user.username : ""}
                  </span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        {user?.role === "SUPER_ADMIN" && organizations.length > 0 && (
          <div className="px-4 py-2">
            <label className="mb-1 block text-sm font-medium text-sidebar-foreground">
              Switch Organization
            </label>
            <select
              className="w-full rounded-md border border-gray-500 bg-white p-2 text-sm text-black shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
              value={user.organization_id}
              onChange={async (e) => {
                const newOrgId = e.target.value;
                try {
                  const response = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/api/users/switch-organization`,
                    {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      credentials: "include",
                      body: JSON.stringify({ organization_id: newOrgId }),
                    },
                  );
                  if (!response.ok)
                    throw new Error("Failed to update organization");
                  setUser(
                    (prev) =>
                      prev && { ...prev, organization_id: Number(newOrgId) },
                  );
                  globalThis.location.reload();
                } catch (error) {
                  setError(
                    error instanceof Error
                      ? error.message
                      : "An unknown error occurred",
                  );
                }
              }}
            >
              {organizations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent>
        {/* ⬇️ Use the dynamic list */}
        <NavMain items={navItems} />
      </SidebarContent>

      <SidebarFooter>
        {error && <p style={{ color: "red" }}>{error}</p>}
        <div className="flex items-center space-x-4 p-4">
          <Button className="w-full" onClick={handleLogout}>
            <LogOut className="mr-2" />
            Sign out
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
