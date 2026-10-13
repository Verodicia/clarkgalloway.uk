import os
import sys
import json
import time
import urllib.request
import urllib.parse
import tarfile
import io

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PUBLIC_FLAGS = os.path.join(BASE_DIR, "public", "flags")
DIR_INTL = os.path.join(PUBLIC_FLAGS, "international")
DIR_HIST = os.path.join(PUBLIC_FLAGS, "historical")
DIR_CITY = os.path.join(PUBLIC_FLAGS, "cities")

os.makedirs(DIR_INTL, exist_ok=True)
os.makedirs(DIR_HIST, exist_ok=True)
os.makedirs(DIR_CITY, exist_ok=True)

USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

FILE_TARGETS = {
    # International
    "File:Flag of NATO.svg": os.path.join(DIR_INTL, "nato.svg"),
    "File:Flag of the African Union.svg": os.path.join(DIR_INTL, "au.svg"),
    "File:Flag of the Arab League.svg": os.path.join(DIR_INTL, "arab.svg"),
    "File:Olympic flag.svg": os.path.join(DIR_INTL, "olympics.svg"),
    "File:Flag of the Red Cross.svg": os.path.join(DIR_INTL, "red-cross.svg"),
    "File:Flag of the Commonwealth of Nations (1976–2013).svg": os.path.join(DIR_INTL, "commonwealth.svg"),
    "File:Flag of the Nordic Council.svg": os.path.join(DIR_INTL, "nordic-council.svg"),
    "File:Flag of OPEC.svg": os.path.join(DIR_INTL, "opec.svg"),
    "File:Flag of CARICOM.svg": os.path.join(DIR_INTL, "caricom.svg"),

    # Historical
    "File:Flag of East Germany.svg": os.path.join(DIR_HIST, "ddr.svg"),
    "File:Flag of Yugoslavia (1946-1992).svg": os.path.join(DIR_HIST, "yugoslavia.svg"),
    "File:Flag of the Ottoman Empire.svg": os.path.join(DIR_HIST, "ottoman.svg"),
    "File:Flag of Prussia (1892-1918).svg": os.path.join(DIR_HIST, "prussia.svg"),
    "File:Civil ensign of Austria-Hungary (1869-1918).svg": os.path.join(DIR_HIST, "austria-hungary.svg"),
    "File:Flag of the Russian Empire (black-yellow-white).svg": os.path.join(DIR_HIST, "russian-empire.svg"),
    "File:Flag of the Qing dynasty (1889-1912).svg": os.path.join(DIR_HIST, "qing.svg"),
    "File:Flag of Texas.svg": os.path.join(DIR_HIST, "texas-republic.svg"),
    "File:Flag of South Vietnam.svg": os.path.join(DIR_HIST, "south-vietnam.svg"),
    "File:Byzantine imperial flag, 14th century (firesteels vesion).svg": os.path.join(DIR_HIST, "byzantine.svg"),
    "File:Roman SPQR banner.svg": os.path.join(DIR_HIST, "spqr.svg"),

    # Cities
    "File:Flag of Chicago, Illinois.svg": os.path.join(DIR_CITY, "chicago.svg"),
    "File:Flag of Washington, D.C..svg": os.path.join(DIR_CITY, "washington-dc.svg"),
    "File:Flag of Amsterdam.svg": os.path.join(DIR_CITY, "amsterdam.svg"),
    "File:Flag of the City of London.svg": os.path.join(DIR_CITY, "london.svg"),
    "File:Flag of Paris.svg": os.path.join(DIR_CITY, "paris.svg"),
    "File:Flag of Tokyo Prefecture.svg": os.path.join(DIR_CITY, "tokyo.svg"),
    "File:Flag of the Republic of Venice.svg": os.path.join(DIR_CITY, "venice.svg"),
    "File:Flag of Berlin.svg": os.path.join(DIR_CITY, "berlin.svg"),
    "File:Bandera de la ciudad de Madrid.svg": os.path.join(DIR_CITY, "madrid.svg"),
    "File:Flag of Rome.svg": os.path.join(DIR_CITY, "rome.svg"),
    "File:Flag of Los Angeles, California.svg": os.path.join(DIR_CITY, "los-angeles.svg"),
    "File:Flag of Toronto, Canada.svg": os.path.join(DIR_CITY, "toronto.svg"),
    "File:Bandeira da cidade do Rio de Janeiro.svg": os.path.join(DIR_CITY, "rio-de-janeiro.svg"),
    "File:Bandera de la Ciudad de Buenos Aires.svg": os.path.join(DIR_CITY, "buenos-aires.svg"),
    "File:Flag of Montreal.svg": os.path.join(DIR_CITY, "montreal.svg"),
    "File:Flag of Barcelona.svg": os.path.join(DIR_CITY, "barcelona.svg"),
}

# 1. Existing local copies
import shutil
shutil.copy(os.path.join(PUBLIC_FLAGS, "countries", "un.svg"), os.path.join(DIR_INTL, "un.svg"))
shutil.copy(os.path.join(PUBLIC_FLAGS, "countries", "eu.svg"), os.path.join(DIR_INTL, "eu.svg"))
shutil.copy(os.path.join(PUBLIC_FLAGS, "countries", "su.svg"), os.path.join(DIR_HIST, "su.svg"))

# ASEAN from flag-icons
try:
    flag_icons_url = "https://registry.npmjs.org/flag-icons/-/flag-icons-7.5.0.tgz"
    req = urllib.request.Request(flag_icons_url, headers={"User-Agent": USER_AGENT})
    content = urllib.request.urlopen(req, timeout=10).read()
    with tarfile.open(fileobj=io.BytesIO(content), mode="r:gz") as tar:
        f = tar.extractfile("package/flags/4x3/asean.svg")
        if f:
            with open(os.path.join(DIR_INTL, "asean.svg"), "wb") as out:
                out.write(f.read())
            print("Extracted ASEAN from flag-icons package.")
except Exception as e:
    print("Warning on ASEAN:", e)

# 2. Batch query all Wikimedia URLs
titles_list = list(FILE_TARGETS.keys())
api_url = f"https://commons.wikimedia.org/w/api.php?action=query&titles={urllib.parse.quote('|'.join(titles_list))}&prop=imageinfo&iiprop=url&format=json"
api_req = urllib.request.Request(api_url, headers={"User-Agent": USER_AGENT})
with urllib.request.urlopen(api_req, timeout=15) as resp:
    data = json.loads(resp.read().decode('utf-8'))

url_map = {}
for pid, page in data['query']['pages'].items():
    if int(pid) > 0 and 'imageinfo' in page and len(page['imageinfo']) > 0:
        url_map[page['title']] = page['imageinfo'][0]['url']

print(f"Got {len(url_map)}/{len(titles_list)} URLs from Wikimedia.")

# 3. Download each with short sleep to avoid 429
success_count = 0
for title, target_path in FILE_TARGETS.items():
    if os.path.exists(target_path) and os.path.getsize(target_path) > 500:
        print(f"Already exists: {os.path.basename(target_path)}")
        success_count += 1
        continue
    
    url = url_map.get(title)
    if not url:
        print(f"No URL for {title}")
        continue
    
    try:
        time.sleep(0.4)
        dl_req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
        with urllib.request.urlopen(dl_req, timeout=15) as dl_resp:
            content = dl_resp.read()
        with open(target_path, "wb") as f:
            f.write(content)
        print(f"Downloaded {os.path.basename(target_path)} ({len(content)} bytes)")
        success_count += 1
    except Exception as e:
        print(f"Failed {title}: {e}")

print(f"Done! {success_count} files ready.")
