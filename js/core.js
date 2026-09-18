export const STORAGE_KEY="leoTechServices";
export const DB_NAME="leoTechOfflineDB",DB_VERSION=1,DB_STORE="services",PHOTO_STORE="photos";
export const SUPABASE_URL="https://zrzbhcipkzhkulphnyys.supabase.co";
export const SUPABASE_KEY="sb_publishable_sSu0VtLtlWCapaYiM1Koww_qqAbrDA8";
export const $=s=>document.querySelector(s),$$=s=>document.querySelectorAll(s);
export let mode="quick",servicesCache=[],offlineDB=null,supabaseClient=null,syncBusy=false,editingServiceId=null,selectedServiceId=null,selectedPhotos=[];
export const setMode=v=>mode=v; export const setServices=v=>servicesCache=[...v]; export const setDB=v=>offlineDB=v;
export const setSupabase=v=>supabaseClient=v; export const setBusy=v=>syncBusy=v; export const setEditing=v=>editingServiceId=v;
export const setSelected=v=>selectedServiceId=v; export const setPhotos=v=>selectedPhotos=[...v];
export function escapeHTML(s=""){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
export function formatDate(iso){return new Date(iso).toLocaleString("es-PY",{dateStyle:"short",timeStyle:"short"})}
export function toast(msg){const t=$("#toast");if(!t)return;t.textContent=msg;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2200)}
