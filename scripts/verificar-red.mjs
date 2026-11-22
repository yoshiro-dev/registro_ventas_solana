import anchor from '@coral-xyz/anchor';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import assert from 'node:assert/strict';
const {AnchorProvider,Program,Wallet,web3}=anchor;
const {PublicKey,Keypair,SystemProgram,Connection,clusterApiUrl}=web3;
const loadKey=path=>Keypair.fromSecretKey(Uint8Array.from(JSON.parse(readFileSync(path,'utf8'))));
if(!process.env.ANCHOR_WALLET || !process.env.WALLET_B) throw Error('Define ANCHOR_WALLET y WALLET_B con rutas de dos wallets de prueba con SOL de Devnet.');
const conn=new Connection(clusterApiUrl('devnet'),'confirmed');
const idl=JSON.parse(readFileSync('app/src/idl.json','utf8'));
const clients=[process.env.ANCHOR_WALLET,process.env.WALLET_B].map(path=>{
  const payer=loadKey(path);
  return new Program(idl,new AnchorProvider(conn,new Wallet(payer),{commitment:'confirmed',preflightCommitment:'confirmed'}));
});
const [a,b]=clients;
const owner=a.provider.wallet.publicKey, other=b.provider.wallet.publicKey;
assert.ok(!owner.equals(other),'Se requieren dos autoridades distintas');
const name='Prueba'+Date.now();
const pda=(...seeds)=>PublicKey.findProgramAddressSync(seeds,a.programId)[0];
const reg=authority=>pda(Buffer.from('registro'),Buffer.from(name),authority.toBuffer());
const registro=reg(owner), segundo=reg(other), systemProgram=SystemProgram.programId;
const base={owner,registro};
const clientePda=(id)=>{const n=Buffer.alloc(2);n.writeUInt16LE(id);return pda(Buffer.from('cliente'),registro.toBuffer(),n);};
const cliente=clientePda(1), cliente2=clientePda(2);
const ventaPda=(sku)=>pda(Buffer.from('venta'),cliente.toBuffer(),Buffer.from(sku));
const sku='SSD01',venta=ventaPda(sku), cs={...base,cliente}, vs={...cs,venta};
const evidence={programId:a.programId.toBase58(),negocio:name,cluster:'devnet',casos:[]};
mkdirSync('evidencias',{recursive:true});
const path='evidencias/'+name+'.json';
const record=(row)=>{evidence.casos.push(row);writeFileSync(path,JSON.stringify(evidence,null,2));};
async function send(label,ix){const firma=await ix.rpc();record({caso:label,firma,url:'https://explorer.solana.com/tx/'+firma+'?cluster=devnet'});}
async function reject(label,ix,code){
  try {await ix.simulate();}catch(e){
    const actual=e.error?.errorCode?.code;
    assert.equal(actual,code,String(e));
    record({caso:label,error:actual});return;
  }
  throw Error('Se esperaba rechazo: '+label);
}
const m=a.methods;
await send('Crear negocio A',m.crearRegistro(name).accountsStrict({...base,systemProgram}));
await send('Crear negocio B',b.methods.crearRegistro(name).accountsStrict({owner:other,registro:segundo,systemProgram}));
await send('Crear cliente',m.crearCliente('Ana').accountsStrict({...cs,systemProgram}));
await send('Crear otro cliente',m.crearCliente('Luis').accountsStrict({...base,cliente:cliente2,systemProgram}));
await send('Venta en el límite inicial',m.registrarVenta(1,sku,'Disco SSD',10000).accountsStrict({...vs,systemProgram}));
await send('Cambiar límite',m.configurarTope(5000).accountsStrict(base));
assert.equal((await a.account.registro.fetch(segundo)).topePorVenta,10000);
assert.equal((await a.account.venta.fetch(venta)).monto,10000);
await reject('Wallet ajena',b.methods.configurarTope(1).accountsStrict({owner:other,registro}),'NoOwner');
await reject('Límite cero',m.configurarTope(0).accountsStrict(base),'TopeInvalido');
assert.equal((await a.account.registro.fetch(registro)).topePorVenta,5000);
const nueva=ventaPda('RAM01');
await reject('Alta sobre tope',m.registrarVenta(1,'RAM01','Memoria',5001).accountsStrict({...cs,venta:nueva,systemProgram}),'MontoExcedeTope');
assert.equal(await conn.getAccountInfo(nueva),null);
assert.equal((await a.account.cliente.fetch(cliente)).compras,1);
await reject('Corrección sobre tope',m.cambiarMonto(1,sku,5001).accountsStrict(vs),'MontoExcedeTope');
assert.equal((await a.account.venta.fetch(venta)).monto,10000);
await reject('Venta ajena',m.cambiarMonto(2,sku,5000).accountsStrict({...vs,cliente:cliente2}),'ConstraintSeeds');
await send('Corrección válida',m.cambiarMonto(1,sku,5000).accountsStrict(vs));
assert.equal((await a.account.venta.fetch(venta)).monto,5000);
await reject('Baja con ventas',m.darBajaCliente(1).accountsStrict(cs),'ClienteConVentas');
await send('Devolución',m.hacerDevolucion(1,sku).accountsStrict(vs));
assert.equal(await conn.getAccountInfo(venta),null);
const empty=await a.account.cliente.fetch(cliente);assert.equal(empty.compras,0);assert.equal(empty.historial.length,0);
await send('Baja de cliente vacío',m.darBajaCliente(1).accountsStrict(cs));
assert.equal(await conn.getAccountInfo(cliente),null);
const final=await a.account.registro.fetch(registro);
assert.equal(final.idCounter,2);assert.ok(!final.clientes.some(k=>k.equals(cliente)));
record({caso:'Comprobación final',resultado:'Cuentas verificadas'});console.log(path);
