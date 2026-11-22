import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { generateKeyPairSync } from 'node:crypto';
const file = 'target/deploy/registro-keypair.json';
mkdirSync('target/deploy', { recursive: true });
if (!existsSync(file)) {
  const { privateKey, publicKey } = generateKeyPairSync('ed25519');
  const secret = privateKey.export({format:'der',type:'pkcs8'}).subarray(-32);
  const pub = publicKey.export({format:'der',type:'spki'}).subarray(-32);
  writeFileSync(file, JSON.stringify([...secret,...pub]), {flag:'wx',mode:0o600});
}
const bytes = JSON.parse(readFileSync(file,'utf8'));
if (bytes.length !== 64) throw Error('Keypair de programa inválido');
const pub = Buffer.from(bytes.slice(32));
let n = BigInt('0x'+pub.toString('hex')), id = '';
const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
while (n) { id = alphabet[Number(n % 58n)] + id; n /= 58n; }
for (const byte of pub) { if (byte) break; id='1'+id; }
for (const [path, regex, replacement] of [
 ['programa/src/lib.rs', /declare_id!\("[^"]*"\)/, 'declare_id!("'+id+'")'],
 ['Anchor.toml', /registro = "[^"]*"/, 'registro = "'+id+'"']
]) {
 const old=readFileSync(path,'utf8');
 if (!regex.test(old)) throw Error('No se encontró Program ID en '+path);
 writeFileSync(path,old.replace(regex,replacement));
}
console.log('Program ID local: '+id);
