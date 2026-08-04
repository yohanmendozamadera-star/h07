"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { monthlyGoalFormSchema, type MonthlyGoalFormValues } from "@/lib/validations/monthly-goal";
import { updateMonthlyGoal } from "@/app/(app)/dashboard/actions";
import type { MonthlyGoal } from "@/lib/dashboard/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";

export function MonthlyGoalCard({ goal, salesMonth }: { goal: MonthlyGoal | null; salesMonth: number }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<MonthlyGoalFormValues>({
    resolver: zodResolver(monthlyGoalFormSchema),
    defaultValues: {
      fixedCost: goal?.fixed_cost ?? 0,
      marginPercent: goal?.margin_percent ?? 0,
      goalAmount: goal?.goal_amount ?? 0,
    },
  });
  const [progressGoal, setProgressGoal] = useState(goal?.goal_amount ?? 0);

  const onSubmit = async (values: MonthlyGoalFormValues) => {
    const result = await updateMonthlyGoal(values);
    if (!result.success) {
      toast.error("No se pudo guardar", { description: result.message });
      return;
    }
    setProgressGoal(Number(values.goalAmount));
    toast.success("Meta actualizada");
  };

  const progressPercent = progressGoal > 0 ? Math.min(100, Math.round((salesMonth / progressGoal) * 100)) : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Meta mensual</CardTitle>
        <CardDescription>
          {progressGoal > 0
            ? `${formatCurrency(salesMonth)} de ${formatCurrency(progressGoal)} (${progressPercent}%)`
            : "Define una meta de ventas para ver tu avance."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {progressGoal > 0 && (
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary" style={{ width: `${progressPercent}%` }} />
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-3 sm:grid-cols-3" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="fixedCost">Costo fijo mensual</Label>
            <Input id="fixedCost" type="number" min="0" step="0.01" {...register("fixedCost")} />
            {errors.fixedCost && <p className="text-sm text-destructive">{errors.fixedCost.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="marginPercent">Margen (%)</Label>
            <Input id="marginPercent" type="number" min="0" max="100" step="0.1" {...register("marginPercent")} />
            {errors.marginPercent && <p className="text-sm text-destructive">{errors.marginPercent.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="goalAmount">Meta de ventas ($)</Label>
            <Input id="goalAmount" type="number" min="0" step="0.01" {...register("goalAmount")} />
            {errors.goalAmount && <p className="text-sm text-destructive">{errors.goalAmount.message}</p>}
          </div>
          <div className="sm:col-span-3">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="size-4 animate-spin" />}
              Guardar meta
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
