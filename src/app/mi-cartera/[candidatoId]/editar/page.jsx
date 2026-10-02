import { notFound, redirect } from "next/navigation";
import { obtenerUsuarioActual } from "@/dominio/autenticacion/sesion";
import { obtenerCandidatoRepresentado } from "@/dominio/representantes/consultas";
import { FormularioNuevoRepresentado } from "@/dominio/representantes/FormularioNuevoRepresentado";
import styles from "../../nuevo/page.module.css";

export const dynamic = "force-dynamic";

export default async function PaginaEditarRepresentado({ params }) {
  const usuario = await obtenerUsuarioActual();

  if (!usuario) {
    redirect("/iniciar-sesion");
  }

  if (usuario.rol !== "representante") {
    redirect("/");
  }

  const { candidatoId } = await params;
  const candidato = await obtenerCandidatoRepresentado(candidatoId, usuario.id);

  if (!candidato) {
    notFound();
  }

  return (
    <main className={styles.main}>
      <div className={styles.cabecera}>
        <h1 className={styles.titulo}>Editar Ficha del Representado</h1>
        <p className={styles.subtitulo}>
          Modificá los datos deportivos, videos o trayectoria de {candidato.nombre_completo || "este talento"}.
        </p>
      </div>

      <FormularioNuevoRepresentado candidatoExistente={candidato} />
    </main>
  );
}
