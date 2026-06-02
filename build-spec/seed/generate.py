#!/usr/bin/env python3
"""Deterministic seed-data generator for the Unified P2P prototype (Meridian Consumer Health).
Re-runnable: byte-identical output every run. Emits build-spec/seed/data/<entity>.json.
Referentially consistent with the data dictionary + state machines; KPIs compute to defensible bands.
See _SEED-SPEC.md."""
import json, os, random, hashlib
from datetime import date, timedelta

SEED = 20260601
TODAY = date(2026, 6, 1)
rng = random.Random(SEED)
OUT = os.path.join(os.path.dirname(__file__), 'data')
os.makedirs(OUT, exist_ok=True)

def iso(d): return d.isoformat()
def days_ago(n): return TODAY - timedelta(days=n)
def pid(prefix, n, width=5): return f"{prefix}{str(n).zfill(width)}"
def write(name, rows):
    with open(os.path.join(OUT, f"{name}.json"), 'w') as f:
        json.dump(rows, f, indent=2, sort_keys=False)
    return len(rows)

DB = {}  # collects everything for the index + cross-refs

# ---------- MASTERS ----------
CURRENCIES = [
    {"isoCode":"USD","numericIsoCode":"840","symbol":"$","description":"US Dollar","isBase":True,"decimals":2},
    {"isoCode":"EUR","numericIsoCode":"978","symbol":"€","description":"Euro","isBase":False,"decimals":2},
    {"isoCode":"INR","numericIsoCode":"356","symbol":"₹","description":"Indian Rupee","isBase":False,"decimals":2},
    {"isoCode":"AED","numericIsoCode":"784","symbol":"د.إ","description":"UAE Dirham","isBase":False,"decimals":2},
    {"isoCode":"CHF","numericIsoCode":"756","symbol":"CHF","description":"Swiss Franc","isBase":False,"decimals":2},
    {"isoCode":"GBP","numericIsoCode":"826","symbol":"£","description":"Pound Sterling","isBase":False,"decimals":2},
    {"isoCode":"CNY","numericIsoCode":"156","symbol":"¥","description":"Chinese Yuan","isBase":False,"decimals":2},
    {"isoCode":"SGD","numericIsoCode":"702","symbol":"S$","description":"Singapore Dollar","isBase":False,"decimals":2},
]
# FX to USD (fixed table; the FX service degrades gracefully but seed uses these)
FX = {"USD":1.0,"EUR":1.08,"INR":0.012,"AED":0.27,"CHF":1.12,"GBP":1.27,"CNY":0.14,"SGD":0.74}
def to_base(amount, cur): return round(amount * FX.get(cur,1.0), 2)

UOMS = [("KG","Kilogram","WEIGHT","Weight"),("G","Gram","WEIGHT","Weight"),("L","Litre","VOLUME","Volume"),
    ("ML","Millilitre","VOLUME","Volume"),("EA","Each","COUNT","Count"),("BOX","Box","COUNT","Count"),
    ("CTN","Carton","COUNT","Count"),("PAL","Pallet","COUNT","Count"),("ROLL","Roll","COUNT","Count"),
    ("M","Metre","LENGTH","Length"),("DRUM","Drum","COUNT","Count"),("BAG","Bag","COUNT","Count"),
    ("PCS","Pieces","COUNT","Count"),("SET","Set","COUNT","Count"),("LOT","Lot","COUNT","Count"),
    ("TUBE","Tube","COUNT","Count"),("BTL","Bottle","COUNT","Count"),("CAN","Can","COUNT","Count"),
    ("SHT","Sheet","COUNT","Count"),("PK","Pack","COUNT","Count"),("HR","Hour","TIME","Time"),
    ("DAY","Day","TIME","Time"),("JOB","Job","SERVICE","Service"),("M2","Square Metre","AREA","Area"),
    ("TON","Tonne","WEIGHT","Weight")]
uom_rows = [{"uom":u,"uomDesc":d,"uomClass":c,"uomClassDesc":cd} for (u,d,c,cd) in UOMS]

PAY_TERMS = [
    {"code":"ADV100","label":"100% Advance","description":"Full payment in advance","effectiveFrom":"2025-01-01","effectiveTo":None},
    {"code":"PA-DOC","label":"Part Advance + Against Documents","description":"Part advance, balance against shipping documents","effectiveFrom":"2025-01-01","effectiveTo":None},
    {"code":"PA-SHIP","label":"Part Advance + Against Shipment","description":"Part advance, balance against shipment received","effectiveFrom":"2025-01-01","effectiveTo":None},
    {"code":"30-70","label":"30/70","description":"30% advance, 70% on delivery","effectiveFrom":"2025-01-01","effectiveTo":None},
    {"code":"NET30","label":"Net 30","description":"Net 30 days","effectiveFrom":"2025-01-01","effectiveTo":None},
    {"code":"NET60","label":"Net 60","description":"Net 60 days","effectiveFrom":"2025-01-01","effectiveTo":None},
    {"code":"NET90","label":"Net 90","description":"Net 90 days","effectiveFrom":"2025-01-01","effectiveTo":None},
]
TERM_DAYS = {"ADV100":-15,"PA-DOC":10,"PA-SHIP":20,"30-70":15,"NET30":30,"NET60":60,"NET90":90}

TAX_CODES = [
    {"code":"GST18","type":"GST","rate":18.0,"jurisdiction":"IN","recoverable":True},
    {"code":"GST12","type":"GST","rate":12.0,"jurisdiction":"IN","recoverable":True},
    {"code":"GST5","type":"GST","rate":5.0,"jurisdiction":"IN","recoverable":True},
    {"code":"VAT20","type":"VAT","rate":20.0,"jurisdiction":"EU","recoverable":True},
    {"code":"VAT5UAE","type":"VAT","rate":5.0,"jurisdiction":"AE","recoverable":True},
    {"code":"UST0","type":"VAT","rate":0.0,"jurisdiction":"US","recoverable":False},
    {"code":"DUTY10","type":"duty","rate":10.0,"jurisdiction":"IMPORT","recoverable":False},
    {"code":"DUTY7.5","type":"duty","rate":7.5,"jurisdiction":"IMPORT","recoverable":False},
    {"code":"RCM","type":"reverse-charge","rate":18.0,"jurisdiction":"IN","recoverable":True},
    {"code":"TDS2","type":"withholding","rate":2.0,"jurisdiction":"IN","recoverable":False},
]

WAREHOUSES = [
    {"code":"WH-P1-RM","description":"Plant 1 Raw Material Store","transactionType":"INWARD","heizenPoType":"DIRECT","location":"Plant 1"},
    {"code":"WH-P1-PM","description":"Plant 1 Packaging Store","transactionType":"INWARD","heizenPoType":"DIRECT","location":"Plant 1"},
    {"code":"WH-P1-FG","description":"Plant 1 Finished Goods","transactionType":"OUTWARD","heizenPoType":"DIRECT","location":"Plant 1"},
    {"code":"WH-P2-RM","description":"Plant 2 Raw Material Store","transactionType":"INWARD","heizenPoType":"IMPORT","location":"Plant 2"},
    {"code":"WH-P2-BOND","description":"Plant 2 Bonded Warehouse","transactionType":"INWARD","heizenPoType":"IMPORT","location":"Plant 2"},
    {"code":"WH-MRO","description":"MRO and Spares Store","transactionType":"INWARD","heizenPoType":"INDIRECT","location":"Plant 1"},
]

