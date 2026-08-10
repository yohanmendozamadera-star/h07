"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Header } from "@/components/layout/header";
import { SidebarNav } from "@/components/layout/sidebar-nav";

export function AppShell({
  fullName,
  roleName,
  avatarUrl,
  permissions,
  isPlatformAdmin,
  hasActivePlan,
  children,
}: {
  fullName: string;
  roleName: string;
  avatarUrl: string | null;
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
          "hidden shrink-0 bg-blue-950 transition-[width] duration-200 md:flex md:flex-col",
          collapsed ? "w-16" : "w-64",
        )}
      >
        <div className="flex h-14 items-center justify-center border-b border-blue-900 px-3 font-semibold tracking-tight text-white">
          {collapsed ? "H7" : "H07"}
        </div>
        <SidebarNav permissions={permissions} hasActivePlan={hasActivePlan} collapsed={collapsed} />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label="Cerrar menú"
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 flex w-64 flex-col bg-blue-950 shadow-lg">
            <div className="flex h-14 items-center border-b border-blue-900 px-4 font-semibold tracking-tight text-white">
              H07
            </div>
            <SidebarNav
              permissions={permissions}
              hasActivePlan={hasActivePlan}
              onNavigate={() => setMobileOpen(false)}
            />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Header
          fullName={fullName}
          roleName={roleName}
          avatarUrl={avatarUrl}
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
