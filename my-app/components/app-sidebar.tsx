"use client";
import { useState } from "react";
import * as React from "react";
import { Settings2, Beer, User, PartyPopper } from "lucide-react";

import { LogOut } from "lucide-react"; // Import the LogOut icon from lucide
import { Button } from "@/components/ui/button"; // ShadCN UI Button component
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
import { useRouter } from "next/navigation"; // For redirecting after logout

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
        {
          title: "Upcoming Pubs",
          url: "/dashboard",
        },
        {
          title: "Past Pubs",
          url: "/dashboard/history",
        },
        {
          title: "Menu",
          url: "/dashboard/menu",
        },
      ],
    },
    {
      title: "Dinners",
      url: "/dinners",
      icon: PartyPopper,
      items: [
        {
          title: "Upcoming Dinners",
          url: "/dinners",
        },
      ],
    },
    {
      title: "Settings",
      url: "/settings/reset-password",
      icon: Settings2,
      items: [
        {
          title: "Reset Password",
          url: "/settings/reset-password",
        },
      ],
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [user, setUser] = React.useState<
    | {
        organizationName: string;
        id: number;
        username: string;
      }
    | undefined
  >();
  const router = useRouter();
  const [error, setError] = useState<string | undefined>();

  // Fetch user profile on mount
  React.useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/profile`, { credentials: "include" }) // Include credentials if using httpOnly cookies
      .then((res) => res.json())
      .then((data) => setUser(data))
      .catch(() => setUser({ id: 0, username: "Guest", organizationName: "Demo" })); // Fallback if error
  }, []);

  // Handle logout
  const handleLogout = async () => {
    setError(undefined);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/logout`, {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to log out. Please try again.");
      }

      // Redirect to login page after logging out
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
              <a href="#">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <User className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="font-semibold truncate">
                    {user ? user.organizationName : ""}
                  </span>
                  <span className="truncate text-xs">{ user ? user.username: ""}</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        {error && <p style={{ color: "red" }}>{error}</p>}
        <div className="flex items-center space-x-4 p-4">
          <Button className="w-full" onClick={handleLogout}>
            <LogOut className="mr-2" />{" "}
            {/* Manually add the icon to the left of the text */}
            Sign out
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
