import anchor from '@coral-xyz/anchor';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import assert from 'node:assert/strict';
const {AnchorProvider,Program,Wallet,web3}=anchor;
const {PublicKey,Keypair,SystemProgram,Connection,clusterApiUrl}=web3;
const loadKey=path=>Keypair.fromSecretKey(Uint8Array.from(JSON.parse(readFileSync(path,'utf8'))));
if(!process.env.ANCHOR_WALLET || !process.env.WALLET_B) throw Error('Define ANCHOR_WALLET y WALLET_B con rutas de dos wallets de prueba con SOL de Devnet.');
const rpcUrl=process.env.SOLANA_RPC_URL || clusterApiUrl('devnet');
if (!/^https:\/\//.test(rpcUrl)) throw Error('SOLANA_RPC_URL debe ser una URL HTTPS de un RPC de Devnet.');
const conn=new Connection(rpcUrl,'confirmed');
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
const clienteB=pda(Buffer.from('cliente'),segundo.toBuffer(),Buffer.from([1,0]));
const ventaPda=(sku)=>pda(Buffer.from('venta'),cliente.toBuffer(),Buffer.from(sku));
const sku='SSD01',venta=ventaPda(sku), anterior=ventaPda('ANT80'), exacta=ventaPda('L5000');
const cs={...base,cliente}, vs={...cs,venta}, vsAnterior={...cs,venta:anterior}, vsExacta={...cs,venta:exacta};
const evidence={programId:a.programId.toBase58(),negocio:name,cluster:'devnet',casos:[],ejecucion:'real',estado:'en_progreso',walletA:owner.toBase58(),walletB:other.toBase58()};
mkdirSync('evidencias',{recursive:true});
const path='evidencias/'+name+'.json';
const record=(row)=>{evidence.casos.push(row);writeFileSync(path,JSON.stringify(evidence,null,2));};
// Los errores de simulación pueden venir como AnchorError estructurado o como
// texto/logs de Solana. Nunca confundir un fallo RPC 429 con un rechazo de negocio.
const pausaMs=Number(process.env.PAUSA_RPC_MS ?? 1200);
if(!Number.isFinite(pausaMs)||pausaMs<0)throw Error('PAUSA_RPC_MS debe ser un número no negativo.');
const pausa=()=>new Promise(resolve=>setTimeout(resolve,pausaMs));
const eLogs=e=>[e?.logs,e?.transactionLogs,e?.simulationResponse?.logs,e?.error?.logs]
  .filter(Array.isArray).flat().join('\n');
function codigoRechazo(e){
  const estructurado=e?.error?.errorCode?.code ?? e?.errorCode?.code ?? e?.error?.error?.errorCode?.code;
  if(estructurado)return estructurado;
  const texto=String(e?.message??e)+'\n'+eLogs(e);
  const anchorCode=texto.match(/Error Code:\s*([A-Za-z][A-Za-z0-9_]*)/i);
  if(anchorCode)return anchorCode[1];
  const custom=texto.match(/custom program error:\s*0x([0-9a-f]+)/i);
  if(custom){
    const numero=parseInt(custom[1],16);
    if(numero===2006)return 'ConstraintSeeds';
    return idl.errors?.find(item=>item.code===numero)?.name;
  }
  return undefined;
}
function errorRpc(e){
  const texto=String(e?.message??e);
  return /429|Too Many Requests|rate limit/i.test(texto);
}
async function send(label,ix){
  await pausa();
  let firma;
  try{firma=await ix.rpc();}catch(e){
    if(errorRpc(e))throw Error('RPC de Devnet respondió 429 al enviar '+label+'. No repetir sin comprobar el estado en la red; una transacción podría haberse confirmado. Configura SOLANA_RPC_URL con otro endpoint Devnet.');
    throw e;
  }
  record({caso:label,firma,url:'https://explorer.solana.com/tx/'+firma+'?cluster=devnet'});
  console.log('OK '+label+': '+firma);
}
async function reject(label,ix,esperado){
  await pausa();
  try{await ix.simulate();}catch(e){
    if(errorRpc(e))throw Error('RPC de Devnet respondió 429 durante '+label+'. Prueba inconclusa, NO es un rechazo del contrato. Usa SOLANA_RPC_URL con un endpoint Devnet alternativo.');
    const actual=codigoRechazo(e);
    if(actual===undefined){
      console.error('Error sin código Anchor durante '+label+': '+String(e?.message??e));
      const logs=eLogs(e);
      if(logs)console.error('Logs de simulación:\n'+logs);
      throw Error('No se pudo identificar un error Anchor durante '+label+'; prueba inconclusa. Revisa el mensaje y los logs anteriores.',{cause:e});
    }
    assert.equal(actual,esperado,'Error inesperado en '+label+': '+String(e?.message??e));
    record({caso:label,error:actual});
    console.log('Rechazo esperado '+label+': '+actual);
    return;
  }
  throw Error('Se esperaba rechazo y la simulación tuvo éxito: '+label);
}
const programAccount=await conn.getAccountInfo(a.programId);
assert.ok(programAccount?.executable,'Despliega primero el Program ID del IDL en Devnet.');
const m=a.methods;
await send('Crear negocio A',m.crearRegistro(name).accountsStrict({...base,systemProgram}));
await send('Crear negocio B',b.methods.crearRegistro(name).accountsStrict({owner:other,registro:segundo,systemProgram}));
await send('Crear cliente',m.crearCliente('Ana').accountsStrict({...cs,systemProgram}));
await send('Crear otro cliente',m.crearCliente('Luis').accountsStrict({...base,cliente:cliente2,systemProgram}));
await send('Crear cliente B',b.methods.crearCliente('Bea').accountsStrict({owner:other,registro:segundo,cliente:clienteB,systemProgram}));
assert.equal((await a.account.registro.fetch(registro)).topePorVenta,10000);
assert.equal((await b.account.registro.fetch(segundo)).topePorVenta,10000);
await send('Venta en límite inicial de 10000',m.registrarVenta(1,sku,'Disco SSD',10000).accountsStrict({...vs,systemProgram}));
await send('Venta histórica por 8000',m.registrarVenta(1,'ANT80','Venta anterior',8000).accountsStrict({...vsAnterior,systemProgram}));
await send('Cambiar límite A a 5000',m.configurarTope(5000).accountsStrict(base));
assert.equal((await a.account.registro.fetch(registro)).topePorVenta,5000);
assert.equal((await b.account.registro.fetch(segundo)).topePorVenta,10000);
assert.equal((await a.account.venta.fetch(venta)).monto,10000);
assert.equal((await a.account.venta.fetch(anterior)).monto,8000);
record({caso:'B01 conservar ventas antiguas y aislar límites',resultado:'A=5000, B=10000; ventas previas=10000 y 8000'});
const ventaB=pda(Buffer.from('venta'),clienteB.toBuffer(),Buffer.from('B5001'));
await send('Negocio B admite 5001',b.methods.registrarVenta(1,'B5001','Venta B',5001).accountsStrict({owner:other,registro:segundo,cliente:clienteB,venta:ventaB,systemProgram}));
assert.equal((await b.account.venta.fetch(ventaB)).monto,5001);
await send('Alta en frontera 5000 en A',m.registrarVenta(1,'L5000','Venta límite',5000).accountsStrict({...vsExacta,systemProgram}));
assert.equal((await a.account.venta.fetch(exacta)).monto,5000);
await reject('Corrección 5000 a 5001 se rechaza',m.cambiarMonto(1,'L5000',5001).accountsStrict(vsExacta),'MontoExcedeTope');
assert.equal((await a.account.venta.fetch(exacta)).monto,5000);
record({caso:'B02-B03 frontera 5000/5001',resultado:'Venta 5000 confirmada, corrección 5001 rechazada; cuenta conserva 5000'});
await reject('Wallet ajena',b.methods.configurarTope(1).accountsStrict({owner:other,registro}),'NoOwner');
await reject('Límite cero',m.configurarTope(0).accountsStrict(base),'TopeInvalido');
assert.equal((await a.account.registro.fetch(registro)).topePorVenta,5000);
const nueva=ventaPda('RAM01');
await reject('Alta sobre tope',m.registrarVenta(1,'RAM01','Memoria',5001).accountsStrict({...cs,venta:nueva,systemProgram}),'MontoExcedeTope');
assert.equal(await conn.getAccountInfo(nueva),null);
assert.equal((await a.account.cliente.fetch(cliente)).compras,3); // SSD01, ANT80 y L5000 siguen activas.
await reject('Corrección sobre tope',m.cambiarMonto(1,sku,5001).accountsStrict(vs),'MontoExcedeTope');
assert.equal((await a.account.venta.fetch(venta)).monto,10000);
await reject('Venta ajena',m.cambiarMonto(2,sku,5000).accountsStrict({...vs,cliente:cliente2}),'ConstraintSeeds');
await send('Corrección válida',m.cambiarMonto(1,sku,5000).accountsStrict(vs));
assert.equal((await a.account.venta.fetch(venta)).monto,5000);
await reject('Baja con ventas',m.darBajaCliente(1).accountsStrict(cs),'ClienteConVentas');
await send('Devolución de venta inicial',m.hacerDevolucion(1,sku).accountsStrict(vs));
await send('Devolución de venta histórica',m.hacerDevolucion(1,'ANT80').accountsStrict(vsAnterior));
await send('Devolución de venta en frontera',m.hacerDevolucion(1,'L5000').accountsStrict(vsExacta));
assert.equal(await conn.getAccountInfo(venta),null);
assert.equal(await conn.getAccountInfo(anterior),null);
assert.equal(await conn.getAccountInfo(exacta),null);
const empty=await a.account.cliente.fetch(cliente);assert.equal(empty.compras,0);assert.equal(empty.historial.length,0);
await send('Baja de cliente vacío',m.darBajaCliente(1).accountsStrict(cs));
assert.equal(await conn.getAccountInfo(cliente),null);
const final=await a.account.registro.fetch(registro);
assert.equal(final.idCounter,2);assert.ok(!final.clientes.some(k=>k.equals(cliente)));
record({caso:'Comprobación final',resultado:'Cuentas verificadas con dos negocios y dos wallets; bajas, rechazos y aislamiento comprobados'});
evidence.estado='completada';
evidence.finalizadoEn=new Date().toISOString();
writeFileSync(path,JSON.stringify(evidence,null,2)+'\n');
const completed=evidence.casos.filter(x=>x.firma).length;
const rejections=evidence.casos.filter(x=>x.error).length;
const reportPath='evidencias/'+name+'.md';
writeFileSync(reportPath,[
  '# Evidencia de ejecución real en Solana Devnet',
  '',
  '- Programa: \`'+evidence.programId+'\`',
  '- Negocio de prueba: '+name,
  '- Wallet A: \`'+evidence.walletA+'\`',
  '- Wallet B: \`'+evidence.walletB+'\`',
  '- Estado: **completada**',
  '- Operaciones confirmadas: '+completed,
  '- Simulaciones rechazadas correctamente: '+rejections,
  '',
  '| Caso | Evidencia observada |',
  '| --- | --- |',
  ...evidence.casos.map(x=>'| '+x.caso+' | '+(x.url?'[Firma confirmada]('+x.url+')':x.error?'Rechazo \`'+x.error+'\`':x.resultado)+' |'),
  ''
].join('\n'));
console.log('Pruebas completas. Evidencia JSON: '+path);
console.log('Informe con enlaces a Explorer: '+reportPath);
