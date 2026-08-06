import {
  LayoutDashboard,
  ClipboardList,
  History,
  ScrollText,
  Boxes,
  Wallet,
  Users,
  Settings,
  CreditCard,
  type LucideIcon,
} from "lucide-react";

export type NavChild = {
  href: string;
  label: string;
};

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  permission: string;
  // Solo empresas con un plan pago activo (no Free) ven este enlace — hoy
  // únicamente Pedidos Históricos, cuyo historial completo es beneficio de
  // los planes pagos.
  requiresActivePlan?: boolean;
  // Sub-enlaces que se muestran anidados/expandibles bajo este ítem (mismo
  // patrón que "Operación" bajo "Dashboard" en el proyecto Quick).
  children?: NavChild[];
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, permission: "reportes.view" },
  { href: "/toma-pedidos", label: "Toma Pedidos", icon: ClipboardList, permission: "pedidos.view" },
  {
    href: "/pedidos-historicos",
    label: "Pedidos Históricos",
    icon: History,
    permission: "pedidos.view",
    requiresActivePlan: true,
  },
  { href: "/servicios", label: "Servicios", icon: Boxes, permission: "servicios.view" },
  { href: "/clientes", label: "Clientes", icon: Users, permission: "clientes.view" },
  { href: "/inventario", label: "Inventario", icon: Boxes, permission: "inventario.view" },
  { href: "/gastos", label: "Gastos", icon: Wallet, permission: "gastos.view" },
  {
    href: "/usuarios",
    label: "Usuarios",
    icon: Users,
    permission: "usuarios.manage",
    children: [{ href: "/roles", label: "Roles y Permisos" }],
  },
  { href: "/configuraciones", label: "Configuraciones", icon: Settings, permission: "configuraciones.manage" },
  { href: "/planes", label: "Planes", icon: CreditCard, permission: "planes.view" },
  { href: "/auditoria", label: "Auditoría", icon: ScrollText, permission: "auditoria.view" },
];
