export type ExpenseRow = {
  id: string;
  type: "fijo" | "variable";
  amount: number;
  expense_date: string;
  description: string | null;
  category_id: string | null;
  supplier_id: string | null;
  category: { name: string } | null;
  supplier: { name: string } | null;
};
