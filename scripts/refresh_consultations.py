#!/usr/bin/env python3
"""Refresh public consultation listings from published public web pages.

The Wicklow Council hub is the primary feed. MapAlerter is a secondary
aggregator and explicitly does not cover every Irish local authority.
"""
from html.parser import HTMLParser
from urllib.request import Request, urlopen
from datetime import datetime, date, timezone
from urllib.parse import urljoin
import json, os, re

SOURCES = [
    ("Wicklow County Council", "https://www.wicklow.ie/Living/ConsultationHub", "wicklow"),
    ("MapAlerter participating councils", "https://www.mapalerter.ie/search/public-consultations", "national"),
]
TODAY = date.today()

class Links(HTMLParser):
    def __init__(self):
        super().__init__(); self.items=[]; self.href=None; self.text=[]
    def handle_starttag(self, tag, attrs):
        if tag == "a":
            self.href = dict(attrs).get("href"); self.text=[]
    def handle_data(self, data):
        if self.href is not None: self.text.append(data)
    def handle_endtag(self, tag):
        if tag == "a" and self.href is not None:
            title = re.sub(r"\\s+", " ", " ".join(self.text)).strip()
            if title: self.items.append((self.href, title))
            self.href=None; self.text=[]

def fetch(url):
    req=Request(url, headers={"User-Agent":"IrishPolicyMonitor/1.0 (public consultation index; contact via project repository)"})
    with urlopen(req, timeout=30) as response:
        return response.read().decode("utf-8", "replace")

def parse_deadline(text):
    patterns = [
        r"(?:closing date|closes|deadline(?: for submissions)?|submissions? (?:must be received|by)|before)\\s*[:,-]?\\s*(?:at\\s*)?(\\d{1,2}(?:st|nd|rd|th)?\\s+[A-Za-z]+\\s+20\\d{2})",
        r"(\\d{1,2}[/-]\\d{1,2}[/-]20\\d{2})",
        r"(\\d{4}-\\d{2}-\\d{2})",
    ]
    for pattern in patterns:
        m=re.search(pattern,text,re.I)
        if m:
            raw=re.sub(r"(?<=\\d)(st|nd|rd|th)\\b","",m.group(1),flags=re.I)
            for fmt in ("%d %B %Y","%d %b %Y","%d/%m/%Y","%d-%m-%Y","%Y-%m-%d"):
                try: return datetime.strptime(raw,fmt).date()
                except ValueError: pass
    return None

def collect(source_name, url, source_type):
    html=fetch(url); parser=Links(); parser.feed(html)
    output=[]
    # Parse only links from the current open-consultations portion of Wicklow's page.
    if source_type=="wicklow":
        lower=html.lower()
        cut=min([x for x in [lower.find("consultations closed"), lower.find("closed consultations")] if x>=0] or [len(html)])
        open_html=html[:cut]; parser=Links(); parser.feed(open_html)
    for href,title in parser.items:
        full=urljoin(url,href)
        if full.rstrip("/") == url.rstrip("/") or full.startswith("mailto:") or full.startswith("javascript:"): continue
        if len(title)<8 or title.lower() in {"view more","read more","here","click here"}: continue
        if any(x in title.lower() for x in ["privacy policy","accessibility","cookie policy","contact us","home"]): continue
        deadline=parse_deadline(title)
        # Wicklow open area can include links with no date. Retain but clearly label unknown.
        if deadline and deadline < TODAY: continue
        if source_type=="national":
            # Aggregator explicitly says councils absent from its filter are not covered.
            if not any(name in title.lower() for name in ["consultation","survey","plan","scheme","variation","development","public","part 8","part xi"]): continue
        output.append({
            "title": title[:240], "url": full,
            "authority": "Wicklow County Council" if source_type=="wicklow" else "Participating local authority (verify source)",
            "topic": classify(title), "topicLabel": classify(title).replace("_"," ").title(),
            "deadline": deadline.isoformat() if deadline else None,
            "source": source_name, "source_url": url,
        })
    return output

def classify(title):
    t=title.lower()
    if any(x in t for x in ["road","traffic","cycle","transport","bus","greenway","pedestrian"]): return "transport"
    if any(x in t for x in ["climate","biodiversity","environment","waste","litter","water","flood","noise"]): return "environment"
    if any(x in t for x in ["housing","planning","development","zoning","part 8","part xi","area plan","county development"]): return "planning"
    return "community"

items=[]; source_status=[]
for name,url,kind in SOURCES:
    try:
        found=collect(name,url,kind)
        items.extend(found)
        source_status.append({"name":name,"url":url,"ok":True,"items":len(found)})
    except Exception as exc:
        source_status.append({"name":name,"url":url,"ok":False,"error":str(exc)[:250],"items":0})

# Deduplicate by normalized title and canonical URL.
seen=set(); unique=[]
for item in items:
    key=(re.sub(r"\\W+","",item["title"].lower()),item["url"].split("?")[0])
    if key not in seen: seen.add(key); unique.append(item)
unique.sort(key=lambda x:(x["deadline"] is None, x["deadline"] or "9999-12-31", x["authority"], x["title"]))
payload={
 "updated_at":datetime.now(timezone.utc).isoformat(),
 "items":unique,
 "sources":source_status,
 "coverage_note":"Wicklow is fetched directly from its official consultation hub. MapAlerter is a secondary aggregator for participating councils only; it states that councils not listed may not use the service. No aggregator listing is treated as a complete national register. Deadlines that cannot be parsed are marked unknown and must be verified at source.",
}
os.makedirs("data",exist_ok=True)
with open("data/consultations.json","w",encoding="utf-8") as f: json.dump(payload,f,ensure_ascii=False,indent=2)
print(json.dumps({"items":len(unique),"sources":source_status},ensure_ascii=False))
