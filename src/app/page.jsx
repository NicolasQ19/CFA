import Link from "next/link";
import { listarOfertasPublicadas } from "@/dominio/ofertas/consultas";
import { obtenerUsuarioActual } from "@/dominio/autenticacion/sesion";
import { ETIQUETAS_PUESTO_PROFESIONAL, ETIQUETAS_TIPO_CONTRATO } from "@/tipos/dominio";
import styles from "./page.module.css";

const CANTIDAD_DESTACADAS = 6;

const PANELES = {
  candidato: { href: "/mi-perfil", texto: "Mi perfil profesional" },
  representante: { href: "/mi-cartera", texto: "Gestionar mi cartera" },
  club: { href: "/mis-ofertas", texto: "Gestionar mis ofertas" },
  administrador: { href: "/admin", texto: "Panel de moderación" },
};

const ROLES = [
  { rol: "candidato", numero: "01", titulo: "Para candidatos", texto: "Dale un lugar a tu trayectoria y encontrá búsquedas para tu puesto profesional.", beneficios: ["Perfil con experiencia, videos y CV en PDF", "Ofertas filtradas por puesto y ubicación", "Seguimiento del estado de tus postulaciones"], href: "/mi-perfil", accion: "Completar mi perfil" },
  { rol: "club", numero: "02", titulo: "Para clubes", texto: "Presentá tu institución y organizá la búsqueda de tu próximo integrante.", beneficios: ["Publicación de ofertas con moderación previa", "Búsqueda de candidatos por perfil profesional", "Gestión de postulantes y notas internas"], href: "/mis-ofertas", accion: "Gestionar mis búsquedas" },
  { rol: "representante", numero: "03", titulo: "Para representantes", texto: "Acompañá a tus talentos con una cartera organizada y oportunidades acordes a cada perfil.", beneficios: ["Carga y edición de fichas de representados", "Vista previa de los perfiles antes de guardar", "Postulación y cancelación desde tu cartera"], href: "/mi-cartera", accion: "Gestionar mi cartera" },
];

const PREGUNTAS = [
  { titulo: "¿CFA es solo para jugadores?", texto: "También está pensada para directores técnicos, preparadores físicos, kinesiólogos, médicos, analistas, coordinadores, utileros y scouts. Cada candidato completa la información específica de su puesto." },
  { titulo: "¿Cómo me postulo a una oferta?", texto: "Creá una cuenta de candidato, completá tu perfil profesional y abrí una oferta publicada. Tu puesto debe coincidir con el solicitado por el club. Desde Mis postulaciones podés consultar el estado del proceso." },
  { titulo: "¿Un representante puede postular a sus candidatos?", texto: "Sí. Puede cargar las fichas de sus representados, buscar candidatos dentro de su cartera y postularlos a ofertas del mismo puesto profesional. También puede retirar las postulaciones que envió desde la oferta o desde Mi cartera." },
  { titulo: "¿Las ofertas se publican inmediatamente?", texto: "Las búsquedas creadas por los clubes pasan por moderación antes de aparecer en el listado público. Una vez publicadas, el club puede gestionar sus postulantes y pausar o cerrar la búsqueda." },
];

