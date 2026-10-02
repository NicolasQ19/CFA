export const DISPONIBILIDADES = {
  disponible: "Disponible para recibir ofertas",
  escucho_ofertas: "Escucho propuestas",
  no_disponible: "No disponible por el momento",
};
export const SITUACIONES = { con_club: "Con club", sin_club: "Sin club" };

export function validarMejorasPerfil(formulario) {
  const texto = (clave) => String(formulario.get(clave) ?? "").trim();
  const presentacion = texto("presentacion");
  const disponibilidad = texto("disponibilidad");
  const situacion_club = texto("situacionClub");
  const incorporacion_desde = texto("incorporacionDesde");
  const mudanza = texto("dispuestoMudarse");
  if (presentacion.length > 600) return { error: "La presentación admite hasta 600 caracteres." };
  if (disponibilidad && !Object.hasOwn(DISPONIBILIDADES, disponibilidad)) return { error: "Seleccioná una disponibilidad válida." };
  if (situacion_club && !Object.hasOwn(SITUACIONES, situacion_club)) return { error: "Seleccioná una situación de club válida." };
  if (!["", "si", "no"].includes(mudanza)) return { error: "Seleccioná una opción de mudanza válida." };
  if (incorporacion_desde && (!/^\d{4}-\d{2}-\d{2}$/.test(incorporacion_desde) || !Number.isFinite(Date.parse(incorporacion_desde)) || new Date(incorporacion_desde).toISOString().slice(0, 10) !== incorporacion_desde)) return { error: "Ingresá una fecha de incorporación válida." };
  let experiencias;
  try { experiencias = JSON.parse(texto("experiencias") || "[]"); } catch { return { error: "No se pudo leer la trayectoria." }; }
  if (!Array.isArray(experiencias) || experiencias.length > 20) return { error: "Podés agregar hasta 20 experiencias." };
  const limpias = [];
  for (const item of experiencias) {
    if (!item || typeof item !== "object") return { error: "Revisá los datos de la experiencia." };
    const experiencia = Object.fromEntries(["club", "categoria", "temporada", "descripcion"].map(k => [k, typeof item[k] === "string" ? item[k].trim() : ""]));
    if (!Object.values(experiencia).some(Boolean)) continue;
    if (!experiencia.club || !experiencia.categoria || !experiencia.temporada) return { error: "Completá club, categoría y temporada de cada experiencia, o quitá la fila." };
    if (experiencia.club.length > 120 || experiencia.categoria.length > 100 || experiencia.temporada.length > 40 || experiencia.descripcion.length > 600) return { error: "Una experiencia supera la longitud permitida." };
    limpias.push(experiencia);
  }
  return { datos: { presentacion: presentacion || null, disponibilidad: disponibilidad || null, situacion_club: situacion_club || null, incorporacion_desde: incorporacion_desde || null, dispuesto_mudarse: mudanza ? mudanza === "si" : null, experiencias: limpias } };
}

export function completitudPerfil(perfil) {
  const criterios = [
    ["Foto", Boolean(perfil.foto_url)],
    ["Puesto y provincia", Boolean(perfil.puesto && perfil.provincia)],
    ["Presentación", Boolean(perfil.presentacion?.trim())],
    ["Disponibilidad", Boolean(perfil.disponibilidad)],
    ["Trayectoria", Boolean(perfil.trayectoria?.trim() || perfil.experiencias?.some(e => e.club?.trim() && e.categoria?.trim() && e.temporada?.trim()))],
    ["CV o videos", Boolean(perfil.cv_ruta || perfil.enlaces_video?.some(Boolean))],
  ];
  return { porcentaje: Math.round(criterios.filter(([, listo]) => listo).length / criterios.length * 100), faltantes: criterios.filter(([, listo]) => !listo).map(([nombre]) => nombre) };
}
