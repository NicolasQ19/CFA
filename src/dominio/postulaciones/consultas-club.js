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

  const { data: ofertas } = await supabase
    .from("ofertas_laborales")
    .select("*")
    .eq("club_id", clubId)
    .order("creada_en", { ascending: false });

  const lista = ofertas ?? [];
  if (lista.length === 0) return [];

  const ids = lista.map((oferta) => oferta.id);
  const { data: postulaciones } = await supabase
    .from("postulaciones")
    .select("oferta_id")
    .in("oferta_id", ids);

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

  const { data: postulaciones } = await supabase
    .from("postulaciones")
    .select("id, estado, creada_en, candidato_id, perfiles_candidato (*)")
    .eq("oferta_id", ofertaId)
    .order("creada_en", { ascending: false });

  const lista = postulaciones ?? [];
  const candidatoIds = [...new Set(lista.map((fila) => fila.candidato_id))];

  // postulaciones no tiene FK directa a usuarios, así que los nombres se buscan aparte.
  let usuariosPorId = {};
  if (candidatoIds.length > 0) {
    const { data: usuarios } = await supabase
      .from("usuarios")
      .select("id, nombre_completo, correo_electronico")
      .in("id", candidatoIds);

    usuariosPorId = Object.fromEntries((usuarios ?? []).map((usuario) => [usuario.id, usuario]));
  }

  const postulantes = lista.map((fila) => armarPostulante(fila, usuariosPorId[fila.candidato_id]));

  return { oferta, postulantes };
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
