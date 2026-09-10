import { createBrowserClient } from "@supabase/ssr";

/**
 * Cliente de Supabase para usar en Client Components (navegador).
 * Cada llamada crea una instancia nueva, tal como recomienda @supabase/ssr.
 *
 * Nota: no se tipa con el genérico `Database` de supabase-js porque nuestro
 * esquema se mantiene a mano en src/tipos/base-de-datos.ts (ver ese archivo);
 * las consultas devuelven ese tipo explícitamente donde hace falta.
 */
export function crearClienteNavegador() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
