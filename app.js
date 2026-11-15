/* Shared code: settings, checklist items, offline storage, Google Sheet/Drive sync, PDF */
const CONFIG={
  SCRIPT_URL:"PASTE_GOOGLE_WEB_APP_URL_HERE", /* Apps Script > Deploy > Web app URL */
  KEY:"change-this-secret"                    /* must match SECRET in Code.gs */
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
function net(){const o=navigator.onLine;$("dot").className="dot"+(o?"":" off");$("net").textContent=o?"Online":"Offline: saving here"}
function registerSW(){if("serviceWorker"in navigator)navigator.serviceWorker.register("./sw.js").catch(console.warn)}
function download(blob,name){const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),4000)}
const pdfName=r=>("Tent-"+r.tent+"_"+(r.inspectionDate||"").replace("T","_").replace(/:/g,"-")+".pdf").replace(/[^\w.\-]+/g,"-");

/* ---- PDF report ---- */
function makePDF(r){
  const J=window.jspdf;if(!J)return null;
  const doc=new J.jsPDF({unit:"mm",format:"a4"}),W=210,M=14;let y=0;
  const need=h=>{if(y+h>284){doc.addPage();y=16}};
  doc.setFillColor(27,67,50);doc.rect(0,0,W,24,"F");doc.setTextColor(255);
  doc.setFont("helvetica","bold");doc.setFontSize(18);doc.text("MAHOORA",M,12);
  doc.setFont("helvetica","normal");doc.setFontSize(10);doc.text("Guest Room Housekeeping Checklist",M,18.5);
  doc.setTextColor(30,40,34);y=33;
  [["Tent #",r.tent],["Date & time",(r.inspectionDate||"").replace("T"," ")],["Housekeeper / staff",r.staff],["Inspected by CM",r.inspector]].forEach(([a,b])=>{
    doc.setFont("helvetica","bold");doc.setFontSize(10.5);doc.text(a,M,y);doc.setFont("helvetica","normal");doc.text(String(b||"-"),M+46,y);y+=6.2});
  const c=Object.values(r.checks),n=s=>c.filter(x=>x.status===s).length;
  y+=2;doc.setFont("helvetica","bold");
  doc.text(`Result:  ${n("ok")} OK   |   ${n("issue")} issue(s)   |   ${n("na")} N/A   |   ${c.length-n("ok")-n("issue")-n("na")} not marked`,M,y);y+=8;
  const col={ok:[23,98,58],issue:[166,58,48],na:[100,110,118]},lab={ok:"OK",issue:"ISSUE",na:"N/A","":"-"};
  SECTIONS.forEach(sec=>{
    need(16);doc.setFillColor(226,236,229);doc.rect(M,y-4.6,W-2*M,7,"F");
    doc.setFont("helvetica","bold");doc.setFontSize(11);doc.setTextColor(27,67,50);doc.text(sec.name,M+2,y);y+=7;
    sec.items.forEach(it=>{
      const v=r.checks[sec.name+" | "+it]||{status:"",comment:""},lines=doc.splitTextToSize(it,128);
      const cl=v.comment?doc.splitTextToSize("Comment: "+v.comment,150):[];
      need(lines.length*5+cl.length*4.4+3);
      doc.setFont("helvetica","normal");doc.setFontSize(10);doc.setTextColor(30,40,34);doc.text(lines,M+2,y);
      doc.setFont("helvetica","bold");doc.setTextColor(...(col[v.status]||[120,120,120]));doc.text(lab[v.status||""],W-M-2,y,{align:"right"});
      y+=lines.length*5;
      if(cl.length){doc.setFont("helvetica","italic");doc.setFontSize(9);doc.setTextColor(90,100,95);doc.text(cl,M+6,y);y+=cl.length*4.4}
      doc.setDrawColor(225,230,225);doc.line(M,y-2.6,W-M,y-2.6);y+=1.2;
    });y+=3;
  });
  if(r.overall){need(20);doc.setFont("helvetica","bold");doc.setFontSize(11);doc.setTextColor(27,67,50);doc.text("Overall remarks",M,y);y+=6;
    doc.setFont("helvetica","normal");doc.setFontSize(10);doc.setTextColor(30,40,34);const l=doc.splitTextToSize(r.overall,W-2*M);need(l.length*5);doc.text(l,M,y)}
  const p=doc.getNumberOfPages();for(let i=1;i<=p;i++){doc.setPage(i);doc.setFontSize(8);doc.setTextColor(130);doc.text(`Tent ${r.tent}  |  page ${i} of ${p}`,W/2,291,{align:"center"})}
  return doc;
}
async function sharePDF(r){
  const doc=makePDF(r);if(!doc){toast("PDF tool not loaded. Open the site once with internet.");return}
  const blob=doc.output("blob"),name=pdfName(r),file=new File([blob],name,{type:"application/pdf"});
  if(navigator.canShare&&navigator.canShare({files:[file]})){
    try{await navigator.share({files:[file],title:"Housekeeping - Tent "+r.tent,text:"Housekeeping checklist, Tent "+r.tent+", "+(r.inspectionDate||"").replace("T"," ")});return}
    catch(e){if(e.name==="AbortError")return}
  }
  download(blob,name);toast("Sharing is not supported here, so the PDF was downloaded.");
}
function savePDF(r){const d=makePDF(r);if(!d){toast("PDF tool not loaded. Open the site once with internet.");return}download(d.output("blob"),pdfName(r))}

/* ---- send to Google Sheet + Drive ---- */
async function sync(manual){
  if(CONFIG.SCRIPT_URL.startsWith("PASTE")){if(manual)toast("Google Sheet link is not set up yet.");return 0}
  if(!navigator.onLine){if(manual)toast("No internet. Saved records will send later.");return 0}
  if(syncing)return 0;syncing=true;
  const pend=(await all()).filter(r=>r.syncStatus!=="synced");let n=0;
  for(const r of pend){
    try{
      const doc=makePDF(r);
      const body={key:CONFIG.KEY,items:KEYS,...r,pdfName:pdfName(r),pdf:doc?doc.output("datauristring").split(",")[1]:""};
      const j=await(await fetch(CONFIG.SCRIPT_URL,{method:"POST",body:JSON.stringify(body)})).json();
      if(!j.ok)throw new Error(j.error||"rejected");
      r.syncStatus="synced";r.syncedAt=new Date().toISOString();r.pdfUrl=j.pdfUrl||"";await put(r);n++;
    }catch(e){console.warn(e);break}
  }
  syncing=false;
  if(manual)toast(!pend.length?"Everything is already sent.":n===pend.length?n+" sent to Google Sheet and Drive.":(pend.length-n)+" could not be sent. Try again.");
  return n;
}
async function csv(){
  const a=await all();if(!a.length){toast("Nothing to download yet.");return}
  const rows=[["ID","Date/time","Tent","Staff","Inspected by","Section","Item","Status","Comment","Overall remarks"]];
  a.forEach(r=>Object.entries(r.checks).forEach(([k,v])=>{const[s,i]=k.split(" | ");rows.push([r.id,r.inspectionDate,r.tent,r.staff,r.inspector,s,i,v.status||"unmarked",v.comment,r.overall])}));
  download(new Blob([rows.map(r=>r.map(v=>'"'+String(v??"").replace(/"/g,'""')+'"').join(",")).join("\r\n")],{type:"text/csv;charset=utf-8"}),"mahoora-housekeeping.csv");
}
addEventListener("online",()=>{net();sync(false).then(()=>window.onSynced&&window.onSynced())});addEventListener("offline",net);
