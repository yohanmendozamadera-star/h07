"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Menu, PanelLeftClose, PanelLeftOpen, LogOut, Loader2, ShieldCheck, Sun, Moon } from "lucide-react";
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

// Detecta si ya estamos en el cliente tras la hidratación, sin el
// anti-patrón de "useEffect + setState" (el snapshot del servidor es
// siempre false; el del cliente, siempre true — React re-renderiza solo
// al notar que difieren, sin necesidad de un efecto).
function useHasMounted() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  // Evita el parpadeo/discrepancia de hidratación: el tema resuelto solo se
  // conoce en el cliente, tras el montaje (next-themes lo agrega vía script).
  const mounted = useHasMounted();

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" disabled aria-label="Cambiar tema">
        <Sun className="size-5" />
      </Button>
    );
  }

  const isDark = resolvedTheme === "dark";
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
    >
      {isDark ? <Sun className="size-5" /> : <Moon className="size-5" />}
    </Button>
  );
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
        <ThemeToggle />

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
