import { getCurrentUser, can } from "@/lib/permissions";
import { getCurrentSubscription, getInvoices, getPlans, getPlanAddons } from "@/lib/planes/queries";
import { getCompanyName, getCompanyOwnerEmail } from "@/lib/companies/queries";
import { ModulePlaceholder } from "@/components/layout/module-placeholder";
import { PlanCard } from "@/components/planes/plan-card";
import { InvoicesTable } from "@/components/planes/invoices-table";

export default async function PlanesPage() {
  const user = await getCurrentUser();
  const permissions = user?.permissions ?? [];

  if (!can(permissions, "planes.view")) {
    return <ModulePlaceholder title="Planes" description="No tienes permiso para ver este módulo." denied />;
  }

  const [subscription, invoices, plans, addons, companyName, ownerEmail] = await Promise.all([
    getCurrentSubscription(),
    getInvoices(),
    getPlans(),
    getPlanAddons(),
    getCompanyName(user!.empresaId),
    getCompanyOwnerEmail(user!.empresaId),
  ]);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold tracking-tight">Planes</h1>
      <PlanCard subscription={subscription} plans={plans} addons={addons} />
      <InvoicesTable
        invoices={invoices}
        canPay={can(permissions, "pagos.create")}
        companyName={companyName}
        ownerEmail={ownerEmail}
      />
    </div>
  );
}