SEGMENTS = []  # ITEM CATEGORY + Item SubCategory
_seg_cats = [("RM","Raw Material - Active"),("RMEX","Raw Material - Excipient"),("PMCTN","Packaging - Carton"),
    ("PMLBL","Packaging - Label"),("PMBTL","Packaging - Bottle"),("PMCLO","Packaging - Closure"),
    ("PMLFT","Packaging - Leaflet"),("MRO","MRO and Spares"),("SVC","Services"),("LAB","Lab Consumables"),
    ("CAP","Capital Equipment"),("CHEM","Process Chemicals")]
for i,(c,d) in enumerate(_seg_cats):
    SEGMENTS.append({"classType":"ITEM CATEGORY","classCode":c,"classDesc":d,"createdBy":"system","createdDate":"2025-01-01"})
_seg_subs = [("RM-API","API"),("RM-EXC","Excipient"),("RM-SOLV","Solvent"),("PM-FCTN","Folding Carton"),
    ("PM-SHIP","Shipper"),("PM-PSL","Pressure-Sensitive Label"),("PM-HDPE","HDPE Bottle"),("PM-GLS","Glass Bottle"),
    ("PM-CRC","Child-Resistant Closure"),("MRO-BRG","Bearings"),("MRO-FLT","Filters"),("MRO-ELC","Electrical"),
    ("SVC-CAL","Calibration"),("SVC-MNT","Maintenance Contract"),("SVC-FRT","Freight")]
for i,(c,d) in enumerate(_seg_subs):
    SEGMENTS.append({"classType":"Item SubCategory","classCode":c,"classDesc":d,"createdBy":"system","createdDate":"2025-01-01"})

PROJECTS = []
_proj = [("MfgOps-P1","Plant 1 Manufacturing Operations",2_400_000),("MfgOps-P2","Plant 2 Manufacturing Operations",1_900_000),
    ("NPD-2026","New Product Development 2026",650_000),("Maint-2026","Maintenance and Engineering 2026",480_000),
    ("QC-Lab","Quality Lab Operations",320_000),("PackDev","Packaging Development",410_000),
    ("CapEx-Line3","CapEx - Production Line 3",1_200_000),("Indirect-Admin","Indirect and Admin Spend",280_000),
    ("ColdChain","Cold Chain and Logistics",360_000),("Reg-Compliance","Regulatory and Compliance",190_000),
    ("Sustainability","Sustainability Initiatives",150_000),("Legacy-2025","Legacy Project (Inactive)",0)]
for i,(name,desc,budget) in enumerate(_proj):
    PROJECTS.append({"id":pid("PRJ-",i+1,3),"name":desc,"code":name,"status":"INACTIVE" if name=="Legacy-2025" else "ACTIVE","annualBudget":budget})

write("currencies", CURRENCIES); DB["currencies"]=len(CURRENCIES)
write("uoms", uom_rows); DB["uoms"]=len(uom_rows)
write("payment_terms", PAY_TERMS); DB["payment_terms"]=len(PAY_TERMS)
write("tax_codes", TAX_CODES); DB["tax_codes"]=len(TAX_CODES)
write("warehouses", WAREHOUSES); DB["warehouses"]=len(WAREHOUSES)
write("segments", SEGMENTS); DB["segments"]=len(SEGMENTS)
write("projects", PROJECTS); DB["projects"]=len(PROJECTS)

# ---------- BUDGETS (per project x quarter) ----------
QUARTERS = ["2025-Q3","2025-Q4","2026-Q1","2026-Q2"]
budgets = []
bidx=0
for p in PROJECTS:
    if p["status"]!="ACTIVE": continue
    q_amt = round(p["annualBudget"]/4, 2)
    for q in QUARTERS:
        # spent ratio grows over quarters; current quarter (2026-Q2) partly committed
        spent_ratio = {"2025-Q3":0.94,"2025-Q4":0.91,"2026-Q1":0.88,"2026-Q2":0.42}[q]
        committed_ratio = {"2025-Q3":0.0,"2025-Q4":0.0,"2026-Q1":0.0,"2026-Q2":0.31}[q]
        actual = round(q_amt*spent_ratio,2); committed = round(q_amt*committed_ratio,2)
        bidx+=1
        budgets.append({"id":pid("BUD-",bidx,4),"projectId":p["id"],"period":q,"amount":q_amt,
            "availableAmount":round(q_amt-actual-committed,2),"committedAmount":committed,"actualAmount":actual})
write("budgets", budgets); DB["budgets"]=len(budgets)

# ---------- USERS / ROLES / DESIGNATIONS / VERTICALS ----------
VERTICALS = [{"id":"V-REQ","name":"Req Department","code":"REQD"},{"id":"V-PROC","name":"Procurement","code":"PROC"},
    {"id":"V-FIN","name":"Finance","code":"FIN"},{"id":"V-MGMT","name":"Management","code":"MGMT"}]
DESIGNATIONS = [{"id":"D1","label":"Associate","level":1},{"id":"D2","label":"Senior Associate","level":2},
    {"id":"D3","label":"Lead","level":3},{"id":"D4","label":"Manager","level":4},{"id":"D5","label":"Senior Manager","level":5},
    {"id":"D6","label":"Director","level":6},{"id":"D7","label":"VP","level":7}]
ROLES = [{"id":"R-ADMIN","name":"SystemAdmin"},{"id":"R-USER","name":"User"}]
write("verticals", VERTICALS); write("designations", DESIGNATIONS); write("roles", ROLES)
DB["verticals"]=len(VERTICALS); DB["designations"]=len(DESIGNATIONS); DB["roles"]=len(ROLES)

# Named users per role so SoD + least-loaded show real names
USERS = []
def add_user(uid, name, email, role, vertical, desig, dept, limit=None, status="ACTIVE"):
    USERS.append({"id":uid,"name":name,"email":email.lower(),"status":status,"role":role,
        "verticalId":vertical,"designationId":desig,"department":dept,"approvalLimit":limit})
