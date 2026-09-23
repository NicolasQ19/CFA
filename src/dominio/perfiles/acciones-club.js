"use server";

import { revalidatePath } from "next/cache";
import { crearClienteServidor } from "@/lib/supabase/cliente-servidor";

/** RF-11: el club carga sus datos institucionales. Es requisito para poder publicar ofertas. */
export async function guardarPerfilClub(_estadoPrevio, datosFormulario) {
  const supabase = await crearClienteServidor();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Tenés que iniciar sesión para editar el perfil del club." };
  }

  const nombreClub = String(datosFormulario.get("nombreClub") ?? "").trim();
  const provincia = String(datosFormulario.get("provincia") ?? "").trim();
  const categoria = String(datosFormulario.get("categoria") ?? "").trim();

  if (!nombreClub || !provincia || !categoria) {
    return { error: "Completá nombre, provincia y categoría del club." };
  }

  const { error } = await supabase.from("perfiles_club").upsert({
    usuario_id: user.id,
    nombre_club: nombreClub,
    provincia,
    categoria,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/mi-club");
  revalidatePath("/perfil-publico-club");
  return { error: null };
}