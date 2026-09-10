"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { crearClienteServidor } from "@/lib/supabase/cliente-servidor";
import type { ResultadoAccion } from "@/dominio/autenticacion/acciones";
import type { EstadoOferta, PuestoProfesional, TipoContrato } from "@/tipos/dominio";

/** RF-12: el club publica una nueva oferta. Queda pendiente de moderación (RF-25). */
export async function crearOferta(
  _estadoPrevio: ResultadoAccion,
  datosFormulario: FormData
): Promise<ResultadoAccion> {
  const supabase = await crearClienteServidor();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Tenés que iniciar sesión como club para publicar una oferta." };
  }

  const puestoBuscado = String(datosFormulario.get("puestoBuscado") ?? "") as PuestoProfesional;
  const categoria = String(datosFormulario.get("categoria") ?? "").trim();
  const tipoContrato = String(datosFormulario.get("tipoContrato") ?? "") as TipoContrato;
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

/** RF-13: el club edita el estado de una oferta propia (pausar, cerrar, reabrir). */
export async function cambiarEstadoDeOferta(ofertaId: string, nuevoEstado: EstadoOferta): Promise<void> {
  const supabase = await crearClienteServidor();

  await supabase
    .from("ofertas_laborales")
    .update({ estado: nuevoEstado, actualizada_en: new Date().toISOString() })
    .eq("id", ofertaId);

  revalidatePath("/mis-ofertas");
}

/** RF-25: el administrador aprueba o rechaza una oferta pendiente de moderación. */
export async function moderarOferta(ofertaId: string, nuevoEstado: EstadoOferta): Promise<void> {
  const supabase = await crearClienteServidor();

  await supabase
    .from("ofertas_laborales")
    .update({ estado: nuevoEstado, actualizada_en: new Date().toISOString() })
    .eq("id", ofertaId);

  revalidatePath("/admin");
}
