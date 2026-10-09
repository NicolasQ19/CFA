"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { crearClienteServidor } from "@/lib/supabase/cliente-servidor";
import { BUCKET_CV, validarCurriculum } from "@/lib/curriculum";
import { validarPresentacionRepresentante } from "@/lib/perfil-representante";
import { puestoCompatible, validarDatosPersonalesRepresentado } from "@/lib/postulacion-cartera";
import { retirarPostulacionDeCartera } from "@/lib/cancelar-postulacion";
import { urlPublica } from "@/lib/club";

const BUCKET_FOTOS = "fotos-perfil";
const TAMANIO_MAXIMO_FOTO = 2_000_000;
const EXTENSIONES_FOTO = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

function validarFoto(archivo) {
  if (!(archivo instanceof File) || archivo.size === 0) return null;
  const extension = EXTENSIONES_FOTO[archivo.type];
  if (!extension) {
    return "La foto tiene que ser JPG, PNG o WebP.";
  }
  if (archivo.size > TAMANIO_MAXIMO_FOTO) {
    return "La foto no puede pesar más de 2 MB.";
  }
  return null;
}

function normalizarUrl(url) {
  if (!url) return null;
  const limpia = url.trim();
  if (!limpia) return null;
  if (/^https?:\/\//i.test(limpia)) return limpia;
  return `https://${limpia}`;
}

/**
 * Guarda o actualiza los datos del perfil de representante:
 * identidad, contacto, presentación, especialización y zona de trabajo.
 */
export async function guardarPerfilRepresentante(_estadoPrevio, datosFormulario) {
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Tenés que iniciar sesión para editar tu perfil." };
  }

  const { data: usuario } = await supabase.from("usuarios")
    .select("rol, cuenta_activa").eq("id", user.id).maybeSingle();
  if (usuario?.rol !== "representante" || !usuario.cuenta_activa) {
    return { error: "Solo un representante con cuenta activa puede editar este perfil." };
  }

  const informacionProfesional = validarPresentacionRepresentante(datosFormulario);
  if (informacionProfesional.error) return { error: informacionProfesional.error };

  const nombreAgencia = String(datosFormulario.get("nombreAgencia") ?? "").trim();
  const telefono = String(datosFormulario.get("telefono") ?? "").trim() || null;
  const correoContacto = String(datosFormulario.get("correoContacto") ?? "").trim() || null;
  const nacionalidad = String(datosFormulario.get("nacionalidad") ?? "").trim() || null;
  const sitioWebBruto = String(datosFormulario.get("sitioWeb") ?? "").trim();
  const sitioWeb = normalizarUrl(sitioWebBruto);
  if (sitioWeb && !urlPublica(sitioWeb)) {
    return { error: "Ingresá un sitio web válido con http:// o https://, sin credenciales." };
  }
  if (correoContacto && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correoContacto)) {
    return { error: "Ingresá un correo de contacto válido." };
  }

  if (!nombreAgencia) {
    return { error: "El nombre de la agencia no puede estar vacío." };
  }

  if (telefono && telefono.length > 50) {
    return { error: "El teléfono no puede tener más de 50 caracteres." };
  }

  if (correoContacto && correoContacto.length > 150) {
    return { error: "El correo de contacto no puede tener más de 150 caracteres." };
  }

  const archivoFoto = datosFormulario.get("foto");
  const quitarFoto = datosFormulario.get("quitarFoto") === "on";
  const hayFoto = archivoFoto instanceof File && archivoFoto.size > 0;

  if (hayFoto && quitarFoto) {
    return { error: "Elegí subir una foto nueva o quitar la actual, no ambas." };
  }

  const errorFoto = validarFoto(archivoFoto);
  if (errorFoto) return { error: errorFoto };

  let nuevaFotoUrl;
  if (hayFoto) {
    const extension = EXTENSIONES_FOTO[archivoFoto.type];
    const ruta = `${user.id}/${Date.now()}.${extension}`;
    const { error: errorSubida } = await supabase.storage
      .from(BUCKET_FOTOS)
      .upload(ruta, archivoFoto, { contentType: archivoFoto.type, upsert: false });

    if (errorSubida) {
      console.error("Error al subir foto de representante:", errorSubida);
      return {
        error: `No se pudo subir la foto: ${errorSubida.message}. Asegurate de ejecutar la consulta SQL en Supabase para habilitar las políticas de subida.`,
      };
    }

    nuevaFotoUrl = supabase.storage.from(BUCKET_FOTOS).getPublicUrl(ruta).data.publicUrl;
  } else if (quitarFoto) {
    nuevaFotoUrl = null;
  }

  const camposActualizar = {
    usuario_id: user.id,
    nombre_agencia: nombreAgencia,
    telefono,
    correo_contacto: correoContacto,
    nacionalidad,
    sitio_web: sitioWeb,
    ...informacionProfesional.datos,
    actualizado_en: new Date().toISOString(),
  };

  if (nuevaFotoUrl !== undefined) {
    camposActualizar.foto_url = nuevaFotoUrl;
  }

  const { error } = await supabase.from("perfiles_representante").upsert(
    camposActualizar,
    { onConflict: "usuario_id" }
  );

  if (error) {
    console.error("Error al guardar perfil de representante:", error.code);
    return { error: "No se pudo guardar el perfil. Volvé a intentar en unos minutos." };
  }

  revalidatePath("/mi-cartera");
  revalidatePath("/mi-perfil");
  revalidatePath("/perfil-publico-representante");
  return { exito: true };
}

