"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { crearClienteServidor } from "@/lib/supabase/cliente-servidor";
import { ejecutarCambioEstadoOferta } from "@/lib/cierre-oferta";
import { validarDatosOferta, validarEdicionOferta, validarEliminacionOferta } from "@/lib/editar-oferta";
import { comprobarClubVerificado } from "@/lib/verificacion-club";
import { obtenerCupoOfertasDelClub } from "@/lib/cupo-suscripciones";
import { ETIQUETAS_PUESTO_PROFESIONAL, TRANSICIONES_OFERTA_DEL_ADMIN } from "@/tipos/dominio";

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

  // El plan gratuito limita las ofertas activas simultáneas; el trigger lo repite en la base.
  const cupo = await obtenerCupoOfertasDelClub(supabase, usuario.id);
  if (cupo.fallo || !cupo.permitido) {
    return { error: cupo.fallo ?? cupo.error, limitePlan: cupo.limitePlan ?? false };
  }

  const validacion = validarDatosOferta(datosFormulario);
  if (validacion.error) {
    return { error: validacion.error };
  }

  const { error } = await supabase.from("ofertas_laborales").insert({
    club_id: usuario.id,
    ...validacion.datos,
  });

  if (error) {
    return { error: error.message };
  }

  redirect("/mis-ofertas");
}

/* El club edita una oferta propia respetando bloqueo de identidad y reenvío a moderación. */
export async function editarOferta(
  _estadoPrevio,
  datosFormulario,
) {
  const supabase = await crearClienteServidor();
  const usuario = await obtenerUsuarioConRol(supabase);

  if (usuario?.rol !== "club") {
    return { error: "Tenés que iniciar sesión como club para editar una oferta." };
  }
  if (!usuario.cuenta_activa || !(await comprobarClubVerificado(supabase, usuario.id))) {
    return { error: "Tu club debe estar verificado para gestionar ofertas." };
  }

  const ofertaId = String(datosFormulario.get("ofertaId") ?? "");
  if (!ofertaId) {
    return { error: "Identificador de oferta inválido." };
  }

  const [{ data: oferta }, { count: totalPostulantes, error: errorConteo }] = await Promise.all([
    supabase
      .from("ofertas_laborales")
      .select("id, club_id, estado, puesto_buscado, posicion_juego, categoria, tipo_contrato, provincia, descripcion")
      .eq("id", ofertaId)
      .maybeSingle(),
    supabase
      .from("postulaciones")
      .select("id", { count: "exact", head: true })
      .eq("oferta_id", ofertaId),
  ]);

  if (!oferta || oferta.club_id !== usuario.id) {
    return { error: "Esta oferta no pertenece a tu club." };
  }

  if (errorConteo || totalPostulantes === null) {
    return { error: "No se pudo verificar el estado de postulaciones de la oferta. Intentá nuevamente." };
  }

  const validacion = validarEdicionOferta({
    datosFormulario,
    ofertaActual: oferta,
    totalPostulantes,
  });
  if (validacion.error) {
    return { error: validacion.error };
  }

  const { data: actualizada, error } = await supabase
    .from("ofertas_laborales")
    .update({
      ...validacion.datos,
      actualizada_en: new Date().toISOString(),
    })
    .eq("id", ofertaId)
    .eq("club_id", usuario.id)
    .select("id")
    .maybeSingle();

  if (error || !actualizada) {
    return { error: error?.message ?? "No se pudo actualizar la oferta." };
  }

  revalidatePath("/mis-ofertas");
  revalidatePath("/ofertas");
  revalidatePath(`/ofertas/${ofertaId}`);
  revalidatePath(`/mis-ofertas/${ofertaId}/editar`);
  revalidatePath("/perfil-publico-club");
  revalidatePath("/admin");
  revalidatePath("/admin/metricas");

  redirect("/mis-ofertas");
}

