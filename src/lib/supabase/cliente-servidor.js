import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Cliente de Supabase para usar en Server Components, Server Actions y Route Handlers.
 * Lee y escribe la sesión a través de las cookies de Next.js.
 *
 * Nota: el esquema de las tablas se documenta a mano en src/tipos/base-de-datos.js.
 */
export async function crearClienteServidor() {
  const almacenCookies = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return almacenCookies.getAll();
        },
        setAll(cookiesParaGuardar) {
          try {
            for (const { name, value, options } of cookiesParaGuardar) {
              almacenCookies.set(name, value, options);
            }
          } catch {
            // Se puede ignorar: ocurre cuando setAll se llama desde un Server Component.
            // La sesión se refresca igualmente en el middleware.
          }
        },
      },
    }
  );
}
