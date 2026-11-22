<p align="center">
  <img src="assets/icono-registro-ventas.png" alt="Recibo de venta con una marca de validación" width="128" height="128">
</p>

# Registro de Ventas en Solana con tope por operación

**Solana Engineering Track: Advanced · Ruta 2: proyecto guiado con mejora funcional**

Registro de negocio, clientes y ventas mediante una aplicación web con wallet y un programa Rust/Anchor en Solana Devnet. El aporte propuesto evita que una captura por encima del límite definido por el negocio se guarde como venta o como corrección de importe.

**Estado:** alcance definido, iconos incorporados al repositorio y primeros cambios de Rust y frontend preparados como parches. Integración del cierre guiado, compilación, pruebas en Devnet y demo pendientes.

## Punto de partida

### Revisión de cumplimiento al jueves 19 de noviembre

| Criterio | Evidencia disponible | Qué falta para cerrar |
| --- | --- | --- |
| Ruta y aporte | Ruta 2, referencias fijadas y parches para alta y corrección | Ejecutar ambos caminos y comprobar el límite en el programa desplegado |
| Código completo y acceso | Repositorio local con README, dos imágenes y dos parches | Incorporar fuentes Rust y frontend, baja de cliente del día 5, IDL y cliente TypeScript. Verificar que el equipo evaluador pueda abrir el repositorio |
| Ejecución reproducible | Pasos de referencia para el frontend | Probar la versión integrada desde un clon limpio y registrar versiones y comandos efectivos |
| Programa en Devnet | Red elegida | Publicar y comprobar el Program ID y cotejarlo con IDL y frontend |
| Flujo y permisos | Matriz de pruebas más abajo | Registrar firma, confirmación, relectura de cuentas, permisos, pertenencia y cierre en los casos correspondientes |
| Evidencia del aporte | Valores de prueba y error esperado definidos | Guardar al menos una transacción confirmada, el mensaje del rechazo y el estado observado antes y después |
| Demo y entrega | Guion previsto de 75 segundos | Grabar, verificar acceso al video y al código, confirmar nombre y correo de inscripción y enviar el formulario |

### Metodología individual

Una sola persona desarrolla, prueba y documenta el proyecto. Se propone un flujo Kanban personal con cuatro estados: pendiente, en curso, en verificación y terminado. Cada jornada empieza con un objetivo comprobable. Al cierre se anota qué cambió, qué prueba se ejecutó, el resultado observado, el enlace o commit y el bloqueo que pasa al día siguiente. Para una tarea de código, “terminado” exige la prueba correspondiente a su alcance.

### Entorno de desarrollo

| Componente | Situación al revisar |
| --- | --- |
| Equipo local | Windows y PowerShell. Git 2.56.1.windows.1, Node.js 26.7.0 y npm 11.19.0 detectados |
| Frontend | React, Vite y TypeScript. Para reproducir el template, usar Node.js 22.12 o posterior de la rama 22. La versión local detectada queda fuera del intervalo declarado por el proyecto base |
| Programa y cliente | Rust con Anchor. Entorno previsto para compilación y despliegue: Solana Playground. Cliente TypeScript generado con Codama a partir del IDL exportado |
| Prueba de extremo a extremo | Navegador con wallet compatible, SOL de prueba y RPC Devnet. Usar una segunda wallet para comprobar autoridad. Registrar el Program ID público y las versiones utilizadas en la ejecución |

