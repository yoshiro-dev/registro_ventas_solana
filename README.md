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
| App | `app/src/main.tsx`, `panel.mjs`, `style.css` y `devnet.ts` | React monta la interfaz. El cliente TypeScript deriva direcciones, construye instrucciones con Anchor, pide firma y relee cuentas después de confirmar. Instalación, TypeScript y build verificados; recorrido real con Phantom en Devnet completado y documentado en `docs/PRUEBAS_MANUALES_DEVNET_2026-11-22.md` |
| Contrato | `app/src/idl.json` | IDL generado por Anchor y sincronizado; Program ID desplegado y ejecutable en Devnet: `7qUUv2DpK2puFn91gkjwyfRyEDhcJV3enMEBi6oMHG3z` |
| Pruebas | `tests/`, pruebas unitarias en Rust y `scripts/verificar-red.mjs` | Tres pruebas Rust y cuatro Node aprobadas en CI; prueba real de dos wallets terminada con 15 firmas confirmadas y 7 rechazos esperados (archivos en `evidencias/`) |
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

**Actualización del 22 de noviembre:** el bloque anterior describe la compilación previa al despliegue. Desde entonces, el programa fue desplegado y validado en Devnet, y la interfaz React operó con Phantom. Ver [despliegue verificado](#despliegue-verificado-en-solana-devnet) y [pruebas manuales](docs/PRUEBAS_MANUALES_DEVNET_2026-11-22.md).

## Aporte propio

Cada negocio empieza con un tope de **10 000 unidades**. Su propietario puede modificarlo mediante `configurar_tope`. El programa exige la firma de la autoridad y un valor positivo. Las altas y correcciones leen el tope vigente desde la cuenta Registro. Cambiarlo afecta escrituras futuras y conserva el importe de las ventas existentes. Las devoluciones siguen disponibles.

El nuevo campo ocupa cuatro bytes. El despliegue se realizó con un Program ID nuevo y registros nuevos. Una actualización de un despliegue anterior requeriría migrar las cuentas. La baja condicionada de clientes pertenece a la base guiada.

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

`preparar` crea la clave de programa en `target/deploy/registro-keypair.json` si hace falta y sincroniza la dirección pública en Rust y Anchor.toml. Al finalizar `anchor build`, `npm run idl` copia el contrato generado a la app. La dirección actualmente versionada corresponde al programa **efectivamente desplegado** y está verificada en Explorer. Tras cualquier cambio del programa, recompilar y sincronizar el IDL antes de probar la app.

### Desplegar y verificar desde WSL con un solo comando

Se agregó [`scripts/desplegar-devnet.sh`](scripts/desplegar-devnet.sh), que utiliza **Anchor CLI 0.31.1**, Solana CLI, Node 22 y las claves **locales** del usuario. El script crea o reutiliza `target/deploy/registro-keypair.json`, sincroniza ese Program ID en Rust y `Anchor.toml`, compila, genera el IDL real, valida el frontend, despliega y comprueba que el programa sea ejecutable en Devnet.

Desde la raíz del repositorio en WSL/Linux, **con dos wallets distintas de prueba ya financiadas con SOL de Devnet**, ejecutar:

```bash
git pull origin main
export ANCHOR_WALLET="$HOME/.config/solana/id.json"
export WALLET_B="$HOME/.config/solana/wallet-b.json"
bash scripts/desplegar-devnet.sh
```

Si `WALLET_B` no está definida, el script puede desplegar, pero **no** ejecutará las pruebas de dos wallets. Para crear wallets nuevas en el equipo se puede usar `solana-keygen new --outfile ...`, evitando reemplazar wallets existentes; consultar su dirección con `solana-keygen pubkey /ruta/wallet.json` y obtener exclusivamente SOL de **Devnet** mediante el faucet de pruebas. Nunca pegar secretos ni archivos JSON de claves en el chat o en GitHub.

Después de una prueba completa, se generarán `evidencias/Prueba*.json` y `evidencias/Prueba*.md`, con firmas, errores observados y enlaces de Solana Explorer. Estos informes son válidos **solo cuando** indican `estado: completada`; un JSON parcial indica una prueba incompleta. Actualizar entonces el README con el Program ID observado, el SHA de la versión desplegada y una firma confirmada, y guardar en Git los cambios de `Anchor.toml`, `programa/src/lib.rs`, `app/src/idl.json` y la evidencia. **No subir** `target/deploy/registro-keypair.json` ni claves de las wallets.

### Verificación en Devnet

Con dos wallets propias de prueba y saldo en Devnet, indicar las rutas locales de sus archivos de claves. Este recorrido crea negocios y clientes de prueba, modifica el límite, registra ventas y ejecuta devolución y baja. Las operaciones confirmadas consumen SOL de prueba.

```sh
export ANCHOR_WALLET="$HOME/.config/solana/id.json"
export WALLET_B="/ruta/local/wallet-b.json"
node scripts/verificar-red.mjs
```

El script guarda las firmas, enlaces y errores observados en `evidencias/Prueba*.json`. Un archivo parcial corresponde a un recorrido interrumpido. Solo el recorrido completo incluye el resultado final de verificación. Grabar después la demo de 60–90 segundos desde la interfaz y agregar el enlace de revisión.

## Pruebas del aporte

Esta matriz conserva los **escenarios originalmente diseñados** con el límite inicial de 10,000 (primer importe superior: **10,001**). El recorrido final ejecutó operaciones equivalentes en Devnet y comprobó la frontera **5,000/5,001** después de modificar el tope. Se distingue lo ejecutado realmente de los valores exactos que no se probaron.

| Caso | Operación | Resultado esperado | Resultado observado |
| --- | --- | --- | --- |
| A01 | Registrar una venta por 2 500 | Se crea la venta y el cliente refleja el cambio | **Cobertura equivalente:** ventas 5,000 (manual) y 10,000 (automatizada); 2,500 exactos no ejecutados |
| A02 | Registrar una venta por 10 000 | El programa acepta exactamente el máximo | **Confirmado en Devnet:** venta de 10,000 antes de reducir el límite |
| A03 | Registrar una venta por el mínimo superior a 10 000 | `MontoExcedeTope`. La cuenta de venta sigue sin existir y las referencias y contadores conservan su valor previo | **Cobertura equivalente:** rechazo de 5,001 contra 5,000 en pruebas reales; 10,001 exactos no ejecutados |
| A04 | Corregir la venta de 2 500 a 3 000 | La misma venta queda en 3 000 y conserva su relación con el cliente | **Cobertura equivalente:** corrección válida en pruebas automatizadas; importes exactos no ejecutados |
| A05 | Corregir esa venta por encima de 10 000 | `MontoExcedeTope`. La venta conserva 3 000 y el estado del cliente queda igual | **Cobertura equivalente:** 5,000 → 5,001 rechazada y monto conservado; 10,001 exactos no ejecutados |

Si el formulario bloquea un importe antes de enviarlo, reproducir A03 y A05 con el cliente TypeScript para comprobar que la regla también se ejecuta en Rust. Guardar el error y comparar las cuentas antes y después. Un rechazo en la simulación previa puede dejar un mensaje de error sin firma pública.

## Pruebas del flujo guiado

| Caso | Comprobación esperada | Resultado observado |
| --- | --- | --- |
| Crear Registro y Cliente | Las cuentas y su relación se pueden consultar en la app | Confirmado en Devnet con SCARIX y Ana · #1 |
| Registrar y corregir una venta | Reproducir A01 y A04 con la wallet autorizada | Alta de SSD01 por 5,000 confirmada; corrección válida comprobada en prueba automatizada |
| Procesar una devolución válida | La cuenta Venta se cierra y se actualiza Cliente | Confirmado en interfaz: Ana quedó sin ventas activas |
| Dar de baja a un cliente sin ventas | Se cierra su cuenta, se retira la referencia y el contador de IDs conserva su avance | Confirmado en interfaz: Ana dejó de figurar; contador verificado en pruebas automatizadas |
| Intentar una operación con otra wallet | Una solicitud controlada con cuentas existentes se rechaza por autoridad | Rechazo `NoOwner` comprobado en prueba automatizada Devnet |
| Presentar una venta de otro cliente | Una solicitud controlada se rechaza por pertenencia | Rechazo `ConstraintSeeds` comprobado en prueba automatizada Devnet |
| Intentar la baja de un cliente con ventas activas | Se rechaza la baja y se conservan sus cuentas y referencias | Rechazo `ClienteConVentas` comprobado en prueba automatizada Devnet |

Al ejecutar cada caso, anotar el estado inicial, el resultado observado, cómo se comprobaron las cuentas y la firma o el error relevante. Adjuntar al menos una transacción válida de la versión entregada.

## Devnet y demo

- **Program ID de Devnet:** `7qUUv2DpK2puFn91gkjwyfRyEDhcJV3enMEBi6oMHG3z`, desplegado y verificado.
- **Versión compilada y validada en CI:** [ejecución final exitosa del 22 de noviembre](https://github.com/yoshiro-dev/registro_ventas_solana/actions/runs/45005312791); actualización del cliente Devnet en el commit `af89a48637116a07d6707429c5da1b653545f472`.
- **Transacción confirmada de despliegue:** [ver firma en Explorer](https://explorer.solana.com/tx/5au2b15XJPGZ4s9vS6NUiBLZXkS5mzr9q41xjziku1t74XGZk2S7LYuNxZt5gJf1ixus7ZkyMKNw8gbn8qWLwXCE?cluster=devnet). [Otras 15 transacciones verificadas](evidencias/Prueba1795336274564.md).
- **Video (60–90 s):** pendiente. Guion sugerido para 75 s: conectar wallet y mostrar el cliente (15 s), firmar y confirmar una venta válida (25 s), intentar una corrección superior al tope y mostrar el importe anterior (25 s), abrir la venta confirmada en Explorer (10 s). Si la interfaz filtra el importe antes de llamar al programa, mostrar también el error capturado por el cliente TypeScript.

## Cronograma técnico del 16 al 22 de noviembre

El plan empieza el lunes. Los primeros commits reales son del jueves 19. Los hitos anteriores representan una reconstrucción del trabajo y su evidencia disponible.

| Jornada | Resultado técnico concreto | Comprobación y estado |
| --- | --- | --- |
| Lunes 16 | Modelar Registro → Cliente → Venta. Identificar autoridad y semillas de cada PDA, y distinguir datos persistidos de argumentos de instrucción. | El código de referencia deriva Cliente del registro e ID y Venta del cliente y SKU. Ver los contextos Anchor en el archivo Rust. Revisión retrospectiva. |
| Martes 17 | Especificar tres instrucciones afectadas: configurar, registrar y corregir. Definir límite inicial, límite inclusivo y comportamiento de ventas existentes. | Contrato descrito en Aporte propio y escenarios B01–B05. Documentación retrospectiva. |
| Miércoles 18 | Diseñar las pruebas de frontera, aislamiento entre dos negocios y cierre condicionado de cliente. | Matrices A y B definidas; verificadas posteriormente en Devnet el 22 de noviembre. |
| Jueves 19 | Incorporar el campo persistido, la instrucción firmada de configuración, las dos validaciones de importe y la baja que retira la referencia y cierra Cliente. | Fuente Rust y pruebas unitarias implementadas; compilación y ejecución confirmadas posteriormente. |
| Viernes 20 | Compilar y conectar Rust → IDL → cliente TypeScript → formularios de configuración, ventas y baja. | Compilación SBF, IDL, pruebas y build confirmados; interacción real con Phantom verificada el 22 de noviembre. |
| Sábado 21 | Preparar el flujo completo contra Devnet, el despliegue y la comparación antes/después de rechazos. | Flujo completado el domingo 22: 15 transacciones, 7 rechazos y evidencias verificables. |
| Domingo 22 | Validar el programa en Devnet y completar pruebas manuales del frontend con Phantom. | Contrato, integración, compilación y recorrido manual completos; video y formulario externo no acreditados. |

### Pruebas adicionales de configuración por negocio

Usar dos registros A y B con autoridades distintas, ambos con el límite inicial. Ejecutar A01–A05 con el límite inicial antes de esta secuencia.

| Caso | Acción | Resultado esperado | Observado |
| --- | --- | --- | --- |
| B01 | Conservar una venta de 8 000 en A. Su propietario cambia el tope a 5 000. | A guarda 5 000. La venta anterior sigue en 8 000. B conserva 10 000. | Confirmado, `evidencias/Prueba1795336274564.md` |
| B02 | En A registrar 5 000 y después intentar 5 001 con otro SKU. | Se confirma la primera y se rechaza la segunda. En B se admite 5 001. | Confirmado, `evidencias/Prueba1795336274564.md` |
| B03 | En A corregir la venta anterior a 5 001 y después a 5 000. | El rechazo conserva los 8 000. La corrección válida deja 5 000 en la misma cuenta. | Rechazo y corrección válida comprobados en Devnet; ver informe automatizado |
| B04 | El propietario intenta configurar cero. | Error TopeInvalido. La nueva lectura muestra 5 000. | `TopeInvalido` verificado en Devnet |
| B05 | La autoridad de B intenta cambiar el tope de A usando cuentas existentes. | Rechazo de autoridad. A y B conservan sus límites. | `NoOwner` verificado en Devnet |

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

## Despliegue verificado en Solana Devnet

**Fecha:** 22 de noviembre de 2026.

**Program ID:**
`7qUUv2DpK2puFn91gkjwyfRyEDhcJV3enMEBi6oMHG3z`

[Consultar programa en Solana Explorer](https://explorer.solana.com/address/7qUUv2DpK2puFn91gkjwyfRyEDhcJV3enMEBi6oMHG3z?cluster=devnet)

[Transacción de despliegue](https://explorer.solana.com/tx/5au2b15XJPGZ4s9vS6NUiBLZXkS5mzr9q41xjziku1t74XGZk2S7LYuNxZt5gJf1ixus7ZkyMKNw8gbn8qWLwXCE?cluster=devnet)

### Resultados de integración

- 15 transacciones confirmadas.
- 7 rechazos esperados correctamente identificados.
- Dos negocios independientes y dos wallets.
- Límite inicial de 10,000 y actualización a 5,000.
- Validación de la frontera 5,000/5,001.
- Conservación de ventas históricas.
- Devoluciones y baja condicionada de clientes.

**Evidencias:**
- `evidencias/Prueba1795336274564.json`
- `evidencias/Prueba1795336274564.md`

Las pruebas fueron ejecutadas contra Devnet, no únicamente en un simulador local.

## Pruebas manuales con Phantom — cierre del 22 de noviembre

**Estado: recorrido funcional completado en Solana Devnet.** La aplicación React operó con una wallet Phantom conectada desde Brave. Se comprobó la creación de SCARIX (tope inicial 10,000), el alta de Ana, la venta `SSD01` por 5,000, la reducción del límite a 5,000, el intento de corrección a 5,001 **rechazado durante la simulación** y sin alterar el importe, la devolución de la venta y la baja de Ana.

**Estado final:** negocio SCARIX existente, **límite 5,000**, **0 clientes activos** y **0 ventas activas**. La interfaz mostró confirmaciones y enlaces de Explorer en las operaciones aceptadas. El rechazo manual se observó como fallo de simulación de Phantom, sin código visible `MontoExcedeTope`; ese código se comprobó de manera independiente en los siete rechazos del conjunto automatizado.

- [**Informe completo de las ocho pruebas manuales, entorno, resultados y limitaciones de evidencia**](docs/PRUEBAS_MANUALES_DEVNET_2026-11-22.md).
- [Pruebas automatizadas de dos wallets (15 transacciones, 7 rechazos)](evidencias/Prueba1795336274564.md).
- [Última compilación automática aprobada](https://github.com/yoshiro-dev/registro_ventas_solana/actions/runs/45005312791).

**Alcance del cierre:** código, despliegue Devnet, pruebas de integración, frontend y documentación finalizados. **No se declara grabado un video de entrega ni enviado un formulario externo**, porque esas acciones no han sido acreditadas.
