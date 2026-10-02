import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Cliente de Supabase para usar en Server Components, Server Actions y Route Handlers.
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
            // Ignorado: ocurre cuando setAll se llama desde un Server Component.
          }
        },
      },
    }
  );
}