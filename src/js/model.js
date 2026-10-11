export const STORAGE_KEY='ritmo-relapses-v1';
export const habitKey=value=>value.trim().toLocaleLowerCase('es');
export function validateEntry(entry,now=new Date()){
 if(!entry.habit?.trim())return 'Escribe el nombre del hábito.';
 if(!Number.isInteger(entry.count)||entry.count<1||entry.count>9999)return 'Introduce un número entero entre 1 y 9999.';
 const date=new Date(entry.occurredAt);
 if(!entry.occurredAt||Number.isNaN(date.getTime()))return 'Introduce una fecha válida.';
 if(date>now)return 'La fecha del registro no puede estar en el futuro.';
 if(entry.endedAt){const end=new Date(entry.endedAt);if(Number.isNaN(end.getTime()))return 'Introduce una fecha final válida.';if(end<date)return 'La fecha final no puede ser anterior al inicio.';if(end>now)return 'La fecha final no puede estar en el futuro.';}
 return null;
}
export function summary(entries,now=new Date()){
 return {total:entries.reduce((sum,e)=>sum+e.count,0),month:entries.filter(e=>{const d=new Date(e.occurredAt);return d.getFullYear()===now.getFullYear()&&d.getMonth()===now.getMonth()}).reduce((sum,e)=>sum+e.count,0),habits:new Set(entries.map(e=>habitKey(e.habit))).size};
}
export function filterEntries(entries,query='',habit=''){
 const q=query.toLocaleLowerCase('es').trim();return entries.filter(e=>(!habit||habitKey(e.habit)===habit)&&[e.habit,e.description,e.comment].join(' ').toLocaleLowerCase('es').includes(q)).sort((a,b)=>new Date(b.occurredAt)-new Date(a.occurredAt));
}
export function loadEntries(storage){
 const raw=storage.getItem(STORAGE_KEY);if(!raw)return [];
 const entries=JSON.parse(raw);if(!Array.isArray(entries)||entries.some(e=>!e||typeof e.id!=='string'||typeof e.habit!=='string'||typeof e.description!=='string'||typeof e.comment!=='string'||validateEntry(e)))throw new Error('Datos inválidos');return entries;
}
