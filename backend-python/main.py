"""SelfDashboard — Python FastAPI Backend
Handles: System stats, Weather, Calendar (iCal/CalDAV), AdGuard, CrowdSec
"""
import os, time, asyncio, json, re, email.utils, datetime
from typing import Optional, List
from pathlib import Path
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

import psutil
import httpx
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="SelfDashboard Python API", version="2.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

# ── Config ────────────────────────────────────────────────────────────────────
ADGUARD_URL   = os.getenv("ADGUARD_URL", "")
ADGUARD_USER  = os.getenv("ADGUARD_USER", "admin")
ADGUARD_PASS  = os.getenv("ADGUARD_PASSWORD", "")
CS_URL        = os.getenv("CROWDSEC_URL", "")
CS_KEY        = os.getenv("CROWDSEC_API_KEY", "")
OWM_KEY       = os.getenv("OPENWEATHER_KEY", "")
ICAL_URLS_STR = os.getenv("ICAL_URLS", "")
CALDAV_URL    = os.getenv("CALDAV_URL", "")
CALDAV_USER   = os.getenv("CALDAV_USER", "")
CALDAV_PASS   = os.getenv("CALDAV_PASSWORD", "")
HOST_PROC     = os.getenv("HOST_PROC", "/proc")
HOST_SYS      = os.getenv("HOST_SYS",  "/sys")
TZ_NAME       = os.getenv("TZ", "Europe/Berlin")
DATA_DIR      = Path(os.getenv("DATA_DIR", "/data"))

try:
    LOCAL_TZ = ZoneInfo(TZ_NAME)
except ZoneInfoNotFoundError:
    LOCAL_TZ = ZoneInfo("UTC")

# simple TTL cache
_cache: dict = {}
def cached(key, ttl, fn):
    now = time.monotonic()
    if key in _cache and now - _cache[key]["ts"] < ttl:
        return _cache[key]["val"]
    val = fn()
    _cache[key] = {"ts": now, "val": val}
    return val

async def acached(key, ttl, coro):
    now = time.monotonic()
    if key in _cache and now - _cache[key]["ts"] < ttl:
        return _cache[key]["val"]
    val = await coro
    _cache[key] = {"ts": now, "val": val}
    return val

# ── Health ────────────────────────────────────────────────────────────────────
@app.get("/health")
def health():
    return {"ok": True}

# ── System ────────────────────────────────────────────────────────────────────
@app.get("/system")
def system_info():
    cpu_pct    = psutil.cpu_percent(interval=0.3)
    cpu_freq   = psutil.cpu_freq()
    mem        = psutil.virtual_memory()
    swap       = psutil.swap_memory()
    net_raw    = psutil.net_io_counters(pernic=True)
    boot_time  = psutil.boot_time()
    uptime_s   = int(time.time() - boot_time)
    temps      = _get_temps()
    net_stats  = [
        {"iface": k, "rxBytes": v.bytes_recv, "txBytes": v.bytes_sent}
        for k, v in net_raw.items()
        if not any(k.startswith(p) for p in ("lo","br-","veth","docker","overlay"))
    ][:4]
    return {
        "cpu":    {"pct": round(cpu_pct,1), "cores": psutil.cpu_count(False), "threads": psutil.cpu_count(), "freqMHz": round(cpu_freq.current) if cpu_freq else 0, "temp": temps.get("cpu")},
        "ram":    {"pct": mem.percent, "totalGB": round(mem.total/1073741824,1), "usedGB": round(mem.used/1073741824,1), "freeGB": round(mem.available/1073741824,1)},
        "swap":   {"pct": swap.percent, "totalGB": round(swap.total/1073741824,1), "usedGB": round(swap.used/1073741824,1)},
        "temps":  temps,
        "network": net_stats,
        "uptime":  uptime_s,
        "uptimeFmt": _fmt_uptime(uptime_s),
        "ts": int(time.time()*1000),
    }

def _get_temps():
    result = {}
    try:
        for sensor, entries in psutil.sensors_temperatures().items():
            for e in entries:
                label = e.label or sensor
                if any(k in label.lower() for k in ["core 0","tctl","cpu","package","k10temp"]):
                    result["cpu"] = round(e.current, 1)
    except Exception: pass
    if not result.get("cpu"):
        result.update(_hwmon_temps())
    return result

def _hwmon_temps():
    result = {}
    try:
        base = Path(HOST_SYS) / "class" / "hwmon"
        if not base.exists(): return result
        for hwmon in base.iterdir():
            name = (hwmon/"name").read_text().strip() if (hwmon/"name").exists() else hwmon.name
            for f in hwmon.glob("temp*_input"):
                try:
                    t = int(f.read_text())/1000
                    lf = f.with_name(f.name.replace("_input","_label"))
                    label = lf.read_text().strip() if lf.exists() else name
                    result[label] = round(t,1)
                    if any(k in name.lower() for k in ["k10temp","coretemp","cpu_thermal"]):
                        result["cpu"] = round(t,1)
                except Exception: pass
    except Exception: pass
    return result

