import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

// "middleware.ts" está deprecado desde Next.js 16.0.0 y fue renombrado a
// "proxy.ts" (ver node_modules/next/dist/docs/.../file-conventions/proxy.md).
// "/api/webhooks" son endpoints llamados por servicios externos (ej. Bold) sin
// sesión de usuario — se autentican solos verificando su propia firma, no con
// la cookie de sesión, así que deben quedar fuera de este guard.
const PUBLIC_PATHS = [
  "/login",
  "/registro",
  "/recuperar-password",
  "/actualizar-password",
  "/auth/callback",
  "/api/webhooks",
];

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // getClaims() verifica el JWT localmente (llaves asimétricas) en vez de
  // llamar al servidor de Auth en cada solicitud, como sí hace getUser().
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims ?? null;

  const isPublicPath = PUBLIC_PATHS.some((path) => request.nextUrl.pathname.startsWith(path));

  if (!user && !isPublicPath) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirectTo", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  if (user && request.nextUrl.pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  // sw.js y manifest.webmanifest deben ser accesibles sin sesión (los pide el
  // navegador para ofrecer instalar la PWA, incluso antes de iniciar sesión).
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sw\\.js|manifest\\.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
