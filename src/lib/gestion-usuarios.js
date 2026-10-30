import { ETIQUETAS_ROL_USUARIO } from "../tipos/dominio.js";

export const ROLES_FILTRO_USUARIOS = [
  ["todos", "Todos los roles"],
  ["club", "Clubes"],
  ["candidato", "Candidatos"],
  ["representante", "Representantes"],
  ["administrador", "Administradores"],
];

export const ESTADOS_FILTRO_USUARIOS = [
  ["todos", "Todas"],
  ["activos", "Activas"],
  ["inactivos", "Inactivas"],
];

export const USUARIOS_POR_PAGINA = 20;

const PATRON_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function esFichaRepresentado(usuario) {
  return Boolean(usuario?.correo_electronico?.toLowerCase().endsWith("@cfa.local"));
}

export function normalizarFiltrosUsuarios(parametros = {}) {
  const rolRaw = String(parametros?.rol ?? "todos");
  const rol = Object.hasOwn(ETIQUETAS_ROL_USUARIO, rolRaw) ? rolRaw : "todos";

  const estadoRaw = String(parametros?.estado ?? "todos");
  const estado = ["todos", "activos", "inactivos"].includes(estadoRaw) ? estadoRaw : "todos";

  const busqueda = String(parametros?.q ?? "")
    .trim()
    .slice(0, 120)
    .replace(/[,%()]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const pagina = Math.max(1, Math.min(100000, Number.parseInt(parametros?.pagina, 10) || 1));

  return { rol, estado, busqueda, pagina };
}

export function construirHrefUsuarios(filtros, cambios = {}) {
  const siguiente = { ...filtros, ...cambios };
  const params = new URLSearchParams();
  if (siguiente.rol && siguiente.rol !== "todos") params.set("rol", siguiente.rol);
  if (siguiente.estado && siguiente.estado !== "todos") params.set("estado", siguiente.estado);
  if (siguiente.busqueda) params.set("q", siguiente.busqueda);
  if (siguiente.pagina && siguiente.pagina > 1) params.set("pagina", String(siguiente.pagina));
  const query = params.toString();
  return query ? `/admin/usuarios?${query}` : "/admin/usuarios";
}

export function validarCambioEstadoCuenta({ admin, objetivoId, cuentaActiva }) {
  if (!admin || admin.rol !== "administrador" || !admin.cuenta_activa) {
    return { error: "Solo un administrador activo puede gestionar cuentas de usuarios." };
  }
  if (typeof objetivoId !== "string" || !PATRON_UUID.test(objetivoId)) {
    return { error: "Identificador de usuario inválido." };
  }
  if (typeof cuentaActiva !== "boolean") {
    return { error: "Estado de cuenta inválido." };
  }
  if (admin.id === objetivoId && !cuentaActiva) {
    return { error: "No podés desactivar tu propia cuenta de administrador." };
  }
  return { ok: true };
}

/**
 * Cambia el estado cuenta_activa de un usuario verificando permisos de administrador (CU-04 / RF-04).
 * Si está disponible supabaseAdmin, sincroniza también el bloqueo en Supabase Auth para cuentas reales.
 */
export async function cambiarEstadoCuentaUsuario({
  supabase,
  supabaseAdmin = null,
  objetivoId,
  cuentaActiva,
}) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Iniciá sesión como administrador para continuar." };
  }

  const { data: admin } = await supabase
    .from("usuarios")
    .select("id, rol, cuenta_activa")
    .eq("id", user.id)
    .maybeSingle();

  const validacion = validarCambioEstadoCuenta({ admin, objetivoId, cuentaActiva });
  if (validacion.error) {
    return { error: validacion.error };
  }

  const clienteDatos = supabaseAdmin ?? supabase;

  const { data: objetivo, error: errorLectura } = await clienteDatos
    .from("usuarios")
    .select("id, rol, correo_electronico, cuenta_activa")
    .eq("id", objetivoId)
    .maybeSingle();

  if (errorLectura || !objetivo) {
    return { error: "No se encontró el usuario seleccionado." };
  }

  const { data: actualizada, error: errorUpdate } = await clienteDatos
    .from("usuarios")
    .update({ cuenta_activa: cuentaActiva })
    .eq("id", objetivoId)
    .select("id, cuenta_activa")
    .maybeSingle();

  if (errorUpdate || !actualizada) {
    return {
      error:
        errorUpdate?.message ??
        "No se pudo actualizar el estado de la cuenta. Verificá las políticas o permisos del servidor.",
    };
  }

  if (supabaseAdmin?.auth?.admin && !esFichaRepresentado(objetivo)) {
    const { error: errorAuth } = await supabaseAdmin.auth.admin.updateUserById(objetivoId, {
      ban_duration: cuentaActiva ? "none" : "876000h",
    });
    if (errorAuth && errorAuth.code !== "user_not_found") {
      console.error("Advertencia al sincronizar bloqueo en Supabase Auth:", errorAuth.message);
    }
  }

  return { exito: true, cuenta_activa: actualizada.cuenta_activa };
}

