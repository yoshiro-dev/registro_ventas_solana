import React, {useEffect,useRef} from 'react';
import {createRoot} from 'react-dom/client';
import {Buffer} from 'buffer';
import {mount} from './panel.mjs';
Object.assign(globalThis,{Buffer});
function App(){
  const ref=useRef<HTMLDivElement>(null);
  useEffect(()=>{
    if(ref.current) mount(ref.current, async()=> (await import('./devnet')).connectDevnet());
  },[]);
  return <div ref={ref}/>;
}
createRoot(document.getElementById('root')!).render(<App/>);
