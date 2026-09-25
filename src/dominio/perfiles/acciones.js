"use server";

import { revalidatePath } from "next/cache";
import { crearClienteServidor } from "@/lib/supabase/cliente-servidor";
import { crearClienteAdmin } from "@/lib/supabase/cliente-admin";
import { esPuestoDeCuerpoTecnico } from "@/tipos/dominio";
import { extraerIdVideoYoutube } from "@/lib/youtube";

const BUCKET_FOTOS = "fotos-perfil";
const TAMANIO_MAXIMO_FOTO = 2_000_000; // igual al límite configurado en el bucket
const EXTENSIONES_FOTO = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

/**
 * RF-05 a RF-09: crea o actualiza el perfil profesional del candidato.
 * Los campos deportivos solo se guardan si el puesto es "jugador";
 * los campos técnicos se guardan para el resto de los puestos (RF-06, RF-07).
 */
export async function guardarPerfilCandidato(_estadoPrevio, datosFormulario) {
  const supabase = await crearClienteServidor();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Tenés que iniciar sesión para editar tu perfil." };
  }

  const puesto = String(datosFormulario.get("puesto") ?? "");
  const provincia = String(datosFormulario.get("provincia") ?? "").trim();

  if (!puesto || !provincia) {
    return { error: "El puesto y la provincia son obligatorios." };
  }

  const enlacesVideo = [
    datosFormulario.get("enlaceVideo1"),
    datosFormulario.get("enlaceVideo2"),
    datosFormulario.get("enlaceVideo3"),
  ]
    .map((valor) => String(valor ?? "").trim())
    .filter((valor) => valor.length > 0)
    .slice(0, 3); // RF-08: hasta 3 enlaces

  const enlaceInvalido = enlacesVideo.find((enlace) => !extraerIdVideoYoutube(enlace));
  if (enlaceInvalido) {
    return { error: `"${enlaceInvalido}" no es un enlace de video de YouTube válido.` };
  }

  const resultadoFoto = await procesarFoto(user.id, datosFormulario);
  if (resultadoFoto.error) {
    return { error: resultadoFoto.error };
  }

  const camposComunes = {
    usuario_id: user.id,
    puesto,
    provincia,
    club_actual: valorOpcional(datosFormulario.get("clubActual")),
    trayectoria: valorOpcional(datosFormulario.get("trayectoria")),
    formacion_academica: valorOpcional(datosFormulario.get("formacionAcademica")),
    enlaces_video: enlacesVideo,
    perfil_visible: datosFormulario.get("perfilVisible") === "on",
    // undefined = no tocar la foto actual (upsert ignora las claves undefined).
    ...(resultadoFoto.fotoUrl !== undefined && { foto_url: resultadoFoto.fotoUrl }),
  };

  const camposSegunPuesto = esPuestoDeCuerpoTecnico(puesto)
    ? {
        // RF-07: datos técnicos (cuerpo técnico / staff)
        titulo_o_matricula: valorOpcional(datosFormulario.get("tituloOMatricula")),
        licencia: valorOpcional(datosFormulario.get("licencia")),
        anios_experiencia: valorNumericoOpcional(datosFormulario.get("aniosExperiencia")),
        especialidad: valorOpcional(datosFormulario.get("especialidad")),
        posicion_juego: null,
        pierna_habil: null,
        altura_cm: null,
        peso_kg: null,
      }
    : {
        // RF-06: datos deportivos (jugador)
        posicion_juego: valorOpcional(datosFormulario.get("posicionJuego")),
        pierna_habil: valorOpcional(datosFormulario.get("piernaHabil")),
        altura_cm: valorNumericoOpcional(datosFormulario.get("alturaCm")),
        peso_kg: valorNumericoOpcional(datosFormulario.get("pesoKg")),
        titulo_o_matricula: null,
        licencia: null,
        anios_experiencia: null,
        especialidad: null,
      };

  const { error } = await supabase
    .from("perfiles_candidato")
    .upsert({ ...camposComunes, ...camposSegunPuesto });

  if (error) {
    return { error: error.message };
  }

  await borrarFotos(resultadoFoto.rutasParaBorrar);

  revalidatePath("/mi-perfil");
  revalidatePath("/perfil-publico");
  return { error: null };
}

/**
 * Sube o quita la foto de perfil. Devuelve { fotoUrl, rutasParaBorrar }: fotoUrl es la URL
 * nueva, null si se quitó, o undefined si no hubo cambios. Las fotos anteriores se borran
 * recién después de guardar el perfil, para no dejarlo apuntando a una foto inexistente.
 * Usa el cliente admin porque el bucket no tiene políticas de escritura: el control
 * de acceso es que la ruta siempre es la carpeta del usuario logueado.
 */
async function procesarFoto(usuarioId, datosFormulario) {
  const archivo = datosFormulario.get("foto");
  const quitarFoto = datosFormulario.get("quitarFoto") === "on";
  const hayArchivo = archivo instanceof File && archivo.size > 0;

  if (!hayArchivo && !quitarFoto) {
    return { fotoUrl: undefined, rutasParaBorrar: [] };
  }

  const supabaseAdmin = crearClienteAdmin();
  const carpeta = supabaseAdmin.storage.from(BUCKET_FOTOS);

  const { data: anteriores } = await carpeta.list(usuarioId);
  const rutasAnteriores = (anteriores ?? []).map((objeto) => `${usuarioId}/${objeto.name}`);

  if (!hayArchivo) {
    return { fotoUrl: null, rutasParaBorrar: rutasAnteriores };
  }

  const extension = EXTENSIONES_FOTO[archivo.type];
  if (!extension) {
    return { error: "La foto tiene que ser JPG, PNG o WebP." };
  }
  if (archivo.size > TAMANIO_MAXIMO_FOTO) {
    return { error: "La foto no puede pesar más de 2 MB." };
  }

  // Nombre nuevo en cada subida para que el navegador no muestre la foto vieja cacheada.
  const ruta = `${usuarioId}/${Date.now()}.${extension}`;
  const { error } = await carpeta.upload(ruta, archivo, { contentType: archivo.type });

  if (error) {
    return { error: `No se pudo subir la foto: ${error.message}` };
  }

  return { fotoUrl: carpeta.getPublicUrl(ruta).data.publicUrl, rutasParaBorrar: rutasAnteriores };
}

async function borrarFotos(rutas) {
  if (rutas.length === 0) return;
  await crearClienteAdmin().storage.from(BUCKET_FOTOS).remove(rutas);
}

function valorOpcional(valor) {
  const texto = String(valor ?? "").trim();
  return texto.length > 0 ? texto : null;
}

function valorNumericoOpcional(valor) {
  const texto = String(valor ?? "").trim();
  if (texto.length === 0) return null;
  const numero = Number(texto);
  return Number.isFinite(numero) ? numero : null;
}