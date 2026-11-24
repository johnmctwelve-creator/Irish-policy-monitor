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
 populateAreaFilter();populatePartyFilter();renderExecutiveDashboard();renderPolicies();renderEvidence();renderPromises();renderParties();renderManifestos();renderExpandedCommitments();renderFeasibility();renderFiscalModel();renderQuestionnaire();
}
function populateAreaFilter(){const areas=[...new Set(state.indicators.map(x=>x.area))].sort();$("#evidence-filter").innerHTML='<option value="">All areas</option>'+areas.map(x=>`<option>${safe(x)}</option>`).join("");}
function renderPolicies(){
 const q=$("#policy-search").value.trim().toLowerCase();
 const rows=state.assessments.filter(x=>`${x.area} ${x.government_policy} ${x.progress}`.toLowerCase().includes(q));
 $("#policy-grid").innerHTML=rows.length?rows.map(x=>`<button class="policy-card" data-id="${safe(x.id)}"><div class="card-top"><span class="card-icon">${icons[x.area]||"◈"}</span><span class="card-arrow">↗</span></div><span class="policy-verdict" data-tone="${/off track|weak|risk/i.test(x.verdict||"")?"risk":/mixed|uneven|provisional/i.test(x.verdict||"")?"mixed":"positive"}">${safe((x.verdict||"Assessment available").split(/[.;]/)[0].slice(0,48))}</span><h3>${safe(x.area)}</h3><p>${safe(x.progress||x.government_policy).slice(0,118)}…</p><span class="card-more">Explore evidence →</span></button>`).join(""):'<div class="empty">No policy areas match that search.</div>';
 document.querySelectorAll(".policy-card").forEach(b=>b.addEventListener("click",()=>openPolicy(b.dataset.id)));
}
function openPolicy(id){
 const x=state.assessments.find(a=>a.id===id);if(!x)return;
 const sections=[["Government approach",x.government_policy],["Progress and evidence",x.progress],["Assessment and conclusion",x.verdict],["Opposition alternatives",x.opposition],["International comparisons",x.international],["Evidence still needed",x.evidence_gaps]];
 const block=s=>`<section class="detail-block"><h3>${safe(s[0])}</h3><p>${safe(s[1]||"No verified information is currently recorded. This is an explicit research gap, not a positive or negative finding.")}</p></section>`;
 const sources=(x.sources||[]).map(s=>link(s[1],s[0])).join(" · ")||"Source links are being verified.";
 const quick=sections.slice(0,3).map(block).join("");
 const deeper=sections.slice(3).map(block).join("");
 $("#policy-detail").innerHTML=`<p class="eyebrow">Policy snapshot</p><h2>${safe(x.area)}</h2><div class="policy-detail-quick">${quick}</div><details class="detail-extra"><summary>Alternatives, international context and evidence gaps</summary>${deeper}<div class="perspective-grid"><section class="detail-block"><h3>Left-leaning perspective</h3><p>${safe(x.left_case||"No verified, area-specific argument recorded yet.")}</p></section><section class="detail-block"><h3>Right-leaning perspective</h3><p>${safe(x.right_case||"No verified, area-specific argument recorded yet.")}</p></section></div></details><details class="detail-extra"><summary>Sources and research limitations</summary><section class="detail-block"><h3>Primary and supporting sources</h3><p>${sources}</p></section><p class="meta">Provisional synthesis. The cited indicators support the stated conclusion only within their definitions, dates and limitations.</p></details>`;
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
 const query=$("#party-search")?.value.trim().toLowerCase()||"",party=$("#party-filter")?.value||"";
 const rows=state.positions.filter(x=>(!party||x.party===party)&&`${x.party} ${x.policy_area} ${x.position_summary} ${x.proposal_text} ${x.status}`.toLowerCase().includes(query));
 $("#party-list").innerHTML=rows.length?rows.map(x=>`<tr><th scope="row">${safe(x.party)}</th><td>${safe(x.policy_area)}</td><td>${safe(x.position_summary)}</td><td>${safe(x.proposal_text)}<p class="meta">Costing: ${safe(x.costing_source||"No costing source recorded")}</p></td><td>${safe(x.publication_date||"Date not stated")}<br><span class="meta">${safe(x.status||"Status not stated")}</span></td><td>${link(x.source_url,"Original source")}</td></tr>`).join(""):'<tr><td colspan="6">No party positions match those filters.</td></tr>';
 $("#party-count").textContent=`${rows.length} of ${state.positions.length} verified position records`;
}
function populatePartyFilter(){
 const select=$("#party-filter");if(!select)return;
 const parties=[...new Set(state.positions.map(x=>x.party))].sort();
 select.innerHTML='<option value="">All parties</option>'+parties.map(x=>`<option value="${safe(x)}">${safe(x)}</option>`).join("");
}
$("#policy-search").addEventListener("input",renderPolicies);$("#evidence-search").addEventListener("input",renderEvidence);$("#evidence-filter").addEventListener("change",renderEvidence);$("#status-filter").addEventListener("change",renderPromises);
$("#party-search").addEventListener("input",renderParties);$("#party-filter").addEventListener("change",renderParties);$("#manifesto-area").addEventListener("change",renderManifestos);$("#manifesto-search").addEventListener("input",renderManifestos);
load().catch(err=>{console.error(err);document.querySelectorAll(".loading").forEach(n=>n.textContent="Research data could not be loaded. Check that the data folder and four JSON files are published.");});

