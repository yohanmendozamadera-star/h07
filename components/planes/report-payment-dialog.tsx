"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { reportPaymentSchema, type ReportPaymentValues } from "@/lib/validations/planes";
import { reportPayment } from "@/app/(app)/planes/actions";
import type { InvoiceRow } from "@/lib/planes/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function ReportPaymentDialog({ invoice }: { invoice: InvoiceRow }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ReportPaymentValues>({
    resolver: zodResolver(reportPaymentSchema),
    defaultValues: { invoiceId: invoice.id, amount: invoice.total_amount },
  });

  const onOpenChange = (value: boolean) => {
    setOpen(value);
    if (value) reset({ invoiceId: invoice.id, amount: invoice.total_amount });
  };

  const onSubmit = async (values: ReportPaymentValues) => {
    setSubmitting(true);
    const result = await reportPayment(values);
    setSubmitting(false);

    if (!result.success) {
      toast.error("No se pudo reportar el pago", { description: result.message });
      return;
    }

    toast.success("Pago reportado. Un administrador lo revisará.");
    setOpen(false);
    router.refresh();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger render={<Button size="sm" />}>Reportar pago</DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Reportar pago</DialogTitle>
          <DialogDescription>Un administrador de plataforma revisará y aprobará el pago.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <input type="hidden" {...register("invoiceId")} />
          <div className="space-y-1.5">
            <Label htmlFor="amount">Monto pagado *</Label>
            <Input id="amount" type="number" min="0" step="0.01" {...register("amount")} />
            {errors.amount && <p className="text-sm text-destructive">{errors.amount.message}</p>}
          </div>

          <DialogFooter>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="size-4 animate-spin" />}
              Enviar reporte
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
