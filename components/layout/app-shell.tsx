"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Header } from "@/components/layout/header";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

export function AppShell({
  fullName,
  roleName,
  permissions,
  isPlatformAdmin,
  hasActivePlan,
  children,
}: {
  fullName: string;
  roleName: string;
  permissions: string[];
  isPlatformAdmin: boolean;
  hasActivePlan: boolean;
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-muted/30">
      <aside
        className={cn(
          "hidden shrink-0 border-r bg-background transition-[width] duration-200 md:flex md:flex-col",
          collapsed ? "w-16" : "w-64",
        )}
      >
        <div className="flex h-14 items-center justify-center border-b px-3 font-semibold tracking-tight">
          {collapsed ? "H7" : "H07"}
        </div>
        <SidebarNav permissions={permissions} hasActivePlan={hasActivePlan} collapsed={collapsed} />
      </aside>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <SheetHeader className="border-b">
            <SheetTitle>H07</SheetTitle>
          </SheetHeader>
          <SidebarNav
            permissions={permissions}
            hasActivePlan={hasActivePlan}
            onNavigate={() => setMobileOpen(false)}
          />
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Header
          fullName={fullName}
          roleName={roleName}
          isPlatformAdmin={isPlatformAdmin}
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed((value) => !value)}
          onOpenMobileMenu={() => setMobileOpen(true)}
        />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
