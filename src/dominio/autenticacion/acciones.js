"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { crearClienteServidor } from "@/lib/supabase/cliente-servidor";
import { crearClienteAdmin } from "@/lib/supabase/cliente-admin";
import {
  construirUrlRedireccionRecuperacion,
  procesarActualizacionContrasena,
  procesarSolicitudRecuperacion,
} from "@/lib/recuperar-contrasena";

const ROLES_AUTORREGISTRABLES = ["candidato", "representante", "club"];

/**
 * Registra un usuario nuevo eligiendo un rol (Candidato, Representante o Club)
 * y crea su fila espejo en la tabla `usuarios`.
 */
export async function registrarUsuario(_estadoPrevio, datosFormulario) {
  const nombreCompleto = String(datosFormulario.get("nombreCompleto") ?? "").trim();
  const correoElectronico = String(datosFormulario.get("correoElectronico") ?? "").trim();
  const contrasena = String(datosFormulario.get("contrasena") ?? "");
  const rol = String(datosFormulario.get("rol") ?? "");

  if (!nombreCompleto || !correoElectronico || !contrasena || !rol) {
    return { error: "Completá todos los campos obligatorios." };
  }

  if (!ROLES_AUTORREGISTRABLES.includes(rol)) {
    return { error: "Rol inválido." };
  }

  return crearCuenta({ nombreCompleto, correoElectronico, contrasena, rol });
}

/**
 * Registro de administradores: solo accesible desde /admin/registrarse.
 */
export async function registrarAdministrador(_estadoPrevio, datosFormulario) {
  const claveSecreta = String(datosFormulario.get("claveSecreta") ?? "");
  const claveEsperada = process.env.ADMIN_REGISTRO_SECRETO;

  if (!claveEsperada || claveSecreta !== claveEsperada) {
    return { error: "No autorizado." };
  }

  const nombreCompleto = String(datosFormulario.get("nombreCompleto") ?? "").trim();
  const correoElectronico = String(datosFormulario.get("correoElectronico") ?? "").trim();
  const contrasena = String(datosFormulario.get("contrasena") ?? "");

  if (!nombreCompleto || !correoElectronico || !contrasena) {
    return { error: "Completá todos los campos obligatorios." };
  }

  const supabaseAdmin = crearClienteAdmin();

  const { data: datosRegistro, error: errorRegistro } = await supabaseAdmin.auth.admin.createUser({
    email: correoElectronico,
    password: contrasena,
    email_confirm: true,
  });

  if (errorRegistro || !datosRegistro.user) {
    return { error: errorRegistro?.message ?? "No se pudo crear la cuenta." };
  }

  const { error: errorPerfil } = await supabaseAdmin.from("usuarios").insert({
    id: datosRegistro.user.id,
    rol: "administrador",
    nombre_completo: nombreCompleto,
    correo_electronico: correoElectronico,
  });

  if (errorPerfil) {
    return { error: errorPerfil.message };
  }

  const supabase = await crearClienteServidor();
  await supabase.auth.signInWithPassword({ email: correoElectronico, password: contrasena });

  redirect(destinoSegunRol("administrador"));
}

async function crearCuenta(datos) {
  const supabase = await crearClienteServidor();

  const { data: datosRegistro, error: errorRegistro } = await supabase.auth.signUp({
    email: datos.correoElectronico,
    password: datos.contrasena,
  });

  if (errorRegistro || !datosRegistro.user) {
    return { error: errorRegistro?.message ?? "No se pudo crear la cuenta." };
  }

  const { error: errorPerfil } = await supabase.from("usuarios").insert({
    id: datosRegistro.user.id,
    rol: datos.rol,
    nombre_completo: datos.nombreCompleto,
    correo_electronico: datos.correoElectronico,
  });

  if (errorPerfil) {
    return { error: errorPerfil.message };
  }

  redirect(destinoSegunRol(datos.rol));
}

