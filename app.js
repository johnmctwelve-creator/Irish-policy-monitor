const $ = (s) => document.querySelector(s);
const state = { assessments: [], commitments: [], indicators: [], positions: [], manifestos: [], expandedCommitments: [], feasibility: null, fiscal: null, questionnaire: null };
const icons = {Housing:"⌂",Health:"✚","Economy & taxation":"€","Immigration & asylum":"◎","Climate & energy":"♧",Transport:"↗","Transport & infrastructure":"↗","Education & skills":"▤","Education":"▤","Justice & public safety":"⚖","Agriculture & rural affairs":"♣","Disability & equality":"◉","Foreign affairs & defence":"◇"};
const safe = (v) => String(v ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const link = (url,label="View source") => url ? `<a class="source-link" href="${safe(url)}" target="_blank" rel="noopener noreferrer">${safe(label)} ↗</a>` : "";
const formatNum = (v) => typeof v === "number" ? new Intl.NumberFormat("en-IE").format(v) : safe(v ?? "Not reported");
async function load(){
 const files=["policy_assessments.json","commitment_tracker.json","research_register.json","party_position_register.json","manifesto_comparison_2024.json","pfg_commitments_expanded.json","feasibility_assessment.json","five_year_fiscal_model.json","policy_alignment_questionnaire.json"];
 const [a,c,r,p,m,e,f,g,q]=await Promise.all(files.map(f=>fetch(`data/${f}`).then(x=>{if(!x.ok)throw Error(f);return x.json()})));
 state.assessments=a.assessments||[];state.commitments=c.starter_rows||[];state.indicators=r.indicators||[];state.positions=p.positions||[];state.manifestos=m.parties||[];state.expandedCommitments=e.commitments||[];state.feasibility=f;state.fiscal=g;state.questionnaire=q;
 const date=a.metadata?.research_cutoff||r.metadata?.research_cutoff||"Not stated";
 $("#research-date").textContent=`Research snapshot: ${date} · Expanded edition; conclusions remain provisional`;
 $("#method-date").textContent=date;
 $("#area-count").textContent=state.assessments.length;$("#indicator-count").textContent=state.indicators.length;$("#promise-count").textContent=state.commitments.length;
 populateAreaFilter();renderPolicies();renderEvidence();renderPromises();renderParties();renderManifestos();renderExpandedCommitments();renderFeasibility();renderFiscalModel();renderQuestionnaire();
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

function renderManifestos(){
 const cols=[["Housing","housing"],["Health","health"],["Economy","economy"],["Climate","climate"],["Immigration","immigration"],["Education","education"]];
 const pct=v=>v===undefined?"Not modelled":(v>0?"+":"")+v.toFixed(1)+"%";
 $("#manifesto-list").innerHTML=state.manifestos.map(p=>{
  const v=p.verification||{},pr=v.page_refs||{},c=v.costing||{},pb=v.pbo||{};
  const pageRows=cols.map(([label,key])=>`<div><dt>${safe(label)}</dt><dd>${safe(p[key]||"No sufficiently verified summary recorded.")}</dd><small>Manifesto pages: ${safe(pr[key]||"Not verified")}</small></div>`).join("");
  const figures=(c.key_figures||[]).map(x=>`<li>${safe(x)}</li>`).join("");
  const pbo=pb.coverage==="Included"?`<div class="pbo-result"><strong>Independent PBO model — household income change by decile</strong><div><span>Poorest decile</span><b>${pct(pb.poorest_decile_income_change_pct)}</b></div><div><span>Richest decile</span><b>${pct(pb.richest_decile_income_change_pct)}</b></div><p>${safe(pb.summary)}</p><p class="meta">${safe(pb.caveat)}</p></div>`:`<div class="pbo-result"><strong>Independent PBO comparison</strong><p>${safe(pb.summary||"No comparable PBO microsimulation result recorded.")}</p><p class="meta">${safe(pb.caveat||"Not included in the six-party model.")}</p></div>`;
  return `<article class="manifesto-card"><div class="party-card-head"><div><h3>${safe(p.party)}</h3><p class="meta">${safe(p.manifesto_title)} · ${safe(p.manifesto_year)} · ${safe(v.evidence_quality||p.status)}</p></div>${link(v.official||p.manifesto_source,"Open original manifesto")}</div><dl class="manifesto-grid">${pageRows}</dl><details class="costing-details"><summary>Costings and fiscal assumptions</summary><div><p><strong>Type:</strong> ${safe(c.type||"Not verified")}</p><ul>${figures||"<li>No sufficiently verified figures recorded.</li>"}</ul><p>${safe(v.checks?.costing||"No costing analysis recorded.")}</p><p><strong>Independent review:</strong> ${safe(c.independent_review||"No independent review located.")}</p></div></details>${pbo}<p class="meta">${safe(p.status)}</p>${link(p.manifesto_source,"Manifesto archive/source")}</article>`;
 }).join("");
}function renderExpandedCommitments(){
 const groups=[...new Set(state.expandedCommitments.map(x=>x.policy_area))];
 $("#expanded-pfg-list").innerHTML=groups.map(area=>`<details class="pfg-group"><summary>${safe(area)} <span>${state.expandedCommitments.filter(x=>x.policy_area===area).length} commitments</span></summary><div>${state.expandedCommitments.filter(x=>x.policy_area===area).map(x=>`<article class="pfg-item"><h4>${safe(x.commitment_summary)}</h4><p class="meta">PFG printed page ${safe(x.programme_page)} · ${safe(x.id)}</p><p><strong>How to measure:</strong> ${safe(x.measurement_required)}</p><p class="meta">Baseline: ${safe(x.baseline)} Status: ${safe(x.delivery_status)}</p>${link(x.source_url,"Programme for Government PDF")}</article>`).join("")}</div></details>`).join("");
}

function renderFeasibility(){
 const f=state.feasibility;if(!f)return;
 const labels={fiscal:"Fiscal arithmetic",funding:"Funding credibility",baseline:"Baseline and additionality",delivery:"Delivery capacity",outcomes:"Measurable outcomes",uncertainty:"Risk and sensitivity"};
 $("#feasibility-method").innerHTML=f.rubric.map(x=>`<article><h4>${safe(x.label)}</h4><p>${safe(x.question)}</p></article>`).join("");
 $("#feasibility-list").innerHTML=f.parties.map(p=>`<article class="feasibility-card"><div class="party-card-head"><h3>${safe(p.party)}</h3><span class="status">${safe(p.confidence)} confidence</span></div><p class="meta">PBO comparison: ${safe(p.pbo)}</p><p>${safe(p.pbo_profile)}</p><div class="feasibility-columns"><section><h4>Strengths in published plan</h4><ul>${p.strengths.map(s=>`<li>${safe(s)}</li>`).join("")}</ul></section><section><h4>Risks and unresolved tests</h4><ul>${p.risks.map(s=>`<li>${safe(s)}</li>`).join("")}</ul></section></div><p><strong>Funding test:</strong> ${safe(p.funding_watch)}</p><p><strong>Delivery test:</strong> ${safe(p.delivery_watch)}</p></article>`).join("");
 $("#feasibility-conclusion").textContent=f.system_conclusion;
 $("#feasibility-next").innerHTML=f.next_steps.map(s=>`<li>${safe(s)}</li>`).join("");
 $("#feasibility-sources").innerHTML=f.metadata.primary_sources.map(s=>`<li><a href="${safe(s.url)}" target="_blank" rel="noopener noreferrer">${safe(s.name)} ↗</a><p>${safe(s.scope)}</p></li>`).join("");
}

function renderFiscalModel(){
 const m=state.fiscal;if(!m)return;
 const money=v=>"€"+Number(v).toFixed(1)+"bn";
 $("#fiscal-baseline").innerHTML=m.baseline.map(x=>`<tr><td>${x.year}</td><td>${money(x.tax)}</td><td>${money(x.ct)}</td><td>${money(x.windfall)}</td><td>${money(x.gg_balance)}</td><td>${money(x.gross_voted)}</td></tr>`).join("");
 $("#fiscal-stress").innerHTML=m.baseline.map(x=>`<tr><td>${x.year}</td>${m.stress.map(s=>{const val=x.gg_balance-x.windfall*s.haircut/100;return `<td class="${val<0?"negative":""}">${money(val)}</td>`}).join("")}</tr>`).join("");
 $("#fiscal-pbo").innerHTML=m.pbo.map(p=>`<tr><td>${safe(p.party)}</td><td>${p.tax_receipts_pct>0?"+":""}${p.tax_receipts_pct.toFixed(1)}%</td><td>${p.welfare_spending_pct>0?"+":""}${p.welfare_spending_pct.toFixed(1)}%</td><td>${p.poorest_decile_income_pct>0?"+":""}${p.poorest_decile_income_pct.toFixed(1)}%</td><td>${p.richest_decile_income_pct>0?"+":""}${p.richest_decile_income_pct.toFixed(1)}%</td></tr>`).join("");
 $("#fiscal-party-inputs").innerHTML=m.parties.map(p=>`<article class="fiscal-party"><h4>${safe(p.party)}</h4><p>${safe(p.known)}</p><strong>Still required for a comparable annual balance</strong><ul>${p.missing.map(x=>`<li>${safe(x)}</li>`).join("")}</ul></article>`).join("");
 $("#fiscal-conclusion").textContent=m.conclusion;
 $("#fiscal-rules").innerHTML=m.rules.map(x=>`<li>${safe(x)}</li>`).join("");
 $("#fiscal-sources").innerHTML=m.metadata.sources.map(s=>`<li><a href="${safe(s.url)}" target="_blank" rel="noopener noreferrer">${safe(s.name)} ↗</a></li>`).join("");
}

function renderQuestionnaire(){
 const q=state.questionnaire;if(!q)return;
 const root=$("#alignment-questions");if(!root)return;
 root.innerHTML=q.dimensions.map((d,i)=>`<fieldset class="alignment-question"><legend><span>${i+1} / ${q.dimensions.length}</span>${safe(d.label)}</legend><p>${safe(d.question)}</p><div class="alignment-options">${d.options.map(o=>`<label><input type="radio" name="align-${safe(d.id)}" value="${safe(o.id)}"><span>${safe(o.label)}</span></label>`).join("")}</div></fieldset>`).join("");
 $("#alignment-progress").textContent="0 of "+q.dimensions.length+" answered";
 root.addEventListener("change",updateAlignmentProgress);
 $("#alignment-reset").addEventListener("click",()=>{root.querySelectorAll("input").forEach(x=>x.checked=false);$("#alignment-results").hidden=true;updateAlignmentProgress();});
 $("#alignment-submit").addEventListener("click",calculateAlignment);
 function updateAlignmentProgress(){const n=q.dimensions.filter(d=>root.querySelector(`input[name="align-${d.id}"]:checked`)).length;$("#alignment-progress").textContent=n+" of "+q.dimensions.length+" answered";}
}
function calculateAlignment(){
 const q=state.questionnaire,root=$("#alignment-questions");
 const answers={};q.dimensions.forEach(d=>{const x=root.querySelector(`input[name="align-${d.id}"]:checked`);if(x)answers[d.id]=x.value;});
 if(!Object.keys(answers).length){$("#alignment-validation").textContent="Answer at least one issue to see a comparison.";return;}
 const adjacent={
 housing:{state:["mixed"],mixed:["state","market"],market:["mixed"]},
 health:{public:["reform"],reform:["public","choice"],choice:["reform"]},
 economy:{redistribute:["balance"],balance:["redistribute","enterprise"],enterprise:["balance"]},
 climate:{fast:["pragmatic"],pragmatic:["fast","cautious"],cautious:["pragmatic"]},
 immigration:{rights:["managed"],managed:["rights","strict"],strict:["managed"]},
 education:{inclusive:["capacity"],capacity:["inclusive","choice"],choice:["capacity"]}
 };
 const results=Object.entries(q.party_codes).map(([party,code])=>{
  let score=0,max=0,matched=0,details=[];
  q.dimensions.forEach(d=>{const ans=answers[d.id];if(!ans||ans==="unsure")return;const w=d.weight||1;max+=2*w;const p=code[d.id];const pts=p===ans?2:(adjacent[d.id]?.[ans]||[]).includes(p)?1:0;score+=pts*w;if(pts)matched++;details.push({label:d.label,points:pts*w,weight:w});});
  return {party,score,max,percent:max?Math.round(score/max*100):0,matched,details};
 }).sort((x,y)=>y.percent-x.percent||y.score-x.score||x.party.localeCompare(y.party));
 const top=results[0].percent,tied=results.filter(x=>x.percent===top);
 $("#alignment-results").hidden=false;
 $("#alignment-validation").textContent="";
 $("#alignment-summary").textContent=tied.length>1?"Your answers produce a joint highest match. These parties share the highest broad-category alignment in this questionnaire.":"Your answers produce the highest broad-category match shown below. This is a comparison aid, not a recommendation.";
 $("#alignment-ranking").innerHTML=results.map((r,i)=>`<article class="alignment-result-row"><div><strong>${i+1}. ${safe(r.party)}</strong><small>${r.matched} of ${Object.keys(answers).length} answered issues with some alignment</small></div><div class="alignment-score"><b>${r.percent}%</b><div class="alignment-track"><i style="width:${r.percent}%"></i></div></div></article>`).join("");
 $("#alignment-detail").innerHTML=tied.map(r=>`<section><h4>${safe(r.party)} — issue-by-issue</h4><ul>${r.details.map(d=>`<li>${safe(d.label)}: ${d.points===0?"No broad match":d.points%2===0?"Strong broad match":"Partial broad match"}</li>`).join("")}</ul><p class="meta">A category match reflects the questionnaire's simplified coding, not a full reading of every party proposal.</p></section>`).join("");
 $("#alignment-results").scrollIntoView({behavior:"smooth",block:"start"});
}
