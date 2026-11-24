document.addEventListener("DOMContentLoaded",function(){
const areas={
"arklow":{name:"Arklow",district:"Arklow Municipal District",population:"27,866",seats:6,places:"Arklow, Rathdrum, Avoca and Aughrim",note:"The south and south-east of the county.",map:"https://www.wicklow.ie/Living/Services/ElectorsRegister/Local-Elections"},
"baltinglass":{name:"Baltinglass",district:"Baltinglass Municipal District",population:"28,041",seats:6,places:"Baltinglass, Blessington, Dunlavin, Carnew and Tinahely",note:"West and south-west Wicklow, including a large rural area.",map:"https://www.wicklow.ie/Living/Services/ElectorsRegister/Local-Elections"},
"bray-east":{name:"Bray East",district:"Bray Borough District",population:"17,728",seats:4,places:"Bray East electoral area",note:"The eastern local electoral area of Bray.",map:"https://www.wicklow.ie/Living/Services/ElectorsRegister/Local-Elections"},
"bray-west":{name:"Bray West",district:"Bray Borough District",population:"19,144",seats:4,places:"Bray West, Enniskerry, Kilmacanogue and Powerscourt area",note:"The western local electoral area of Bray.",map:"https://www.wicklow.ie/Living/Services/ElectorsRegister/Local-Elections"},
"greystones":{name:"Greystones",district:"Greystones Municipal District",population:"30,479",seats:6,places:"Greystones, Delgany, Kilcoole and Newcastle",note:"North-east coastal Wicklow, south of Bray.",map:"https://www.wicklow.ie/Living/Services/ElectorsRegister/Local-Elections"},
"wicklow":{name:"Wicklow",district:"Wicklow Municipal District",population:"32,593",seats:6,places:"Wicklow Town, Rathnew, Ashford and surrounding communities",note:"Central and east-coast Wicklow.",map:"https://www.wicklow.ie/Living/Services/ElectorsRegister/Local-Elections"}
};
const area=document.getElementById("wicklow-area-select"),info=document.getElementById("wicklow-area-info");
if(area&&info){area.addEventListener("change",()=>{const a=areas[area.value];if(!a){info.innerHTML="<p>Choose an area to view its population, council representation and local links.</p>";return;}info.innerHTML="<h4>"+a.name+" Local Electoral Area</h4><p>"+a.note+"</p><div class='wicklow-area-facts'><div><strong>"+a.population+"</strong><span>Population · 2022</span></div><div><strong>"+a.seats+"</strong><span>Council seats</span></div></div><p><b>Local district:</b> "+a.district+"</p><p><b>Places covered:</b> "+a.places+"</p><p><a href='https://www.wicklow.ie/Living/Your-Council/Your-Councillors/Elected-Council-Members' target='_blank' rel='noopener'>Find councillors for "+a.name+" ↗</a></p><p><a href='"+a.map+"' target='_blank' rel='noopener'>Check the official area map and election information ↗</a></p>";});}


const filter=document.getElementById("wicklow-consult-filter"),list=document.getElementById("wicklow-consult-list");
let consultationItems=[];
function renderConsultations(){if(!list)return;const selected=filter?filter.value:"all";const items=consultationItems.filter(x=>selected==="all"||x.topic===selected);if(!items.length){list.innerHTML='<p class="wicklow-empty">No currently open consultations found in the connected feeds for this topic. Check the official portals below for full listings.</p>';return;}list.innerHTML=items.map(x=>'<article data-topic="'+x.topic+'"><span class="wicklow-type">'+x.authority+' · '+x.topicLabel+'</span><h4>'+x.title+'</h4><p>'+(x.deadline?'Closes: '+x.deadline:'Deadline not extracted — verify on source')+'</p><p class="wicklow-feed-source">Source: '+x.source+'</p><a href="'+x.url+'" target="_blank" rel="noopener">View official notice / consultation ↗</a></article>').join("");}
if(filter)filter.addEventListener("change",renderConsultations);
fetch("data/consultations.json?v="+Date.now()).then(r=>{if(!r.ok)throw Error("feed unavailable");return r.json();}).then(data=>{consultationItems=(data.items||[]).filter(x=>x.url&&x.title);renderConsultations();const caveat=document.querySelector(".wicklow-live-caveat");if(caveat&&data.updated_at)caveat.textContent="Last automated refresh: "+new Date(data.updated_at).toLocaleString("en-IE",{dateStyle:"medium",timeStyle:"short"})+". "+(data.coverage_note||"Deadlines are extracted from source pages; verify details before submitting.");}).catch(()=>{if(list)list.innerHTML='<p class="wicklow-empty">The live feed is temporarily unavailable. Use the official Wicklow and national consultation portals linked above.</p>';});

const form=document.getElementById("wicklow-idea-form");if(form)form.addEventListener("submit",function(e){e.preventDefault();const v=id=>document.getElementById(id).value.trim();const subject="Local policy idea — "+v("wicklow-idea-topic")+" — "+v("wicklow-idea-area");const body="LOCAL POLICY IDEA\n\nArea: "+v("wicklow-idea-area")+"\nPolicy area: "+v("wicklow-idea-topic")+"\nProblem: "+v("wicklow-idea-problem")+"\nSuggested change: "+v("wicklow-idea-proposal")+"\nSuggested lead: "+v("wicklow-idea-owner");const out=document.getElementById("wicklow-idea-feedback");out.textContent="Your idea summary is ready below. Copy it and send it to the relevant representative or consultation.";let pre=document.getElementById("wicklow-idea-preview");if(!pre){pre=document.createElement("pre");pre.id="wicklow-idea-preview";pre.style.cssText="white-space:pre-wrap;background:#f1f6f1;padding:12px;border-radius:8px;font-size:11px;margin-top:12px";form.appendChild(pre);}pre.textContent=subject+"\n\n"+body;let btn=document.getElementById("wicklow-idea-copy");if(!btn){btn=document.createElement("button");btn.type="button";btn.id="wicklow-idea-copy";btn.textContent="Copy idea summary";form.appendChild(btn);}btn.onclick=()=>{if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(pre.textContent).then(()=>out.textContent="Copied. Paste into your email or consultation submission.");};});
/* Daily source-change monitor: source-page changes are review alerts, never automatic status changes. */
const monitor=document.getElementById("wicklow-source-monitor");
if(monitor){
 const summary=document.getElementById("wicklow-monitor-summary");
 const events=document.getElementById("wicklow-monitor-events");
 const foot=document.getElementById("wicklow-monitor-foot");
 const state=monitor.querySelector(".wicklow-monitor-state");
 const esc=s=>String(s??"").replace(/[&<>"]/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[ch]));
 fetch("data/wicklow-monitor.json?v="+Date.now(),{cache:"no-store"})
 .then(r=>{if(!r.ok)throw Error("monitor data unavailable");return r.json();})
 .then(data=>{
  const n=data.summary||{},sources=Array.isArray(data.sources)?data.sources:[];
  const ok=n.checks_succeeded||0,total=n.sources_monitored||sources.length,failed=n.checks_failed||0;
  state.textContent=ok?"Daily checks active":"Awaiting first check";
  state.classList.toggle("is-active",ok>0);
  summary.innerHTML='<div><strong>'+esc(ok)+'/'+esc(total)+'</strong><span>Official sources checked successfully</span></div><div><strong>'+esc(failed)+'</strong><span>Sources temporarily unavailable</span></div><div><strong>'+esc(n.changes_detected_in_this_run||0)+'</strong><span>Changes detected in latest run</span></div>';
  const sourceRows=sources.map(x=>'<article><b>'+esc(x.project)+'</b><p>'+esc(x.status)+'</p><small>'+esc(x.authority)+' · Last editorial status: '+esc(x.status_as_of||"date not stated")+(x.check==="ok"?" · Source checked "+esc(x.checked_at):" · Automated check pending")+'</small><p><a href="'+esc(x.url)+'" target="_blank" rel="noopener">Open official source ↗</a></p></article>').join("");
  const alerts=(data.events||[]).slice(0,5);
  events.innerHTML=sourceRows+(alerts.length?'<h5>Recent source-change alerts · review required</h5>'+alerts.map(e=>'<article><time>'+esc(e.detected_at||"")+'</time><b>'+esc(e.project||"Project update")+'</b><p>'+esc(e.message||"Official source page changed. Review before updating status.")+'</p><a href="'+esc(e.url||"#")+'" target="_blank" rel="noopener">Review official source ↗</a></article>').join(""):'<p class="wicklow-monitor-empty">No source-page changes have been flagged yet. This does not mean there have been no project developments.</p>');
  const last=data.updated_at?new Date(data.updated_at).toLocaleString("en-IE",{dateStyle:"medium",timeStyle:"short",timeZone:"Europe/Dublin"}):"Not yet run";
  foot.textContent="Last automated check: "+last+". "+(data.method_note||"Page changes require editorial review; statuses are not updated automatically.");
 })
 .catch(()=>{state.textContent="Monitor awaiting first run";summary.innerHTML="<span>Automated source checks will appear here after the first successful scheduled run.</span>";events.innerHTML="";foot.textContent="The manually verified project register remains available above. Automated monitoring does not yet have a completed check to display.";});
}

});