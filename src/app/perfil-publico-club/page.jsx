import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { obtenerUsuarioActual } from "@/dominio/autenticacion/sesion";
import { obtenerPerfilClub } from "@/dominio/perfiles/consultas";
import { listarOfertasPublicadasDelClub } from "@/dominio/ofertas/consultas";
import { ETIQUETAS_PUESTO_PROFESIONAL, ETIQUETAS_TIPO_CONTRATO } from "@/tipos/dominio";
import styles from "./page.module.css";

/**
 * Perfil público del club. Con ?id= lo ve cualquiera (igual que las ofertas);
 * sin id, el club logueado ve el suyo con el enlace para editarlo.
 */
export default async function PaginaPerfilPublicoClub({ searchParams }) {
  const { id: clubIdParam } = await searchParams;
  const usuario = await obtenerUsuarioActual();

  const esVistaPropia = !clubIdParam || clubIdParam === usuario?.id;

  if (esVistaPropia) {
    if (!usuario) redirect("/iniciar-sesion");
    if (usuario.rol !== "club") redirect("/");
  }

  const clubId = esVistaPropia ? usuario.id : clubIdParam;
  const perfil = await obtenerPerfilClub(clubId);

  if (!perfil && !esVistaPropia) {
    notFound();
  }

  const ofertas = perfil ? await listarOfertasPublicadasDelClub(clubId) : [];

  return (
    <main className={styles.main}>
      <div className={styles.encabezado}>
        <div>
          <h1 className={styles.titulo}>
            {esVistaPropia ? "Perfil público del club" : perfil.nombre_club}
          </h1>
          <p className={styles.subtitulo}>
            {esVistaPropia
              ? "Así ven los candidatos los datos de tu club."
              : "Perfil del club y sus búsquedas activas."}
          </p>
        </div>
        {esVistaPropia && (
          <Link href="/mi-club" className={styles.enlaceEditar}>
            Editar datos
          </Link>
        )}
      </div>

      {!perfil ? (
        <p className={styles.vacio}>
          Todavía no completaste los datos del club.{" "}
          <Link href="/mi-club">Completalos acá</Link>.
        </p>
      ) : (
        <>
          <div className={styles.tarjeta}>
            <div className={styles.grilla}>
              <Dato etiqueta="Nombre del club" valor={perfil.nombre_club} />
              <Dato etiqueta="Provincia" valor={perfil.provincia} />
              <Dato etiqueta="Categoría" valor={perfil.categoria} />
            </div>
          </div>

          <section className={styles.seccionOfertas}>
            <h2 className={styles.tituloSeccion}>Ofertas activas</h2>
            {ofertas.length === 0 ? (
              <p className={styles.vacio}>Este club no tiene ofertas publicadas en este momento.</p>
            ) : (
              <ul className={styles.listaOfertas}>
                {ofertas.map((oferta) => (
                  <li key={oferta.id}>
                    <Link href={`/ofertas/${oferta.id}`} className={styles.oferta}>
                      <span className={styles.ofertaTitulo}>
                        {ETIQUETAS_PUESTO_PROFESIONAL[oferta.puesto_buscado]}
                        {oferta.posicion_juego ? ` — ${oferta.posicion_juego}` : ""}
                      </span>
                      <span className={styles.ofertaDetalle}>
                        {oferta.categoria} · {oferta.provincia} ·{" "}
                        {ETIQUETAS_TIPO_CONTRATO[oferta.tipo_contrato]}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </main>
  );
}

function Dato({ etiqueta, valor }) {
  if (!valor) return null;
  return (
    <div className={styles.dato}>
      <span className={styles.etiqueta}>{etiqueta}</span>
      <span className={styles.valor}>{valor}</span>
    </div>
  );
}
