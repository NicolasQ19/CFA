import { redirect } from "next/navigation";
import Link from "next/link";
import { obtenerUsuarioActual } from "@/dominio/autenticacion/sesion";
import { obtenerPerfilCandidato } from "@/dominio/perfiles/consultas";
import { FormularioPerfilCandidato } from "@/dominio/perfiles/FormularioPerfilCandidato";
import { obtenerPerfilRepresentante } from "@/dominio/representantes/consultas";
import { FormularioPerfilRepresentante } from "@/dominio/representantes/FormularioPerfilRepresentante";
import styles from "./page.module.css";

export default async function PaginaMiPerfil() {
  const usuario = await obtenerUsuarioActual();

  if (!usuario) {
    redirect("/iniciar-sesion");
  }

  if (usuario.rol === "representante") {
    const perfil = await obtenerPerfilRepresentante(usuario.id);
    return <main className={styles.main}>
      <header className={styles.cabecera}>
      <div>
      <p className={styles.volanta}>REPRESENTANTE / AGENCIA</p>
      <h1 className={styles.titulo}>Mi perfil</h1>
      <p className={styles.subtitulo}>Presentá tu agencia, especialización y zona de trabajo. La información profesional y el contacto que guardes se mostrarán en tu perfil público.</p>
      </div>
      <div className={styles.accesos}>
        <Link href={`/perfil-publico-representante?id=${usuario.id}`} className={styles.enlace}>Ver mi perfil público ↗</Link>
        <Link href="/mi-cartera" className={styles.enlace}>Ir a mi cartera →</Link>
      </div>
      </header>
      <div className={styles.contenido}><FormularioPerfilRepresentante perfilActual={perfil} nombreActual={usuario.nombre_completo} /></div>
    </main>;
  }
  if (usuario.rol !== "candidato") {
    redirect("/");
  }

  const perfilExistente = await obtenerPerfilCandidato(usuario.id);

  return (
    <main className={styles.main}>
      <header className={styles.cabecera}>
      <div>
      <p className={styles.volanta}>TU PRESENTACIÓN PROFESIONAL</p>
      <h1 className={styles.titulo}>Mi perfil profesional</h1>
      <p className={styles.subtitulo}>
        Organizá tu experiencia y material profesional para que los clubes puedan conocer tu perfil.
      </p>
      </div>
      <div className={styles.accesos}><Link href="/perfil-publico" className={styles.enlace}>Ver mi perfil público ↗</Link><Link href="/ofertas" className={styles.enlace}>Explorar ofertas →</Link></div>
      </header>

      <div className={styles.contenido}>
        <FormularioPerfilCandidato perfilExistente={perfilExistente} nombreCandidato={usuario.nombre_completo} />
      </div>
    </main>
  );
}
