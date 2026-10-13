import type {Entry} from '../../shared/types.js';
import {validateEntry} from '../../shared/domain/model.js';
import {weekData,weekStart} from '../../shared/domain/statistics.js';
export async function handleApi(request:Request):Promise<Response>{
 const path=new URL(request.url).pathname;
 if(path==='/api/health'&&request.method==='GET')return Response.json({status:'ok'});
 if(request.method!=='POST')return Response.json({error:'Ruta no encontrada'},{status:404});
 let body:unknown;try{body=await request.json()}catch{return Response.json({error:'JSON inválido'},{status:400})}
 if(path==='/api/entries/validate'){
  if(!body||typeof body!=='object')return Response.json({error:'Registro inválido'},{status:400});
  const error=validateEntry(body as Partial<Entry>);return Response.json({valid:!error,error},{status:error?400:200});
 }
 if(path==='/api/statistics'){
  const data=body as {entries?:Entry[];date?:string;metric?:string;category?:string};
  if(!data||!Array.isArray(data.entries)||data.entries.some(e=>!e||typeof e.habit!=='string'||validateEntry(e)))return Response.json({error:'Registros inválidos'},{status:400});
  const date=data.date?new Date(data.date+'T12:00:00'):new Date();if(Number.isNaN(date.getTime())||!['time','count'].includes(data.metric||'time'))return Response.json({error:'Fecha o medida inválida'},{status:400});
  return Response.json({days:weekData(data.entries,weekStart(date),data.metric||'time',data.category||'')});
 }
 return Response.json({error:'Ruta no encontrada'},{status:404});
}