/**
 * Registra un nuevo candidato como representado directo de la agencia,
 * subiendo su foto (en la carpeta del representante) y su CV, vinculándolo
 * de forma atómica con su ficha deportiva.
 */
export async function crearCandidatoRepresentado(_estadoPrevio, datosFormulario) {
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Tenés que iniciar sesión como representante." };
  }

  const personales = validarDatosPersonalesRepresentado(datosFormulario);
  if (personales.error) return { error: personales.error };
  const { nombreCompleto } = personales;
  const puesto = String(datosFormulario.get("puesto") ?? "");
  const provincia = String(datosFormulario.get("provincia") ?? "").trim();
  const clubActual = String(datosFormulario.get("clubActual") ?? "").trim() || null;
  const posicionJuego = String(datosFormulario.get("posicionJuego") ?? "").trim() || null;
  const piernaHabil = String(datosFormulario.get("piernaHabil") ?? "").trim() || null;
  const alturaCm = datosFormulario.get("alturaCm") ? Number(datosFormulario.get("alturaCm")) : null;
  const pesoKg = datosFormulario.get("pesoKg") ? Number(datosFormulario.get("pesoKg")) : null;
  const trayectoria = String(datosFormulario.get("trayectoria") ?? "").trim() || null;

  const tituloOMatricula = String(datosFormulario.get("tituloOMatricula") ?? "").trim() || null;
  const licencia = String(datosFormulario.get("licencia") ?? "").trim() || null;
  const aniosExperiencia = datosFormulario.get("aniosExperiencia") ? Number(datosFormulario.get("aniosExperiencia")) : null;
  const especialidad = String(datosFormulario.get("especialidad") ?? "").trim() || null;

  const video1 = String(datosFormulario.get("video1") ?? "").trim();
  const video2 = String(datosFormulario.get("video2") ?? "").trim();
  const video3 = String(datosFormulario.get("video3") ?? "").trim();
  const enlacesVideo = [video1, video2, video3].filter(Boolean);

  if (!nombreCompleto || !puesto || !provincia) {
    return { error: "Completá todos los campos obligatorios (Nombre, puesto y provincia)." };
  }

  // Validar archivos antes de registrar
  const archivoFoto = datosFormulario.get("foto");
  const hayFoto = archivoFoto instanceof File && archivoFoto.size > 0;
  if (hayFoto) {
    const errorFoto = validarFoto(archivoFoto);
    if (errorFoto) return { error: errorFoto };
  }

  const archivoCv = datosFormulario.get("curriculum");
  const hayCv = archivoCv instanceof File && archivoCv.size > 0;
  if (hayCv) {
    const errorCv = await validarCurriculum(archivoCv);
    if (errorCv) return { error: errorCv };
  }

  // 1. Subir la foto primero (en la carpeta del representante)
  let fotoUrlSubida = null;
  if (hayFoto) {
    const extension = EXTENSIONES_FOTO[archivoFoto.type];
    const rutaFoto = `${user.id}/candidatos/${Date.now()}.${extension}`;
    const { error: errorFotoUpload } = await supabase.storage
      .from(BUCKET_FOTOS)
      .upload(rutaFoto, archivoFoto, { contentType: archivoFoto.type, upsert: false });

    if (errorFotoUpload) {
      console.error("Error al subir foto del candidato:", errorFotoUpload);
      return { error: `No se pudo subir la foto del candidato: ${errorFotoUpload.message}. Ejecutá el SQL en Supabase.` };
    }
    fotoUrlSubida = supabase.storage.from(BUCKET_FOTOS).getPublicUrl(rutaFoto).data.publicUrl;
  }

  // Asegurar que el perfil de representante exista
  await supabase.from("perfiles_representante").upsert(
    {
      usuario_id: user.id,
      actualizado_en: new Date().toISOString(),
    },
    { onConflict: "usuario_id" }
  );

  // 2. Crear candidato con foto_url inicial directamente en la base de datos
  const { data: nuevoCandidatoId, error } = await supabase.rpc("crear_candidato_representado_con_datos", {
    p_nombres: personales.datos.nombres,
    p_apellidos: personales.datos.apellidos,
    p_fecha_nacimiento: personales.datos.fecha_nacimiento,
    p_nombre_completo: nombreCompleto,
    p_puesto: puesto,
    p_provincia: provincia,
    p_club_actual: clubActual,
    p_posicion_juego: posicionJuego,
    p_pierna_habil: piernaHabil,
    p_altura_cm: alturaCm,
    p_peso_kg: pesoKg,
    p_trayectoria: trayectoria,
    p_titulo_o_matricula: tituloOMatricula,
    p_licencia: licencia,
    p_anios_experiencia: aniosExperiencia,
    p_especialidad: especialidad,
    p_enlaces_video: enlacesVideo,
    p_foto_url: fotoUrlSubida,
  });

  if (error || !nuevoCandidatoId) {
    return { error: error?.message ?? "No se pudo registrar al candidato." };
  }

  // 3. Subir CV si se proporcionó
  let cvRutaSubida = null;
  if (hayCv) {
    const rutaCv = `${nuevoCandidatoId}/${crypto.randomUUID()}.pdf`;
    const { error: errorCvUpload } = await supabase.storage
      .from(BUCKET_CV)
      .upload(rutaCv, archivoCv, { contentType: "application/pdf", upsert: false });

    if (!errorCvUpload) {
      cvRutaSubida = rutaCv;
      await supabase
        .from("perfiles_candidato")
        .update({ cv_ruta: cvRutaSubida })
        .eq("usuario_id", nuevoCandidatoId);
    } else {
      console.warn("No se pudo subir el CV del candidato:", errorCvUpload.message);
    }
  }

  revalidatePath("/mi-cartera");
  redirect("/mi-cartera");
}

