/* Shared code: settings, checklist items, offline storage, Google Sheet/Drive sync, PDF */
const CONFIG={
  SCRIPT_URL:"https://script.google.com/macros/s/AKfycbwKrKZ-93Bq7KdYM8FQtv1SBGV9ZTIu02HYlXYIukQG9eFUxT10sF00ZgM7x0XgaO9ygg/exec", /* Apps Script > Deploy > Web app URL */
  KEY:"Mahoora2026"                    /* must match SECRET in Code.gs */
};
const SECTIONS=[
{part:"Tent / accommodation checklist",name:"Living Area",items:["Door lock / No gaps","Power supply light and switches","Fan","Room is clean - walls / floor and other items","All items are in the right place","Curtains"]},
{part:"Tent / accommodation checklist",name:"Bedroom",items:["Beds made","Other items in the right place","Linen clean and neat"]},
{part:"Tent / accommodation checklist",name:"Washroom",items:["Clean and dust free","Shower area","No leaks / no water"]},
{part:"Tent / accommodation checklist",name:"General",items:["Safety booklet in place","ECO cream hung","All carpets in place","Bino / Raincoats / umbrellas"]},
{part:"Tent / accommodation checklist",name:"Outside",items:["Chairs, table rack / carpets / other","Floor sheet is clean","Fly sheets are good"]},
{part:"Item check list: bedroom and living room",name:"Bedroom & living room items",items:["Side table / table cloth","Floor cushions (1)","Pillows (4)","Oil canter / oil lamp","Bed throw cushions (2)","Bed sheets / cover","Bell","Bed runner","Furniture (chair, luggage rack)","Water bottles (2)","Light bulbs","Floor mats (2 for living and bed room)","Glasses and glass covers","Raincoats (2)","Bino","Safety booklet","Umbrellas","Eco cream wall hanger"]},
{part:"Bathroom checklist",name:"Bathroom items",items:["Carpets (03): commode, outside the shower and near the sink","All amenities","Towels","Hangers","Soap","Toilet roll"]}
];
const $=id=>document.getElementById(id);
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const KEYS=[];SECTIONS.forEach(s=>s.items.forEach(i=>KEYS.push(s.name+" | "+i)));
let db,syncing=false;

/* ---- offline storage ---- */
const openDB=()=>new Promise((res,rej)=>{const r=indexedDB.open("mahoora-housekeeping-db",1);r.onupgradeneeded=()=>r.result.createObjectStore("inspections",{keyPath:"id"});r.onsuccess=()=>{db=r.result;res()};r.onerror=()=>rej(r.error)});
const store=m=>db.transaction("inspections",m).objectStore("inspections");
const all=()=>new Promise((res,rej)=>{const r=store("readonly").getAll();r.onsuccess=()=>res(r.result.sort((a,b)=>b.createdAt.localeCompare(a.createdAt)));r.onerror=()=>rej(r.error)});
const put=v=>new Promise((res,rej)=>{const r=store("readwrite").put(v);r.onsuccess=()=>res();r.onerror=()=>rej(r.error)});
const getSession=()=>{try{return JSON.parse(localStorage.getItem("mhk_session"))}catch{return null}};

/* ---- small helpers ---- */
function toast(t){const e=$("toast");e.textContent=t;e.classList.add("on");clearTimeout(toast.t);toast.t=setTimeout(()=>e.classList.remove("on"),3200)}
function nowLocal(){const d=new Date(),p=n=>String(n).padStart(2,"0");return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`}
function nowFull(){const d=new Date(),p=n=>String(n).padStart(2,"0");return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`}
function net(){const o=navigator.onLine;$("dot").className="dot"+(o?"":" off");$("net").textContent=o?"Online":"Offline: saving here"}
function registerSW(){if("serviceWorker"in navigator)navigator.serviceWorker.register("./sw.js").catch(console.warn)}
function download(blob,name){const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),4000)}
const pdfName=r=>("Tent-"+r.tent+"_"+(r.inspectionDate||"").replace("T","_").replace(/:/g,"-")+".pdf").replace(/[^\w.\-]+/g,"-");

