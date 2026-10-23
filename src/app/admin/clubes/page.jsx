import Link from "next/link";
import { redirect } from "next/navigation";
import { obtenerUsuarioActual } from "@/dominio/autenticacion/sesion";
import { crearClienteServidor } from "@/lib/supabase/cliente-servidor";
import { ESTADOS_VERIFICACION_CLUB } from "@/lib/verificacion-club";
import { FormularioRevisionClub } from "@/dominio/clubes/FormularioRevisionClub";
import { urlPublica } from "@/lib/club";
import styles from "../page.module.css";

export const dynamic = "force-dynamic";
export const metadata = { title: "Verificación de clubes | CFA" };

export default async function PaginaVerificacionClubes({ searchParams }) {
  const usuario = await obtenerUsuarioActual();
  if (!usuario) redirect("/iniciar-sesion");
  if (usuario.rol !== "administrador" || !usuario.cuenta_activa) redirect("/");
  const parametros = await searchParams;
  const estado = Object.hasOwn(ESTADOS_VERIFICACION_CLUB, parametros?.estado ?? "") ? parametros.estado : parametros?.estado === "todos" ? "todos" : "pendiente";
  const pagina = Math.max(1, Math.min(100000, Number.parseInt(parametros?.pagina, 10) || 1));
  const cliente = await crearClienteServidor();
  let consulta = cliente.from("verificaciones_club")
    .select("*, club:usuarios!verificaciones_club_club_id_fkey(nombre_completo, correo_electronico, cuenta_activa, perfiles_club(*))", { count: "exact" })
    .order("solicitada_en", { ascending: false, nullsFirst: false }).order("club_id").range((pagina - 1) * 20, pagina * 20 - 1);
  if (estado !== "todos") consulta = consulta.eq("estado", estado);
  const { data, count, error } = await consulta;
  return <main className={styles.main}>
    <div className={styles.cabecera}><div><h1 className={styles.titulo}>Verificación de clubes</h1>
      <p className={styles.subtitulo}>Comprobá que la institución existe y que quien creó la cuenta está autorizado a representarla.</p></div></div>
    <p className={styles.subtitulo}>Buscá un teléfono o correo en los canales oficiales del club por tu cuenta y confirmá la autorización del solicitante. Registrá el resultado antes de verificarlo.</p>
    <nav className={styles.filtros} aria-label="Filtrar verificación">
      {[["todos", "Todos"], ...Object.entries(ESTADOS_VERIFICACION_CLUB)].map(([valor, etiqueta]) => <Link className={styles.filtro} aria-current={valor === estado ? "page" : undefined} key={valor} href={`/admin/clubes?estado=${valor}`}>{etiqueta}</Link>)}
    </nav>
    {error ? <p role="alert" className={styles.itemVacio}>No se pudieron cargar las solicitudes de verificación. Intentá nuevamente.</p> : <>
      <p className={styles.subtitulo}>{count} clubes en esta vista.</p>
      {data.length === 0 && <p className={styles.itemVacio}>No hay clubes para revisar en esta vista.</p>}
      <ul className={styles.lista}>{data.map(solicitud => {
        const perfil = solicitud.club?.perfiles_club;
        const canal = urlPublica(solicitud.url_oficial);
        return <li id={`club-${solicitud.club_id}`} className={styles.item} key={solicitud.club_id}>
          <div className={styles.cabecera}><div><h2 className={styles.itemTitulo}>{perfil?.nombre_club ?? solicitud.club?.nombre_completo ?? "Club sin perfil"}</h2>
            <p className={styles.subtitulo}>{[perfil?.localidad, perfil?.provincia, perfil?.categoria].filter(Boolean).join(" · ")}</p></div>
            <span className={styles.etiquetaPendiente}>{ESTADOS_VERIFICACION_CLUB[solicitud.estado]}</span></div>
          <dl className={styles.grillaDatos}>
            {[
              ["Liga o asociación", solicitud.liga_asociacion], ["Solicitante", solicitud.nombre_solicitante], ["Cargo", solicitud.cargo],
              ["Correo institucional declarado", solicitud.correo_institucional], ["Teléfono institucional declarado", solicitud.telefono_institucional],
              ["Correo de la cuenta", solicitud.club?.correo_electronico], ["Cuenta", solicitud.club?.cuenta_activa ? "Activa" : "Inactiva"],
              ["Solicitud enviada", solicitud.solicitada_en ? new Date(solicitud.solicitada_en).toLocaleString("es-AR") : "Sin enviar"],
              ["Última revisión", solicitud.revisada_en ? new Date(solicitud.revisada_en).toLocaleString("es-AR") : null],
              ["Canal contactado en la revisión anterior", solicitud.canal_confirmado], ["Observaciones anteriores", solicitud.observaciones],
            ].filter(([, valor]) => valor).map(([etiqueta, valor]) => <div className={styles.dato} key={etiqueta}><dt className={styles.datoEtiqueta}>{etiqueta}</dt><dd className={styles.datoValor}>{valor}</dd></div>)}
          </dl>
          <p className={styles.subtitulo}>{canal && <a className={styles.enlaceExterno} href={canal} target="_blank" rel="noreferrer">Canal oficial declarado ↗</a>} · <Link className={styles.enlaceExterno} href={`/perfil-publico-club?id=${solicitud.club_id}`} target="_blank">Ver perfil del club ↗</Link></p>
          <FormularioRevisionClub key={`${solicitud.club_id}:${solicitud.solicitada_en}:${solicitud.revisada_en}`} solicitud={solicitud} />
        </li>;
      })}</ul>
      <nav className={styles.filtros} aria-label="Paginación de clubes">
        {pagina > 1 && <Link className={styles.filtro} href={`/admin/clubes?estado=${estado}&pagina=${pagina - 1}`}>← Anterior</Link>}
        <span className={styles.subtitulo}>Página {pagina}</span>
        {pagina * 20 < count && <Link className={styles.filtro} href={`/admin/clubes?estado=${estado}&pagina=${pagina + 1}`}>Siguiente →</Link>}
      </nav>
    </>}
  </main>;
}
