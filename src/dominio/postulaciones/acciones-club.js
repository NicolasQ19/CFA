"use server";

import { revalidatePath } from "next/cache";
import { crearClienteServidor } from "@/lib/supabase/cliente-servidor";

const ESTADOS_PERMITIDOS = ["postulado", "visto", "preseleccionado", "rechazado"];

export async function actualizarEstadoPostulacion({ postulacionId, nuevoEstado, ofertaId }) {
  if (!ESTADOS_PERMITIDOS.includes(nuevoEstado)) {
    return { error: "El estado de la postulación no es válido." };
  }

  const supabase = await crearClienteServidor();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Tenés que iniciar sesión como club para gestionar postulantes." };
  }

  const { data: usuario } = await supabase
    .from("usuarios")
    .select("id, rol")
    .eq("id", user.id)
    .maybeSingle();

  if (usuario?.rol !== "club") {
    return { error: "Solo un club puede actualizar el estado de una postulación." };
  }

  const { data: postulacion } = await supabase
    .from("postulaciones")
    .select("id, oferta_id")
    .eq("id", postulacionId)
    .maybeSingle();

  if (!postulacion || postulacion.oferta_id !== ofertaId) {
    return { error: "No encontramos esa postulación en la oferta." };
  }

  const { data: oferta } = await supabase
    .from("ofertas_laborales")
    .select("id, club_id")
    .eq("id", ofertaId)
    .maybeSingle();

  if (!oferta || oferta.club_id !== user.id) {
    return { error: "Esta oferta no pertenece a tu club." };
  }

  const { error } = await supabase
    .from("postulaciones")
    .update({
      estado: nuevoEstado,
      actualizada_en: new Date().toISOString(),
    })
    .eq("id", postulacionId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/mis-ofertas");
  revalidatePath(`/mis-ofertas/${ofertaId}/postulantes`);
  revalidatePath("/mis-postulaciones");

  return { exito: true };
}
