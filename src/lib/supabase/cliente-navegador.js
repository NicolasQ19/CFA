import { createBrowserClient } from "@supabase/ssr";

/**
 * Cliente de Supabase para usar en Client Components (navegador).
 * Cada llamada crea una instancia nueva, tal como recomienda @supabase/ssr.
 *
 * Nota: el esquema de las tablas se documenta a mano en src/tipos/base-de-datos.js.
 */
export function crearClienteNavegador() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
