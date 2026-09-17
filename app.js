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

const SUPABASE_URL="https://zrzbhcipkzhkulphnyys.supabase.co";
const SUPABASE_PUBLISHABLE_KEY="sb_publishable_sSu0VtLtlWCapaYiM1Koww_qqAbrDA8";
const supabaseClient=window.supabase.createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY);

function setAuthMessage(msg,error=false){
  const el=$("#authMessage"); if(!el)return;
  el.textContent=msg; el.classList.toggle("error",error);
}
async function initAuth(){
  const {data:{session}}=await supabaseClient.auth.getSession();
  if(session) showApp(session.user);
  else showLogin();
  supabaseClient.auth.onAuthStateChange((_event,newSession)=>{
    if(newSession) showApp(newSession.user); else showLogin();
  });
}
function showLogin(){
  $("#authScreen").classList.remove("hidden");
  document.body.classList.add("locked");
}
function showApp(user){
  $("#authScreen").classList.add("hidden");
  document.body.classList.remove("locked");
  const name=user.email||"Usuario";
  const brand=$("#pageTitle"); if(brand) brand.dataset.user=name;
}
$("#authForm").addEventListener("submit",async e=>{
  e.preventDefault();
  setAuthMessage("Ingresando...");
  const email=$("#authEmail").value.trim();
  const password=$("#authPassword").value;
  const {error}=await supabaseClient.auth.signInWithPassword({email,password});
  if(error) setAuthMessage("No se pudo iniciar sesión: "+error.message,true);
});
$("#signupBtn").addEventListener("click",async()=>{
  const email=$("#authEmail").value.trim();
  const password=$("#authPassword").value;
  if(!email||password.length<6){setAuthMessage("Ingresá un correo y una contraseña de al menos 6 caracteres.",true);return;}
  setAuthMessage("Creando cuenta...");
  const {data,error}=await supabaseClient.auth.signUp({email,password});
  if(error) setAuthMessage("No se pudo crear la cuenta: "+error.message,true);
  else if(data.session) setAuthMessage("Cuenta creada. Entrando...");
  else setAuthMessage("Cuenta creada. Revisá tu correo para confirmar la cuenta.");
}

const STORAGE_KEY="leoTechServices";
let mode="quick";

const $=s=>document.querySelector(s);
const $$=s=>document.querySelectorAll(s);
const getServices=()=>JSON.parse(localStorage.getItem(STORAGE_KEY)||"[]");
const saveServices=data=>localStorage.setItem(STORAGE_KEY,JSON.stringify(data));

function showView(id){
  $$(".view").forEach(v=>v.classList.remove("active-view"));
  $("#"+id).classList.add("active-view");
  $$(".nav-item").forEach(b=>b.classList.toggle("active",b.dataset.view===id));
  const titles={dashboard:"Inicio","new-service":"Nuevo servicio",history:"Historial",clients:"Clientes",equipment:"Equipos"};
  $("#pageTitle").textContent=titles[id]||"Inicio";
  if(id==="dashboard") renderDashboard();
  if(id==="history") renderHistory();
  window.scrollTo({top:0,behavior:"smooth"});
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
  return `<article class="service-row"><div class="service-id">#${x.id}</div><div><strong>${escapeHTML(x.brand)} ${escapeHTML(x.model)}</strong><p>${escapeHTML(x.problem)}</p><small>${formatDate(x.createdAt)}</small></div><span class="status">${x.status}</span></article>`;
}
function renderHistory(){
  const data=getServices().reverse();
  $("#historyList").innerHTML=data.length?data.map(rowHTML).join(""):'Todavía no hay registros.';
}
function escapeHTML(s=""){return s.replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));}
function nextId(){return "LT-"+String(getServices().length+1).padStart(4,"0");}
function toast(msg){const t=$("#toast");t.textContent=msg;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2200);}

$$(".nav-item").forEach(b=>b.addEventListener("click",()=>showView(b.dataset.view)));
$("#headerNew").addEventListener("click",openNew);
$("#heroNew").addEventListener("click",openNew);
$("#cancelForm").addEventListener("click",()=>showView("dashboard"));
$("#mobileMenu").addEventListener("click",()=>$(".sidebar").classList.toggle("open"));
$$(".mode").forEach(b=>b.addEventListener("click",()=>setMode(b.dataset.mode)));

$("#serviceForm").addEventListener("submit",e=>{
  e.preventDefault();
  const f=new FormData(e.target);
  const work=[...$('input[name="work"]:checked')].map(i=>i.value);
  const technicians=[...$('input[name="technician"]:checked')].map(i=>i.value);
  const service={
    id:nextId(),createdAt:new Date().toISOString(),status:"En proceso",
    mode,brand:f.get("brand"),model:f.get("model"),client:f.get("client")||"",
    serial:f.get("serial")||"",problem:f.get("problem"),work,workDetail:f.get("workDetail")||"",
    technicians,
    condition:f.get("condition")||"",accessories:f.get("accessories")||"",observations:f.get("observations")||""
  };
  const data=getServices();data.push(service);saveServices(data);
  const saveNext=e.submitter?.id==="saveNext";
  e.target.reset();
  toast("Servicio "+service.id+" guardado correctamente.");
  if(saveNext){setMode(mode);setTimeout(()=>e.target.elements.brand.focus(),100);}
  else showView("dashboard");
});
setMode("quick");setupEquipmentCatalog();renderDashboard();
