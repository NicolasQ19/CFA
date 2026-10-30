"use server";

import { revalidatePath } from "next/cache";
import { crearClienteServidor } from "@/lib/supabase/cliente-servidor";
import { ROLES_CON_PLAN, calcularVencimiento, validarCambioDePlan } from "@/lib/suscripciones";

async function obtenerUsuarioConRol(supabase) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: usuario } = await supabase
    .from("usuarios")
    .select("id, rol, cuenta_activa")
    .eq("id", user.id)
    .maybeSingle();

  return usuario;
}

function revalidarPaneles() {
  revalidatePath("/planes");
  revalidatePath("/mis-ofertas");
  revalidatePath("/mis-postulaciones");
  revalidatePath("/mi-cartera");
}

/**
 * Contrata el plan Pro del rol del usuario. El cobro está simulado: no hay pasarela
 * de pago, el alta la resuelve la base mediante `activar_plan_pago`.
 */
export async function contratarPlanPago(_estadoPrevio, datosFormulario) {
  const supabase = await crearClienteServidor();
  const usuario = await obtenerUsuarioConRol(supabase);

  if (!usuario?.cuenta_activa || !ROLES_CON_PLAN.includes(usuario.rol)) {
    return { error: "Tu cuenta no puede contratar un plan." };
  }

  const meses = Number(datosFormulario?.get("meses") ?? 1);
  const { error } = await supabase.rpc("activar_plan_pago", {
    meses: Number.isFinite(meses) ? meses : 1,
  });

  if (error) {
    return { error: "No se pudo activar el plan. Intentá nuevamente." };
  }

  revalidarPaneles();
  return { exito: "Tu plan Pro quedó activo." };
}

/** Da de baja el plan Pro: la cuenta vuelve al plan gratuito y a sus cupos. */
export async function darDeBajaPlanPago() {
  const supabase = await crearClienteServidor();
  const usuario = await obtenerUsuarioConRol(supabase);

  if (!usuario?.cuenta_activa || !ROLES_CON_PLAN.includes(usuario.rol)) {
    return { error: "Tu cuenta no tiene un plan para dar de baja." };
  }

  const { error } = await supabase.rpc("cancelar_plan_pago");

  if (error) {
    return { error: "No se pudo dar de baja el plan. Intentá nuevamente." };
  }

  revalidarPaneles();
  return { exito: "Volviste al plan gratuito." };
}

/**
 * CU-23: el administrador activa o da de baja el plan de otra cuenta.
 * La escritura directa de `suscripciones` está reservada al administrador por RLS;
 * acá además se valida el rol de destino, la duración y que no sea su propia cuenta.
 */
export async function actualizarPlanDeUsuario({ usuarioId, plan, meses = 1, observaciones = "" }) {
  const supabase = await crearClienteServidor();
  const administrador = await obtenerUsuarioConRol(supabase);

  if (administrador?.rol !== "administrador" || !administrador.cuenta_activa) {
    return { error: "Solo un administrador activo puede gestionar planes." };
  }

  const { data: objetivo } = await supabase
    .from("usuarios")
    .select("id, rol")
    .eq("id", String(usuarioId ?? ""))
    .maybeSingle();

  if (!objetivo) {
    return { error: "No se encontró la cuenta indicada." };
  }

  const validacion = validarCambioDePlan({
    rol: objetivo.rol,
    plan,
    meses,
    esPropia: objetivo.id === administrador.id,
  });

  if (validacion.error) {
    return { error: validacion.error };
  }

  const { error } = await supabase.from("suscripciones").upsert({
    usuario_id: objetivo.id,
    plan: validacion.datos.plan,
    inicia_en: new Date().toISOString(),
    vence_en: validacion.datos.plan === "pago" ? calcularVencimiento(validacion.datos.meses) : null,
    activada_por: administrador.id,
    observaciones: String(observaciones ?? "").trim().slice(0, 500) || null,
  }, { onConflict: "usuario_id" });

  if (error) {
    return { error: "No se pudo actualizar el plan de la cuenta. Intentá nuevamente." };
  }

  revalidatePath("/admin/suscripciones");
  revalidarPaneles();
  return { exito: validacion.datos.plan === "pago" ? "Plan Pro activado." : "La cuenta volvió al plan gratuito." };
}

