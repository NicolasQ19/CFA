
export const RUTAS_PROTEGIDAS = [
  { prefijo: "/admin", roles: ["administrador"] },
  { prefijo: "/buscar-candidatos", roles: ["club", "administrador"] },
  { prefijo: "/mi-cartera", roles: ["representante"] },
  { prefijo: "/mi-club", roles: ["club"] },
  { prefijo: "/mi-perfil", roles: ["candidato", "representante"] },
  { prefijo: "/mis-ofertas", roles: ["club"] },
  { prefijo: "/mis-postulaciones", roles: ["candidato"] },
  { prefijo: "/perfil-publico", roles: null },
];


// /admin/registrarse no puede exigir sesión de administrador: el primero se crea ahí, con la clave de alta.
const EXCEPCIONES_PUBLICAS = ["/perfil-publico-club", "/perfil-publico-representante", "/admin/registrarse"];


function coincide(ruta, prefijo) {
  return ruta === prefijo || ruta.startsWith(`${prefijo}/`);
}


export function obtenerReglaDeRuta(ruta) {
  if (typeof ruta !== "string" || !ruta.startsWith("/")) return null;
  if (EXCEPCIONES_PUBLICAS.some((excepcion) => coincide(ruta, excepcion))) return null;

  return RUTAS_PROTEGIDAS.find((regla) => coincide(ruta, regla.prefijo)) ?? null;
}


export function evaluarAcceso({ ruta, usuario }) {
  const regla = obtenerReglaDeRuta(ruta);
  if (!regla) return { permitido: true, motivo: null, destino: null };

  if (!usuario) {
    return { permitido: false, motivo: "sin-sesion", destino: "/iniciar-sesion" };
  }
  if (usuario.cuenta_activa === false) {
    return { permitido: false, motivo: "cuenta-inactiva", destino: "/" };
  }
  if (regla.roles && !regla.roles.includes(usuario.rol)) {
    return { permitido: false, motivo: "rol-no-habilitado", destino: null };
  }

  return { permitido: true, motivo: null, destino: null };
}

export function rolesHabilitados(ruta) {
  return obtenerReglaDeRuta(ruta)?.roles ?? null;
}
