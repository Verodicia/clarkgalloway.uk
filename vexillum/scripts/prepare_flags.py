import os
import sys
import json
import urllib.request
import tarfile
import io

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PUBLIC_FLAGS_COUNTRIES = os.path.join(BASE_DIR, "public", "flags", "countries")
PUBLIC_FLAGS_SUBDIVISIONS = os.path.join(BASE_DIR, "public", "flags", "subdivisions")
DATA_DIR = os.path.join(BASE_DIR, "src", "data")

os.makedirs(PUBLIC_FLAGS_COUNTRIES, exist_ok=True)
os.makedirs(PUBLIC_FLAGS_SUBDIVISIONS, exist_ok=True)
os.makedirs(DATA_DIR, exist_ok=True)

print("1. Downloading flag-icons npm package for country flags...")
flag_icons_url = "https://registry.npmjs.org/flag-icons/-/flag-icons-7.5.0.tgz"
req = urllib.request.Request(flag_icons_url, headers={"User-Agent": "Mozilla/5.0"})
content = urllib.request.urlopen(req).read()

country_metadata = []
country_count = 0
with tarfile.open(fileobj=io.BytesIO(content), mode="r:gz") as tar:
    # Extract country.json
    try:
        f = tar.extractfile("package/country.json")
        if f:
            country_metadata = json.loads(f.read().decode("utf-8"))
    except Exception as e:
        print("Error reading country.json:", e)

    # Extract 4x3 SVGs
    for member in tar.getmembers():
        if member.name.startswith("package/flags/4x3/") and member.name.endswith(".svg"):
            code = os.path.basename(member.name).replace(".svg", "")
            dest_path = os.path.join(PUBLIC_FLAGS_COUNTRIES, f"{code}.svg")
            f = tar.extractfile(member)
            if f:
                with open(dest_path, "wb") as out:
                    out.write(f.read())
                country_count += 1

print(f"Extracted {country_count} country flags.")

print("2. Downloading subdivision flags from fonttools/region-flags...")
region_url = "https://github.com/fonttools/region-flags/archive/refs/heads/gh-pages.tar.gz"
req2 = urllib.request.Request(region_url, headers={"User-Agent": "Mozilla/5.0"})
content2 = urllib.request.urlopen(req2).read()

subdivision_count = 0
with tarfile.open(fileobj=io.BytesIO(content2), mode="r:gz") as tar:
    for member in tar.getmembers():
        if "/svg/" in member.name and member.name.endswith(".svg"):
            filename = os.path.basename(member.name)
            if "-" in filename:  # It's a subdivision!
                dest_path = os.path.join(PUBLIC_FLAGS_SUBDIVISIONS, filename)
                f = tar.extractfile(member)
                if f:
                    with open(dest_path, "wb") as out:
                        out.write(f.read())
                    subdivision_count += 1
            else:  # It's a country flag with true canonical aspect ratio! (e.g. CH.svg, VA.svg, NP.svg)
                country_code = filename[:-4].lower()
                dest_path = os.path.join(PUBLIC_FLAGS_COUNTRIES, f"{country_code}.svg")
                f = tar.extractfile(member)
                if f:
                    with open(dest_path, "wb") as out:
                        out.write(f.read())

print(f"Extracted {subdivision_count} subdivision flags.")

