<p align="center">
  <img src="assets/icono-registro-ventas.png" alt="Recibo de venta con una marca de validación" width="128" height="128">
</p>

# Registro de Ventas en Solana con tope por operación

**Solana Engineering Track: Advanced · Ruta 2: proyecto guiado con mejora funcional**

Registro de negocio, clientes y ventas mediante una aplicación web con wallet y un programa Rust/Anchor en Solana Devnet. El aporte propuesto evita que una captura por encima del límite definido por el negocio se guarde como venta o como corrección de importe.

## Probar ahora en Windows

Abrir **[Demo_local.html](Demo_local.html)** con Edge o Chrome. La práctica funciona sin Node, extensiones ni conexión. En SCARIX seleccionar **Crear negocio**, agregar un cliente, registrar el SKU SSD01 por 8 000 y cambiar el límite a 5 000. Intentar corregir SSD01 a 5 001. Consultar otra vez para ver el importe anterior y repetir con 5 000. Los datos de este modo se guardan en el navegador cuando su almacenamiento está disponible.

## Estructura y estado

| Pieza | Archivos | Verificación |
| --- | --- | --- |
| Programa | `Anchor.toml`, `Cargo.toml`, [programa/src/lib.rs](programa/src/lib.rs) y manifiesto del crate | Siete instrucciones, firmas, PDA, cierres y validación de importes implementados. Compilación SBF verificada en GitHub Actions con Anchor 0.31.1 y Solana 2.1.0; binario generado |
| App | `app/src/main.tsx`, `panel.mjs`, `style.css` y `devnet.ts` | React monta la interfaz. El cliente TypeScript deriva direcciones, construye instrucciones con Anchor, pide firma y relee cuentas después de confirmar. Instalación npm, TypeScript y build de React verificados; recorrido con wallet en Devnet pendiente |
| Contrato | `app/src/idl.json` | IDL generado realmente por Anchor y sincronizado con el frontend; la dirección fuente sigue siendo de desarrollo, sin despliegue de Devnet |
| Pruebas | `tests/`, pruebas unitarias en Rust y `scripts/verificar-red.mjs` | Tres pruebas Rust y cuatro pruebas Node aprobadas en CI. La comprobación de Devnet usa dos wallets y generará evidencia al ejecutarse después del despliegue |
| Práctica local | `app/src/local.mjs` y `Demo_local.html` | Modelo en el navegador. Las transacciones y firmas para la certificación se obtienen en Devnet |

**Metodología individual.** Cada hito tiene una operación reproducible, un resultado esperado y un estado observado. Se registra el cambio en Git y se documenta la prueba con su entorno. La matriz de evidencias distingue la práctica local de la ejecución del programa desplegado.

### Punto de partida

