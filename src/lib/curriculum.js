export const BUCKET_CV = "curriculums";
export const TAMANIO_MAXIMO_CV = 5_000_000;

export async function validarCurriculum(archivo) {
  if (!(archivo instanceof File) || archivo.size === 0) return null;
  if (archivo.size > TAMANIO_MAXIMO_CV) return "El CV no puede pesar más de 5 MB.";
  if (!archivo.name.toLowerCase().endsWith(".pdf") || (archivo.type && archivo.type !== "application/pdf")) {
    return "El curriculum tiene que ser un archivo PDF.";
  }
  const cabecera = new TextDecoder().decode(await archivo.slice(0, 5).arrayBuffer());
  if (cabecera !== "%PDF-") return "El archivo seleccionado no es un PDF válido.";
  return null;
}
