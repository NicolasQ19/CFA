"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { crearClienteServidor } from "@/lib/supabase/cliente-servidor";

/*El club publica una nueva oferta. Queda pendiente de moderación. */
export async function crearOferta(
  _estadoPrevio,
  datosFormulario,
) {
  const supabase = await crearClienteServidor();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Tenés que iniciar sesión como club para publicar una oferta." };
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
    club_id: user.id,
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

  await supabase
    .from("ofertas_laborales")
    .update({ estado: nuevoEstado, actualizada_en: new Date().toISOString() })
    .eq("id", ofertaId);

  revalidatePath("/mis-ofertas");
}

/*El administrador aprueba o rechaza una oferta pendiente de moderación. */
export async function moderarOferta(ofertaId, nuevoEstado) {
  const supabase = await crearClienteServidor();

  await supabase
    .from("ofertas_laborales")
    .update({ estado: nuevoEstado, actualizada_en: new Date().toISOString() })
    .eq("id", ofertaId);

  revalidatePath("/admin");
}
