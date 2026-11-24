const $ = (s) => document.querySelector(s);
const state = { assessments: [], commitments: [], indicators: [], positions: [], };
const icons = {Housing:"⌂",Health:"✚","Economy & taxation":"€","Immigration & asylum":"◎","Climate & energy":"♧",Transport:"↗",Education:"▤",Justice:"⚖","Agriculture & rural affairs":"♣","Disability & equality":"◉","Foreign affairs & defence":"◇"};
const safe = (v) => String(v ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const link = (url,label="View source") => url ? `<a class="source-link" href="${safe(url)}" target="_blank" rel="noopener noreferrer">${safe(label)} ↗</a>` : "";
const formatNum = (v) => typeof v === "number" ? new Intl.NumberFormat("en-IE").format(v) : safe(v);
async function load(){
  const [a,c,r,p] = await Promise.all(["policy_assessments.json","commitment_tracker.json","research_register.json","party_position_register.json"].map(f=>fetch(`data/${f}`).then(x=>{if(!x.ok)throw Error(f);return x.json()})));
  state.assessments=a.assessments||[]; state.commitments=c.starter_rows||[]; state.indicators=r.indicators||[]; state.positions=p.positions||[];
  const date=a.metadata?.research_cutoff || r.metadata?.research_cutoff || "Not stated";
  $("#research-date").textContent=`Research snapshot: ${date} · Initial edition`;
  $("#method-date").textContent=date;
  $("#area-count").textContent=state.assessments.length;
  $("#indicator-count").textContent=state.indicators.length;
  $("#promise-count").textContent=state.commitments.length;
  populateAreaFilter(); renderPolicies(); renderEvidence(); renderPromises();
}
function populateAreaFilter(){const areas=[...new Set(state.indicators.map(x=>x.area))].sort();$("#evidence-filter").innerHTML='<option value="">All areas</option>'+areas.map(x=>`<option>${safe(x)}</option>`).join("");}
function renderPolicies(){
 const q=$("#policy-search").value.trim().toLowerCase();
 const rows=state.assessments.filter(x=>`${x.area} ${x.government_policy} ${x.progress}`.toLowerCase().includes(q));
 $("#policy-grid").innerHTML=rows.length?rows.map(x=>`<button class="policy-card" data-id="${safe(x.id)}"><div class="card-top"><span class="card-icon">${icons[x.area]||"◈"}</span><span class="card-arrow">↗</span></div><h3>${safe(x.area)}</h3><p>${safe(x.government_policy).slice(0,145)}…</p><span class="card-more">Read policy assessment →</span></button>`).join(""):'<div class="empty">No policy areas match that search.</div>';
 document.querySelectorAll(".policy-card").forEach(b=>b.addEventListener("click",()=>openPolicy(b.dataset.id)));
}
function openPolicy(id){
 const x=state.assessments.find(a=>a.id===id);if(!x)return;
 const sections=[["Government approach",x.government_policy],["Progress and evidence",x.progress],["Provisional assessment",x.verdict],["Opposition alternatives",x.opposition],["International comparisons",x.international]];
 const html=sections.filter(s=>s[1]).map(s=>`<section class="detail-block"><h3>${safe(s[0])}</h3><p>${safe(s[1])}</p></section>`).join("");
 $("#policy-detail").innerHTML=`<p class="eyebrow">Policy assessment</p><h2>${safe(x.area)}</h2>${html}<div class="perspective-grid">${x.left_case?`<section class="detail-block"><h3>Left-leaning perspective</h3><p>${safe(x.left_case)}</p></section>`:""}${x.right_case?`<section class="detail-block"><h3>Right-leaning perspective</h3><p>${safe(x.right_case)}</p></section>`:""}</div><p class="meta">Assessment is provisional and should be read alongside source notes and research caveats.</p>`;
 $("#policy-dialog").showModal();
}
function renderEvidence(){
 const q=$("#evidence-search").value.trim().toLowerCase(), area=$("#evidence-filter").value;
 const rows=state.indicators.filter(x=>(!area||x.area===area)&&`${x.area} ${x.indicator} ${x.interpretation} ${x.caveat}`.toLowerCase().includes(q));
 $("#evidence-list").innerHTML=rows.length?rows.map(x=>`<article class="evidence-item"><div><h3>${safe(x.indicator)}</h3><div class="meta">${safe(x.area)} · ${safe(x.period||"Period not stated")} · ${safe(x.type||"Research indicator")}</div></div><div class="evidence-value">${formatNum(x.value)} <small>${safe(x.unit||"")}</small></div><div class="evidence-note">${safe(x.interpretation||"")}${x.caveat?` <em>Caveat: ${safe(x.caveat)}</em>`:""}</div>${link(x.url)}</article>`).join(""):'<div class="empty">No indicators match those filters.</div>';
}
function renderPromises(){
 const status=$("#status-filter").value;
 const rows=state.commitments.filter(x=>!status||x.status===status);
 $("#promise-list").innerHTML=rows.length?rows.map(x=>`<article class="promise-item"><div><h3>${safe(x.commitment_theme)}</h3><div class="meta">${safe(x.policy_area)} · ${safe(x.responsible_department||"Department not specified")}</div></div><div class="meta">${safe(x.latest_metric||x.progress_note||x.notes||"No latest metric recorded")}</div><span class="status ${safe(x.status||"not_verifiable")}">${safe((x.status||"not_verifiable").replaceAll("_"," "))}</span><div class="meta">${safe(x.target_deadline||x.deadline||"Deadline to verify")} · Evidence confidence: ${safe(x.confidence||"Not stated")}</div></article>`).join(""):'<div class="empty">No commitments match that status.</div>';
}
$("#policy-search").addEventListener("input",renderPolicies);$("#evidence-search").addEventListener("input",renderEvidence);$("#evidence-filter").addEventListener("change",renderEvidence);$("#status-filter").addEventListener("change",renderPromises);
load().catch(err=>{console.error(err);document.querySelectorAll(".loading").forEach(n=>n.textContent="The research data could not be loaded. Please serve this folder through a web server rather than opening index.html directly.");});
