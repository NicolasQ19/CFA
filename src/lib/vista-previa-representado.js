/** Construye la vista pública con los datos del formulario, sin persistir cambios. */
export function prepararVistaPreviaRepresentado(formulario, perfilActual = null) {
  const texto = campo => String(formulario.get(campo) ?? "").trim();
  const nombres = texto("nombres") || texto("nombreCompleto");
  const apellidos = texto("apellidos");
  const campos = {
    puesto: "puesto", provincia: "provincia", club_actual: "clubActual",
    posicion_juego: "posicionJuego", pierna_habil: "piernaHabil",
    altura_cm: "alturaCm", peso_kg: "pesoKg", trayectoria: "trayectoria",
    titulo_o_matricula: "tituloOMatricula", licencia: "licencia",
    anios_experiencia: "aniosExperiencia", especialidad: "especialidad",
    fecha_nacimiento: "fechaNacimiento",
  };
  const perfil = { ...perfilActual, nombres, apellidos: apellidos || null };
  for (const [columna, campo] of Object.entries(campos)) perfil[columna] = texto(campo) || null;
  perfil.enlaces_video = [...new Set([1, 2, 3].map(n => texto(`video${n}`)).filter(Boolean))];
  if (formulario.get("quitarFoto") === "on") perfil.foto_url = null;
  if (formulario.get("quitarCv") === "on") perfil.cv_ruta = null;
  return { perfil, nombreCandidato: [nombres, apellidos].filter(Boolean).join(" ") || "Candidato" };
}
