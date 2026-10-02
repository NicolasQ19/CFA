import { createClient } from "@supabase/supabase-js";

/**
 * Cliente de Supabase con la service_role key: se salta RLS por completo.
 * Uso exclusivo del servidor para operaciones administrativas.
 */
export function crearClienteAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const claveServicio = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !claveServicio) {
    throw new Error(
      "Falta configurar SUPABASE_SERVICE_ROLE_KEY en el entorno del servidor."
    );
  }

  return createClient(url, claveServicio, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}