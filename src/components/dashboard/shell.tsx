"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { authClient } from "@/lib/auth-client";
import type { User } from "@/lib/auth";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  LayoutDashboardIcon,
  ClockIcon,
  BarChart3Icon,
  UsersIcon,
  FolderIcon,
  SettingsIcon,
  ZapIcon,
  LogOutIcon,
  UserIcon,
  ChevronsUpDownIcon,
  BellIcon,
  BuildingIcon,
  CalendarDaysIcon,
  BrainCircuitIcon,
  CalendarOffIcon,
  BanknoteIcon,
  LaptopIcon,
  UserCheckIcon,
} from "lucide-react";
import { NavBreadcrumbs } from "@/components/shared/nav-breadcrumbs";
import { NotificationBell } from "@/components/shared/notification-bell";

const NAV_MAIN = [
  {
    label: "Overview",
    href: "/dashboard",
    icon: LayoutDashboardIcon,
    exact: true,
  },
  {
    label: "Employees",
    href: "/dashboard/employees",
    icon: UsersIcon,
  },
  {
    label: "Timesheets",
    href: "/dashboard/timesheets",
    icon: CalendarDaysIcon,
  },
  {
    label: "Time Tracker",
    href: "/dashboard/tracker",
    icon: ClockIcon,
  },
  {
    label: "Projects",
    href: "/dashboard/projects",
    icon: FolderIcon,
  },
  {
    label: "Skills",
    href: "/dashboard/skills",
    icon: BrainCircuitIcon,
  },
  {
    label: "Leave",
    href: "/dashboard/leave",
    icon: CalendarOffIcon,
  },
  {
    label: "Reimbursements",
    href: "/dashboard/reimbursements",
    icon: BanknoteIcon,
  },
  {
    label: "Assets",
    href: "/dashboard/assets",
    icon: LaptopIcon,
  },
  {
    label: "Onboarding",
    href: "/dashboard/onboarding",
    icon: UserCheckIcon,
  },
  {
    label: "Reports",
    href: "/dashboard/reports",
    icon: BarChart3Icon,
  },
];

const NAV_SECONDARY = [
  {
    label: "Organisation",
    href: "/dashboard/settings/organisation",
    icon: BuildingIcon,
  },
  {
    label: "Settings",
    href: "/dashboard/settings",
    icon: SettingsIcon,
  },
];

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

interface DashboardShellProps {
  children: React.ReactNode;
  user: User;
  org?: { id: string; name: string; logo: string | null; slug: string } | null;
}

export function DashboardShell({ children, user, org }: DashboardShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [signingOut, setSigningOut] = React.useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await authClient.signOut();
      router.push("/");
      router.refresh();
    } catch {
      toast.error("Failed to sign out. Please try again.");
      setSigningOut(false);
    }
  }

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  }

  return (
    <SidebarProvider defaultOpen>
      <Sidebar collapsible="icon" variant="sidebar">
        {/* Sidebar header — logo */}
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                size="lg"
                render={<Link href="/dashboard" />}
                className="gap-3"
              >                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <ZapIcon className="size-4" />
                </div>
                <div className="flex flex-col leading-none">
                  <span className="font-semibold text-sm">{org?.name ?? "SHYFT"}</span>
                  <span className="text-xs text-muted-foreground truncate">
                    {org ? "Workspace" : "Work tracked."}
                  </span>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        <SidebarContent>
          {/* Main nav */}
          <SidebarGroup>
            <SidebarGroupLabel>Workspace</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {NAV_MAIN.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      render={<Link href={item.href} />}
                      isActive={isActive(item.href, item.exact)}
                      tooltip={item.label}
                    >
                      <item.icon />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* Secondary nav */}
          <SidebarGroup className="mt-auto">
            <SidebarGroupContent>
              <SidebarMenu>
                {NAV_SECONDARY.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      render={<Link href={item.href} />}
                      isActive={isActive(item.href)}
                      tooltip={item.label}
                    >
                      <item.icon />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        {/* Sidebar footer — user menu */}
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger render={
                  <SidebarMenuButton
                    size="lg"
                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                  >
                    <Avatar size="sm">
                      <AvatarImage src={user.image ?? undefined} alt={user.name} />
                      <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col leading-none min-w-0">
                      <span className="font-medium text-sm truncate">{user.name}</span>
                      <span className="text-sm text-muted-foreground truncate">
                        {user.email}
                      </span>
                    </div>
                    <ChevronsUpDownIcon className="ml-auto size-4 shrink-0" />
                  </SidebarMenuButton>
                } />
                <DropdownMenuContent
                  side="top"
                  align="start"
                  className="w-56"
                  sideOffset={4}
                >
                  <DropdownMenuGroup>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-medium text-sm">{user.name}</span>
                        <span className="text-sm text-muted-foreground truncate">
                          {user.email}
                        </span>
                      </div>
                    </DropdownMenuLabel>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push("/dashboard/settings")}>
                    <UserIcon className="size-4" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push("/dashboard/settings")}>
                    <SettingsIcon className="size-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={handleSignOut}
                    disabled={signingOut}
                    className="text-destructive focus:text-destructive"
                  >
                    <LogOutIcon className="size-4" />
                    {signingOut ? "Signing out…" : "Sign out"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>

        <SidebarRail />
      </Sidebar>

      {/* Main content area */}
      <SidebarInset>
        <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center gap-4 border-b border-border/60 bg-background/80 backdrop-blur-sm px-4">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="h-4" />
            <NavBreadcrumbs />
          </div>
          <div className="flex-1" />

          {/* Header actions */}
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <NotificationBell />
          </div>
        </header>

        {/* Page content */}
        <div className="flex flex-1 flex-col gap-6 p-6">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
