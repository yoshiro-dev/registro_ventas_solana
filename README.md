<p align="center">
  <img src="assets/icono-registro-ventas.png" alt="Recibo de venta con una marca de validación" width="128" height="128">
</p>

# Registro de Ventas en Solana con tope por operación

**Solana Engineering Track: Advanced · Ruta 2: proyecto guiado con mejora funcional**

Registro de negocio, clientes y ventas mediante una aplicación web con wallet y un programa Rust/Anchor en Solana Devnet. El aporte propuesto evita que una captura por encima del límite definido por el negocio se guarde como venta o como corrección de importe.

**Estado:** alcance definido, iconos incorporados al repositorio y primeros cambios de Rust y frontend preparados como parches. Integración del cierre guiado, compilación, pruebas en Devnet y demo pendientes.

## Punto de partida

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

| Fecha (CDMX) | Objetivo | Estado actual |
| --- | --- | --- |
| Lunes 16 | Definir la Ruta 2, el límite y los casos que demuestran el aporte. | Listo |
| Martes 17 | Identificar y fijar las versiones de Rust y frontend. | Referencias fijadas. Cierre del día 5 por integrar |
| Miércoles 18 | Preparar el README, el icono del proyecto y el favicon. | Listo |
| Jueves 19 | Preparar la regla Rust, el aviso en el formulario y el enlace al favicon. | Parches preparados |
| Viernes 20 | Integrar la baja guiada, compilar el programa y sincronizar IDL y cliente. | Pendiente |
| Sábado 21 | Desplegar en Devnet y ejecutar los casos válidos y de rechazo. | Pendiente |
| Domingo 22 | Verificar el README, grabar la demo y entregar antes de las 23:59 CDMX. | Pendiente |

La fecha del **30 de noviembre a las 23:59 CDMX** corresponde a correcciones solicitadas sobre proyectos enviados en el plazo inicial.

## Fuentes y entrega

- [Proyecto final y certificado](https://waylearn.gitbook.io/solana-engineering-track-advanced/proyecto-final-y-certificado)
- [Pruebas y evidencias](https://waylearn.gitbook.io/solana-engineering-track-advanced/pruebas-y-evidencias)
- [Enlaces y grabaciones](https://waylearn.gitbook.io/solana-engineering-track-advanced/recursos/enlaces-y-grabaciones)
- [Formulario de entrega](https://airtable.com/appqcPkgPHDB6fyz7/pagtEQg4DjDOKDHIL)

Registrar el nombre completo para el certificado y el correo usado en WayLearn al completar el formulario de entrega.
