"use client";

import * as React from "react";
import {
  Home,
  MessageSquare,
  Video,
  FileText,
  BarChart3,
  Settings,
  Users,
  GraduationCap,
  Stethoscope,
  User,
  LogOut,
  Radio,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";

const menuItems = {
  rep: [
    {
      title: "Dashboard",
      icon: Home,
      href: "/dashboard/rep",
    },
    {
      title: "Evaluations",
      icon: GraduationCap,
      href: "/dashboard/rep/evaluations",
    },
  ],
  trainer: [
    {
      title: "Dashboard",
      icon: Home,
      href: "/dashboard/trainer",
    },
    {
      title: "Agents",
      icon: Radio,
      href: "/dashboard/trainer/agents",
    },
  ],
  manager: [
    {
      title: "Dashboard",
      icon: Home,
      href: "/dashboard/manager",
    },
  ],
  admin: [
    {
      title: "Dashboard",
      icon: Home,
      href: "/dashboard/admin",
    },
  ],
};

export function AppSidebar() {
  const pathname = usePathname();
  const { user, signout } = useAuth();

  const items = user ? menuItems[user.role as keyof typeof menuItems] || menuItems.rep : [];

  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader className="border-b border-white/10">
        <div className="flex items-center gap-2 px-4 py-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
            <Stethoscope className="h-5 w-5 text-white" />
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-semibold text-white">Shadow MedTech</span>
            <span className="text-xs text-white/60">AI Training</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-white/70">Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href || pathname.startsWith(item.href + "/")}
                    tooltip={item.title}
                  >
                    <Link href={item.href}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-white/10">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              tooltip={user?.name || "Profile"}
            >
              <Link href="/dashboard">
                <User className="h-4 w-4" />
                <span>{user?.name || "Profile"}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={signout}
              tooltip="Sign Out"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
