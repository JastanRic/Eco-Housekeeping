const C="mahoora-housekeeping-v3",PDFLIB="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
const F=["./","./index.html","./inspection.html","./app.js","./style.css","./manifest.webmanifest","./icon.svg"];
self.addEventListener("install",e=>{self.skipWaiting();e.waitUntil(caches.open(C).then(c=>c.addAll(F).then(()=>c.add(new Request(PDFLIB,{mode:"cors"})).catch(()=>{}))))});
self.addEventListener("activate",e=>e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))).then(()=>self.clients.claim())));
self.addEventListener("fetch",e=>{
  if(e.request.method!=="GET")return;
  const u=new URL(e.request.url);
  if(e.request.url===PDFLIB){e.respondWith(caches.match(e.request).then(m=>m||fetch(new Request(PDFLIB,{mode:"cors"})).then(r=>{const c=r.clone();caches.open(C).then(x=>x.put(PDFLIB,c));return r})));return}
  if(u.origin!==location.origin)return;
  e.respondWith(fetch(e.request).then(r=>{const c=r.clone();caches.open(C).then(x=>x.put(e.request,c));return r}).catch(()=>caches.match(e.request).then(m=>m||caches.match("./index.html"))));
});
