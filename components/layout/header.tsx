"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Menu, PanelLeftClose, PanelLeftOpen, LogOut, Loader2, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function Header({
  fullName,
  roleName,
  isPlatformAdmin,
  collapsed,
  onToggleCollapse,
  onOpenMobileMenu,
}: {
  fullName: string;
  roleName: string;
  isPlatformAdmin: boolean;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onOpenMobileMenu: () => void;
}) {
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  };

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b bg-background px-3 md:px-4">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={onOpenMobileMenu}
          aria-label="Abrir menú"
        >
          <Menu className="size-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="hidden md:inline-flex"
          onClick={onToggleCollapse}
          aria-label="Contraer u expandir menú"
        >
          {collapsed ? <PanelLeftOpen className="size-5" /> : <PanelLeftClose className="size-5" />}
        </Button>
        <span className="font-semibold tracking-tight">H07</span>
      </div>

      <div className="flex items-center gap-3">
        {isPlatformAdmin && (
          <Link href="/panel-plataforma">
            <Button variant="outline" size="sm" className="gap-1.5">
              <ShieldCheck className="size-4" />
              <span className="hidden sm:inline">Panel de plataforma</span>
            </Button>
          </Link>
        )}

        <Link href="/mi-perfil" className="flex items-center gap-2 rounded-md px-1.5 py-1 hover:bg-muted" title="Mi perfil">
          <Avatar className="size-7">
            <AvatarFallback className="text-xs">{initials(fullName) || "U"}</AvatarFallback>
          </Avatar>
          <span className="hidden text-sm font-medium sm:inline">{fullName}</span>
          <Badge variant="secondary" className="hidden sm:inline-flex">
            {roleName}
          </Badge>
        </Link>

        <Button variant="outline" size="sm" onClick={handleSignOut} disabled={signingOut}>
          {signingOut ? <Loader2 className="size-4 animate-spin" /> : <LogOut className="size-4" />}
          <span className="hidden sm:inline">Cerrar sesión</span>
        </Button>
      </div>
    </header>
  );
}
