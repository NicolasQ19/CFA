import { PerfilCandidato } from "@/dominio/perfiles/PerfilCandidato";
import { notFound, redirect } from "next/navigation";
import { obtenerUsuarioActual } from "@/dominio/autenticacion/sesion";
import { obtenerPerfilCandidato } from "@/dominio/perfiles/consultas";
import { candidatoSePostuloAlClub } from "@/dominio/postulaciones/consultas-club";
import { crearClienteServidor } from "@/lib/supabase/cliente-servidor";


export default async function PaginaPerfilPublico({ searchParams }) {
  const usuario = await obtenerUsuarioActual();
  const parametros = await searchParams;
  const candidatoId = parametros?.id;

  if (!usuario) {
    redirect("/iniciar-sesion");
  }

  const esVistaAjena = Boolean(candidatoId && candidatoId !== usuario.id);

  if (esVistaAjena && usuario.rol !== "club" && usuario.rol !== "administrador" && usuario.rol !== "representante") {
    redirect("/");
  }

  if (!esVistaAjena && usuario.rol !== "candidato") {
    redirect("/");
  }

  const idPerfil = esVistaAjena ? candidatoId : usuario.id;
  const perfil = await obtenerPerfilCandidato(idPerfil);

  // Un perfil oculto no sale en la búsqueda; un club solo lo ve si el candidato se postuló a sus ofertas.
  if (
    esVistaAjena &&
    usuario.rol === "club" &&
    perfil &&
    !perfil.perfil_visible &&
    !(await candidatoSePostuloAlClub(idPerfil, usuario.id))
  ) {
    notFound();
  }

  let nombreCandidato = usuario.nombre_completo;
  if (esVistaAjena) {
    const supabase = await crearClienteServidor();
    const { data: candidato } = await supabase
      .from("usuarios")
      .select("nombre_completo")
      .eq("id", idPerfil)
      .maybeSingle();
    nombreCandidato = candidato?.nombre_completo ?? "Candidato";
  }

  return <main><PerfilCandidato perfil={perfil} nombreCandidato={nombreCandidato} idPerfil={idPerfil} editable={!esVistaAjena} /></main>;
}