add_user("U-ADMIN","Riya Malhotra","riya.malhotra@meridianhealth.com","SystemAdmin","V-MGMT","D6","IT",None)
# Requesters
add_user("U-REQ1","Aarav Shah","aarav.shah@meridianhealth.com","User","V-REQ","D2","R&D/NPD",None)
add_user("U-REQ2","Neha Iyer","neha.iyer@meridianhealth.com","User","V-REQ","D2","Production",None)
add_user("U-REQ3","Tom Becker","tom.becker@meridianhealth.com","User","V-REQ","D1","Maintenance/Engineering",None)
add_user("U-REQ4","Sofia Marino","sofia.marino@meridianhealth.com","User","V-REQ","D2","QA/QC",None)
# Buyers (Procurement)
add_user("U-BUY1","Daniel Osei","daniel.osei@meridianhealth.com","User","V-PROC","D3","Procurement",None)
add_user("U-BUY2","Mei Lin Tan","meilin.tan@meridianhealth.com","User","V-PROC","D3","Procurement",None)
add_user("U-BUY3","Carlos Reyes","carlos.reyes@meridianhealth.com","User","V-PROC","D2","Procurement",None)  # local/cash buyer
add_user("U-PROCMGR","Anjali Verma","anjali.verma@meridianhealth.com","User","V-PROC","D5","Procurement",500_000)
# Approvers (Req Dept managers + budget owners)
add_user("U-REQMGR1","Marcus Cole","marcus.cole@meridianhealth.com","User","V-REQ","D4","R&D/NPD",75_000)
add_user("U-REQMGR2","Priya Nair","priya.nair@meridianhealth.com","User","V-REQ","D4","Production",75_000)
# Finance
add_user("U-FINMK1","Ines Dubois","ines.dubois@meridianhealth.com","User","V-FIN","D3","Finance",None)  # maker
add_user("U-FINMK2","Raj Pillai","raj.pillai@meridianhealth.com","User","V-FIN","D3","Finance",None)
add_user("U-FINCHK","Helena Brandt","helena.brandt@meridianhealth.com","User","V-FIN","D5","Finance",250_000)  # checker / chief accountant
add_user("U-FINAPR","Sam Whitfield","sam.whitfield@meridianhealth.com","User","V-FIN","D4","Finance",150_000)  # finance approver (nearest-bucket)
add_user("U-FINAPR2","Lena Fischer","lena.fischer@meridianhealth.com","User","V-FIN","D5","Finance",400_000)
# Management
add_user("U-MGMT1","David Okonkwo","david.okonkwo@meridianhealth.com","User","V-MGMT","D6","Management",1_000_000)
add_user("U-MGMT2","Grace Hollis","grace.hollis@meridianhealth.com","User","V-MGMT","D7","Management",None)
# Quality + Engineering + Tax
add_user("U-QC1","Sofia Marino","sofia.marino2@meridianhealth.com","User","V-REQ","D3","QA/QC",None)
add_user("U-ENG1","Omar Haddad","omar.haddad@meridianhealth.com","User","V-REQ","D3","Maintenance/Engineering",None)
add_user("U-TAX1","Wei Zhang","wei.zhang@meridianhealth.com","User","V-FIN","D3","Finance",None)
# Receiving
add_user("U-RECV1","Lucas Fernandes","lucas.fernandes@meridianhealth.com","User","V-REQ","D1","Production",None)
write("users", USERS); DB["users"]=len(USERS)

print("foundation written:", {k:DB[k] for k in ["currencies","uoms","payment_terms","tax_codes","warehouses","segments","projects","budgets","users","verticals","designations","roles"]})

# ---------- SUPPLIERS (52, Pareto, grade spread, lifecycle spread, ISO attrs) ----------
def gstin(state):  # valid format ^\d{2}[A-Z]{5}\d{4}[A-Z][A-Z\d]Z[A-Z\d]$
    return f"{str(state).zfill(2)}{''.join(rng.choice('ABCDEFGHIJKLMNOPQRSTUVWXYZ') for _ in range(5))}{rng.randint(1000,9999)}{rng.choice('ABCDEFGHIJ')}{rng.randint(1,9)}Z{rng.choice('ABCDEFGHIJ0123456789')}"
def pan():
    return f"{''.join(rng.choice('ABCDEFGHIJKLMNOPQRSTUVWXYZ') for _ in range(5))}{rng.randint(1000,9999)}{rng.choice('ABCDEFGHIJ')}"
INDIAN_STATES = [("Maharashtra","27"),("Gujarat","24"),("Karnataka","29"),("Tamil Nadu","33"),("Telangana","36")]
def tax_ids(region, country, state):
    if region=="IN":
        return {"gstin":gstin(state[1]),"pan":pan()}
    if region=="EU":
        return {"vat":f"{country[:2].upper()}{rng.randint(100000000,999999999)}"}
    if region=="AE":
        return {"trn":str(rng.randint(100000000000000,999999999999999))}
    return {"ein":f"{rng.randint(10,99)}-{rng.randint(1000000,9999999)}"}
# (name, category-segment, currency, country, region, strategic?)
SUP_DEFS = [
    # strategic / critical (carry most spend) - APIs, key packaging
    ("Synthex Active Pharma Ltd","RM-API","INR","India","IN",True),
    ("BioCore Ingredients GmbH","RM-API","EUR","Germany","EU",True),
    ("Helvetia Fine Chemicals AG","RM-API","CHF","Switzerland","EU",True),
    ("Crescent Excipients Pvt Ltd","RM-EXC","INR","India","IN",True),
    ("PackRight Cartons Co","PM-FCTN","USD","United States","US",True),
    ("ClearMold HDPE Industries","PM-HDPE","USD","United States","US",True),
    ("Gulf Closure Systems LLC","PM-CRC","AED","UAE","AE",True),
    ("Meridian Logistics Partners","SVC-FRT","USD","United States","US",True),
]
TAIL_PREFIX = ["Apex","Summit","Pioneer","Vertex","Northwind","Crystal","Unified","Prime","Allied","Sterling",
    "Cobalt","Granite","Harbor","Lakeside","Maple","Onyx","Pinnacle","Quartz","Redwood","Silverline",
    "Terra","Umbra","Vista","Wellspring","Zenith","Axiom","Brightway","Cardinal","Dynamo","Evergreen",
    "Fortis","Glacier","Horizon","Ironclad","Juniper","Keystone","Lumen","Monarch","Nimbus","Orion",
    "Polaris","Riverstone","Solstice"]
TAIL_SUFFIX = {"RMEX":"Excipients","PMLBL":"Labels","PMBTL":"Bottling","PMLFT":"Print","MRO":"Industrial Supplies",
    "SVC":"Services","LAB":"Lab Supplies","CHEM":"Chemicals","PMCTN":"Packaging"}
