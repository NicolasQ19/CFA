# Activar curriculums de candidatos

## Verificación manual de clubes

Ejecutar una vez **`migrations/20261023_verificacion_clubes.sql`** en el SQL Editor del proyecto configurado en `.env.local`, después de las migraciones anteriores. No elimina clubes, perfiles, ofertas ni postulaciones. Tanto los clubes existentes como los nuevos quedan pendientes: ninguno se aprueba automáticamente. Hasta aplicar la migración, los accesos del club quedan bloqueados por defecto.

El club completa nombre, provincia y localidad en Mi club, y envía la liga/asociación, solicitante, cargo, correo y teléfono institucionales y URL oficial. El administrador revisa en `/admin/clubes`, busca independientemente un contacto oficial, confirma la autorización de la persona y registra el canal utilizado y una observación. Puede verificar o rechazar, incluso revocar una aprobación previa. El club recibe el resultado en su campana y puede corregir y reenviar una solicitud rechazada.

Solo una cuenta activa con rol administrador puede resolver mediante la función SQL; el club no tiene permisos de escritura directa en la tabla de verificación. La insignia pública se deriva de esta tabla, no de un valor enviado por el formulario. Cambiar nombre, ubicación o canales oficiales, o borrar el perfil, invalida la aprobación y requiere revisión nuevamente. Los datos de contacto de la solicitud y la revisión solo son legibles por el club y administradores; el perfil público muestra únicamente la insignia.

Las comprobaciones de páginas y acciones se refuerzan en PostgreSQL: los clubes sin verificar no publican ni gestionan ofertas, no acceden a perfiles/datos de candidatos, postulaciones o CV. Una oferta de un club que deja de estar verificado sale del listado público hasta recuperar la verificación. También se bloquea que una cuenta se asigne el rol administrador o cambie su propia habilitación. Las notificaciones consultadas con clave de servicio verifican primero el estado del club y no devuelven datos de postulantes a clubes pendientes o rechazados.

Validación local: `node --test tests/*.test.js`. La prueba `tests/verificacion-clubes-db.mjs` aplica la migración y comprueba permisos, solicitudes, revisión, insignia, cambio de identidad y revocación en PostgreSQL aislado con `@electric-sql/pglite`. Para ejecutarla sin agregar dependencias al proyecto, instalar el paquete en un directorio temporal y definir `CFA_PGLITE_MODULE` con la ruta a su `dist/index.js` antes de ejecutar `node tests/verificacion-clubes-db.mjs`.

Después de aplicar SQL, comprobar con sesiones de club y administrador: completar perfil y solicitud; intentar publicar/buscar candidatos antes de aprobar; verificar tras contactar al club; comprobar insignia y permisos; rechazar y verificar el aviso al club; corregir y reenviar; cambiar la identidad y comprobar que vuelve a pendiente. La revisión real de identidad y autorización la realiza el administrador fuera de la aplicación.

## Notificaciones de postulaciones

Ejecutar **`migrations/20261102_aviso_cambio_descripcion_oferta.sql`** para que candidatos y representantes reciban un aviso cuando el club edita la descripción de una oferta ya publicada o pausada. La migración agrega `ofertas_laborales.descripcion_actualizada_en` y un trigger que la completa solo en esos estados: la edición previa a la primera publicación no genera aviso porque todavía no hay postulantes. El aviso aparece si el cambio es posterior a la postulación y enlaza al detalle público de la oferta.

La campana del navbar está disponible para clubes, candidatos y representantes. El club recibe avisos de las postulaciones que siguen en estado `postulado`, con el nombre del candidato y un enlace a su ficha en Postulantes. También incluye las enviadas por representantes. Al cambiar el estado, la postulación sale de los avisos pendientes del club.

El candidato ve el último estado de cada postulación actualizada, con el club, la oferta y la fecha del cambio. No se genera un aviso inicial al postularse, pero sí se muestra si el club vuelve a cambiarla a `postulado`. Los avisos reflejan el estado actual, sin guardar un historial de estados. Las notas y etapas privadas de `seguimiento_club` no generan avisos.