/* ---- item icons (drawn once, used on the phone page and in the PDF) ---- */
const ICONS={
lock:'<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/><circle cx="12" cy="15.5" r="1"/>',
power:'<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M12 8v4"/><path d="M9.5 9.5a4 4 0 1 0 5 0"/>',
fan:'<circle cx="12" cy="12" r="1.6"/><path d="M12 10.4C12 6 14 3.5 16 4.5c1.5 1 .5 4-4 5.9z"/><path d="M13.6 12c4.4 0 6.9 2 5.9 4-1 1.5-4 .5-5.9-4z"/><path d="M12 13.6c0 4.4-2 6.9-4 5.9-1.5-1-.5-4 4-5.9z"/><path d="M10.4 12C6 12 3.5 10 4.5 8c1-1.5 4-.5 5.9 4z"/>',
sparkle:'<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 16v4M17 18h4"/>',
cube:'<path d="M4 8l8-4 8 4v8l-8 4-8-4z"/><path d="M4 8l8 4 8-4M12 12v8"/>',
curtains:'<path d="M3 4h18"/><path d="M5 4v16h5c-1.5-5-1.5-11 0-16"/><path d="M19 4v16h-5c1.5-5 1.5-11 0-16"/>',
broom:'<path d="M15 3l-4 8"/><path d="M7 11h8l3 10H4z"/><path d="M8 16l-1 5M12 16v5"/>',
shower:'<path d="M5 21V9a5 5 0 0 1 5-5h3"/><path d="M13 8h8a4 4 0 0 0-8 0z"/><path d="M14 12v2M17 12v2M20 12v2M15.5 17v2M18.5 17v2"/>',
droplet:'<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"/><path d="M4 4l16 16"/>',
bed:'<path d="M3 18V7M3 14h18v4M21 18v-4a3 3 0 0 0-3-3h-7v3"/><circle cx="7" cy="11" r="2"/>',
shapes:'<rect x="4" y="4" width="7" height="7" rx="1"/><circle cx="16.5" cy="7.5" r="3.5"/><path d="M4 20l3.5-7 3.5 7z"/><path d="M14 14h6v6h-6z"/>',
layers:'<path d="M3 8l9-4 9 4-9 4z"/><path d="M3 12l9 4 9-4"/><path d="M3 16l9 4 9-4"/>',
book:'<path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z"/><path d="M5 17a3 3 0 0 1 3-3h11"/><path d="M12 7v4M10 9h4"/>',
cream:'<path d="M8 3h8l-1 5H9z"/><path d="M9 8h6l-.5 13h-5z"/>',
carpet:'<rect x="3" y="7" width="18" height="10" rx="1"/><path d="M3 10h18M3 14h18M6 17v3M10 17v3M14 17v3M18 17v3"/>',
bino:'<circle cx="7" cy="15" r="4"/><circle cx="17" cy="15" r="4"/><path d="M7 11V6h3v5M17 11V6h-3v5M11 15h2"/>',
coat:'<path d="M9 3L5 6l-2 6 3 1v8h12v-8l3-1-2-6-4-3"/><path d="M9 3c0 3 6 3 6 0M12 7v14"/>',
umb:'<path d="M3 12a9 9 0 0 1 18 0z"/><path d="M12 12v7a2 2 0 0 1-4 0"/><path d="M12 3v1"/>',
chair:'<path d="M8 3v9h9"/><path d="M8 12v9M17 12v9"/><path d="M8 8h6"/>',
ground:'<path d="M3 17l4-8h14l-4 8z"/><path d="M5 13h13M10 9l-3 8M15 9l-2 8"/>',
tent:'<path d="M3 20L12 4l9 16z"/><path d="M12 4v16M9 20l3-7 3 7"/>',
stable:'<rect x="4" y="7" width="16" height="3" rx="1"/><path d="M7 10v10M17 10v10M12 3v4"/>',
lamp:'<path d="M9 8h6v2c2 1 3 3 3 5 0 3-2 5-6 5s-6-2-6-5c0-2 1-4 3-5z"/><path d="M12 3c-1 2 1 2 0 5"/>',
bell:'<path d="M6 17V11a6 6 0 0 1 12 0v6l2 2H4z"/><path d="M10 21a2 2 0 0 0 4 0"/>',
bottle:'<path d="M10 3h4v3l2 3v11a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V9l2-3z"/><path d="M8 13h8"/>',
glass:'<path d="M7 4h10l-1.5 15a1 1 0 0 1-1 1h-5a1 1 0 0 1-1-1z"/><path d="M7.5 9h9"/>',
cush:'<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="1"/>',
pillow:'<path d="M4 8c3-2 13-2 16 0v8c-3 2-13 2-16 0z"/><path d="M4 8c2 2 2 6 0 8M20 8c-2 2-2 6 0 8"/>',
throw:'<rect x="5" y="5" width="14" height="14" rx="3"/><path d="M9 9l6 6M15 9l-6 6"/>',
runner:'<rect x="3" y="9" width="18" height="6" rx="1"/><path d="M3 12h18" stroke-dasharray="2 2"/>',
bulb:'<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.5.4.5 1.1.5 2.1h6c0-1 0-1.7.5-2.1A6 6 0 0 0 12 3z"/>',
sheet:'<path d="M5 6h14l-2 12H7z"/><path d="M8 10h8"/>',
luggage:'<path d="M4 12h16M6 12l-2 8M18 12l2 8M8 12l-1 8M16 12l1 8"/><rect x="7" y="5" width="10" height="7" rx="1"/>',
mat:'<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 7h6M9 12h6M9 17h6"/>',
hanger:'<path d="M12 4a2 2 0 1 1 2 2c-1 0-2 .7-2 2v1"/><path d="M12 9l9 6a1 1 0 0 1-.6 1.8H3.6A1 1 0 0 1 3 15z"/>',
amen:'<rect x="4" y="9" width="16" height="11" rx="2"/><path d="M8 9V5h8v4M10 14h4"/>',
towel:'<path d="M6 3h12v6H6z"/><path d="M7 9v12h10V9"/><path d="M9 13h6M9 17h6"/>',
soap:'<rect x="3" y="10" width="18" height="10" rx="4"/><circle cx="8" cy="5.5" r="1.5"/><circle cx="14" cy="4.5" r="1"/><circle cx="17" cy="7" r="1.2"/>',
roll:'<ellipse cx="8" cy="12" rx="3" ry="8"/><path d="M8 4h9c2 0 3 4 3 8s-1 8-3 8H8"/>'
};
const ICON_LIST={
"Living Area":["lock","power","fan","sparkle","cube","curtains"],
"Bedroom":["bed","shapes","layers"],
"Washroom":["broom","shower","droplet"],
"General":["book","cream","carpet","bino coat umb"],
"Outside":["chair","ground","tent"],
"Bedroom & living room items":["stable","cush","pillow","lamp","throw","sheet","bell","runner","luggage","bottle","bulb","mat","glass","coat","bino","book","umb","cream"],
"Bathroom items":["carpet","amen","towel","hanger","soap","roll"]
};
const iconsFor=(sec,i)=>((ICON_LIST[sec.name]||[])[i]||"").split(" ").filter(Boolean);
const iconHTML=(sec,i)=>iconsFor(sec,i).map(k=>`<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2d6a4f" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="vertical-align:-4px;margin-right:5px">${ICONS[k]}</svg>`).join("");
const ICONPNG={};let iconsP=null;
function loadIcons(){
  if(iconsP)return iconsP;
  iconsP=Promise.all(Object.keys(ICONS).map(k=>new Promise(res=>{
    const img=new Image();
    img.onload=()=>{try{const c=document.createElement("canvas");c.width=c.height=96;c.getContext("2d").drawImage(img,0,0,96,96);ICONPNG[k]=c.toDataURL("image/png")}catch(e){console.warn(e)}res()};
    img.onerror=res;
    img.src="data:image/svg+xml;charset=utf-8,"+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 24 24" fill="none" stroke="#1d2822" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${ICONS[k]}</svg>`);
  })));
  return iconsP;
}

