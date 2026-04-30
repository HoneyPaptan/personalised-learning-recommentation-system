"use client"

import * as React from "react"
import {
  GalleryVerticalEnd,
  LayoutDashboard,
  User,
  Play,
  Bug,
  Settings,
  LogOut,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"

const navMain = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Start Quiz",
    url: "/quiz",
    icon: Play,
  },
  {
    title: "Profile",
    url: "/profile",
    icon: User,
  },
]

export function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  return (
    <TooltipProvider>
      <SidebarProvider defaultOpen>
        <Sidebar collapsible="offcanvas" className="border-r border-sidebar-border">
          <SidebarHeader className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex aspect-square size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg">
                <GalleryVerticalEnd className="size-5" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-bold text-sidebar-foreground">
                  Math Tutor
                </span>
                <span className="truncate text-xs text-sidebar-foreground/60">
                  AI Learning Platform
                </span>
              </div>
            </div>
          </SidebarHeader>
          <SidebarSeparator className="mx-0" />
          <SidebarContent className="p-2">
            <SidebarGroup>
              <SidebarGroupLabel className="text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider px-2 mb-1">
                Main Menu
              </SidebarGroupLabel>
              <SidebarMenu className="gap-1">
                {navMain.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === item.url}
                      tooltip={item.title}
                      className="h-11 rounded-lg transition-all duration-200 hover:bg-sidebar-accent data-[active=true]:bg-primary data-[active=true]:text-primary-foreground data-[active=true]:shadow-md"
                    >
                      <Link href={item.url} className="font-medium">
                        <item.icon className="size-5" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroup>
          </SidebarContent>
          <SidebarSeparator className="mx-0" />
          <SidebarFooter className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <Avatar className="size-9 border-2 border-sidebar-border">
                <AvatarImage src="" alt="User" />
                <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                  U
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold text-sidebar-foreground">
                  Learner
                </span>
                <span className="truncate text-xs text-sidebar-foreground/60">
                  Free Plan
                </span>
              </div>
            </div>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  className="h-9 rounded-lg text-sidebar-foreground/70 hover:bg-sidebar-accent"
                >
                  <Link href="/debug">
                    <Bug className="size-4" />
                    <span className="text-sm">Debug</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset>
          <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-4 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6">
            <SidebarTrigger className="hover:bg-muted rounded-lg" />
            <Separator orientation="vertical" className="h-6" />
            <div className="flex flex-1 items-center justify-between">
              <div>
                <h1 className="text-lg font-semibold text-foreground">
                  {navMain.find((n) => n.url === pathname)?.title ?? "Math Tutor"}
                </h1>
              </div>
              <div className="flex items-center gap-3">
                <Avatar className="size-8">
                  <AvatarFallback className="text-xs bg-primary/10 text-primary">
                    U
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>
          </header>
          <main className="flex-1 overflow-auto p-6">
            {children}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  )
}