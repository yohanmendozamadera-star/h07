import Link from "next/link";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ExportButton({ href, label = "Exportar a Excel" }: { href: string; label?: string }) {
  return (
    <Link href={href}>
      <Button type="button" variant="outline" size="sm" className="gap-1.5">
        <Download className="size-4" />
        {label}
      </Button>
    </Link>
  );
}
