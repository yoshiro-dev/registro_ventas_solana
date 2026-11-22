import {AnchorProvider, Program, type Idl} from '@coral-xyz/anchor';
import {Connection, PublicKey, SystemProgram, clusterApiUrl} from '@solana/web3.js';
import {Buffer} from 'buffer';
import idl from './idl.json';

type Wallet = ConstructorParameters<typeof AnchorProvider>[1];
type InjectedWallet = Wallet & {connect(): Promise<unknown>};
type ClientRow = {id:number;name:string;sales:{sku:string;description:string;amount:number}[]};
type RegistryAccount = {idCounter:number;topePorVenta:number;clientes:PublicKey[]};
type CustomerAccount = {idCliente:number;nombre:string;historial:PublicKey[]};
type SaleAccount = {sku:string;descripcion:string;monto:number};

export async function connectDevnet() {
  const browser = window as Window & {phantom?:{solana:InjectedWallet};solflare?:InjectedWallet;solana?:InjectedWallet};
  const wallet = browser.phantom?.solana ?? browser.solflare ?? browser.solana;
  if (!wallet) throw Error('Instala o habilita una wallet Solana compatible en este navegador.');
  await wallet.connect();
  const owner = new PublicKey(wallet.publicKey.toBytes());
  // En un RPC público con balanceo de carga, un nodo puede simular en un slot
  // anterior al blockhash obtenido de otro nodo y devolver "Blockhash not found".
  // El blockhash y el preflight deben usar el mismo compromiso. "finalized"
  // reduce las discrepancias entre nodos, a cambio de menos tiempo para firmar.
  const customRpc = import.meta.env.VITE_SOLANA_RPC_URL?.trim();
  if (customRpc && !/^https:\/\//.test(customRpc)) {
    throw Error('VITE_SOLANA_RPC_URL debe ser una URL HTTPS de un RPC Solana Devnet.');
  }
  const connection = new Connection(customRpc || clusterApiUrl('devnet'),'finalized');
  const provider = new AnchorProvider(connection,wallet,{
    commitment:'confirmed',
    preflightCommitment:'finalized',
    maxRetries:5
  });
  const program = new Program(idl as Idl,provider);
  const account = await connection.getAccountInfo(program.programId);
  if (!account?.executable) throw Error('El Program ID del IDL todavía no corresponde a un programa ejecutable en Devnet.');
  const accounts = program.account as unknown as {
    registro:{fetchNullable(k:PublicKey):Promise<RegistryAccount|null>};
    cliente:{fetch(k:PublicKey):Promise<CustomerAccount>};
    venta:{fetch(k:PublicKey):Promise<SaleAccount>};
  };
  const pda = (...seeds:Buffer[]) => PublicKey.findProgramAddressSync(seeds,program.programId)[0];
  const text = (value:string) => Buffer.from(value,'utf8');
  const registry = (name:string) => pda(text('registro'),text(name),owner.toBuffer());
  function customer(registro:PublicKey,id:number) {
    const bytes = Buffer.alloc(2); bytes.writeUInt16LE(id);
    return pda(text('cliente'),registro.toBuffer(),bytes);
  }
  return {
    owner:owner.toBase58(),
    async read(name:string) {
      const state = await accounts.registro.fetchNullable(registry(name));
      if (!state) return null;
      const clients:ClientRow[] = await Promise.all(state.clientes.map(async key => {
        const row = await accounts.cliente.fetch(key);
        const sales = await Promise.all(row.historial.map(async address => {
          const s = await accounts.venta.fetch(address);
          return {sku:s.sku,description:s.descripcion,amount:s.monto};
        }));
        return {id:row.idCliente,name:row.nombre,sales};
      }));
      return {limit:state.topePorVenta,clients};
    },
    async run(name:string, op:string, input:{id:number;name:string;sku:string;description:string;amount:number}) {
      if (!wallet.publicKey?.equals(owner)) throw Error('La cuenta de wallet cambió. Vuelve a conectar.');
      const registro=registry(name), base={registro,owner}, systemProgram=SystemProgram.programId;
      const m=program.methods;
      if(op==='create') return m.crearRegistro(name).accountsStrict({...base,systemProgram}).rpc();
      if(op==='limit') return m.configurarTope(input.amount).accountsStrict(base).rpc();
      if(op==='customer'){
        const state=await accounts.registro.fetchNullable(registro);
        if(!state) throw Error('Primero crea el negocio.');
        const cliente=customer(registro,state.idCounter+1);
        return m.crearCliente(input.name).accountsStrict({...base,cliente,systemProgram}).rpc();
      }
      const cliente=customer(registro,input.id);
      if(op==='close') return m.darBajaCliente(input.id).accountsStrict({...base,cliente}).rpc();
      const venta=pda(text('venta'),cliente.toBuffer(),text(input.sku));
      const saleAccounts={...base,cliente,venta};
      if(op==='sale') return m.registrarVenta(input.id,input.sku,input.description,input.amount).accountsStrict({...saleAccounts,systemProgram}).rpc();
      if(op==='edit') return m.cambiarMonto(input.id,input.sku,input.amount).accountsStrict(saleAccounts).rpc();
      if(op==='return') return m.hacerDevolucion(input.id,input.sku).accountsStrict(saleAccounts).rpc();
      throw Error('Operación desconocida.');
    }
  };
}
