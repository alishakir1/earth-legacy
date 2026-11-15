import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
const root=resolve(import.meta.dirname,'../dist');
const mime={'.html':'text/html','.js':'application/javascript','.css':'text/css','.json':'application/json','.geojson':'application/json','.webp':'image/webp','.jpg':'image/jpeg','.png':'image/png','.svg':'image/svg+xml'};
createServer(async(req,res)=>{try{const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);const file=resolve(root,'.'+(pathname==='/'?'/index.html':pathname));if(!file.startsWith(root+sep)){res.writeHead(403).end();return}res.setHeader('Content-Type',mime[extname(file)]||'application/octet-stream');res.end(await readFile(file));}catch{res.writeHead(404).end();}}).listen(4173,'127.0.0.1',()=>console.log('Local preview: http://127.0.0.1:4173'));
