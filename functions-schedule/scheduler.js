// Scheduler and ActivityReport functions isolated in dedicated folder
Parse.Cloud.define("writeTest", async request => {
  const message = request.params.message || "ok";
  const Test = Parse.Object.extend("Test");
  const obj = new Test();
  obj.set("message", message);
  obj.set("timestamp", new Date().toISOString());
  await obj.save(null, { useMasterKey: true });
  return { success: true };
});

Parse.Cloud.define("createActivityReport", async request => {
  const payload = request.params || {};
  const ActivityReport = Parse.Object.extend("ActivityReport");

  let obj;
  if (payload.bubble_id) {
    const q = new Parse.Query("ActivityReport");
    q.equalTo("bubble_id", payload.bubble_id);
    obj = await q.first({ useMasterKey: true });
  }
  if (!obj) obj = new ActivityReport();

  const fields = [
    "a_leads_agency","a_leads_agent","agencyfirstwriters","agencyuniquewriters",
    "agent_name","agent_state","agent_ufg","agent_user","agentactive","agentfirstwrite",
    "agenthasagency","agentinslo","agentinspark","agentinurs","agentissponsor","agentorgstring",
    "agentuplineufg","app_submitted_disclosed_agency","app_submitted_disclosure","appdirectssubmitted",
    "appointments","appsdirectissued","appsissued","appsissuedagency","appssubmittedagency","appsviewedagency",
    "appsviewedagent","appts","apvdirects","apvdirectsissued","apvissued","apvissuedagency","apvsubmitted",
    "apvsubmittedagency","bonus_lead_agency","bonus_leads_agent","bonusableagencyapv","datalabel","datefilter",
    "examfx_enrollment","ica_sent_agency","icompleted___ica_sent","icompleted___no_ica","igood_to_go_s","iica_signed",
    "ilicensed_ica_signed","inodisposition","inoshow","interview","interviewsagency","isits","isitsagency",
    "ismanager","manager_status","monthlabel","non_licensed_ica_signed","percent_view_agency","percent_viewed",
    "salesapptagency","sappagency","sapptakeagency","snodisposition","ssitapptaken","ssitreschedule","ssits",
    "ssitsagency","uwissuedagency","weeklabel","slug","created_by","created_by_email","bubble_id"
  ];
  for (const key of fields) {
    if (payload[key] !== undefined) obj.set(key, payload[key]);
  }
  await obj.save(null, { useMasterKey: true });
  return { success: true, objectId: obj.id };
});

Parse.Cloud.define("scheduleOnList", async request => {
  const itensList = request.params.itensList;
  const functionName = request.params.functionName || request.params.function || request.params.Function;
  const mapping = request.params.mapping || request.params.Mapping || {};
  const scheduleDateISO = request.params.scheduleDate || request.params.ScheduleDate;
  const intervalSeconds = Number(request.params.intervalSeconds || request.params.Interval || 0);

  if (!Array.isArray(itensList) || itensList.length === 0) throw "itensList vazio";
  if (!functionName) throw "functionName obrigatório";

  const now = Date.now();
  const startAt = scheduleDateISO ? new Date(scheduleDateISO).getTime() : now;
  if (Number.isNaN(startAt)) throw "scheduleDate inválido";

  const delay = ms => new Promise(r => setTimeout(r, ms));
  const results = [];
  const waitMs = Math.max(0, startAt - now);
  if (waitMs > 0) await delay(waitMs);

  for (let i = 0; i < itensList.length; i++) {
    const item = itensList[i];
    const payload = {};
    for (const [targetKey, sourcePath] of Object.entries(mapping)) {
      payload[targetKey] = resolvePath(item, sourcePath);
    }
    if (Object.keys(mapping).length === 0) Object.assign(payload, item);

    try {
      const res = await Parse.Cloud.run(functionName, payload, { useMasterKey: true });
      results.push({ index: i, ok: true, res });
    } catch (err) {
      results.push({ index: i, ok: false, error: String(err && err.message ? err.message : err) });
    }
    if (i < itensList.length - 1 && intervalSeconds > 0) {
      await delay(intervalSeconds * 1000);
    }
  }

  const summary = {
    total: itensList.length,
    ok: results.filter(r => r.ok).length,
    failed: results.filter(r => !r.ok).length
  };
  return { summary, results };
});

