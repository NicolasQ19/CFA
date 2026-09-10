import { crearClienteServidor } from "@/lib/supabase/cliente-servidor";

/** Indica si el candidato dado ya se postuló a la oferta dada (para no mostrar el botón dos veces). */
export async function yaSePostuloAOferta(ofertaId: string, candidatoId: string): Promise<boolean> {
  const supabase = await crearClienteServidor();

  const { data } = await supabase
    .from("postulaciones")
    .select("id")
    .eq("oferta_id", ofertaId)
    .eq("candidato_id", candidatoId)
    .maybeSingle();

  return data !== null;
}
