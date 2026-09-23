const SHEET_NAME = "Servicios";

function doGet() {
  return json_({ ok: true, service: "LEO-TECH Service", message: "Endpoint activo" });
}

function doPost(e) {
  try {
    const raw = e && e.postData && e.postData.contents ? e.postData.contents : "{}";
    const data = JSON.parse(raw);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) sheet = ss.insertSheet(SHEET_NAME);

    const headers = [
      "Fecha","N.º servicio","Modo","Cliente","Tipo equipo","Marca","Modelo",
      "N.º serie","Problema informado","Trabajo","Descripción del trabajo",
      "Responsables","Estado físico","Accesorios","Observaciones","Estado"
    ];

    if (sheet.getLastRow() === 0) sheet.appendRow(headers);

    sheet.appendRow([
      new Date(data.createdAt || new Date()),
      data.id || "",
      data.mode || "",
      data.client || "",
      data.equipmentType || "PC/Notebook",
      data.brand || "",
      data.model || "",
      data.serial || "",
      data.problem || "",
      Array.isArray(data.work) ? data.work.join(", ") : (data.work || ""),
      data.workDetail || "",
      Array.isArray(data.technicians) ? data.technicians.join(", ") : (data.technicians || ""),
      data.condition || "",
      data.accessories || "",
      data.observations || "",
      data.status || "En proceso"
    ]);

    return json_({ ok: true, id: data.id || null });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
