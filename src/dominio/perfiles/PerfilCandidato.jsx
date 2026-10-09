import { ImagenAmpliable } from "@/componentes/ImagenAmpliable";
import Link from "next/link";
import { extraerIdVideoYoutube } from "@/lib/youtube";
import { DISPONIBILIDADES, SITUACIONES } from "@/lib/perfil-candidato";
import { ETIQUETAS_PUESTO_PROFESIONAL, esPuestoDeCuerpoTecnico } from "@/tipos/dominio";
import styles from "@/app/perfil-publico/page.module.css";

export function PerfilCandidato({ perfil, nombreCandidato, idPerfil, editable = false, cvUrl }) {
  const esVistaAjena = !editable;
  return (
    <article className={styles.main}>
      <div className={styles.encabezado}>
        {perfil?.foto_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <ImagenAmpliable src={perfil.foto_url} alt={`Foto de ${nombreCandidato}`} className={styles.foto} />
        ) : <div className={styles.avatar} aria-hidden="true">{nombreCandidato?.trim().split(/\s+/).slice(0, 2).map(p => p[0]).join("") || "C"}</div>}
        <div className={styles.encabezadoTexto}>
          <h1 className={styles.titulo}>
            {nombreCandidato}
          </h1>
          <p className={styles.subtitulo}>
            {esVistaAjena
              ? "Perfil profesional del candidato."
              : "Así ven los clubes tu perfil profesional."}
          </p>
          {perfil && <div className={styles.insignias}>
            <span>{ETIQUETAS_PUESTO_PROFESIONAL[perfil.puesto]}</span>
            {perfil.provincia && <span>{perfil.provincia}</span>}
            {perfil.puesto === "jugador" && perfil.posicion_juego && <span>{perfil.posicion_juego}</span>}
            {perfil.puesto === "jugador" && perfil.pierna_habil && <span>Pierna {perfil.pierna_habil}</span>}
            {perfil.disponibilidad && <span>{DISPONIBILIDADES[perfil.disponibilidad]}</span>}
          </div>}
        </div>
        <div className={styles.accionesPerfil}>
        {perfil?.cv_ruta && <a href={cvUrl ?? `/api/candidatos/${idPerfil}/cv`} className={styles.enlaceCv} download="curriculum.pdf">Descargar CV en PDF</a>}
        {editable && (
          <Link href="/mi-perfil" className={styles.enlaceEditar}>
            Editar perfil
          </Link>
        )}
        </div>
      </div>

      {!perfil ? (
        <p className={styles.vacio}>
          {esVistaAjena ? (
            "Este candidato todavía no completó su perfil."
          ) : (
            <>
              Todavía no completaste tu perfil.{" "}
              <Link href="/mi-perfil">Completalo acá</Link>.
            </>
          )}
        </p>
      ) : (
        <div className={styles.tarjeta}>
          <section className={styles.seccion}>
            <h2 className={styles.leyenda}>Información profesional</h2>
            <div className={styles.grilla}>
              <Dato etiqueta="Puesto profesional" valor={ETIQUETAS_PUESTO_PROFESIONAL[perfil.puesto]} />
              <Dato etiqueta="Provincia" valor={perfil.provincia} />
              <Dato etiqueta="Club actual" valor={perfil.club_actual} />
            </div>
          </section>
          <section className={styles.seccion}>
            <h2 className={styles.leyenda}>Disponibilidad laboral</h2>
            <div className={styles.grilla}>
              <Dato etiqueta="Situación actual" valor={SITUACIONES[perfil.situacion_club]} />
              <Dato etiqueta="Incorporación desde" valor={perfil.incorporacion_desde?.split("-").reverse().join("/")} />
              <Dato etiqueta="Disponibilidad para mudarse" valor={perfil.dispuesto_mudarse == null ? null : perfil.dispuesto_mudarse ? "Sí" : "No"} />
            </div>
            {!perfil.situacion_club && !perfil.incorporacion_desde && perfil.dispuesto_mudarse == null && <p className={styles.subtitulo}>Sin información adicional.</p>}
          </section>
          {esPuestoDeCuerpoTecnico(perfil.puesto) ? (
            <div className={styles.seccion}>
              <span className={styles.leyenda}>Datos técnicos</span>
              <div className={styles.grilla}>
                <Dato etiqueta="Título / matrícula" valor={perfil.titulo_o_matricula} />
                <Dato etiqueta="Licencia" valor={perfil.licencia} />
                <Dato etiqueta="Años de experiencia" valor={perfil.anios_experiencia?.toString() ?? null} />
                <Dato etiqueta="Especialidad" valor={perfil.especialidad} />
              </div>
            </div>
          ) : (
            <div className={styles.seccion}>
              <span className={styles.leyenda}>Datos deportivos</span>
              <div className={styles.grilla}>
                <Dato etiqueta="Posición" valor={perfil.posicion_juego} />
                <Dato etiqueta="Pierna hábil" valor={perfil.pierna_habil} />
                <Dato etiqueta="Altura (cm)" valor={perfil.altura_cm?.toString() ?? null} />
                <Dato etiqueta="Peso (kg)" valor={perfil.peso_kg?.toString() ?? null} />
              </div>
            </div>
          )}

          {perfil.presentacion && <section className={styles.seccion}><h2 className={styles.leyenda}>Sobre mí</h2><p className={styles.texto}>{perfil.presentacion}</p></section>}

          {perfil.experiencias?.length > 0 && <section className={`${styles.seccion} ${styles.seccionAncha}`}>
            <h2 className={styles.leyenda}>Experiencia en clubes</h2>
            <ol className={styles.experiencias}>{perfil.experiencias.map((experiencia, indice) => <li key={indice}>
              <h3>{experiencia.club}</h3><p className={styles.subtitulo}>{experiencia.categoria} · {experiencia.temporada}</p>
              {experiencia.descripcion && <p className={styles.texto}>{experiencia.descripcion}</p>}
            </li>)}</ol>
          </section>}
          {perfil.trayectoria && (
            <div className={styles.seccion}>
              <span className={styles.leyenda}>Trayectoria</span>
              <p className={styles.texto}>{perfil.trayectoria}</p>
            </div>
          )}

          {perfil.formacion_academica && (
            <div className={styles.seccion}>
              <span className={styles.leyenda}>Formación académica</span>
              <p className={styles.texto}>{perfil.formacion_academica}</p>
            </div>
          )}

          {perfil.enlaces_video?.length > 0 && <section className={`${styles.seccion} ${styles.seccionAncha}`}>
            <h2 className={styles.leyenda}>Videos</h2>
            <div className={styles.listaVideos}>
              {[...new Set(perfil.enlaces_video)].map(enlace => {
                const idVideo = extraerIdVideoYoutube(enlace);
                return idVideo ? <iframe key={enlace} src={`https://www.youtube-nocookie.com/embed/${idVideo}`} title={`Video de ${nombreCandidato}`} allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen loading="lazy" className={styles.video} /> : <p key={enlace} className={styles.subtitulo}>Revisá este enlace de YouTube: {enlace}</p>;
              })}
            </div>
          </section>}


        </div>
      )}
    </article>
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