El representante recibe el mismo tipo de aviso para las postulaciones que él envió, filtradas por `postulado_por_representante_id` de la sesión autenticada. Cada aviso incluye el club, el nombre del representado, la oferta y el estado actualizado, con enlace a esa postulación en Mi cartera. No recibe las enviadas directamente por el candidato ni por otro representante. Comparte la actualización cada 15 segundos y el registro de lecturas del resto de las campanas; no requiere una migración nueva.

La campana del club incluye además sus ofertas actualmente publicadas o rechazadas, con el puesto, fecha de actualización y enlace a la oferta en Mis ofertas. Comparte el contador con las postulaciones. Refleja el estado actual de cada oferta, sin atribuir autoría ni conservar un historial: una oferta que el club vuelve a publicar también aparece como publicada; si pasa a pausada o cerrada, sale de estos avisos.

En los cuatro roles, abrir un aviso lo marca como leído y descuenta uno del contador. Reabrirlo no vuelve a descontar. Las lecturas se guardan por cuenta y rol en `localStorage`, persisten al recargar y se sincronizan entre pestañas del mismo navegador; no se sincronizan entre dispositivos. Si cambia la fecha o el mensaje, cuenta como un nuevo aviso sin leer. El desplegable prioriza los no leídos, conserva los leídos identificados como tales y muestra todos los avisos en una lista desplazable. El botón “Eliminar notificaciones” borra del panel todos los avisos actuales para esa cuenta y rol en el navegador, también los leídos; persiste al recargar y se sincroniza entre pestañas. Los nuevos avisos o cambios de estado vuelven a aparecer. El panel del club ya no incluye el enlace “Ver mi club”. Los endpoints recorren todas las páginas para contar correctamente aunque haya más de ocho avisos o más de 1000 filas.

Se consulta cada 15 segundos, al abrir la campana o volver a la pestaña. No requiere migraciones nuevas: usa las postulaciones existentes. `/api/notificaciones` valida la sesión y que la cuenta esté activa, limita las consultas al destinatario autenticado y devuelve solo datos del aviso. Usa `SUPABASE_SERVICE_ROLE_KEY` exclusivamente en el servidor para conservar el nombre del club aunque su oferta esté pausada o cerrada.

Pruebas automatizadas: `node --test tests/notificaciones-postulaciones.test.js`. Para comprobar el flujo completo, postularse como candidato; consultar la campana del club; cambiar el estado informado al candidato; consultar su campana. Verificar que las notas privadas no aparezcan y que otra cuenta no reciba esos avisos.

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

En Postulantes, la etapa interna, notas y estado informado al candidato comparten el botón **Guardar seguimiento**. Cambiar el desplegable o los botones rápidos solo modifica el borrador local. El estado público se actualiza al enviar el formulario, después de guardar el seguimiento privado; guardar sin cambiarlo no modifica su fecha ni genera otra novedad. Si falla el estado después de guardar las notas, se informa el guardado parcial para que el club revise y reintente. Las notas y la etapa interna siguen siendo privadas e independientes del estado seleccionado.

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



## Gestión de cuentas de usuarios por administración

Ejecutar una vez **`migrations/20261029_gestion_usuarios_admin.sql`** en el SQL Editor del proyecto configurado en `.env.local` si no está configurada `SUPABASE_SERVICE_ROLE_KEY`. Agrega la política RLS `administradores_actualizan_estado_usuarios` sobre `public.usuarios` y refuerza el trigger `proteger_privilegios_usuario` para impedir que cualquier rol altere el rol asignado o que un administrador desactive su propia cuenta.

Desde `/admin/usuarios`, un administrador activo puede filtrar por rol (`club`, `candidato`, `representante`, `administrador`), estado (`activos`, `inactivos`) o búsqueda por nombre/correo, y activar o desactivar cuentas. Las fichas creadas por representantes (`@cfa.local`) se identifican como “Ficha de cartera” sin acceso de login propio.

