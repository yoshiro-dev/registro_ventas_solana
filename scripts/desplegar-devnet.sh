#!/usr/bin/env bash
# Despliegue reproducible en Devnet desde Linux/WSL. Nunca imprime claves secretas.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

for cmd in node npm anchor solana solana-keygen; do
  if ! command -v "$cmd" >/dev/null 2>&1; then
    echo "Falta $cmd. Instala Node 22, Anchor CLI 0.31.1 y Solana CLI antes de desplegar." >&2
    exit 1
  fi
done

if ! anchor --version | grep -Fq 'anchor-cli 0.31.1'; then
  echo "Se requiere Anchor CLI 0.31.1 (versión del proyecto)." >&2
  exit 1
fi

export ANCHOR_WALLET="${ANCHOR_WALLET:-$HOME/.config/solana/id.json}"
if [[ ! -r "$ANCHOR_WALLET" ]]; then
  echo "No se encuentra la wallet de despliegue en ANCHOR_WALLET=$ANCHOR_WALLET" >&2
  echo "Crea una wallet de PRUEBAS de Devnet en tu equipo, no compartas su clave." >&2
  exit 1
fi

if [[ -n "${WALLET_B:-}" && ! -r "$WALLET_B" ]]; then
  echo "WALLET_B está definida pero su archivo no existe o no se puede leer." >&2
  exit 1
fi

echo "Wallet de despliegue (solo clave pública):"
solana-keygen pubkey "$ANCHOR_WALLET"
echo "Saldo disponible en Devnet:"
solana balance --url devnet --keypair "$ANCHOR_WALLET"

npm ci --no-audit --no-fund
# Crea la clave del PROGRAMA si todavía no existe. Nunca la borres: hace falta para upgrades.
npm run preparar
PROGRAM_ID="$(solana-keygen pubkey target/deploy/registro-keypair.json)"
export PROGRAM_ID
echo "Program ID que se desplegará: $PROGRAM_ID"

# La clave creada por preparar debe coincidir con el ID de Anchor.toml.
node --input-type=module -e "
import {readFileSync} from 'node:fs';
const config=readFileSync('Anchor.toml','utf8');
const rust=readFileSync('programa/src/lib.rs','utf8');
const id=process.env.PROGRAM_ID;
if (!config.includes('registro = \"'+id+'\"') || !rust.includes('declare_id!(\"'+id+'\")')) {
  throw new Error('Program ID no sincronizado en Anchor.toml y lib.rs');
}
"

anchor build
test -s target/deploy/registro.so
test -s target/idl/registro.json
npm run idl
npm test
npm run build

echo "Desplegando SOLO en Devnet; las firmas consumirán SOL de prueba..."
anchor deploy --provider.cluster devnet --provider.wallet "$ANCHOR_WALLET"

echo "Verificando que el programa ya es ejecutable en Devnet..."
solana program show "$PROGRAM_ID" --url devnet
echo "Programa en Explorer: https://explorer.solana.com/address/$PROGRAM_ID?cluster=devnet"

if [[ -n "${WALLET_B:-}" ]]; then
  echo "Ejecutando pruebas reales con dos wallets distintas..."
  node scripts/verificar-red.mjs
else
  echo "Programa desplegado, pero las pruebas de dos wallets siguen pendientes."
  echo "Para ejecutarlas define WALLET_B=/ruta/segundo-wallet.json y ejecuta:"
  echo "  node scripts/verificar-red.mjs"
fi

echo "Revisa los cambios de ID en Git y los archivos evidencias/*.json y *.md."
echo "Conserva en privado target/deploy/registro-keypair.json."
