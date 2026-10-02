"use server";

import { validarSeguimiento } from "@/lib/club";
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
    .select("id, rol, cuenta_activa")
    .eq("id", user.id)
    .maybeSingle();

  if (usuario?.rol !== "club" || !usuario.cuenta_activa) {
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

export async function guardarSeguimientoClub(_estadoPrevio, formulario) {
  const etapa = String(formulario.get("etapa") ?? "");
  const notas = String(formulario.get("notas") ?? "").trim();
  const errorValidacion = validarSeguimiento(etapa, notas);
  if (errorValidacion) return { error: errorValidacion };
  const postulacionId = String(formulario.get("postulacionId") ?? "");
  const supabase = await crearClienteServidor();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Iniciá sesión para guardar el seguimiento." };
  const { data: usuario } = await supabase.from("usuarios").select("rol, cuenta_activa").eq("id", user.id).maybeSingle();
  if (usuario?.rol !== "club" || !usuario.cuenta_activa) return { error: "No tenés permiso para gestionar esta postulación." };
  const { data: postulacion } = await supabase.from("postulaciones").select("oferta_id, ofertas_laborales!inner(club_id)").eq("id", postulacionId).eq("ofertas_laborales.club_id", user.id).maybeSingle();
  if (!postulacion) return { error: "No encontramos una postulación de tu club." };
  const { error } = await supabase.from("seguimiento_club").upsert({ postulacion_id: postulacionId, club_id: user.id, etapa, notas, actualizado_en: new Date().toISOString() });
  if (error) return { error: "No se pudo guardar el seguimiento. Intentá nuevamente." };
  revalidatePath("/mis-ofertas");
  revalidatePath(`/mis-ofertas/${postulacion.oferta_id}/postulantes`);
  return { exito: true };
}
