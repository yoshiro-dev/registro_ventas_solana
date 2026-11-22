export function localClient(storage) {
  const key='registro-ventas:demo:v1';
  function all(){ return JSON.parse(storage.getItem(key) || '[]'); }
  return {
    owner:'Cuenta de práctica',
    read(name){ return all().find(row=>row.name===name) ?? null; },
    run(name,op,data){
      const rows=all();
      const business=rows.find(row=>row.name===name);
      if(op==='create'){
        if(business) throw Error('El negocio ya existe.');
        rows.push({name,limit:10000,next:1,clients:[]});
      } else {
        if(!business) throw Error('Primero crea el negocio.');
        const clients=business.clients;
        if(op==='limit') {
          if(!Number.isInteger(data.amount)||data.amount<1||data.amount>4294967295) throw Error('TopeInvalido');
          business.limit=data.amount;
        } else if(op==='customer'){
          if(clients.length>=10 || business.next>65535) throw Error('CapacidadAgotada');
          clients.push({id:business.next++,name:data.name,sales:[]});
        } else {
          const client=clients.find(row=>row.id===data.id);
          if(!client) throw Error('Selecciona un cliente.');
          const sale=client.sales.find(row=>row.sku===data.sku);
          if(op==='close'){
            if(client.sales.length) throw Error('ClienteConVentas');
            clients.splice(clients.indexOf(client),1);
          } else if(op==='return'){
            if(!sale) throw Error('Venta inexistente.');
            client.sales.splice(client.sales.indexOf(sale),1);
          } else if(op==='sale'||op==='edit'){
            if(!Number.isInteger(data.amount)||data.amount<1) throw Error('DatosInvalidos');
            if(data.amount>business.limit) throw Error('MontoExcedeTope');
            if(op==='sale'){
              if(sale) throw Error('Este SKU ya está registrado.');
              if(client.sales.length>=10) throw Error('CapacidadAgotada');
              client.sales.push({sku:data.sku,description:data.description,amount:data.amount});
            } else {
              if(!sale) throw Error('Venta inexistente.');
              sale.amount=data.amount;
            }
          } else throw Error('Operación desconocida.');
        }
      }
      storage.setItem(key,JSON.stringify(rows));
      return null;
    }
  };
}
