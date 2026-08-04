export type PurchaseRow = {
  id: string;
  catalog_item_id: string;
  quantity: number;
  unit_cost: number;
  total_cost: number;
  purchase_date: string;
  catalog_item: { name: string } | null;
  supplier: { name: string } | null;
};

export type ShrinkageRow = {
  id: string;
  catalog_item_id: string;
  quantity: number;
  reason: string | null;
  shrinkage_date: string;
  catalog_item: { name: string } | null;
};

export type StockRow = {
  catalog_item_id: string;
  name: string;
  purchased_qty: number;
  sold_qty: number;
  shrinkage_qty: number;
  available_qty: number;
};
