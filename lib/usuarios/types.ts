export type UsuarioRow = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  is_active: boolean;
  role: { code: string; name: string } | null;
};