| Componente | Referencia de trabajo |
| --- | --- |
| Programa Rust/Anchor | [WayLearnLatam/Registro-Ventas-Solana-PDA, commit `1a414a8`](https://github.com/WayLearnLatam/Registro-Ventas-Solana-PDA/tree/1a414a889446934723d0c998a0a1977e79087dcb) |
| Frontend React/TypeScript | [WayLearnLatam/Registro-Ventas-Solana-App, commit `baee514`](https://github.com/WayLearnLatam/Registro-Ventas-Solana-App/tree/baee5142f050e8fb92ccd4f910fe2cda44610e00) |

Las referencias publicadas incluyen cinco operaciones. El flujo de baja condicionada de clientes del día 5 debe integrarse para completar la base de WayLearn. Consultar [Pruebas y evidencias](https://waylearn.gitbook.io/solana-engineering-track-advanced/pruebas-y-evidencias) para sus precondiciones.

## Aporte propio

Agregar un límite fijo e inclusivo de **10 000 unidades** por venta. Si el monto supera el límite al registrar una venta o corregir una existente, el programa devuelve un error de negocio. La base representa los importes como enteros `u32`, así que `10_000` en Rust corresponde a 10 000 en el formulario.

| Capa | Trabajo previsto |
| --- | --- |
| Programa Rust/Anchor | Reutilizar la misma validación en registro y corrección, después de las comprobaciones de cuentas y antes de actualizar datos. Conservar la validación base del importe y agregar el error `MontoExcedeTope` al final del enum para preservar los códigos existentes. La regla usa una constante y el esquema de cuentas actual. |
| IDL y cliente TypeScript | Regenerar con el flujo del template e integrar el error del programa en el manejo de errores del cliente. Verificar que el IDL y el cliente apunten al Program ID entregado. |
| Frontend | Mostrar el tope en los formularios y traducir el rechazo del programa a «El importe supera el máximo permitido de 10 000». Tras una operación confirmada, volver a consultar los datos y mostrar el enlace de la transacción. |

## Configuración y ejecución

### Integración del avance

- En la raíz de la copia del programa, aplicar [programa-tope.patch](patches/programa-tope.patch). El parche agrega la regla a `registrar_venta` y `cambiar_monto`.
- En la raíz de la copia del frontend, aplicar [frontend-tope-e-icono.patch](patches/frontend-tope-e-icono.patch) y copiar [favicon.png](app/public/favicon.png) a `public/favicon.png`. El formulario informa el límite y deja que el programa devuelva el rechazo. El manejador de errores de la base consulta el IDL para traducir errores personalizados.
- Aplicar cada parche con `git apply /ruta/al/parche.patch` desde la copia correspondiente. Si el cierre del día 5 usa otra revisión, verificar compatibilidad con `git apply --check /ruta/al/parche.patch`.
- El frontend de referencia documenta Node.js 22.12 o superior de la rama 22, `npm ci`, `npm run cliente` y `npm run dev`. Tras exportar el IDL del despliegue, el comando de importación es `npm run configurar:idl -- ./tmp-idl/registro.json`. Verificar estos pasos sobre la versión integrada.

Completar esta sección con los datos de la versión base y verificarla desde un clon limpio.

1. Documentar las versiones verificadas de Node.js y las herramientas usadas para compilar y desplegar el programa.
2. Indicar las rutas del programa, el frontend, el IDL y el cliente, así como los comandos exactos para instalar dependencias, compilar, regenerar cliente y arrancar el frontend.
3. Explicar cómo configurar Devnet y el Program ID en el frontend, con ejemplos de variables o archivos si corresponden.
4. Abrir la URL local, conectar una wallet compatible con SOL de prueba y crear un registro y un cliente de demostración.
5. Ejecutar el recorrido siguiente. Usar el script `npm run verificar` si está disponible en la versión elegida y añadir las comprobaciones del programa y el recorrido en Devnet.

## Pruebas del aporte

Usar clientes ficticios, una wallet autorizada y cuentas válidas. El primer importe entero por encima del tope es **10 001**.

| Caso | Operación | Resultado esperado | Resultado observado |
| --- | --- | --- | --- |
| A01 | Registrar una venta por 2 500 | Se crea la venta y el cliente refleja el cambio | Pendiente |
| A02 | Registrar una venta por 10 000 | El programa acepta exactamente el máximo | Pendiente |
| A03 | Registrar una venta por el mínimo superior a 10 000 | `MontoExcedeTope`. La cuenta de venta sigue sin existir y las referencias y contadores conservan su valor previo | Pendiente |
| A04 | Corregir la venta de 2 500 a 3 000 | La misma venta queda en 3 000 y conserva su relación con el cliente | Pendiente |
| A05 | Corregir esa venta por encima de 10 000 | `MontoExcedeTope`. La venta conserva 3 000 y el estado del cliente queda igual | Pendiente |

Si el formulario bloquea un importe antes de enviarlo, reproducir A03 y A05 con el cliente TypeScript para comprobar que la regla también se ejecuta en Rust. Guardar el error y comparar las cuentas antes y después. Un rechazo en la simulación previa puede dejar un mensaje de error sin firma pública.

## Pruebas del flujo guiado

| Caso | Comprobación esperada | Resultado observado |
| --- | --- | --- |
| Crear Registro y Cliente | Las cuentas y su relación se pueden consultar en la app | Pendiente |
| Registrar y corregir una venta | Reproducir A01 y A04 con la wallet autorizada | Pendiente |
| Procesar una devolución válida | La cuenta Venta se cierra y se actualiza Cliente | Pendiente |
| Dar de baja a un cliente sin ventas | Se cierra su cuenta, se retira la referencia y el contador de IDs conserva su avance | Pendiente |
| Intentar una operación con otra wallet | Una solicitud controlada con cuentas existentes se rechaza por autoridad | Pendiente |
| Presentar una venta de otro cliente | Una solicitud controlada se rechaza por pertenencia | Pendiente |
| Intentar la baja de un cliente con ventas activas | Se rechaza la baja y se conservan sus cuentas y referencias | Pendiente |

Al ejecutar cada caso, anotar el estado inicial, el resultado observado, cómo se comprobaron las cuentas y la firma o el error relevante. Adjuntar al menos una transacción válida de la versión entregada.

## Devnet y demo

- **Program ID de Devnet:** pendiente de despliegue.
- **Versión entregada:** pendiente de identificar con el SHA del commit.
- **Transacción confirmada:** pendiente. Formato de enlace `https://explorer.solana.com/tx/<FIRMA>?cluster=devnet`.
- **Video (60–90 s):** pendiente. Guion sugerido para 75 s: conectar wallet y mostrar el cliente (15 s), firmar y confirmar una venta válida (25 s), intentar una corrección superior al tope y mostrar el importe anterior (25 s), abrir la venta confirmada en Explorer (10 s). Si la interfaz filtra el importe antes de llamar al programa, mostrar también el error capturado por el cliente TypeScript.

## Avance de la semana del 16 al 22 de noviembre

El lunes 16 es el inicio de referencia para organizar el trabajo. Los estados indican lo comprobado al preparar este avance.

**Bitácora retrospectiva.** Los tres commits de avance previos a esta revisión están fechados el jueves 19. Los hitos del lunes, martes y miércoles se reconstruyen a partir de esos archivos. El historial disponible acredita cuándo quedaron registrados.

| Jornada planificada | Resultado disponible | Evidencia y fecha efectiva | Pendiente al cierre del hito |
| --- | --- | --- | --- |
| Lunes 16 · alcance | Regla para registrar y corregir ventas y cinco escenarios de aceptación | README inicial, `217aa64` del 19 | Ejecutar los escenarios |
| Martes 17 · análisis | Versiones de referencia del programa y de la app identificadas | Enlaces con SHA, `ac9f673` del 19 | Completar la baja del día 5 |
| Miércoles 18 · documentación e identidad | README, icono del recibo y favicon | Archivos incorporados en `ac9f673` del 19 | Ver el favicon en la app integrada |
| Jueves 19 · desarrollo | Parches de alta y corrección y aviso en el formulario. Se comprobó su aplicación a la base | `ac9f673` y criterios de cierre en `998ef84`, ambos del 19 | Compilar, regenerar el cliente y probar contra Devnet |

| Fecha (CDMX) | Avance esperado | Evidencia en el repositorio | Estado |
| --- | --- | --- | --- |
| Lunes 16 | Definir la Ruta 2 y la regla de importe. | Alcance y tabla de casos A01–A05 en el README. | Documentado |
| Martes 17 | Fijar las versiones de Rust y del frontend. | Enlaces a los commits de WayLearn en Punto de partida. | Referencias registradas |
| Miércoles 18 | Preparar la identidad del proyecto. | Icono en el README y favicon en `app/public/`. | Incorporado |
| Jueves 19 | Preparar la implementación del tope y el aviso del frontend. | Parches en `patches/` y comprobación de que aplican a sus bases. | Parches verificados |
| Viernes 20 | Integrar la baja guiada y el tope. Compilar y preparar el despliegue. | Commit de integración y resultado de compilación. Registrar el IDL generado y comprobar que el cliente se puede regenerar. | Pendiente |
| Sábado 21 | Probar la app conectada al programa en Devnet y cerrar la versión de entrega. | Commit de la versión candidata con Program ID, IDL y cliente sincronizados, enlace de Explorer y resultados de las pruebas. | Pendiente |
| Domingo 22 | Ensayar, grabar y enviar la entrega antes de las 23:59 CDMX. | Enlace de la demo de 60 a 90 segundos en el README y comprobación del acceso de revisión. | Pendiente |

Actualizar el estado de cada hito cuando exista evidencia comprobada. La fecha del hito expresa el plan de la semana. El historial de Git conserva la fecha real del trabajo.

### Criterios de cierre del sábado 21

- La app abre en local, conecta una wallet y opera contra el Program ID de Devnet que figura en el README. Ese mismo ID aparece en los artefactos de la versión candidata.
- Desde la app, crear Registro y Cliente, confirmar una venta por **10 000** y guardar su firma con un enlace a Solana Explorer.
- Ejecutar el registro y la corrección por **10 001** con cuentas válidas. Documentar `MontoExcedeTope` y comprobar que la venta rechazada no se crea y que la corrección rechazada conserva el importe anterior.
- Completar los casos guiados de corrección válida, devolución, baja de cliente vacío y rechazos por ventas activas, wallet sin autorización y venta de otro cliente. Registrar en el README los resultados observados y la evidencia correspondiente.
- Dejar listo el recorrido de la demo con datos de prueba. Si una prueba funcional sigue pendiente, registrarla como pendiente y resolverla antes de enviar.

La fecha del **30 de noviembre a las 23:59 CDMX** corresponde a correcciones solicitadas sobre proyectos enviados en el plazo inicial.

## Fuentes y entrega

- [Proyecto final y certificado](https://waylearn.gitbook.io/solana-engineering-track-advanced/proyecto-final-y-certificado)
- [Pruebas y evidencias](https://waylearn.gitbook.io/solana-engineering-track-advanced/pruebas-y-evidencias)
- [Enlaces y grabaciones](https://waylearn.gitbook.io/solana-engineering-track-advanced/recursos/enlaces-y-grabaciones)
- [Formulario de entrega](https://airtable.com/appqcPkgPHDB6fyz7/pagtEQg4DjDOKDHIL)

Registrar el nombre completo para el certificado y el correo usado en WayLearn al completar el formulario de entrega.
