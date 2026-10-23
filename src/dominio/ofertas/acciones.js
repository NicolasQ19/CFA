"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { crearClienteServidor } from "@/lib/supabase/cliente-servidor";
import { comprobarClubVerificado } from "@/lib/verificacion-club";
import { TRANSICIONES_OFERTA_DEL_CLUB, TRANSICIONES_OFERTA_DEL_ADMIN } from "@/tipos/dominio";

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
  if (!usuario.cuenta_activa || !(await comprobarClubVerificado(supabase, usuario.id))) return { error: "Verificá tu club desde Mi club antes de publicar ofertas." };

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
  if (!usuario.cuenta_activa || !(await comprobarClubVerificado(supabase, usuario.id))) return { error: "Tu club debe estar verificado para gestionar ofertas." };

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
  if (!["publicada", "rechazada", "pausada"].includes(nuevoEstado)) {
    return { error: "Estado de moderación inválido." };
  }

  const supabase = await crearClienteServidor();
  const usuario = await obtenerUsuarioConRol(supabase);

  if (usuario?.rol !== "administrador") {
    return { error: "Solo un administrador puede moderar ofertas." };
  }

  const { data: oferta } = await supabase
    .from("ofertas_laborales")
    .select("id, estado, club_id")
    .eq("id", ofertaId)
    .maybeSingle();

  if (!oferta || !TRANSICIONES_OFERTA_DEL_ADMIN[oferta.estado]?.includes(nuevoEstado)) {
    return { error: "No se puede realizar este cambio desde el estado actual de la oferta." };
  }
  if (nuevoEstado === "publicada" && !(await comprobarClubVerificado(supabase, oferta.club_id))) return { error: "Primero verificá la cuenta del club desde Verificación de clubes." };

  const { error } = await supabase
    .from("ofertas_laborales")
    .update({ estado: nuevoEstado, actualizada_en: new Date().toISOString() })
    .eq("id", ofertaId)
    .eq("estado", oferta.estado)
    .select("id")
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin");
  revalidatePath("/admin/metricas");
  revalidatePath("/mis-ofertas");
  revalidatePath("/perfil-publico-club");
  revalidatePath(`/ofertas/${ofertaId}`);
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
    .select("id, rol, cuenta_activa")
    .eq("id", user.id)
    .maybeSingle();

  return usuario;
}