# Curated names and metadata for subdivisions
US_STATES = {
    "US-AL": ("Alabama", "Montgomery", "Yellowhammer State - features St. Andrew's cross", ["white", "red"], 1),
    "US-AK": ("Alaska", "Juneau", "Designed by 13-year-old Benny Benson, features the Big Dipper and North Star", ["blue", "yellow"], 1),
    "US-AZ": ("Arizona", "Phoenix", "Copper star honoring copper mining with rays of red and gold setting sun", ["red", "yellow", "blue", "copper"], 1),
    "US-AR": ("Arkansas", "Little Rock", "25 white stars indicate Arkansas was the 25th state admitted to the Union", ["red", "white", "blue"], 2),
    "US-CA": ("California", "Sacramento", "Features the extinct California grizzly bear Monarch and the historic red star", ["white", "red", "brown", "green"], 1),
    "US-CO": ("Colorado", "Denver", "Red 'C' stands for Colorado ('colored red'), enclosing a golden disk", ["blue", "white", "red", "yellow"], 1),
    "US-CT": ("Connecticut", "Hartford", "Motto 'Qui Transtulit Sustinet' with three grapevines", ["blue", "white", "green", "purple"], 2),
    "US-DE": ("Delaware", "Dover", "Colonial blue and buff diamond commemorating the First State", ["blue", "buff", "green", "yellow"], 2),
    "US-FL": ("Florida", "Tallahassee", "Red saltire on white field with state seal depicting a Seminole woman", ["white", "red", "yellow", "blue"], 1),
    "US-GA": ("Georgia", "Atlanta", "Three alternating red and white stripes with blue canton and 13 stars", ["red", "white", "blue", "yellow"], 1),
    "US-HI": ("Hawaii", "Honolulu", "Union Jack in the canton representing historic British ties, with 8 stripes for major islands", ["red", "white", "blue"], 1),
    "US-ID": ("Idaho", "Boise", "State seal featuring a miner, woman representing equality, and agricultural symbols", ["blue", "gold", "green"], 2),
    "US-IL": ("Illinois", "Springfield", "Bald eagle clutching a banner with state motto on a white field", ["white", "blue", "red", "brown"], 2),
    "US-IN": ("Indiana", "Indianapolis", "Golden torch representing liberty and enlightenment surrounded by 19 stars", ["blue", "gold"], 1),
    "US-IA": ("Iowa", "Des Moines", "Vertical tricolor of blue, white, and red with flying eagle carrying streamer", ["blue", "white", "red"], 1),
    "US-KS": ("Kansas", "Topeka", "State flower (sunflower) crest and seal depicting pioneer life", ["blue", "yellow", "brown"], 2),
    "US-KY": ("Kentucky", "Frankfort", "Depicts a frontiersman and a statesman embracing under 'United We Stand'", ["blue", "white", "gold"], 2),
    "US-LA": ("Louisiana", "Baton Rouge", "Features a mother pelican feeding her young with drops of her own blood", ["blue", "white", "gold"], 1),
    "US-ME": ("Maine", "Augusta", "State seal showing a moose resting under a pine tree with farmer and seaman", ["blue", "green", "gold", "brown"], 2),
    "US-MD": ("Maryland", "Annapolis", "Quartered arms of the Calvert and Crossland families; only US flag based on heraldry", ["black", "gold", "red", "white"], 1),
    "US-MA": ("Massachusetts", "Boston", "State coat of arms depicting an Algonquian Native American and arm holding a sword", ["white", "blue", "gold"], 2),
    "US-MI": ("Michigan", "Lansing", "Coat of arms with elk, moose, and bald eagle over 'Tuebor' ('I will defend')", ["blue", "green", "brown", "white"], 2),
    "US-MN": ("Minnesota", "Saint Paul", "Adopted 2024: Dark blue shape of Minnesota with eight-pointed North Star", ["blue", "cyan", "white"], 1),
    "US-MS": ("Mississippi", "Jackson", "Adopted 2020: The 'In God We Trust' flag featuring a southern magnolia flower", ["red", "blue", "gold", "white"], 1),
    "US-MO": ("Missouri", "Jefferson City", "Red, white, and blue horizontal tricolor with state seal surrounded by 24 stars", ["red", "white", "blue"], 2),
    "US-MT": ("Montana", "Helena", "State seal showing mining and agricultural tools overlooking the Great Falls", ["blue", "gold", "green", "brown"], 2),
    "US-NE": ("Nebraska", "Lincoln", "State seal with steamboat, train, cabin, blacksmith, and sheafs of wheat", ["blue", "gold", "silver"], 2),
    "US-NV": ("Nevada", "Carson City", "Silver Star in the canton encircled by spray of sagebrush; 'Battle Born'", ["blue", "silver", "green"], 2),
    "US-NH": ("New Hampshire", "Concord", "Depicts Revolutionary frigate USS Raleigh surrounded by laurel wreath", ["blue", "gold", "green"], 2),
    "US-NJ": ("New Jersey", "Trenton", "Buff field chosen personally by George Washington during the Revolutionary War", ["buff", "blue", "red"], 2),
    "US-NM": ("New Mexico", "Santa Fe", "Red Zia sun symbol on field of yellow; consistently rated among best flag designs", ["yellow", "red"], 1),
    "US-NY": ("New York", "Albany", "Goddesses Liberty and Justice supporting shield with sunrise over Hudson River", ["blue", "gold", "white"], 1),
    "US-NC": ("North Carolina", "Raleigh", "Blue vertical bar with white star and dates of Mecklenburg Declaration", ["blue", "red", "white", "gold"], 1),
    "US-ND": ("North Dakota", "Bismarck", "Bald eagle clutching arrows and olive branch, similar to US Great Seal", ["blue", "gold", "red"], 2),
    "US-OH": ("Ohio", "Columbus", "The only non-rectangular US state flag; a distinctive swallowtail burgee", ["red", "white", "blue"], 1),
    "US-OK": ("Oklahoma", "Oklahoma City", "Osage buffalo-skin shield with calumet peace pipe and olive branch", ["sky-blue", "brown", "white", "green"], 1),
    "US-OR": ("Oregon", "Salem", "The only two-sided US state flag: seal on front, golden beaver on reverse!", ["blue", "gold"], 1),
    "US-PA": ("Pennsylvania", "Harrisburg", "Coat of arms with two draft horses flanking ship, plow, and wheat sheaves", ["blue", "gold", "black"], 2),
    "US-RI": ("Rhode Island", "Providence", "Golden anchor representing hope, surrounded by 13 golden stars", ["white", "gold", "blue"], 1),
    "US-SC": ("South Carolina", "Columbia", "Silver crescent and iconic sabal palmetto tree on indigo blue", ["indigo", "white"], 1),
    "US-SD": ("South Dakota", "Pierre", "Golden blazing sun surrounded by 'The Mount Rushmore State'", ["sky-blue", "gold", "white"], 2),
    "US-TN": ("Tennessee", "Nashville", "Three white stars representing the three Grand Divisions (East, Middle, West)", ["red", "blue", "white"], 1),
    "US-TX": ("Texas", "Austin", "The famous 'Lone Star Flag', symbol of the Republic of Texas since 1839", ["blue", "white", "red"], 1),
    "US-UT": ("Utah", "Salt Lake City", "Beehive symbol of industry, flanked by five-pointed star and rugged peaks", ["blue", "white", "red", "gold"], 1),
    "US-VT": ("Vermont", "Montpelier", "Pine tree, cow, and wheat sheaves representing Green Mountain agriculture", ["blue", "green", "gold"], 2),
    "US-VA": ("Virginia", "Richmond", "Virtus standing triumphant over Tyranny; motto 'Sic Semper Tyrannis'", ["blue", "white", "red", "green"], 2),
    "US-WA": ("Washington", "Olympia", "The only US state flag with a green field and only one depicting an actual President", ["green", "gold", "black", "blue"], 1),
    "US-WV": ("West Virginia", "Charleston", "State seal showing farmer and miner standing before boulder", ["white", "blue", "green", "red"], 2),
    "US-WI": ("Wisconsin", "Madison", "Sailor and miner supporting state coat of arms with badger on top", ["blue", "gold", "red"], 2),
    "US-WY": ("Wyoming", "Cheyenne", "Silhouette of American bison branded with the state seal inside red & white border", ["blue", "white", "red"], 1),
    "US-DC": ("District of Columbia", "Washington", "Three red stars above two red stripes based on George Washington's family crest", ["white", "red"], 1),
}