# ── Storage ───────────────────────────────────────────────────────────────────
@app.get("/storage")
def storage():
    parts = []
    for p in psutil.disk_partitions(all=False):
        if any(x in p.fstype for x in ["tmpfs","devtmpfs","squashfs","overlay","cgroup","proc","sysfs"]): continue
        try:
            u = psutil.disk_usage(p.mountpoint)
            parts.append({"device":p.device,"mount":p.mountpoint,"fstype":p.fstype,"totalGB":round(u.total/1073741824,1),"usedGB":round(u.used/1073741824,1),"freeGB":round(u.free/1073741824,1),"pct":u.percent})
        except Exception: pass
    io = {k:{"readMB":round(v.read_bytes/1024/1024),"writeMB":round(v.write_bytes/1024/1024),"readOps":v.read_count,"writeOps":v.write_count}
          for k,v in psutil.disk_io_counters(perdisk=True).items() if not k.startswith("loop")}
    return {"partitions": parts, "diskIO": io}

# ── Weather ───────────────────────────────────────────────────────────────────
@app.get("/weather")
async def weather(
    lat:      float  = Query(53.55),
    lon:      float  = Query(10.00),
    city:     str    = Query("Hamburg"),
    provider: str    = Query("open-meteo"),
    owm_key:  str    = Query("")
):
    key = f"weather:{lat},{lon},{provider}"
    return await acached(key, 600, _fetch_weather(lat, lon, city, provider, owm_key or OWM_KEY))

async def _fetch_weather(lat, lon, city, provider, owm_key):
    if provider == "openweathermap" and owm_key:
        return await _owm(lat, lon, city, owm_key)
    return await _open_meteo(lat, lon, city)

async def _open_meteo(lat, lon, city):
    url = (f"https://api.open-meteo.com/v1/forecast"
           f"?latitude={lat}&longitude={lon}"
           f"&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,apparent_temperature"
           f"&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum"
           f"&timezone=auto&forecast_days=7")
    try:
        async with httpx.AsyncClient(timeout=8) as c:
            r = await c.get(url)
            d = r.json()
        cur = d.get("current", {})
        daily = d.get("daily", {})
        return {
            "provider": "open-meteo", "city": city, "online": True,
            "current": {
                "temp":       round(cur.get("temperature_2m", 0), 1),
                "feelsLike":  round(cur.get("apparent_temperature", 0), 1),
                "humidity":   cur.get("relative_humidity_2m", 0),
                "windKmh":    round(cur.get("wind_speed_10m", 0), 1),
                "code":       cur.get("weather_code", 0),
                "icon":       _wmo_icon(cur.get("weather_code", 0)),
                "description":_wmo_desc(cur.get("weather_code", 0)),
            },
            "forecast": [
                {
                    "date":   daily["time"][i],
                    "code":   daily["weather_code"][i],
                    "icon":   _wmo_icon(daily["weather_code"][i]),
                    "maxT":   round(daily["temperature_2m_max"][i], 1),
                    "minT":   round(daily["temperature_2m_min"][i], 1),
                    "precip": round(daily["precipitation_sum"][i], 1),
                }
                for i in range(min(7, len(daily.get("time", []))))
            ]
        }
    except Exception as e:
        return {"online": False, "error": str(e), "city": city}

async def _owm(lat, lon, city, key):
    try:
        async with httpx.AsyncClient(timeout=8) as c:
            cur_r, fc_r = await asyncio.gather(
                c.get(f"https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={key}&units=metric&lang=de"),
                c.get(f"https://api.openweathermap.org/data/2.5/forecast?lat={lat}&lon={lon}&appid={key}&units=metric&lang=de&cnt=35"),
            )
        cur = cur_r.json()
        fc  = fc_r.json()
        return {
            "provider": "openweathermap", "city": city, "online": True,
            "current": {
                "temp":       round(cur["main"]["temp"], 1),
                "feelsLike":  round(cur["main"]["feels_like"], 1),
                "humidity":   cur["main"]["humidity"],
                "windKmh":    round(cur["wind"]["speed"] * 3.6, 1),
                "description":cur["weather"][0]["description"],
                "icon":       f"https://openweathermap.org/img/wn/{cur['weather'][0]['icon']}@2x.png",
                "code":       cur["weather"][0]["id"],
            },
            "forecast": [
                {
                    "date":  item["dt_txt"][:10],
                    "icon":  f"https://openweathermap.org/img/wn/{item['weather'][0]['icon']}.png",
                    "maxT":  round(item["main"]["temp_max"], 1),
                    "minT":  round(item["main"]["temp_min"], 1),
                    "precip":round(item.get("rain", {}).get("3h", 0), 1),
                    "desc":  item["weather"][0]["description"],
                }
                for item in fc.get("list", [])[::8][:7]
            ]
        }
    except Exception as e:
        return {"online": False, "error": str(e), "city": city}

