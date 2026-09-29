import { redirect } from "next/navigation";
import { obtenerUsuarioActual } from "@/dominio/autenticacion/sesion";
import { FormularioNuevoRepresentado } from "@/dominio/representantes/FormularioNuevoRepresentado";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

export default async function PaginaNuevoRepresentado() {
  const usuario = await obtenerUsuarioActual();

  if (!usuario) {
    redirect("/iniciar-sesion");
  }

  if (usuario.rol !== "representante") {
    redirect("/");
  }

  return (
    <main className={styles.main}>
      <div className={styles.cabecera}>
        <h1 className={styles.titulo}>Cargar Nuevo Representado</h1>
        <p className={styles.subtitulo}>
          Registrá los datos deportivos y profesionales del talento que gestionás en tu agencia.
        </p>
      </div>

      <FormularioNuevoRepresentado />
    </main>
  );
}
