import { etapaPostulante, resumirActividad } from "@/lib/club";
import { crearClienteServidor } from "@/lib/supabase/cliente-servidor";

function armarPostulante(fila, usuario) {
  return {
    id: fila.id,
    estado: fila.estado,
    fecha: fila.creada_en,
    candidato_id: fila.candidato_id,
    nombre: usuario?.nombre_completo ?? "Candidato",
    puesto: fila.perfiles_candidato?.puesto ?? null,
    perfil: fila.perfiles_candidato,
    usuario,
  };
}

/** Ofertas del club con el total de inscriptos en cada una. */
export async function obtenerOfertasConConteoPostulantes(clubId) {
  const supabase = await crearClienteServidor();

  const ofertas = await todasLasFilas(() => supabase
    .from("ofertas_laborales").select("*").eq("club_id", clubId)
    .order("creada_en", { ascending: false }).order("id"));

  const lista = ofertas ?? [];
  if (lista.length === 0) return [];

  const postulaciones = await todasLasFilas(() => supabase.from("postulaciones")
    .select("id, oferta_id, ofertas_laborales!inner(club_id)").eq("ofertas_laborales.club_id", clubId).order("id"));

  const conteoPorOferta = {};
  for (const postulacion of postulaciones ?? []) {
    const ofertaId = postulacion.oferta_id;
    conteoPorOferta[ofertaId] = (conteoPorOferta[ofertaId] ?? 0) + 1;
  }

  return lista.map((oferta) => ({
    ...oferta,
    total_postulantes: conteoPorOferta[oferta.id] ?? 0,
  }));
}

/** Valida que la oferta sea del club y lista los candidatos postulados, más recientes primero. */
export async function obtenerPostulantesDeOferta(ofertaId, clubId) {
  const supabase = await crearClienteServidor();

  const { data: oferta } = await supabase
    .from("ofertas_laborales")
    .select("*")
    .eq("id", ofertaId)
    .eq("club_id", clubId)
    .maybeSingle();

  if (!oferta) {
    return null;
  }

  const postulaciones = await todasLasFilas(() => supabase
    .from("postulaciones").select("id, estado, creada_en, candidato_id, perfiles_candidato (*)")
    .eq("oferta_id", ofertaId).order("creada_en", { ascending: false }).order("id"));

  const lista = postulaciones ?? [];
  const candidatoIds = [...new Set(lista.map((fila) => fila.candidato_id))];

  // postulaciones no tiene FK directa a usuarios, así que los nombres se buscan aparte.
  let usuariosPorId = {};
  for (let i = 0; i < candidatoIds.length; i += 100) {
    const { data: usuarios, error } = await supabase.from("usuarios")
      .select("id, nombre_completo, correo_electronico").in("id", candidatoIds.slice(i, i + 100));
    if (error) throw error;
    Object.assign(usuariosPorId, Object.fromEntries((usuarios ?? []).map(usuario => [usuario.id, usuario])));
  }

  let seguimiento = [], errorSeguimiento = false;
  try {
    seguimiento = await todasLasFilas(() => supabase.from("seguimiento_club")
      .select("postulacion_id, etapa, notas").eq("club_id", clubId).order("postulacion_id"));
  } catch { errorSeguimiento = true; }
  const porId = new Map((seguimiento ?? []).map(s => [s.postulacion_id, s]));
  const postulantes = lista.map((fila) => ({ ...armarPostulante(fila, usuariosPorId[fila.candidato_id]),
    etapa: etapaPostulante(fila.estado, porId.get(fila.id)?.etapa), notas: porId.get(fila.id)?.notas ?? "" }));

  return { oferta, postulantes, seguimientoDisponible: !errorSeguimiento };
}

/** Indica si el candidato se postuló a alguna oferta del club (le da acceso a su perfil aunque esté oculto). */
export async function candidatoSePostuloAlClub(candidatoId, clubId) {
  const supabase = await crearClienteServidor();

  const { data } = await supabase
    .from("postulaciones")
    .select("id, ofertas_laborales!inner(club_id)")
    .eq("candidato_id", candidatoId)
    .eq("ofertas_laborales.club_id", clubId)
    .limit(1);

  return (data ?? []).length > 0;
}

// Paginar evita que el límite de filas de Supabase distorsione el resumen.
async function todasLasFilas(consulta) {
  const filas = [];
  for (let desde = 0; ; desde += 500) {
    const { data, error } = await consulta().range(desde, desde + 499);
    if (error) throw error;
    filas.push(...data);
    if (data.length < 500) return filas;
  }
}

export async function obtenerResumenClub(clubId) {
  const supabase = await crearClienteServidor();
  try {
    const [ofertas, postulaciones, seguimientos] = await Promise.all([
      todasLasFilas(() => supabase.from("ofertas_laborales").select("id, estado").eq("club_id", clubId).order("id")),
      todasLasFilas(() => supabase.from("postulaciones").select("id, oferta_id, estado, creada_en, ofertas_laborales!inner(club_id)").eq("ofertas_laborales.club_id", clubId).order("id")),
      todasLasFilas(() => supabase.from("seguimiento_club").select("postulacion_id, etapa").eq("club_id", clubId).order("postulacion_id")),
    ]);
    return { resumen: resumirActividad(ofertas, postulaciones, seguimientos) };
  } catch {
    return { error: "No se pudo cargar el resumen de actividad. Intentá nuevamente más tarde." };
  }
}
