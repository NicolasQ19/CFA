import { validarSeguimiento } from "./club.js";
import { comprobarClubVerificado } from "./verificacion-club.js";

const ESTADOS = ["postulado", "visto", "preseleccionado", "rechazado", "oferta_cerrada"];

export async function guardarGestionPostulante(supabase, formulario) {
  const etapa = String(formulario.get("etapa") ?? "");
  const notas = String(formulario.get("notas") ?? "").trim();
  const nuevoEstado = String(formulario.get("estado") ?? "");
  const postulacionId = String(formulario.get("postulacionId") ?? "");
  const errorValidacion = validarSeguimiento(etapa, notas);
  if (errorValidacion) return { error: errorValidacion };
  if (!ESTADOS.includes(nuevoEstado)) return { error: "Seleccioná un estado válido para el candidato." };

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Iniciá sesión para guardar el seguimiento." };
  const { data: usuario } = await supabase.from("usuarios").select("rol, cuenta_activa").eq("id", user.id).maybeSingle();
  if (usuario?.rol !== "club" || !usuario.cuenta_activa) return { error: "No tenés permiso para gestionar esta postulación." };
  if (!(await comprobarClubVerificado(supabase, user.id))) return { error: "Tu club debe estar verificado para gestionar candidatos." };
  const { data: postulacion } = await supabase.from("postulaciones")
    .select("oferta_id, estado, ofertas_laborales!inner(club_id)")
    .eq("id", postulacionId).eq("ofertas_laborales.club_id", user.id).maybeSingle();
  if (!postulacion) return { error: "No encontramos una postulación de tu club." };
  if (nuevoEstado === "oferta_cerrada" && postulacion.estado !== nuevoEstado) {
    return { error: "Seleccioná un estado válido para el candidato." };
  }

  const { error } = await supabase.from("seguimiento_club").upsert({
    postulacion_id: postulacionId, club_id: user.id, etapa, notas,
    actualizado_en: new Date().toISOString(),
  });
  if (error) return { error: "No se pudo guardar el seguimiento. El estado del candidato no se modificó." };

  const resultado = { ofertaId: postulacion.oferta_id, seguimientoGuardado: true };
  if (postulacion.estado !== nuevoEstado) {
    const { error: errorEstado } = await supabase.from("postulaciones")
      .update({ estado: nuevoEstado, actualizada_en: new Date().toISOString() })
      .eq("id", postulacionId).eq("oferta_id", postulacion.oferta_id).eq("estado", postulacion.estado)
      .select("id").single();
    if (errorEstado) return { ...resultado, error: "Se guardó el seguimiento privado, pero no se pudo cambiar el estado del candidato. Revisá la selección y volvé a guardar." };
  }
  return { ...resultado, exito: true };
}
