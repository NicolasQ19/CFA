"use server";

import { redirect } from "next/navigation";
import { crearClienteServidor } from "@/lib/supabase/cliente-servidor";
import { crearClienteAdmin } from "@/lib/supabase/cliente-admin";
import type { RolUsuario } from "@/tipos/dominio";

export interface ResultadoAccion {
  error: string | null;
}

const ROLES_AUTORREGISTRABLES: RolUsuario[] = ["candidato", "representante", "club"];

/**
 * RF-01: registra un usuario nuevo eligiendo un rol (Candidato, Representante o Club)
 * y crea su fila espejo en la tabla `usuarios`.
 * El rol "administrador" está excluido a propósito: no es autorregistrable desde
 * este formulario público, solo a través de /admin/registrarse con la clave secreta
 * (ver `registrarAdministrador`).
 */
export async function registrarUsuario(
  _estadoPrevio: ResultadoAccion,
  datosFormulario: FormData
): Promise<ResultadoAccion> {
  const nombreCompleto = String(datosFormulario.get("nombreCompleto") ?? "").trim();
  const correoElectronico = String(datosFormulario.get("correoElectronico") ?? "").trim();
  const contrasena = String(datosFormulario.get("contrasena") ?? "");
  const rol = String(datosFormulario.get("rol") ?? "") as RolUsuario;

  if (!nombreCompleto || !correoElectronico || !contrasena || !rol) {
    return { error: "Completá todos los campos obligatorios." };
  }

  if (!ROLES_AUTORREGISTRABLES.includes(rol)) {
    return { error: "Rol inválido." };
  }

  return crearCuenta({ nombreCompleto, correoElectronico, contrasena, rol });
}

/**
 * Registro de administradores: solo accesible desde /admin/registrarse, una ruta
 * no enlazada desde ningún lado de la UI y protegida con una clave secreta que
 * se valida acá, del lado del servidor (nunca confiando en el formulario).
 */
export async function registrarAdministrador(
  _estadoPrevio: ResultadoAccion,
  datosFormulario: FormData
): Promise<ResultadoAccion> {
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

  // Usa la service_role key: crea el usuario ya confirmado (sin depender del
  // envío de email) y salta la RLS que bloquea insertar rol = 'administrador'
  // desde el cliente normal.
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

  // Inicia sesión con el cliente normal para dejar la cookie de sesión puesta.
  const supabase = await crearClienteServidor();
  await supabase.auth.signInWithPassword({ email: correoElectronico, password: contrasena });

  redirect(destinoSegunRol("administrador"));
}

async function crearCuenta(datos: {
  nombreCompleto: string;
  correoElectronico: string;
  contrasena: string;
  rol: RolUsuario;
}): Promise<ResultadoAccion> {
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
export async function iniciarSesion(
  _estadoPrevio: ResultadoAccion,
  datosFormulario: FormData
): Promise<ResultadoAccion> {
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

  redirect(destinoSegunRol((usuario?.rol as RolUsuario) ?? "candidato"));
}

/** RF-02: cierre de sesión. */
export async function cerrarSesion(): Promise<void> {
  const supabase = await crearClienteServidor();
  await supabase.auth.signOut();
  redirect("/iniciar-sesion");
}

function destinoSegunRol(rol: RolUsuario): string {
  switch (rol) {
    case "candidato":
      return "/ofertas";
    case "representante":
      return "/mi-cartera";
    case "club":
      return "/mis-ofertas";
    case "administrador":
      return "/admin";
  }
}