function renderManifestos(){
 const fields={housing:"Housing",health:"Health",economy:"Economy",climate:"Climate",immigration:"Immigration",education:"Education"};
 const key=$("#manifesto-area")?.value||"housing",query=$("#manifesto-search")?.value.trim().toLowerCase()||"";
 const rows=state.manifestos.filter(p=>p.party.toLowerCase().includes(query));
 $("#manifesto-list").innerHTML=rows.length?rows.map(p=>{
  const v=p.verification||{},pr=v.page_refs||{};
  return `<tr><th scope="row">${safe(p.party)}<span class="meta manifesto-subtitle">${safe(p.manifesto_title)} · ${safe(p.manifesto_year)}</span></th><td>${safe(p[key]||"No sufficiently verified summary recorded.")}</td><td>${safe(pr[key]||"Not verified")}</td><td>${safe(v.evidence_quality||p.status||"Not stated")}</td><td>${link(v.official||p.manifesto_source,"Open manifesto")}</td></tr>`;
 }).join(""):'<tr><td colspan="5">No parties match that search.</td></tr>';
 $("#manifesto-count").textContent=`${rows.length} of ${state.manifestos.length} manifestos · Showing ${fields[key]} positions`;
 const pct=v=>v===undefined?"Not modelled":(v>0?"+":"")+v.toFixed(1)+"%";
 $("#manifesto-pbo").innerHTML=state.manifestos.map(p=>{
  const pb=p.verification?.pbo||{};
  return `<article class="pbo-compare-row"><strong>${safe(p.party)}</strong><span>Poorest decile: ${pct(pb.poorest_decile_income_change_pct)}</span><span>Richest decile: ${pct(pb.richest_decile_income_change_pct)}</span><small>${safe(pb.summary||"No comparable PBO result recorded.")} ${safe(pb.caveat||"")}</small></article>`;
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
 const symbols={housing:"⌂",health:"✚",economy:"€",climate:"♧",immigration:"◎",education:"▤"};
 root.innerHTML=q.dimensions.map((d,i)=>`<fieldset class="alignment-question"><legend><span class="alignment-question-icon" aria-hidden="true">${symbols[d.id]||"◈"}</span><span class="alignment-question-heading"><small>QUESTION ${String(i+1).padStart(2,"0")} / ${String(q.dimensions.length).padStart(2,"0")}</small><strong>${safe(d.label)}</strong></span></legend><p>${safe(d.question)}</p><div class="alignment-options">${d.options.map(o=>`<label><input type="radio" name="align-${safe(d.id)}" value="${safe(o.id)}"><span>${safe(o.label)}</span></label>`).join("")}</div><label class="nonnegotiable-toggle"><input type="checkbox" class="alignment-redline" data-issue="${safe(d.id)}"><span><strong>Make this a deal-breaker</strong><small>Prioritise parties that match your choice exactly on this issue.</small></span></label></fieldset>`).join("");
 root.addEventListener("change",updateAlignmentProgress);
 $("#alignment-reset").addEventListener("click",()=>{root.querySelectorAll("input").forEach(x=>x.checked=false);$("#alignment-results").hidden=true;updateAlignmentProgress();});
 $("#alignment-submit").addEventListener("click",calculateAlignment);
 function updateAlignmentProgress(){
  const n=q.dimensions.filter(d=>root.querySelector(`input[name="align-${d.id}"]:checked`)).length;
  const pct=Math.round(n/q.dimensions.length*100);
  $("#alignment-progress").textContent=n+" of "+q.dimensions.length+" answered";
  $("#alignment-progress-percent").textContent=pct+"%";
  $("#alignment-progress-fill").style.width=pct+"%";
 }
 updateAlignmentProgress();
}
function calculateAlignment(){
 const q=state.questionnaire,root=$("#alignment-questions");
 const answers={},redlines=[];
 q.dimensions.forEach(d=>{
  const x=root.querySelector(`input[name="align-${d.id}"]:checked`);
  if(x)answers[d.id]=x.value;
  const hard=root.querySelector(`.alignment-redline[data-issue="${d.id}"]`);
  if(hard?.checked){
   if(!x){answers[d.id]=null;}
   else if(x.value==="unsure"){answers[d.id]="unsure";}
   redlines.push(d.id);
  }
 });
 if(!Object.keys(answers).some(k=>answers[k]&&answers[k]!=="unsure")){$("#alignment-validation").textContent="Answer at least one policy question with a definite preference before comparing.";return;}
 const adjacent={
 housing:{state:["mixed"],mixed:["state","market"],market:["mixed"]},
 health:{public:["reform"],reform:["public","choice"],choice:["reform"]},
 economy:{redistribute:["balance"],balance:["redistribute","enterprise"],enterprise:["balance"]},
 climate:{fast:["pragmatic"],pragmatic:["fast","cautious"],cautious:["pragmatic"]},
 immigration:{rights:["managed"],managed:["rights","strict"],strict:["managed"]},
 education:{inclusive:["capacity"],capacity:["inclusive","choice"],choice:["capacity"]}
 };
 const scored=Object.entries(q.party_codes).map(([party,code])=>{
  let score=0,max=0,matched=0,hardMet=0,hardMax=redlines.length,details=[];
  q.dimensions.forEach(d=>{
   const ans=answers[d.id];if(!ans||ans==="unsure")return;
   const w=d.weight||1;max+=2*w;const p=code[d.id];
   const pts=p===ans?2:(adjacent[d.id]?.[ans]||[]).includes(p)?1:0;
   score+=pts*w;if(pts)matched++;
   const hard=redlines.includes(d.id);if(hard&&p===ans)hardMet++;
   details.push({label:d.label,points:pts*w,hard,exact: p===ans});
  });
  const eligible=redlines.every(id=>answers[id]&&answers[id]!=="unsure"&&code[id]===answers[id]);
  return {party,score,max,matched,hardMet,hardMax,eligible,percent:max?Math.round(score/max*100):0,details};
 });
 const anyEligible=scored.some(x=>x.eligible);
 const results=scored.sort((x,y)=>{
  if(redlines.length&&anyEligible&&x.eligible!==y.eligible)return x.eligible?-1:1;
  if(redlines.length&&!anyEligible&&x.hardMet!==y.hardMet)return y.hardMet-x.hardMet;
  return y.percent-x.percent||y.score-x.score||x.party.localeCompare(y.party);
 });
 const top=results[0],topGroup=results.filter(x=>(redlines.length&&anyEligible?x.eligible===top.eligible:!anyEligible&&redlines.length?x.hardMet===top.hardMet:true)&&x.percent===top.percent);
 $("#alignment-results").hidden=false;
 $("#alignment-validation").textContent="";
 let summary="";
 if(redlines.length&&anyEligible)summary="Parties meeting every non-negotiable issue are shown first. Within that group, parties are ranked by their overall policy alignment.";
 else if(redlines.length)summary="No party in this simplified comparison matches every non-negotiable issue exactly. Parties are ranked first by how many of your non-negotiables they match, then by overall policy alignment. Consider this a prompt to inspect the underlying policies, not a reason to discard a party automatically.";
 else summary="Your answers produce the following broad policy-alignment ranking. This is a comparison aid, not a recommendation.";
 $("#alignment-summary").textContent=summary;
 $("#alignment-ranking").innerHTML=results.map((r,i)=>`<article class="alignment-result-row"><div><strong>${i+1}. ${safe(r.party)}</strong><small>${redlines.length?`${r.hardMet} of ${r.hardMax} non-negotiables met · `:""}${r.matched} answered issues with some alignment${redlines.length&&r.eligible?" · Meets all non-negotiables":""}</small></div><div class="alignment-score"><b>${r.percent}%</b><div class="alignment-track"><i style="width:${r.percent}%"></i></div></div></article>`).join("");
 const show=redlines.length?results.filter(r=>r.eligible===top.eligible&&(!anyEligible?r.hardMet===top.hardMet:true)&&r.percent===top.percent):topGroup;
 const answered=q.dimensions.filter(d=>answers[d.id]&&answers[d.id]!=="unsure");
 const optionLabel=(d)=>d.options.find(o=>o.id===answers[d.id])?.label||"Not answered";
 const publicLean=answered.filter(d=>({housing:"state",health:"public",economy:"redistribute"}[d.id]===answers[d.id])).length;
 const marketLean=answered.filter(d=>({housing:"market",health:"choice",economy:"enterprise"}[d.id]===answers[d.id])).length;
 const greenLean=answers.climate==="fast", rightsLean=answers.immigration==="rights";
 let profile="A mixed-policy pragmatist",profileText="Your answers draw on more than one policy tradition. You appear to favour a question-by-question approach rather than one consistent ideological package.";
 if(publicLean>=2&&publicLean>marketLean){profile="Public-services first";profileText="Your strongest recurring theme is a larger role for public provision, redistribution or direct State action.";}
 else if(marketLean>=2&&marketLean>publicLean){profile="Enterprise and choice";profileText="Your strongest recurring theme is a greater role for private provision, market incentives or lower tax burdens.";}
 else if(greenLean&&rightsLean){profile="Green-minded internationalist";profileText="Your answers combine faster climate action with a rights-focused approach to immigration and asylum.";}
 else if(answers.climate==="cautious"&&answers.immigration==="strict"){profile="Cautious-change combination";profileText="Your answers favour a more cautious approach on climate targets and tighter migration controls.";}
 const historical=marketLean>publicLean
  ? {name:"Margaret Thatcher",years:"UK Prime Minister, 1979–1990",image:"https://upload.wikimedia.org/wikipedia/commons/3/3a/Margaret_Thatcher_cropped2.png",alt:"Portrait of Margaret Thatcher",theme:"Market-oriented economic policy",description:"A historical reference point for your answers favouring enterprise, market mechanisms and a smaller direct role for the State in parts of the economy. Thatcher's governments pursued privatisation, deregulation, tax cuts and trade-union reform; they also introduced the Right to Buy scheme.",source:"https://www.gov.uk/government/history/past-prime-ministers/margaret-thatcher",sourceLabel:"UK Government biography",credit:"Portrait: Wikimedia Commons · Margaret Thatcher cropped2.png"}
  : publicLean>marketLean
  ? {name:"Nelson Mandela",years:"President of South Africa, 1994–1999",image:"https://commons.wikimedia.org/wiki/Special:FilePath/Nelson_Mandela.jpg",alt:"Portrait of Nelson Mandela",theme:"Equality, public inclusion and addressing entrenched deprivation",description:"A historical reference point for your answers' emphasis on equality, public inclusion and the State's role in addressing deep-rooted disadvantage. Mandela's public legacy centred on the transition from apartheid to democracy, political equality and national reconciliation; this is a broad civic and social reference, not a claim that he represents a specific economic programme.",source:"https://www.gov.za/mandela100/biography",sourceLabel:"South African Government biography",credit:"Portrait: White House Photograph Office, via Wikimedia Commons (public domain in the United States)"}
  : null;
 const historicalText=historical?historical.name+" — historical policy reference for "+historical.theme+". This is not a claim that you share the person's full politics or record.": "Your answers do not point clearly to one of these two economic traditions. The results show elements of both public provision and market-led approaches; no single historical figure is assigned.";
 const topDetails=top.details;
 const strongest=topDetails.filter(d=>d.points>0).sort((x,y)=>y.points-x.points)[0];
 const weakest=topDetails.slice().sort((x,y)=>x.points-y.points)[0];
 const redlineText=redlines.length?(anyEligible?redlines.length+" non-negotiable issue(s) have at least one exact-match party.":"No party matches all "+redlines.length+" non-negotiable issue(s) exactly."):"You did not set any non-negotiable issues.";
 const mismatch=weakest?weakest.label:"No issue-level comparison available";
 const banter=strongest&&weakest&&strongest.label!==weakest.label
  ? `Your strongest overlap is ${strongest.label.toLowerCase()}, while ${weakest.label.toLowerCase()} is where the policy conversation gets lively. Coalition talks may need an extra pot of tea.`
  : "Your answers are unusually consistent across the issues you completed. The coalition negotiators can have a slightly shorter tea break.";
 const resultText=[ "Irish Policy Monitor — my policy-alignment snapshot", "Policy mix: "+profile, profileText, "Historical policy reference: "+historicalText, "Closest broad match in this comparison: "+top.party+" ("+top.percent+"%)", "Best overlap: "+(strongest?.label||"Not available"), "Biggest gap: "+mismatch, redlineText, "Based on simplified categories in the parties' 2024 manifesto summaries; not a voting recommendation." ].join("\\n");
 $("#alignment-detail").innerHTML=`
 <div class="alignment-insight-grid">
  <section class="alignment-profile"><span class="insight-kicker">Your policy mix</span><h4>${safe(profile)}</h4><p>${safe(profileText)}</p><p class="meta">${answered.length} of ${q.dimensions.length} issues answered</p></section>
  <section><span class="insight-kicker">Your report card</span><ul class="alignment-report"><li><b>Closest broad match</b><span>${safe(top.party)} · ${top.percent}%</span></li><li><b>Strongest overlap</b><span>${safe(strongest?.label||"Not available")}</span></li><li><b>Biggest gap</b><span>${safe(mismatch)}</span></li><li><b>Non-negotiables</b><span>${safe(redlineText)}</span></li></ul></section>
 </div>
 <section class="alignment-history"><span class="insight-kicker">Historical policy reference</span>
  ${historical? `<div class="history-person"><img src="${historical.image}" alt="${safe(historical.alt)}" loading="lazy"><div><h4>${safe(historical.name)}</h4><p class="history-years">${safe(historical.years)}</p><b>${safe(historical.theme)}</b><p>${safe(historical.description)}</p><a href="${safe(historical.source)}" target="_blank" rel="noopener noreferrer">${safe(historical.sourceLabel)} ↗</a><small>${safe(historical.credit)}</small></div></div>` : `<div class="history-person history-balanced"><div><h4>No single historical figure selected</h4><p>Your answers combine public-service and market-oriented preferences. Rather than force a match, this result points to two contrasting historical policy traditions.</p></div></div><div class="history-duo"><article><img src="https://commons.wikimedia.org/wiki/Special:FilePath/Nelson_Mandela.jpg" alt="Portrait of Nelson Mandela" loading="lazy"><b>Nelson Mandela</b><small>Equality and public inclusion</small><a href="https://www.gov.za/mandela100/biography" target="_blank" rel="noopener noreferrer">Biography ↗</a></article><article><img src="https://upload.wikimedia.org/wikipedia/commons/3/3a/Margaret_Thatcher_cropped2.png" alt="Portrait of Margaret Thatcher" loading="lazy"><b>Margaret Thatcher</b><small>Market mechanisms and privatisation</small><a href="https://www.gov.uk/government/history/past-prime-ministers/margaret-thatcher" target="_blank" rel="noopener noreferrer">Biography ↗</a></article></div>`}
  <p class="history-caveat">This is an illustrative comparison of broad social and civic themes—not a personality match, endorsement, political identity, or claim that these figures represent equivalent economic programmes. Their lives and policies arose in very different national and historical circumstances.</p>
 </section>
 <section class="alignment-fingerprint"><h4>Your policy fingerprint</h4><div class="fingerprint-list">${answered.map(d=>`<div><b>${safe(d.label)}</b><span>${safe(optionLabel(d))}</span></div>`).join("")}</div></section>
 <section class="alignment-banter"><span class="insight-kicker">Coalition tea-break forecast</span><p>${safe(banter)}</p><small>A bit of fun, generated from your answers — not a prediction about actual coalition negotiations.</small></section>
 <section class="alignment-party-detail">${show.map(r=>`<div><h4>${safe(r.party)} — issue-by-issue</h4><ul>${r.details.map(d=>`<li>${safe(d.label)}: ${d.hard?(d.exact?"Non-negotiable met":"Non-negotiable not met"):d.points===0?"No broad match":d.points%2===0?"Strong broad match":"Partial broad match"}</li>`).join("")}</ul><p class="meta">A category match reflects the questionnaire's simplified coding, not a full reading of every party proposal.</p></div>`).join("")}</section>
 <div class="alignment-share"><button type="button" id="alignment-copy" class="alignment-reset">Copy my results summary</button><span id="alignment-copy-status" role="status"></span></div>`;
 $("#alignment-copy").addEventListener("click",async()=>{const status=$("#alignment-copy-status");try{await navigator.clipboard.writeText(resultText);status.textContent="Copied — ready to share.";}catch(e){status.textContent="Copy unavailable in this browser. You can select the results text manually."; }});
 $("#alignment-results").scrollIntoView({behavior:"smooth",block:"start"});
}

function renderExecutiveDashboard(){
 const node=$("#executive-summary");if(!node)return;
 const counts=state.commitments.reduce((o,x)=>(o[x.status]=(o[x.status]||0)+1,o),{});
 const total=state.commitments.length,progress=counts.in_progress||0,unverified=counts.not_verifiable||0;
 const p=node.querySelector(".executive-commitments h3");
 if(p)p.textContent=`${progress} of ${total} commitments show recorded progress`;
 const note=node.querySelector(".executive-commitments p");
 if(note)note.textContent=`${unverified} remain marked “not yet verifiable” in the current extracted register. This is a limitation of verified commitment-level evidence, not proof that those commitments have not been acted on. ${counts.delivered||0} are marked delivered in this register snapshot.`;
 const donut=node.querySelector(".executive-donut strong");
 if(donut)donut.textContent=total?`${(progress/total*100).toFixed(1)}%`:"—";
 const label=node.querySelector(".executive-donut span");
 if(label)label.textContent="marked in progress";
}

(function(){
const root=document.getElementById("revolutionary-quiz-app");if(!root)return;
const questions=[
["What event took place in Dublin in April 1916?",["The Easter Rising","The Anglo-Irish Treaty","The foundation of the Free State","The Battle of the Boyne"],0,"The Easter Rising began on 24 April 1916."],
["Which building served as headquarters of the 1916 Rising?",["Dublin Castle","The General Post Office","Kilmainham Gaol","Four Courts"],1,"The GPO was the headquarters of the Rising."],
["Who was the principal author of the 1916 Proclamation?",["Michael Collins","James Connolly","Patrick Pearse","Arthur Griffith"],2,"Patrick Pearse was the principal author and read the Proclamation."],
["Which revolutionary was a socialist and co-founded the Irish Citizen Army?",["James Connolly","Éamon de Valera","Joseph Plunkett","Thomas Ashe"],0,"James Connolly was a socialist and labour organiser."],
["Who became the first woman elected to the British House of Commons?",["Hanna Sheehy-Skeffington","Constance Markievicz","Kathleen Clarke","Maud Gonne"],1,"Constance Markievicz was elected in 1918 but did not take her seat."],
["Which agreement did Michael Collins help negotiate in 1921?",["The Good Friday Agreement","The Anglo-Irish Treaty","The Act of Union","The Treaty of Versailles"],1,"Collins helped negotiate the 1921 Anglo-Irish Treaty."],
["What was one of Collins’s key roles during the War of Independence?",["Director of Intelligence","British Army commander","Archbishop of Dublin","President throughout the war"],0,"Collins served as Director of Intelligence and Minister for Finance."],
["Where was Michael Collins killed in August 1922?",["Dublin","Cork city","Béal na Bláth, County Cork","Kilmainham"],2,"Collins was killed at Béal na Bláth on 22 August 1922."]
];
const people=[
[0,1,"Thomas Ashe","1885–1917","Teacher, poet and revolutionary","Ashe took part in the 1916 Rising as commandant of the Fingal Battalion. He died in 1917 after being force-fed during a hunger strike in Mountjoy Prison.","https://commons.wikimedia.org/wiki/Special:FilePath/Thomas_Ashe.jpg","https://www.dib.ie/biography/ashe-thomas-a0254"],
[2,3,"Joseph Plunkett","1887–1916","Poet and Proclamation signatory","Plunkett was a poet, journalist and republican activist, one of the seven signatories of the 1916 Proclamation. He was executed in Kilmainham Gaol in May 1916.","https://commons.wikimedia.org/wiki/Special:FilePath/Joseph_Plunkett.jpg","https://www.dib.ie/biography/plunkett-joseph-mary-a7360"],
[4,5,"Constance Markievicz","1868–1927","Revolutionary, socialist and politician","Markievicz took part in the 1916 Rising, was elected to the House of Commons in 1918, and later served as Minister for Labour in the revolutionary Dáil.","https://commons.wikimedia.org/wiki/Special:FilePath/Countess_Markievicz.jpg","https://www.dib.ie/biography/markievicz-constance-georgine-a5464"],
[6,7,"James Connolly","1868–1916","Socialist, trade unionist and revolutionary","Connolly was a leading socialist and labour organiser, co-founded the Irish Citizen Army, took part in the Rising and was executed after the surrender.","https://commons.wikimedia.org/wiki/Special:FilePath/James_Connolly-2.2.jpg","https://www.dib.ie/biography/connolly-james-a1975"],
[8,8,"Michael Collins","1890–1922","Revolutionary leader and treaty negotiator","Collins was central to the struggle for Irish independence, serving as Director of Intelligence and Minister for Finance. He helped negotiate the 1921 Treaty and chaired the Provisional Government. He was killed at Béal na Bláth in August 1922.","https://commons.wikimedia.org/wiki/Special:FilePath/Michael_Collins.jpg","https://www.dib.ie/biography/collins-michael-a1835"]
];
let n=0,score=0,done=false;
const el=id=>root.querySelector("#rq-"+id),progress=el("progress"),scoreText=el("score"),fill=el("fill"),question=el("question"),options=el("options"),feedback=el("feedback"),next=el("next"),result=el("result");
function draw(){done=false;progress.textContent="Question "+(n+1)+" of 8";scoreText.textContent="Score: "+score;fill.style.width=(n/8*100)+"%";question.textContent=questions[n][0];options.innerHTML=questions[n][1].map((v,i)=>'<button type="button" class="revolutionary-quiz-option" data-i="'+i+'"><b>'+String.fromCharCode(65+i)+'</b>'+v+'</button>').join("");feedback.textContent="";next.disabled=true;next.textContent=n===7?"Reveal your result":"Next question";options.querySelectorAll("button").forEach(b=>b.addEventListener("click",()=>choose(Number(b.dataset.i))));}
function choose(i){if(done)return;done=true;const q=questions[n],ok=i===q[2];if(ok)score++;options.querySelectorAll("button").forEach((b,j)=>{b.disabled=true;if(j===q[2])b.classList.add("is-correct");if(j===i&&!ok)b.classList.add("is-wrong");});scoreText.textContent="Score: "+score;feedback.textContent=(ok?"Correct. ":"Not quite. ")+q[3];next.disabled=false;}
function finish(){const p=people.find(x=>score>=x[0]&&score<=x[1]);fill.style.width="100%";progress.textContent="Challenge complete";scoreText.textContent="Final score: "+score+" / 8";question.hidden=true;options.hidden=true;root.querySelector(".revolutionary-quiz-controls").hidden=true;result.hidden=false;result.innerHTML='<p class="eyebrow">Unlocked profile · '+score+' / 8</p><img src="'+p[6]+'" alt="Portrait of '+p[2]+'"><h3>'+p[2]+'</h3><b>'+p[3]+' · '+p[4]+'</b><p>'+p[5]+'</p><a href="'+p[7]+'" target="_blank" rel="noopener noreferrer">Read the Dictionary of Irish Biography ↗</a><button type="button" id="rq-restart">Play again</button>';result.querySelector("#rq-restart").addEventListener("click",()=>{n=0;score=0;question.hidden=false;options.hidden=false;root.querySelector(".revolutionary-quiz-controls").hidden=false;result.hidden=true;draw();});}
next.addEventListener("click",()=>{if(n===7)finish();else{n++;draw();}});draw();
})();