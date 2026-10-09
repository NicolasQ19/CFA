/** Retira una postulación del candidato autenticado, con permisos RLS. */
export async function retirarPostulacionPropia(supabase, postulacionId) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Iniciá sesión como candidato para cancelar tu postulación." };
  const { data: usuario } = await supabase.from("usuarios")
    .select("rol, cuenta_activa").eq("id", user.id).maybeSingle();
  if (usuario?.rol !== "candidato" || !usuario.cuenta_activa) {
    return { error: "Solo un candidato con cuenta activa puede cancelar sus propias postulaciones." };
  }
  const { data: postulacion } = await supabase.from("postulaciones")
    .select("id, oferta_id").eq("id", postulacionId).eq("candidato_id", user.id).maybeSingle();
  if (!postulacion) return { error: "La postulación no existe o no pertenece a tu cuenta." };

  const { data: eliminadas, error } = await supabase.from("postulaciones").delete()
    .eq("id", postulacionId).eq("candidato_id", user.id).select("id");
  if (error || !eliminadas?.length) return { error: "No se pudo cancelar la postulación. Actualizá la página y volvé a intentar." };
  return { exito: true, ofertaId: postulacion.oferta_id };
}

/** Retira únicamente postulaciones enviadas por el representante de una cartera propia. */
export async function retirarPostulacionDeCartera(supabase, postulacionId) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Iniciá sesión como representante para cancelar una postulación." };

  const { data: usuario } = await supabase.from("usuarios")
    .select("rol, cuenta_activa").eq("id", user.id).maybeSingle();
  if (usuario?.rol !== "representante" || !usuario.cuenta_activa) {
    return { error: "Solo un representante activo puede cancelar postulaciones de su cartera." };
  }

  const { data: postulacion } = await supabase.from("postulaciones")
    .select("id, candidato_id, oferta_id")
    .eq("id", postulacionId).eq("postulado_por_representante_id", user.id).maybeSingle();
  if (!postulacion) return { error: "La postulación no existe o no fue enviada por vos." };

  const { data: vinculo } = await supabase.from("candidatos_representados")
    .select("candidato_id").eq("representante_id", user.id)
    .eq("candidato_id", postulacion.candidato_id).maybeSingle();
  if (!vinculo) return { error: "El candidato ya no pertenece a tu cartera." };

  // RLS también exige la pertenencia a la cartera en el momento del borrado.
  const { data: eliminadas, error } = await supabase.from("postulaciones").delete()
    .eq("id", postulacionId).eq("candidato_id", postulacion.candidato_id)
    .eq("postulado_por_representante_id", user.id).select("id");
  if (error || !eliminadas?.length) return { error: "No se pudo cancelar la postulación. Actualizá la página y volvé a intentar." };
  return { exito: true, ofertaId: postulacion.oferta_id };
}
