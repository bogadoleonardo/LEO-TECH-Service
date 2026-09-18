const EQUIPMENT_CATALOG={
  "Lenovo":["IdeaPad 1","IdeaPad 3","IdeaPad 5","IdeaPad Slim 3","ThinkPad E14","ThinkPad E15","ThinkPad T14","ThinkPad L14","ThinkBook 14","V14","V15","Otro / Escribir modelo"],
  "HP":["15","14","Pavilion 15","Pavilion 14","250","255","ProBook 440","ProBook 450","EliteBook 840","EliteBook 850","Envy 15","Victus 15","Otro / Escribir modelo"],
  "Dell":["Inspiron 15","Inspiron 14","Vostro 15","Latitude 3420","Latitude 3520","Latitude 5420","Latitude 5520","XPS 13","XPS 15","G15","Otro / Escribir modelo"],
  "ASUS":["VivoBook 15","VivoBook 14","VivoBook Go 15","ZenBook 14","ROG Strix G15","TUF Gaming F15","TUF Gaming A15","ExpertBook","Otro / Escribir modelo"],
  "Acer":["Aspire 3","Aspire 5","Aspire 7","Swift 3","Swift 5","Nitro 5","Extensa 15","TravelMate","Otro / Escribir modelo"],
  "Samsung":["Galaxy Book","Galaxy Book2","Galaxy Book3","Book4","Notebook 9","Otro / Escribir modelo"],
  "MSI":["Modern 14","Modern 15","GF63","Katana 15","Thin 15","Prestige 14","Prestige 15","Otro / Escribir modelo"],
  "Toshiba":["Satellite C40","Satellite C50","Satellite L50","Tecra","Dynabook","Otro / Escribir modelo"],
  "Apple":["MacBook Air","MacBook Pro","MacBook","Otro / Escribir modelo"],
  "Huawei":["MateBook D14","MateBook D15","MateBook 14","MateBook 16","Otro / Escribir modelo"],
  "Xiaomi":["RedmiBook 15","RedmiBook Pro","Mi Notebook","Otro / Escribir modelo"],
  "Positivo":["Motion","Vision","Otro / Escribir modelo"],
  "Exo":["Smart","Otro / Escribir modelo"],
  "Otra":["Otro / Escribir modelo"]
};

function setupEquipmentCatalog(){
  const brandInput=$("#brandInput"), modelInput=$("#modelInput");
  const brandList=$("#brandList"), modelList=$("#modelList");
  const brands=Object.keys(EQUIPMENT_CATALOG);
  brandList.innerHTML=brands.map(b=>`<option value="${b}">`).join("");

  function updateModels(){
    const brand=brandInput.value.trim();
    const models=EQUIPMENT_CATALOG[brand]||["Otro / Escribir modelo"];
    modelList.innerHTML=models.map(m=>`<option value="${m}">`).join("");
    modelInput.placeholder=models.length?"Elegí o escribí el modelo":"Escribí el modelo";
  }

  brandInput.addEventListener("input",updateModels);
  brandInput.addEventListener("change",updateModels);
  modelInput.addEventListener("focus",updateModels);
  updateModels();
}

const STORAGE_KEY="leoTechServices";
const DB_NAME="leoTechOfflineDB";
const DB_VERSION=1;
const DB_STORE="services";
const PHOTO_STORE="photos";
const SUPABASE_URL="https://zrzbhcipkzhkulphnyys.supabase.co";
const SUPABASE_KEY="sb_publishable_sSu0VtLtlWCapaYiM1Koww_qqAbrDA8";
let supabaseClient=null;
let syncBusy=false;

let mode="quick";
let servicesCache=[];
let offlineDB=null;

const $=s=>document.querySelector(s);
const $=s=>document.querySelectorAll(s);

