# Activar curriculums de candidatos

## Cancelación de postulaciones propias del candidato

Un candidato activo puede cancelar sus propias postulaciones desde la oferta publicada o desde Mis postulaciones, incluso si la oferta ya está pausada o cerrada. Se usa la política RLS existente `candidato_gestiona_sus_propias_postulaciones`; no requiere migración nueva. La cancelación elimina la postulación, actualiza los paneles y permite enviarla de nuevo si la oferta sigue publicada.

Verificar con una cuenta de candidato: enviar una postulación, cancelar la confirmación sin cambios, confirmar la cancelación desde ambos accesos y comprobar que desaparezca de Mis postulaciones y del listado del club. Otra cuenta no debe poder cancelar esa fila, y un fallo del servicio no debe mostrarse como éxito.

## Mi perfil y perfil público del representante

La edición del representante está en `/mi-perfil`; `/mi-cartera` conserva la gestión de candidatos y postulaciones. La navegación incluye Mi perfil, Mi perfil público y Mi cartera. El perfil público se comparte con `/perfil-publico-representante?id=<usuario_id>`.

Después de las migraciones de contacto y presentación del representante, ejecutar `migrations/20261008_perfil_publico_representante.sql`. La función de lectura permite a visitantes y usuarios autenticados consultar solo nombre de agencia, foto, presentación, especialización, zona de trabajo, país y contacto profesional de representantes activos. No publica correo de acceso, cartera, CVs de representados ni postulaciones, y no amplía las políticas RLS de las tablas.

El dueño puede revisar su propia página con los permisos existentes; la lectura de otras cuentas y visitantes requiere aplicar la nueva migración. Comprobar: editar y guardar desde Mi perfil; abrir Mi perfil público; abrir la URL en una sesión anónima; verificar que una cuenta inactiva o un ID inexistente no se muestre. Un visitante no debe poder modificar el perfil por la API.

## Filtros de candidatos y cancelación de postulaciones

Ejecutar `migrations/20261008_datos_personales_representados.sql` después de `20261003_perfil_representante_contacto.sql`. Agrega nombres, apellidos y fecha de nacimiento opcionales; las nuevas funciones guardan estos datos junto con la ficha en una transacción. Mantiene las funciones anteriores y los nombres completos existentes, sin inferir apellidos compuestos. En fichas antiguas, separar manualmente nombres y apellidos desde Editar datos.

En una oferta, comprobar búsqueda por nombre o apellido, orden A–Z/Z–A, edades de menor a mayor o mayor a menor, rango inclusivo y provincia. Quienes no tienen fecha de nacimiento quedan fuera del rango de edad y al final del orden por edad. Solo se ofrecen candidatos del puesto solicitado que todavía no están postulados.

La cancelación usa las políticas RLS existentes: solo un representante activo puede retirar una postulación enviada por él para un candidato de su cartera. Se elimina la postulación y puede enviarse nuevamente mientras la oferta esté publicada. Comprobar desde el detalle de oferta y Mi cartera, incluyendo confirmación, actualización de ambas vistas y rechazo de intentos de otra cuenta. Esta cancelación no requiere una migración nueva.

## Presentación profesional del representante

Ejecutar `migrations/20261008_presentacion_representante.sql` en el SQL Editor del proyecto configurado en `.env.local`, después de las migraciones anteriores. Agrega presentación (2000 caracteres), especialización y zona de trabajo (300 caracteres cada una). Todos son opcionales; no modifica las políticas RLS ni los datos existentes.

Desde Mi perfil, completar los tres campos, guardar y recargar para comprobar persistencia. Borrarlos y guardar debe dejarlos vacíos. Probar también un perfil anterior sin estos datos. El formulario valida los límites y el servidor los comprueba antes de subir archivos. La persistencia remota requiere aplicar esta migración y usar una cuenta de representante activa.

Pruebas locales: `node --test tests/perfil-representante.test.js`.

En el proyecto de Supabase que usa `.env.local`, abrir **SQL Editor**, pegar el contenido de `migrations/20260928_curriculum_candidato.sql` y ejecutarlo una vez.

La migración agrega `perfiles_candidato.cv_ruta`, crea el bucket privado `curriculums` (PDF, hasta 5 MB) y configura permisos: cada candidato activo puede subir su propio CV; su dueño, administradores activos y clubes activos con acceso al perfil pueden descargarlo. No requiere una clave de servicio en la aplicación.

Reiniciar `npm run dev` si estaba ejecutándose antes del cambio de límite del formulario.

## Verificación con cuentas de prueba

