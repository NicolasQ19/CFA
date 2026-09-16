import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";

/**
 * Refresca la sesión de Supabase en cada request y la propaga en las cookies.
 * Se ejecuta desde src/middleware.js.
 */
export async function actualizarSesion(peticion) {
  let respuesta = NextResponse.next({ request: peticion });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
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

  await supabase.auth.getUser();

  return respuesta;
}