function openOfflineDB(){
  return new Promise((resolve,reject)=>{
    if(!("indexedDB" in window)){resolve(null);return;}
    const req=indexedDB.open(DB_NAME,DB_VERSION);
    req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains(DB_STORE))req.result.createObjectStore(DB_STORE,{keyPath:"id"});
      if(!req.result.objectStoreNames.contains(PHOTO_STORE))req.result.createObjectStore(PHOTO_STORE,{keyPath:"id"});};
    req.onsuccess=()=>{offlineDB=req.result;resolve(offlineDB);};
    req.onerror=()=>resolve(null);
  });
}
function readOfflineServices(){
  return new Promise(resolve=>{
    if(!offlineDB){resolve(null);return;}
    const req=offlineDB.transaction(DB_STORE,"readonly").objectStore(DB_STORE).getAll();
    req.onsuccess=()=>resolve(req.result||[]);
    req.onerror=()=>resolve(null);
  });
}
function writeOfflineServices(data){
  servicesCache=data;
  try{localStorage.setItem(STORAGE_KEY,JSON.stringify(data));}catch(e){}
  if(!offlineDB)return;
  const tx=offlineDB.transaction(DB_STORE,"readwrite");
  const store=tx.objectStore(DB_STORE);
  store.clear();
  data.forEach(item=>store.put(item));
}
function saveLocalPhotos(serviceId,files){
  return new Promise(resolve=>{
    if(!offlineDB||!files.length){resolve();return;}
    const tx=offlineDB.transaction(PHOTO_STORE,"readwrite");
    const store=tx.objectStore(PHOTO_STORE);
    files.forEach(file=>store.put({id:crypto.randomUUID(),serviceId,blob:file,photoType:"intake",pendingSync:true,createdAt:new Date().toISOString()}));
    tx.oncomplete=()=>resolve();
    tx.onerror=()=>resolve();
  });
}
function readLocalPhotos(serviceId){
  return new Promise(resolve=>{
    if(!offlineDB){resolve([]);return;}
    const req=offlineDB.transaction(PHOTO_STORE,"readonly").objectStore(PHOTO_STORE).getAll();
    req.onsuccess=()=>resolve((req.result||[]).filter(p=>p.serviceId===serviceId));
    req.onerror=()=>resolve([]);
  });
}
function renderPhotoPreview(files){
  const box=$("#photoPreview"); if(!box)return;
  box.innerHTML="";
  [...files].forEach(file=>{
    const url=URL.createObjectURL(file);
    const img=document.createElement("img"); img.src=url; img.alt="Foto del equipo"; box.appendChild(img);
  });
}

async function initSupabase(){
  if(!window.supabase)return;
  supabaseClient=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}});
  const {data:{session}}=await supabaseClient.auth.getSession();
  if(session){ updateConnectionStatus(); return; }
  const {data,error}=await supabaseClient.auth.signInAnonymously();
  if(error){
    console.warn("Supabase Auth:",error.message);
    supabaseClient=null;
    updateConnectionStatus();
    return;
  }
  updateConnectionStatus();
  console.info("LEO-TECH: sesión anónima activa",data.user?.id||"");
}
function serviceToRow(x){
  return {
    service_code:x.id,
    mode:x.mode||"quick",
    reported_problem:x.problem||"",
    work_types:x.work||[],
    work_description:x.workDetail||"",
    observations:x.observations||"",
    physical_condition:x.condition||"",
    accessories_received:x.accessories||"",
    technicians:x.technicians||[],
    status:x.status||"En proceso",
    received_at:x.createdAt||new Date().toISOString(),
    receipt_type:x.mode==="complete"?"detailed":"quick"
  };
}
async function syncPendingServices(){
  if(syncBusy||!navigator.onLine||!supabaseClient)return;
  const {data:{session}}=await supabaseClient.auth.getSession();
  if(!session)return;
  const pending=servicesCache.filter(x=>x.pendingSync!==false);
  if(!pending.length){updateConnectionStatus();return;}
  syncBusy=true;
  try{
    for(const x of pending){
      const {error}=await supabaseClient.from("services").upsert(serviceToRow(x),{onConflict:"service_code"});
      if(error){console.warn("Sincronización:",error.message);break;}
      const current=servicesCache.find(s=>s.id===x.id);
      if(current)current.pendingSync=false;
      writeOfflineServices(servicesCache);
    }
  }finally{
    syncBusy=false;
    updateConnectionStatus();
  }
}
async function initOfflineStore(){
  await openOfflineDB();
  const local=readOfflineServices();
  if(local && local.length){
    servicesCache=local;
  }else{
    try{
      const legacy=JSON.parse(localStorage.getItem(STORAGE_KEY)||"[]");
      servicesCache=legacy.map(x=>({...x,pendingSync:x.pendingSync!==false}));
      writeOfflineServices(servicesCache);
    }catch(e){servicesCache=[];}
  }
  updateConnectionStatus();
}
const getServices=()=>servicesCache;
const saveServices=data=>writeOfflineServices(data);

