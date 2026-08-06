"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Filtro desde/hasta basado en la URL (?from=&to=) — así el mismo rango se
// puede reusar directo en el link de exportar a Excel, sin duplicar estado.
export function DateRangeFilter({ defaultFrom, defaultTo }: { defaultFrom: string; defaultTo: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const from = searchParams.get("from") ?? defaultFrom;
  const to = searchParams.get("to") ?? defaultTo;

  const update = (key: "from" | "to", value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set(key, value);
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex flex-wrap items-end gap-2">
      <div className="space-y-1.5">
        <Label htmlFor="date-from">Desde</Label>
        <Input id="date-from" type="date" value={from} onChange={(e) => update("from", e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="date-to">Hasta</Label>
        <Input id="date-to" type="date" value={to} onChange={(e) => update("to", e.target.value)} />
      </div>
    </div>
  );
}
