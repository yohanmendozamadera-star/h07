"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_ITEMS } from "@/lib/nav-items";

export function SidebarNav({
  permissions,
  hasActivePlan,
  collapsed = false,
  onNavigate,
}: {
  permissions: string[];
  hasActivePlan: boolean;
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const items = NAV_ITEMS.filter(
    (item) => permissions.includes(item.permission) && (!item.requiresActivePlan || hasActivePlan),
  );

  const [expanded, setExpanded] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    for (const item of items) {
      if (item.children?.some((child) => pathname.startsWith(child.href))) {
        initial.add(item.href);
      }
    }
    return initial;
  });

  const toggle = (href: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(href)) next.delete(href);
      else next.add(href);
      return next;
    });
  };

  const activeClass = "bg-blue-100 text-blue-900 dark:bg-blue-900/40 dark:text-blue-100";
  const inactiveClass = "text-muted-foreground hover:bg-muted hover:text-foreground";

  return (
    <nav className="flex flex-col gap-1 p-2">
      {items.map((item) => {
        const Icon = item.icon;
        const ownActive = pathname.startsWith(item.href);

        if (item.children && item.children.length > 0) {
          const hasActiveChild = item.children.some((child) => pathname.startsWith(child.href));
          const isExpanded = expanded.has(item.href);

          return (
            <div key={item.href}>
              <div className={cn("flex items-center gap-1 rounded-md text-sm font-medium transition-colors", ownActive && activeClass, !ownActive && (hasActiveChild ? "text-foreground" : inactiveClass))}>
                <Link
                  href={item.href}
                  onClick={onNavigate}
                  title={collapsed ? item.label : undefined}
                  className={cn("flex flex-1 items-center gap-3 px-3 py-2", collapsed && "justify-center px-2")}
                >
                  <Icon className="size-4 shrink-0" />
                  {!collapsed && <span>{item.label}</span>}
                </Link>
                {!collapsed && (
                  <button
                    type="button"
                    onClick={() => toggle(item.href)}
                    aria-label={isExpanded ? "Contraer" : "Expandir"}
                    className={cn("rounded-md p-2", !ownActive && "hover:bg-muted hover:text-foreground")}
                  >
                    {isExpanded ? <ChevronDown className="size-4 shrink-0" /> : <ChevronRight className="size-4 shrink-0" />}
                  </button>
                )}
              </div>
              {!collapsed && isExpanded && (
                <div className="ml-4 flex flex-col gap-1 border-l pl-3">
                  {item.children.map((child) => {
                    const childActive = pathname.startsWith(child.href);
                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        onClick={onNavigate}
                        className={cn(
                          "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                          childActive ? activeClass : inactiveClass,
                        )}
                      >
                        {child.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            title={collapsed ? item.label : undefined}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              ownActive ? activeClass : inactiveClass,
              collapsed && "justify-center px-2",
            )}
          >
            <Icon className="size-4 shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </Link>
        );
      })}
    </nav>
  );
}