/*El club edita el estado de una oferta propia (pausar, reanudar o cerrar definitivamente). */
export async function cambiarEstadoDeOferta(ofertaId, nuevoEstado) {
  const supabase = await crearClienteServidor();
  const usuario = await obtenerUsuarioConRol(supabase);

  if (usuario?.rol !== "club") {
    return { error: "Solo un club puede cambiar el estado de sus ofertas." };
  }
  if (!usuario.cuenta_activa || !(await comprobarClubVerificado(supabase, usuario.id))) return { error: "Tu club debe estar verificado para gestionar ofertas." };

  const resultado = await ejecutarCambioEstadoOferta({
    supabase,
    ofertaId,
    clubId: usuario.id,
    nuevoEstado,
  });

  if (resultado.error) {
    return { error: resultado.error };
  }

  revalidatePath("/mis-ofertas");
  revalidatePath("/ofertas");
  revalidatePath(`/ofertas/${ofertaId}`);
  revalidatePath(`/mis-ofertas/${ofertaId}/postulantes`);
  revalidatePath("/mis-postulaciones");
  revalidatePath("/mi-cartera");
  revalidatePath("/perfil-publico-club");
  revalidatePath("/admin");
  revalidatePath("/admin/metricas");
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

/* El club elimina una oferta propia; si tenía postulantes, les deja un aviso antes de borrarla. */
export async function eliminarOferta(ofertaId) {
  const supabase = await crearClienteServidor();
  const usuario = await obtenerUsuarioConRol(supabase);

  if (usuario?.rol !== "club" || !usuario.cuenta_activa) {
    return { error: "Tenés que iniciar sesión como club para eliminar una oferta." };
  }

  const id = String(ofertaId ?? "");
  if (!id) {
    return { error: "Identificador de oferta inválido." };
  }

  const [{ data: oferta }, { data: postulaciones, error: errorPostulaciones }] = await Promise.all([
    supabase
      .from("ofertas_laborales")
      .select("id, club_id, puesto_buscado, posicion_juego, perfiles_club(nombre_club)")
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("postulaciones")
      .select("candidato_id, postulado_por_representante_id")
      .eq("oferta_id", id),
  ]);

  if (!oferta || oferta.club_id !== usuario.id) {
    return { error: "Esta oferta no pertenece a tu club." };
  }

  if (errorPostulaciones) {
    return { error: "No se pudo verificar si la oferta tiene postulantes. Intentá nuevamente." };
  }

  const { puedeEliminar, motivoBloqueo } = validarEliminacionOferta(oferta, postulaciones?.length ?? 0);
  if (!puedeEliminar) {
    return { error: motivoBloqueo };
  }

  // El aviso se registra antes del borrado: después, la postulación ya no existe.
  if (postulaciones?.length) {
    const { error: errorAviso } = await supabase.from("avisos_ofertas_eliminadas").insert(
      postulaciones.map((postulacion) => ({
        candidato_id: postulacion.candidato_id,
        representante_id: postulacion.postulado_por_representante_id,
        club_id: usuario.id,
        nombre_club: oferta.perfiles_club?.nombre_club ?? "El club",
        titulo_oferta: tituloDeOferta(oferta),
      })),
    );

    if (errorAviso) {
      return { error: "No se pudo avisar a los postulantes, así que la oferta no se eliminó. Intentá nuevamente." };
    }
  }

  const { error } = await supabase
    .from("ofertas_laborales")
    .delete()
    .eq("id", id)
    .eq("club_id", usuario.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/mis-ofertas");
  revalidatePath("/ofertas");
  revalidatePath("/mis-postulaciones");
  revalidatePath("/mi-cartera");
  revalidatePath("/perfil-publico-club");
  revalidatePath("/admin");
  revalidatePath("/admin/metricas");
  return { exito: true };
}

/** Título legible de la oferta, para que el aviso siga teniendo sentido una vez borrada. */
function tituloDeOferta(oferta) {
  const puesto = ETIQUETAS_PUESTO_PROFESIONAL[oferta?.puesto_buscado] ?? "Oferta laboral";
  return oferta?.posicion_juego ? `${puesto} — ${oferta.posicion_juego}` : puesto;
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
