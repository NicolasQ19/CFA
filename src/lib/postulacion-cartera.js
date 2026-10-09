import { ETIQUETAS_PUESTO_PROFESIONAL } from "../tipos/dominio.js";

export function puestoCompatible(puestoCandidato, puestoOferta) {
  return Object.hasOwn(ETIQUETAS_PUESTO_PROFESIONAL, puestoOferta) && puestoCandidato === puestoOferta;
}

export function edadCandidato(fecha, hoy = new Date()) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha ?? "")) return null;
  const [anio, mes, dia] = fecha.split("-").map(Number);
  const nacimiento = new Date(anio, mes - 1, dia);
  if (nacimiento.getFullYear() !== anio || nacimiento.getMonth() !== mes - 1 || nacimiento.getDate() !== dia || nacimiento > hoy) return null;
  return hoy.getFullYear() - anio - (hoy.getMonth() + 1 < mes || (hoy.getMonth() + 1 === mes && hoy.getDate() < dia) ? 1 : 0);
}

export function validarDatosPersonalesRepresentado(formulario) {
  const nombres = String(formulario.get("nombres") ?? formulario.get("nombreCompleto") ?? "").trim();
  const apellidos = String(formulario.get("apellidos") ?? "").trim();
  const fecha = String(formulario.get("fechaNacimiento") ?? "").trim();
  if (!nombres || nombres.length > 150 || apellidos.length > 150) return { error: "Completá los nombres; nombres y apellidos admiten hasta 150 caracteres cada uno." };
  if (fecha && (edadCandidato(fecha) === null || edadCandidato(fecha) > 120)) return { error: "Ingresá una fecha de nacimiento válida, no futura y de hasta 120 años atrás." };
  return { datos: { nombres, apellidos: apellidos || null, fecha_nacimiento: fecha || null }, nombreCompleto: [nombres, apellidos].filter(Boolean).join(" ") };
}

export function filtrarCandidatosParaOferta(cartera, puestoOferta, idsPostulados = [], busqueda = "", opciones = {}, hoy = new Date()) {
  const normalizar = (texto) => String(texto ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es-AR").trim();
  const filtro = normalizar(busqueda);
  const postulados = new Set(idsPostulados);
  const nombreCompleto = (c) => c.nombre || c.usuario?.nombre_completo || "Talento";
  const limite = (valor) => valor === "" || valor == null ? null : Number(valor);
  const minima = limite(opciones.edadMinima);
  const maxima = limite(opciones.edadMaxima);
  const resultados = cartera.filter((candidato) => {
    const perfil = candidato.perfil ?? {};
    const edad = edadCandidato(perfil.fecha_nacimiento, hoy);
    // No inferir apellidos de nombres completos antiguos: pueden ser compuestos.
    const texto = opciones.buscarPor === "apellido" ? perfil.apellidos : opciones.buscarPor === "nombre" ? (perfil.nombres || nombreCompleto(candidato)) : nombreCompleto(candidato);
    return puestoCompatible(perfil.puesto, puestoOferta) && !postulados.has(candidato.candidato_id) &&
      normalizar(texto).includes(filtro) && (!opciones.provincia || perfil.provincia === opciones.provincia) &&
      (minima === null || (edad !== null && edad >= minima)) &&
      (maxima === null || (edad !== null && edad <= maxima));
  });
  const comparar = new Intl.Collator("es-AR", { sensitivity: "base", numeric: true }).compare;
  return resultados.sort((a, b) => {
    const orden = opciones.orden ?? "nombre_asc";
    if (orden.startsWith("edad_")) {
      const edadA = edadCandidato(a.perfil?.fecha_nacimiento, hoy);
      const edadB = edadCandidato(b.perfil?.fecha_nacimiento, hoy);
      if (edadA === null && edadB !== null) return 1;
      if (edadB === null && edadA !== null) return -1;
      if (edadA !== null && edadB !== null && edadA !== edadB) return orden === "edad_desc" ? edadB - edadA : edadA - edadB;
    }
    const apellido = orden.startsWith("apellido_");
    if (apellido) {
      if (!a.perfil?.apellidos && b.perfil?.apellidos) return 1;
      if (!b.perfil?.apellidos && a.perfil?.apellidos) return -1;
    }
    const resultado = comparar(apellido ? a.perfil?.apellidos ?? "" : nombreCompleto(a), apellido ? b.perfil?.apellidos ?? "" : nombreCompleto(b));
    return (orden.endsWith("desc") ? -resultado : resultado) || comparar(nombreCompleto(a), nombreCompleto(b)) || comparar(a.candidato_id, b.candidato_id);
  });
}
