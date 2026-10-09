import { crearClienteServidor } from "@/lib/supabase/cliente-servidor";

/** RF-18: listado público de ofertas publicadas, con filtros por puesto, provincia y categoría. */
export async function listarOfertasPublicadas(filtros) {
  const supabase = await crearClienteServidor();

  let consulta = supabase
    .from("ofertas_laborales")
    .select("*, perfiles_club(nombre_club, escudo_url)")
    .eq("estado", "publicada")
    .order("creada_en", { ascending: false });

  if (filtros.puesto) consulta = consulta.eq("puesto_buscado", filtros.puesto);
  if (filtros.provincia) consulta = consulta.eq("provincia", filtros.provincia);
  if (filtros.categoria) consulta = consulta.eq("categoria", filtros.categoria);
  if (filtros.tipoContrato) consulta = consulta.eq("tipo_contrato", filtros.tipoContrato);

  const { data } = await consulta;
  return data ?? [];
}

/** RF-19: ficha de detalle de una oferta publicada. Las no publicadas devuelven null (404). */
export async function obtenerOfertaPublicadaPorId(ofertaId) {
  const supabase = await crearClienteServidor();

  const { data, error } = await supabase
    .from("ofertas_laborales")
    .select("*, perfiles_club(*)")
    .eq("id", ofertaId)
    .eq("estado", "publicada")
    .maybeSingle();

  if (error) console.error("Error al obtener la oferta:", error.message);

  return data;
}

/** RF-13: ofertas propias del club (en cualquier estado), para su panel de gestión. */
export async function listarOfertasDelClub(clubId) {
  const supabase = await crearClienteServidor();

  const { data } = await supabase
    .from("ofertas_laborales")
    .select("*")
    .eq("club_id", clubId)
    .order("creada_en", { ascending: false });

  return data ?? [];
}

/** Ofertas publicadas de un club, para mostrarlas en su perfil público. */
export async function listarOfertasPublicadasDelClub(clubId) {
  const supabase = await crearClienteServidor();

  const { data } = await supabase
    .from("ofertas_laborales")
    .select("*")
    .eq("club_id", clubId)
    .eq("estado", "publicada")
    .order("creada_en", { ascending: false });

  return data ?? [];
}

/** RF-25: ofertas pendientes de moderación, para el panel de administración. */
export async function listarOfertasPendientesDeModeracion() {
  const supabase = await crearClienteServidor();

  const { data } = await supabase
    .from("ofertas_laborales")
    .select("*, perfiles_club(*)")
    .eq("estado", "pendiente_moderacion")
    .order("creada_en", { ascending: true });

  return data ?? [];
}
