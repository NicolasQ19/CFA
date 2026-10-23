/** La versión cambia cuando cambia el contenido o la fecha del aviso. */
export function claveAviso(aviso) {
  return JSON.stringify([aviso.id, aviso.fecha, aviso.mensaje]);
}

export function claveAlmacenLecturas(usuarioId, rol) {
  return `cfa:notificaciones-leidas:v1:${rol}:${usuarioId}`;
}

export function claveAlmacenEliminadas(usuarioId, rol) {
  return `cfa:notificaciones-eliminadas:v1:${rol}:${usuarioId}`;
}

export function eliminarAvisos(avisos, eliminadas) {
  return [...new Set([...eliminadas, ...avisos.map(claveAviso)])];
}

export function filtrarAvisosVigentes(avisos, eliminadas) {
  const descartadas = new Set(eliminadas);
  return avisos.filter(aviso => !descartadas.has(claveAviso(aviso)));
}

export function interpretarLecturas(texto) {
  try {
    const datos = JSON.parse(texto);
    return Array.isArray(datos) ? datos.filter(clave => typeof clave === "string") : [];
  } catch {
    return [];
  }
}

export function estaLeido(aviso, lecturas) {
  return lecturas.includes(claveAviso(aviso));
}

export function marcarAvisoLeido(aviso, lecturas) {
  return [...new Set([...lecturas, claveAviso(aviso)])];
}

export function contarSinLeer(avisos, lecturas) {
  const conocidas = new Set(lecturas);
  return avisos.reduce((total, aviso) => total + (conocidas.has(claveAviso(aviso)) ? 0 : 1), 0);
}

/** Evita el límite de filas de Supabase: el contador usa todas las versiones vigentes. */
export async function listarFilasNotificaciones(consulta) {
  const resultado = [];
  for (let desde = 0; ; desde += 500) {
    const { data, error } = await consulta().range(desde, desde + 499);
    if (error) throw error;
    resultado.push(...(data ?? []));
    if (!data || data.length < 500) return resultado;
  }
}
