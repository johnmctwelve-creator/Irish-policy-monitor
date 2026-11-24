document.addEventListener("DOMContentLoaded",function(){
const panel=document.getElementById("ipm-guide-panel"),launch=document.getElementById("ipm-guide-launch"),close=document.getElementById("ipm-guide-close"),search=document.getElementById("ipm-guide-search"),results=document.getElementById("ipm-guide-results"),shortcuts=document.getElementById("ipm-guide-shortcuts"),clear=document.getElementById("ipm-guide-search-clear"),progress=document.getElementById("ipm-reading-progress-fill"),topBtn=document.getElementById("ipm-back-top");
function setOpen(open){if(!panel||!launch)return;panel.hidden=!open;launch.setAttribute("aria-expanded",String(open));launch.querySelector("span:last-child").textContent=open?"Close guide":"Ask Civic Guide";if(open&&search)search.focus();}
if(launch)launch.addEventListener("click",()=>setOpen(panel.hidden));if(close)close.addEventListener("click",()=>setOpen(false));
// Every guide destination closes the panel, updates the URL and brings the requested section into view.
if(panel)panel.addEventListener("click",function(e){
 const link=e.target.closest('a[href^="#"]');if(!link)return;
 const id=decodeURIComponent(link.getAttribute("href").slice(1));
 const target=document.getElementById(id);if(!target)return;
 e.preventDefault();setOpen(false);
 if(search){search.value="";render();}
 if(shortcuts)shortcuts.hidden=false;
 if(location.hash!=="#"+id)history.pushState(null,"","#"+id);
 target.scrollIntoView({behavior:"smooth",block:"start"});
 target.classList.add("ipm-guide-destination");
 window.setTimeout(()=>target.classList.remove("ipm-guide-destination"),1800);
});
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&panel&&!panel.hidden)setOpen(false);});
const entries=[
["At a glance","National overview of Government performance and progress.","executive-summary","government performance progress national snapshot"],
["Policy areas","Explore housing, health, education, climate, transport and other policy topics.","explore","policy housing health education climate transport justice economy"],
["Evidence library","Read the evidence, sources and supporting research.","evidence","evidence sources research data reports"],
["Party positions","Compare political party positions on policy issues.","parties","parties party positions politics"],
["Manifestos","Explore party manifesto commitments and proposals.","manifestos","manifesto election proposals parties"],
["Promises tracker","Follow Government commitments and what has happened to them.","promises","promises commitments government accountability delivery"],
["Affordability and feasibility","Explore policy costs, funding and feasibility.","feasibility","cost affordability funding feasible"],
["Fiscal model","Explore the public finance model and scenarios.","fiscal-model","budget tax spending fiscal finance"],
["Take action","Find practical ways to participate in public life.","civic-action","action participate contact representatives civic"],
["Wicklow Civic Hub","Find local information, council services and local civic tools.","wicklow-civic-hub","wicklow county local council councillors local authority pothole"],
["Consultations","Find public consultations and ways to make submissions.","wicklow-consultations","consultation submission have your say"],
["Local issue reporting","Find the right local government service for a community issue.","wicklow-local-services","report roads potholes litter planning housing local service"],
["Campaigns and movements","Explore campaigns and civic movements.","campaigns","campaign movements organise"],
["1916 Proclamation","Read the historical Proclamation and its context.","proclamation-1916","1916 proclamation history"],
["Find your policy match","Explore the policy priorities that matter to you.","policy-match","quiz policy match priorities"],
["Which revolutionary are you?","Try the Irish history personality quiz.","revolutionary-quiz","revolutionary quiz history"],\n["ESRI & Census trends to 2050","Explore population trends, ageing and the 2050 demographic outlook.","demographic-trends","ESRI census population projections 2050 ageing migration housing"]
];
function render(){if(!search||!results)return;const q=search.value.trim().toLowerCase();if(!q){results.innerHTML="";if(shortcuts)shortcuts.hidden=false;return;}if(shortcuts)shortcuts.hidden=true;const words=q.split(/\s+/).filter(Boolean);const found=entries.map(e=>({e,score:words.reduce((n,w)=>n+((e[0]+" "+e[1]+" "+e[3]).toLowerCase().includes(w)?1:0),0)})).filter(x=>x.score>0).sort((a,b)=>b.score-a.score).slice(0,7);results.innerHTML=found.length?found.map(x=>'<a class="ipm-guide-result" href="#'+x.e[2]+'"><strong>'+x.e[0]+'</strong><small>'+x.e[1]+'</small></a>').join(""):'<div class="ipm-guide-empty">No matching section found. Try a broader term such as housing, evidence, Wicklow or consultation.</div>';results.querySelectorAll("a").forEach(a=>a.addEventListener("click",()=>setOpen(false)));}
if(search)search.addEventListener("input",render);if(clear)clear.addEventListener("click",()=>{search.value="";render();search.focus();});
if(progress||topBtn){const update=()=>{const max=document.documentElement.scrollHeight-window.innerHeight;const pct=max>0?Math.min(100,Math.max(0,window.scrollY/max*100)):0;if(progress)progress.style.width=pct+"%";if(topBtn)topBtn.classList.toggle("is-visible",window.scrollY>500);};window.addEventListener("scroll",update,{passive:true});window.addEventListener("resize",update);update();}
if(topBtn)topBtn.addEventListener("click",()=>window.scrollTo({top:0,behavior:"smooth"}));
});
