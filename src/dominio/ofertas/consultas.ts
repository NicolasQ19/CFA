import { crearClienteServidor } from "@/lib/supabase/cliente-servidor";
import type { OfertaLaboral, PerfilClub } from "@/tipos/base-de-datos";
import type { PuestoProfesional } from "@/tipos/dominio";

export interface FiltrosListadoOfertas {
  puesto?: PuestoProfesional;
  provincia?: string;
  categoria?: string;
}

export type OfertaConClub = OfertaLaboral & { perfiles_club: Pick<PerfilClub, "nombre_club" | "escudo_url"> };

/** RF-18: listado público de ofertas publicadas, con filtros por puesto, provincia y categoría. */
export async function listarOfertasPublicadas(
  filtros: FiltrosListadoOfertas
): Promise<OfertaConClub[]> {
  const supabase = await crearClienteServidor();

  let consulta = supabase
    .from("ofertas_laborales")
    .select("*, perfiles_club(nombre_club, escudo_url)")
    .eq("estado", "publicada")
    .order("creada_en", { ascending: false });

  if (filtros.puesto) consulta = consulta.eq("puesto_buscado", filtros.puesto);
  if (filtros.provincia) consulta = consulta.eq("provincia", filtros.provincia);
  if (filtros.categoria) consulta = consulta.eq("categoria", filtros.categoria);

  const { data } = await consulta;
  return (data as OfertaConClub[] | null) ?? [];
}

/** RF-19: ficha de detalle de una oferta publicada. */
export async function obtenerOfertaPublicadaPorId(ofertaId: string): Promise<OfertaConClub | null> {
  const supabase = await crearClienteServidor();

  const { data } = await supabase
    .from("ofertas_laborales")
    .select("*, perfiles_club(nombre_club, escudo_url)")
    .eq("id", ofertaId)
    .single();

  return data as OfertaConClub | null;
}

/** RF-13: ofertas propias del club (en cualquier estado), para su panel de gestión. */
export async function listarOfertasDelClub(clubId: string): Promise<OfertaLaboral[]> {
  const supabase = await crearClienteServidor();

  const { data } = await supabase
    .from("ofertas_laborales")
    .select("*")
    .eq("club_id", clubId)
    .order("creada_en", { ascending: false });

  return data ?? [];
}

/** RF-25: ofertas pendientes de moderación, para el panel de administración. */
export async function listarOfertasPendientesDeModeracion(): Promise<OfertaConClub[]> {
  const supabase = await crearClienteServidor();

  const { data } = await supabase
    .from("ofertas_laborales")
    .select("*, perfiles_club(nombre_club, escudo_url)")
    .eq("estado", "pendiente_moderacion")
    .order("creada_en", { ascending: true });

  return (data as OfertaConClub[] | null) ?? [];
}
