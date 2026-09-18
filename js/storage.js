import {STORAGE_KEY,DB_NAME,DB_VERSION,DB_STORE,PHOTO_STORE,offlineDB,setDB,setServices,servicesCache} from "./core.js";
export async function initStorage(){
 await new Promise(resolve=>{if(!("indexedDB" in window)){resolve();return}const r=indexedDB.open(DB_NAME,DB_VERSION);r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains(DB_STORE))r.result.createObjectStore(DB_STORE,{keyPath:"id"});if(!r.result.objectStoreNames.contains(PHOTO_STORE))r.result.createObjectStore(PHOTO_STORE,{keyPath:"id"})};r.onsuccess=()=>{setDB(r.result);resolve()};r.onerror=()=>resolve()});
 const local=await readServices();
 if(local?.length){setServices(local);return}
 try{const legacy=JSON.parse(localStorage.getItem(STORAGE_KEY)||"[]");setServices(legacy.map(x=>({...x,pendingSync:x.pendingSync!==false})));writeServices(servicesCache)}catch{setServices([])}
}
export function readServices(){return new Promise(resolve=>{if(!offlineDB){resolve(null);return}const r=offlineDB.transaction(DB_STORE,"readonly").objectStore(DB_STORE).getAll();r.onsuccess=()=>resolve(r.result||[]);r.onerror=()=>resolve(null)})}
export function writeServices(data){setServices(data);try{localStorage.setItem(STORAGE_KEY,JSON.stringify(data))}catch(e){console.error(e)}if(!offlineDB)return;try{const tx=offlineDB.transaction(DB_STORE,"readwrite"),s=tx.objectStore(DB_STORE);s.clear();data.forEach(x=>s.put(x))}catch(e){console.error(e)}}
export const getServices=()=>servicesCache;
export function savePhotos(serviceId,files){return new Promise(resolve=>{if(!offlineDB||!files.length){resolve();return}try{const tx=offlineDB.transaction(PHOTO_STORE,"readwrite"),s=tx.objectStore(PHOTO_STORE);files.forEach(file=>s.put({id:crypto.randomUUID(),serviceId,blob:file,photoType:"intake",pendingSync:true,createdAt:new Date().toISOString()}));tx.oncomplete=resolve;tx.onerror=resolve}catch{resolve()}})}