GRADE_W = ["A","A","A","B","B","B","B","C","C"]  # weighted toward B
suppliers=[]; sup_by_seg={}
def sup_record(i, name, seg, cur, country, region, strategic, status="ONBOARDED", grade=None, cert_expiry=None):
    code=pid("S/",i,5)
    grade = grade or (("A" if strategic else rng.choice(GRADE_W)))
    state = rng.choice(INDIAN_STATES) if region=="IN" else None
    terms = rng.choice(["ADV100","PA-DOC","30-70"]) if (strategic and region!="US") else rng.choice(["NET30","NET60","NET90","PA-SHIP"])
    risk = "critical" if strategic and seg=="RM-API" else ("high" if strategic else rng.choice(["low","low","medium","medium","high"]))
    certs=[]
    if region!="US" or strategic:
        certs.append({"name":"ISO 9001:2015","expiry":iso(days_ago(rng.randint(-400,-60)))})
    if seg in ("RM-API","RM-EXC","RM-SOLV"):
        certs.append({"name":"GMP","expiry":iso(cert_expiry or days_ago(rng.randint(-365,-30)))})
        certs.append({"name":"ISO 14001:2015","expiry":iso(days_ago(rng.randint(-380,-40)))})
    rec={"id":pid("SUP-",i,4),"code":code,"name":name,"description":f"{name} - approved {SEGMENTS[0]['classDesc'] if False else 'supplier'}",
        "purchaseType":"IMPORT" if region!="US" else "LOCAL","classification":"External",
        "currency":cur,"dealCurrency":cur,"supplierGroup":seg.split('-')[0] if '-' in seg else seg,
        "status":status,"grade":grade,"avlScopeOfApproval":[seg],"paymentTerms":terms,
        "payMode":"EP","incoTerm":("CIF" if region!="US" else "FOB"),"incoPlace":("Nhava Sheva" if region=="IN" else ("Hamburg" if region=="EU" else ("Jebel Ali" if region=="AE" else "Newark"))),
        "advancePayable":strategic and region!="US","advanceTolerance":10 if strategic else 0,"autoInvoicing":False,
        "minimumOrderValue":1,"isErpSynced":status=="ONBOARDED" and rng.random()<0.7,
        "riskTier":risk,"securityTradeProgram":(rng.choice(["AEO","C-TPAT","none"]) if strategic else "none"),
        "continuity":{"hasBcp":strategic,"mtpdDays":(7 if risk=="critical" else 30),"backupSupplierCoverage":strategic},
        "sustainability":{"iso14001":any(c["name"].startswith("ISO 14001") for c in certs),"ecovadis":(rng.choice(["Gold","Silver","Bronze",None]) if strategic else None)},
        "infoSec":{"iso27001":strategic and region=="EU","dpaSigned":strategic},
        "antiBribery":{"dueDiligenceStatus":("complete" if strategic else "screened"),"sanctionsScreened":True,"lastScreened":iso(days_ago(rng.randint(20,200)))},
        "certifications":certs,"lastAssessed":iso(days_ago(rng.randint(20,300))),"nextDue":iso(days_ago(rng.randint(-330,-30))),
        "country":country,"region":region,
        "taxIds":tax_ids(region, country, state)}
    suppliers.append(rec); sup_by_seg.setdefault(seg, []).append(rec)
    return rec
i=1
for (name,seg,cur,country,region,strat) in SUP_DEFS:
    sup_record(i, name, seg, cur, country, region, strat); i+=1
# tail suppliers across segments
tail_segs=["RMEX","PMLBL","PMBTL","PMLFT","MRO","SVC","LAB","CHEM","PMCTN"]
used_names=set(s["name"] for s in suppliers)
while len(suppliers)<52:
    seg=rng.choice(tail_segs); pfx=rng.choice(TAIL_PREFIX)
    nm=f"{pfx} {TAIL_SUFFIX.get(seg,'Supplies')}"
    if nm in used_names: continue
    used_names.add(nm)
    region=rng.choice(["US","US","US","IN","EU"]); cur={"US":"USD","IN":"INR","EU":"EUR"}[region]
    country={"US":"United States","IN":"India","EU":"France"}[region]
    sup_record(i, nm, seg if '-' in seg else seg, cur, country, region, False); i+=1
# apply the lifecycle spread to specific tail suppliers
def set_status(idx, status, **extra):
    suppliers[idx]["status"]=status
    suppliers[idx].update(extra)
set_status(48,"PENDING_APPROVAL"); set_status(49,"PENDING_APPROVAL"); set_status(50,"PENDING_ONBOARDING")
set_status(51,"PENDING_ONBOARDING")
set_status(45,"SUSPENDED", grade="C", suspendReason="Expired GMP certificate", suspendCategory="expired-cert")
# one offboarded (replace a tail)
suppliers[44]["status"]="OFFBOARDED"; suppliers[44]["grade"]="C"
# a near-expiry cert supplier for the e11 alert (strategic API supplier #1 cert expiring in 12 days)
suppliers[0]["certifications"]=[{"name":"ISO 9001:2015","expiry":iso(TODAY+timedelta(days=180))},
    {"name":"GMP","expiry":iso(TODAY+timedelta(days=12))},{"name":"ISO 14001:2015","expiry":iso(TODAY+timedelta(days=200))}]
write("suppliers", suppliers); DB["suppliers"]=len(suppliers)

# ---------- ITEMS (220) ----------
DEPT_CODE={"RM-API":"CP","RM-EXC":"CP","RM-SOLV":"CP","PM-FCTN":"PK" if False else "ME","PM-SHIP":"ME","PM-PSL":"ME",
    "PM-HDPE":"ME","PM-GLS":"ME","PM-CRC":"ME","MRO-BRG":"SR","MRO-FLT":"SR","MRO-ELC":"EL","SVC-CAL":"AD","SVC-MNT":"AD","SVC-FRT":"AD"}
ITEM_TEMPLATES=[
    # (subseg, type, stockUom, purchaseUom, name pattern, base price USD, lead days, regulated, hs)
    ("RM-API","RAWMATERIAL","KG","DRUM","{} Active Pharmaceutical Ingredient",180,75,True,"29420090"),
    ("RM-EXC","RAWMATERIAL","KG","BAG","{} Excipient Grade",12,30,True,"38220090"),
    ("RM-SOLV","RAWMATERIAL","L","DRUM","{} Pharma Solvent",4.5,28,True,"29051100"),
    ("PM-FCTN","COMPONENT","EA","CTN","{} Folding Carton 3-ply",0.085,18,False,"48191000"),
    ("PM-SHIP","COMPONENT","EA","BAG","{} Corrugated Shipper 5-ply",0.42,15,False,"48191000"),
    ("PM-PSL","COMPONENT","EA","ROLL","{} Pressure-Sensitive Label",0.012,21,False,"48211000"),
    ("PM-HDPE","COMPONENT","EA","CTN","{} HDPE Bottle",0.058,14,False,"39233010"),
    ("PM-GLS","COMPONENT","EA","CTN","{} Amber Glass Bottle",0.21,35,False,"70109000"),
    ("PM-CRC","COMPONENT","EA","BAG","{} Child-Resistant Closure",0.034,40,False,"39235010"),
    ("MRO-BRG","SPARE PART","EA","EA","{} Bearing Assembly",95,21,False,"84821000"),
    ("MRO-FLT","CONSUMABLE","EA","BOX","{} Cartridge Filter",18,12,False,"84212300"),
    ("MRO-ELC","SPARE PART","EA","EA","{} Control Relay",42,20,False,"85364900"),
    ("SVC-CAL","SERVICE","JOB","JOB","{} Calibration Service",1,7,False,None),
    ("SVC-MNT","SERVICE","JOB","JOB","{} AMC Maintenance",1,7,False,None),
    ("SVC-FRT","SERVICE","JOB","JOB","{} Freight and Clearing",1,3,False,None),
]
DESCRIPTORS=["Lutein","Cetirizine","Paracetamol","Ibuprofen","Loratadine","Omega-3","Calcium","Zinc","Magnesium",
    "Vitamin C","Vitamin D3","Probiotic","Menthol","Camphor","Aloe","Glycerin","Sorbitol","Lactose","Cellulose",
    "Titanium Dioxide","Sodium","Potassium","Ascorbic","Folic","Biotin","Collagen","Hyaluronic","Salicylic","Benzoyl","Niacinamide"]
items=[]; items_by_subseg={}
run=0
SUBSEG_TARGET={}  # rough counts to reach 220 with RM/PM heavy
counts={"RM-API":22,"RM-EXC":18,"RM-SOLV":10,"PM-FCTN":24,"PM-SHIP":12,"PM-PSL":22,"PM-HDPE":18,"PM-GLS":12,
    "PM-CRC":14,"MRO-BRG":12,"MRO-FLT":10,"MRO-ELC":12,"SVC-CAL":8,"SVC-MNT":8,"SVC-FRT":8}
