import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {handleApi} from './api.js';
const root=resolve('dist');const mime:Record<string,string>={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json'};
const server=createServer(async(req,res)=>{try{
 const url=new URL(req.url||'/', 'http://localhost');
 if(url.pathname.startsWith('/api/')){
  const chunks:Buffer[]=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>1_000_000){res.writeHead(413);res.end('Solicitud demasiado grande');return}chunks.push(chunk)}
  const request=new Request(url,{method:req.method,headers:{'content-type':'application/json'},...(['GET','HEAD'].includes(req.method||'GET')?{}:{body:Buffer.concat(chunks).toString()})});
  const response=await handleApi(request);res.writeHead(response.status,{'content-type':'application/json'});res.end(await response.text());return;
 }
 const path=resolve(root,'.'+decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname));if(path!==root&&!path.startsWith(root+'/')){res.writeHead(403);res.end();return}
 const body=await readFile(path);res.writeHead(200,{'content-type':mime[extname(path)]||'application/octet-stream'});res.end(body);
 }catch{res.writeHead(404);res.end('No encontrado')}});
server.listen(Number(process.env.PORT||8080),'127.0.0.1',()=>console.log('Ritmo: http://localhost:'+String(process.env.PORT||8080)));
