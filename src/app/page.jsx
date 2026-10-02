import Link from "next/link";
import { listarOfertasPublicadas } from "@/dominio/ofertas/consultas";
import { obtenerUsuarioActual } from "@/dominio/autenticacion/sesion";
import { ETIQUETAS_PUESTO_PROFESIONAL, ETIQUETAS_TIPO_CONTRATO } from "@/tipos/dominio";
import styles from "./page.module.css";

const CANTIDAD_DESTACADAS = 6;

const PASOS = [
  {
    titulo: "Creá tu perfil",
    texto:
      "Candidatos cargan trayectoria, videos y CV. Los clubes completan los datos institucionales.",
  },
  {
    titulo: "Postulate o publicá",
    texto:
      "El candidato se postula a las búsquedas que le interesan; el club publica su oferta y la modera el equipo de CFA.",
  },
  {
    titulo: "Seguí el proceso",
    texto:
      "Cada postulación muestra su estado, y el club organiza a los postulantes por etapa hasta la decisión final.",
  },
];

export default async function PaginaInicio() {
  const [ofertas, usuario] = await Promise.all([
    listarOfertasPublicadas({}),
    obtenerUsuarioActual(),
  ]);

  const destacadas = ofertas.slice(0, CANTIDAD_DESTACADAS);

  return (
    <main className={styles.main}>
      <section className={styles.hero}>
        <p className={styles.volanta}>El próximo paso en tu carrera</p>
        <h1 className={styles.titulo}>Contrataciones de Fútbol Argentino</h1>
        <p className={styles.descripcion}>
          La plataforma que conecta candidatos, representantes y clubes de fútbol argentino —
          para jugadores, cuerpo técnico y staff deportivo, en todas las categorías.
        </p>

        <div className={styles.acciones}>
          <Link href="/ofertas" className={styles.botonPrimario}>
            Ver ofertas
          </Link>
          {usuario ? (
            <Link
              href={usuario.rol === "club" ? "/mis-ofertas" : "/mis-postulaciones"}
              className={styles.botonSecundario}
            >
              {usuario.rol === "club" ? "Mis ofertas" : "Mis postulaciones"}
            </Link>
          ) : (
            <Link href="/registrarse" className={styles.botonSecundario}>
              Crear cuenta
            </Link>
          )}
        </div>
      </section>

      <section className={styles.seccion}>
        <div className={styles.encabezadoSeccion}>
          <h2 className={styles.tituloSeccion}>Últimas ofertas</h2>
          <Link href="/ofertas" className={styles.enlaceSeccion}>
            Ver todas ↗
          </Link>
        </div>

        {destacadas.length === 0 ? (
          <p className={styles.vacio}>
            Todavía no hay ofertas publicadas. Volvé pronto o{" "}
            <Link href="/registrarse" className={styles.enlaceTexto}>
              creá tu cuenta
            </Link>{" "}
            para que te encuentren los clubes.
          </p>
        ) : (
          <ul className={styles.grillaOfertas}>
            {destacadas.map((oferta) => (
              <li key={oferta.id}>
                <Link href={`/ofertas/${oferta.id}`} className={styles.tarjetaOferta}>
                  <span className={styles.clubNombre}>
                    {oferta.perfiles_club?.nombre_club}
                  </span>
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

      <section className={styles.seccion}>
        <h2 className={styles.tituloSeccion}>Cómo funciona</h2>
        <ol className={styles.grillaPasos}>
          {PASOS.map((paso, indice) => (
            <li key={paso.titulo} className={styles.paso}>
              <span className={styles.pasoNumero}>{indice + 1}</span>
              <h3 className={styles.pasoTitulo}>{paso.titulo}</h3>
              <p className={styles.pasoTexto}>{paso.texto}</p>
            </li>
          ))}
        </ol>
      </section>

      {!usuario && (
        <section className={styles.seccion}>
          <div className={styles.grillaRoles}>
            <div className={styles.tarjetaRol}>
              <h2 className={styles.rolTitulo}>¿Sos candidato?</h2>
              <p className={styles.rolTexto}>
                Jugador, entrenador, preparador físico o staff: armá tu perfil y postulate a las
                búsquedas de los clubes.
              </p>
              <Link href="/registrarse" className={styles.botonPrimario}>
                Crear cuenta de candidato
              </Link>
            </div>
            <div className={styles.tarjetaRol}>
              <h2 className={styles.rolTitulo}>¿Representás un club?</h2>
              <p className={styles.rolTexto}>
                Publicá tus búsquedas, recibí postulaciones y organizá a los candidatos por etapa
                desde un solo panel.
              </p>
              <Link href="/registrarse" className={styles.botonSecundario}>
                Crear cuenta de club
              </Link>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
