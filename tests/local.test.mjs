import test from 'node:test';
import assert from 'node:assert/strict';
import {localClient} from '../app/src/local.mjs';
function fixture(){
  const db=new Map();
  const store={getItem:k=>db.get(k),setItem:(k,v)=>db.set(k,v)};
  const api=localClient(store);
  for(const name of ['SCARIX','Otro']){
    api.run(name,'create',{});
    api.run(name,'customer',{name:'Ana'});
  }
  return {api,store};
}
const sale={id:1,sku:'SSD01',description:'Disco SSD',amount:8000};
test('reducir el límite conserva ventas previas y aísla los negocios',()=>{
  const {api,store}=fixture();
  api.run('SCARIX','sale',sale);api.run('SCARIX','limit',{amount:5000});
  assert.equal(localClient(store).read('SCARIX').clients[0].sales[0].amount,8000);
  assert.equal(api.read('Otro').limit,10000);
  assert.throws(()=>api.run('SCARIX','edit',{...sale,amount:5001}),/MontoExcedeTope/);
  assert.equal(api.read('SCARIX').clients[0].sales[0].amount,8000);
  api.run('SCARIX','edit',{...sale,amount:5000});
  assert.equal(api.read('SCARIX').clients[0].sales[0].amount,5000);
});
test('alta en frontera, rechazo atómico y límite positivo',()=>{
  const {api}=fixture();
  api.run('SCARIX','sale',{...sale,amount:10000});
  const before=api.read('SCARIX');
  assert.throws(()=>api.run('SCARIX','sale',{...sale,sku:'RAM01',amount:10001}),/MontoExcedeTope/);
  assert.throws(()=>api.run('SCARIX','limit',{amount:0}),/TopeInvalido/);
  assert.deepEqual(api.read('SCARIX'),before);
});
test('devolución, baja condicionada y contador monotónico',()=>{
  const {api}=fixture();
  api.run('SCARIX','sale',sale);
  assert.throws(()=>api.run('SCARIX','close',sale),/ClienteConVentas/);
  api.run('SCARIX','return',sale);api.run('SCARIX','close',sale);
  api.run('SCARIX','customer',{name:'Eva'});
  assert.equal(api.read('SCARIX').clients[0].id,2);
});
