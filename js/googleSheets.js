const STORAGE_KEY = "leoTechGoogleSheetsUrl";

export function getGoogleSheetsUrl(){
  return (localStorage.getItem(STORAGE_KEY) || "").trim();
}

export function setGoogleSheetsUrl(url){
  const value = String(url || "").trim();
  if(value) localStorage.setItem(STORAGE_KEY,value);
  else localStorage.removeItem(STORAGE_KEY);
  return value;
}

export function configureGoogleSheets(){
  const current=getGoogleSheetsUrl();
  const url=prompt(
    "Pegá aquí la URL de implementación de Google Apps Script (termina en /exec):",
    current
  );
  if(url===null)return current;
  const value=setGoogleSheetsUrl(url);
  return value;
}

export async function sendServiceToGoogleSheets(service){
  const url=getGoogleSheetsUrl();
  if(!url)return {configured:false};

  const payload={
    id:service.id,
    createdAt:service.createdAt,
    mode:service.mode,
    client:service.client,
    equipmentType:"PC/Notebook",
    brand:service.brand,
    model:service.model,
    serial:service.serial,
    problem:service.problem,
    work:service.work,
    workDetail:service.workDetail,
    technicians:service.technicians,
    condition:service.condition,
    accessories:service.accessories,
    observations:service.observations,
    status:service.status
  };

  try{
    await fetch(url,{
      method:"POST",
      mode:"no-cors",
      headers:{"Content-Type":"text/plain;charset=utf-8"},
      body:JSON.stringify(payload)
    });
    return {configured:true,sent:true};
  }catch(error){
    console.warn("Google Sheets:",error);
    return {configured:true,sent:false,error};
  }
}
