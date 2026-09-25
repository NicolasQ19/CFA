import { crearClienteServidor } from "@/lib/supabase/cliente-servidor";

export async function obtenerPerfilClub(usuarioId) {
  const supabase = await crearClienteServidor();

  const { data } = await supabase
    .from("perfiles_club")
    .select("*")
    .eq("usuario_id", usuarioId)
    .maybeSingle();

  return data;
}

export async function obtenerPerfilCandidato(usuarioId) {
  const supabase = await crearClienteServidor();

  const { data } = await supabase
    .from("perfiles_candidato")
    .select("*")
    .eq("usuario_id", usuarioId)
    .maybeSingle();

  return data;
}

/**
 * Búsqueda de candidatos para clubes: solo perfiles visibles de cuentas activas,
 * filtrando por nombre, puesto, provincia y (para jugadores) posición.
 */
export async function buscarCandidatos(filtros) {
  const supabase = await crearClienteServidor();

  let consulta = supabase
    .from("perfiles_candidato")
    .select(`
      usuario_id,
      puesto,
      provincia,
      club_actual,
      foto_url,
      posicion_juego,
      anios_experiencia,
      especialidad,
      usuarios!inner (nombre_completo, cuenta_activa)
    `)
    .eq("perfil_visible", true)
    .eq("usuarios.cuenta_activa", true)
    .order("actualizado_en", { ascending: false })
    .limit(50);

  if (filtros.nombre) {
    // % y _ son comodines de ILIKE: se escapan para buscar el texto literal.
    const nombre = filtros.nombre.replace(/[%_\\]/g, (caracter) => `\\${caracter}`);
    consulta = consulta.ilike("usuarios.nombre_completo", `%${nombre}%`);
  }
  if (filtros.puesto) consulta = consulta.eq("puesto", filtros.puesto);
  if (filtros.provincia) consulta = consulta.eq("provincia", filtros.provincia);
  if (filtros.posicion) consulta = consulta.eq("posicion_juego", filtros.posicion);

  const { data, error } = await consulta;

  if (error) {
    console.error("Error al buscar candidatos:", error.message);
    return [];
  }

  return data ?? [];
}
