import { actualizarSesion } from "@/lib/supabase/middleware";

/** Refresca la sesión de Supabase en cada request para que no expire entre páginas. */
export async function middleware(peticion) {
  return actualizarSesion(peticion);
}

export const config = {
  matcher: [
    // Todo excepto archivos estáticos e imágenes.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