const PASOS = [
  {
    titulo: "Creá tu perfil",
    texto:
      "Los candidatos cargan trayectoria, videos y CV. Los clubes presentan su institución y los representantes organizan su cartera.",
  },
  {
    titulo: "Postulate o publicá",
    texto:
      "Los candidatos y representantes envían postulaciones a búsquedas del mismo puesto. Los clubes crean ofertas que pasan por moderación.",
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
        <div className={styles.heroTexto}>
        <p className={styles.volanta}>El próximo paso en tu carrera</p>
        <h1 className={styles.titulo}>Contrataciones de Fútbol Argentino</h1>
        <p className={styles.descripcion}>
          Conectamos jugadores, cuerpo técnico y staff deportivo con las búsquedas de los clubes. Creá tu perfil, encontrá oportunidades y gestioná tus postulaciones en un mismo lugar.
        </p>

        <div className={styles.acciones}>
          <Link href="/ofertas" className={styles.botonPrimario}>
            Ver ofertas
          </Link>
          {usuario ? (
            <Link
              href={PANELES[usuario.rol]?.href ?? "/ofertas"}
              className={styles.botonSecundario}
            >
              {PANELES[usuario.rol]?.texto ?? "Explorar ofertas"}
            </Link>
          ) : (
            <Link href="/registrarse" className={styles.botonSecundario}>
              Crear cuenta
            </Link>
          )}
        </div>
        <a href="#como-funciona" className={styles.enlaceComo}>Conocé cómo funciona <span aria-hidden="true">↓</span></a>
        </div>
        <aside className={styles.heroPanel} aria-label="Qué podés hacer en CFA">
          <div className={styles.panelCabecera}><span>CFA / CONEXIONES</span><span className={styles.punto} aria-hidden="true" /></div>
          <h2>El talento y los clubes,<br />más cerca.</h2>
          <div className={styles.panelFila}><span className={styles.panelNumero}>01</span><div><h3>Un perfil que te presenta</h3><p>Tu experiencia y material profesional.</p></div></div>
          <div className={styles.panelFila}><span className={styles.panelNumero}>02</span><div><h3>Una búsqueda que encaja</h3><p>Oportunidades para tu puesto.</p></div></div>
          <div className={styles.panelFila}><span className={styles.panelNumero}>03</span><div><h3>Un proceso organizado</h3><p>Postulaciones y seguimiento.</p></div></div>
          <p className={styles.panelNota}>Candidatos · Clubes · Representantes</p>
        </aside>
      </section>

      <section id="sobre-cfa" className={styles.sobre} aria-labelledby="tituloSobre">
        <div><p className={styles.volanta}>QUÉ ES CFA</p><h2 id="tituloSobre" className={styles.tituloSeccion}>El fútbol necesita talento<br />dentro y fuera de la cancha.</h2></div>
        <div><p>CFA es una plataforma de oportunidades laborales para el fútbol argentino. Reúne perfiles profesionales, búsquedas de clubes y gestión de representados para que cada parte pueda encontrar la información que necesita.</p><p>Desde un jugador que busca su próximo equipo hasta un club que necesita fortalecer su cuerpo técnico: el objetivo es hacer más simple la búsqueda y el seguimiento de cada candidatura.</p></div>
      </section>

      <section id="para-quien" className={styles.seccion} aria-labelledby="tituloRoles">
        <p className={styles.volanta}>UN ESPACIO PARA CADA ROL</p>
        <h2 id="tituloRoles" className={styles.tituloSeccion}>Distintos objetivos. Una misma plataforma.</h2>
        <p className={styles.introduccion}>Elegí el rol que mejor representa tu actividad y accedé a las herramientas que necesitás.</p>
        <div className={styles.grillaRoles}>
          {ROLES.map(rol => <article key={rol.rol} className={styles.tarjetaRol}>
            <span className={styles.rolNumero}>{rol.numero}</span>
            <h3 className={styles.rolTitulo}>{rol.titulo}</h3>
            <p className={styles.rolTexto}>{rol.texto}</p>
            <ul className={styles.beneficios}>{rol.beneficios.map(beneficio => <li key={beneficio}><span aria-hidden="true">✓</span>{beneficio}</li>)}</ul>
            <Link href={usuario?.rol === rol.rol ? rol.href : usuario ? "/ofertas" : "/registrarse"} className={styles.enlaceRol}>{usuario?.rol === rol.rol ? rol.accion : usuario ? "Explorar ofertas" : "Crear mi cuenta"}<span aria-hidden="true">→</span></Link>
          </article>)}
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
                    {oferta.perfiles_club?.nombre_club ?? "Club"}
                  </span>
                  <span className={styles.ofertaTitulo}>
                    {ETIQUETAS_PUESTO_PROFESIONAL[oferta.puesto_buscado] ?? oferta.puesto_buscado}
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

      <section id="como-funciona" className={styles.seccion} aria-labelledby="tituloPasos">
        <p className={styles.volanta}>DE TU PERFIL A LA OPORTUNIDAD</p>
        <h2 id="tituloPasos" className={styles.tituloSeccion}>Cómo funciona</h2>
        <p className={styles.introduccion}>Un recorrido simple para presentar tu experiencia y gestionar cada búsqueda.</p>
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

      <section className={styles.seccion} aria-labelledby="tituloPuestos">
        <p className={styles.volanta}>MÁS QUE UN SOLO PUESTO</p>
        <h2 id="tituloPuestos" className={styles.tituloSeccion}>Todo el equipo tiene su lugar.</h2>
        <p className={styles.introduccion}>Perfiles deportivos y profesionales, con datos adaptados a cada especialidad.</p>
        <ul className={styles.puestos}>{Object.values(ETIQUETAS_PUESTO_PROFESIONAL).map(puesto => <li key={puesto}>{puesto}</li>)}</ul>
      </section>

      <section id="preguntas-frecuentes" className={styles.seccion} aria-labelledby="tituloPreguntas">
        <p className={styles.volanta}>ANTES DE EMPEZAR</p>
        <h2 id="tituloPreguntas" className={styles.tituloSeccion}>Preguntas frecuentes</h2>
        <div className={styles.preguntas}>{PREGUNTAS.map(pregunta => <details key={pregunta.titulo} className={styles.pregunta}>
          <summary>{pregunta.titulo}<span aria-hidden="true">+</span></summary><p>{pregunta.texto}</p>
        </details>)}</div>
      </section>

      <section className={styles.cierre} aria-labelledby="tituloCierre">
        <div><p className={styles.volanta}>TU PRÓXIMO PASO</p><h2 id="tituloCierre" className={styles.tituloSeccion}>{usuario ? "Encontrá tu próxima oportunidad." : "Sumate a CFA."}</h2><p>Presentá tu talento, conectá con los clubes y organizá tu búsqueda.</p></div>
        <Link href={usuario ? "/ofertas" : "/registrarse"} className={styles.botonPrimario}>{usuario ? "Explorar ofertas" : "Crear una cuenta"} <span aria-hidden="true">→</span></Link>
      </section>
    </main>
  );
}
