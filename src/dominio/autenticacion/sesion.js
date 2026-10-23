import { crearClienteServidor } from "@/lib/supabase/cliente-servidor";

/**
 * Devuelve la fila de `usuarios` (con su rol) para la sesión activa,
 * o null si nadie inició sesión. Pensado para usarse en Server Components.
 */
export async function obtenerUsuarioActual() {
  const supabase = await crearClienteServidor();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: usuario } = await supabase
    .from("usuarios")
    .select("*")
    .eq("id", user.id)
    .single();

  if (usuario?.rol === "club") {
    const { data: verificacion } = await supabase.from("verificaciones_club")
      .select("*").eq("club_id", usuario.id).maybeSingle();
    return { ...usuario, verificacion_club: verificacion ?? null };
  }
  return usuario ?? null;
}