/* ---- PDF report (same layout as the paper forms) ---- */
function makePDF(r){
  const J=window.jspdf;if(!J)return null;
  const doc=new J.jsPDF({unit:"mm",format:"a4"}),W=210,M=10;
  const st=k=>(r.checks[k]&&r.checks[k].status)||"",cmt=k=>(r.checks[k]&&r.checks[k].comment)||"";
  doc.setLineWidth(.25);doc.setDrawColor(70,70,70);
  const title=(t,y,s)=>{doc.setFont("helvetica","bold");doc.setFontSize(s||11);doc.setTextColor(30,40,34);doc.text(t,W/2,y,{align:"center"})};
  const hdr=(x,y,w,h,t)=>{doc.setFillColor(236,236,236);doc.rect(x,y,w,h,"FD");doc.setFont("helvetica","bold");doc.setFontSize(8.5);doc.setTextColor(30,40,34);doc.text(t,x+w/2,y+h/2+1.2,{align:"center"})};
  const mark=(s,bx,by)=>{
    doc.setDrawColor(40,40,40);doc.setLineWidth(.3);doc.rect(bx,by,5,5);
    if(s==="ok"){doc.setDrawColor(23,98,58);doc.setLineWidth(.7);doc.line(bx+1,by+2.7,bx+2.1,by+3.9);doc.line(bx+2.1,by+3.9,bx+4.2,by+1.1)}
    else if(s==="issue"){doc.setDrawColor(166,58,48);doc.setLineWidth(.7);doc.line(bx+1,by+1,bx+4,by+4);doc.line(bx+4,by+1,bx+1,by+4)}
    else if(s==="na"){doc.setFont("helvetica","bold");doc.setFontSize(4.5);doc.setTextColor(80,80,80);doc.text("N/A",bx+2.5,by+3.2,{align:"center"})}
    doc.setDrawColor(70,70,70);doc.setLineWidth(.25);
  };
  const itemCell=(x,y,w,h,name,ic,k,isz)=>{
    doc.rect(x,y,w,h);const z=ic.length>1?4.2:isz;
    ic.forEach((n,i)=>{if(ICONPNG[n])doc.addImage(ICONPNG[n],"PNG",x+1.4+i*z,y+(h-z)/2,z,z,n)});
    const tx=x+1.4+ic.length*z+1.2,tw=w-(tx-x)-8;
    doc.setFont("helvetica","normal");doc.setFontSize(8);doc.setTextColor(30,40,34);
    const L=doc.splitTextToSize(name,tw);doc.text(L,tx,y+h/2+1-(L.length-1)*1.65);
    mark(st(k),x+w-7,y+h/2-2.5);
  };
  const comCell=(x,y,w,h,k)=>{
    doc.rect(x,y,w,h);const c=cmt(k);
    if(c){doc.setFont("helvetica","italic");doc.setFontSize(7.5);doc.setTextColor(...(st(k)==="issue"?[166,58,48]:[70,80,75]));doc.text(doc.splitTextToSize(c,w-3).slice(0,4),x+1.5,y+3.8)}
  };

  /* page 1: header + tent / accommodation checklist */
  doc.setFont("times","bold");doc.setFontSize(24);doc.setTextColor(27,67,50);doc.text("MAHOORA",W/2,17,{align:"center"});
  title("MAHOORA GUEST ROOM HOUSEKEEPING CHECKLIST",27,12);
  [["Date & Time",(r.inspectionDate||"").replace("T"," ")],["Housekeeper / Service staff",r.staff],["Inspected By CM",r.inspector],["Tent #",r.tent]].forEach(([a,b],i)=>{
    const y=40+i*8;doc.setFont("helvetica","normal");doc.setFontSize(10);doc.setTextColor(30,40,34);doc.text(a,14,y);
    doc.setFont("helvetica","bold");doc.text(String(b||""),66,y-.8);doc.setDrawColor(150,150,150);doc.line(64,y+1,W-14,y+1);
  });
  doc.setDrawColor(70,70,70);
  title("TENT / ACCOMMODATION CHECKLIST",78,11);
  const col=names=>{const a=[];names.forEach(n=>{const sec=SECTIONS.find(s=>s.name===n);a.push({h:n});sec.items.forEach((it,i)=>a.push({it,k:n+" | "+it,ic:iconsFor(sec,i)}))});return a};
  const LC=col(["Living Area","Washroom"]),RC=col(["Bedroom","General","Outside"]),N=Math.max(LC.length,RC.length),RH=12,ty=82;
  [0,95].forEach(dx=>{hdr(M+dx,ty,62,8,"ITEM");hdr(M+dx+62,ty,33,8,"COMMENTS")});
  for(let i=0;i<N;i++){
    const y=ty+8+i*RH;
    [[LC[i],M],[RC[i],M+95]].forEach(([c,x])=>{
      if(!c){doc.rect(x,y,62,RH);doc.rect(x+62,y,33,RH)}
      else if(c.h){doc.setFillColor(246,246,246);doc.rect(x,y,95,RH,"FD");doc.setFont("helvetica","bold");doc.setFontSize(9);doc.setTextColor(30,40,34);doc.text(c.h,x+47.5,y+RH/2+1.2,{align:"center"})}
      else{itemCell(x,y,62,RH,c.it,c.ic,c.k,6);comCell(x+62,y,33,RH,c.k)}
    });
  }

  /* page 2: bedroom and living room items + bathroom */
  doc.addPage();
  title("ITEM CHECK LIST FOR THE BEDROOM AND LIVING ROOM",16,11);
  const BI=SECTIONS.find(s=>s.name==="Bedroom & living room items"),IW=44,CW=(190-3*IW)/3,t2=20;
  [0,1,2].forEach(c=>{hdr(M+c*(IW+CW),t2,IW,8,"ITEM");hdr(M+c*(IW+CW)+IW,t2,CW,8,"COMMENTS")});
  for(let rw=0;rw<6;rw++)for(let c=0;c<3;c++){
    const i=rw*3+c,it=BI.items[i],x=M+c*(IW+CW),y=t2+8+rw*16,k=BI.name+" | "+it;
    itemCell(x,y,IW,16,it,iconsFor(BI,i),k,5.5);comCell(x+IW,y,CW,16,k);
  }
  title("BATHROOM CHECKLIST",136,11);
  const BS=SECTIONS.find(s=>s.name==="Bathroom items"),t3=140;
  hdr(M,t3,120,8,"ITEM");hdr(M+120,t3,70,8,"COMMENTS");
  BS.items.forEach((it,i)=>{const y=t3+8+i*12,k=BS.name+" | "+it;itemCell(M,y,120,12,it,iconsFor(BS,i),k,6);comCell(M+120,y,70,12,k)});
  if(r.overall){
    const y=t3+8+6*12+10;doc.setFont("helvetica","bold");doc.setFontSize(10);doc.setTextColor(27,67,50);doc.text("Overall remarks",M,y);
    doc.setFont("helvetica","normal");doc.setFontSize(9);doc.setTextColor(30,40,34);doc.text(doc.splitTextToSize(r.overall,190).slice(0,8),M,y+5.5);
  }
  const p=doc.getNumberOfPages();for(let i=1;i<=p;i++){doc.setPage(i);doc.setFont("helvetica","normal");doc.setFontSize(8);doc.setTextColor(130,130,130);doc.text(`Tent ${r.tent}  |  page ${i} of ${p}`,W/2,291,{align:"center"})}
  return doc;
}
async function sharePDF(r){
  await loadIcons();const doc=makePDF(r);if(!doc){toast("PDF tool not loaded. Open the site once with internet.");return}
  const blob=doc.output("blob"),name=pdfName(r),file=new File([blob],name,{type:"application/pdf"});
  if(navigator.canShare&&navigator.canShare({files:[file]})){
    try{await navigator.share({files:[file],title:"Housekeeping - Tent "+r.tent,text:"Housekeeping checklist, Tent "+r.tent+", "+(r.inspectionDate||"").replace("T"," ")});return}
    catch(e){if(e.name==="AbortError")return}
  }
  download(blob,name);toast("Sharing is not supported here, so the PDF was downloaded.");
}
async function savePDF(r){await loadIcons();const d=makePDF(r);if(!d){toast("PDF tool not loaded. Open the site once with internet.");return}download(d.output("blob"),pdfName(r))}

