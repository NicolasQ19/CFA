/** Indicador orientativo; teléfono o correo cubren la misma sección de contacto. */
export function completitudRepresentante(perfil = {}) {
  const tieneTexto = (valor) => typeof valor === "string" && valor.trim().length > 0;
  const secciones = [
    { id: "nombreAgencia", etiqueta: "Nombre de agencia", completo: tieneTexto(perfil.nombre_agencia) },
    { id: "foto", etiqueta: "Foto o logo", completo: tieneTexto(perfil.foto_url) },
    { id: "presentacion", etiqueta: "Presentación", completo: tieneTexto(perfil.presentacion) },
    { id: "especializacion", etiqueta: "Especialización", completo: tieneTexto(perfil.especializacion) },
    { id: "zonaTrabajo", etiqueta: "Zona de trabajo", completo: tieneTexto(perfil.zona_trabajo) },
    { id: "telefono", etiqueta: "Teléfono o correo de contacto", completo: tieneTexto(perfil.telefono) || tieneTexto(perfil.correo_contacto) },
    { id: "nacionalidad", etiqueta: "País de radicación", completo: tieneTexto(perfil.nacionalidad) },
    { id: "sitioWeb", etiqueta: "Sitio web o redes", completo: tieneTexto(perfil.sitio_web) },
  ];
  const completos = secciones.filter((seccion) => seccion.completo).length;
  return { secciones, completos, total: secciones.length, porcentaje: Math.round(completos / secciones.length * 100) };
}

/** Valida los campos profesionales opcionales antes de subir archivos o guardar. */
export function validarPresentacionRepresentante(formulario) {
  const campos = {
    presentacion: ["presentacion", "La presentación", 2000],
    especializacion: ["especializacion", "La especialización", 300],
    zona_trabajo: ["zonaTrabajo", "La zona de trabajo", 300],
  };
  const datos = {};
  for (const [columna, [campo, etiqueta, limite]] of Object.entries(campos)) {
    const valor = String(formulario.get(campo) ?? "").trim();
    if (valor.length > limite) {
      return { error: `${etiqueta} no puede tener más de ${limite} caracteres.` };
    }
    datos[columna] = valor || null;
  }
  return { datos };
}