## Recuperación de contraseña por correo electrónico

En el panel de Supabase (**Authentication → URL Configuration → Redirect URLs**), agregar la URL de retorno del entorno (`http://localhost:3000/**` en desarrollo local y el dominio productivo con `/**` en despliegue) para que `resetPasswordForEmail` redirija a `/auth/confirmar?next=/restablecer-contrasena`.

No requiere migración SQL adicional: utiliza Supabase Auth (`/recuperar-contrasena`, `/auth/confirmar` y `/restablecer-contrasena`), preserva la no enumeración de cuentas y bloquea el restablecimiento en cuentas suspendidas (`cuenta_activa = false`).

## Integridad de edición y cierre definitivo de ofertas

Ejecutar una vez **`migrations/20261030_proteger_edicion_y_cierre_ofertas.sql`** en el SQL Editor del proyecto para reforzar en PostgreSQL las mismas reglas aplicadas por la interfaz y las Server Actions:

- Cerrar una oferta es definitivo para el club (no puede reabrirse ni editarse).
- El puesto, posición, categoría, tipo de contrato y provincia solo pueden modificarse mientras la oferta esté en `pendiente_moderacion` o `rechazada` y no registre postulantes.
- Editar la descripción de una oferta publicada o pausada mantiene fijas sus condiciones principales.

Ejecutar después **`migrations/20261101_editar_descripcion_sin_remoderacion.sql`**: la moderación previa queda limitada a la primera publicación. Una oferta `publicada` o `pausada` puede corregir su descripción sin salir del listado público ni volver a `pendiente_moderacion`; solo las ofertas `pendiente_moderacion` y `rechazada` siguen obligadas a pasar por administración antes de publicarse.

## Planes de suscripción

Ejecutar **`migrations/20261103_suscripciones.sql`**. Crea el enum `plan_suscripcion` (`gratuito` / `pago`), la tabla `suscripciones` (una fila por usuario, con `inicia_en`, `vence_en`, `activada_por` y `observaciones`) y la función `public.plan_vigente(uuid)`, que devuelve `gratuito` cuando no hay fila o cuando el plan pago venció.

El plan se guarda con un único valor por usuario: los cupos concretos se derivan de la combinación (rol, plan) en `src/lib/suscripciones.js`, de modo que no puede existir un candidato con plan de club. Cupos del plan gratuito: 3 ofertas activas para el club, 3 postulaciones mensuales para el candidato y 6 para el representante. El plan pago no tiene tope.

La activación es manual: cada usuario solo lee su propia suscripción y únicamente un administrador activo (`public.es_administrador_activo()`) puede crearla, modificarla o darla de baja. Un plan vencido no borra nada: el club que quedó por encima del cupo conserva sus ofertas, pero no puede publicar nuevas hasta bajar del límite.

Ejecutar después **`migrations/20261104_limite_ofertas_activas_plan.sql`**, que aplica el cupo en la base: `public.limite_ofertas_activas_del_plan(uuid)` devuelve 3 para el plan gratuito y `null` (sin tope) para el pago, y el trigger `controlar_cupo_ofertas_club` rechaza crear una oferta o reactivar una pausada por encima del límite. Solo cuentan los estados `pendiente_moderacion`, `publicada` y `pausada`: las cerradas y rechazadas liberan cupo. Un cambio de estado entre dos estados que ya ocupaban cupo no vuelve a validarse, para que la moderación del administrador no quede bloqueada.

## Eliminar ofertas del club

Ejecutar **`migrations/20261105_eliminar_oferta_sin_postulantes.sql`**. El club puede eliminar definitivamente cualquier oferta propia desde Mis ofertas, en cualquier estado y tenga o no candidatos postulados. Como `postulaciones` depende de la oferta con `on delete cascade`, el borrado se lleva también las postulaciones recibidas.

