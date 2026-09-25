"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { crearClienteServidor } from "@/lib/supabase/cliente-servidor";
import { TRANSICIONES_OFERTA_DEL_CLUB } from "@/tipos/dominio";

/*El club publica una nueva oferta. Queda pendiente de moderación. */
export async function crearOferta(
  _estadoPrevio,
  datosFormulario,
) {
  const supabase = await crearClienteServidor();
  const usuario = await obtenerUsuarioConRol(supabase);

  if (usuario?.rol !== "club") {
    return { error: "Tenés que iniciar sesión como club para publicar una oferta." };
  }

  const { data: perfilClub } = await supabase
    .from("perfiles_club")
    .select("usuario_id")
    .eq("usuario_id", usuario.id)
    .maybeSingle();

  if (!perfilClub) {
    return { error: "Completá los datos del club antes de publicar una oferta." };
  }

  const puestoBuscado = String(datosFormulario.get("puestoBuscado") ?? "");
  const categoria = String(datosFormulario.get("categoria") ?? "").trim();
  const tipoContrato = String(datosFormulario.get("tipoContrato") ?? "");
  const provincia = String(datosFormulario.get("provincia") ?? "").trim();
  const descripcion = String(datosFormulario.get("descripcion") ?? "").trim();
  const posicionJuego = String(datosFormulario.get("posicionJuego") ?? "").trim() || null;

  if (!puestoBuscado || !categoria || !tipoContrato || !provincia || !descripcion) {
    return { error: "Completá todos los campos obligatorios de la oferta." };
  }

  const { error } = await supabase.from("ofertas_laborales").insert({
    club_id: usuario.id,
    puesto_buscado: puestoBuscado,
    posicion_juego: posicionJuego,
    categoria,
    tipo_contrato: tipoContrato,
    provincia,
    descripcion,
  });

  if (error) {
    return { error: error.message };
  }

  redirect("/mis-ofertas");
}

/*El club edita el estado de una oferta propia (pausar, cerrar, reabrir). */
export async function cambiarEstadoDeOferta(ofertaId, nuevoEstado) {
  const supabase = await crearClienteServidor();
  const usuario = await obtenerUsuarioConRol(supabase);

  if (usuario?.rol !== "club") {
    return { error: "Solo un club puede cambiar el estado de sus ofertas." };
  }

  const { data: oferta } = await supabase
    .from("ofertas_laborales")
    .select("id, club_id, estado")
    .eq("id", ofertaId)
    .maybeSingle();

  if (!oferta || oferta.club_id !== usuario.id) {
    return { error: "Esta oferta no pertenece a tu club." };
  }

  if (!TRANSICIONES_OFERTA_DEL_CLUB[oferta.estado]?.includes(nuevoEstado)) {
    return { error: "No se puede cambiar la oferta a ese estado." };
  }

  const { error } = await supabase
    .from("ofertas_laborales")
    .update({ estado: nuevoEstado, actualizada_en: new Date().toISOString() })
    .eq("id", ofertaId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/mis-ofertas");
  revalidatePath("/ofertas");
  revalidatePath(`/ofertas/${ofertaId}`);
  return { exito: true };
}

/*El administrador aprueba o rechaza una oferta pendiente de moderación. */
export async function moderarOferta(ofertaId, nuevoEstado) {
  if (!["publicada", "rechazada"].includes(nuevoEstado)) {
    return { error: "Estado de moderación inválido." };
  }

  const supabase = await crearClienteServidor();
  const usuario = await obtenerUsuarioConRol(supabase);

  if (usuario?.rol !== "administrador") {
    return { error: "Solo un administrador puede moderar ofertas." };
  }

  const { data: oferta } = await supabase
    .from("ofertas_laborales")
    .select("id, estado")
    .eq("id", ofertaId)
    .maybeSingle();

  if (oferta?.estado !== "pendiente_moderacion") {
    return { error: "Esta oferta ya no está pendiente de moderación." };
  }

  const { error } = await supabase
    .from("ofertas_laborales")
    .update({ estado: nuevoEstado, actualizada_en: new Date().toISOString() })
    .eq("id", ofertaId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin");
  revalidatePath("/ofertas");
  return { exito: true };
}

async function obtenerUsuarioConRol(supabase) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: usuario } = await supabase
    .from("usuarios")
    .select("id, rol")
    .eq("id", user.id)
    .maybeSingle();

  return usuario;
}
