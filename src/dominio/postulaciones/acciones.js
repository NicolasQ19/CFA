"use server";

import { revalidatePath } from "next/cache";
import { crearClienteServidor } from "@/lib/supabase/cliente-servidor";

/*El candidato se postula a una oferta. La restricción "una vez por oferta" la impone la BD (unique). */
export async function postularseAOferta(ofertaId) {
  const supabase = await crearClienteServidor();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Tenés que iniciar sesión como candidato para postularte.", exito: false };
  }

  const { error } = await supabase.from("postulaciones").insert({
    oferta_id: ofertaId,
    candidato_id: user.id,
  });

  if (error) {
    const yaPostulado = error.code === "23505"; // violación de la restricción unique (oferta_id, candidato_id)
    return {
      error: yaPostulado ? "Ya te postulaste a esta oferta." : error.message,
      exito: false,
    };
  }

  revalidatePath(`/ofertas/${ofertaId}`);
  return { error: null, exito: true };
}