# Anexo: capturas de pruebas manuales en Solana Devnet

Capturas originales aportadas en la revisión del 22 de noviembre de 2026. Todas están **recortadas sin alterar su contenido** para eliminar pestañas, barras del navegador y secciones de Phantom que no constituyen evidencia. Los recortes tienen resolución nativa; no se han fabricado saldos, firmas, errores ni resultados.

> La evidencia visual muestra resultados de la interfaz. Los enlaces transaccionales verificables están en [`evidencias/Prueba1795336274564.md`](../Prueba1795336274564.md), que documenta un **recorrido automatizado distinto**. El rechazo manual M06 es un fallo de simulación genérico, no una firma fallida en la cadena.

## M01 — Phantom conectado a Solana Devnet

![M01: modo Solana Devnet en React y dirección pública conectada](M01_wallet_conectada_devnet.png)

## M02 — Creación de SCARIX, límite inicial 10 000

![M02: SCARIX creado en Devnet con límite 10 000 y confirmación](M02_scarix_creado_10000.png)

## M03 — Alta de Ana e inspección en Explorer

![M03: Ana, cliente número uno](M03_ana_cliente_1.png)

![M03: transacción exitosa y finalizada en Solana Explorer](M03_transaccion_explorer_finalized.png)

## M04 — Venta SSD01, Disco SSD, 5 000 unidades

![M04: venta de 5 000 registrada en Devnet](M04_venta_ssd01_5000.png)

## M05 — Reducir límite a 5 000 conservando la venta

![M05: límite a 5 000 y venta previa conservada](M05_limite_reducido_5000.png)

## M06 — Intento rechazado de corrección a 5 001

La captura conserva **simultáneamente** la operación 5 001 solicitada y el aviso de Phantom de simulación fallida. El usuario canceló la operación, que **no se confirmó en la cadena**. La lectura posterior conservó la venta en 5 000.

![M06: error de simulación en Phantom durante la corrección prohibida](M06_rechazo_simulacion_phantom.png)

![M06: venta conservada en 5 000 tras cancelar la solicitud](M06_correcion_5001_no_aplicada.png)

## M07 — Devolución de la venta SSD01

![M07: Ana sigue activa, sin ventas después de la devolución](M07_venta_devuelta.png)

![M07: confirmación Phantom y recuperación de depósito de almacenamiento](M07_phantom_devolucion_rent.png)

## M08 — Baja de Ana sin ventas activas

![M08: SCARIX permanece con límite 5 000 y sin clientes](M08_cliente_dado_de_baja.png)

![M08: Phantom y cierre de cuenta del cliente](M08_phantom_baja_rent.png)

## Resultado

SCARIX sigue disponible en Devnet con límite de **5 000**, sin clientes ni ventas activas. La prueba automatizada adicional validó explícitamente `MontoExcedeTope`, las autoridades y las PDAs por separado.
