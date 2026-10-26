import os
import json

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_FILE = os.path.join(BASE_DIR, "src", "data", "flags.json")

# 197 Sovereign Nations (193 UN Members + Vatican + Palestine + Taiwan + Kosovo)
SOVEREIGN_CODES = {
    'af', 'al', 'dz', 'ad', 'ao', 'ag', 'ar', 'am', 'au', 'at', 'az', 'bs', 'bh', 'bd', 'bb',
    'by', 'be', 'bz', 'bj', 'bt', 'bo', 'ba', 'bw', 'br', 'bn', 'bg', 'bf', 'bi', 'cv', 'kh',
    'cm', 'ca', 'cf', 'td', 'cl', 'cn', 'co', 'km', 'cg', 'cd', 'cr', 'ci', 'hr', 'cu', 'cy',
    'cz', 'dk', 'dj', 'dm', 'do', 'ec', 'eg', 'sv', 'gq', 'er', 'ee', 'sz', 'et', 'fj', 'fi',
    'fr', 'ga', 'gm', 'ge', 'de', 'gh', 'gr', 'gd', 'gt', 'gn', 'gw', 'gy', 'ht', 'hn', 'hu',
    'is', 'in', 'id', 'ir', 'iq', 'ie', 'il', 'it', 'jm', 'jp', 'jo', 'kz', 'ke', 'ki', 'kp',
    'kr', 'kw', 'kg', 'la', 'lv', 'lb', 'ls', 'lr', 'ly', 'li', 'lt', 'lu', 'mg', 'mw', 'my',
    'mv', 'ml', 'mt', 'mh', 'mr', 'mu', 'mx', 'fm', 'md', 'mc', 'mn', 'me', 'ma', 'mz', 'mm',
    'na', 'nr', 'np', 'nl', 'nz', 'ni', 'ne', 'ng', 'mk', 'no', 'om', 'pk', 'pw', 'ps', 'pa',
    'pg', 'py', 'pe', 'ph', 'pl', 'pt', 'qa', 'ro', 'ru', 'rw', 'kn', 'lc', 'vc', 'ws', 'sm',
    'st', 'sa', 'sn', 'rs', 'sc', 'sl', 'sg', 'sk', 'si', 'sb', 'so', 'za', 'ss', 'es', 'lk',
    'sd', 'sr', 'se', 'ch', 'sy', 'tj', 'tz', 'th', 'tl', 'tg', 'to', 'tt', 'tn', 'tr', 'tm',
    'tv', 'ug', 'ua', 'ae', 'gb', 'us', 'uy', 'uz', 'vu', 'va', 've', 'vn', 'ye', 'zm', 'zw',
    'tw', 'xk'
}

# Easy Tier Sovereign Nations & Famous States (High recognition)
EASY_CODES = {
    # Americas
    'us', 'ca', 'mx', 'br', 'ar', 'co', 'cl', 'pe', 'cu', 'jm',
    'US-CA', 'US-TX', 'US-NY', 'US-FL', 'US-HI', 'US-AK', 'US-CO', 'US-AZ', 'US-OH',
    'CA-QC', 'CA-ON', 'CA-BC',
    # Europe
    'gb', 'fr', 'de', 'it', 'es', 'ch', 'nl', 'be', 'se', 'no', 'dk', 'fi', 'ie', 'pt', 'gr', 'pl', 'ua', 'at', 'ru', 'tr', 'va',
    'GB-ENG', 'GB-SCT', 'GB-WLS', 'DE-BY', 'DE-BE', 'ES-CT', 'ES-PV',
    # Asia
    'jp', 'cn', 'in', 'kr', 'kp', 'sa', 'ae', 'il', 'th', 'vn', 'ph', 'id', 'my', 'sg', 'np',
    # Africa
    'eg', 'za', 'ng', 'ke', 'ma', 'gh', 'et', 'sn', 'mg',
    # Oceania
    'au', 'nz', 'fj', 'AU-NSW', 'AU-VIC'
}

# Master Tier (Obscure, rare islands, microstates, historic territories)
MASTER_CODES = {
    'ad', 'li', 'mc', 'sm', 'mt', 'md', 'mk', 'me', 'ba', 'al', 'by',
    'bt', 'bn', 'mv', 'la', 'kg', 'tj', 'tm', 'tl', 'bh', 'ye',
    'km', 'dj', 'sz', 'ls', 'mr', 'st', 'sc', 'sl', 'tg', 'gw', 'er', 'gq', 'cv', 'bi', 'cf', 'td', 'ss',
    'bz', 'gy', 'sr', 'bb', 'tt', 'lc', 'gd', 'ag', 'kn', 'dm', 'vc',
    'pw', 'fm', 'mh', 'ki', 'nr', 'tv', 'sb', 'vu', 'to', 'ws',
    # Dependencies
    'aq', 'bv', 'cp', 'dg', 'fk', 'fo', 'gl', 'io', 'ms', 'nf', 'nu', 'pn', 'pm', 'sh', 'sj', 'tk', 'wf', 'eh'
}

# Duplicate / non-country codes in country.json to discard
DISCARD_CODES = {
    'es-pv', 'es-ct', 'es-ga', 'gb-eng', 'gb-nir', 'gb-sct', 'gb-wls',
    'un', 'eu', 'asean', 'arab', 'cefta', 'eac', 'pc', 'xx', 'sh-ac', 'sh-hl', 'sh-ta'
}

with open(DATA_FILE, 'r', encoding='utf-8') as f:
    existing_flags = json.load(f)

curated_flags = []

for flag in existing_flags:
    code_lower = flag['code'].lower()

    # Discard non-country duplicates
    if flag['type'] == 'country' and code_lower in DISCARD_CODES:
        continue

    # Clean & standardize
    f_copy = dict(flag)

    if flag['type'] == 'country':
        if code_lower in SOVEREIGN_CODES:
            f_copy['category'] = 'Sovereign Country'
            f_copy['isSovereign'] = True
        else:
            f_copy['category'] = 'Territory / Dependency'
            f_copy['isSovereign'] = False

        # Assign balanced difficulty
        if code_lower in EASY_CODES:
            f_copy['difficulty'] = 1
        elif code_lower in MASTER_CODES:
            f_copy['difficulty'] = 3
        else:
            f_copy['difficulty'] = 2
    else:
        f_copy['isSovereign'] = False
        # Subdivision difficulty
        if flag['code'] in EASY_CODES:
            f_copy['difficulty'] = 1
        elif flag.get('difficulty') is not None:
            f_copy['difficulty'] = flag['difficulty']
        else:
            f_copy['difficulty'] = 2

    # Capital / Continent sanity
    if f_copy['code'].lower() == 'aq':
        f_copy['continent'] = 'Antarctica'
        f_copy['capital'] = 'N/A'

    curated_flags.append(f_copy)

# Verify counts
sovereign_count = sum(1 for f in curated_flags if f.get('isSovereign') is True)
country_type_count = sum(1 for f in curated_flags if f['type'] == 'country')
subdivision_count = sum(1 for f in curated_flags if f['type'] == 'subdivision')

print(f"Total curated flags: {len(curated_flags)}")
print(f"Sovereign Countries: {sovereign_count}")
print(f"Total Nations & Territories: {country_type_count}")
print(f"Global Subdivisions: {subdivision_count}")

# Save back to flags.json
with open(DATA_FILE, 'w', encoding='utf-8') as f:
    json.dump(curated_flags, f, indent=2, ensure_ascii=False)

print("Saved cleanly to src/data/flags.json!")