/* ---- send to Google Sheet (the Sheet builds the PDF and saves it to Drive) ---- */
var SYNC_ERR="";
const whyFailed=e=>{const m=String(e&&e.message||e);
  if(/unauthorized/i.test(m))return "Secret word does not match. KEY in app.js must be exactly the same as SECRET in Code.gs.";
  if(/failed to fetch|networkerror|load failed/i.test(m))return "Could not reach the Google script. Check the /exec link and that access is set to Anyone.";
  if(/unexpected token|json/i.test(m))return "The Google script gave a wrong answer. Deploy it again as a Web app (access: Anyone, New version).";
  return m};
async function sendStart(s){
  if(CONFIG.SCRIPT_URL.startsWith("PASTE")||!navigator.onLine)return false;
  try{
    const j=await(await fetch(CONFIG.SCRIPT_URL,{method:"POST",body:JSON.stringify({action:"start",key:CONFIG.KEY,id:s.id,tent:s.tent,staff:s.staff,inspector:s.inspector,inspectionDate:s.inspectionDate,startedAt:s.startedAt})})).json();
    if(!j.ok)throw new Error(j.error||"rejected");return true;
  }catch(e){console.warn(e);SYNC_ERR=whyFailed(e);return false}
}
async function sync(manual){
  if(CONFIG.SCRIPT_URL.startsWith("PASTE")){if(manual)toast("Google Sheet link is not set up yet.");return 0}
  if(!navigator.onLine){if(manual)toast("No internet. Saved records will send later.");return 0}
  if(syncing)return 0;syncing=true;SYNC_ERR="";
  const pend=(await all()).filter(r=>r.syncStatus!=="synced");let n=0;
  for(const r of pend){
    try{
      const j=await(await fetch(CONFIG.SCRIPT_URL,{method:"POST",body:JSON.stringify({action:"finish",key:CONFIG.KEY,items:KEYS,...r})})).json();
      if(!j.ok)throw new Error(j.error||"rejected");
      r.syncStatus="synced";r.syncedAt=new Date().toISOString();r.pdfUrl=j.pdfUrl||"";r.lastError="";await put(r);n++;
    }catch(e){console.warn(e);SYNC_ERR=whyFailed(e);r.lastError=SYNC_ERR;await put(r);break}
  }
  syncing=false;
  if(manual)toast(!pend.length?"Everything is already sent.":n===pend.length?n+" sent to Google Sheet.":"Not sent: "+SYNC_ERR);
  return n;
}
async function csv(){
  const a=await all();if(!a.length){toast("Nothing to download yet.");return}
  const rows=[["ID","Date/time","Tent","Staff","Inspected by","Section","Item","Status","Comment","Overall remarks"]];
  a.forEach(r=>Object.entries(r.checks).forEach(([k,v])=>{const[s,i]=k.split(" | ");rows.push([r.id,r.inspectionDate,r.tent,r.staff,r.inspector,s,i,v.status||"unmarked",v.comment,r.overall])}));
  download(new Blob([rows.map(r=>r.map(v=>'"'+String(v??"").replace(/"/g,'""')+'"').join(",")).join("\r\n")],{type:"text/csv;charset=utf-8"}),"mahoora-housekeeping.csv");
}
addEventListener("online",()=>{net();sync(false).then(()=>window.onSynced&&window.onSynced())});addEventListener("offline",net);
if(typeof Image!=="undefined")loadIcons();