function updateConnectionStatus(){
  const el=$("#connectionStatus");
  if(!el)return;
  const pending=servicesCache.filter(x=>x.pendingSync!==false).length;
  if(navigator.onLine){
    if(!supabaseClient){
      el.innerHTML='<span class="status-dot"></span> Conectado · guardado local';
    }else{
      el.innerHTML='<span class="status-dot"></span> '+(pending?("Conectado · "+pending+" pendiente"+(pending===1?"":"s")):"Conectado · sincronizado");
    }
    el.className="connection-status online";
  }else{
    el.innerHTML='<span class="status-dot"></span> '+(pending?("Sin conexión · "+pending+" pendiente"+(pending===1?"":"s")):"Sin conexión");
    el.className="connection-status offline";
  }
}
window.addEventListener("online",()=>{updateConnectionStatus();syncPendingServices();});
window.addEventListener("offline",updateConnectionStatus);

function showView(id){
  const target=document.getElementById(id);
  if(!target)return false;
  document.querySelectorAll(".view").forEach(v=>v.classList.remove("active-view"));
  target.classList.add("active-view");
  document.querySelectorAll(".nav-item").forEach(b=>b.classList.toggle("active",b.dataset.view===id));
  const titles={dashboard:"Inicio","new-service":"Nuevo servicio",history:"Historial técnico",clients:"Clientes",equipment:"Equipos"};
  const title=document.getElementById("pageTitle");
  if(title)title.textContent=titles[id]||"Inicio";
  if(id==="dashboard")renderDashboard();
  if(id==="history")renderHistory();
  window.scrollTo(0,0);
  return false;
}
function openNew(){showView("new-service");setMode("quick");$("#serviceForm").reset();}
function setMode(value){
  mode=value;
  $$(".mode").forEach(b=>b.classList.toggle("active",b.dataset.mode===value));
  $("#serviceForm").classList.remove("mode-quick","mode-normal","mode-complete");
  $("#serviceForm").classList.add("mode-"+value);
}
function formatDate(iso){return new Date(iso).toLocaleString("es-PY",{dateStyle:"short",timeStyle:"short"});}
function renderDashboard(){
  const data=getServices();
  $("#statServices").textContent=data.length;
  $("#statProcess").textContent=data.filter(x=>x.status==="En proceso").length;
  $("#statDone").textContent=data.filter(x=>x.status==="Finalizado").length;
  const recent=data.slice(-5).reverse();
  $("#recentServices").innerHTML=recent.length?recent.map(rowHTML).join(""):'Todavía no hay servicios registrados.';
}
function rowHTML(x){
  return `<article class="service-row service-clickable" data-service-id="${escapeHTML(x.id)}">
    <div class="service-id">#${escapeHTML(x.id)}</div>
    <div><strong>${escapeHTML(x.brand)} ${escapeHTML(x.model)}</strong><p>${escapeHTML(x.problem)}</p><small>${formatDate(x.createdAt)}</small></div>
    <span class="status">${escapeHTML(x.status)}</span>
    <span class="row-hint">Ver ficha ›</span>
  </article>`;
}
function renderHistory(){
  const data=getServices().reverse();
  $("#historyList").innerHTML=data.length?data.map(rowHTML).join(""):'Todavía no hay registros.';
}
function escapeHTML(s=""){return s.replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));}
function nextId(){
  const nums=getServices().map(x=>Number(String(x.id||"").replace("LT-",""))).filter(Number.isFinite);
  return "LT-"+String((nums.length?Math.max(...nums):0)+1).padStart(4,"0");
}
function toast(msg){const t=$("#toast");t.textContent=msg;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2200);}

let selectedServiceId=null;
let editingServiceId=null;
let selectedPhotos=[];

