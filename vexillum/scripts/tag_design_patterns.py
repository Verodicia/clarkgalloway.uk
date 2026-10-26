import json
import os

DATA_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "src", "data", "flags.json")

with open(DATA_PATH, "r", encoding="utf-8") as f:
    flags = json.load(f)

# Specific explicit sets by id / code
NORDIC_SET = {"dk", "se", "no", "fi", "is", "fo", "ax"}

UNIQUE_SHAPE_SET = {"np", "ch", "va", "US-OH", "city-venice"}

CRESCENT_SET = {
    "dz", "az", "km", "ly", "my", "mv", "mr", "pk", "sg", "tn", "tr", "tm", "uz",
    "US-SC", "org-arab", "hist-ottoman", "bn", "np"
}

SUN_SET = {
    "ar", "uy", "jp", "ph", "kz", "mw", "na", "ag", "mk", "rw", "bd", "pw", "ne",
    "ki", "tw", "np", "US-AZ", "US-NM", "US-SD", "city-tokyo", "org-caricom"
}

SALTIRE_SET = {
    "gb-sct", "jm", "bi", "gb-nir", "ES-PV", "je", "US-AL", "US-FL",
    "city-amsterdam", "city-rio-de-janeiro", "ES-PV", "ES-GA"
}

CANTON_SET = {
    "us", "au", "nz", "gr", "my", "lr", "uy", "cl", "tg", "ws", "fj", "tv", "to",
    "ge", "US-HI", "US-GA", "hist-texas-republic", "US-TX", "city-london", "bm", "ky", "ms", "vg"
}

ANIMAL_SET = {
    "gb-wls", "bt", "mx", "lk", "al", "eg", "ec", "me", "rs", "pg", "dm", "ug",
    "gt", "zw", "fj", "bm", "es", "US-CA", "US-LA", "US-WY", "US-OR", "city-berlin",
    "city-madrid", "city-venice", "hist-prussia", "hist-qing", "hist-spqr",
    "city-buenos-aires", "org-nordic", "ad", "md", "pl", "hr", "ke", "kz"
}

STAR_SET = {
    "us", "cn", "au", "nz", "br", "org-eu", "org-au", "vn", "so", "cl", "cu",
    "il", "ba", "fm", "sg", "tr", "pk", "ve", "pa", "hn", "ph", "ma", "gh",
    "sn", "cm", "tg", "lr", "mm", "kp", "city-chicago", "city-washington-dc",
    "cf", "cd", "cg", "dj", "gq", "gw", "st", "cv", "km", "dz", "ly", "tn",
    "mr", "az", "tm", "uz", "my", "ws", "sb", "tv", "to", "pg", "nr", "mh",
    "gd", "kn", "lc", "vc", "sr", "py", "bo", "sy", "jo", "iq", "ye", "tj",
    "US-TX", "US-AK", "US-AR", "US-IN", "US-MO", "US-TN", "US-OH", "US-NC",
    "hist-su", "hist-ddr", "hist-yugoslavia", "hist-texas-republic"
}

TRICOLOR_SET = {
    "fr", "it", "ie", "de", "nl", "ru", "be", "ro", "td", "co", "ec", "ve",
    "mx", "hu", "at", "in", "ng", "bg", "ee", "lt", "ga", "sl", "ye", "eg",
    "sy", "iq", "bo", "py", "am", "ci", "gn", "ml", "ne", "sn", "tz", "ae",
    "kw", "om", "ps", "sd", "ss", "ke", "mw", "mz", "zw", "cg", "cm", "bj",
    "lu", "rs", "si", "sk", "hr", "uz", "tj", "az", "gh", "us-ia", "hist-ddr",
    "hist-yugoslavia", "hist-russian-empire", "city-rome", "city-paris", "city-los-angeles"
}

for fl in flags:
    cid = fl.get("code", "").lower()
    fid = fl.get("id", "").lower()
    patterns = []
    
    # Check Nordic
    if cid in NORDIC_SET or fid.replace("country-", "") in NORDIC_SET:
        patterns.append("nordic-cross")
        
    # Check Unique Shape
    if cid in UNIQUE_SHAPE_SET or fid.replace("country-", "") in UNIQUE_SHAPE_SET or fid in UNIQUE_SHAPE_SET or fl.get("code") in UNIQUE_SHAPE_SET:
        patterns.append("unique-shape")
        
    # Check Crescent
    if cid in CRESCENT_SET or fid.replace("country-", "") in CRESCENT_SET or fid in CRESCENT_SET or fl.get("code") in CRESCENT_SET:
        patterns.append("crescent")
        
    # Check Sun
    if cid in SUN_SET or fid.replace("country-", "") in SUN_SET or fid in SUN_SET or fl.get("code") in SUN_SET:
        patterns.append("sun")
        
    # Check Saltire
    if cid in SALTIRE_SET or fid.replace("country-", "") in SALTIRE_SET or fid in SALTIRE_SET or fl.get("code") in SALTIRE_SET:
        patterns.append("saltire")
        
    # Check Animal
    if cid in ANIMAL_SET or fid.replace("country-", "") in ANIMAL_SET or fid in ANIMAL_SET or fl.get("code") in ANIMAL_SET:
        patterns.append("animal")
        
    # Check Canton
    if cid in CANTON_SET or fid.replace("country-", "") in CANTON_SET or fid in CANTON_SET or fl.get("code") in CANTON_SET:
        patterns.append("canton")
        
    # Check Stars
    if cid in STAR_SET or fid.replace("country-", "") in STAR_SET or fid in STAR_SET or fl.get("code") in STAR_SET:
        patterns.append("stars")
        
    # Check Tricolor
    if cid in TRICOLOR_SET or fid.replace("country-", "") in TRICOLOR_SET or fid in TRICOLOR_SET or fl.get("code") in TRICOLOR_SET:
        patterns.append("tricolor")
        
    fl["designPatterns"] = patterns

# Summary count
from collections import Counter
pattern_counts = Counter()
for fl in flags:
    for p in fl["designPatterns"]:
        pattern_counts[p] += 1

print("Vexillological Design Pattern Counts:")
for p, c in pattern_counts.most_common():
    print(f"  - {p}: {c} flags")

with open(DATA_PATH, "w", encoding="utf-8") as f:
    json.dump(flags, f, indent=2, ensure_ascii=False)

print("Saved flags.json with designPatterns!")
