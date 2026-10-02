"use server";

import { revalidatePath } from "next/cache";
import { crearClienteServidor } from "@/lib/supabase/cliente-servidor";
import { validarPerfilClub, validarEscudo } from "@/lib/club";

export async function guardarPerfilClub(_estadoPrevio, formulario) {
  const supabase = await crearClienteServidor();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Tenés que iniciar sesión para editar el perfil del club." };
  const { data: usuario } = await supabase.from("usuarios").select("rol, cuenta_activa").eq("id", user.id).maybeSingle();
  if (usuario?.rol !== "club" || !usuario.cuenta_activa) return { error: "Solo un club activo puede editar este perfil." };
  const resultado = validarPerfilClub(formulario);
  if (resultado.error) return { error: resultado.error };
  const escudo = formulario.get("escudo");
  const subir = escudo instanceof File && escudo.size > 0;
  const quitar = formulario.get("quitarEscudo") === "on";
  if (subir && quitar) return { error: "Elegí reemplazar el escudo o quitarlo, no ambas opciones." };
  const errorEscudo = await validarEscudo(escudo);
  if (errorEscudo) return { error: errorEscudo };
  let anterior, nuevaRuta;
  const bucket = supabase.storage.from("escudos-club");
  if (subir || quitar) {
    const { data, error } = await supabase.from("perfiles_club").select("escudo_url").eq("usuario_id", user.id).maybeSingle();
    if (error) return { error: "No se pudo consultar el escudo actual." };
    anterior = data?.escudo_url;
    if (subir) {
      const extension = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" }[escudo.type];
      nuevaRuta = `${user.id}/${crypto.randomUUID()}.${extension}`;
      const { error } = await bucket.upload(nuevaRuta, escudo, { contentType: escudo.type });
      if (error) return { error: "No se pudo subir el escudo. Intentá nuevamente." };
      resultado.datos.escudo_url = bucket.getPublicUrl(nuevaRuta).data.publicUrl;
    } else resultado.datos.escudo_url = null;
  }
  const { error } = await supabase.from("perfiles_club").upsert({ usuario_id: user.id, ...resultado.datos });
  if (error) {
    if (nuevaRuta) await bucket.remove([nuevaRuta]);
    return { error: "No se pudieron guardar los datos del club. Intentá nuevamente." };
  }
  // Solo eliminar archivos propios de este bucket y después de guardar el perfil.
  const prefijo = bucket.getPublicUrl(`${user.id}/`).data.publicUrl;
  if ((subir || quitar) && anterior?.startsWith(prefijo)) {
    const nombre = anterior.slice(prefijo.length);
    if (/^[a-f0-9-]+\.(jpg|png|webp)$/.test(nombre)) await bucket.remove([`${user.id}/${nombre}`]);
  }
  for (const ruta of ["/mi-club", "/perfil-publico-club", "/ofertas"]) revalidatePath(ruta);
  return { error: null };
}
