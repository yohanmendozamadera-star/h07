import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Existe como Route Handler (no como llamada directa dentro de un Server
// Component) porque solo un Route Handler puede escribir cookies de verdad.
// Si (app)/layout.tsx llamara signOut() él mismo, la cookie de sesión nunca
// se borraría (los Server Components no pueden mutar cookies) y quedaría un
// loop infinito de redirección entre /login y /dashboard con una sesión
// inválida (perfil borrado pero JWT aún vigente).
export async function GET(request: Request) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL("/login", request.url));
}
