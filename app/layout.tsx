import type { Metadata } from "next";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { PwaRegister } from "@/components/pwa-register";
import "./globals.css";

export const metadata: Metadata = {
  title: "H07",
  description: "Gestión de pedidos, parqueadero, inventario y planes para negocios de lavandería y taller",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "H07",
  },
};

export const viewport = {
  themeColor: "#1d4ed8",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <TooltipProvider delay={200}>
          {children}
          <Toaster richColors position="top-right" />
        </TooltipProvider>
        <PwaRegister />
      </body>
    </html>
  );
}