CA_PROVINCES = {
    "CA-ON": ("Ontario", "Toronto", "Red Ensign featuring the Royal Union Flag and Ontario shield with three golden maple leaves", ["red", "white", "green", "gold"], 1),
    "CA-QC": ("Quebec", "Quebec City", "The 'Fleurdelisé' features a white cross and four white fleurs-de-lis on royal blue", ["blue", "white"], 1),
    "CA-BC": ("British Columbia", "Victoria", "Union Jack with central crown over wavy blue and white lines with setting sun", ["blue", "white", "yellow", "red"], 1),
    "CA-AB": ("Alberta", "Edmonton", "Shield of Alberta showing St. George's cross, Rocky Mountains, foothills, and wheat field", ["blue", "gold", "green", "white"], 1),
    "CA-MB": ("Manitoba", "Winnipeg", "Red Ensign with Manitoba shield showing bison standing on a rock", ["red", "white", "green", "brown"], 2),
    "CA-SK": ("Saskatchewan", "Regina", "Green and gold halves representing northern forests and southern wheat, with western red lily", ["green", "yellow", "red"], 2),
    "CA-NS": ("Nova Scotia", "Halifax", "Inverted Scottish Saltire (blue cross on white) with Scottish Royal Lion in center", ["white", "blue", "yellow", "red"], 1),
    "CA-NB": ("New Brunswick", "Fredericton", "Gold lion passant guardant over ancient Spanish galley with oars", ["yellow", "red", "blue", "white"], 2),
    "CA-NL": ("Newfoundland and Labrador", "St. John's", "Designed by Christopher Pratt; white triangles for ice, red for struggle, golden arrow for bright future", ["white", "blue", "red", "gold"], 1),
    "CA-PE": ("Prince Edward Island", "Charlottetown", "English lion over large oak tree (Great Britain) protecting three small oak saplings (counties)", ["red", "white", "green", "gold"], 2),
    "CA-NT": ("Northwest Territories", "Yellowknife", "Blue and white vertical Canadian pale featuring shield with fox, minerals, and tree line", ["blue", "white", "red", "green"], 2),
    "CA-NU": ("Nunavut", "Iqaluit", "Red inuksuk stone landmark and blue star representing Niqirtsuituq (North Star)", ["yellow", "white", "red", "blue"], 1),
    "CA-YT": ("Yukon", "Whitehorse", "Tricolor of green, white, and blue with Malamute dog standing on snow-covered mound", ["green", "white", "blue", "red"], 2),
}

