export const LONGITUD_MINIMA_CONTRASENA = 6;
export const LONGITUD_MAXIMA_CONTRASENA = 128;

export const MENSAJE_ENVIO_RECUPERACION =
  "Si existe una cuenta asociada a ese correo electrónico, te enviamos un enlace para restablecer tu contraseña. Revisá tu bandeja de entrada y la carpeta de spam.";

const PATRON_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validarSolicitudRecuperacion(correoRaw) {
  const correo = String(correoRaw ?? "").trim().toLowerCase();
  if (!correo) {
    return { error: "Ingresá tu correo electrónico." };
  }
  if (correo.length > 254 || !PATRON_CORREO.test(correo)) {
    return { error: "Ingresá un correo electrónico válido." };
  }
  return { correo };
}

export function normalizarRutaSiguiente(rutaRaw, rutaPorDefecto = "/restablecer-contrasena") {
  const ruta = String(rutaRaw ?? "").trim();
  if (!ruta || !ruta.startsWith("/") || ruta.startsWith("//") || ruta.includes("\\")) {
    return rutaPorDefecto;
  }
  return ruta;
}

export function construirUrlRedireccionRecuperacion(origenRaw) {
  let base = "http://localhost:3000";
  const candidato = String(origenRaw ?? "").trim();
  if (candidato) {
    try {
      const url = new URL(candidato);
      if (url.protocol === "http:" || url.protocol === "https:") {
        base = url.origin;
      }
    } catch {
      // Mantiene localhost como respaldo seguro en desarrollo.
    }
  }
  return `${base}/auth/confirmar?next=/restablecer-contrasena`;
}

export function validarNuevaContrasena({ contrasena, confirmarContrasena }) {
  const clave = String(contrasena ?? "");
  const confirmacion = String(confirmarContrasena ?? "");

  if (!clave || !confirmacion) {
    return { error: "Completá y confirmá tu nueva contraseña." };
  }
  if (clave.length < LONGITUD_MINIMA_CONTRASENA) {
    return {
      error: `La nueva contraseña debe tener al menos ${LONGITUD_MINIMA_CONTRASENA} caracteres.`,
    };
  }
  if (clave.length > LONGITUD_MAXIMA_CONTRASENA) {
    return {
      error: `La contraseña no puede superar los ${LONGITUD_MAXIMA_CONTRASENA} caracteres.`,
    };
  }
  if (clave !== confirmacion) {
    return { error: "Las contraseñas ingresadas no coinciden." };
  }
  return { contrasena: clave };
}

/**
 * Envía el correo de recuperación (CU-03 / RF-03) evitando enumeración de usuarios:
 * tanto si la cuenta existe como si no existe (o es una ficha @cfa.local), responde el mismo aviso neutro.
 */
export async function procesarSolicitudRecuperacion({
  supabase,
  correoElectronico,
  redirectTo,
}) {
  const validacion = validarSolicitudRecuperacion(correoElectronico);
  if (validacion.error) {
    return { error: validacion.error };
  }

  const { correo } = validacion;

  // Las fichas de representados (@cfa.local) no poseen credencial en Supabase Auth.
  if (correo.endsWith("@cfa.local")) {
    return { exito: true, mensaje: MENSAJE_ENVIO_RECUPERACION };
  }

  const { error } = await supabase.auth.resetPasswordForEmail(correo, {
    redirectTo,
  });

  if (error) {
    const esLimiteTasa =
      error.status === 429 ||
      error.code === "over_request_rate_limit" ||
      error.code === "over_email_send_rate_limit";

    if (esLimiteTasa) {
      return {
        error:
          "Se enviaron demasiadas solicitudes seguidas. Esperá unos minutos antes de volver a intentar.",
      };
    }

    if (error.status && error.status >= 500) {
      return {
        error:
          "No se pudo procesar la solicitud por un problema temporal del servicio. Intentá nuevamente en unos minutos.",
      };
    }
  }

  return { exito: true, mensaje: MENSAJE_ENVIO_RECUPERACION };
}

/**
 * Actualiza la contraseña del usuario autenticado mediante el enlace de recuperación (CU-03 / RF-03).
 */
export async function procesarActualizacionContrasena({
  supabase,
  contrasena,
  confirmarContrasena,
}) {
  const validacion = validarNuevaContrasena({ contrasena, confirmarContrasena });
  if (validacion.error) {
    return { error: validacion.error };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      error: "Tu enlace de recuperación venció o no es válido. Solicitá uno nuevo.",
    };
  }

  const { data: usuario } = await supabase
    .from("usuarios")
    .select("id, cuenta_activa")
    .eq("id", user.id)
    .maybeSingle();

  if (usuario && !usuario.cuenta_activa) {
    await supabase.auth.signOut();
    return { error: "Esta cuenta está suspendida. Contactá al administrador." };
  }

  const { error } = await supabase.auth.updateUser({
    password: validacion.contrasena,
  });

  if (error) {
    if (error.code === "same_password") {
      return { error: "La nueva contraseña debe ser diferente a la contraseña actual." };
    }
    if (error.code === "weak_password") {
      return { error: "Elegí una contraseña más segura (mínimo 6 caracteres)." };
    }
    return {
      error: "No se pudo actualizar la contraseña. Solicitá un nuevo enlace e intentá otra vez.",
    };
  }

  await supabase.auth.signOut();
  return { exito: true };
}