/** Reglas de la eliminación definitiva: nunca cuentas de administrador ni la propia. */
export function validarEliminacionUsuario({ admin, objetivo, objetivoId }) {
  if (!admin || admin.rol !== "administrador" || !admin.cuenta_activa) {
    return { error: "Solo un administrador activo puede eliminar cuentas de usuarios." };
  }
  if (typeof objetivoId !== "string" || !PATRON_UUID.test(objetivoId)) {
    return { error: "Identificador de usuario inválido." };
  }
  if (admin.id === objetivoId) {
    return { error: "No podés eliminar tu propia cuenta." };
  }
  if (!objetivo) {
    return { error: "No se encontró el usuario seleccionado." };
  }
  if (objetivo.rol === "administrador") {
    return { error: "Las cuentas de administrador no se pueden eliminar desde el panel." };
  }
  return { ok: true };
}

/**
 * Elimina definitivamente una cuenta de candidato, club o representante (CU-04 / RF-04).
 *
 * El borrado baja en cascada: perfil, ofertas, postulaciones, seguimiento, cartera y
 * suscripción del usuario se eliminan con él. Las fichas de cartera no tienen login,
 * así que se borran de `usuarios`; el resto se borra de Supabase Auth, que arrastra
 * la fila de `usuarios` por la clave foránea en cascada.
 */
export async function eliminarUsuarioComoAdmin({ supabase, supabaseAdmin = null, objetivoId }) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Iniciá sesión como administrador para continuar." };
  }

  const { data: admin } = await supabase
    .from("usuarios")
    .select("id, rol, cuenta_activa")
    .eq("id", user.id)
    .maybeSingle();

  if (!supabaseAdmin) {
    return {
      error:
        "La eliminación necesita la clave de servicio de Supabase (SUPABASE_SERVICE_ROLE_KEY) configurada en el servidor.",
    };
  }

  const { data: objetivo } = await supabaseAdmin
    .from("usuarios")
    .select("id, rol, nombre_completo, correo_electronico")
    .eq("id", objetivoId)
    .maybeSingle();

  const validacion = validarEliminacionUsuario({ admin, objetivo, objetivoId });
  if (validacion.error) {
    return { error: validacion.error };
  }

  if (esFichaRepresentado(objetivo)) {
    const { error: errorFicha } = await supabaseAdmin
      .from("usuarios")
      .delete()
      .eq("id", objetivoId);

    if (errorFicha) {
      return { error: errorFicha.message ?? "No se pudo eliminar la ficha de cartera." };
    }

    return { exito: true, nombre: objetivo.nombre_completo };
  }

  const { error: errorAuth } = await supabaseAdmin.auth.admin.deleteUser(objetivoId);

  if (errorAuth && errorAuth.code !== "user_not_found") {
    return { error: errorAuth.message ?? "No se pudo eliminar la cuenta." };
  }

  // Si la cuenta ya no existía en Auth, la fila de `usuarios` puede haber quedado suelta.
  const { error: errorFila } = await supabaseAdmin.from("usuarios").delete().eq("id", objetivoId);

  if (errorFila) {
    return { error: errorFila.message ?? "No se pudo eliminar la cuenta." };
  }

  return { exito: true, nombre: objetivo.nombre_completo };
}
