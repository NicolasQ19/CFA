import { crearClienteServidor } from "@/lib/supabase/cliente-servidor";

/** Postulaciones del candidato con los datos de la oferta y el club, más recientes primero. */
export async function obtenerPostulacionesCandidato(candidatoId) {
  const supabase = await crearClienteServidor();

  const { data, error } = await supabase
    .from("postulaciones")
    .select(`
      id,
      estado,
      creada_en,
      ofertas_laborales (
        id,
        puesto_buscado,
        posicion_juego,
        categoria,
        provincia,
        estado,
        perfiles_club (nombre_club)
      )
    `)
    .eq("candidato_id", candidatoId)
    .order("creada_en", { ascending: false });

  if (error) {
    console.error("Error al obtener postulaciones:", error.message);
    return [];
  }

  return data ?? [];
}

/** Indica si el candidato dado ya se postuló a la oferta dada (para no mostrar el botón dos veces). */
export async function yaSePostuloAOferta(ofertaId, candidatoId) {
  const supabase = await crearClienteServidor();

  const { data } = await supabase
    .from("postulaciones")
    .select("id")
    .eq("oferta_id", ofertaId)
    .eq("candidato_id", candidatoId)
    .maybeSingle();

  return data !== null;
}