| Componente | Referencia de trabajo |
| --- | --- |
| Programa Rust/Anchor | [WayLearnLatam/Registro-Ventas-Solana-PDA, commit `1a414a8`](https://github.com/WayLearnLatam/Registro-Ventas-Solana-PDA/tree/1a414a889446934723d0c998a0a1977e79087dcb) |
| Frontend React/TypeScript | [WayLearnLatam/Registro-Ventas-Solana-App, commit `baee514`](https://github.com/WayLearnLatam/Registro-Ventas-Solana-App/tree/baee5142f050e8fb92ccd4f910fe2cda44610e00) |

Las referencias publicadas incluyen cinco operaciones. El flujo de baja condicionada de clientes del día 5 está implementado en el programa y en la interfaz. Consultar [Pruebas y evidencias](https://waylearn.gitbook.io/solana-engineering-track-advanced/pruebas-y-evidencias) para sus precondiciones.

## Evidencia técnica de compilación (21 de noviembre)

La [ejecución exitosa de GitHub Actions](https://github.com/yoshiro-dev/registro_ventas_solana/actions/runs/44987227343) generó un binario SBF (`target/deploy/registro.so`) y el IDL real (`target/idl/registro.json`), verificando que ambos archivos existen. Con este IDL actualizado se ejecutaron correctamente:

- `cargo test -p registro --lib`: **3 aprobadas, 0 fallidas** (pruebas de Rust).
- `npm test`: **4 aprobadas, 0 fallidas** (modelo local y estructura de IDL).
- `npm run build`: **correcto**, TypeScript y bundle Vite/React.
- `npm install`: **correcto** en el runner de GitHub.

[Artefactos de compilación y frontend](https://github.com/yoshiro-dev/registro_ventas_solana/actions/runs/44987227343#artifacts), conservados temporalmente por GitHub Actions. El IDL real está versionado en `app/src/idl.json`, junto con `Cargo.lock` y `package-lock.json` para facilitar una construcción reproducible.

**No equivale a desplegar en Devnet:** el Program ID declarado en el IDL se usa como referencia de desarrollo y aún no ha sido corroborado como programa ejecutable. Las pruebas en la blockchain y la transacción de Explorer permanecen pendientes. El script `scripts/verificar-red.mjs` prepara las pruebas reales y guardará evidencia solo cuando se ejecute con dos wallets de prueba después del despliegue.

## Aporte propio

Cada negocio empieza con un tope de **10 000 unidades**. Su propietario puede modificarlo mediante `configurar_tope`. El programa exige la firma de la autoridad y un valor positivo. Las altas y correcciones leen el tope vigente desde la cuenta Registro. Cambiarlo afecta escrituras futuras y conserva el importe de las ventas existentes. Las devoluciones siguen disponibles.

El nuevo campo ocupa cuatro bytes. El despliegue de esta práctica utilizará un Program ID nuevo y registros nuevos. Una actualización de un despliegue anterior requeriría migrar las cuentas. La baja condicionada de clientes pertenece a la base guiada.

## Desarrollar y ejecutar

Desde la raíz, usar Node.js 22.12 o posterior de la rama 22 con npm. Los comandos de práctica y pruebas Node también se pueden ejecutar desde PowerShell.

```sh
npm test
node scripts/demo.mjs
npm install
npm run build
npm run dev
```

Abrir la dirección local que muestra Vite. Para usar el modo de red, instalar una extensión compatible (Phantom o Solflare), seleccionar una cuenta de pruebas con SOL de Devnet y pulsar **Conectar wallet en Devnet**. La app usa el RPC de Devnet y comprueba que el programa sea ejecutable.

### Compilar y desplegar el programa propio

En Linux o WSL, usar Rust, Solana CLI con herramientas SBF compatibles y Anchor CLI 0.31.1. Se necesita una wallet de despliegue con SOL de prueba en la ruta indicada en Anchor.toml. La clave del programa y la de la wallet de despliegue son distintas. Conservar la clave del programa para futuras actualizaciones. Los archivos de claves quedan fuera de Git.

```sh
solana config set --url devnet
solana balance
npm run preparar
anchor build
cargo test -p registro --lib
npm run idl
anchor deploy --provider.cluster devnet
npm run build
npm run dev
```

`preparar` crea la clave de programa en `target/deploy/registro-keypair.json` si hace falta y sincroniza la dirección pública en Rust y Anchor.toml. Al finalizar `anchor build`, `npm run idl` copia el contrato generado a la app. La dirección inicial incluida en los fuentes es de desarrollo. Registrar el Program ID **efectivamente desplegado** y verificarlo en Explorer. Tras cualquier cambio del programa, recompilar y sincronizar el IDL antes de probar la app.

### Verificación en Devnet

Con dos wallets propias de prueba y saldo en Devnet, indicar las rutas locales de sus archivos de claves. Este recorrido crea negocios y clientes de prueba, modifica el límite, registra ventas y ejecuta devolución y baja. Las operaciones confirmadas consumen SOL de prueba.

```sh
export ANCHOR_WALLET="$HOME/.config/solana/id.json"
export WALLET_B="/ruta/local/wallet-b.json"
node scripts/verificar-red.mjs
```

El script guarda las firmas, enlaces y errores observados en `evidencias/Prueba*.json`. Un archivo parcial corresponde a un recorrido interrumpido. Solo el recorrido completo incluye el resultado final de verificación. Grabar después la demo de 60–90 segundos desde la interfaz y agregar el enlace de revisión.

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
- **Versión compilada y validada en CI:** `a7f364f296e86318e7296db57dcbae2ab5d9b5fb` (código de la ejecución); IDL y lockfiles sincronizados en `6c3e183366ba90f7fec719b54d2aa769f0ddf451`. Versión de Devnet pendiente.
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
| Viernes 20 | Compilar y conectar Rust → IDL → cliente TypeScript → formularios de configuración, ventas y baja. | Compilación SBF, IDL generado y sincronizado, pruebas y build de React confirmados en GitHub Actions el 21 de noviembre, sin prueba de interacción con wallet. |
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
