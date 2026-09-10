import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Refresca la sesión de Supabase en cada request y la propaga en las cookies
 * de la respuesta. Debe ejecutarse desde src/middleware.ts.
 */
export async function actualizarSesion(peticion: NextRequest) {
  let respuesta = NextResponse.next({ request: peticion });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return peticion.cookies.getAll();
        },
        setAll(cookiesParaGuardar) {
          for (const { name, value } of cookiesParaGuardar) {
            peticion.cookies.set(name, value);
          }
          respuesta = NextResponse.next({ request: peticion });
          for (const { name, value, options } of cookiesParaGuardar) {
            respuesta.cookies.set(name, value, options);
          }
        },
      },
    }
  );

  // Importante: dispara la renovación del token si hace falta.
  await supabase.auth.getUser();

  return respuesta;
}
