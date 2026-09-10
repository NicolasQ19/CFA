import { crearClienteServidor } from "@/lib/supabase/cliente-servidor";
import type { PerfilCandidato } from "@/tipos/base-de-datos";

export async function obtenerPerfilCandidato(usuarioId: string): Promise<PerfilCandidato | null> {
  const supabase = await crearClienteServidor();

  const { data } = await supabase
    .from("perfiles_candidato")
    .select("*")
    .eq("usuario_id", usuarioId)
    .maybeSingle();

  return data;
}