/**
 * Elimina a un representado de la cartera de la agencia.
 */
export async function eliminarRepresentado(candidatoId) {
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Tenés que iniciar sesión como representante." };
  }

  // Obtener perfil para limpiar archivos de storage
  const { data: perfil } = await supabase
    .from("perfiles_candidato")
    .select("foto_url, cv_ruta")
    .eq("usuario_id", candidatoId)
    .maybeSingle();

  const { error } = await supabase.rpc("eliminar_candidato_representado", {
    p_candidato_id: candidatoId,
  });

  if (error) {
    return { error: error.message };
  }

  // Limpiar CV de storage si existía
  if (perfil?.cv_ruta) {
    await supabase.storage.from(BUCKET_CV).remove([perfil.cv_ruta]);
  }

  revalidatePath("/mi-cartera");
  return { exito: true };
}

/**
 * Actualiza los datos de un candidato representado (ficha, foto y CV).
 */
export async function actualizarCandidatoRepresentado(candidatoId, _estadoPrevio, datosFormulario) {
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Tenés que iniciar sesión como representante." };
  }

  // 1. Validar campos de texto obligatorios
  const personales = validarDatosPersonalesRepresentado(datosFormulario);
  if (personales.error) return { error: personales.error };
  const { nombreCompleto } = personales;
  const puesto = String(datosFormulario.get("puesto") ?? "");
  const provincia = String(datosFormulario.get("provincia") ?? "").trim();
  const clubActual = String(datosFormulario.get("clubActual") ?? "").trim() || null;
  const posicionJuego = String(datosFormulario.get("posicionJuego") ?? "").trim() || null;
  const piernaHabil = String(datosFormulario.get("piernaHabil") ?? "").trim() || null;
  const alturaCm = datosFormulario.get("alturaCm") ? Number(datosFormulario.get("alturaCm")) : null;
  const pesoKg = datosFormulario.get("pesoKg") ? Number(datosFormulario.get("pesoKg")) : null;
  const trayectoria = String(datosFormulario.get("trayectoria") ?? "").trim() || null;

  const tituloOMatricula = String(datosFormulario.get("tituloOMatricula") ?? "").trim() || null;
  const licencia = String(datosFormulario.get("licencia") ?? "").trim() || null;
  const aniosExperiencia = datosFormulario.get("aniosExperiencia") ? Number(datosFormulario.get("aniosExperiencia")) : null;
  const especialidad = String(datosFormulario.get("especialidad") ?? "").trim() || null;

  const video1 = String(datosFormulario.get("video1") ?? "").trim();
  const video2 = String(datosFormulario.get("video2") ?? "").trim();
  const video3 = String(datosFormulario.get("video3") ?? "").trim();
  const enlacesVideo = [video1, video2, video3].filter(Boolean);

  if (!nombreCompleto || !puesto || !provincia) {
    return { error: "Completá todos los campos obligatorios (Nombre, puesto y provincia)." };
  }

  // 2. Validar foto
  const archivoFoto = datosFormulario.get("foto");
  const quitarFoto = datosFormulario.get("quitarFoto") === "on";
  const hayFoto = archivoFoto instanceof File && archivoFoto.size > 0;
  if (hayFoto && quitarFoto) {
    return { error: "Elegí reemplazar la foto o quitarla, no ambas opciones." };
  }
  if (hayFoto) {
    const errorFoto = validarFoto(archivoFoto);
    if (errorFoto) return { error: errorFoto };
  }

  // 3. Validar CV
  const archivoCv = datosFormulario.get("curriculum");
  const quitarCv = datosFormulario.get("quitarCv") === "on";
  const hayCv = archivoCv instanceof File && archivoCv.size > 0;
  if (hayCv && quitarCv) {
    return { error: "Elegí reemplazar el CV o quitarlo, no ambas opciones." };
  }
  if (hayCv) {
    const errorCv = await validarCurriculum(archivoCv);
    if (errorCv) return { error: errorCv };
  }

  // 4. Procesar cambios de foto
  let fotoActualizacion = null;
  let actualizarFoto = false;
  if (hayFoto) {
    const extension = EXTENSIONES_FOTO[archivoFoto.type];
    const rutaFoto = `${user.id}/candidatos/${Date.now()}.${extension}`;
    const { error: errorSubidaFoto } = await supabase.storage
      .from(BUCKET_FOTOS)
      .upload(rutaFoto, archivoFoto, { contentType: archivoFoto.type, upsert: false });

    if (!errorSubidaFoto) {
      fotoActualizacion = supabase.storage.from(BUCKET_FOTOS).getPublicUrl(rutaFoto).data.publicUrl;
      actualizarFoto = true;
    } else {
      console.error("Error al subir foto del candidato:", errorSubidaFoto);
      return { error: `No se pudo subir la foto del candidato: ${errorSubidaFoto.message}` };
    }
  } else if (quitarFoto) {
    fotoActualizacion = null;
    actualizarFoto = true;
  }

  // 5. Procesar cambios de CV
  let cvActualizacion = null;
  let actualizarCv = false;
  if (hayCv) {
    const rutaCv = `${candidatoId}/${crypto.randomUUID()}.pdf`;
    const { error: errorSubidaCv } = await supabase.storage
      .from(BUCKET_CV)
      .upload(rutaCv, archivoCv, { contentType: "application/pdf", upsert: false });

    if (!errorSubidaCv) {
      cvActualizacion = rutaCv;
      actualizarCv = true;
    } else {
      console.error("Error al subir CV:", errorSubidaCv);
      return { error: `No se pudo subir el nuevo CV: ${errorSubidaCv.message}` };
    }
  } else if (quitarCv) {
    cvActualizacion = null;
    actualizarCv = true;
  }

  // 6. Actualizar datos en base de datos mediante RPC con SECURITY DEFINER
  const { error: errorRpc } = await supabase.rpc("actualizar_candidato_representado_con_datos", {
    p_nombres: personales.datos.nombres,
    p_apellidos: personales.datos.apellidos,
    p_fecha_nacimiento: personales.datos.fecha_nacimiento,
    p_candidato_id: candidatoId,
    p_nombre_completo: nombreCompleto,
    p_puesto: puesto,
    p_provincia: provincia,
    p_club_actual: clubActual,
    p_posicion_juego: posicionJuego,
    p_pierna_habil: piernaHabil,
    p_altura_cm: alturaCm,
    p_peso_kg: pesoKg,
    p_trayectoria: trayectoria,
    p_titulo_o_matricula: tituloOMatricula,
    p_licencia: licencia,
    p_anios_experiencia: aniosExperiencia,
    p_especialidad: especialidad,
    p_enlaces_video: enlacesVideo,
    p_foto_url: fotoActualizacion,
    p_actualizar_foto: actualizarFoto,
    p_cv_ruta: cvActualizacion,
    p_actualizar_cv: actualizarCv,
  });

  if (errorRpc) {
    return { error: "No se pudo guardar la ficha. Verificá que la migración de datos personales esté aplicada y volvé a intentar." };
  }

  revalidatePath("/mi-cartera");
  revalidatePath(`/mi-cartera/${candidatoId}/editar`);
  redirect("/mi-cartera");
}

