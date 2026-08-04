import {
  getAllCompanies,
  getAllInvoices,
  getAllPayments,
  getPlatformBanner,
  getPlatformConfig,
  getPaymentLinks,
} from "@/lib/panel-plataforma/queries";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CompaniesTable } from "@/components/panel-plataforma/companies-table";
import { InvoicesTable } from "@/components/panel-plataforma/invoices-table";
import { PaymentsTable } from "@/components/panel-plataforma/payments-table";
import { BannerForm } from "@/components/panel-plataforma/banner-form";
import { WhatsappConfigForm } from "@/components/panel-plataforma/whatsapp-config-form";
import { PaymentLinksManager } from "@/components/panel-plataforma/payment-links-manager";

export default async function PanelPlataformaPage() {
  const [companies, invoices, payments, banner, config, paymentLinks] = await Promise.all([
    getAllCompanies(),
    getAllInvoices(),
    getAllPayments(),
    getPlatformBanner(),
    getPlatformConfig(),
    getPaymentLinks(),
  ]);

  return (
    <Tabs defaultValue="empresas">
      <TabsList>
        <TabsTrigger value="empresas">Empresas</TabsTrigger>
        <TabsTrigger value="cartera">Cartera</TabsTrigger>
        <TabsTrigger value="pagos">Pagos</TabsTrigger>
        <TabsTrigger value="banner">Banner</TabsTrigger>
        <TabsTrigger value="notificaciones">Notificaciones</TabsTrigger>
        <TabsTrigger value="links">Links de pago</TabsTrigger>
      </TabsList>

      <TabsContent value="empresas" className="pt-3">
        <CompaniesTable companies={companies} />
      </TabsContent>

      <TabsContent value="cartera" className="pt-3">
        <InvoicesTable invoices={invoices} />
      </TabsContent>

      <TabsContent value="pagos" className="pt-3">
        <PaymentsTable payments={payments} />
      </TabsContent>

      <TabsContent value="banner" className="pt-3">
        <BannerForm banner={banner} />
      </TabsContent>

      <TabsContent value="notificaciones" className="pt-3">
        <WhatsappConfigForm config={config} />
      </TabsContent>

      <TabsContent value="links" className="pt-3">
        <PaymentLinksManager links={paymentLinks} companies={companies} />
      </TabsContent>
    </Tabs>
  );
}
