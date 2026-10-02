export const ETAPAS_CLUB = { recibido: "Recibido", evaluacion: "En evaluación", contactado: "Contactado", seleccionado: "Seleccionado", descartado: "Descartado" };
export function etapaPostulante(estado, etapa) {
  return etapa ?? ({ postulado: "recibido", visto: "evaluacion", preseleccionado: "evaluacion", rechazado: "descartado", oferta_cerrada: "descartado" }[estado] ?? "recibido");
}
export function validarSeguimiento(etapa, notas) {
  if (!Object.hasOwn(ETAPAS_CLUB, etapa)) return "Seleccioná una etapa válida.";
  if (typeof notas !== "string" || notas.length > 3000) return "Las notas admiten hasta 3000 caracteres.";
  return null;
}
export function urlPublica(valor) {
  if (!valor) return null;
  try { const url = new URL(valor); return ["https:", "http:"].includes(url.protocol) && !url.username && !url.password ? url.href : null; } catch { return null; }
}
export function validarPerfilClub(formulario) {
  const campos = { nombre_club: ["nombreClub", 160], provincia: ["provincia", 100], categoria: ["categoria", 100], localidad: ["localidad", 120], descripcion: ["descripcion", 2000], instalaciones: ["instalaciones", 2000], sitio_web: ["sitioWeb", 500], instagram: ["instagram", 500], facebook: ["facebook", 500] };
  const datos = {};
  for (const [clave, [campo, limite]] of Object.entries(campos)) {
    const valor = String(formulario.get(campo) ?? "").trim();
    if (valor.length > limite) return { error: `El campo ${campo} supera los ${limite} caracteres.` };
    datos[clave] = valor || null;
  }
  if (!datos.nombre_club || !datos.provincia || !datos.categoria) return { error: "Completá nombre, provincia y categoría del club." };
  for (const campo of ["sitio_web", "instagram", "facebook"]) {
    if (datos[campo] && !urlPublica(datos[campo])) return { error: "Ingresá enlaces completos que comiencen con https:// o http://." };
  }
  return { datos };
}
export async function validarEscudo(archivo) {
  if (!(archivo instanceof File) || !archivo.size) return null;
  if (archivo.size > 2_000_000) return "El escudo no puede pesar más de 2 MB.";
  const bytes = new Uint8Array(await archivo.slice(0, 12).arrayBuffer());
  const texto = new TextDecoder().decode(bytes);
  const valido = archivo.type === "image/png" ? [137,80,78,71,13,10,26,10].every((v,i) => bytes[i] === v)
    : archivo.type === "image/jpeg" ? bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
    : archivo.type === "image/webp" ? texto.startsWith("RIFF") && texto.slice(8,12) === "WEBP" : false;
  return valido ? null : "El escudo debe ser una imagen JPG, PNG o WebP válida.";
}
export function resumirActividad(ofertas, postulaciones, seguimientos, ahora = Date.now()) {
  const etapas = new Map(seguimientos.map(s => [s.postulacion_id, s.etapa]));
  const ids = new Set(ofertas.map(o => o.id));
  const propias = postulaciones.filter(p => ids.has(p.oferta_id));
  return {
    activas: ofertas.filter(o => o.estado === "publicada").length,
    total: propias.length,
    nuevas: propias.filter(p => { const edad = ahora - Date.parse(p.creada_en); return edad >= 0 && edad <= 7 * 86400000; }).length,
    pendientes: propias.filter(p => etapaPostulante(p.estado, etapas.get(p.id)) === "recibido").length,
  };
}
