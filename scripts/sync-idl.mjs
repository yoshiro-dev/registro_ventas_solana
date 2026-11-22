import {readFileSync,writeFileSync} from 'node:fs';
const idl=JSON.parse(readFileSync(process.argv[2] || 'target/idl/registro.json','utf8'));
const names=new Set(idl.instructions.map(ix=>ix.name));
for(const name of ['crear_registro','crear_cliente','registrar_venta','cambiar_monto','hacer_devolucion','dar_baja_cliente','configurar_tope']){
 if(!names.has(name)) throw Error('Falta instrucción '+name);
}
if(!readFileSync('programa/src/lib.rs','utf8').includes('declare_id!("'+idl.address+'")')) throw Error('Program ID distinto del código Rust');
writeFileSync('app/src/idl.json',JSON.stringify(idl,null,2)+'\n');
console.log('IDL sincronizado para '+idl.address);
