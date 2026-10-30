import Link from "next/link";
import { listarOfertasPublicadas } from "@/dominio/ofertas/consultas";
import { obtenerUsuarioActual } from "@/dominio/autenticacion/sesion";
import { ETIQUETAS_PUESTO_PROFESIONAL, ETIQUETAS_TIPO_CONTRATO } from "@/tipos/dominio";
import { BENEFICIOS_PLAN, NOMBRES_PLAN_POR_ROL, ROLES_CON_PLAN } from "@/lib/suscripciones";
import {
  PASOS,
  PREGUNTAS,
  ROLES_PUBLICOS,
  TITULOS_PLAN_POR_ROL,
} from "@/lib/contenido-institucional";
import { PiePagina } from "@/componentes/PiePagina";
import styles from "./page.module.css";

const CANTIDAD_DESTACADAS = 8;
const CANTIDAD_PREGUNTAS_INICIO = 4;

const PLANES_INICIO = ROLES_CON_PLAN.map((rol) => ({
  rol,
  titulo: TITULOS_PLAN_POR_ROL[rol] ?? rol,
  nombres: NOMBRES_PLAN_POR_ROL[rol],
  beneficios: BENEFICIOS_PLAN[rol],
}));

export default async function PaginaInicio() {
  const [ofertas, usuario] = await Promise.all([
    listarOfertasPublicadas({}),
    obtenerUsuarioActual(),
  ]);

  const destacadas = ofertas.slice(0, CANTIDAD_DESTACADAS);
  const clubes = new Set(ofertas.map((oferta) => oferta.perfiles_club?.nombre_club).filter(Boolean));
  const provincias = new Set(ofertas.map((oferta) => oferta.provincia).filter(Boolean));

  const metricas = [
    { valor: ofertas.length, etiqueta: "Ofertas publicadas hoy" },
    { valor: clubes.size, etiqueta: "Clubes con búsquedas activas" },
    { valor: Object.keys(ETIQUETAS_PUESTO_PROFESIONAL).length, etiqueta: "Puestos profesionales" },
    { valor: provincias.size, etiqueta: "Provincias con oportunidades" },
  ];

  return (
    <>
    <main className={styles.main}>
      <section className={styles.hero}>
        <div className={styles.heroFondo} aria-hidden="true" />
        <div className={styles.heroContenido}>
          <p className={styles.volantaClara}>El próximo paso en tu carrera</p>
          <h1 className={styles.titulo}>Impulsá tu carrera en el fútbol argentino</h1>
          <p className={styles.descripcion}>
            Conectamos jugadores, cuerpo técnico y staff deportivo con las búsquedas de los clubes.
            Publicá tu oferta o encontrá la tuya, y gestioná todo el proceso en un mismo lugar.
          </p>

          <div className={styles.acciones}>
            <Link href="/ofertas" className={styles.botonPrimario}>
              Buscar trabajo
            </Link>
            {/* El hero no enlaza paneles internos: cada rol los tiene en la barra de navegación. */}
            {!usuario && (
              <Link href="/registrarse" className={styles.botonSecundario}>
                Crear cuenta
              </Link>
            )}
          </div>
          {!usuario && (
            <p className={styles.heroNota}>
              ¿Ya tenés cuenta?{" "}
              <Link href="/iniciar-sesion" className={styles.enlaceTexto}>Iniciá sesión</Link>
            </p>
          )}
        </div>

        <ul className={styles.metricas}>
          {metricas.map((metrica) => (
            <li key={metrica.etiqueta}>
              <span className={styles.metricaValor}>{metrica.valor}</span>
              <span className={styles.metricaEtiqueta}>{metrica.etiqueta}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.bandaClara} aria-labelledby="tituloPuestos">
        <div className={styles.contenedor}>
          <p className={styles.volantaOscura}>MÁS QUE UN SOLO PUESTO</p>
          <h2 id="tituloPuestos" className={styles.tituloClaro}>Todo el equipo tiene su lugar</h2>
          <ul className={styles.puestos}>
            {Object.values(ETIQUETAS_PUESTO_PROFESIONAL).map((puesto) => (
              <li key={puesto}>{puesto}</li>
            ))}
          </ul>
        </div>
      </section>

      <section id="ofertas-destacadas" className={styles.seccion} aria-labelledby="tituloDestacadas">
        <div className={styles.contenedor}>
          <div className={styles.encabezadoCentrado}>
            <h2 id="tituloDestacadas" className={styles.tituloSeccion}>Ofertas destacadas</h2>
            <p className={styles.introduccion}>
              Echá un vistazo a las últimas búsquedas publicadas por los clubes de la plataforma.
            </p>
          </div>

          {destacadas.length === 0 ? (
            <p className={styles.vacio}>
              Todavía no hay ofertas publicadas. Volvé pronto o{" "}
              <Link href="/registrarse" className={styles.enlaceTexto}>creá tu cuenta</Link>{" "}
              para que te encuentren los clubes.
            </p>
          ) : (
            <ul className={styles.grillaOfertas}>
              {destacadas.map((oferta) => (
                <li key={oferta.id}>
                  <Link href={`/ofertas/${oferta.id}`} className={styles.tarjetaOferta}>
                    <span className={styles.chipPuesto}>
                      {ETIQUETAS_PUESTO_PROFESIONAL[oferta.puesto_buscado] ?? oferta.puesto_buscado}
                    </span>
                    <span className={styles.ofertaTitulo}>
                      {oferta.perfiles_club?.nombre_club ?? "Club"}
                      {oferta.posicion_juego ? ` — ${oferta.posicion_juego}` : ""}
                    </span>
                    <span className={styles.ofertaDato}>{ETIQUETAS_TIPO_CONTRATO[oferta.tipo_contrato]}</span>
                    <span className={styles.ofertaDato}>{oferta.provincia}</span>
                    <span className={styles.ofertaPie}>{oferta.categoria}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}

          <div className={styles.pieCentrado}>
            <Link href="/ofertas" className={styles.botonPrimario}>Ver todas las ofertas</Link>
          </div>
        </div>
      </section>

      <section id="para-quien" className={styles.seccion} aria-labelledby="tituloRoles">
        <div className={styles.contenedor}>
          <div className={styles.encabezadoCentrado}>
            <p className={styles.volanta}>UN ESPACIO PARA CADA ROL</p>
            <h2 id="tituloRoles" className={styles.tituloSeccion}>Distintos objetivos. Una misma plataforma.</h2>
            <p className={styles.introduccion}>
              Elegí el rol que mejor representa tu actividad y accedé a las herramientas que necesitás.
            </p>
          </div>
          <div className={styles.grillaRoles}>
            {ROLES_PUBLICOS.map((rol) => (
              <article key={rol.rol} className={styles.tarjetaRol}>
                <span className={styles.rolNumero}>{rol.numero}</span>
                <h3 className={styles.rolTitulo}>{rol.titulo}</h3>
                <p className={styles.rolTexto}>{rol.texto}</p>
                <ul className={styles.beneficios}>
                  {rol.beneficios.map((beneficio) => (
                    <li key={beneficio}><span aria-hidden="true">✓</span>{beneficio}</li>
                  ))}
                </ul>
                <Link
                  href={usuario?.rol === rol.rol ? rol.href : usuario ? "/ofertas" : "/registrarse"}
                  className={styles.enlaceRol}
                >
                  {usuario?.rol === rol.rol ? rol.accion : usuario ? "Explorar ofertas" : "Crear mi cuenta"}
                  <span aria-hidden="true">→</span>
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.bandaOscura} aria-labelledby="tituloPasos">
        <div className={styles.contenedor}>
          <div className={styles.encabezadoCentrado}>
            <p className={styles.volanta}>FORMÁ PARTE DE CFA</p>
            <h2 id="tituloPasos" className={styles.tituloSeccion}>Cómo funciona</h2>
            <p className={styles.introduccion}>
              Un recorrido simple para presentar tu experiencia y gestionar cada búsqueda.
            </p>
          </div>
          <ol className={styles.grillaPasos}>
            {PASOS.map((paso, indice) => (
              <li key={paso.titulo} className={styles.paso}>
                <span className={styles.pasoNumero}>{indice + 1}</span>
                <h3 className={styles.pasoTitulo}>{paso.titulo}</h3>
                <p className={styles.pasoTexto}>{paso.texto}</p>
              </li>
            ))}
          </ol>
          <div className={styles.pieCentrado}>
            <Link href="/como-funciona" className={styles.botonSecundario}>
              Ver el proceso completo <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </section>

      <section className={styles.bandaClara} aria-labelledby="tituloPlanes">
        <div className={styles.contenedor}>
          <div className={styles.encabezadoCentrado}>
            <p className={styles.volantaOscura}>PLANES Y SUSCRIPCIONES</p>
            <h2 id="tituloPlanes" className={styles.tituloClaro}>Empezá gratis. Ampliá cuando lo necesites.</h2>
            <p className={styles.introduccionClara}>
              Todas las cuentas arrancan con el plan Base, sin costo. El plan Pro saca los topes del
              rol para quienes necesitan mover más búsquedas o postulaciones.
            </p>
          </div>

          <div className={styles.grillaPlanes}>
            {PLANES_INICIO.map((plan) => (
              <article key={plan.rol} className={styles.tarjetaPlan}>
                <h3 className={styles.planRol}>{plan.titulo}</h3>
                <div className={styles.planNivel}>
                  <div className={styles.planNivelCabecera}>
                    <span className={styles.planNombre}>{plan.nombres.gratuito}</span>
                    <span className={styles.planPrecio}>Sin costo</span>
                  </div>
                  <ul className={styles.beneficiosClaros}>
                    {plan.beneficios.gratuito.map((beneficio) => (
                      <li key={beneficio}><span aria-hidden="true">✓</span>{beneficio}</li>
                    ))}
                  </ul>
                </div>
                <div className={styles.planNivelPro}>
                  <div className={styles.planNivelCabecera}>
                    <span className={styles.planNombrePro}>{plan.nombres.pago}</span>
                    <span className={styles.planInsignia}>Pro</span>
                  </div>
                  <ul className={styles.beneficios}>
                    {plan.beneficios.pago.map((beneficio) => (
                      <li key={beneficio}><span aria-hidden="true">✓</span>{beneficio}</li>
                    ))}
                  </ul>
                </div>
              </article>
            ))}
          </div>

          <div className={styles.pieCentrado}>
            <Link href="/planes" className={styles.botonOscuro}>
              Ver planes en detalle <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </section>

      <section className={styles.seccion} aria-labelledby="tituloPreguntas">
        <div className={`${styles.contenedor} ${styles.dosColumnas}`}>
          <div>
            <p className={styles.volanta}>ANTES DE EMPEZAR</p>
            <h2 id="tituloPreguntas" className={styles.tituloSeccion}>
              ¿Todavía con dudas? Las despejamos acá.
            </h2>
            <p className={styles.introduccion}>
              Las consultas más frecuentes sobre cuentas, ofertas y postulaciones.
            </p>
            <Link href="/preguntas-frecuentes" className={styles.enlaceSeccion}>
              Todas las preguntas frecuentes <span aria-hidden="true">→</span>
            </Link>
          </div>
          <div className={styles.preguntas}>
            {PREGUNTAS.slice(0, CANTIDAD_PREGUNTAS_INICIO).map((pregunta) => (
              <details key={pregunta.titulo} className={styles.pregunta}>
                <summary>{pregunta.titulo}<span aria-hidden="true">+</span></summary>
                <p>{pregunta.texto}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.cierre} aria-labelledby="tituloCierre">
        <div className={`${styles.contenedor} ${styles.cierreInterno}`}>
          <div>
            <p className={styles.volanta}>TU PRÓXIMO PASO</p>
            <h2 id="tituloCierre" className={styles.tituloSeccion}>
              {usuario ? "Encontrá tu próxima oportunidad." : "Sumate a CFA."}
            </h2>
            <p className={styles.cierreTexto}>
              Presentá tu talento, conectá con los clubes y organizá tu búsqueda.
            </p>
          </div>
          <Link href={usuario ? "/ofertas" : "/registrarse"} className={styles.botonPrimario}>
            {usuario ? "Explorar ofertas" : "Crear una cuenta"} <span aria-hidden="true">→</span>
          </Link>
        </div>
      </section>
    </main>
    {/* El pie institucional solo acompaña al inicio público: una sesión iniciada no lo ve. */}
    {!usuario && <PiePagina />}
    </>
  );
}
