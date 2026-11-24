#!/usr/bin/env python3
"""Check official Wicklow project source pages and publish change-detection metadata.
This detects source-page changes; it does not infer construction completion or alter editorial statuses.
"""
import hashlib, html, json, os, re, urllib.request
from datetime import datetime, timezone
from html.parser import HTMLParser
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/"data"/"wicklow-monitor.json"
NOW=datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00","Z")
SOURCES=[
 {"id":"dart-wicklow","project":"DART extension to Wicklow Town","authority":"Iarnród Éireann / NTA","url":"https://www.dartplus.ie/en-ie/news/design-build-tender-to-deliver-dart-services-to-wicklow-issued","status":"Charging infrastructure procurement; project approvals remain outstanding","status_as_of":"2026-08-26"},
 {"id":"wicklow-active-travel","project":"Wicklow County active-travel programme","authority":"Wicklow County Council / NTA","url":"https://www.wicklow.ie/Active-Travel","status":"2026 allocations and phase-by-phase project register published","status_as_of":"2026-11-24"},
 {"id":"wicklow-greenway","project":"Wicklow–Greystones Greenway","authority":"Wicklow County Council / TII","url":"https://wicklowgreenways.ie/blessington-lakes-egreenway1/greystones-to-wicklow","status":"Options selection; route consultation completed, next approvals to verify","status_as_of":"2026-11-24"},
 {"id":"arklow-shillelagh","project":"Arklow–Shillelagh Greenway","authority":"Wicklow County Council / TII","url":"https://wicklowgreenways.ie/blessington-lakes-egreenway1/arklow-to-shillelagh","status":"Design and environmental evaluation; €300,000 2026 allocation reported","status_as_of":"2026-11-24"},
 {"id":"blessington-egreenway","project":"Blessington eGreenway","authority":"Wicklow County Council","url":"https://www.wicklow.ie/Portals/0/adam/Documents/sMwcWzUDhUq5X9FrUUZtig/Link/Chief%20Executive%20Report%20-%20October%202026.pdf","status":"Paused: planning refusal in 2024; October 2026 council report says no current resources for revised submission","status_as_of":"2026-10-31"},
 {"id":"eirgrid-wicklow","project":"Powering Up Wicklow / North Wicklow Reinforcement","authority":"EirGrid","url":"https://www.eirgrid.ie/wicklow","status":"North Wicklow project at Step 3; public consultation listed for 20 October–11 December 2026","status_as_of":"2026-11-24"},
 {"id":"wicklow-town-wastewater","project":"Wicklow Town wastewater network upgrade","authority":"Uisce Éireann","url":"https://www.water.ie/news/eur59-million-wastewater-upgrade-commence-wicklow-town","status":"€5.9m upgrade announced; works commenced June 2026; latest completion position to verify","status_as_of":"2026-06-02"},
 {"id":"avoca-wastewater","project":"Avoca wastewater treatment plant","authority":"Uisce Éireann","url":"https://www.arklowwastewater.ie/projects/local-projects/avoca-sewerage-scheme","status":"In progress; published project page targets completion in 2027","status_as_of":"2026-11-24"},
]
class Text(HTMLParser):
 def __init__(self): super().__init__(); self.parts=[]; self.skip=0
 def handle_starttag(self,t,a):
  if t in ("script","style","noscript","svg"): self.skip+=1
 def handle_endtag(self,t):
  if t in ("script","style","noscript","svg") and self.skip: self.skip-=1
 def handle_data(self,d):
  if not self.skip:
   x=re.sub(r"\s+"," ",html.unescape(d)).strip()
   if x:self.parts.append(x)
def fetch(src):
 req=urllib.request.Request(src["url"],headers={"User-Agent":"IrishPolicyMonitor/1.0 (+https://johnmctwelve-creator.github.io/Irish-policy-monitor/; civic project source monitor)","Accept":"text/html,application/xhtml+xml,application/pdf,*/*"})
 with urllib.request.urlopen(req,timeout=35) as r:
  raw=r.read(2_500_000); ctype=r.headers.get("Content-Type","")
  if "pdf" in ctype or src["url"].lower().endswith(".pdf"):
   return {"ok":True,"hash":hashlib.sha256(raw).hexdigest(),"title":"PDF source (content fingerprinted)","excerpt":"PDF source checked; automated text extraction is not enabled for this monitor."}
  parser=Text(); parser.feed(raw.decode(r.headers.get_content_charset() or "utf-8",errors="replace"))
  text=" ".join(parser.parts)
  title=next((x for x in parser.parts if len(x)>8),src["project"])
  return {"ok":True,"hash":hashlib.sha256(text.encode()).hexdigest(),"title":title[:180],"excerpt":text[:500]}
def main():
 old=json.loads(OUT.read_text()) if OUT.exists() else {"sources":[],"events":[]}
 previous={x["id"]:x for x in old.get("sources",[])}
 current=[]; events=list(old.get("events",[])); failed=0
 for src in SOURCES:
  prior=previous.get(src["id"],{})
  try:
   result=fetch(src); changed=bool(prior.get("content_hash") and prior["content_hash"]!=result["hash"])
   item={**src,"checked_at":NOW,"check":"ok","content_hash":result["hash"],"page_title":result["title"],"excerpt":result["excerpt"],"changed":changed,"last_changed_at":NOW if changed else prior.get("last_changed_at")}
   if changed:
    events.insert(0,{"source_id":src["id"],"project":src["project"],"authority":src["authority"],"detected_at":NOW,"kind":"source_page_changed","message":"The linked official source page has changed since the previous successful check. Review the source before changing the project status.","url":src["url"]})
  except Exception as e:
   failed+=1
   item={**src,"checked_at":NOW,"check":"failed","error":str(e)[:220],"content_hash":prior.get("content_hash"),"page_title":prior.get("page_title"),"excerpt":prior.get("excerpt"),"changed":False,"last_changed_at":prior.get("last_changed_at")}
  current.append(item)
 events=events[:40]
 payload={"updated_at":NOW,"schedule":"Daily automated source-page check via GitHub Actions","summary":{"sources_monitored":len(current),"checks_succeeded":len(current)-failed,"checks_failed":failed,"changes_detected_in_this_run":sum(1 for x in current if x["changed"])},"sources":current,"events":events,"method_note":"Automated monitoring checks official source availability and detects page-content changes. A changed page is a review alert, not an automatically verified change in project stage. Project status labels remain editorially maintained and must be checked against dated source records."}
 OUT.parent.mkdir(exist_ok=True); OUT.write_text(json.dumps(payload,ensure_ascii=False,indent=2)+"\n")
 print(json.dumps(payload["summary"]))
if __name__=="__main__": main()