/**
 * Postula a un candidato de la cartera a una oferta laboral publicada.
 */
export async function cancelarPostulacionRepresentado(postulacionId) {
  const supabase = await crearClienteServidor();
  const resultado = await retirarPostulacionDeCartera(supabase, postulacionId);
  if (resultado.error) return resultado;
  revalidatePath(`/ofertas/${resultado.ofertaId}`);
  revalidatePath("/mi-cartera");
  revalidatePath("/mis-postulaciones");
  revalidatePath(`/mis-ofertas/${resultado.ofertaId}/postulantes`);
  return { exito: true };
}

export async function postularCandidatoRepresentado(ofertaId, candidatoId) {
  const supabase = await crearClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Tenés que iniciar sesión como representante para postular candidatos." };
  }

  const { data: usuario } = await supabase.from("usuarios")
    .select("rol, cuenta_activa").eq("id", user.id).maybeSingle();
  if (usuario?.rol !== "representante" || !usuario.cuenta_activa) {
    return { error: "Solo un representante con cuenta activa puede postular candidatos de su cartera." };
  }

  // 1. Verificar que el candidato pertenezca a su cartera
  const { data: enCartera } = await supabase
    .from("candidatos_representados")
    .select("candidato_id")
    .eq("representante_id", user.id)
    .eq("candidato_id", candidatoId)
    .maybeSingle();

  if (!enCartera) {
    return { error: "Solo podés postular a candidatos que integren tu cartera." };
  }

  // 2. Verificar que la oferta esté publicada
  const { data: oferta } = await supabase
    .from("ofertas_laborales")
    .select("id, estado, puesto_buscado")
    .eq("id", ofertaId)
    .maybeSingle();

  if (!oferta || oferta.estado !== "publicada") {
    return { error: "Esta oferta no está disponible para postulaciones." };
  }

  const { data: perfil } = await supabase.from("perfiles_candidato")
    .select("puesto").eq("usuario_id", candidatoId).maybeSingle();
  if (!puestoCompatible(perfil?.puesto, oferta.puesto_buscado)) {
    return { error: "El puesto del candidato debe coincidir con el puesto solicitado en la oferta." };
  }

  // 3. Verificar que no exista postulación previa
  const { data: yaExiste } = await supabase
    .from("postulaciones")
    .select("id")
    .eq("oferta_id", ofertaId)
    .eq("candidato_id", candidatoId)
    .maybeSingle();

  if (yaExiste) {
    return { error: "Este candidato ya se encuentra postulado a esta oferta." };
  }

  // 4. Crear postulación
  const { error } = await supabase.from("postulaciones").insert({
    oferta_id: ofertaId,
    candidato_id: candidatoId,
    postulado_por_representante_id: user.id,
  });

  if (error) {
    if (error.code === "23505") {
      return { error: "Este candidato ya se encuentra postulado a esta oferta." };
    }
    return { error: error.message };
  }

  revalidatePath(`/ofertas/${ofertaId}`);
  revalidatePath("/mi-cartera");
  return { exito: true };
}
