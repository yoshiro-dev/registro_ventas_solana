import {localClient} from './local.mjs';

const actions = {
  create:['Crear negocio',[]],
  customer:['Dar de alta cliente',['name']],
  sale:['Registrar venta',['id','sku','description','amount']],
  edit:['Corregir importe',['id','sku','amount']],
  return:['Devolver venta',['id','sku']],
  close:['Dar de baja cliente',['id']],
  limit:['Cambiar límite',['amount']]
};
const fmt=new Intl.NumberFormat('es-MX');
function field(label,key,control){
  return '<label data-field="'+key+'">'+label+control+'</label>';
}
export function mount(root,connectDevnet){
  const fields=[
    field('Nombre del cliente','name','<input name="name" maxlength="30" required>'),
    field('Cliente','id','<select name="id" required></select>'),
    field('SKU','sku','<input name="sku" maxlength="5" required placeholder="SSD01">'),
    field('Descripción','description','<input name="description" maxlength="50" required placeholder="Disco SSD">'),
    field('Importe en unidades','amount','<input type="number" name="amount" min="1" max="4294967295" step="1" required value="5000">')
  ].join('');
  root.innerHTML='<header><div class="brand"><img src="./public/favicon.png" alt=""><strong>Registro de ventas</strong></div><span id="mode">Práctica local</span></header>'
    +'<section class="heading"><p class="eyebrow">Punto de venta</p><h1>Registro del negocio</h1><p id="account">Datos de práctica guardados en este navegador.</p><button type="button" id="connect">Conectar wallet en Devnet</button></section>'
    +'<form id="lookup"><label>Nombre del negocio<input name="business" maxlength="30" value="SCARIX" required></label><button>Consultar</button></form>'
    +'<section class="columns"><article><h2>Operaciones</h2><form id="operation"><label>Acción<select name="action"></select></label>'+fields+'<button class="primary">Crear negocio</button></form></article>'
    +'<article><div class="summary"><div><p class="eyebrow">Negocio consultado</p><h2 id="current"></h2></div><div><p class="eyebrow">Límite vigente</p><strong id="cap">—</strong></div></div><h3>Clientes y ventas activas</h3><div id="rows"></div></article></section>'
    +'<footer><output id="status" aria-live="polite"></output> <a id="explorer" target="_blank" rel="noreferrer" hidden>Ver transacción en Explorer ↗</a></footer>';
  const get=id=>root.querySelector('#'+id);
  const operation=get('operation'), lookup=get('lookup'), el=operation.elements;
  let storage;
  try {
    storage=window.localStorage;
    storage.getItem('registro-ventas:demo:v1');
  } catch {
    const memory=new Map();
    storage={getItem:key=>memory.get(key),setItem:(key,value)=>memory.set(key,value)};
    get('account').textContent='Datos de práctica en memoria durante esta sesión.';
  }
  if(connectDevnet) root.querySelector('.brand img').src='/favicon.png';
  const local=localClient(storage);
  let client=local,name='SCARIX',state=null;
  const connect=get('connect'); connect.hidden=!connectDevnet;
  for(const [value,[label]] of Object.entries(actions)) el.action.add(new Option(label,value));
  function syncFields(){
    const [caption,visible]=actions[el.action.value];
    for(const label of operation.querySelectorAll('[data-field]')){
      label.hidden=!visible.includes(label.dataset.field);
      label.firstElementChild.disabled=label.hidden;
    }
    operation.querySelector('button').textContent=caption;
  }
  function paint(){
    get('current').textContent=name;
    get('cap').textContent=state?fmt.format(state.limit):'—';
    const rows=get('rows'); rows.replaceChildren();
    const selected=el.id.value; el.id.replaceChildren();
    for(const c of state?.clients || []){
      el.id.add(new Option(c.name+' · #'+c.id,String(c.id)));
      const title=document.createElement('h4');title.textContent=c.name+' · #'+c.id;rows.append(title);
      if(!c.sales.length){const p=document.createElement('p');p.textContent='Sin ventas activas.';rows.append(p);}
      for(const s of c.sales){
        const line=document.createElement('p');line.className='line';
        const sku=document.createElement('span');sku.textContent=s.sku+' · '+s.description;
        const amount=document.createElement('strong');amount.textContent=fmt.format(s.amount);
        line.append(sku,amount);rows.append(line);
      }
    }
    if([...el.id.options].some(o=>o.value===selected)) el.id.value=selected;
    if(!el.id.options.length) rows.textContent=state?'Todavía no hay clientes.':'El negocio aún no existe.';
    syncFields();
  }
  function setBusy(value){
    for(const item of root.querySelectorAll('button,input,select')) item.disabled=value;
    if(!value) syncFields();
  }
  async function perform(task){
    setBusy(true);get('status').textContent='Procesando…';get('explorer').hidden=true;
    try {get('status').textContent=await task();}
    catch(error){get('status').textContent=error?.error?.errorMessage || error?.message || String(error);}
    finally{setBusy(false);}
  }
  async function refresh(){state=await client.read(name);paint();}
  function validText(value,max){
    if(!value.trim() || new TextEncoder().encode(value).length>max) throw Error('El texto debe contener entre 1 y '+max+' bytes.');
    return value.trim();
  }
  el.action.onchange=syncFields;
  lookup.onsubmit=e=>{e.preventDefault();perform(async()=>{
    const next=validText(lookup.elements.business.value,30);
    const found=await client.read(next);name=next;state=found;paint();
    el.action.value=state?'customer':'create';syncFields();return 'Consulta completada.';
  });};
  connect.onclick=()=>perform(async()=>{
    if(client!==local){client=local;get('mode').textContent='Práctica local';get('account').textContent='Datos guardados en este navegador.';connect.textContent='Conectar wallet en Devnet';}
    else {client=await connectDevnet();get('mode').textContent='Solana Devnet';get('account').textContent=client.owner;connect.textContent='Volver a práctica local';}
    state=null;paint();await refresh();return 'Entorno actualizado.';
  });
  operation.onsubmit=e=>{e.preventDefault();perform(async()=>{
    if(lookup.elements.business.value.trim()!==name) throw Error('Consulta el negocio escrito antes de operar.');
    const op=el.action.value;
    const data={id:Number(el.id.value),name:el.name.value.trim(),sku:el.sku.value.trim(),description:el.description.value.trim(),amount:Number(el.amount.value)};
    for(const [key,max] of [['name',30],['sku',5],['description',50]]) if(actions[op][1].includes(key)) validText(data[key],max);
    const sig=await client.run(name,op,data);
    if(sig){get('explorer').href='https://explorer.solana.com/tx/'+encodeURIComponent(sig)+'?cluster=devnet';get('explorer').hidden=false;}
    try{await refresh();}catch{throw Error('Operación confirmada. Consulta de nuevo para actualizar las cuentas.');}
    if(op==='create') el.action.value='customer';
    if(op==='customer') {el.action.value='sale';el.id.value=String(state.clients.at(-1).id);}
    syncFields();return sig?'Operación confirmada en Devnet.':'Operación guardada en práctica local.';
  });};
  state=local.read(name);if(state) el.action.value=state.clients.length?'sale':'customer';paint();
}