AU_STATES = {
    "AU-NSW": ("New South Wales", "Sydney", "British Blue Ensign with St George's cross, four gold stars, and golden lion", ["blue", "red", "white", "gold"], 1),
    "AU-VIC": ("Victoria", "Melbourne", "British Blue Ensign with St Edward's Crown and Southern Cross constellation", ["blue", "white", "red"], 1),
    "AU-QLD": ("Queensland", "Brisbane", "British Blue Ensign with light blue Maltese cross and Royal Crown", ["blue", "white", "red", "cyan"], 1),
    "AU-WA": ("Western Australia", "Perth", "British Blue Ensign with iconic black swan on golden disc", ["blue", "gold", "black"], 1),
    "AU-SA": ("South Australia", "Adelaide", "British Blue Ensign with piping shrike (white-backed magpie) on yellow disk", ["blue", "yellow", "black", "white"], 1),
    "AU-TAS": ("Tasmania", "Hobart", "British Blue Ensign with red lion passant on white disc", ["blue", "white", "red"], 1),
    "AU-ACT": ("Australian Capital Territory", "Canberra", "Blue and gold bicolour with Southern Cross and Canberra coat of arms", ["blue", "yellow", "black", "white"], 1),
    "AU-NT": ("Northern Territory", "Darwin", "Black and ochre with Southern Cross and Sturt's desert rose emblem", ["black", "ochre", "white"], 1),
}

