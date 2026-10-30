/**
 * Tabla única de rutas con acceso restringido.
 *
 * El middleware aplica este mínimo en cada navegación: sesión iniciada, cuenta
 * activa y rol habilitado. Las reglas más finas (club verificado, ver el perfil
 * propio o uno ajeno, etc.) siguen en cada página, que las resuelve con los datos
 * que ya consultó. Así una página nueva nace protegida aunque olvide su guard.
 *
 * `roles: null` significa "cualquier rol, pero con sesión iniciada".
 */
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

/**
 * Rutas que se sirven dentro de un prefijo protegido pero son públicas.
 * `/perfil-publico-club` y `/perfil-publico-representante` muestran la ficha
 * pública cuando reciben `?id=`, así que no pueden exigir sesión por prefijo.
 */
const EXCEPCIONES_PUBLICAS = ["/perfil-publico-club", "/perfil-publico-representante"];

/** ¿La ruta cae dentro de un prefijo? Coincide exacto o como segmento (`/admin/usuarios`). */
function coincide(ruta, prefijo) {
  return ruta === prefijo || ruta.startsWith(`${prefijo}/`);
}

/**
 * Regla aplicable a una ruta, o `null` si es pública.
 * Devuelve `{ prefijo, roles }` con los roles habilitados (o `null` para cualquiera).
 */
export function obtenerReglaDeRuta(ruta) {
  if (typeof ruta !== "string" || !ruta.startsWith("/")) return null;
  if (EXCEPCIONES_PUBLICAS.some((excepcion) => coincide(ruta, excepcion))) return null;

  return RUTAS_PROTEGIDAS.find((regla) => coincide(ruta, regla.prefijo)) ?? null;
}

/** ¿Este usuario puede entrar a la ruta? Decide también a dónde mandarlo si no puede. */
export function evaluarAcceso({ ruta, usuario }) {
  const regla = obtenerReglaDeRuta(ruta);
  if (!regla) return { permitido: true, destino: null };

  if (!usuario) return { permitido: false, destino: "/iniciar-sesion" };
  if (usuario.cuenta_activa === false) return { permitido: false, destino: "/" };
  if (regla.roles && !regla.roles.includes(usuario.rol)) {
    return { permitido: false, destino: "/" };
  }

  return { permitido: true, destino: null };
}
