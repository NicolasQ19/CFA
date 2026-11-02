import { crearClienteServidor } from "@/lib/supabase/cliente-servidor";
import { ordenParaConsulta, rangoDeNacimiento } from "@/lib/busqueda-candidatos";

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
 * filtrando por nombre, puesto, provincia, rango de edad y (para jugadores)
 * posición, con el orden que haya elegido el club.
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
      fecha_nacimiento,
      usuarios!inner (nombre_completo, cuenta_activa)
    `)
    .eq("perfil_visible", true)
    .eq("usuarios.cuenta_activa", true);

  const { columna, ascendente, ausentesAlFinal } = ordenParaConsulta(filtros.orden);
  consulta = consulta
    // `nullsFirst` solo donde hay nulos posibles (fecha_nacimiento): los perfiles
    // sin fecha quedan al final en vez de encabezar el orden por edad.
    .order(columna, { ascending: ascendente, ...(ausentesAlFinal ? { nullsFirst: false } : {}) })
    .limit(50);

  if (filtros.nombre) {
    // % y _ son comodines de ILIKE: se escapan para buscar el texto literal.
    const nombre = filtros.nombre.replace(/[%_\\]/g, (caracter) => `\\${caracter}`);
    consulta = consulta.ilike("usuarios.nombre_completo", `%${nombre}%`);
  }
  if (filtros.puesto) consulta = consulta.eq("puesto", filtros.puesto);
  if (filtros.provincia) consulta = consulta.eq("provincia", filtros.provincia);
  if (filtros.posicion) consulta = consulta.eq("posicion_juego", filtros.posicion);

  // El rango de edad se traduce a fechas para que filtre Postgres y no el servidor.
  const { nacidoDesde, nacidoHasta } = rangoDeNacimiento(filtros);
  if (nacidoDesde) consulta = consulta.gte("fecha_nacimiento", nacidoDesde);
  if (nacidoHasta) consulta = consulta.lte("fecha_nacimiento", nacidoHasta);

  const { data, error } = await consulta;

  if (error) {
    console.error("Error al buscar candidatos:", error.message);
    return [];
  }

  return data ?? [];
}