DE_STATES = {
    "DE-BY": ("Bavaria", "Munich", "Famous white and blue lozenges (diamonds) pattern of the House of Wittelsbach", ["blue", "white"], 1),
    "DE-BE": ("Berlin", "Berlin", "Red and white stripes featuring the Berlin Bear (Berliner Bär)", ["red", "white", "black"], 1),
    "DE-BW": ("Baden-Württemberg", "Stuttgart", "Black and gold bicolour representing the historic swabian house", ["black", "gold"], 1),
    "DE-BB": ("Brandenburg", "Potsdam", "Red and white bicolour with the Red Eagle of Brandenburg", ["red", "white"], 1),
    "DE-HB": ("Bremen", "Bremen", "Eight red and white alternating stripes with chequered border ('Speckflagge')", ["red", "white"], 2),
    "DE-HH": ("Hamburg", "Hamburg", "White castle with three towers and two Marian stars on red field", ["red", "white"], 1),
    "DE-HE": ("Hesse", "Wiesbaden", "Red and white bicolour featuring the Lion of Hesse with striped coat", ["red", "white", "blue"], 2),
    "DE-MV": ("Mecklenburg-Vorpommern", "Schwerin", "Blue, white, yellow and red stripes with Griffin and Bull emblems", ["blue", "white", "yellow", "red"], 2),
    "DE-NI": ("Lower Saxony", "Hanover", "German tricolor with the Sachsenross (Saxon White Steed)", ["black", "red", "gold", "white"], 2),
    "DE-NW": ("North Rhine-Westphalia", "Düsseldorf", "Green, white, and red tricolor with coat of arms featuring Rhine and Westphalian horse", ["green", "white", "red"], 1),
    "DE-RP": ("Rhineland-Palatinate", "Mainz", "German tricolor with Golden Lion, Wheel of Mainz, and Cross of Trier", ["black", "red", "gold"], 2),
    "DE-SL": ("Saarland", "Saarbrücken", "German tricolor with coat of arms of Nassau-Saarbrücken, Trier, Lorraine, and Palatinate", ["black", "red", "gold"], 2),
    "DE-SN": ("Saxony", "Dresden", "White and green bicolour with black and gold stripes and green crancelin wreath", ["white", "green", "black", "gold"], 1),
    "DE-ST": ("Saxony-Anhalt", "Magdeburg", "Yellow and black bicolour with bear walking on city wall", ["yellow", "black", "green"], 2),
    "DE-SH": ("Schleswig-Holstein", "Kiel", "Blue, white, and red tricolor with lions of Schleswig and nettle leaf of Holstein", ["blue", "white", "red"], 2),
    "DE-TH": ("Thuringia", "Erfurt", "White and red bicolour with eight-pointed stars around striped lion", ["white", "red", "blue", "gold"], 2),
}

GB_NATIONS = {
    "GB-ENG": ("England", "London", "St George's Cross - red cross on white field dating back to the Middle Ages", ["white", "red"], 1),
    "GB-SCT": ("Scotland", "Edinburgh", "St Andrew's Cross (Saltire) - white diagonal cross on sky-blue field; one of oldest flags", ["blue", "white"], 1),
    "GB-WLS": ("Wales", "Cardiff", "The Red Dragon (Y Ddraig Goch) passant on green and white field of the Tudor dynasty", ["white", "green", "red"], 1),
    "GB-NIR": ("Northern Ireland", "Belfast", "Ulster Banner featuring Red Hand of Ulster inside six-pointed star with Imperial Crown", ["white", "red", "gold"], 1),
}

ES_REGIONS = {
    "ES-CT": ("Catalonia", "Barcelona", "The Senyera - four red stripes on gold field, one of the oldest flags in Europe", ["yellow", "red"], 1),
    "ES-PV": ("Basque Country", "Vitoria-Gasteiz", "The Ikurriña - white cross over green saltire on red field, designed by Sabino Arana", ["red", "green", "white"], 1),
    "ES-GA": ("Galicia", "Santiago de Compostela", "Blue diagonal bend on white field with Holy Grail and seven silver crosses", ["white", "blue", "gold"], 2),
    "ES-AN": ("Andalusia", "Seville", "Green and white horizontal tricolor with Hercules between the Pillars", ["green", "white"], 1),
    "ES-MD": ("Madrid", "Madrid", "Crimson field with seven silver five-pointed stars representing the Ursa Major constellation", ["crimson", "white"], 1),
    "ES-VC": ("Valencia", "Valencia", "Senyera coronada with blue vertical stripe crowned by royal jewel heraldry", ["yellow", "red", "blue"], 2),
    "ES-CN": ("Canary Islands", "Santa Cruz / Las Palmas", "White, blue, and yellow vertical tricolor with shield supported by two dogs", ["white", "blue", "yellow"], 2),
    "ES-IB": ("Balearic Islands", "Palma", "Senyera with purple canton displaying the Bellver Castle", ["yellow", "red", "purple"], 2),
}

MX_STATES = {
    "MX-JAL": ("Jalisco", "Guadalajara", "Blue and gold horizontal bicolour with coat of arms showing two lions climbing oak tree", ["blue", "gold"], 2),
    "MX-NLE": ("Nuevo León", "Monterrey", "White field with coat of arms featuring Cerro de la Silla mountain", ["white", "blue", "gold"], 2),
    "MX-YUC": ("Yucatán", "Mérida", "Historic flag of the Republic of Yucatán with green field, five white stars, and red/white stripes", ["green", "red", "white"], 2),
    "MX-BCN": ("Baja California", "Mexicali", "State coat of arms depicting sun over desert and ocean on white field", ["white", "blue", "gold"], 2),
}

