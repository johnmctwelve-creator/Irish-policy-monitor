const DATA_FILES = [
  "policy_assessments.json",
  "research_register.json",
  "commitment_tracker.json",
  "pfg_commitments_expanded.json",
  "party_position_register.json",
  "manifesto_comparison_2024.json",
  "feasibility_assessment.json",
  "five_year_fiscal_model.json"
];
const STOP = new Set("the and for that with from this have what when where who does how about into your you are was were has had will would could should ireland irish policy government".split(" "));
let corpusCache = { at: 0, docs: [] };
const cors = origin => ({
  "Access-Control-Allow-Origin": origin,
  "Access-Control-Allow-Methods": "POST, OPTIONS, GET",
  "Access-Control-Allow-Headers": "Content-Type",
  "Vary": "Origin"
});
function json(data, status, origin) {
  return new Response(JSON.stringify(data), {status, headers:{...cors(origin), "Content-Type":"application/json; charset=utf-8"}});
}
function tokens(text) {
  return String(text || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").match(/[a-z0-9]{3,}/g)?.filter(t=>!STOP.has(t)) || [];
}
function walk(value, path, docs) {
  if (Array.isArray(value)) { value.forEach((v,i)=>walk(v, path+" "+i, docs)); return; }
  if (!value || typeof value !== "object") return;
  const textParts = [];
  const urls = [];
  for (const [key,val] of Object.entries(value)) {
    if (typeof val === "string") {
      if (/^(https?:\/\/)/i.test(val)) urls.push({title:key.replace(/_/g," "),url:val});
      else if (val.length > 12) textParts.push(key.replace(/_/g," ")+": "+val);
    } else if (Array.isArray(val) && val.every(x=>typeof x==="string" || (Array.isArray(x)&&x.length>=2))) {
      for (const item of val) {
        if (Array.isArray(item) && /^https?:\/\//i.test(String(item[1]||""))) urls.push({title:String(item[0]),url:String(item[1])});
        else if (typeof item==="string") textParts.push(item);
      }
    }
  }
  if (textParts.length) {
    const title = String(value.area || value.indicator || value.commitment_theme || value.title || value.name || value.id || path);
    docs.push({title, text:textParts.join("\n"), urls:urls.slice(0,8)});
  }
  for (const [key,val] of Object.entries(value)) {
    if (val && typeof val==="object" && !Array.isArray(val)) walk(val,path+" "+key,docs);
    else if (Array.isArray(val)) val.forEach((v,i)=>{if(v&&typeof v==="object"&&!Array.isArray(v))walk(v,path+" "+key+" "+i,docs);});
  }
}
async function getCorpus(env) {
  if (corpusCache.docs.length && Date.now()-corpusCache.at < 10*60*1000) return corpusCache.docs;
  const base = (env.IPM_DATA_BASE || "https://raw.githubusercontent.com/johnmctwelve-creator/Irish-policy-monitor/main/data").replace(/\/$/,"");
  const results = await Promise.all(DATA_FILES.map(async file => {
    const res = await fetch(base+"/"+file);
    if (!res.ok) return null;
    return {file, data:await res.json()};
  }));
  const docs = [];
  for (const item of results.filter(Boolean)) walk(item.data, item.file, docs);
  corpusCache = {at:Date.now(),docs};
  return docs;
}
function retrieve(question, docs) {
  const q = [...new Set(tokens(question))];
  const scored = docs.map(doc => {
    const hay = (doc.title+" "+doc.text).toLowerCase();
    let score = 0;
    for (const term of q) {
      const count = hay.split(term).length-1;
      if (count) score += Math.min(count,4) * (doc.title.toLowerCase().includes(term) ? 3 : 1);
    }
    return {...doc,score};
  }).filter(d=>d.score>0).sort((a,b)=>b.score-a.score).slice(0,7);
  return scored;
}
function sourceList(matches) {
  const out=[], seen=new Set();
  for (const match of matches) for (const source of match.urls) {
    if (!/^https:\/\//i.test(source.url) || seen.has(source.url)) continue;
    seen.add(source.url); out.push({title:source.title,url:source.url});
  }
  return out.slice(0,12);
}
export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const allowed = (env.ALLOWED_ORIGIN || "https://johnmctwelve-creator.github.io").split(",").map(x=>x.trim());
    const allowedOrigin = allowed.includes(origin) ? origin : allowed[0];
    if (request.method==="OPTIONS") return new Response(null,{headers:cors(allowedOrigin)});
    const url = new URL(request.url);
    if (url.pathname==="/health") return json({ok:true,service:"Irish Policy Monitor AI"},200,allowedOrigin);
    if (url.pathname!=="/api/chat" || request.method!=="POST") return json({error:"Not found"},404,allowedOrigin);
    if (!env.OPENAI_API_KEY) return json({error:"The AI service is not configured. Add OPENAI_API_KEY to the Worker secrets."},503,allowedOrigin);
    try {
      const body = await request.json();
      const question = String(body.question || "").trim();
      if (!question || question.length>1200) return json({error:"Please enter a question of up to 1,200 characters."},400,allowedOrigin);
      const docs = await getCorpus(env);
      const matches = retrieve(question,docs);
      if (!matches.length) return json({answer:"I couldn't find sufficiently relevant material in the current Irish Policy Monitor research files to answer that reliably. Try naming a policy area, department, commitment or statistic.",sources:[]},200,allowedOrigin);
      const sources = sourceList(matches);
      const evidence = matches.map((m,i)=>"EVIDENCE "+(i+1)+" — "+m.title+"\n"+m.text+"\n"+m.urls.map(u=>u.title+": "+u.url).join("\n")).join("\n\n").slice(0,26000);
      const prompt = "Visitor question:\n"+question+"\n\nRetrieved Irish Policy Monitor evidence (may be incomplete):\n"+evidence+"\n\nWrite a clear answer for the public. Use only the supplied evidence for factual claims. Cite relevant evidence inline as [1], [2], etc., matching the evidence order. Distinguish government commitments, party proposals, legislation, implementation and measured outcomes. State dates and caveats. If the evidence does not establish an answer, say so. Do not invent current ministers, legal status, statistics or source details. Do not infer that an unverified commitment was not delivered.";
      const ai = await fetch("https://api.openai.com/v1/responses",{
        method:"POST",
        headers:{"Authorization":"Bearer "+env.OPENAI_API_KEY,"Content-Type":"application/json"},
        body:JSON.stringify({
          model:env.OPENAI_MODEL || "gpt-4.1-mini",
          instructions:"You are Irish Policy Monitor AI, a non-partisan civic research assistant. Be precise, balanced, accessible and evidence-first. Never present party advocacy as fact. Do not give personalised legal or financial determinations. Make uncertainty visible.",
          input:prompt,
          max_output_tokens:1000
        })
      });
      const result = await ai.json();
      if (!ai.ok) return json({error:"The AI provider returned an error. Check the Worker model setting and API account."},502,allowedOrigin);
      const answer = (result.output || []).flatMap(item=>item.content || []).filter(part=>part.type==="output_text").map(part=>part.text).join("\n").trim();
      return json({answer:answer || "I couldn't generate an answer from the retrieved evidence.",sources},200,allowedOrigin);
    } catch (error) {
      return json({error:"The assistant encountered a temporary error. Please try again."},500,allowedOrigin);
    }
  }
};