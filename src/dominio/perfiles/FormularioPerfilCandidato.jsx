"use client";

import { ImagenAmpliable } from "@/componentes/ImagenAmpliable";
import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { guardarPerfilCandidato } from "@/dominio/perfiles/acciones";
import {
  ETIQUETAS_PUESTO_PROFESIONAL,
  PIERNAS_HABILES,
  POSICIONES_DE_JUEGO,
  PROVINCIAS_ARGENTINA,
  esPuestoDeCuerpoTecnico,
  opcionesConValorActual,
} from "@/tipos/dominio";
import { PerfilCandidato } from "./PerfilCandidato";
import { DISPONIBILIDADES, SITUACIONES, completitudPerfil } from "@/lib/perfil-candidato";
import styles from "./FormularioPerfilCandidato.module.css";

const ESTADO_INICIAL = { error: null };

export function FormularioPerfilCandidato({ perfilExistente, nombreCandidato }) {
  const router = useRouter();
  const formularioRef = useRef(null);
  const dialogoRef = useRef(null);
  const urlsRef = useRef([]);
  const [experiencias, setExperiencias] = useState(() => (perfilExistente?.experiencias ?? []).map((e, i) => ({ ...e, clave: `existente-${i}` })));
  const [borrador, setBorrador] = useState(perfilExistente ?? { puesto: "jugador" });
  const [vistaPrevia, setVistaPrevia] = useState(null);
  useEffect(() => () => urlsRef.current.forEach(url => URL.revokeObjectURL(url)), []);

  function leerBorrador() {
    const datos = new FormData(formularioRef.current);
    const campos = { puesto: "puesto", provincia: "provincia", club_actual: "clubActual", trayectoria: "trayectoria", formacion_academica: "formacionAcademica", presentacion: "presentacion", disponibilidad: "disponibilidad", situacion_club: "situacionClub", incorporacion_desde: "incorporacionDesde", posicion_juego: "posicionJuego", pierna_habil: "piernaHabil", altura_cm: "alturaCm", peso_kg: "pesoKg", titulo_o_matricula: "tituloOMatricula", licencia: "licencia", anios_experiencia: "aniosExperiencia", especialidad: "especialidad" };
    const perfil = { ...perfilExistente, experiencias };
    for (const [clave, campo] of Object.entries(campos)) perfil[clave] = String(datos.get(campo) ?? "").trim();
    perfil.dispuesto_mudarse = datos.get("dispuestoMudarse") === "" ? null : datos.get("dispuestoMudarse") === "si";
    perfil.enlaces_video = [1, 2, 3].map(n => String(datos.get(`enlaceVideo${n}`) ?? "").trim()).filter(Boolean);
    const foto = datos.get("foto"), cv = datos.get("curriculum");
    perfil.foto_url = datos.get("quitarFoto") && !foto?.size ? null : foto?.size ? "seleccionada" : perfilExistente?.foto_url;
    perfil.cv_ruta = datos.get("quitarCv") ? null : cv?.size ? "seleccionado" : perfilExistente?.cv_ruta;
    return { perfil, foto, cv };
  }

  function abrirVistaPrevia() {
    urlsRef.current.forEach(url => URL.revokeObjectURL(url));
    urlsRef.current = [];
    const { perfil, foto, cv } = leerBorrador();
    const crearUrl = archivo => { const url = URL.createObjectURL(archivo); urlsRef.current.push(url); return url; };
    if (foto?.size) perfil.foto_url = foto.type.startsWith("image/") ? crearUrl(foto) : null;
    const cvUrl = cv?.size && (cv.type === "application/pdf" || (!cv.type && cv.name.toLowerCase().endsWith(".pdf"))) ? crearUrl(cv) : undefined;
    if (cv?.size && !cvUrl) perfil.cv_ruta = null;
    setVistaPrevia({ perfil, cvUrl });
    dialogoRef.current.showModal();
  }
  const avance = completitudPerfil({ ...borrador, experiencias });
  const [estado, ejecutarGuardado, estaGuardando] = useActionState(
    guardarPerfilCandidato,
    ESTADO_INICIAL
  );
  const [puestoSeleccionado, setPuestoSeleccionado] = useState(
    perfilExistente?.puesto ?? "jugador"
  );
  const [mostrarExito, setMostrarExito] = useState(false);
  const estabaGuardandoRef = useRef(false);

  useEffect(() => {
    if (estabaGuardandoRef.current && !estaGuardando && !estado.error) {
      setMostrarExito(true);
      const temporizador = setTimeout(() => {
        router.push("/perfil-publico");
      }, 1200);
      return () => clearTimeout(temporizador);
    }
    estabaGuardandoRef.current = estaGuardando;
  }, [estaGuardando, estado.error, router]);

  const esCuerpoTecnico = esPuestoDeCuerpoTecnico(puestoSeleccionado);

  return (
    <>
    <section className={styles.progreso} aria-label="Completitud del perfil">
      <div><strong>Tu perfil, paso a paso</strong><span>{avance.porcentaje}%</span></div>
      <progress max="100" value={avance.porcentaje} aria-label="Perfil completo" />
      <p className={styles.ayuda}>{avance.faltantes.length ? `Podés sumar: ${avance.faltantes.join(", ")}.` : "¡Tu perfil tiene toda la información sugerida!"} Estos campos son opcionales, salvo puesto y provincia.</p>
    </section>
    <form ref={formularioRef} action={ejecutarGuardado} className={styles.formulario} onChange={() => { setMostrarExito(false); setBorrador(leerBorrador().perfil); }}>
      <input type="hidden" name="experiencias" value={JSON.stringify(experiencias.map(({ clave, ...e }) => e))} />
      <fieldset className={styles.fieldset}>
        <legend className={styles.leyenda}>Foto de perfil</legend>
      <CampoFoto fotoActual={perfilExistente?.foto_url} />
      </fieldset>

      <fieldset className={styles.fieldset}>
        <legend className={styles.leyenda}>Curriculum vitae</legend>
        <label htmlFor="curriculum" className={styles.etiqueta}>Subir CV en PDF (hasta 5 MB)</label>
        <input id="curriculum" name="curriculum" type="file" accept=".pdf,application/pdf"
          aria-describedby="ayuda-cv" className={styles.entradaArchivo}
          onChange={(evento) => {
            const archivo = evento.target.files?.[0];
            evento.target.setCustomValidity(archivo && archivo.size > 5_000_000 ? "El CV no puede pesar más de 5 MB." : "");
            evento.target.reportValidity();
          }} />
        <p id="ayuda-cv" className={styles.ayuda}>Los clubes que puedan ver tu perfil también podrán descargar tu CV. Al subir otro PDF, reemplazás el anterior.</p>
        {perfilExistente?.cv_ruta && <>
          <a href={`/api/candidatos/${perfilExistente.usuario_id}/cv`} className={styles.enlaceCv}>Descargar CV actual</a>
          <label className={styles.casilla}><input type="checkbox" name="quitarCv" /> Quitar CV actual</label>
        </>}
      </fieldset>

      <fieldset className={styles.fieldset}>
      <legend className={styles.leyenda}>Datos básicos</legend>
      <p className={styles.ayuda}>Tu puesto define los datos profesionales que podés completar.</p>
      <CampoSelect
        id="puesto"
        etiqueta="Puesto profesional"
        valor={puestoSeleccionado}
        onCambio={(valor) => setPuestoSeleccionado(valor)}
        opciones={Object.entries(ETIQUETAS_PUESTO_PROFESIONAL)}
      />

      <CampoLista
        id="provincia"
        etiqueta="Provincia"
        opciones={PROVINCIAS_ARGENTINA}
        valorInicial={perfilExistente?.provincia ?? ""}
        requerido
      />
      <CampoTexto
        id="clubActual"
        etiqueta="Club actual"
        valorInicial={perfilExistente?.club_actual ?? ""}
      />
      </fieldset>

      <fieldset className={styles.fieldset}>
        <legend className={styles.leyenda}>Presentación profesional</legend>
        <label className={styles.etiqueta} htmlFor="presentacion">Sobre mí</label>
        <textarea id="presentacion" name="presentacion" maxLength={600} rows={4} defaultValue={perfilExistente?.presentacion ?? ""} className={styles.entrada} placeholder="Contá qué buscás y qué podés aportar al equipo." aria-describedby="presentacion-ayuda" />
        <p id="presentacion-ayuda" className={styles.ayuda}>Hasta 600 caracteres.</p>
      </fieldset>
      <fieldset className={styles.fieldset}>
        <legend className={styles.leyenda}>Disponibilidad laboral</legend>
        <div className={styles.camposDobles}>
        <CampoLista id="disponibilidad" etiqueta="Disponibilidad para ofertas" opciones={Object.keys(DISPONIBILIDADES)} etiquetas={DISPONIBILIDADES} valorInicial={perfilExistente?.disponibilidad ?? ""} />
        <CampoLista id="situacionClub" etiqueta="Situación actual" opciones={Object.keys(SITUACIONES)} etiquetas={SITUACIONES} valorInicial={perfilExistente?.situacion_club ?? ""} />
        <CampoTexto id="incorporacionDesde" etiqueta="Podría incorporarme desde" tipo="date" valorInicial={perfilExistente?.incorporacion_desde ?? ""} />
        <CampoLista id="dispuestoMudarse" etiqueta="¿Estás dispuesto a mudarte?" opciones={["si", "no"]} etiquetas={{ si: "Sí", no: "No" }} valorInicial={perfilExistente?.dispuesto_mudarse == null ? "" : perfilExistente.dispuesto_mudarse ? "si" : "no"} />
        </div>
      </fieldset>

      {esCuerpoTecnico ? (
        <fieldset className={styles.fieldset}>
          <legend className={styles.leyenda}>
            Datos técnicos ({ETIQUETAS_PUESTO_PROFESIONAL[puestoSeleccionado]})
          </legend>
          <div className={styles.camposDobles}>
          <CampoTexto
            id="tituloOMatricula"
            etiqueta="Título / matrícula"
            valorInicial={perfilExistente?.titulo_o_matricula ?? ""}
          />
          <CampoTexto
            id="licencia"
            etiqueta="Licencia (si aplica)"
            valorInicial={perfilExistente?.licencia ?? ""}
          />
          <CampoTexto
            id="aniosExperiencia"
            etiqueta="Años de experiencia"
            tipo="number"
            valorInicial={perfilExistente?.anios_experiencia?.toString() ?? ""}
          />
          <CampoTexto
            id="especialidad"
            etiqueta="Especialidad"
            valorInicial={perfilExistente?.especialidad ?? ""}
          />
          </div>
        </fieldset>
      ) : (
        <fieldset className={styles.fieldset}>
          <legend className={styles.leyenda}>Datos deportivos</legend>
          <div className={styles.camposDobles}>
          <CampoLista
            id="posicionJuego"
            etiqueta="Posición"
            opciones={POSICIONES_DE_JUEGO}
            valorInicial={perfilExistente?.posicion_juego ?? ""}
          />
          <CampoLista
            id="piernaHabil"
            etiqueta="Pierna hábil"
            opciones={PIERNAS_HABILES}
            valorInicial={perfilExistente?.pierna_habil ?? ""}
          />
          <CampoTexto
            id="alturaCm"
            etiqueta="Altura (cm)"
            tipo="number"
            valorInicial={perfilExistente?.altura_cm?.toString() ?? ""}
          />
          <CampoTexto
            id="pesoKg"
            etiqueta="Peso (kg)"
            tipo="number"
            valorInicial={perfilExistente?.peso_kg?.toString() ?? ""}
          />
          </div>
        </fieldset>
      )}

      <fieldset className={`${styles.fieldset} ${styles.anchoCompleto}`}>
        <legend className={styles.leyenda}>Experiencia en clubes</legend>
        <p className={styles.ayuda}>Agregá primero las experiencias más recientes. Podés cargar hasta 20.</p>
        <div className={styles.listaExperiencias}>
        {experiencias.map((experiencia, indice) => <div key={experiencia.clave} className={styles.experiencia}>
          <h3>Experiencia {indice + 1}</h3>
          {[["club", "Club", 120], ["categoria", "Categoría", 100], ["temporada", "Temporada (por ejemplo, 2024–2025)", 40], ["descripcion", "Descripción", 600]].map(([campo, etiqueta, limite]) => <div className={styles.campo} key={campo}>
            <label htmlFor={`${experiencia.clave}-${campo}`} className={styles.etiqueta}>{etiqueta}</label>
            <input id={`${experiencia.clave}-${campo}`} value={experiencia[campo] ?? ""} maxLength={limite} className={styles.entrada}
              onChange={evento => setExperiencias(actuales => actuales.map(e => e.clave === experiencia.clave ? { ...e, [campo]: evento.target.value } : e))} />
          </div>)}
          <button type="button" className={styles.botonSecundario} onClick={() => setExperiencias(actuales => actuales.filter(e => e.clave !== experiencia.clave))} aria-label={`Quitar experiencia ${indice + 1}`}>Quitar experiencia</button>
        </div>)}
        </div>
        <button type="button" disabled={experiencias.length >= 20} className={styles.botonSecundario} onClick={() => setExperiencias(actuales => [...actuales, { clave: crypto.randomUUID(), club: "", categoria: "", temporada: "", descripcion: "" }])}>Agregar experiencia</button>
      </fieldset>
      <fieldset className={styles.fieldset}>
        <legend className={styles.leyenda}>Trayectoria</legend>
      <CampoTextoLargo
        id="trayectoria"
        etiqueta="Otros antecedentes / trayectoria anterior"
        valorInicial={perfilExistente?.trayectoria ?? ""}
      />
      </fieldset>
      <fieldset className={styles.fieldset}>
        <legend className={styles.leyenda}>Formación</legend>
      <CampoTextoLargo
        id="formacionAcademica"
        etiqueta="Formación académica"
        valorInicial={perfilExistente?.formacion_academica ?? ""}
      />
      </fieldset>

      <fieldset className={styles.fieldset}>
        <legend className={styles.leyenda}>
          Videos (hasta 3 enlaces de YouTube)
        </legend>
        <CampoTexto
          id="enlaceVideo1"
          etiqueta="Enlace 1"
          valorInicial={perfilExistente?.enlaces_video?.[0] ?? ""}
        />
        <CampoTexto
          id="enlaceVideo2"
          etiqueta="Enlace 2"
          valorInicial={perfilExistente?.enlaces_video?.[1] ?? ""}
        />
        <CampoTexto
          id="enlaceVideo3"
          etiqueta="Enlace 3"
          valorInicial={perfilExistente?.enlaces_video?.[2] ?? ""}
        />
      </fieldset>

      <fieldset className={styles.fieldset}>
      <legend className={styles.leyenda}>Visibilidad del perfil</legend>
      <label className={styles.casilla}>
        <input
          type="checkbox"
          name="perfilVisible"
          defaultChecked={perfilExistente?.perfil_visible ?? true}
        />
        <span>
          Aparecer en la búsqueda de candidatos de los clubes
          <span className={styles.ayuda}>
            Aunque lo desactives, los clubes a cuyas ofertas te postulaste pueden ver tu perfil.
          </span>
        </span>
      </label>
      </fieldset>

      {estado.error && <p role="alert" className={`${styles.error} ${styles.anchoCompleto}`}>{estado.error}</p>}

      {mostrarExito && <p role="status" className={`${styles.exito} ${styles.anchoCompleto}`}>Guardado con éxito</p>}

      <div className={styles.barraAcciones}>
      <p className={styles.ayuda}>Guardá para actualizar tu perfil público.</p>
      <div>
      <button type="button" disabled={estaGuardando} className={styles.botonSecundario} onClick={abrirVistaPrevia}>Vista previa sin guardar</button>
      <button
        type="submit"
        disabled={estaGuardando}
        className={styles.botonEnviar}
      >
        {estaGuardando ? "Guardando..." : "Guardar perfil"}
      </button>
      </div>
      </div>
    </form>
    <dialog ref={dialogoRef} className={styles.dialogo} aria-labelledby="titulo-vista-previa">
      <div className={styles.barraVistaPrevia}>
        <div><h2 id="titulo-vista-previa">Vista previa del perfil</h2><p className={styles.ayuda}>Estos cambios todavía no se guardaron.</p></div>
        <button type="button" autoFocus className={styles.botonSecundario} onClick={() => dialogoRef.current.close()}>Volver a editar</button>
      </div>
      {vistaPrevia && <PerfilCandidato perfil={vistaPrevia.perfil} nombreCandidato={nombreCandidato} idPerfil={perfilExistente?.usuario_id} cvUrl={vistaPrevia.cvUrl} />}
    </dialog>
    </>
  );
}