tmpl_by_sub={t[0]:t for t in ITEM_TEMPLATES}
itemnum=0
for sub,n in counts.items():
    t=tmpl_by_sub[sub]; subseg,typ,sUom,pUom,namep,base,lead,reg,hs=t
    cands=[s for s in suppliers if sub in s.get("avlScopeOfApproval",[]) and s["status"]=="ONBOARDED"]
    if not cands: cands=[s for s in suppliers if s["status"]=="ONBOARDED"]
    for k in range(n):
        itemnum+=1; run+=1
        desc=rng.choice(DESCRIPTORS)
        price=round(base*(0.6+rng.random()*1.2),3)
        last=round(price*(0.9+rng.random()*0.25),3)
        sup=rng.choice(cands)
        deptc=DEPT_CODE.get(sub,"ME")
        code=f"{deptc}/{sub.split('-')[0]}/{sub.split('-')[-1][:3].upper()}"
        items.append({"id":pid("ITM-",itemnum,4),"code":code,"runningNumber":str(itemnum).zfill(6),
            "description":f"{desc} {namep.format(desc).split(' ',1)[1] if ' ' in namep else namep}".strip()[:60],
            "shortDescription":namep.format(desc)[:40],"type":typ,"status":"ONBOARDED",
            "department":deptc,"segment":sub.split('-')[0],"subSegment":sub,"stockUom":sUom,"purchaseUom":pUom,"salesUom":sUom,
            "standardSupplierId":sup["id"],"standardSupplierCode":sup["code"],"hsnCode":hs,"regulatedItem":reg,
            "standardCost":price,"lastPurchasePrice":last,"leadTimeDays":max(2,lead+rng.randint(-3,5)),
            "sourcePriorities":[{"sourceType":"PURCHASED","priority":1}] + ([{"sourceType":"MANUFACTURED","priority":2}] if typ=="INTERMEDIATE" else []),
            "isErpSynced":rng.random()<0.75,"itemAccountGroup":"RM - Raw Material" if typ=="RAWMATERIAL" else "FG - Finished Goods"})
        items_by_subseg.setdefault(sub,[]).append(items[-1])
# a couple of items in non-onboarded states
items[200]["status"]="PENDING_APPROVAL"; items[201]["status"]="PENDING_ONBOARDING"
write("items", items); DB["items"]=len(items)
print("masters2 written:", {"suppliers":len(suppliers),"items":len(items)})
with open(os.path.join(OUT,'_db.json'),'w') as f: json.dump(DB,f)
# stash for part 3
import pickle
with open(os.path.join(OUT,'_state.pkl'),'wb') as f:
    pickle.dump({"suppliers":suppliers,"items":items,"users":USERS,"projects":PROJECTS,"budgets":budgets,
        "items_by_subseg":items_by_subseg,"sup_by_seg":sup_by_seg},f)

# ====================== PART 3: HISTORY, SCORECARDS, LIVE RECORDS, HERO ======================
import pickle
st=pickle.load(open(os.path.join(OUT,'_state.pkl'),'rb'))
suppliers=st["suppliers"]; items=st["items"]; USERS=st["users"]; PROJECTS=st["projects"]; budgets=st["budgets"]
onboarded_sup=[s for s in suppliers if s["status"]=="ONBOARDED"]
buyers=[u for u in USERS if u["id"] in ("U-BUY1","U-BUY2","U-BUY3")]
requesters=[u for u in USERS if u["verticalId"]=="V-REQ" and u["designationId"] in ("D1","D2")]
fin_makers=[u for u in USERS if u["id"] in ("U-FINMK1","U-FINMK2")]
fin_approvers=[u for u in USERS if u["id"] in ("U-FINAPR","U-FINAPR2")]
DEPT_PREFIX={"R&D/NPD":"RND","Production":"PRD","Maintenance/Engineering":"ENG","QA/QC":"QCD","Procurement":"PRC"}
MONTH_SHORT=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
def ticket_identifier(d, dept):
    return f"{d.year}{MONTH_SHORT[d.month-1]}{DEPT_PREFIX.get(dept,'GEN')}07{rng.randint(1,9999):05d}"

# ---- 12-month closed-ticket history, engineered so KPIs land in the defensible bands ----
# Assign each ONBOARDED supplier a "performance profile" consistent with its grade.
sup_profile={}
for s in onboarded_sup:
    g=s["grade"]
    if g=="A":   otd=rng.uniform(0.96,0.99); fill=rng.uniform(0.97,0.995); docacc=rng.uniform(0.96,0.99); ppm=rng.uniform(50,400)
    elif g=="B": otd=rng.uniform(0.91,0.96); fill=rng.uniform(0.94,0.98); docacc=rng.uniform(0.91,0.96); ppm=rng.uniform(400,1200)
    else:        otd=rng.uniform(0.80,0.90); fill=rng.uniform(0.88,0.95); docacc=rng.uniform(0.85,0.93); ppm=rng.uniform(1200,3000)
    sup_profile[s["id"]]={"otd":otd,"fill":fill,"docacc":docacc,"ppm":ppm}

