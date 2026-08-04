export type CatalogChannel = "lavanderia" | "productos" | "taller";

export type CatalogItem = {
  id: string;
  channel: CatalogChannel;
  name: string;
  price: number;
  price_type: "fijo" | "variable";
  tracks_inventory: boolean;
  unit: string | null;
  is_active: boolean;
};

export const CHANNEL_LABELS: Record<CatalogChannel, string> = {
  lavanderia: "Lavandería",
  productos: "Productos",
  taller: "Taller",
};
