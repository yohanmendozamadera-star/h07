"use client";

import { useState } from "react";
import Image from "next/image";
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
    <div className="flex h-screen overflow-hidden bg-transparent">
      <aside
        className={cn(
          "hidden shrink-0 bg-sidebar text-sidebar-foreground shadow-[12px_0_40px_rgba(4,31,78,0.12)] transition-[width] duration-200 md:flex md:flex-col",
          collapsed ? "w-20" : "w-64",
        )}
      >
        <div className="flex h-20 items-center border-b border-sidebar-border px-4">
          <div className={cn("flex items-center gap-3", collapsed && "mx-auto")}>
            <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-white shadow-sm">
              <Image src="/h07-logo.png" alt="Logo H07" width={34} height={34} priority />
            </div>
            {!collapsed && <div><div className="text-xl font-bold tracking-[0.08em] text-white">H07</div><div className="text-[10px] uppercase tracking-[0.18em] text-cyan-300">Gestión inteligente</div></div>}
          </div>
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
          <div className="absolute inset-y-0 left-0 flex w-72 flex-col bg-sidebar shadow-2xl">
            <div className="flex h-20 items-center gap-3 border-b border-sidebar-border px-4 text-white">
              <div className="grid size-11 place-items-center rounded-2xl bg-white"><Image src="/h07-logo.png" alt="Logo H07" width={34} height={34} priority /></div>
              <div><div className="text-xl font-bold tracking-[0.08em]">H07</div><div className="text-[10px] uppercase tracking-[0.18em] text-cyan-300">Gestión inteligente</div></div>
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
        <main className="flex-1 overflow-y-auto p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
