import { crearClienteServidor } from "@/lib/supabase/cliente-servidor";
import type { PerfilClub } from "@/tipos/base-de-datos";

export async function obtenerPerfilClub(usuarioId: string): Promise<PerfilClub | null> {
  const supabase = await crearClienteServidor();

  const { data } = await supabase
    .from("perfiles_club")
    .select("*")
    .eq("usuario_id", usuarioId)
    .maybeSingle();

  return data;
}
