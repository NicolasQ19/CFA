"use server";

import { revalidatePath } from "next/cache";
import { crearClienteServidor } from "@/lib/supabase/cliente-servidor";

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
    .select("id, estado")
    .eq("id", ofertaId)
    .maybeSingle();

  if (!oferta || oferta.estado !== "publicada") {
    return { error: "Esta oferta no está disponible para postulaciones." };
  }

  const { data: perfil } = await supabase
    .from("perfiles_candidato")
    .select("usuario_id")
    .eq("usuario_id", user.id)
    .maybeSingle();

  if (!perfil) {
    return { error: "Completá tu perfil antes de postularte.", faltaPerfil: true };
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

  const { error } = await supabase.from("postulaciones").insert({
    oferta_id: ofertaId,
    candidato_id: user.id,
    estado: "postulado",
  });

  if (error) {
    const yaPostulado = error.code === "23505"; // violación de la restricción unique (oferta_id, candidato_id)
    return { error: yaPostulado ? "Ya te postulaste a esta oferta." : error.message };
  }

  revalidatePath(`/ofertas/${ofertaId}`);
  revalidatePath("/mis-postulaciones");

  return { exito: true };
}
