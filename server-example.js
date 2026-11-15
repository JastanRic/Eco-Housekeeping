// Demonstration-only sync receiver. Do not expose publicly as-is.
// Production deployment needs HTTPS, authentication, validation, backups,
// rate limiting, a database, and appropriate staff access controls.
const http = require("http");
const fs = require("fs");
const path = require("path");
const PORT = process.env.PORT || 8787;
const DATA = path.join(__dirname, "inspection-records.json");
const KEY = process.env.SYNC_API_KEY || "";
function readAll(){try{return JSON.parse(fs.readFileSync(DATA,"utf8"))}catch{return {}}}
const server=http.createServer((req,res)=>{
  res.setHeader("Access-Control-Allow-Origin","*");
  res.setHeader("Access-Control-Allow-Headers","Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Methods","POST, OPTIONS");
  if(req.method==="OPTIONS"){res.writeHead(204);return res.end()}
  if(req.method!=="POST"||req.url!=="/api/inspections"){res.writeHead(404);return res.end("Not found")}
  if(KEY && req.headers.authorization!=="Bearer "+KEY){res.writeHead(401);return res.end("Unauthorized")}
  let body="";req.on("data",chunk=>{body+=chunk;if(body.length>2_000_000){res.writeHead(413);res.end("Too large");req.destroy()}})
  req.on("end",()=>{try{const record=JSON.parse(body);if(!record.id||!record.tent||!record.checks)throw new Error("Invalid record");const all=readAll();all[record.id]=record;fs.writeFileSync(DATA,JSON.stringify(all,null,2));res.writeHead(201,{"Content-Type":"application/json"});res.end(JSON.stringify({ok:true,id:record.id}))}catch(e){res.writeHead(400);res.end(e.message)}})
});
server.listen(PORT,()=>console.log("Demo sync receiver listening on "+PORT));
