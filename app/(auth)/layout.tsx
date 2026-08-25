import { createClient } from "@/lib/supabase/server";
import Image from "next/image";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: banner } = await supabase
    .from("platform_banner")
    .select("message, image_url")
    .eq("is_active", true)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (
    <div className="relative flex flex-1 items-center justify-center overflow-hidden bg-gradient-to-br from-blue-950 via-blue-900 to-cyan-700 p-4 md:p-8">
      <div className="absolute -left-24 -top-24 size-80 rounded-full bg-cyan-400/20 blur-3xl" />
      <div className="absolute -bottom-28 -right-20 size-96 rounded-full bg-blue-400/20 blur-3xl" />
      <div className="relative grid w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-white/30 md:grid-cols-[1.05fr_.95fr] dark:bg-card">
        <section className="hidden min-h-[620px] flex-col justify-between bg-blue-950 p-10 text-white md:flex">
          <div className="flex items-center gap-4"><div className="grid size-16 place-items-center rounded-2xl bg-white"><Image src="/h07-logo.png" alt="Logo H07" width={50} height={50} priority /></div><div><div className="text-3xl font-bold tracking-[0.08em]">H07</div><div className="text-sm uppercase tracking-[0.22em] text-cyan-300">App</div></div></div>
          <div><p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-300">Más control. Más organización.</p><h1 className="mt-4 max-w-md text-4xl font-bold leading-tight">Tu lavadero organizado desde cualquier lugar.</h1><p className="mt-5 max-w-md text-blue-100/75">Ventas, servicios, clientes e inventario en una sola plataforma.</p></div>
          <p className="text-xs text-blue-200/60">Simple · rápido · eficiente</p>
        </section>
        <section className="flex min-h-[620px] flex-col items-center justify-center p-6 md:p-10">
          <div className="mb-7 flex items-center gap-3 md:hidden"><Image src="/h07-logo.png" alt="Logo H07" width={48} height={48} priority /><div><div className="text-2xl font-bold tracking-[0.08em] text-primary">H07</div><div className="text-xs uppercase tracking-[0.18em] text-cyan-600">App</div></div></div>
      {banner?.message && (
        <div className="w-full max-w-sm space-y-2 rounded-md border bg-primary/10 px-4 py-2 text-center text-sm text-primary">
          {banner.image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={banner.image_url} alt="" className="mx-auto max-h-32 w-auto rounded" />
          )}
          {banner.message}
        </div>
      )}
          <div className="w-full max-w-sm">{children}</div>
        </section>
      </div>
    </div>
  );
}