hist_tickets=[]; hist_lines=[]; hist_grns=[]; hist_invoices=[]; hist_payments=[]; ncrs=[]
proj_active=[p for p in PROJECTS if p["status"]=="ACTIVE"]
N_HIST=180
for h in range(N_HIST):
    created=days_ago(rng.randint(35,360))
    req=rng.choice(requesters); dept=req["department"]; buyer=rng.choice(buyers)
    sup=rng.choice(onboarded_sup); prof=sup_profile[sup["id"]]
    its=[i for i in items if i["standardSupplierId"]==sup["id"]] or [rng.choice(items)]
    nlines=rng.randint(1,4)
    tid=pid("TKT-",1000+h,5)
    lines=[]; total=0.0
    for li in range(nlines):
        it=rng.choice(its); qty=rng.choice([500,1000,2500,5000,10000,20000,40000]); up=it["lastPurchasePrice"]
        amt=round(qty*up,2); total+=amt
        lines.append({"id":pid("TL-",len(hist_lines)+1,6),"ticketId":tid,"itemId":it["id"],"quantity":qty,
            "unitOfMeasure":it["purchaseUom"],"unitPrice":up,"needDate":iso(created+timedelta(days=it["leadTimeDays"]))})
    hist_lines+=lines
    cur=sup["currency"]; total_base=to_base(total,cur)
    # cycle time: target 7-10 days, sometimes faster, occasionally breached
    cyc=rng.choices([2,3,5,7,8,9,10,14,21],weights=[3,5,8,12,12,10,8,4,2])[0]
    po_date=created+timedelta(days=cyc)
    # delivery: on-time per profile
    ontime = rng.random() < prof["otd"]
    infull = rng.random() < prof["fill"]
    docok  = rng.random() < prof["docacc"]
    promised=po_date+timedelta(days=its[0]["leadTimeDays"] if its else 21)
    actual_delivery = promised + timedelta(days=0 if ontime else rng.randint(2,18))
    grn_date=actual_delivery
    # invoice + payment per terms
    term=sup["paymentTerms"]; pay_offset=TERM_DAYS.get(term,30)
    inv_date=grn_date+timedelta(days=rng.randint(1,6))
    pay_date=inv_date+timedelta(days=max(0,pay_offset)+rng.randint(-2,4))
    completed = pay_date <= TODAY
    hist_tickets.append({"id":tid,"identifier":ticket_identifier(created,dept),"requesterId":req["id"],"departmentId":dept,
        "buyerId":buyer["id"],"supplierId":sup["id"],"projectId":rng.choice(proj_active)["id"],
        "category":rng.choice(["Items","Spares","Services"]),"purchaseType":sup["purchaseType"],"currency":cur,
        "priority":rng.choice(["ASAP","SameDay","Within2Days","Within1Week"]),
        "stage":"POST_DELIVERY","status":"COMPLETED" if completed else "IN_PROGRESS",
        "totalAmount":round(total,2),"totalAmountInBase":total_base,
        "createdAt":iso(created),"poDate":iso(po_date),"reqToPoCycleDays":cyc,
        "promisedDate":iso(promised),"actualDeliveryDate":iso(actual_delivery),
        "onTime":ontime,"inFull":infull,"docAccurate":docok,"damageFree":rng.random()<0.985})
    hist_grns.append({"id":pid("GRN-",2000+h,5),"ticketId":tid,"poDate":iso(po_date),"grnDate":iso(grn_date),
        "receivedQty":sum(l["quantity"] for l in lines),"status":"COMPLETED"})
    hist_invoices.append({"id":pid("INV-",3000+h,5),"ticketId":tid,"supplierId":sup["id"],"invoiceDate":iso(inv_date),
        "amount":round(total,2),"taxAmount":round(total*0.1,2),"currency":cur,"matchType":"THREE_WAY","matchStatus":"matched"})
    hist_payments.append({"id":pid("PAY-",4000+h,5),"ticketId":tid,"supplierId":sup["id"],"invoiceDate":iso(inv_date),
        "paymentDate":iso(pay_date) if completed else None,"amount":round(total,2),"currency":cur,"term":term,
        "dpoActual":(pay_date-inv_date).days,"status":"PROCESSED" if completed else "APPROVED"})
    # occasional NCR for lower grades
    if not infull or (sup["grade"]=="C" and rng.random()<0.35):
        ncrs.append({"id":pid("NCR-",5000+len(ncrs)+1,5),"ticketId":tid,"supplierId":sup["id"],"itemId":lines[0]["itemId"],
            "deliveryNoteNumber":f"DN-{rng.randint(10000,99999)}","deliveryDate":iso(grn_date),
            "description":rng.choice(["Quantity short of PO","Off-spec assay result","Label artwork mismatch","Damaged in transit","COA missing on receipt"]),
            "percentNonConformance":round(rng.uniform(1,12),1),"disposition":rng.choice(["return","rework","use-as-is-concession","scrap"]),
            "status":"CLOSED","raisedBy":"U-QC1"})
write("history_tickets", hist_tickets); write("history_lines", hist_lines); write("history_grns", hist_grns)
write("history_invoices", hist_invoices); write("history_payments", hist_payments); write("ncrs", ncrs)
DB["history_tickets"]=len(hist_tickets); DB["ncrs"]=len(ncrs)

# ---- Supplier scorecards computed FROM the history (so they reconcile) ----
from statistics import mean
scorecards=[]
for s in onboarded_sup:
    sts=[t for t in hist_tickets if t["supplierId"]==s["id"]]
    if not sts:
        prof=sup_profile[s["id"]]; otif=round(prof["otd"]*prof["fill"]*100,1); n=0
    else:
        n=len(sts)
        otd=mean(1 if t["onTime"] else 0 for t in sts)
        otif2=mean(1 if (t["onTime"] and t["inFull"]) else 0 for t in sts)*100  # two-factor
        # perfect order is a strict subset of OTIF (adds doc-accurate + damage-free), so derive it as
        # OTIF scaled by the doc/damage pass rate -> guaranteed <= OTIF (perfect-order is never above OTIF).
        docdmg=mean((1 if t["docAccurate"] else 0)*(1 if t["damageFree"] else 0) for t in sts)
        perfect=otif2*docdmg
        otif=round(otif2,1)
    prof=sup_profile[s["id"]]
    quality=round(max(0,100-prof["ppm"]/40),1)
    delivery=round(otif,1)
    cost=round(rng.uniform(70,95),1)
    responsiveness=round(rng.uniform(72,96),1)
    weights={"delivery":0.4,"quality":0.3,"cost":0.2,"responsiveness":0.1}
    composite=round(delivery*weights["delivery"]+quality*weights["quality"]+cost*weights["cost"]+responsiveness*weights["responsiveness"],1)
    grade="A" if composite>=90 else ("B" if composite>=70 else "C")
    scorecards.append({"supplierId":s["id"],"supplierCode":s["code"],"period":"trailing-12m","transactions":n,
        "otifTwoFactor":round(otif,1),"perfectOrderFourFactor":round(min(perfect, otif-1.0) if sts else round(otif*0.9,1),1),
        "qualityScore":quality,"deliveryScore":delivery,"costScore":cost,"responsivenessScore":responsiveness,
        "compositeScore":composite,"grade":grade,"complianceGate": all(c.get("expiry","9999") > iso(TODAY) for c in s["certifications"]),
        "avlStatus":"Preferred" if (composite>=90 and s.get("riskTier")!="critical") else ("Approved" if composite>=70 else "Conditional"),
        "ppm":round(prof["ppm"])})
write("supplier_scorecards", scorecards); DB["supplier_scorecards"]=len(scorecards)

with open(os.path.join(OUT,'_state.pkl'),'wb') as f:
    pickle.dump({**st,"hist_tickets":hist_tickets,"scorecards":scorecards,"onboarded_sup":onboarded_sup,
        "buyers":buyers,"requesters":requesters,"fin_makers":fin_makers,"fin_approvers":fin_approvers},f)
print("history written:", {"tickets":len(hist_tickets),"grns":len(hist_grns),"invoices":len(hist_invoices),"payments":len(hist_payments),"ncrs":len(ncrs),"scorecards":len(scorecards)})
with open(os.path.join(OUT,'_db.json'),'w') as f: json.dump(DB,f)

# ====================== PART 4: LIVE IN-FLIGHT RECORDS + HERO SCENARIO ======================
st=pickle.load(open(os.path.join(OUT,'_state.pkl'),'rb'))
suppliers=st["suppliers"]; items=st["items"]; USERS=st["users"]; PROJECTS=st["projects"]
onboarded_sup=st["onboarded_sup"]; buyers=st["buyers"]; requesters=st["requesters"]
fin_makers=st["fin_makers"]; fin_approvers=st["fin_approvers"]
def find_item(subseg):
    c=[i for i in items if i["subSegment"]==subseg and i["status"]=="ONBOARDED"]
    return rng.choice(c) if c else rng.choice(items)
def sup_by_name(n): return next(s for s in suppliers if s["name"]==n)
api_sup=sup_by_name("Synthex Active Pharma Ltd")       # strategic API, INR, the near-cert-expiry one
api_sup2=sup_by_name("BioCore Ingredients GmbH")        # EUR alt
api_sup3=sup_by_name("Helvetia Fine Chemicals AG")      # CHF alt (cheapest unit, high landed)
carton_sup=sup_by_name("PackRight Cartons Co")          # USD carton
proj_npd=next(p for p in PROJECTS if p["code"]=="NPD-2026")
api_item=find_item("RM-API"); carton_item=find_item("PM-FCTN")