print("3. Building unified JSON database...")

all_flags = []

# Process countries
for c in country_metadata:
    code = c.get("code", "").lower()
    svg_filename = f"{code}.svg"
    full_path = os.path.join(PUBLIC_FLAGS_COUNTRIES, svg_filename)
    if not os.path.exists(full_path):
        continue

    continent = c.get("continent") or "Global"
    capital = c.get("capital") or "N/A"
    name = c.get("name")

    # Determine tags and difficulty
    tags = [continent.lower()]
    difficulty = 2

    # High familiarity / common countries
    common_countries = {
        "us", "gb", "fr", "de", "it", "es", "ca", "mx", "br", "ar", "jp", "cn", "in", 
        "au", "nz", "kr", "ru", "za", "eg", "ng", "gr", "se", "no", "fi", "dk", "ie", 
        "pt", "nl", "be", "ch", "at", "pl", "tr", "sa", "ae", "il", "th", "vn", "ph", 
        "id", "my", "sg", "cu", "jm", "co", "cl", "pe", "ke", "ma", "ua"
    }

    if code in common_countries:
        difficulty = 1
    elif continent in ["Oceania", "Africa"] or not c.get("iso", False):
        difficulty = 3

    # Generate interesting trivia
    trivia = f"Capital: {capital}. Located in {continent}."
    if code == "np":
        trivia = "Nepal is the world's only sovereign country with a non-quadrilateral flag (two pennants)!"
    elif code == "ch":
        trivia = "Switzerland has one of only two square sovereign national flags (the other is Vatican City)!"
    elif code == "va":
        trivia = "Vatican City's flag is square and features the keys of St. Peter and papal tiara."
    elif code == "cy":
        trivia = "Cyprus is one of only two nations whose flag displays a map of its territory (along with Kosovo)."
    elif code == "xk":
        trivia = "Kosovo's flag shows a golden map of the nation beneath six white stars representing ethnic groups."
    elif code == "br":
        trivia = "Brazil's flag depicts the Southern Cross and starry night sky as seen from Rio on Nov 15, 1889."
    elif code == "ca":
        trivia = "Canada's 11-pointed stylized maple leaf flag was adopted in 1965 after the Great Flag Debate."
    elif code == "us":
        trivia = "The US 50-star flag was designed by 17-year-old high school student Robert G. Heft for a class project (he got a B-!)."
    elif code == "jp":
        trivia = "The Hinomaru ('circle of the sun') has been used as a naval ensign since 1854 and officially adopted in 1999."
    elif code == "za":
        trivia = "South Africa's flag, designed by Fred Brownell in 1994, is the only national flag with six colors without an emblem."
    elif code == "dk":
        trivia = "The Dannebrog of Denmark is the oldest continuously used national flag in the world, dating to 1219!"
    elif code == "bh" or code == "qa":
        trivia = "Bahrain and Qatar share serrated zig-zag edges: Bahrain has 5 white points (pillars of Islam); Qatar has 9."
    elif code == "ph":
        trivia = "The Philippine flag is hung with red on top during times of war, and blue on top during peace!"
    elif code == "jm":
        trivia = "Jamaica is currently the only sovereign flag in the world that contains neither red, white, nor blue!"
    elif code == "mz":
        trivia = "Mozambique's flag is the only national flag to feature a modern rifle (an AK-47) alongside a hoe and book."
    elif code == "gd":
        trivia = "Grenada's flag includes a stylized nutmeg pod on the hoist side, representing the 'Isle of Spice'."
    elif code == "pw":
        trivia = "Palau's yellow circle represents the full moon, not the sun, set against the blue Pacific Ocean."
    elif code == "bt":
        trivia = "Bhutan's flag features Druk, the Thunder Dragon, holding jewels representing national wealth."

    all_flags.append({
        "id": f"country-{code}",
        "code": code,
        "name": name,
        "officialName": name,
        "type": "country",
        "category": "World Country",
        "parentCountry": None,
        "continent": continent,
        "capital": capital,
        "svgPath": f"/flags/countries/{code}.svg",
        "trivia": trivia,
        "difficulty": difficulty,
        "tags": tags
    })

