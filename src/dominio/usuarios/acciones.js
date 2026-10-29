"use server";

import { revalidatePath } from "next/cache";
import { crearClienteServidor } from "@/lib/supabase/cliente-servidor";
import { crearClienteAdmin } from "@/lib/supabase/cliente-admin";
import { cambiarEstadoCuentaUsuario } from "@/lib/gestion-usuarios";

function obtenerClienteAdminOpcional() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return null;
  }
  try {
    return crearClienteAdmin();
  } catch {
    return null;
  }
}

/** CU-04 / RF-04: activa o desactiva una cuenta de usuario desde el panel de administración. */
export async function actualizarEstadoUsuario(usuarioId, nuevaActiva) {
  const supabase = await crearClienteServidor();
  const supabaseAdmin = obtenerClienteAdminOpcional();

  const resultado = await cambiarEstadoCuentaUsuario({
    supabase,
    supabaseAdmin,
    objetivoId: usuarioId,
    cuentaActiva: Boolean(nuevaActiva),
  });

  if (resultado.error) {
    return resultado;
  }

  for (const ruta of [
    "/admin/usuarios",
    "/admin/metricas",
    "/admin",
    "/admin/clubes",
    "/ofertas",
    "/buscar-candidatos",
  ]) {
    revalidatePath(ruta);
  }

  return resultado;
}
