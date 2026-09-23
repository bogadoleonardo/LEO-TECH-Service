import {$,mode,editingServiceId,selectedPhotos,setEditing,setPhotos,toast} from "./core.js";import {getServices,writeServices,savePhotos} from "./storage.js";import {renderDashboard,renderHistory} from "./dashboard.js";import {showView,selectMode} from "./navigation.js";import {sendServiceToGoogleSheets} from "./googleSheets.js";
export function nextId(){const n=getServices().map(x=>Number(String(x.id||"").replace("LT-",""))).filter(Number.isFinite);return"LT-"+String((n.length?Math.max(...n):0)+1).padStart(4,"0")}
export function saveService(e){e.preventDefault();const form=e.target,f=new FormData(form),work=[...$('input[name="work"]:checked')].map(i=>i.value),tech=[...$('input[name="technician"]:checked')].map(i=>i.value),old=editingServiceId?getServices().find(x=>x.id===editingServiceId):null,wasEdit=!!editingServiceId,saveNext=e.submitter?.id==="saveNext";
 const service={id:editingServiceId||nextId(),createdAt:old?.createdAt||new Date().toISOString(),status:old?.status||"En proceso",mode,brand:String(f.get("brand")||"").trim(),model:String(f.get("model")||"").trim(),client:String(f.get("client")||"").trim(),serial:String(f.get("serial")||"").trim(),problem:String(f.get("problem")||"").trim(),work,workDetail:String(f.get("workDetail")||"").trim(),technicians:tech,condition:String(f.get("condition")||"").trim(),accessories:String(f.get("accessories")||"").trim(),observations:String(f.get("observations")||"").trim(),pendingSync:true};
 if(!service.brand||!service.model||!service.problem){const m=[];if(!service.brand)m.push("marca");if(!service.model)m.push("modelo");if(!service.problem)m.push("problema");toast("⚠ Falta completar: "+m.join(", ")+".");(!service.brand?$("#brandInput"):!service.model?$("#modelInput"):$('textarea[name="problem"]'))?.focus();return}
 const data=[...getServices()],i=data.findIndex(x=>x.id===service.id);if(i>=0)data[i]=service;else data.push(service);
 try{writeServices(data)}catch(err){console.error(err);toast("⚠ No se pudo guardar.");return}
 const photos=[...selectedPhotos];setPhotos([]);form.reset();setEditing(null);renderDashboard();renderHistory();
 toast("✓ Servicio "+service.id+" guardado localmente.");
 if(photos.length)setTimeout(()=>savePhotos(service.id,photos),0);
 sendServiceToGoogleSheets(service).then(result=>{
   if(result.configured&&result.sent){const cur=getServices().find(s=>s.id===service.id);if(cur){cur.pendingSync=false;writeServices(getServices())}toast("✓ "+service.id+" guardado en Google Sheets.");}
   else if(!result.configured)toast("✓ Guardado local. Google Sheets todavía no está configurado.");
   else toast("⚠ Quedó local; no se pudo enviar a Google Sheets.");
 }).catch(()=>toast("⚠ Guardado local; no se pudo enviar a Google Sheets."));
 if(saveNext){selectMode(mode);setTimeout(()=>form.elements.brand.focus(),120)}else setTimeout(()=>showView("dashboard"),120)
}