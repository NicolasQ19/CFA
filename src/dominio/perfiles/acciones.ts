"use server";

import { revalidatePath } from "next/cache";
import { crearClienteServidor } from "@/lib/supabase/cliente-servidor";
import type { PuestoProfesional } from "@/tipos/dominio";
import { esPuestoDeCuerpoTecnico } from "@/tipos/dominio";
import type { ResultadoAccion } from "@/dominio/autenticacion/acciones";

/**
 * RF-05 a RF-09: crea o actualiza el perfil profesional del candidato.
 * Los campos deportivos solo se guardan si el puesto es "jugador";
 * los campos técnicos se guardan para el resto de los puestos (RF-06, RF-07).
 */
export async function guardarPerfilCandidato(
  _estadoPrevio: ResultadoAccion,
  datosFormulario: FormData
): Promise<ResultadoAccion> {
  const supabase = await crearClienteServidor();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Tenés que iniciar sesión para editar tu perfil." };
  }

  const puesto = String(datosFormulario.get("puesto") ?? "") as PuestoProfesional;
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

  const camposComunes = {
    usuario_id: user.id,
    puesto,
    provincia,
    club_actual: valorOpcional(datosFormulario.get("clubActual")),
    trayectoria: valorOpcional(datosFormulario.get("trayectoria")),
    formacion_academica: valorOpcional(datosFormulario.get("formacionAcademica")),
    enlaces_video: enlacesVideo,
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

  revalidatePath("/mi-perfil");
  revalidatePath("/perfil-publico");
  return { error: null };
}

function valorOpcional(valor: FormDataEntryValue | null): string | null {
  const texto = String(valor ?? "").trim();
  return texto.length > 0 ? texto : null;
}

function valorNumericoOpcional(valor: FormDataEntryValue | null): number | null {
  const texto = String(valor ?? "").trim();
  if (texto.length === 0) return null;
  const numero = Number(texto);
  return Number.isFinite(numero) ? numero : null;
}
