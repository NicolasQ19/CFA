import { crearClienteServidor } from "@/lib/supabase/cliente-servidor";

export async function obtenerPerfilClub(usuarioId) {
  const supabase = await crearClienteServidor();

  const { data } = await supabase
    .from("perfiles_club")
    .select("*")
    .eq("usuario_id", usuarioId)
    .maybeSingle();

  return data;
}