Para que los candidatos no pierdan el rastro en silencio, la migración crea `avisos_ofertas_eliminadas`: antes de borrar, la acción registra un aviso por postulante con el nombre del club y el título de la oferta, y ese aviso sobrevive a la oferta borrada. Si el aviso no puede registrarse, la oferta no se elimina. Cada destinatario lee solo sus avisos; el club únicamente puede insertarlos a su propio nombre y nadie puede editarlos ni borrarlos. Candidatos y representantes los ven en la campana de notificaciones.

Si la migración anterior de este archivo ya se había aplicado, el script elimina el trigger `proteger_eliminacion_oferta_club` que bloqueaba el borrado con postulantes. Eliminar una oferta libera cupo del plan.

## Alta y baja del plan Pro

Ejecutar **`migrations/20261106_suscripcion_autogestionada.sql`**. Hace dos cosas:

1. Corrige el mensaje del cupo de ofertas, que también lee el administrador al moderar: ahora dice «El club alcanzó el número máximo de ofertas publicadas según su plan (3)» en lugar de hablarle en segunda persona a quien modera.
2. Agrega `public.activar_plan_pago(meses)` y `public.cancelar_plan_pago()`, funciones `security definer` que solo tocan la fila del usuario autenticado. Así la pantalla `/planes` puede dar de alta y de baja el plan sin abrir la escritura directa de `suscripciones`, que sigue reservada al administrador. La duración se limita a entre 1 y 12 meses y renovar un plan vigente suma al tiempo restante.

El cobro está simulado: no hay pasarela de pago. Dar de baja devuelve la cuenta al plan gratuito sin borrar ofertas, postulaciones ni representados.

## Cupo mensual de postulaciones

Ejecutar **`migrations/20261107_cupo_postulaciones_mensuales.sql`**. Agrega `public.limite_postulaciones_del_plan(uuid, text)` (3 para el candidato gratuito, 6 para el representante gratuito, `null` para el plan pago) y el trigger `controlar_cupo_postulaciones`, que valida cada alta.

El cupo lo consume quien envía la postulación: las que manda un representante descuentan de su plan y no del cupo del candidato representado. La ventana es el mes calendario en UTC (`date_trunc('month', now())`), así que se renueva el día 1. Se cuenta por envío: cancelar una postulación no devuelve el cupo del mes, para que el límite no se pueda reciclar.

En la aplicación, el candidato ve el bloqueo al postularse desde el detalle de la oferta y el representante al postular a alguien de su cartera; en ambos casos el mensaje incluye un enlace a `/planes`.

## Panel de suscripciones e indicadores de consumo

No requiere migraciones nuevas. `/admin/suscripciones` lista las cuentas de club, candidato y representante con su plan vigente y su vencimiento, y permite activar, extender o dar de baja el plan Pro. La escritura la hace el administrador contra `suscripciones` por RLS; la acción valida además el rol de destino, la duración (1, 3, 6 o 12 meses) y que no sea su propia cuenta.

Cuando el cambio lo hizo la administración y no el propio usuario (`activada_por <> usuario_id`), la cuenta recibe el aviso en su campana con enlace a `/planes`. Las altas que el usuario hace desde `/planes` no generan aviso, porque ya las conoce.

Mis ofertas, Mis postulaciones y Mi cartera muestran el consumo del cupo («2 de 3 ofertas activas»), resaltado en ámbar cuando se agotó, con enlace a `/planes`. Con plan Pro, el indicador informa que no hay tope.

## Cierre de oferta en postulaciones y métricas de postulaciones

Ejecutar una vez **`migrations/20261109_cierre_oferta_y_metricas_postulaciones.sql`** en el SQL Editor del proyecto después de las migraciones anteriores. Habilita la lectura administrativa de conteos de `postulaciones` bajo RLS para `/admin/metricas` y refuerza en PostgreSQL la transición automática de las postulaciones abiertas (`postulado`, `visto`, `preseleccionado`) al estado `oferta_cerrada` cuando se cierra una oferta.
