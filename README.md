<p align="center">
  <img src="assets/icono-registro-ventas.png" alt="Recibo de venta con una marca de validación" width="128" height="128">
</p>

# Registro de Ventas en Solana con tope por operación

**Solana Engineering Track: Advanced · Ruta 2: proyecto guiado con mejora funcional**

Registro de negocio, clientes y ventas mediante una aplicación web con wallet y un programa Rust/Anchor en Solana Devnet. El aporte propuesto evita que una captura por encima del límite definido por el negocio se guarde como venta o como corrección de importe.

**Estado actual.** El [programa Rust](programa/src/lib.rs) incorpora el tope configurable y la baja condicionada. El frontend y los parches de la etapa inicial solo contemplan el tope fijo. La integración, compilación, despliegue y pruebas de extremo a extremo están pendientes. Los siguientes apartados de auditoría describen el corte previo a la ampliación.

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

Cada negocio empieza con un tope de **10 000 unidades**. Su propietario puede modificarlo mediante `configurar_tope`. El programa exige la firma de la autoridad y un valor positivo. Las altas y correcciones leen el tope vigente desde la cuenta Registro. Cambiarlo afecta escrituras futuras y conserva el importe de las ventas existentes. Las devoluciones siguen disponibles.

El nuevo campo ocupa cuatro bytes. El despliegue de esta práctica utilizará un Program ID nuevo y registros nuevos. Una actualización de un despliegue anterior requeriría migrar las cuentas. La baja condicionada de clientes pertenece a la base guiada.

## Configuración y ejecución prevista

Importar `programa/src/lib.rs` en Solana Playground y asignar el ID del nuevo programa a `declare_id!` antes de compilar. Desplegar en Devnet, exportar el IDL y, en el frontend de referencia con Node 22.12+ de la rama 22, ejecutar `npm ci`, `npm run configurar:idl -- ./tmp-idl/registro.json`, `npm run verificar` y `npm run dev`. Falta integrar el formulario para configurar el tope, su lectura y la baja de clientes, incorporar el cliente generado y verificar estos pasos desde un clon limpio. Los parches previos solo documentan la iteración inicial.

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

## Cronograma técnico del 16 al 22 de noviembre

El plan empieza el lunes. Los primeros commits reales son del jueves 19. Los hitos anteriores representan una reconstrucción del trabajo y su evidencia disponible.

| Jornada | Resultado técnico concreto | Comprobación y estado |
| --- | --- | --- |
| Lunes 16 | Modelar Registro → Cliente → Venta. Identificar autoridad y semillas de cada PDA, y distinguir datos persistidos de argumentos de instrucción. | El código de referencia deriva Cliente del registro e ID y Venta del cliente y SKU. Ver los contextos Anchor en el archivo Rust. Revisión retrospectiva. |
| Martes 17 | Especificar tres instrucciones afectadas: configurar, registrar y corregir. Definir límite inicial, límite inclusivo y comportamiento de ventas existentes. | Contrato descrito en Aporte propio y escenarios B01–B05. Documentación retrospectiva. |
| Miércoles 18 | Diseñar las pruebas de frontera, aislamiento entre dos negocios y cierre condicionado de cliente. | Matrices A y B y pruebas del flujo guiado. Resultados en Devnet pendientes. |
| Jueves 19 | Incorporar el campo persistido, la instrucción firmada de configuración, las dos validaciones de importe y la baja que retira la referencia y cierra Cliente. | Fuente Rust y dos pruebas unitarias escritas. Compilación y ejecución pendientes. |
| Viernes 20 | Compilar y conectar Rust → IDL → cliente TypeScript → formularios de configuración, ventas y baja. | Cerrar con compilación, generación de cliente, lectura del límite desde la app y verificación del frontend. Pendiente. |
| Sábado 21 | Ejecutar el flujo completo contra el despliegue de Devnet y comprobar estado antes y después de cada rechazo. | Program ID, firma exitosa, errores del programa y lecturas de cuentas en tablas A y B. Pendiente. |
| Domingo 22 | Reproducir desde clon limpio, grabar demo de 60–90 segundos y entregar antes de las 23:59 CDMX. | Video, acceso de revisión y envío pendientes. |

### Pruebas adicionales de configuración por negocio

Usar dos registros A y B con autoridades distintas, ambos con el límite inicial. Ejecutar A01–A05 con el límite inicial antes de esta secuencia.

| Caso | Acción | Resultado esperado | Observado |
| --- | --- | --- | --- |
| B01 | Conservar una venta de 8 000 en A. Su propietario cambia el tope a 5 000. | A guarda 5 000. La venta anterior sigue en 8 000. B conserva 10 000. | Pendiente |
| B02 | En A registrar 5 000 y después intentar 5 001 con otro SKU. | Se confirma la primera y se rechaza la segunda. En B se admite 5 001. | Pendiente |
| B03 | En A corregir la venta anterior a 5 001 y después a 5 000. | El rechazo conserva los 8 000. La corrección válida deja 5 000 en la misma cuenta. | Pendiente |
| B04 | El propietario intenta configurar cero. | Error TopeInvalido. La nueva lectura muestra 5 000. | Pendiente |
| B05 | La autoridad de B intenta cambiar el tope de A usando cuentas existentes. | Rechazo de autoridad. A y B conservan sus límites. | Pendiente |

### Criterios de cierre del sábado 21

Ejecutar también B01–B05 y mostrar en la demo el cambio firmado del límite y una venta rechazada bajo la nueva política.

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
