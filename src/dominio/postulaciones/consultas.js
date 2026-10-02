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

/**
 * Postulación del candidato a una oferta, o null si todavía no se postuló.
 * La ficha de la oferta la usa para mostrar el estado y la fecha en lugar del botón.
 */
export async function obtenerPostulacionDelCandidato(ofertaId, candidatoId) {
  const supabase = await crearClienteServidor();

  const { data } = await supabase
    .from("postulaciones")
    .select("id, estado, creada_en")
    .eq("oferta_id", ofertaId)
    .eq("candidato_id", candidatoId)
    .maybeSingle();

  return data;
}