function findService(id){return getServices().find(x=>x.id===id);}
function openServiceModal(id){
  const x=findService(id); if(!x)return;
  selectedServiceId=id;
  $("#modalTitle").textContent="Servicio "+x.id;
  $("#modalBody").innerHTML=`
    <div class="preview-grid">
      <div><small>N.º DE SERVICIO</small><strong>${escapeHTML(x.id)}</strong></div>
      <div><small>FECHA</small><strong>${formatDate(x.createdAt)}</strong></div>
      <div><small>EQUIPO</small><strong>${escapeHTML(x.brand)} ${escapeHTML(x.model)}</strong></div>
      <div><small>CLIENTE</small><strong>${escapeHTML(x.client||"No indicado")}</strong></div>
      <div><small>N.º DE SERIE</small><strong>${escapeHTML(x.serial||"No indicado")}</strong></div>
      <div><small>ESTADO</small><strong>${escapeHTML(x.status)}</strong></div>
    </div>
    <div class="preview-block"><small>PROBLEMA INFORMADO</small><p>${escapeHTML(x.problem||"—")}</p></div>
    <div class="preview-block"><small>TRABAJO</small><p>${escapeHTML((x.work||[]).join(" · ")||"No indicado")}</p>${x.workDetail?`<p>${escapeHTML(x.workDetail)}</p>`:""}</div>
    <div class="preview-block"><small>RESPONSABLES</small><p>${escapeHTML((x.technicians||[]).join(" · ")||"No indicados")}</p></div>
    ${x.condition||x.accessories||x.observations?`<div class="preview-block"><small>DETALLES</small><p>${escapeHTML([x.condition,x.accessories,x.observations].filter(Boolean).join(" · "))}</p></div>`:""}
  `;
  $("#serviceModal").classList.remove("hidden");
  $("#serviceModal").setAttribute("aria-hidden","false");
}
function closeServiceModal(){
  $("#serviceModal").classList.add("hidden");
  $("#serviceModal").setAttribute("aria-hidden","true");
}
function editService(id){
  const x=findService(id); if(!x)return;
  editingServiceId=id; closeServiceModal(); showView("new-service"); setMode(x.mode||"quick");
  const f=$("#serviceForm");
  f.elements.brand.value=x.brand||""; f.elements.model.value=x.model||"";
  f.elements.client.value=x.client||""; f.elements.serial.value=x.serial||"";
  f.elements.problem.value=x.problem||""; f.elements.workDetail.value=x.workDetail||"";
  f.elements.condition.value=x.condition||""; f.elements.accessories.value=x.accessories||""; f.elements.observations.value=x.observations||"";
  $('input[name="work"]').forEach(i=>i.checked=(x.work||[]).includes(i.value));
  $('input[name="technician"]').forEach(i=>i.checked=(x.technicians||[]).includes(i.value));
  toast("Editando "+x.id);
  window.scrollTo({top:0,behavior:"smooth"});
}
function deleteService(id){
  const x=findService(id); if(!x)return;
  if(!confirm(`¿Eliminar el servicio ${x.id} de ${x.brand} ${x.model}? Esta acción no se puede deshacer.`))return;
  saveServices(getServices().filter(s=>s.id!==id));
  closeServiceModal(); renderDashboard(); if($("#history").classList.contains("active-view"))renderHistory();
  toast("Servicio "+id+" eliminado.");
}

document.addEventListener("click",e=>{
  const navItem=e.target.closest(".nav-item");
  if(!navItem)return;
  e.preventDefault();
  e.stopPropagation();
  showView(navItem.dataset.view);
  if(window.innerWidth<=800)document.querySelector(".sidebar")?.classList.remove("open");
});
window.showView=showView;
document.addEventListener("click",e=>{
  const row=e.target.closest(".service-clickable");
  if(row) openServiceModal(row.dataset.serviceId);
});
$("#closeModal").addEventListener("click",closeServiceModal);
$("#serviceModal").addEventListener("click",e=>{if(e.target.id==="serviceModal")closeServiceModal();});
$("#modalEdit").addEventListener("click",()=>editService(selectedServiceId));
$("#modalDelete").addEventListener("click",()=>deleteService(selectedServiceId));
$("#modalPreview").addEventListener("click",()=>openReceiptPreview(selectedServiceId));
$("#headerNew").addEventListener("click",openNew);
$("#heroNew").addEventListener("click",openNew);
$("#cancelForm").addEventListener("click",()=>showView("dashboard"));
$("#mobileMenu").addEventListener("click",()=>$(".sidebar").classList.toggle("open"));
$$(".mode").forEach(b=>b.addEventListener("click",()=>setMode(b.dataset.mode)));

