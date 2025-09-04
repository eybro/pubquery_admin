"use client";

import { usePathname } from "next/navigation";
import { ChevronRight, type LucideIcon } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import clsx from "clsx";
import * as React from "react";

function NewBadge({ children = "New" }: { children?: React.ReactNode }) {
  return (
    <span
      className="ml-2 inline-flex items-center rounded-full bg-blue-600 px-1.5 py-0.5 text-xs font-medium text-white dark:bg-blue-500"
    >
      {children}
    </span>
  )
}


type NavSubItem = {
  title: string;
  url: string;
  badge?: React.ReactNode | string;
};

type NavItem = {
  title: string;
  url: string;
  icon: LucideIcon;
  isActive?: boolean;
  badge?: React.ReactNode | string;
  items?: NavSubItem[];
};

export function NavMain({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Menu</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          const isAnySubActive = item.items?.some((s) => pathname === s.url);
          return (
            <Collapsible key={item.title} asChild defaultOpen={isAnySubActive}>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip={item.title}>
                  <a
                    href={item.url}
                    className="flex items-center space-x-2 px-3 py-2 transition-colors"
                  >
                    <item.icon />
                    <span className="flex items-center">
                      <span>{item.title}</span>
                      {item.badge ? <NewBadge>{item.badge}</NewBadge> : undefined}
                    </span>
                  </a>
                </SidebarMenuButton>

                {item.items?.length ? (
                  <>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuAction className="data-[state=open]:rotate-90">
                        <ChevronRight />
                        <span className="sr-only">Toggle</span>
                      </SidebarMenuAction>
                    </CollapsibleTrigger>

                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {item.items.map((subItem) => {
                          const isSubActive = pathname === subItem.url;
                          return (
                            <SidebarMenuSubItem key={subItem.title}>
                              <SidebarMenuSubButton asChild>
                                <a
                                  href={subItem.url}
                                  className={clsx(
                                    "flex items-center justify-between rounded-md px-3 py-2 transition-colors",
                                    isSubActive &&
                                      "bg-gray-200 dark:bg-gray-700",
                                  )}
                                >
                                  <span className="flex items-center">
                                    <span>{subItem.title}</span>
                                    {subItem.badge ? (
                                      <NewBadge>{subItem.badge}</NewBadge>
                                    ) : undefined}
                                  </span>
                                </a>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          );
                        })}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </>
                ) : undefined}
              </SidebarMenuItem>
            </Collapsible>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