function CampoTexto({
  id,
  etiqueta,
  valorInicial,
  tipo = "text",
  requerido = false,
}) {
  return (
    <div className={styles.campo}>
      <label htmlFor={id} className={styles.etiqueta}>
        {etiqueta}
      </label>
      <input
        id={id}
        name={id}
        type={tipo}
        defaultValue={valorInicial}
        required={requerido}
        className={styles.entrada}
      />
    </div>
  );
}

function CampoTextoLargo({ id, etiqueta, valorInicial }) {
  return (
    <div className={styles.campo}>
      <label htmlFor={id} className={styles.etiqueta}>
        {etiqueta}
      </label>
      <textarea
        id={id}
        name={id}
        defaultValue={valorInicial}
        rows={3}
        className={styles.entrada}
      />
    </div>
  );
}

function CampoFoto({ fotoActual }) {
  const [vistaPrevia, setVistaPrevia] = useState(fotoActual ?? null);

  function alElegirArchivo(evento) {
    const archivo = evento.target.files?.[0];
    setVistaPrevia(archivo ? URL.createObjectURL(archivo) : fotoActual ?? null);
  }

  return (
    <div className={styles.campoFoto}>
      {vistaPrevia ? (
        // eslint-disable-next-line @next/next/no-img-element
        <ImagenAmpliable src={vistaPrevia} alt="Foto de perfil" className={styles.foto} />
      ) : (
        <div className={styles.fotoVacia}>Sin foto</div>
      )}
      <div className={styles.campo}>
        <label htmlFor="foto" className={styles.etiqueta}>
          Foto de perfil (JPG, PNG o WebP, hasta 2 MB)
        </label>
        <input
          id="foto"
          name="foto"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={alElegirArchivo}
          className={styles.entradaArchivo}
        />
        {fotoActual && (
          <label className={styles.casilla}>
            <input type="checkbox" name="quitarFoto" />
            <span>Quitar foto actual</span>
          </label>
        )}
      </div>
    </div>
  );
}

/** Select no controlado de una lista de textos; incluye el valor guardado aunque no esté en la lista. */
function CampoLista({ id, etiqueta, opciones, etiquetas, valorInicial, requerido = false }) {
  return (
    <div className={styles.campo}>
      <label htmlFor={id} className={styles.etiqueta}>
        {etiqueta}
      </label>
      <select
        id={id}
        name={id}
        defaultValue={valorInicial}
        required={requerido}
        className={styles.entrada}
      >
        <option value="">Elegí una opción</option>
        {opcionesConValorActual(opciones, valorInicial).map((opcion) => (
          <option key={opcion} value={opcion}>
            {etiquetas?.[opcion] ?? opcion}
          </option>
        ))}
      </select>
    </div>
  );
}

function CampoSelect({ id, etiqueta, valor, onCambio, opciones }) {
  return (
    <div className={styles.campo}>
      <label htmlFor={id} className={styles.etiqueta}>
        {etiqueta}
      </label>
      <select
        id={id}
        name={id}
        value={valor}
        onChange={(evento) => onCambio(evento.target.value)}
        className={styles.entrada}
      >
        {opciones.map(([clave, texto]) => (
          <option key={clave} value={clave}>
            {texto}
          </option>
        ))}
      </select>
    </div>
  );
}