function openReceiptPreview(id){
  const x=findService(id); if(!x)return;
  $("#modalTitle").textContent="Previsualización · "+x.id;
  $("#modalBody").innerHTML=`
    <div class="receipt-preview">
      <div class="receipt-brand"><strong>LEO-TECH</strong><span>SERVICE</span></div>
      <div class="receipt-number">COMPROBANTE #${escapeHTML(x.id)}</div>
      <hr>
      <p><b>Equipo:</b> ${escapeHTML(x.brand)} ${escapeHTML(x.model)}</p>
      <p><b>Cliente:</b> ${escapeHTML(x.client||"No indicado")}</p>
      <p><b>Serie:</b> ${escapeHTML(x.serial||"No indicado")}</p>
      <p><b>Problema:</b> ${escapeHTML(x.problem||"—")}</p>
      <p><b>Trabajo:</b> ${escapeHTML((x.work||[]).join(", ")||"No indicado")}</p>
      <p><b>Descripción:</b> ${escapeHTML(x.workDetail||"No indicada")}</p>
      <p><b>Responsables:</b> ${escapeHTML((x.technicians||[]).join(", ")||"No indicados")}</p>
      <p><b>Estado:</b> ${escapeHTML(x.status)}</p>
      <p><b>Recibido:</b> ${formatDate(x.createdAt)}</p>
      <p><b>Observaciones:</b> ${escapeHTML(x.observations||"No indicadas")}</p>
    </div>`;
  $("#modalEdit").classList.add("hidden"); $("#modalDelete").classList.add("hidden");
  $("#modalPreview").textContent="Cerrar previsualización"; $("#modalPreview").onclick=()=>{closeServiceModal();location.reload();};
  $("#serviceModal").classList.remove("hidden");
}
$("#serviceForm").addEventListener("submit",async e=>{
  e.preventDefault();
  const f=new FormData(e.target);
  const work=[...$('input[name="work"]:checked')].map(i=>i.value);
  const technicians=[...$('input[name="technician"]:checked')].map(i=>i.value);
  const service={
    id:editingServiceId||nextId(),createdAt:editingServiceId?(findService(editingServiceId)?.createdAt||new Date().toISOString()):new Date().toISOString(),status:editingServiceId?(findService(editingServiceId)?.status||"En proceso"):"En proceso",
    mode,brand:f.get("brand"),model:f.get("model"),client:f.get("client")||"",
    serial:f.get("serial")||"",problem:f.get("problem"),work,workDetail:f.get("workDetail")||"",
    technicians,
    condition:f.get("condition")||"",accessories:f.get("accessories")||"",observations:f.get("observations")||""
  };
  const data=getServices();
  service.pendingSync=true;
  if(editingServiceId){const idx=data.findIndex(x=>x.id===editingServiceId);if(idx>=0){service.pendingSync=data[idx].pendingSync!==false;data[idx]=service;}}
  else data.push(service);
  saveServices(data);
  await saveLocalPhotos(service.id,selectedPhotos);
  selectedPhotos=[];
  renderPhotoPreview([]);
  const saveNext=e.submitter?.id==="saveNext";
  e.target.reset();
  toast("Servicio "+service.id+(editingServiceId?" actualizado correctamente.":" guardado correctamente."));
  const wasEditing=!!editingServiceId; editingServiceId=null;
  if(saveNext){setMode(mode);setTimeout(()=>e.target.elements.brand.focus(),100);}
  else showView("dashboard");
});
initOfflineStore().then(async()=>{
  setMode("quick");setupEquipmentCatalog();renderDashboard();renderHistory();updateConnectionStatus();
  $("#servicePhotos")?.addEventListener("change",e=>{selectedPhotos=[...e.target.files];renderPhotoPreview(selectedPhotos);});
  await initSupabase();
  await syncPendingServices();
});
