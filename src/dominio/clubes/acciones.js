"use server";

import { revalidatePath } from "next/cache";
import { crearClienteServidor } from "@/lib/supabase/cliente-servidor";
import { validarSolicitudClub, validarRevisionClub } from "@/lib/verificacion-club";

async function ejecutar(formulario, validar, funcion) {
  const resultado = validar(formulario);
  if (resultado.error) return resultado;
  const supabase = await crearClienteServidor();
  const { error } = await supabase.rpc(funcion, resultado.datos);
  if (error) {
    const noDisponible = ["PGRST202", "42P01", "42703"].includes(error.code);
    return { error: noDisponible ? "La verificación no está disponible en este momento." : error.message };
  }
  revalidatePath("/", "layout");
  return { exito: true };
}

export async function solicitarVerificacion(_previo, formulario) {
  return ejecutar(formulario, validarSolicitudClub, "solicitar_verificacion_club");
}

export async function resolverVerificacion(_previo, formulario) {
  return ejecutar(formulario, validarRevisionClub, "resolver_verificacion_club");
}