- Desde Mi perfil, subir un PDF y guardar. Descargarlo desde el perfil y comparar el archivo.
- Reemplazarlo y comprobar que se descarga el nuevo; quitarlo y comprobar que desaparece el enlace.
- Guardar sin seleccionar archivo conserva el CV existente.
- Rechazar un archivo que no sea PDF y uno de más de 5 MB.
- Un visitante sin sesión o un candidato ajeno no puede descargarlo, aun conociendo la URL.
- Un club puede descargar un perfil visible o uno oculto que se postuló a sus ofertas; otro club no puede descargar ese perfil oculto.

Las pruebas locales de validación se ejecutan con `node --test tests/curriculum.test.js`. La subida y los permisos remotos requieren aplicar la migración y comprobarlos con sesiones reales.

## Mejoras del perfil del candidato

Ejecutar una vez `migrations/20260929_mejoras_perfil_candidato.sql` en el SQL Editor del mismo proyecto. Agrega presentación, disponibilidad, situación de club, fecha de incorporación, disposición a mudarse y experiencias organizadas. No borra la trayectoria anterior ni cambia los permisos existentes del perfil.

La migración de CV anterior se ejecuta solo si aún no fue aplicada. Las lecturas de perfiles antiguos siguen funcionando; para guardar los nuevos campos se necesita esta nueva migración.

Comprobar con una cuenta de candidato: agregar y quitar experiencias, abrir la vista previa antes de guardar (incluyendo un PDF y foto nuevos), cerrar con Escape o Volver a editar, guardar y recargar el perfil. Verificar también un perfil de cuerpo técnico y la visibilidad desde un club autorizado. La completitud es orientativa: no exige foto, CV ni experiencias para guardar.

Pruebas: `node --test tests/*.test.js`. La persistencia remota requiere aplicar las migraciones y usar una sesión real.

## Perfil y gestión del club

Ejecutar una vez `migrations/20260930_mejoras_club.sql` en el SQL Editor del proyecto configurado. Agrega los campos institucionales, el bucket público de escudos y la tabla privada `seguimiento_club` con RLS. No modifica los estados existentes de las postulaciones: las cinco etapas son un seguimiento interno independiente. Las notas nunca se incorporan a las consultas de perfiles públicos ni a las postulaciones del candidato.

Verificación luego de aplicar SQL:

- Con un club activo, guardar localidad, descripción, instalaciones y enlaces; subir, reemplazar y quitar su escudo. Revisar el perfil público desde otra sesión.
- Verificar que el perfil muestre solo ofertas publicadas y que sus enlaces lleven a la página de postulación.
- Abrir postulantes de una oferta propia, descargar un CV permitido, cambiar etapa y guardar notas. Recargar y comprobar persistencia y filtros.
- Verificar que el estado informado al candidato pueda gestionarse independientemente.
- Con otro club, candidato y visitante, comprobar que no se puedan leer ni escribir filas en `seguimiento_club` por la API de Supabase, ni gestionar postulaciones ajenas.
- Revisar el resumen: activas = ofertas publicadas; nuevas = recibidas en las últimas 168 horas; pendientes = etapa Recibido; total = todas las postulaciones propias.
- Hasta aplicar la migración, el panel indica que no puede cargar el seguimiento o el resumen. La persistencia y las políticas remotas requieren esta comprobación con cuentas reales.

## Gestión directa de representados por agencias

Ejecutar una vez `migrations/20261001_representante_crea_candidatos.sql` en el SQL Editor del proyecto.
Permite que los usuarios con rol `representante` carguen directamente la ficha deportiva o técnica de sus propios representados (sin necesidad de que el jugador se cree cuenta ni recuerde contraseñas), vinculándolos automáticamente a su cartera y habilitándolos para postularse a ofertas laborales.

## Edición de representados y lectura de nombres
Ejecutar una vez `migrations/20261002_edicion_y_nombres_representados.sql` en el SQL Editor del proyecto.
Habilita la edición de la ficha técnica y deportiva de los representados y garantiza la lectura de los nombres de candidatos en la cartera.

## Perfil de representante, datos de contacto, foto y CVs
Ejecutar una vez `migrations/20261003_perfil_representante_contacto.sql` en el SQL Editor del proyecto.
Agrega campos de contacto a la agencia (teléfono, email de contacto, nacionalidad, sitio web y foto/logo), actualiza la función RPC `listar_cartera_representante` y otorga permisos de Storage y RLS para subir fotos y currículums (PDF) tanto para la agencia como para los representados.