WMO_ICONS = {
    0:"☀️",1:"🌤",2:"⛅",3:"☁️",45:"🌫",48:"🌫",
    51:"🌦",53:"🌦",55:"🌧",61:"🌧",63:"🌧",65:"🌧",
    71:"🌨",73:"🌨",75:"❄️",77:"🌨",
    80:"🌦",81:"🌧",82:"⛈",
    85:"🌨",86:"❄️",
    95:"⛈",96:"⛈",99:"⛈",
}
WMO_DESC = {
    0:"Klar",1:"Überwiegend klar",2:"Teilweise bewölkt",3:"Bedeckt",
    45:"Nebel",48:"Eisnebel",
    51:"Leichter Nieselregen",53:"Mäßiger Nieselregen",55:"Starker Nieselregen",
    61:"Leichter Regen",63:"Mäßiger Regen",65:"Starker Regen",
    71:"Leichter Schneefall",73:"Mäßiger Schneefall",75:"Starker Schneefall",
    80:"Leichte Regenschauer",81:"Mäßige Regenschauer",82:"Starke Regenschauer",
    95:"Gewitter",96:"Gewitter mit Hagel",99:"Starkes Gewitter mit Hagel",
}
def _wmo_icon(code): return WMO_ICONS.get(code, "🌡")
def _wmo_desc(code): return WMO_DESC.get(code, f"Code {code}")

# ── Calendar ──────────────────────────────────────────────────────────────────
@app.get("/calendar")
async def calendar():
    return await acached("calendar", 300, _fetch_all_calendars())

async def _fetch_all_calendars():
    events = []
    ical_urls = [u.strip() for u in ICAL_URLS_STR.split(",") if u.strip()]
    tasks = [_fetch_ical(u) for u in ical_urls]
    if CALDAV_URL and CALDAV_USER:
        tasks.append(_fetch_caldav())
    results = await asyncio.gather(*tasks, return_exceptions=True)
    for r in results:
        if isinstance(r, list):
            events.extend(r)
    events.sort(key=lambda e: e.get("start", ""))
    return events[:60]

async def _fetch_ical(url: str):
    try:
        async with httpx.AsyncClient(timeout=10, follow_redirects=True) as c:
            r = await c.get(url)
        return _parse_ical(r.text)
    except Exception as e:
        return []

async def _fetch_caldav():
    try:
        now = datetime.datetime.now(LOCAL_TZ)
        end = now + datetime.timedelta(days=60)
        report_body = f"""<?xml version="1.0" encoding="utf-8" ?>
<C:calendar-query xmlns:D="DAV:" xmlns:C="urn:ietf:params:xml:ns:caldav">
  <D:prop><D:getetag/><C:calendar-data/></D:prop>
  <C:filter>
    <C:comp-filter name="VCALENDAR">
      <C:comp-filter name="VEVENT">
        <C:time-range start="{now.strftime('%Y%m%dT%H%M%SZ')}" end="{end.strftime('%Y%m%dT%H%M%SZ')}"/>
      </C:comp-filter>
    </C:comp-filter>
  </C:filter>
</C:calendar-query>"""
        async with httpx.AsyncClient(auth=(CALDAV_USER, CALDAV_PASS), timeout=12) as c:
            r = await c.request("REPORT", CALDAV_URL+"/calendars/"+CALDAV_USER+"/", content=report_body,
                                headers={"Content-Type":"application/xml; charset=utf-8","Depth":"1"})
        # Extract calendar-data from XML response
        events = []
        for match in re.finditer(r'<cal:calendar-data[^>]*>(.*?)</cal:calendar-data>', r.text, re.DOTALL):
            events.extend(_parse_ical(match.group(1)))
        return events
    except Exception as e:
        return []

def _parse_ical(text: str) -> list:
    events = []
    for block in re.split(r'BEGIN:VEVENT', text):
        if 'END:VEVENT' not in block: continue
        block = block[:block.index('END:VEVENT')]
        def prop(name):
            m = re.search(rf'^{name}(?:;[^:]*)?:(.*)', block, re.MULTILINE)
            return m.group(1).strip() if m else ''
        def parse_dt(val):
            if not val: return ''
            val = val.split(';')[-1].replace(':', '').replace('Z','').strip()
            try:
                if len(val) == 8: return val[:4]+'-'+val[4:6]+'-'+val[6:]
                return val[:4]+'-'+val[4:6]+'-'+val[6:8]+'T'+val[9:11]+':'+val[11:13]
            except: return val
        summary = prop('SUMMARY')
        dtstart = parse_dt(prop('DTSTART'))
        dtend   = parse_dt(prop('DTEND'))
        if not summary or not dtstart: continue
        events.append({ "title": summary, "start": dtstart, "end": dtend,
                        "location": prop('LOCATION'), "description": prop('DESCRIPTION')[:200] })
    return events

