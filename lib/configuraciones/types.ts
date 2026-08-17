export type CompanySettings = {
  lavanderia_enabled: boolean;
  inventario_enabled: boolean;
  taller_enabled: boolean;
  parqueadero_enabled: boolean;
  require_technician_on_invoice: boolean;
  show_numeric_keypad: boolean;
  parking_grace_minutes: number;
  commission_enabled: boolean;
  commission_technician_percent: number | null;
  parqueadero_printer_ip: string | null;
};

export type SharedCatalogRow = {
  id: string;
  name: string;
  is_active: boolean;
};
