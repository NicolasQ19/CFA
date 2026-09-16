"use server";

import { redirect } from "next/navigation";
import { crearClienteServidor } from "@/lib/supabase/cliente-servidor";
import { crearClienteAdmin } from "@/lib/supabase/cliente-admin";

const ROLES_AUTORREGISTRABLES = ["candidato", "representante", "club"];

/**
 * RF-01: registra un usuario nuevo eligiendo un rol (Candidato, Representante o Club)
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

/** RF-02: inicio de sesión con correo y contraseña a través de Supabase Auth. */
export async function iniciarSesion(_estadoPrevio, datosFormulario) {
  const correoElectronico = String(datosFormulario.get("correoElectronico") ?? "").trim();
  const contrasena = String(datosFormulario.get("contrasena") ?? "");

  const supabase = await crearClienteServidor();

  const { data, error } = await supabase.auth.signInWithPassword({
    email: correoElectronico,
    password: contrasena,
  });

  if (error || !data.user) {
    return { error: "Correo o contraseña incorrectos." };
  }

  const { data: usuario } = await supabase
    .from("usuarios")
    .select("rol")
    .eq("id", data.user.id)
    .single();

  redirect(destinoSegunRol(usuario?.rol ?? "candidato"));
}

/** RF-02: cierre de sesión. */
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