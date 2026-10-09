import { crearClienteServidor } from "@/lib/supabase/cliente-servidor";

/** Lectura pública con campos explícitos y solo de representantes activos. */
export async function obtenerPerfilPublicoRepresentante(usuarioId) {
  const supabase = await crearClienteServidor();
  const { data, error } = await supabase.rpc("obtener_perfil_publico_representante", { p_representante_id: usuarioId });
  if (error) {
    console.error("Error al leer perfil público del representante:", error.code);
    throw new Error("No se pudo cargar el perfil público del representante.");
  }
  return data?.[0] ?? null;
}

/** Devuelve el perfil de la agencia o representante (o null si no existe) */
export async function obtenerPerfilRepresentante(usuarioId) {
  const supabase = await crearClienteServidor();

  const { data } = await supabase
    .from("perfiles_representante")
    .select("*")
    .eq("usuario_id", usuarioId)
    .maybeSingle();

  return data;
}

/** Devuelve los candidatos actualmente en la cartera del representante */
export async function listarCarteraCandidatos(representanteId) {
  const supabase = await crearClienteServidor();

  // 1. Probar RPC con SECURITY DEFINER (garantiza acceso al nombre_completo de usuarios)
  const { data: dataRpc, error: errorRpc } = await supabase.rpc("listar_cartera_representante");
  if (!errorRpc && Array.isArray(dataRpc)) {
    return dataRpc.map((fila) => ({
      candidato_id: fila.candidato_id,
      agregado_el: fila.creado_en,
      nombre: fila.nombre_completo,
      perfil: {
        usuario_id: fila.candidato_id,
        nombres: fila.nombres,
        apellidos: fila.apellidos,
        fecha_nacimiento: fila.fecha_nacimiento,
        puesto: fila.puesto,
        provincia: fila.provincia,
        club_actual: fila.club_actual,
        foto_url: fila.foto_url,
        cv_ruta: fila.cv_ruta,
        posicion_juego: fila.posicion_juego,
        pierna_habil: fila.pierna_habil,
        altura_cm: fila.altura_cm,
        peso_kg: fila.peso_kg,
        trayectoria: fila.trayectoria,
        titulo_o_matricula: fila.titulo_o_matricula,
        licencia: fila.licencia,
        anios_experiencia: fila.anios_experiencia,
        especialidad: fila.especialidad,
        enlaces_video: fila.enlaces_video ?? [],
      },
      usuario: {
        nombre_completo: fila.nombre_completo,
      },
    }));
  }

  // 2. Fallback relacional estándar
  const { data, error } = await supabase
    .from("candidatos_representados")
    .select(`
      candidato_id,
      creado_en,
      perfiles_candidato (
        usuario_id,
        nombres,
        apellidos,
        fecha_nacimiento,
        puesto,
        provincia,
        club_actual,
        foto_url,
        cv_ruta,
        posicion_juego,
        pierna_habil,
        altura_cm,
        peso_kg,
        trayectoria,
        titulo_o_matricula,
        licencia,
        anios_experiencia,
        especialidad,
        enlaces_video,
        usuarios (nombre_completo, correo_electronico)
      )
    `)
    .eq("representante_id", representanteId)
    .order("creado_en", { ascending: false });

  if (error) {
    console.error("Error al listar cartera:", error.message);
    return [];
  }

  return (
    data?.map((fila) => ({
      candidato_id: fila.candidato_id,
      agregado_el: fila.creado_en,
      perfil: fila.perfiles_candidato,
      nombre: fila.perfiles_candidato?.usuarios?.nombre_completo,
      usuario: fila.perfiles_candidato?.usuarios,
    })) ?? []
  );
}

/** Devuelve la ficha completa de un candidato representado para editarlo */
export async function obtenerCandidatoRepresentado(candidatoId, representanteId) {
  const supabase = await crearClienteServidor();

  // Verificar pertenencia
  const { data: vinculo } = await supabase
    .from("candidatos_representados")
    .select("candidato_id")
    .eq("representante_id", representanteId)
    .eq("candidato_id", candidatoId)
    .maybeSingle();

  if (!vinculo) return null;

  const { data: perfil } = await supabase
    .from("perfiles_candidato")
    .select("*")
    .eq("usuario_id", candidatoId)
    .maybeSingle();

  const { data: usuario } = await supabase
    .from("usuarios")
    .select("nombre_completo, correo_electronico")
    .eq("id", candidatoId)
    .maybeSingle();

  return {
    ...perfil,
    nombre_completo: usuario?.nombre_completo ?? "",
  };
}

/**
 * Devuelve las postulaciones enviadas por este representante
 */
export async function listarPostulacionesDeRepresentante(representanteId) {
  const supabase = await crearClienteServidor();

  const { data, error } = await supabase
    .from("postulaciones")
    .select(`
      id,
      estado,
      creada_en,
      candidato_id,
      oferta_id,
      ofertas_laborales (
        id,
        estado,
        puesto_buscado,
        posicion_juego,
        categoria,
        provincia,
        tipo_contrato,
        perfiles_club (nombre_club, escudo_url)
      ),
      perfiles_candidato (
        puesto,
        posicion_juego,
        foto_url,
        usuarios (nombre_completo)
      )
    `)
    .eq("postulado_por_representante_id", representanteId)
    .order("creada_en", { ascending: false });

  if (error) {
    console.error("Error al listar postulaciones de representante:", error.message);
    return [];
  }

  return data ?? [];
}

