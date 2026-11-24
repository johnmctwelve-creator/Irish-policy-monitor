const $ = (s) => document.querySelector(s);
const state = { assessments: [], commitments: [], indicators: [], positions: [] };
const icons = {Housing:"⌂",Health:"✚","Economy & taxation":"€","Immigration & asylum":"◎","Climate & energy":"♧",Transport:"↗","Transport & infrastructure":"↗","Education & skills":"▤","Education":"▤","Justice & public safety":"⚖","Agriculture & rural affairs":"♣","Disability & equality":"◉","Foreign affairs & defence":"◇"};
const safe = (v) => String(v ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const link = (url,label="View source") => url ? `<a class="source-link" href="${safe(url)}" target="_blank" rel="noopener noreferrer">${safe(label)} ↗</a>` : "";
const formatNum = (v) => typeof v === "number" ? new Intl.NumberFormat("en-IE").format(v) : safe(v ?? "Not reported");
async function load(){
 const files=["policy_assessments.json","commitment_tracker.json","research_register.json","party_position_register.json"];
 const [a,c,r,p]=await Promise.all(files.map(f=>fetch(`data/${f}`).then(x=>{if(!x.ok)throw Error(f);return x.json()})));
 state.assessments=a.assessments||[];state.commitments=c.starter_rows||[];state.indicators=r.indicators||[];state.positions=p.positions||[];
 const date=a.metadata?.research_cutoff||r.metadata?.research_cutoff||"Not stated";
 $("#research-date").textContent=`Research snapshot: ${date} · Expanded edition; conclusions remain provisional`;
 $("#method-date").textContent=date;
 $("#area-count").textContent=state.assessments.length;$("#indicator-count").textContent=state.indicators.length;$("#promise-count").textContent=state.commitments.length;
 populateAreaFilter();renderPolicies();renderEvidence();renderPromises();renderParties();
}
function populateAreaFilter(){const areas=[...new Set(state.indicators.map(x=>x.area))].sort();$("#evidence-filter").innerHTML='<option value="">All areas</option>'+areas.map(x=>`<option>${safe(x)}</option>`).join("");}
function renderPolicies(){
 const q=$("#policy-search").value.trim().toLowerCase();
 const rows=state.assessments.filter(x=>`${x.area} ${x.government_policy} ${x.progress}`.toLowerCase().includes(q));
 $("#policy-grid").innerHTML=rows.length?rows.map(x=>`<button class="policy-card" data-id="${safe(x.id)}"><div class="card-top"><span class="card-icon">${icons[x.area]||"◈"}</span><span class="card-arrow">↗</span></div><h3>${safe(x.area)}</h3><p>${safe(x.verdict||x.government_policy).slice(0,175)}…</p><span class="card-more">Read full assessment →</span></button>`).join(""):'<div class="empty">No policy areas match that search.</div>';
 document.querySelectorAll(".policy-card").forEach(b=>b.addEventListener("click",()=>openPolicy(b.dataset.id)));
}
function openPolicy(id){
 const x=state.assessments.find(a=>a.id===id);if(!x)return;
 const sections=[["Government approach",x.government_policy],["Progress and evidence",x.progress],["Assessment and conclusion",x.verdict],["Opposition alternatives",x.opposition],["International comparisons",x.international],["Evidence still needed",x.evidence_gaps]];
 const html=sections.map(s=>`<section class="detail-block"><h3>${safe(s[0])}</h3><p>${safe(s[1]||"No verified information is currently recorded. This is an explicit research gap, not a positive or negative finding.")}</p></section>`).join("");
 const sources=(x.sources||[]).map(s=>link(s[1],s[0])).join(" · ")||"Source links are being verified.";
 $("#policy-detail").innerHTML=`<p class="eyebrow">Policy assessment</p><h2>${safe(x.area)}</h2>${html}<div class="perspective-grid"><section class="detail-block"><h3>Left-leaning perspective</h3><p>${safe(x.left_case||"No verified, area-specific argument recorded yet.")}</p></section><section class="detail-block"><h3>Right-leaning perspective</h3><p>${safe(x.right_case||"No verified, area-specific argument recorded yet.")}</p></section></div><section class="detail-block"><h3>Primary and supporting sources</h3><p>${sources}</p></section><p class="meta">Provisional synthesis. The cited indicators support the stated conclusion only within their definitions, dates and limitations.</p>`;
 $("#policy-dialog").showModal();
}
function renderEvidence(){
 const q=$("#evidence-search").value.trim().toLowerCase(),area=$("#evidence-filter").value;
 const rows=state.indicators.filter(x=>(!area||x.area===area)&&`${x.area} ${x.indicator} ${x.interpretation} ${x.caveat}`.toLowerCase().includes(q));
 $("#evidence-list").innerHTML=rows.length?rows.map(x=>`<article class="evidence-item"><div><h3>${safe(x.indicator)}</h3><div class="meta">${safe(x.area)} · ${safe(x.period||"Period not stated")} · ${safe(x.type||"Research indicator")}</div></div><div class="evidence-value">${formatNum(x.value)} <small>${safe(x.unit||"")}</small></div><div class="evidence-note">${safe(x.interpretation||"Interpretation not yet recorded.")}${x.caveat?` <em>Caveat: ${safe(x.caveat)}</em>`:""}</div>${link(x.url,x.source||"View source")}</article>`).join(""):'<div class="empty">No indicators match those filters.</div>';
}
function renderPromises(){
 const status=$("#status-filter").value,rows=state.commitments.filter(x=>!status||x.status===status);
 $("#promise-list").innerHTML=rows.length?rows.map(x=>`<article class="promise-item"><div><h3>${safe(x.commitment_theme)}</h3><div class="meta">${safe(x.commitment_id)} · ${safe(x.policy_area)} · ${safe(x.responsible_department||"Department not specified")}</div></div><div class="promise-description"><strong>Latest evidence</strong><p>${safe(x.latest_metric||x.progress_note||x.notes||"No latest metric recorded")}</p><p class="meta">Target: ${safe(x.target||"Not quantified")} · Deadline: ${safe(x.deadline||"Not stated")}</p></div><div class="promise-status"><span class="status ${safe(x.status||"not_verifiable")}">${safe((x.status||"not_verifiable").replaceAll("_"," "))}</span><p class="meta">Confidence: ${safe(x.confidence||"Not stated")}</p></div><div class="promise-source">${link(x.delivery_evidence_url,x.delivery_evidence_title||"Delivery evidence")}</div><p class="meta promise-caveat">${safe(x.notes||"No further note recorded.")}</p></article>`).join(""):'<div class="empty">No commitments match that status.</div>';
}
function renderParties(){
 const rows=state.positions;
 $("#party-list").innerHTML=rows.length?rows.map(x=>`<article class="party-card"><div class="party-card-head"><h3>${safe(x.party)}</h3><span class="status">${safe(x.status||"Status not stated")}</span></div><p class="meta">${safe(x.policy_area)} · ${safe(x.publication_date||"Date not stated")}</p><p>${safe(x.position_summary)}</p><p>${safe(x.proposal_text)}</p><p class="meta">Costing: ${safe(x.costing_source||"No costing source recorded")}</p>${link(x.source_url,"Original party source")}</article>`).join(""):'<div class="empty">No party positions have been verified yet.</div>';
}
$("#policy-search").addEventListener("input",renderPolicies);$("#evidence-search").addEventListener("input",renderEvidence);$("#evidence-filter").addEventListener("change",renderEvidence);$("#status-filter").addEventListener("change",renderPromises);
load().catch(err=>{console.error(err);document.querySelectorAll(".loading").forEach(n=>n.textContent="Research data could not be loaded. Check that the data folder and four JSON files are published.");});