// 4. Função principal que replica o trigger do Bubble (múltiplos agendamentos)
Parse.Cloud.define("refreshActivityReport1", async request => {
  const itensList = request.params.itensList || [];
  const functionName = request.params.functionName || "createActivityReport";
  const mapping = request.params.mapping || {};
  const baseIntervalSeconds = Number(request.params.intervalSeconds || 1);
  
  // Definir períodos e suas datas (baseado no workflow do Bubble)
  const now = new Date();
  const periods = [
    { name: "Today", dateFrom: new Date(now.getFullYear(), now.getMonth(), now.getDate()), dateTo: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1) },
    { name: "Yesterday", dateFrom: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1), dateTo: new Date(now.getFullYear(), now.getMonth(), now.getDate()) },
    { name: "Last 7", dateFrom: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7), dateTo: now },
    { name: "Last 30", dateFrom: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30), dateTo: now },
    { name: "This Month", dateFrom: new Date(now.getFullYear(), now.getMonth(), 1), dateTo: now }
  ];
  
  const results = [];
  let scheduleOffset = 0; // Offset para evitar conflitos de timing
  
  for (const period of periods) {
    try {
      // Adicionar parâmetros de período ao mapping
      const periodMapping = {
        ...mapping,
        dateFilter: period.name,
        dateFrom: period.dateFrom.toISOString(),
        dateTo: period.dateTo.toISOString()
      };
      
      // Agendar para este período (com offset para evitar sobreposição)
      const scheduleDate = new Date(Date.now() + (scheduleOffset * 60000)); // 1 minuto entre períodos
      scheduleOffset++;
      
      const result = await Parse.Cloud.run("scheduleOnList", {
        itensList: itensList,
        functionName: functionName,
        mapping: periodMapping,
        scheduleDate: scheduleDate.toISOString(),
        intervalSeconds: baseIntervalSeconds
      });
      
      results.push({ 
        period: period.name, 
        success: true, 
        result: result,
        scheduledAt: scheduleDate.toISOString()
      });
      
    } catch (err) {
      results.push({ 
        period: period.name, 
        success: false, 
        error: String(err && err.message ? err.message : err) 
      });
    }
  }
  
  const summary = {
    totalPeriods: periods.length,
    successfulPeriods: results.filter(r => r.success).length,
    failedPeriods: results.filter(r => !r.success).length,
    totalItems: itensList.length
  };
  
  return { summary, results };
});

// 5. Funções CRUD genéricas para uso em lote
Parse.Cloud.define("createThing", async request => {
  const className = request.params.className;
  const payload = request.params.payload || {};
  
  if (!className) throw "className é obrigatório";
  
  try {
    const Thing = Parse.Object.extend(className);
    const obj = new Thing();
    
    // Definir campos do payload
    for (const [key, value] of Object.entries(payload)) {
      obj.set(key, value);
    }
    
    await obj.save(null, { useMasterKey: true });
    return { success: true, objectId: obj.id, className };
  } catch (err) {
    return { success: false, error: String(err && err.message ? err.message : err) };
  }
});

Parse.Cloud.define("updateThing", async request => {
  const className = request.params.className;
  const objectId = request.params.objectId;
  const payload = request.params.payload || {};
  
  if (!className) throw "className é obrigatório";
  if (!objectId) throw "objectId é obrigatório";
  
  try {
    const query = new Parse.Query(className);
    const obj = await query.get(objectId, { useMasterKey: true });
    
    // Atualizar campos do payload
    for (const [key, value] of Object.entries(payload)) {
      obj.set(key, value);
    }
    
    await obj.save(null, { useMasterKey: true });
    return { success: true, objectId: obj.id, className };
  } catch (err) {
    return { success: false, error: String(err && err.message ? err.message : err) };
  }
});

Parse.Cloud.define("deleteThing", async request => {
  const className = request.params.className;
  const objectId = request.params.objectId;
  
  if (!className) throw "className é obrigatório";
  if (!objectId) throw "objectId é obrigatório";
  
  try {
    const query = new Parse.Query(className);
    const obj = await query.get(objectId, { useMasterKey: true });
    await obj.destroy({ useMasterKey: true });
    return { success: true, objectId, className };
  } catch (err) {
    return { success: false, error: String(err && err.message ? err.message : err) };
  }
});

function resolvePath(obj, path) {
  if (!path) return undefined;
  if (path === ".") return obj;
  return String(path)
    .split(".")
    .reduce((acc, k) => (acc && acc[k] !== undefined ? acc[k] : undefined), obj);
}