live_tickets=[]; live_rfqs=[]; live_quotes=[]; live_pos=[]; live_grns=[]; live_invoices=[]
live_installments=[]; live_returns=[]; live_capas=[]; live_commitments=[]; live_credit_notes=[]

# ---------- HERO requisition (REQ-HERO) ----------
hero_created=days_ago(9)
hero_total = round(api_item["lastPurchasePrice"]*5000 + carton_item["lastPurchasePrice"]*200000, 2)
hero_total_base = to_base(hero_total, "USD")
REQ_HERO={"id":"TKT-HERO","identifier":"2026MayRND0700042","requesterId":"U-REQ1","departmentId":"R&D/NPD",
    "buyerId":"U-BUY1","supplierId":None,"projectId":proj_npd["id"],"category":"Items","directOrIndirect":"Direct",
    "purchaseType":"Import","currency":"USD","priority":"ASAP","stage":"INITIATION","status":"IN_PROGRESS",
    "totalAmount":hero_total,"totalAmountInBase":hero_total_base,"createdAt":iso(hero_created),
    "budgetOverride":{"approvedBy":"U-REQMGR1","reason":"NPD batch on critical path for Q3 launch; over quarter budget by design","at":iso(days_ago(8))},
    "isHero":True,"narrative":"Golden-path requisition: regulated API (import, manual approval) + printed carton (auto-approve)."}
live_tickets.append(REQ_HERO)
live_lines_hero=[
    {"id":"TL-HERO-API","ticketId":"TKT-HERO","itemId":api_item["id"],"quantity":5000,"unitOfMeasure":api_item["purchaseUom"],
     "unitPrice":api_item["lastPurchasePrice"],"hsCode":api_item["hsnCode"],"needDate":iso(hero_created+timedelta(days=75)),
     "stageStatus":"AWAITING_APPROVAL (Finance, manual: over auto-approval limit)"},
    {"id":"TL-HERO-CTN","ticketId":"TKT-HERO","itemId":carton_item["id"],"quantity":200000,"unitOfMeasure":carton_item["purchaseUom"],
     "unitPrice":carton_item["lastPurchasePrice"],"needDate":iso(hero_created+timedelta(days=18)),
     "stageStatus":"APPROVED (Finance auto-approved: under nearest-bucket limit)"}]
# HERO RFQ + 3 quotes where cheapest unit price != lowest landed cost
RFQ_HERO={"id":"RFQ-HERO","ticketId":"TKT-HERO","reference":"RFQ-2026-0042","requisitionLineId":"TL-HERO-API",
    "invitedSupplierIds":[api_sup["id"],api_sup2["id"],api_sup3["id"]],"internalTargetPrice":api_item["lastPurchasePrice"]*0.97,
    "sentDate":iso(days_ago(6)),"deadline":iso(days_ago(1)),"status":"RESPONDED","internalTargetPriceNote":"NEVER sent to supplier"}
live_rfqs.append(RFQ_HERO)
def quote(sid, unit, freight, duty, spike=False):
    landed=round(unit + freight + duty,4)
    return {"id":pid("QT-HERO-",len(live_quotes)+1,2),"rfqId":"RFQ-HERO","supplierId":sid,"itemId":api_item["id"],
        "unitPrice":unit,"currency":next(s for s in suppliers if s["id"]==sid)["currency"],
        "paymentTerms":next(s for s in suppliers if s["id"]==sid)["paymentTerms"],
        "incoterm":next(s for s in suppliers if s["id"]==sid)["incoTerm"],
        "freightPerUnit":freight,"dutyPerUnit":duty,"landedCostPerUnit":landed,
        "priceSpikeFlag":spike,"priceSpikePct":(round((unit/(api_item["lastPurchasePrice"])-1)*100,1) if spike else None)}
base=api_item["lastPurchasePrice"]
# Helvetia: cheapest unit (0.88x) but high freight+duty -> highest landed (the flip)
live_quotes.append(quote(api_sup3["id"], round(base*0.88,3), round(base*0.18,3), round(base*0.11,3)))
# Synthex: mid unit, low freight -> LOWEST landed (the right pick)
live_quotes.append(quote(api_sup["id"], round(base*0.96,3), round(base*0.05,3), round(base*0.06,3)))
# BioCore: highest unit (+7% spike vs last purchase) -> mid landed
live_quotes.append(quote(api_sup2["id"], round(base*1.07,3), round(base*0.08,3), round(base*0.09,3), spike=True))

# ---------- Live exception scenarios (one per interesting state) ----------
def mk_ticket(suffix, sup, stage, status, days, note, extra=None):
    sup_id = sup["id"] if sup else None
    its=[i for i in items if i["standardSupplierId"]==(sup_id or "")] or [rng.choice(items)]
    it=its[0]; qty=rng.choice([2000,5000,10000]); up=it["lastPurchasePrice"]; total=round(qty*up,2)
    req=rng.choice(requesters)
    t={"id":pid("TKT-LV-",suffix,3),"identifier":ticket_id_simple(days,req["department"]),"requesterId":req["id"],
       "departmentId":req["department"],"buyerId":rng.choice(buyers)["id"],"supplierId":sup_id,
       "projectId":rng.choice([p for p in PROJECTS if p["status"]=="ACTIVE"])["id"],"category":rng.choice(["Items","Spares","Services"]),
       "purchaseType":sup["purchaseType"] if sup else "Local","currency":sup["currency"] if sup else "USD",
       "priority":rng.choice(["ASAP","SameDay","Within2Days","Within1Week"]),"stage":stage,"status":status,
       "totalAmount":total,"totalAmountInBase":to_base(total,sup["currency"] if sup else "USD"),"createdAt":iso(days_ago(days)),
       "scenarioNote":note}
    if extra: t.update(extra)
    return t,it,qty,total
def ticket_id_simple(days, dept):
    d=days_ago(days); return f"{d.year}{MONTH_SHORT[d.month-1]}{DEPT_PREFIX.get(dept,'GEN')}07{rng.randint(1,9999):05d}"

# 1+2: requisitions awaiting approval, one just under and one just over the auto-approval limit (200000 base default; approver U-FINAPR limit 150000)
t,_,_,_=mk_ticket(1,onboarded_sup[10],"INITIATION","IN_PROGRESS",3,"Awaiting Finance approval; INR amount UNDER approver limit -> will auto-approve",{"totalAmountInBase":120000,"financeStage":"auto-approve eligible","approverId":"U-FINAPR"}); live_tickets.append(t)
t,_,_,_=mk_ticket(2,onboarded_sup[11],"INITIATION","IN_PROGRESS",4,"Awaiting Finance approval; amount OVER approver limit -> routed to manual approver",{"totalAmountInBase":185000,"financeStage":"manual approval required","approverId":"U-FINAPR2"}); live_tickets.append(t)
# 3: PO acknowledged + partially delivered (2 of 3 GRNs)
t,pit,pqty,ptot=mk_ticket(3,carton_sup,"PARTIAL_DELIVERY","IN_PROGRESS",22,"PO acknowledged; 2 of 3 partial deliveries received"); live_tickets.append(t)
live_pos.append({"id":"PO-LV-3","ticketId":t["id"],"supplierId":carton_sup["id"],"status":"ACKNOWLEDGED","poDate":iso(days_ago(20)),"value":ptot,"currency":"USD","incoterm":"FOB","contractQty":pqty})
for g in range(2):
    live_grns.append({"id":pid("GRN-LV-3-",g+1,2),"ticketId":t["id"],"poId":"PO-LV-3","grnDate":iso(days_ago(10-g*4)),"receivedQty":round(pqty/3),"status":"COMPLETED","note":f"Partial {g+1} of 3"})
