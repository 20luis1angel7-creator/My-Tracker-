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
const requestedPort=process.env.PORT;
let port=Number(requestedPort||8080);
const firstPort=port;
if(!Number.isInteger(port)||port<0||port>65535){console.error('PORT debe ser un número entero entre 0 y 65535.');process.exit(1)}
server.on('error',(error:NodeJS.ErrnoException)=>{
 if(error.code==='EADDRINUSE'&&!requestedPort&&port<firstPort+20){console.log(`Puerto ${port} ocupado; probando ${port+1}…`);port++;server.listen(port,'127.0.0.1');return}
 console.error(error.code==='EADDRINUSE'?`El puerto ${port} está ocupado. Cierra el servidor anterior con fg y Ctrl+C, o usa otro puerto: PORT=${port+1} npm start.`:`No se pudo iniciar el servidor: ${error.message}`);
 process.exitCode=1;
});
server.on('listening',()=>{const address=server.address();if(address&&typeof address!=='string')console.log(`Ritmo: http://localhost:${address.port}`)});
server.listen(port,'127.0.0.1');
