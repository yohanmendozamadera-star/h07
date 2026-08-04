"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChangePlanDialog } from "@/components/panel-plataforma/change-plan-dialog";
import { toggleCompanyStatus } from "@/app/(platform)/panel-plataforma/actions";
import type { CompanyRow } from "@/lib/panel-plataforma/types";

export function CompaniesTable({ companies }: { companies: CompanyRow[] }) {
  const [pendingId, setPendingId] = useState<string | null>(null);

  const handleToggleStatus = async (company: CompanyRow) => {
    const nextStatus = company.status === "active" ? "suspended" : "active";
    setPendingId(company.id);
    const result = await toggleCompanyStatus(company.id, nextStatus);
    setPendingId(null);
    if (!result.success) {
      toast.error("No se pudo actualizar", { description: result.message });
      return;
    }
    toast.success(nextStatus === "active" ? "Empresa activada" : "Empresa suspendida");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Empresas</CardTitle>
        <CardDescription>Todas las empresas registradas en la plataforma</CardDescription>
      </CardHeader>
      <CardContent>
        {companies.length === 0 ? (
          <p className="text-sm text-muted-foreground">Todavía no hay empresas registradas.</p>
        ) : (
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
                <tr>
                  <th className="p-2 font-medium">Empresa</th>
                  <th className="p-2 font-medium">Propietario</th>
                  <th className="p-2 font-medium">Plan</th>
                  <th className="p-2 font-medium">Estado</th>
                  <th className="p-2 font-medium" />
                </tr>
              </thead>
              <tbody>
                {companies.map((company) => (
                  <tr key={company.id} className="border-t">
                    <td className="p-2">{company.name}</td>
                    <td className="p-2">
                      {company.owner?.full_name ?? "—"}
                      <div className="text-xs text-muted-foreground">{company.owner?.email}</div>
                    </td>
                    <td className="p-2">{company.subscription?.plan?.name ?? "Free"}</td>
                    <td className="p-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={pendingId === company.id}
                        onClick={() => handleToggleStatus(company)}
                      >
                        <Badge variant={company.status === "active" ? "secondary" : "outline"}>
                          {company.status === "active" ? "Activa" : "Suspendida"}
                        </Badge>
                      </Button>
                    </td>
                    <td className="p-2 text-right">
                      <ChangePlanDialog empresaId={company.id} companyName={company.name} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