/*Inicio de sesión con correo y contraseña a través de Supabase Auth. */
export async function iniciarSesion(_estadoPrevio, datosFormulario) {
  const correoElectronico = String(datosFormulario.get("correoElectronico") ?? "").trim();
  const contrasena = String(datosFormulario.get("contrasena") ?? "");

  const supabase = await crearClienteServidor();

  const { data, error } = await supabase.auth.signInWithPassword({
    email: correoElectronico,
    password: contrasena,
  });

  if (error) {
    const mensajes = {
      invalid_credentials: "Correo o contraseña incorrectos.",
      email_not_confirmed: "Confirmá tu correo electrónico desde el enlace que recibiste antes de iniciar sesión.",
      user_banned: "Esta cuenta está suspendida. Contactá al administrador.",
      over_request_rate_limit: "Hubo demasiados intentos. Esperá unos minutos y volvé a intentar.",
    };

    // Registrar solo el diagnóstico técnico, nunca las credenciales ni la sesión.
    console.error("Error al iniciar sesión", { codigo: error.code, estado: error.status });

    return {
      error: mensajes[error.code] ?? (error.status === 429
        ? "Hubo demasiados intentos. Esperá unos minutos y volvé a intentar."
        : "No se pudo iniciar sesión por un problema del servicio. Volvé a intentar en unos minutos."),
    };
  }

  if (!data.user) {
    return { error: "No se pudo completar el inicio de sesión. Volvé a intentar." };
  }

  const { data: usuario } = await supabase
    .from("usuarios")
    .select("rol, cuenta_activa")
    .eq("id", data.user.id)
    .single();

  if (usuario && !usuario.cuenta_activa) {
    await supabase.auth.signOut();
    return { error: "Esta cuenta está suspendida. Contactá al administrador." };
  }

  redirect(destinoSegunRol(usuario?.rol ?? "candidato"));
}

/** CU-03 / RF-03: solicita envío de correo para restablecer contraseña sin exponer existencia de cuentas. */
export async function solicitarRecuperacionContrasena(_estadoPrevio, datosFormulario) {
  const correoElectronico = String(datosFormulario.get("correoElectronico") ?? "");
  const cabeceras = await headers();
  const origenCabecera =
    process.env.NEXT_PUBLIC_SITE_URL ||
    cabeceras.get("origin") ||
    (cabeceras.get("host")
      ? `${cabeceras.get("x-forwarded-proto") || "http"}://${cabeceras.get("host")}`
      : "http://localhost:3000");

  const redirectTo = construirUrlRedireccionRecuperacion(origenCabecera);
  const supabase = await crearClienteServidor();

  return procesarSolicitudRecuperacion({
    supabase,
    correoElectronico,
    redirectTo,
  });
}

/** CU-03 / RF-03: guarda la nueva contraseña para la sesión iniciada desde el enlace de recuperación. */
export async function actualizarContrasenaRecuperada(_estadoPrevio, datosFormulario) {
  const contrasena = String(datosFormulario.get("contrasena") ?? "");
  const confirmarContrasena = String(datosFormulario.get("confirmarContrasena") ?? "");

  const supabase = await crearClienteServidor();
  const resultado = await procesarActualizacionContrasena({
    supabase,
    contrasena,
    confirmarContrasena,
  });

  if (resultado.error) {
    return { error: resultado.error };
  }

  redirect("/iniciar-sesion?restablecida=1");
}

/*Cierre de sesión. */
export async function cerrarSesion() {
  const supabase = await crearClienteServidor();
  await supabase.auth.signOut();
  redirect("/iniciar-sesion");
}

function destinoSegunRol(rol) {
  switch (rol) {
    case "candidato":
      return "/ofertas";
    case "representante":
      return "/mi-cartera";
    case "club":
      return "/mis-ofertas";
    case "administrador":
      return "/admin";
    default:
      return "/";
  }
}