# Helper for subdivisions
def add_subdivision(prefix, code, name, capital, trivia, colors, diff, category, parent_name, continent):
    file_key = f"{prefix}-{code}.svg"
    local_file = os.path.join(PUBLIC_FLAGS_SUBDIVISIONS, file_key)
    if os.path.exists(local_file):
        all_flags.append({
            "id": f"sub-{prefix.lower()}-{code.lower()}",
            "code": f"{prefix}-{code}",
            "name": name,
            "officialName": f"{name}, {parent_name}",
            "type": "subdivision",
            "category": category,
            "parentCountry": parent_name,
            "continent": continent,
            "capital": capital,
            "svgPath": f"/flags/subdivisions/{file_key}",
            "trivia": trivia,
            "colors": colors,
            "difficulty": diff,
            "tags": [category.lower(), parent_name.lower(), continent.lower()]
        })

for code, info in US_STATES.items():
    prefix, state_code = code.split("-")
    add_subdivision(prefix, state_code, info[0], info[1], info[2], info[3], info[4], "US State", "United States", "North America")

for code, info in CA_PROVINCES.items():
    prefix, prov_code = code.split("-")
    add_subdivision(prefix, prov_code, info[0], info[1], info[2], info[3], info[4], "Canadian Province", "Canada", "North America")

for code, info in AU_STATES.items():
    prefix, st_code = code.split("-")
    add_subdivision(prefix, st_code, info[0], info[1], info[2], info[3], info[4], "Australian State", "Australia", "Oceania")

for code, info in DE_STATES.items():
    prefix, st_code = code.split("-")
    add_subdivision(prefix, st_code, info[0], info[1], info[2], info[3], info[4], "German State", "Germany", "Europe")

for code, info in GB_NATIONS.items():
    prefix, st_code = code.split("-")
    add_subdivision(prefix, st_code, info[0], info[1], info[2], info[3], info[4], "UK Nation", "United Kingdom", "Europe")

for code, info in ES_REGIONS.items():
    prefix, st_code = code.split("-")
    add_subdivision(prefix, st_code, info[0], info[1], info[2], info[3], info[4], "Spanish Region", "Spain", "Europe")

for code, info in MX_STATES.items():
    prefix, st_code = code.split("-")
    add_subdivision(prefix, st_code, info[0], info[1], info[2], info[3], info[4], "Mexican State", "Mexico", "North America")

# Check for any remaining subdivision SVG files in the directory and add them if not already added
for fname in sorted(os.listdir(PUBLIC_FLAGS_SUBDIVISIONS)):
    if fname.endswith(".svg") and "-" in fname:
        base = fname[:-4]
        existing = any(f["code"] == base for f in all_flags)
        if not existing:
            prefix, sub_code = base.split("-", 1)
            parent_map = {
                "CO": ("Colombia", "Colombian Department", "South America"),
                "MX": ("Mexico", "Mexican State", "North America"),
                "ES": ("Spain", "Spanish Region", "Europe"),
                "DE": ("Germany", "German State", "Europe"),
                "AU": ("Australia", "Australian State", "Oceania"),
                "CA": ("Canada", "Canadian Province", "North America"),
                "US": ("United States", "US State", "North America"),
                "GB": ("United Kingdom", "UK Nation", "Europe")
            }
            parent, cat, cont = parent_map.get(prefix, ("Unknown", "Subdivision", "Global"))
            all_flags.append({
                "id": f"sub-{prefix.lower()}-{sub_code.lower()}",
                "code": base,
                "name": f"{sub_code} ({parent})",
                "officialName": f"{sub_code}, {parent}",
                "type": "subdivision",
                "category": cat,
                "parentCountry": parent,
                "continent": cont,
                "capital": "N/A",
                "svgPath": f"/flags/subdivisions/{fname}",
                "trivia": f"Regional flag of {sub_code} in {parent}.",
                "difficulty": 3,
                "tags": [cat.lower(), parent.lower(), cont.lower()]
            })

out_json = os.path.join(DATA_DIR, "flags.json")
with open(out_json, "w", encoding="utf-8") as f:
    json.dump(all_flags, f, indent=2, ensure_ascii=False)

print(f"Successfully generated database with {len(all_flags)} flags in {out_json}!")
categories = {}
for f in all_flags:
    cat = f["category"]
    categories[cat] = categories.get(cat, 0) + 1
print("Flag counts by category:", categories)
