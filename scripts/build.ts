import {cp,mkdir,rm} from 'node:fs/promises';
await rm('dist',{recursive:true,force:true});
await mkdir('dist/frontend/src',{recursive:true});
await cp('frontend/index.html','dist/index.html');
await cp('build/frontend/src','dist/frontend/src',{recursive:true});
await cp('frontend/src/styles','dist/frontend/src/styles',{recursive:true});
await cp('build/shared','dist/shared',{recursive:true});
console.log('Frontend TypeScript compilado en dist/; backend compilado en build/backend/');
