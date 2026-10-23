"use server";

import { revalidatePath } from "next/cache";
import { crearClienteServidor } from "@/lib/supabase/cliente-servidor";
import { guardarGestionPostulante } from "@/lib/guardar-seguimiento-club";

export async function guardarSeguimientoClub(_estadoPrevio, formulario) {
  const resultado = await guardarGestionPostulante(await crearClienteServidor(), formulario);
  if (resultado.seguimientoGuardado) {
    revalidatePath("/mis-ofertas");
    revalidatePath(`/mis-ofertas/${resultado.ofertaId}/postulantes`);
    revalidatePath("/mis-postulaciones");
    revalidatePath(`/ofertas/${resultado.ofertaId}`);
  }
  return resultado;
}
