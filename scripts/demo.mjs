import {readFileSync,writeFileSync} from 'node:fs';
const read=path=>readFileSync(path,'utf8');
const local=read('app/src/local.mjs').replace('export function','function');
const panel=read('app/src/panel.mjs').replace("import {localClient} from './local.mjs';",'').replace('export function','function');
const icon='data:image/png;base64,'+readFileSync('app/public/favicon.png').toString('base64');
const html=read('app/demo.html')
  .replace('./public/favicon.png',icon)
  .replace('<link rel="stylesheet" href="./src/style.css">','<style>'+read('app/src/style.css')+'</style>')
  .replace(/<script type="module">[\s\S]*?<\/script>/,()=>'<script>'+local+'\n'+panel.replace('./public/favicon.png',icon)+'\nmount(document.querySelector("#root"));<\/script>');
writeFileSync('Demo_local.html',html);