# 4-7: invoice exceptions (price-variance, qty-over, tax-mismatch, duplicate)
exc_defs=[("price-variance","Invoice unit price 6% above PO; routed to Buyer",onboarded_sup[5]),
    ("qty-over","Invoiced qty exceeds GRN-accepted qty; routed to Receiving",onboarded_sup[6]),
    ("tax-mismatch","Tax amount inconsistent with tax code; routed to Tax/Compliance",onboarded_sup[7]),
    ("duplicate-invoice","Duplicate of an existing invoice (supplier+invoiceNo+amount); on HOLD",onboarded_sup[5])]
for k,(etype,note,sup) in enumerate(exc_defs):
    t,it,qty,total=mk_ticket(10+k,sup,"ORDERED","IN_PROGRESS",15+k,f"Invoice match exception: {etype}")
    live_tickets.append(t)
    grn_exists = etype!="missing-GR"
    live_invoices.append({"id":pid("INV-LV-",10+k,2),"ticketId":t["id"],"supplierId":sup["id"],"invoiceNumber":f"SUP-INV-{8800+k}",
        "invoiceDate":iso(days_ago(8)),"amount":total,"taxAmount":round(total*(0.18 if etype!='tax-mismatch' else 0.11),2),
        "currency":sup["currency"],"matchType":"THREE_WAY" if grn_exists else "TWO_WAY","matchStatus":"exception",
        "exceptionType":etype,"routedTo":{"price-variance":"U-BUY1","qty-over":"U-RECV1","tax-mismatch":"U-TAX1","duplicate-invoice":"U-FINMK1"}[etype],
        "onHold":etype=="duplicate-invoice"})
# 8: open NCR -> CAPA, supplier near SUSPENDED trigger (a grade-C supplier w/ a consecutive-below streak)
near_susp=next(s for s in onboarded_sup if s["grade"]=="C")
t,it,qty,total=mk_ticket(20,near_susp,"PARTIAL_DELIVERY","IN_PROGRESS",12,"QC fail -> open NCR -> active CAPA; supplier near SUSPENDED (2 consecutive below-threshold periods)")
live_tickets.append(t)
NCR_LV={"id":"NCR-LV-1","ticketId":t["id"],"supplierId":near_susp["id"],"itemId":it["id"],"deliveryNoteNumber":"DN-77310",
    "deliveryDate":iso(days_ago(10)),"description":"Assay out of specification on incoming lot","percentNonConformance":8.5,
    "disposition":"return","status":"IN_CAPA","raisedBy":"U-QC1"}
live_capas.append({"id":"CAPA-LV-1","ncrId":"NCR-LV-1","supplierId":near_susp["id"],"rootCause":"Supplier process drift on a key step",
    "action":"Supplier 8D corrective action; revalidation of 3 batches","effectivenessReview":"pending","status":"OPEN",
    "consecutiveBelowPeriods":2,"willSuspend":True})
# 9: active return/RMA w/ credit note
t,it,qty,total=mk_ticket(21,onboarded_sup[8],"PARTIAL_DELIVERY","IN_PROGRESS",14,"Active return/RMA mid-flow; credit note posting to creditor ledger")
live_tickets.append(t)
live_returns.append({"id":"RMA-LV-1","rmaNumber":"RMA-2026-018","sourceOrderId":t["id"],"supplierId":onboarded_sup[8]["id"],
    "reason":"defective","productCondition":"rejected at inspection","authorizationStatus":"AUTHORIZED","closureStatus":"SHIPMENT_SCHEDULED",
    "linkedNcrId":None,"shipment":{"carrier":"DHL","label":"issued","date":iso(days_ago(2))}})
live_credit_notes.append({"id":"CN-LV-1","type":"credit","linkedReturnId":"RMA-LV-1","supplierId":onboarded_sup[8]["id"],
    "amount":round(total*0.3,2),"taxAmount":round(total*0.3*0.18,2),"reason":"Return of defective goods - credit","postedToLedger":True})
# 10+11: installments - one PARTIAL_APPROVAL w/ remainder, one overdue
sched_sup=onboarded_sup[2]
live_installments.append({"id":"INST-LV-1","scheduleId":"SCH-LV-1","ticketId":"TKT-LV-022","supplierId":sched_sup["id"],
    "amount":50000,"date":iso(days_ago(5)),"description":"Milestone 1","status":"PARTIAL_APPROVAL","approvedAmount":35000,
    "approvedById":"U-FINMK1","remainderInstallmentId":"INST-LV-1R"})
live_installments.append({"id":"INST-LV-1R","scheduleId":"SCH-LV-1","ticketId":"TKT-LV-022","supplierId":sched_sup["id"],
    "amount":15000,"date":iso(days_ago(5)),"description":"Milestone 1 (remainder)","status":"PENDING","isRemainder":True})
live_installments.append({"id":"INST-LV-2","scheduleId":"SCH-LV-2","ticketId":"TKT-LV-023","supplierId":onboarded_sup[3]["id"],
    "amount":28000,"date":iso(days_ago(31)),"description":"Net-30 invoice now overdue","status":"APPROVED","overdue":True,
    "reminderSent":iso(days_ago(3)),"reminderNote":"~28-day overdue reminder fired"})
write("live_tickets", live_tickets); write("live_requisition_lines", live_lines_hero)
write("live_rfqs", live_rfqs); write("live_quotes", live_quotes); write("live_pos", live_pos)
write("live_grns", live_grns); write("live_invoices", live_invoices); write("live_installments", live_installments)
write("live_returns", live_returns); write("live_capas", live_capas); write("live_credit_notes", live_credit_notes)
DB.update({"live_tickets":len(live_tickets),"live_rfqs":len(live_rfqs),"live_quotes":len(live_quotes),
    "live_invoices":len(live_invoices),"live_installments":len(live_installments),"live_returns":len(live_returns),"live_capas":len(live_capas)})

# ---------- index ----------
index={"company":"Meridian Consumer Health","baseCurrency":"USD","demoToday":iso(TODAY),"seed":SEED,
    "historyWindowMonths":12,"counts":DB,
    "hero":{"requisition":"TKT-HERO","rfq":"RFQ-HERO","note":"cheapest unit (Helvetia) != lowest landed (Synthex); BioCore +7% spike"},
    "kpiNote":"OTIF ~94% (2-factor), perfect-order ~89% (4-factor, < OTIF), DPO ~45d, spend ~$125M/12mo, grades 25A/18B/3C"}
write("_index", index)
print("live + hero written. counts:", {k:DB[k] for k in DB if k.startswith('live')})
print("INDEX:", json.dumps(index["counts"], indent=0)[:400])
