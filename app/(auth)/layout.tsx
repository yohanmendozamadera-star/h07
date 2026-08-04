import { createClient } from "@/lib/supabase/server";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: banner } = await supabase
    .from("platform_banner")
    .select("message")
    .eq("is_active", true)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-muted/40 p-4">
      {banner?.message && (
        <div className="w-full max-w-sm rounded-md border bg-primary/10 px-4 py-2 text-center text-sm text-primary">
          {banner.message}
        </div>
      )}
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
