"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { Loader2, Upload, Download } from "lucide-react";
import { importCatalogItemsAction } from "@/app/(app)/servicios/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function ImportServicesDialog() {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ imported: number; skipped: string[] } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onOpenChange = (value: boolean) => {
    setOpen(value);
    if (value) setResult(null);
  };

  const handleImport = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      toast.error("Selecciona un archivo Excel primero");
      return;
    }

    setSubmitting(true);
    const formData = new FormData();
    formData.set("file", file);
    const res = await importCatalogItemsAction(formData);
    setSubmitting(false);

    if (!res.success) {
      toast.error("No se pudo importar", { description: res.message });
      return;
    }

    setResult({ imported: res.imported, skipped: res.skipped });
    toast.success(`Se importaron ${res.imported} servicio(s)`);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger render={<Button type="button" variant="outline" className="gap-1.5" />}>
        <Upload className="size-4" />
        Importar servicios
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Importar servicios desde Excel</DialogTitle>
          <DialogDescription className="space-y-2">
            <span className="block">
              Sube un archivo .xlsx con una fila por servicio. Necesitas estas columnas, en este orden:
            </span>
            <span className="block rounded-md bg-muted p-2 font-mono text-xs">
              Canal | Nombre | Precio | Tipo de precio | Unidad
            </span>
            <span className="block">
              <strong>Canal</strong>: lavanderia, productos o taller. <strong>Precio</strong>: solo números.{" "}
              <strong>Tipo de precio</strong>: fijo o variable (solo aplica en Taller). <strong>Unidad</strong>:
              opcional.
            </span>
            <a
              href="/servicios/import/template"
              className="inline-flex items-center gap-1.5 text-sm text-primary underline underline-offset-2"
            >
              <Download className="size-3.5" />
              Descargar plantilla de ejemplo
            </a>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx"
            className="block w-full text-sm file:mr-3 file:rounded-md file:border file:bg-background file:px-3 file:py-1.5 file:text-sm"
          />

          {result && (
            <div className="space-y-1 rounded-md border p-3 text-sm">
              <p className="font-medium text-green-700 dark:text-green-400">
                {result.imported} servicio(s) importado(s) correctamente.
              </p>
              {result.skipped.length > 0 && (
                <div className="space-y-1">
                  <p className="text-muted-foreground">Filas que no se pudieron importar:</p>
                  <ul className="list-disc space-y-0.5 pl-4 text-xs text-muted-foreground">
                    {result.skipped.map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button type="button" onClick={handleImport} disabled={submitting}>
            {submitting && <Loader2 className="size-4 animate-spin" />}
            Importar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
