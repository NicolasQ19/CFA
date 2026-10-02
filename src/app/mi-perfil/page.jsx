import { redirect } from "next/navigation";
import { obtenerUsuarioActual } from "@/dominio/autenticacion/sesion";
import { obtenerPerfilCandidato } from "@/dominio/perfiles/consultas";
import { FormularioPerfilCandidato } from "@/dominio/perfiles/FormularioPerfilCandidato";
import styles from "./page.module.css";

export default async function PaginaMiPerfil() {
  const usuario = await obtenerUsuarioActual();

  if (!usuario) {
    redirect("/iniciar-sesion");
  }

  if (usuario.rol !== "candidato") {
    redirect("/");
  }

  const perfilExistente = await obtenerPerfilCandidato(usuario.id);

  return (
    <main className={styles.main}>
      <h1 className={styles.titulo}>Mi perfil profesional</h1>
      <p className={styles.subtitulo}>
        Completá tu perfil para que los clubes puedan encontrarte y postularte a ofertas.
      </p>

      <div className={styles.contenido}>
        <FormularioPerfilCandidato perfilExistente={perfilExistente} nombreCandidato={usuario.nombre_completo} />
      </div>
    </main>
  );
}