# ── AdGuard ───────────────────────────────────────────────────────────────────
@app.get("/adguard")
async def adguard():
    if not ADGUARD_URL: return _mock_adguard()
    auth = (ADGUARD_USER, ADGUARD_PASS)
    try:
        async with httpx.AsyncClient(auth=auth, timeout=6) as c:
            s, t, p = await asyncio.gather(
                c.get(f"{ADGUARD_URL}/control/stats"),
                c.get(f"{ADGUARD_URL}/control/status"),
                c.get(f"{ADGUARD_URL}/control/stats/top"),
                return_exceptions=True)
        s = s.json() if not isinstance(s, Exception) else {}
        t = t.json() if not isinstance(t, Exception) else {}
        p = p.json() if not isinstance(p, Exception) else {}
        q = s.get("num_dns_queries", 0)
        b = s.get("num_blocked_filtering", 0)
        return {"online":True,"queries":q,"blocked":b,"blockedPct":round(b/q*100,1) if q else 0,
                "avgMs":round(s.get("avg_processing_time",0)*1000,1),"version":t.get("version",""),
                "topBlocked":(p.get("blocked_filtering") or [])[:10],"topClients":(p.get("top_clients") or [])[:5]}
    except Exception as e:
        return {**_mock_adguard(), "online": False, "error": str(e)}

def _mock_adguard():
    return {"online":False,"queries":8412,"blocked":1934,"blockedPct":23.0,"avgMs":1.8,"version":"0.107.43",
            "topBlocked":[{"name":"ads.google.com","count":412},{"name":"tracking.meta.com","count":298},{"name":"doubleclick.net","count":187},{"name":"telemetry.microsoft.com","count":89}]}

# ── CrowdSec ──────────────────────────────────────────────────────────────────
@app.get("/crowdsec")
async def crowdsec():
    if not CS_URL or not CS_KEY: return _mock_cs()
    hdrs = {"X-Api-Key": CS_KEY}
    try:
        async with httpx.AsyncClient(headers=hdrs, timeout=6) as c:
            ar, dr = await asyncio.gather(
                c.get(f"{CS_URL}/v1/alerts",    params={"limit":50}),
                c.get(f"{CS_URL}/v1/decisions", params={"limit":20}),
                return_exceptions=True)
        alerts = ar.json() if not isinstance(ar, Exception) else []
        decs   = dr.json() if not isinstance(dr, Exception) else []
        def fmt(a):
            s = a.get("scenario","")
            tp = "brute-force" if any(x in s for x in ["ssh","bf"]) else "port-scan" if any(x in s for x in ["scan","probe"]) else "web-attack" if "http" in s else "other"
            return {"ip":a.get("source",{}).get("ip"),"country":a.get("source",{}).get("cn"),"latitude":a.get("source",{}).get("latitude"),"longitude":a.get("source",{}).get("longitude"),"scenario":s,"type":tp,"decisions":len(a.get("decisions") or []),"createdAt":a.get("created_at")}
        return {"online":True,"totalAlerts":len(alerts),"totalDecisions":len(decs),"alerts":[fmt(a) for a in (alerts or [])]}
    except Exception as e:
        return {**_mock_cs(), "online": False, "error": str(e)}

def _mock_cs():
    return {"online":False,"totalAlerts":5,"alerts":[
        {"ip":"185.220.101.47","country":"RU","type":"brute-force","scenario":"crowdsecurity/ssh-bf","decisions":1,"createdAt":"2026-05-10T10:00:00Z","latitude":55.7,"longitude":37.6},
        {"ip":"45.148.10.23","country":"CN","type":"port-scan","scenario":"crowdsecurity/http-probing","decisions":1,"createdAt":"2026-05-10T09:58:00Z","latitude":39.9,"longitude":116.4},
        {"ip":"191.96.168.5","country":"BR","type":"web-attack","scenario":"crowdsecurity/http-crawl","decisions":1,"createdAt":"2026-05-10T09:55:00Z","latitude":-23.5,"longitude":-46.6},
    ]}

def _fmt_uptime(s):
    d,s = divmod(s,86400); h,s = divmod(s,3600); m = s//60
    return f"{d}d {h}h {m}m" if d else (f"{h}h {m}m" if h else f"{m}m")
