"use server";

import { revalidatePath } from "next/cache";
import { crearClienteServidor } from "@/lib/supabase/cliente-servidor";
import { puestoCompatible } from "@/lib/postulacion-cartera";
import { retirarPostulacionPropia } from "@/lib/cancelar-postulacion";

export async function cancelarMiPostulacion(postulacionId) {
  const supabase = await crearClienteServidor();
  const resultado = await retirarPostulacionPropia(supabase, postulacionId);
  if (resultado.error) return resultado;
  revalidatePath("/mis-postulaciones");
  revalidatePath(`/ofertas/${resultado.ofertaId}`);
  revalidatePath(`/mis-ofertas/${resultado.ofertaId}/postulantes`);
  revalidatePath("/mi-cartera");
  return { exito: true };
}

/**
 * El candidato se postula a una oferta publicada. Requiere tener el perfil cargado.
 * La restricción "una vez por oferta" la impone la BD (unique); acá se chequea antes
 * para dar un mensaje claro, y el 23505 cubre el caso de dos envíos simultáneos.
 */
export async function postularseAOferta(ofertaId) {
  const supabase = await crearClienteServidor();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Tenés que iniciar sesión como candidato para postularte." };
  }

  const { data: usuario } = await supabase
    .from("usuarios")
    .select("rol")
    .eq("id", user.id)
    .maybeSingle();

  if (usuario?.rol !== "candidato") {
    return { error: "Solo los candidatos pueden postularse a una oferta." };
  }

  const { data: oferta } = await supabase
    .from("ofertas_laborales")
    .select("id, estado, puesto_buscado")
    .eq("id", ofertaId)
    .maybeSingle();

  if (!oferta || oferta.estado !== "publicada") {
    return { error: "Esta oferta no está disponible para postulaciones." };
  }

  const { data: perfil } = await supabase
    .from("perfiles_candidato")
    .select("usuario_id, puesto")
    .eq("usuario_id", user.id)
    .maybeSingle();

  if (!perfil) {
    return { error: "Completá tu perfil antes de postularte.", faltaPerfil: true };
  }

  if (!puestoCompatible(perfil.puesto, oferta.puesto_buscado)) {
    return { error: "Tu puesto profesional debe coincidir con el solicitado en la oferta." };
  }

  const { data: yaExiste } = await supabase
    .from("postulaciones")
    .select("id")
    .eq("oferta_id", ofertaId)
    .eq("candidato_id", user.id)
    .maybeSingle();

  if (yaExiste) {
    return { error: "Ya te postulaste a esta oferta." };
  }

  const { data: nuevaPostulacion, error } = await supabase.from("postulaciones").insert({
    oferta_id: ofertaId,
    candidato_id: user.id,
    estado: "postulado",
  }).select("id").single();

  if (error) {
    const yaPostulado = error.code === "23505"; // violación de la restricción unique (oferta_id, candidato_id)
    return { error: yaPostulado ? "Ya te postulaste a esta oferta." : error.message };
  }

  revalidatePath(`/ofertas/${ofertaId}`);
  revalidatePath("/mis-postulaciones");

  return { exito: true, postulacionId: nuevaPostulacion.id };
}
