import json

colors = {
    'red': {'id': 'red', 'name': 'Red', 'hex': '#EF4444'},
    'dark-red': {'id': 'dark-red', 'name': 'Crimson / Dark Red', 'hex': '#B91C1C'},
    'white': {'id': 'white', 'name': 'White', 'hex': '#FFFFFF'},
    'blue': {'id': 'blue', 'name': 'Blue', 'hex': '#2563EB'},
    'dark-blue': {'id': 'dark-blue', 'name': 'Navy Blue', 'hex': '#1E3A8A'},
    'light-blue': {'id': 'light-blue', 'name': 'Sky Blue', 'hex': '#38BDF8'},
    'yellow': {'id': 'yellow', 'name': 'Yellow', 'hex': '#FACC15'},
    'gold': {'id': 'gold', 'name': 'Gold / Saffron', 'hex': '#D97706'},
    'green': {'id': 'green', 'name': 'Green', 'hex': '#16A34A'},
    'dark-green': {'id': 'dark-green', 'name': 'Forest Green', 'hex': '#15803D'},
    'black': {'id': 'black', 'name': 'Black', 'hex': '#0F172A'},
    'orange': {'id': 'orange', 'name': 'Orange', 'hex': '#F97316'},
}

def vert_tricolor(code, name, diff, c1, c2, c3, distractors, trivia, meanings):
    pal_ids = list(dict.fromkeys([c1, c2, c3] + distractors))
    return {
        'id': f"color-{code.lower()}",
        'countryCode': code,
        'name': name,
        'difficulty': diff,
        'viewBox': '0 0 300 200',
        'segments': [
            {'id': 'left', 'name': 'Left Vertical Stripe', 'shape': 'rect', 'props': {'x': 0, 'y': 0, 'width': 100, 'height': 200}, 'correctColor': c1},
            {'id': 'center', 'name': 'Center Vertical Stripe', 'shape': 'rect', 'props': {'x': 100, 'y': 0, 'width': 100, 'height': 200}, 'correctColor': c2},
            {'id': 'right', 'name': 'Right Vertical Stripe', 'shape': 'rect', 'props': {'x': 200, 'y': 0, 'width': 100, 'height': 200}, 'correctColor': c3},
        ],
        'palette': [colors[cid] for cid in pal_ids],
        'trivia': trivia,
        'colorMeaning': meanings
    }

def horiz_tricolor(code, name, diff, c1, c2, c3, distractors, trivia, meanings):
    pal_ids = list(dict.fromkeys([c1, c2, c3] + distractors))
    return {
        'id': f"color-{code.lower()}",
        'countryCode': code,
        'name': name,
        'difficulty': diff,
        'viewBox': '0 0 300 200',
        'segments': [
            {'id': 'top', 'name': 'Top Horizontal Stripe', 'shape': 'rect', 'props': {'x': 0, 'y': 0, 'width': 300, 'height': 66.67}, 'correctColor': c1},
            {'id': 'middle', 'name': 'Middle Horizontal Stripe', 'shape': 'rect', 'props': {'x': 0, 'y': 66.67, 'width': 300, 'height': 66.67}, 'correctColor': c2},
            {'id': 'bottom', 'name': 'Bottom Horizontal Stripe', 'shape': 'rect', 'props': {'x': 0, 'y': 133.34, 'width': 300, 'height': 66.67}, 'correctColor': c3},
        ],
        'palette': [colors[cid] for cid in pal_ids],
        'trivia': trivia,
        'colorMeaning': meanings
    }

def horiz_bicolor(code, name, diff, c1, c2, distractors, trivia, meanings):
    pal_ids = list(dict.fromkeys([c1, c2] + distractors))
    return {
        'id': f"color-{code.lower()}",
        'countryCode': code,
        'name': name,
        'difficulty': diff,
        'viewBox': '0 0 300 200',
        'segments': [
            {'id': 'top', 'name': 'Top Horizontal Half', 'shape': 'rect', 'props': {'x': 0, 'y': 0, 'width': 300, 'height': 100}, 'correctColor': c1},
            {'id': 'bottom', 'name': 'Bottom Horizontal Half', 'shape': 'rect', 'props': {'x': 0, 'y': 100, 'width': 300, 'height': 100}, 'correctColor': c2},
        ],
        'palette': [colors[cid] for cid in pal_ids],
        'trivia': trivia,
        'colorMeaning': meanings
    }

def nordic_cross(code, name, diff, field_color, cross_color, distractors, trivia, meanings):
    pal_ids = list(dict.fromkeys([field_color, cross_color] + distractors))
    return {
        'id': f"color-{code.lower()}",
        'countryCode': code,
        'name': name,
        'difficulty': diff,
        'viewBox': '0 0 300 200',
        'segments': [
            {'id': 'top-left', 'name': 'Upper Hoist Field', 'shape': 'rect', 'props': {'x': 0, 'y': 0, 'width': 90, 'height': 80}, 'correctColor': field_color},
            {'id': 'bottom-left', 'name': 'Lower Hoist Field', 'shape': 'rect', 'props': {'x': 0, 'y': 120, 'width': 90, 'height': 80}, 'correctColor': field_color},
            {'id': 'top-right', 'name': 'Upper Fly Field', 'shape': 'rect', 'props': {'x': 130, 'y': 0, 'width': 170, 'height': 80}, 'correctColor': field_color},
            {'id': 'bottom-right', 'name': 'Lower Fly Field', 'shape': 'rect', 'props': {'x': 130, 'y': 120, 'width': 170, 'height': 80}, 'correctColor': field_color},
            {'id': 'cross', 'name': 'Nordic Cross', 'shape': 'path', 'props': {'d': 'M 90 0 L 130 0 L 130 80 L 300 80 L 300 120 L 130 120 L 130 200 L 90 200 L 90 120 L 0 120 L 0 80 L 90 80 Z'}, 'correctColor': cross_color},
        ],
        'palette': [colors[cid] for cid in pal_ids],
        'trivia': trivia,
        'colorMeaning': meanings
    }

flags_data = []

# Europe Tricolors & Bicolors
flags_data.append(vert_tricolor('fr', 'France', 1, 'blue', 'white', 'red', ['yellow', 'green', 'black'],
    "The French Tricolore originated in the 1789 Revolution, combining the blue and red militia cockade of Paris with the royal white of the Bourbon monarchy.",
    [{'color': 'Blue', 'meaning': 'Historical color of Paris & Saint Martin'}, {'color': 'White', 'meaning': 'Ancient royal color of the French Crown'}, {'color': 'Red', 'meaning': 'Color of Paris & the flame of Saint Denis'}]))

flags_data.append(horiz_tricolor('de', 'Germany', 1, 'black', 'red', 'gold', ['white', 'blue', 'green'],
    "The German colors date back to the 1813 Lützow Free Corps uniforms: 'Out of the darkness of servitude (black) through bloody battles (red) to the golden light of freedom (gold)'.",
    [{'color': 'Black', 'meaning': 'Servitude & solemn resolve'}, {'color': 'Red', 'meaning': 'Sacrifice in bloody struggle'}, {'color': 'Gold', 'meaning': 'The golden light of liberty'}]))

flags_data.append(vert_tricolor('it', 'Italy', 1, 'green', 'white', 'red', ['blue', 'yellow', 'black'],
    "The Il Tricolore was inspired by the French flag under Napoleon, replacing blue with green (the color of the Milanese civic guard).",
    [{'color': 'Green', 'meaning': 'Hope & Italy’s verdant hills and plains'}, {'color': 'White', 'meaning': 'Faith & the snow-capped Alps'}, {'color': 'Red', 'meaning': 'Charity & blood shed for national unity'}]))

flags_data.append(vert_tricolor('ie', 'Ireland', 1, 'green', 'white', 'orange', ['gold', 'red', 'blue'],
    "The Irish Tricolour was gifted by French women to Thomas Francis Meagher in 1848, symbolizing permanent peace between Catholics (green) and Protestants (orange).",
    [{'color': 'Green', 'meaning': 'Roman Catholic tradition & the Emerald Isle'}, {'color': 'White', 'meaning': 'Lasting peace and unity between both sides'}, {'color': 'Orange', 'meaning': 'Protestant followers of William of Orange'}]))

flags_data.append(horiz_tricolor('nl', 'Netherlands', 1, 'red', 'white', 'blue', ['orange', 'yellow', 'black'],
    "Originally orange, white, and blue (the Prince's Flag), the orange band shifted to bright vermilion red around 1630 for enhanced visibility at sea.",
    [{'color': 'Red', 'meaning': 'Bravery, strength, and valor'}, {'color': 'White', 'meaning': 'Peace and purity'}, {'color': 'Blue', 'meaning': 'Vigilance, truth, and loyalty'}]))

flags_data.append(horiz_tricolor('at', 'Austria', 1, 'red', 'white', 'red', ['black', 'gold', 'blue'],
    "Legend holds that Duke Leopold V's white surcoat was soaked in blood after the Siege of Acre (1191), leaving only a white stripe under his belt.",
    [{'color': 'Red', 'meaning': 'Strength, bravery, and sovereign blood'}, {'color': 'White', 'meaning': 'Peace, honesty, and Leopold’s spotless belt'}]))

flags_data.append(vert_tricolor('be', 'Belgium', 1, 'black', 'yellow', 'red', ['white', 'blue', 'orange'],
    "Belgium's colors derive from the arms of the Duchy of Brabant: a yellow lion with red claws and tongue on a black field.",
    [{'color': 'Black', 'meaning': 'The shield of the Duchy of Brabant'}, {'color': 'Yellow', 'meaning': 'The golden heraldic lion of Brabant'}, {'color': 'Red', 'meaning': 'The lion’s claws and tongue'}]))

flags_data.append(horiz_tricolor('hu', 'Hungary', 1, 'red', 'white', 'green', ['blue', 'black', 'yellow'],
    "Hungary's tricolor was adopted during the 1848 Revolution, based on the historical coat of arms dating back to King Saint Stephen.",
    [{'color': 'Red', 'meaning': 'Strength and blood shed for the homeland'}, {'color': 'White', 'meaning': 'Faithfulness and moral purity'}, {'color': 'Green', 'meaning': 'Hope and the lush pastures'}]))

flags_data.append(horiz_tricolor('bg', 'Bulgaria', 1, 'white', 'green', 'red', ['blue', 'yellow', 'black'],
    "Bulgaria replaced the traditional Slavic blue with green to celebrate the country's fertile agriculture and forested Balkan mountains.",
    [{'color': 'White', 'meaning': 'Peace, innocence, and freedom'}, {'color': 'Green', 'meaning': 'Agriculture, forests, and hope'}, {'color': 'Red', 'meaning': 'Courage and martyrs’ blood'}]))

flags_data.append(horiz_tricolor('ee', 'Estonia', 1, 'blue', 'black', 'white', ['green', 'yellow', 'red'],
    "Estonia’s beloved sinimustvalge evokes the Nordic sky, the fertile black soil, and winter’s clean snow.",
    [{'color': 'Blue', 'meaning': 'The sky, sea, and loyalty'}, {'color': 'Black', 'meaning': 'Fertile soil and ancestral hardship'}, {'color': 'White', 'meaning': 'Snow, purity, and freedom'}]))

flags_data.append(horiz_tricolor('lt', 'Lithuania', 1, 'yellow', 'green', 'red', ['white', 'blue', 'black'],
    "Lithuania's cheerful tricolor represents sunny fields, green countryside, and heroic blood.",
    [{'color': 'Yellow', 'meaning': 'The sun, light, and prosperity'}, {'color': 'Green', 'meaning': 'Lush nature, forests, and renewal'}, {'color': 'Red', 'meaning': 'Courage and patriotic blood'}]))

flags_data.append(horiz_tricolor('ru', 'Russia', 1, 'white', 'blue', 'red', ['green', 'yellow', 'black'],
    "Peter the Great adopted the Russian tricolor in 1696 after studying Dutch shipbuilding. It became the template for Pan-Slavic colors across Eastern Europe.",
    [{'color': 'White', 'meaning': 'Nobility and frankness'}, {'color': 'Blue', 'meaning': 'Loyalty, honesty, and chastity'}, {'color': 'Red', 'meaning': 'Courage and love'}]))

flags_data.append(horiz_bicolor('pl', 'Poland', 1, 'white', 'red', ['blue', 'black', 'yellow'],
    "Poland's national colors derive from the coat of arms: a white eagle on a red heraldic shield, officially ratified in 1831.",
    [{'color': 'White', 'meaning': 'The White Eagle & noble spirit'}, {'color': 'Red', 'meaning': 'Bravery and sovereign blood'}]))

flags_data.append(horiz_bicolor('ua', 'Ukraine', 1, 'blue', 'yellow', ['white', 'red', 'green'],
    "The Ukrainian bicolor reflects the nation’s breathtaking landscape: a vivid blue sky arching over golden wheat fields.",
    [{'color': 'Blue', 'meaning': 'Peaceful blue skies and rivers'}, {'color': 'Yellow', 'meaning': 'Golden wheat fields and earth'}]))

flags_data.append(horiz_bicolor('mc', 'Monaco', 1, 'red', 'white', ['blue', 'black', 'gold'],
    "Monaco's red and white colors are drawn from the heraldic lozenges in the arms of the ruling House of Grimaldi, officially adopted in 1881.",
    [{'color': 'Red', 'meaning': 'Heraldic lozenge of the Grimaldi dynasty'}, {'color': 'White', 'meaning': 'Silver lozenge of the Grimaldi dynasty'}]))

# Spain (Tier 1)
flags_data.append({
    'id': 'color-es',
    'countryCode': 'es',
    'name': 'Spain',
    'difficulty': 1,
    'viewBox': '0 0 300 200',
    'segments': [
        {'id': 'top', 'name': 'Top Red Stripe', 'shape': 'rect', 'props': {'x': 0, 'y': 0, 'width': 300, 'height': 50}, 'correctColor': 'red'},
        {'id': 'middle', 'name': 'Middle Yellow Stripe (Double Width)', 'shape': 'rect', 'props': {'x': 0, 'y': 50, 'width': 300, 'height': 100}, 'correctColor': 'yellow'},
        {'id': 'bottom', 'name': 'Bottom Red Stripe', 'shape': 'rect', 'props': {'x': 0, 'y': 150, 'width': 300, 'height': 50}, 'correctColor': 'red'},
    ],
    'palette': [colors[c] for c in ['red', 'yellow', 'gold', 'white', 'blue']],
    'trivia': "Known as La Rojigualda, King Charles III selected this distinctive red and yellow bicolor in 1785 so Spanish naval vessels could be easily distinguished at sea.",
    'colorMeaning': [{'color': 'Red', 'meaning': 'Courage and the historic kingdoms of Castile and Navarre'}, {'color': 'Yellow', 'meaning': 'The crown of Aragon and golden sunshine'}]
})

# Nordic Crosses
flags_data.append(nordic_cross('se', 'Sweden', 1, 'blue', 'yellow', ['white', 'red', 'black'],
    "Sweden's flag design was inspired by Denmark's Dannebrog, with yellow and blue adapted from Sweden’s ancient Three Crowns coat of arms.",
    [{'color': 'Blue', 'meaning': 'Truth, loyalty, and justice'}, {'color': 'Yellow', 'meaning': 'Generosity and golden crowns'}]))

flags_data.append(nordic_cross('fi', 'Finland', 1, 'white', 'blue', ['red', 'yellow', 'black'],
    "Poet Zachris Topelius described Finland's colors as 'the blue of our lakes and the white snow of our winters'.",
    [{'color': 'Blue', 'meaning': 'Thousands of pristine lakes and sky'}, {'color': 'White', 'meaning': 'Deep winter snow'}]))

flags_data.append(nordic_cross('dk', 'Denmark', 1, 'red', 'white', ['blue', 'yellow', 'black'],
    "The Dannebrog is recognized by Guinness World Records as the oldest continuously used national flag, dating back to 1219.",
    [{'color': 'Red', 'meaning': 'Bravery, courage, and strength'}, {'color': 'White', 'meaning': 'Christianity and peaceful unity'}]))

flags_data.append({
    'id': 'color-ch',
    'countryCode': 'ch',
    'name': 'Switzerland',
    'difficulty': 1,
    'viewBox': '0 0 200 200',
    'segments': [
        {'id': 'field', 'name': 'Square Flag Field', 'shape': 'rect', 'props': {'x': 0, 'y': 0, 'width': 200, 'height': 200}, 'correctColor': 'red'},
        {'id': 'cross', 'name': 'White Greek Cross', 'shape': 'path', 'props': {'d': 'M 80 35 L 120 35 L 120 80 L 165 80 L 165 120 L 120 120 L 120 165 L 80 165 L 80 120 L 35 120 L 35 80 L 80 80 Z'}, 'correctColor': 'white'},
    ],
    'palette': [colors[c] for c in ['red', 'white', 'black', 'blue', 'gold']],
    'trivia': "Switzerland's flag is famously one of only two square sovereign flags in the world (alongside Vatican City). It inspired the inverted Red Cross symbol.",
    'colorMeaning': [{'color': 'Red', 'meaning': 'Sovereignty, courage, and Swiss neutrality'}, {'color': 'White', 'meaning': 'Christian faith, peace, and purity'}]
})

# England & Scotland
flags_data.append({
    'id': 'color-gb-eng',
    'countryCode': 'GB-ENG',
    'name': 'England',
    'difficulty': 1,
    'viewBox': '0 0 300 180',
    'segments': [
        {'id': 'tl', 'name': 'Top-Left White Field', 'shape': 'rect', 'props': {'x': 0, 'y': 0, 'width': 130, 'height': 70}, 'correctColor': 'white'},
        {'id': 'bl', 'name': 'Bottom-Left White Field', 'shape': 'rect', 'props': {'x': 0, 'y': 110, 'width': 130, 'height': 70}, 'correctColor': 'white'},
        {'id': 'tr', 'name': 'Top-Right White Field', 'shape': 'rect', 'props': {'x': 170, 'y': 0, 'width': 130, 'height': 70}, 'correctColor': 'white'},
        {'id': 'br', 'name': 'Bottom-Right White Field', 'shape': 'rect', 'props': {'x': 170, 'y': 110, 'width': 130, 'height': 70}, 'correctColor': 'white'},
        {'id': 'cross', 'name': 'St. George\'s Red Cross', 'shape': 'path', 'props': {'d': 'M 130 0 L 170 0 L 170 70 L 300 70 L 300 110 L 170 110 L 170 180 L 130 180 L 130 110 L 0 110 L 0 70 L 130 70 Z'}, 'correctColor': 'red'},
    ],
    'palette': [colors[c] for c in ['white', 'red', 'blue', 'gold', 'black']],
    'trivia': "St. George's Cross became the emblem of England during the Middle Ages and Crusades. It forms the central red cross in the Union Jack.",
    'colorMeaning': [{'color': 'White', 'meaning': 'Purity and peace'}, {'color': 'Red', 'meaning': 'Saint George’s cross and valor'}]
})

flags_data.append({
    'id': 'color-gb-sct',
    'countryCode': 'GB-SCT',
    'name': 'Scotland',
    'difficulty': 1,
    'viewBox': '0 0 300 180',
    'segments': [
        {'id': 'top', 'name': 'Top Blue Triangle', 'shape': 'polygon', 'props': {'points': '30,0 270,0 150,72'}, 'correctColor': 'blue'},
        {'id': 'bottom', 'name': 'Bottom Blue Triangle', 'shape': 'polygon', 'props': {'points': '30,180 270,180 150,108'}, 'correctColor': 'blue'},
        {'id': 'left', 'name': 'Left Blue Triangle', 'shape': 'polygon', 'props': {'points': '0,18 0,162 120,90'}, 'correctColor': 'blue'},
        {'id': 'right', 'name': 'Right Blue Triangle', 'shape': 'polygon', 'props': {'points': '300,18 300,162 180,90'}, 'correctColor': 'blue'},
        {'id': 'saltire', 'name': 'St. Andrew\'s White Saltire Cross', 'shape': 'path', 'props': {'d': 'M 0 0 L 30 0 L 150 72 L 270 0 L 300 0 L 300 18 L 180 90 L 300 162 L 300 180 L 270 180 L 150 108 L 30 180 L 0 180 L 0 162 L 120 90 L 0 18 Z'}, 'correctColor': 'white'},
    ],
    'palette': [colors[c] for c in ['blue', 'white', 'red', 'yellow', 'black']],
    'trivia': "Known as the Saltire or St. Andrew's Cross, legend states that King Óengus II saw a white saltire cloud in the blue sky before his victory in 832 AD.",
    'colorMeaning': [{'color': 'Blue', 'meaning': 'The sky over the battlefield of Athelstaneford'}, {'color': 'White', 'meaning': 'Saint Andrew’s cross of humility'}]
})

# Greece (FIXED code to 'gr')
flags_data.append({
    'id': 'color-gr',
    'countryCode': 'gr',
    'name': 'Greece',
    'difficulty': 2,
    'viewBox': '0 0 300 200',
    'segments': [
        {'id': 's1', 'name': 'Top Stripe', 'shape': 'rect', 'props': {'x': 100, 'y': 0, 'width': 200, 'height': 22.2}, 'correctColor': 'blue'},
        {'id': 's2', 'name': '2nd Stripe', 'shape': 'rect', 'props': {'x': 100, 'y': 22.2, 'width': 200, 'height': 22.2}, 'correctColor': 'white'},
        {'id': 's3', 'name': '3rd Stripe', 'shape': 'rect', 'props': {'x': 100, 'y': 44.4, 'width': 200, 'height': 22.2}, 'correctColor': 'blue'},
        {'id': 's4', 'name': '4th Stripe', 'shape': 'rect', 'props': {'x': 100, 'y': 66.6, 'width': 200, 'height': 22.2}, 'correctColor': 'white'},
        {'id': 's5', 'name': '5th Stripe', 'shape': 'rect', 'props': {'x': 0, 'y': 88.8, 'width': 300, 'height': 22.2}, 'correctColor': 'blue'},
        {'id': 's6', 'name': '6th Stripe', 'shape': 'rect', 'props': {'x': 0, 'y': 111, 'width': 300, 'height': 22.2}, 'correctColor': 'white'},
        {'id': 's7', 'name': '7th Stripe', 'shape': 'rect', 'props': {'x': 0, 'y': 133.2, 'width': 300, 'height': 22.2}, 'correctColor': 'blue'},
        {'id': 's8', 'name': '8th Stripe', 'shape': 'rect', 'props': {'x': 0, 'y': 155.4, 'width': 300, 'height': 22.2}, 'correctColor': 'white'},
        {'id': 's9', 'name': '9th Bottom Stripe', 'shape': 'rect', 'props': {'x': 0, 'y': 177.6, 'width': 300, 'height': 22.4}, 'correctColor': 'blue'},
        {'id': 'canton-bg', 'name': 'Canton Background', 'shape': 'rect', 'props': {'x': 0, 'y': 0, 'width': 100, 'height': 88.8}, 'correctColor': 'blue'},
        {'id': 'canton-cross', 'name': 'Canton White Greek Cross', 'shape': 'path', 'props': {'d': 'M 38 0 L 62 0 L 62 33 L 100 33 L 100 55 L 62 55 L 62 88.8 L 38 88.8 L 38 55 L 0 55 L 0 33 L 38 33 Z'}, 'correctColor': 'white'},
    ],
    'palette': [colors[c] for c in ['blue', 'white', 'yellow', 'red', 'black']],
    'trivia': "The 9 stripes correspond to the 9 syllables of the Greek revolutionary motto 'Eleftheria i Thanatos' ('Freedom or Death').",
    'colorMeaning': [{'color': 'Blue', 'meaning': 'The sparkling Aegean Sea & open skies'}, {'color': 'White', 'meaning': 'The purity of the struggle for Greek independence'}]
})

# Norway, Iceland, Czech Republic
flags_data.append({
    'id': 'color-cz',
    'countryCode': 'cz',
    'name': 'Czech Republic',
    'difficulty': 2,
    'viewBox': '0 0 300 200',
    'segments': [
        {'id': 'top', 'name': 'Upper Field', 'shape': 'polygon', 'props': {'points': '0,0 300,0 300,100 150,100'}, 'correctColor': 'white'},
        {'id': 'bottom', 'name': 'Lower Field', 'shape': 'polygon', 'props': {'points': '150,100 300,100 300,200 0,200'}, 'correctColor': 'red'},
        {'id': 'chevron', 'name': 'Hoist Blue Triangle', 'shape': 'polygon', 'props': {'points': '0,0 150,100 0,200'}, 'correctColor': 'blue'},
    ],
    'palette': [colors[c] for c in ['white', 'red', 'blue', 'black', 'yellow']],
    'trivia': "Originally white and red (Bohemia's colors), a blue triangle was added in 1920 to represent Moravia and Slovakia.",
    'colorMeaning': [{'color': 'White', 'meaning': 'Bohemia’s historic color & peace'}, {'color': 'Red', 'meaning': 'Valor'}, {'color': 'Blue', 'meaning': 'Moravia & Slovakia'}]
})

flags_data.append({
    'id': 'color-no',
    'countryCode': 'no',
    'name': 'Norway',
    'difficulty': 2,
    'viewBox': '0 0 300 200',
    'segments': [
        {'id': 'tl', 'name': 'Upper Hoist Field', 'shape': 'rect', 'props': {'x': 0, 'y': 0, 'width': 80, 'height': 75}, 'correctColor': 'red'},
        {'id': 'bl', 'name': 'Lower Hoist Field', 'shape': 'rect', 'props': {'x': 0, 'y': 125, 'width': 80, 'height': 75}, 'correctColor': 'red'},
        {'id': 'tr', 'name': 'Upper Fly Field', 'shape': 'rect', 'props': {'x': 130, 'y': 0, 'width': 170, 'height': 75}, 'correctColor': 'red'},
        {'id': 'br', 'name': 'Lower Fly Field', 'shape': 'rect', 'props': {'x': 130, 'y': 125, 'width': 170, 'height': 75}, 'correctColor': 'red'},
        {'id': 'white-cross', 'name': 'White Outer Cross Fimbriation', 'shape': 'path', 'props': {'d': 'M 80 0 L 130 0 L 130 75 L 300 75 L 300 125 L 130 125 L 130 200 L 80 200 L 80 125 L 0 125 L 0 75 L 80 75 Z'}, 'correctColor': 'white'},
        {'id': 'blue-cross', 'name': 'Blue Inner Cross', 'shape': 'path', 'props': {'d': 'M 92 0 L 118 0 L 118 87 L 300 87 L 300 113 L 118 113 L 118 200 L 92 200 L 92 113 L 0 113 L 0 87 L 92 87 Z'}, 'correctColor': 'dark-blue'},
    ],
    'palette': [colors[c] for c in ['red', 'white', 'dark-blue', 'yellow', 'green']],
    'trivia': "Combines Denmark's red-and-white Dannebrog with a blue cross representing Sweden, while reflecting the colors of liberty (France & USA).",
    'colorMeaning': [{'color': 'Red & White', 'meaning': 'Historical ties to Denmark'}, {'color': 'Dark Blue', 'meaning': 'Union with Sweden & coastal heritage'}]
})

flags_data.append({
    'id': 'color-is',
    'countryCode': 'is',
    'name': 'Iceland',
    'difficulty': 2,
    'viewBox': '0 0 300 200',
    'segments': [
        {'id': 'tl', 'name': 'Upper Hoist Field', 'shape': 'rect', 'props': {'x': 0, 'y': 0, 'width': 85, 'height': 75}, 'correctColor': 'blue'},
        {'id': 'bl', 'name': 'Lower Hoist Field', 'shape': 'rect', 'props': {'x': 0, 'y': 125, 'width': 85, 'height': 75}, 'correctColor': 'blue'},
        {'id': 'tr', 'name': 'Upper Fly Field', 'shape': 'rect', 'props': {'x': 135, 'y': 0, 'width': 165, 'height': 75}, 'correctColor': 'blue'},
        {'id': 'br', 'name': 'Lower Fly Field', 'shape': 'rect', 'props': {'x': 135, 'y': 125, 'width': 165, 'height': 75}, 'correctColor': 'blue'},
        {'id': 'white-cross', 'name': 'White Outer Cross', 'shape': 'path', 'props': {'d': 'M 85 0 L 135 0 L 135 75 L 300 75 L 300 125 L 135 125 L 135 200 L 85 200 L 85 125 L 0 125 L 0 75 L 85 75 Z'}, 'correctColor': 'white'},
        {'id': 'red-cross', 'name': 'Red Inner Cross', 'shape': 'path', 'props': {'d': 'M 97 0 L 123 0 L 123 87 L 300 87 L 300 113 L 123 113 L 123 200 L 97 200 L 97 113 L 0 113 L 0 87 L 97 87 Z'}, 'correctColor': 'red'},
    ],
    'palette': [colors[c] for c in ['blue', 'white', 'red', 'yellow', 'black']],
    'trivia': "Iceland’s colors represent the elements: blue for the Atlantic, white for glaciers, and red for active volcanic fire.",
    'colorMeaning': [{'color': 'Blue', 'meaning': 'The Atlantic Ocean & mountain peaks'}, {'color': 'White', 'meaning': 'Vast glaciers and snow'}, {'color': 'Red', 'meaning': 'Volcanic fire'}]
})

flags_data.append({
    'id': 'color-gb',
    'countryCode': 'gb',
    'name': 'United Kingdom',
    'difficulty': 3,
    'viewBox': '0 0 300 150',
    'segments': [
        {'id': 'field-tl', 'name': 'Upper Hoist Blue Field', 'shape': 'polygon', 'props': {'points': '0,0 105,0 0,52.5'}, 'correctColor': 'dark-blue'},
        {'id': 'field-bl', 'name': 'Lower Hoist Blue Field', 'shape': 'polygon', 'props': {'points': '0,150 105,150 0,97.5'}, 'correctColor': 'dark-blue'},
        {'id': 'field-tr', 'name': 'Upper Fly Blue Field', 'shape': 'polygon', 'props': {'points': '300,0 195,0 300,52.5'}, 'correctColor': 'dark-blue'},
        {'id': 'field-br', 'name': 'Lower Fly Blue Field', 'shape': 'polygon', 'props': {'points': '300,150 195,150 300,97.5'}, 'correctColor': 'dark-blue'},
        {'id': 'saltire-white', 'name': 'St. Andrew\'s White Saltire', 'shape': 'path', 'props': {'d': 'M 0 0 L 30 0 L 300 135 L 300 150 L 270 150 L 0 15 Z M 300 0 L 270 0 L 0 135 L 0 150 L 30 150 L 300 15 Z'}, 'correctColor': 'white'},
        {'id': 'saltire-red', 'name': 'St. Patrick\'s Red Saltire', 'shape': 'path', 'props': {'d': 'M 0 0 L 15 0 L 150 67.5 L 135 67.5 Z M 300 0 L 300 7.5 L 165 75 L 165 67.5 Z M 300 150 L 285 150 L 150 82.5 L 165 82.5 Z M 0 150 L 0 142.5 L 135 75 L 135 82.5 Z'}, 'correctColor': 'red'},
        {'id': 'cross-white', 'name': 'St. George\'s Cross White Fimbriation', 'shape': 'path', 'props': {'d': 'M 120 0 L 180 0 L 180 45 L 300 45 L 300 105 L 180 105 L 180 150 L 120 150 L 120 105 L 0 105 L 0 45 L 120 45 Z'}, 'correctColor': 'white'},
        {'id': 'cross-red', 'name': 'St. George\'s Red Cross', 'shape': 'path', 'props': {'d': 'M 132 0 L 168 0 L 168 57 L 300 57 L 300 93 L 168 93 L 168 150 L 132 150 L 132 93 L 0 93 L 0 57 L 132 57 Z'}, 'correctColor': 'red'},
    ],
    'palette': [colors[c] for c in ['dark-blue', 'white', 'red', 'yellow', 'black']],
    'trivia': "The Union Jack superimposes the red cross of England (St. George), the white saltire of Scotland (St. Andrew), and the red saltire of Ireland (St. Patrick).",
    'colorMeaning': [{'color': 'Red', 'meaning': 'England & Ireland'}, {'color': 'White', 'meaning': 'Scotland & borders'}, {'color': 'Dark Blue', 'meaning': 'Field of St. Andrew'}]
})

# Asia
flags_data.append({
    'id': 'color-jp',
    'countryCode': 'jp',
    'name': 'Japan',
    'difficulty': 1,
    'viewBox': '0 0 300 200',
    'segments': [
        {'id': 'field', 'name': 'Flag Field Background', 'shape': 'rect', 'props': {'x': 0, 'y': 0, 'width': 300, 'height': 200}, 'correctColor': 'white'},
        {'id': 'sun', 'name': 'Hinomaru (Sun Disc)', 'shape': 'circle', 'props': {'cx': 150, 'cy': 100, 'r': 60}, 'correctColor': 'red'},
    ],
    'palette': [colors[c] for c in ['red', 'white', 'yellow', 'black', 'blue']],
    'trivia': "Known as the Hinomaru ('Circle of the Sun'), it embodies Japan as the 'Land of the Rising Sun' and Shinto reverence for the sun goddess Amaterasu.",
    'colorMeaning': [{'color': 'Red', 'meaning': 'Enthusiasm and the rising sun'}, {'color': 'White', 'meaning': 'Purity and integrity'}]
})

flags_data.append({
    'id': 'color-vn',
    'countryCode': 'vn',
    'name': 'Vietnam',
    'difficulty': 1,
    'viewBox': '0 0 300 200',
    'segments': [
        {'id': 'field', 'name': 'Red Flag Field', 'shape': 'rect', 'props': {'x': 0, 'y': 0, 'width': 300, 'height': 200}, 'correctColor': 'red'},
        {'id': 'star', 'name': 'Yellow 5-Pointed Star', 'shape': 'path', 'props': {'d': 'M 150 45 L 163 87 L 207 87 L 171 113 L 185 155 L 150 129 L 115 155 L 129 113 L 93 87 L 137 87 Z'}, 'correctColor': 'yellow'},
    ],
    'palette': [colors[c] for c in ['red', 'yellow', 'gold', 'white', 'black']],
    'trivia': "The red represents revolution and blood shed for freedom, while the five points of the gold star embody workers, peasants, soldiers, intellectuals, and youth.",
    'colorMeaning': [{'color': 'Red', 'meaning': 'Revolution & sacrifice'}, {'color': 'Yellow', 'meaning': 'The Vietnamese soul'}]
})

flags_data.append(horiz_bicolor('id', 'Indonesia', 1, 'red', 'white', ['blue', 'green', 'black'],
    "Known as Sang Saka Merah Putih, its colors trace back to the banner of the 13th-century Majapahit Empire in Java.",
    [{'color': 'Red', 'meaning': 'Human courage and physical body'}, {'color': 'White', 'meaning': 'Purity and spiritual soul'}]))

flags_data.append(horiz_tricolor('ye', 'Yemen', 1, 'red', 'white', 'black', ['green', 'blue', 'gold'],
    "Part of the Arab Liberation flag family: red for revolutionary sacrifice, white for a luminous future, and black for the dark past.",
    [{'color': 'Red', 'meaning': 'Blood of martyrs'}, {'color': 'White', 'meaning': 'Bright future'}, {'color': 'Black', 'meaning': 'The dark past'}]))

flags_data.append(horiz_tricolor('am', 'Armenia', 1, 'red', 'blue', 'orange', ['white', 'green', 'black'],
    "Armenia’s iconic tricolor symbolizes the Armenian Highlands, peaceful skies, and creative industriousness.",
    [{'color': 'Red', 'meaning': 'The Armenian Highlands'}, {'color': 'Blue', 'meaning': 'Peaceful skies'}, {'color': 'Orange', 'meaning': 'Talent and hard work'}]))

flags_data.append({
    'id': 'color-tr',
    'countryCode': 'tr',
    'name': 'Turkey',
    'difficulty': 2,
    'viewBox': '0 0 300 200',
    'segments': [
        {'id': 'field', 'name': 'Red Flag Field', 'shape': 'rect', 'props': {'x': 0, 'y': 0, 'width': 300, 'height': 200}, 'correctColor': 'red'},
        {'id': 'crescent', 'name': 'White Crescent & Star', 'shape': 'path', 'props': {'d': 'M 140 40 A 60 60 0 1 0 140 160 A 48 48 0 1 1 140 40 Z M 165 92 L 175 92 L 183 83 L 181 95 L 190 100 L 179 104 L 179 116 L 172 107 L 162 110 L 168 100 Z'}, 'correctColor': 'white'},
    ],
    'palette': [colors[c] for c in ['red', 'white', 'green', 'black', 'gold']],
    'trivia': "Known as Al Bayrak ('The Red Flag'), legend states Sultan Murad II saw the crescent moon and star reflected in a pool of blood after the 1448 Battle of Kosovo.",
    'colorMeaning': [{'color': 'Red', 'meaning': 'Courage and martyrs’ sacrifice'}, {'color': 'White', 'meaning': 'Peace and sovereignty'}]
})

flags_data.append({
    'id': 'color-in',
    'countryCode': 'in',
    'name': 'India',
    'difficulty': 2,
    'viewBox': '0 0 300 200',
    'segments': [
        {'id': 'top', 'name': 'India Saffron Stripe', 'shape': 'rect', 'props': {'x': 0, 'y': 0, 'width': 300, 'height': 66.67}, 'correctColor': 'orange'},
        {'id': 'middle', 'name': 'White Stripe', 'shape': 'rect', 'props': {'x': 0, 'y': 66.67, 'width': 300, 'height': 66.67}, 'correctColor': 'white'},
        {'id': 'bottom', 'name': 'India Green Stripe', 'shape': 'rect', 'props': {'x': 0, 'y': 133.34, 'width': 300, 'height': 66.67}, 'correctColor': 'green'},
        {'id': 'chakra', 'name': 'Ashoka Chakra (24-Spoke Wheel of Law)', 'shape': 'circle', 'props': {'cx': 150, 'cy': 100, 'r': 24}, 'correctColor': 'dark-blue'},
    ],
    'palette': [colors[c] for c in ['orange', 'white', 'green', 'dark-blue', 'red', 'yellow']],
    'trivia': "Known as Tiranga ('Tricolor'), the central Ashoka Chakra is the wheel of eternal law (Dharma) from Emperor Ashoka's 3rd-century BC pillar.",
    'colorMeaning': [{'color': 'Saffron / Orange', 'meaning': 'Courage, sacrifice, and renunciation'}, {'color': 'White', 'meaning': 'Peace, truth, and purity'}, {'color': 'Green', 'meaning': 'Faith, fertility, and prosperity'}, {'color': 'Navy Blue', 'meaning': 'The eternal Ashoka Chakra wheel of law'}]
})

flags_data.append({
    'id': 'color-il',
    'countryCode': 'il',
    'name': 'Israel',
    'difficulty': 2,
    'viewBox': '0 0 300 220',
    'segments': [
        {'id': 'field', 'name': 'White Flag Field', 'shape': 'rect', 'props': {'x': 0, 'y': 0, 'width': 300, 'height': 220}, 'correctColor': 'white'},
        {'id': 'top-stripe', 'name': 'Top Blue Stripe (Tallit)', 'shape': 'rect', 'props': {'x': 0, 'y': 25, 'width': 300, 'height': 25}, 'correctColor': 'blue'},
        {'id': 'bottom-stripe', 'name': 'Bottom Blue Stripe (Tallit)', 'shape': 'rect', 'props': {'x': 0, 'y': 170, 'width': 300, 'height': 25}, 'correctColor': 'blue'},
        {'id': 'magen-david', 'name': 'Star of David (Magen David)', 'shape': 'path', 'props': {'d': 'M 150 70 L 180 122 L 120 122 Z M 150 150 L 120 98 L 180 98 Z'}, 'correctColor': 'blue'},
    ],
    'palette': [colors[c] for c in ['white', 'blue', 'dark-blue', 'red', 'gold']],
    'trivia': "Designed for the Zionist movement in 1891, the blue stripes evoke the traditional Jewish prayer shawl (Tallit), surrounding the ancient Star of David.",
    'colorMeaning': [{'color': 'Blue', 'meaning': 'The traditional Tekhelet blue dye and divine glory'}, {'color': 'White', 'meaning': 'Purity and devotion'}]
})

flags_data.append({
    'id': 'color-cn',
    'countryCode': 'cn',
    'name': 'China',
    'difficulty': 2,
    'viewBox': '0 0 300 200',
    'segments': [
        {'id': 'field', 'name': 'Red Flag Field', 'shape': 'rect', 'props': {'x': 0, 'y': 0, 'width': 300, 'height': 200}, 'correctColor': 'red'},
        {'id': 'big-star', 'name': 'Large 5-Pointed Yellow Star', 'shape': 'path', 'props': {'d': 'M 50 25 L 56 42 L 74 42 L 60 52 L 65 69 L 50 59 L 35 69 L 40 52 L 26 42 L 44 42 Z'}, 'correctColor': 'yellow'},
        {'id': 'stars-arc', 'name': 'Four Smaller Yellow Stars Arc', 'shape': 'path', 'props': {'d': 'M 100 15 L 102 22 L 109 22 L 103 26 L 105 33 L 100 29 L 95 33 L 97 26 L 91 22 L 98 22 Z M 120 35 L 122 42 L 129 42 L 123 46 L 125 53 L 120 49 L 115 53 L 117 46 L 111 42 L 118 42 Z M 120 65 L 122 72 L 129 72 L 123 76 L 125 83 L 120 79 L 115 83 L 117 76 L 111 72 L 118 72 Z M 100 85 L 102 92 L 109 92 L 103 96 L 105 103 L 100 99 L 95 103 L 97 96 L 91 92 L 98 92 Z'}, 'correctColor': 'yellow'},
    ],
    'palette': [colors[c] for c in ['red', 'yellow', 'gold', 'white', 'black']],
    'trivia': "Known as the Five-star Red Flag, the large star represents the Communist Party, and the four smaller stars symbolize the four social classes united under it.",
    'colorMeaning': [{'color': 'Red', 'meaning': 'The communist revolution and Chinese tradition'}, {'color': 'Yellow', 'meaning': 'The Chinese race and brightness'}]
})

# Oceania
flags_data.append({
    'id': 'color-pw',
    'countryCode': 'pw',
    'name': 'Palau',
    'difficulty': 1,
    'viewBox': '0 0 300 188',
    'segments': [
        {'id': 'field', 'name': 'Sky Blue Pacific Field', 'shape': 'rect', 'props': {'x': 0, 'y': 0, 'width': 300, 'height': 188}, 'correctColor': 'light-blue'},
        {'id': 'moon', 'name': 'Golden Full Moon Disc', 'shape': 'circle', 'props': {'cx': 120, 'cy': 94, 'r': 56}, 'correctColor': 'yellow'},
    ],
    'palette': [colors[c] for c in ['light-blue', 'yellow', 'white', 'dark-blue', 'red']],
    'trivia': "Unlike Japan’s sun, Palau’s golden disc represents the full moon, considered by Palauans to be the optimal time for harvesting, fishing, and community celebrations.",
    'colorMeaning': [{'color': 'Light Blue', 'meaning': 'The Pacific Ocean surrounding Palau and freedom'}, {'color': 'Yellow', 'meaning': 'The golden full moon of peace and prosperity'}]
})

flags_data.append({
    'id': 'color-fm',
    'countryCode': 'fm',
    'name': 'Micronesia',
    'difficulty': 2,
    'viewBox': '0 0 300 158',
    'segments': [
        {'id': 'field', 'name': 'Pacific Blue Field', 'shape': 'rect', 'props': {'x': 0, 'y': 0, 'width': 300, 'height': 158}, 'correctColor': 'light-blue'},
        {'id': 'stars', 'name': 'Four White 5-Pointed Stars', 'shape': 'path', 'props': {'d': 'M 150 25 L 153 34 L 162 34 L 155 39 L 157 48 L 150 43 L 143 48 L 145 39 L 138 34 L 147 34 Z M 150 110 L 153 119 L 162 119 L 155 124 L 157 133 L 150 128 L 143 133 L 145 124 L 138 119 L 147 119 Z M 95 68 L 98 77 L 107 77 L 100 82 L 102 91 L 95 86 L 88 91 L 90 82 L 83 77 L 92 77 Z M 205 68 L 208 77 L 217 77 L 210 82 L 212 91 L 205 86 L 198 91 L 200 82 L 193 77 L 202 77 Z'}, 'correctColor': 'white'},
    ],
    'palette': [colors[c] for c in ['light-blue', 'white', 'dark-blue', 'gold', 'red']],
    'trivia': "The 4 white stars represent the four island states that comprise the federation: Chuuk, Pohnpei, Kosrae, and Yap.",
    'colorMeaning': [{'color': 'Light Blue', 'meaning': 'The Pacific Ocean'}, {'color': 'White', 'meaning': 'Peace between the island states'}]
})

flags_data.append({
    'id': 'color-au',
    'countryCode': 'au',
    'name': 'Australia',
    'difficulty': 3,
    'viewBox': '0 0 300 150',
    'segments': [
        {'id': 'field', 'name': 'Royal Blue Ensign Field', 'shape': 'rect', 'props': {'x': 0, 'y': 0, 'width': 300, 'height': 150}, 'correctColor': 'dark-blue'},
        {'id': 'canton-union-jack', 'name': 'Union Jack Canton', 'shape': 'rect', 'props': {'x': 0, 'y': 0, 'width': 150, 'height': 75}, 'correctColor': 'red'},
        {'id': 'commonwealth-star', 'name': '7-Pointed Commonwealth Star', 'shape': 'path', 'props': {'d': 'M 75 90 L 78 102 L 90 102 L 80 110 L 84 122 L 75 114 L 66 122 L 70 110 L 60 102 L 72 102 Z'}, 'correctColor': 'white'},
        {'id': 'southern-cross', 'name': 'Southern Cross Constellation (5 White Stars)', 'shape': 'path', 'props': {'d': 'M 225 25 L 227 32 L 235 32 L 228 36 L 230 43 L 225 39 L 220 43 L 222 36 L 215 32 L 223 32 Z M 225 115 L 227 122 L 235 122 L 228 126 L 230 133 L 225 129 L 220 133 L 222 126 L 215 122 L 223 122 Z M 195 65 L 197 72 L 205 72 L 198 76 L 200 83 L 195 79 L 190 83 L 192 76 L 185 72 L 193 72 Z M 255 55 L 257 62 L 265 62 L 258 66 L 260 73 L 255 69 L 250 73 L 252 66 L 245 62 L 253 62 Z M 238 85 L 240 89 L 245 89 L 241 92 L 242 97 L 238 94 L 234 97 L 235 92 L 231 89 L 236 89 Z'}, 'correctColor': 'white'},
    ],
    'palette': [colors[c] for c in ['dark-blue', 'white', 'red', 'gold', 'green']],
    'trivia': "Features the Commonwealth Star (whose 7 points represent Australia’s 6 states and territories) and the Southern Cross constellation visible across the southern sky.",
    'colorMeaning': [{'color': 'Dark Blue', 'meaning': 'The ocean and Australian blue ensign'}, {'color': 'White', 'meaning': 'The Southern Cross and Commonwealth Star'}, {'color': 'Red', 'meaning': 'Union Jack heritage'}]
})

# Americas
flags_data.append({
    'id': 'color-us',
    'countryCode': 'us',
    'name': 'United States',
    'difficulty': 3,
    'viewBox': '0 0 300 158',
    'segments': [
        {'id': 's1', 'name': '1st Stripe (Top)', 'shape': 'rect', 'props': {'x': 120, 'y': 0, 'width': 180, 'height': 12.15}, 'correctColor': 'red'},
        {'id': 's2', 'name': '2nd Stripe', 'shape': 'rect', 'props': {'x': 120, 'y': 12.15, 'width': 180, 'height': 12.15}, 'correctColor': 'white'},
        {'id': 's3', 'name': '3rd Stripe', 'shape': 'rect', 'props': {'x': 120, 'y': 24.3, 'width': 180, 'height': 12.15}, 'correctColor': 'red'},
        {'id': 's4', 'name': '4th Stripe', 'shape': 'rect', 'props': {'x': 120, 'y': 36.45, 'width': 180, 'height': 12.15}, 'correctColor': 'white'},
        {'id': 's5', 'name': '5th Stripe', 'shape': 'rect', 'props': {'x': 120, 'y': 48.6, 'width': 180, 'height': 12.15}, 'correctColor': 'red'},
        {'id': 's6', 'name': '6th Stripe', 'shape': 'rect', 'props': {'x': 120, 'y': 60.75, 'width': 180, 'height': 12.15}, 'correctColor': 'white'},
        {'id': 's7', 'name': '7th Stripe', 'shape': 'rect', 'props': {'x': 120, 'y': 72.9, 'width': 180, 'height': 12.15}, 'correctColor': 'red'},
        {'id': 's8', 'name': '8th Stripe', 'shape': 'rect', 'props': {'x': 0, 'y': 85.05, 'width': 300, 'height': 12.15}, 'correctColor': 'white'},
        {'id': 's9', 'name': '9th Stripe', 'shape': 'rect', 'props': {'x': 0, 'y': 97.2, 'width': 300, 'height': 12.15}, 'correctColor': 'red'},
        {'id': 's10', 'name': '10th Stripe', 'shape': 'rect', 'props': {'x': 0, 'y': 109.35, 'width': 300, 'height': 12.15}, 'correctColor': 'white'},
        {'id': 's11', 'name': '11th Stripe', 'shape': 'rect', 'props': {'x': 0, 'y': 121.5, 'width': 300, 'height': 12.15}, 'correctColor': 'red'},
        {'id': 's12', 'name': '12th Stripe', 'shape': 'rect', 'props': {'x': 0, 'y': 133.65, 'width': 300, 'height': 12.15}, 'correctColor': 'white'},
        {'id': 's13', 'name': '13th Stripe (Bottom)', 'shape': 'rect', 'props': {'x': 0, 'y': 145.8, 'width': 300, 'height': 12.2}, 'correctColor': 'red'},
        {'id': 'canton', 'name': 'Blue Canton of 50 Stars', 'shape': 'rect', 'props': {'x': 0, 'y': 0, 'width': 120, 'height': 85.05}, 'correctColor': 'dark-blue'},
    ],
    'palette': [colors[c] for c in ['red', 'white', 'dark-blue', 'yellow', 'black']],
    'trivia': "The 13 stripes represent the original colonies, while the blue canton contains 50 stars representing the 50 states.",
    'colorMeaning': [{'color': 'Red', 'meaning': 'Hardiness and valor'}, {'color': 'White', 'meaning': 'Purity and innocence'}, {'color': 'Dark Blue', 'meaning': 'Vigilance, perseverance, and justice'}]
})

flags_data.append({
    'id': 'color-ca',
    'countryCode': 'ca',
    'name': 'Canada',
    'difficulty': 2,
    'viewBox': '0 0 300 150',
    'segments': [
        {'id': 'left', 'name': 'Left Red Pale', 'shape': 'rect', 'props': {'x': 0, 'y': 0, 'width': 75, 'height': 150}, 'correctColor': 'red'},
        {'id': 'center', 'name': 'Center White Canadian Pale', 'shape': 'rect', 'props': {'x': 75, 'y': 0, 'width': 150, 'height': 150}, 'correctColor': 'white'},
        {'id': 'right', 'name': 'Right Red Pale', 'shape': 'rect', 'props': {'x': 225, 'y': 0, 'width': 75, 'height': 150}, 'correctColor': 'red'},
        {'id': 'leaf', 'name': '11-Pointed Maple Leaf', 'shape': 'path', 'props': {'d': 'M 150 25 L 157 55 L 175 48 L 168 68 L 195 72 L 178 92 L 188 102 L 158 105 L 153 125 L 147 125 L 142 105 L 112 102 L 122 92 L 105 72 L 132 68 L 125 48 L 143 55 Z'}, 'correctColor': 'red'},
    ],
    'palette': [colors[c] for c in ['red', 'white', 'blue', 'green', 'black']],
    'trivia': "Known as the Maple Leaf (l'Unifolié), red and white were designated Canada's official national colors by King George V in 1921.",
    'colorMeaning': [{'color': 'Red', 'meaning': 'Sacrifice in war'}, {'color': 'White', 'meaning': 'Northern snow & peace'}]
})

flags_data.append({
    'id': 'color-co',
    'countryCode': 'co',
    'name': 'Colombia',
    'difficulty': 1,
    'viewBox': '0 0 300 200',
    'segments': [
        {'id': 'top-yellow', 'name': 'Top Yellow Band (Double Height)', 'shape': 'rect', 'props': {'x': 0, 'y': 0, 'width': 300, 'height': 100}, 'correctColor': 'yellow'},
        {'id': 'middle-blue', 'name': 'Middle Blue Band', 'shape': 'rect', 'props': {'x': 0, 'y': 100, 'width': 300, 'height': 50}, 'correctColor': 'blue'},
        {'id': 'bottom-red', 'name': 'Bottom Red Band', 'shape': 'rect', 'props': {'x': 0, 'y': 150, 'width': 300, 'height': 50}, 'correctColor': 'red'},
    ],
    'palette': [colors[c] for c in ['yellow', 'blue', 'red', 'green', 'white']],
    'trivia': "Designed by Francisco de Miranda for Gran Colombia: yellow represents the sovereignty and mineral richness, blue the two oceans, and red the blood of independence.",
    'colorMeaning': [{'color': 'Yellow', 'meaning': 'Sovereignty, gold, and fertile land'}, {'color': 'Blue', 'meaning': 'The Pacific and Caribbean oceans'}, {'color': 'Red', 'meaning': 'Blood shed for freedom'}]
})

flags_data.append({
    'id': 'color-cl',
    'countryCode': 'cl',
    'name': 'Chile',
    'difficulty': 2,
    'viewBox': '0 0 300 200',
    'segments': [
        {'id': 'canton', 'name': 'Blue Canton', 'shape': 'rect', 'props': {'x': 0, 'y': 0, 'width': 100, 'height': 100}, 'correctColor': 'blue'},
        {'id': 'star', 'name': 'White 5-Pointed Lone Star (La Estrella Solitaria)', 'shape': 'path', 'props': {'d': 'M 50 20 L 56 38 L 74 38 L 60 48 L 65 66 L 50 56 L 35 66 L 40 48 L 26 38 L 44 38 Z'}, 'correctColor': 'white'},
        {'id': 'top-white', 'name': 'Top Right White Stripe', 'shape': 'rect', 'props': {'x': 100, 'y': 0, 'width': 200, 'height': 100}, 'correctColor': 'white'},
        {'id': 'bottom-red', 'name': 'Bottom Full Red Stripe', 'shape': 'rect', 'props': {'x': 0, 'y': 100, 'width': 300, 'height': 100}, 'correctColor': 'red'},
    ],
    'palette': [colors[c] for c in ['blue', 'white', 'red', 'yellow', 'black']],
    'trivia': "Known as La Estrella Solitaria ('The Lone Star'), the star represents a guide to progress and honor, white represents the snow of the Andes, and blue the open Pacific.",
    'colorMeaning': [{'color': 'Blue', 'meaning': 'The clear sky and Pacific Ocean'}, {'color': 'White', 'meaning': 'The snow-covered Andes Mountains'}, {'color': 'Red', 'meaning': 'The blood spilled by heroes of independence'}]
})

flags_data.append({
    'id': 'color-us-tx',
    'countryCode': 'US-TX',
    'name': 'Texas',
    'difficulty': 1,
    'viewBox': '0 0 300 200',
    'segments': [
        {'id': 'left-blue', 'name': 'Left Blue Vertical Third', 'shape': 'rect', 'props': {'x': 0, 'y': 0, 'width': 100, 'height': 200}, 'correctColor': 'dark-blue'},
        {'id': 'star', 'name': 'White Lone Star', 'shape': 'path', 'props': {'d': 'M 50 70 L 56 88 L 74 88 L 60 98 L 65 116 L 50 106 L 35 116 L 40 98 L 26 88 L 44 88 Z'}, 'correctColor': 'white'},
        {'id': 'top-white', 'name': 'Top White Horizontal Stripe', 'shape': 'rect', 'props': {'x': 100, 'y': 0, 'width': 200, 'height': 100}, 'correctColor': 'white'},
        {'id': 'bottom-red', 'name': 'Bottom Red Horizontal Stripe', 'shape': 'rect', 'props': {'x': 100, 'y': 100, 'width': 200, 'height': 100}, 'correctColor': 'red'},
    ],
    'palette': [colors[c] for c in ['dark-blue', 'white', 'red', 'gold', 'black']],
    'trivia': "Known as the Lone Star Flag, it was introduced in 1839 as the national flag of the Republic of Texas and became the state flag when Texas joined the Union in 1845.",
    'colorMeaning': [{'color': 'Dark Blue', 'meaning': 'Loyalty'}, {'color': 'White', 'meaning': 'Purity'}, {'color': 'Red', 'meaning': 'Bravery'}]
})

# Jamaica, Bahamas, Argentina, Brazil
flags_data.append({
    'id': 'color-jm',
    'countryCode': 'jm',
    'name': 'Jamaica',
    'difficulty': 2,
    'viewBox': '0 0 300 150',
    'segments': [
        {'id': 'top', 'name': 'Top Triangle', 'shape': 'polygon', 'props': {'points': '30,0 270,0 150,60'}, 'correctColor': 'green'},
        {'id': 'bottom', 'name': 'Bottom Triangle', 'shape': 'polygon', 'props': {'points': '30,150 270,150 150,90'}, 'correctColor': 'green'},
        {'id': 'left', 'name': 'Left Hoist Triangle', 'shape': 'polygon', 'props': {'points': '0,15 0,135 120,75'}, 'correctColor': 'black'},
        {'id': 'right', 'name': 'Right Fly Triangle', 'shape': 'polygon', 'props': {'points': '300,15 300,135 180,75'}, 'correctColor': 'black'},
        {'id': 'saltire', 'name': 'Golden Saltire Cross', 'shape': 'path', 'props': {'d': 'M 0 0 L 30 0 L 150 60 L 270 0 L 300 0 L 300 15 L 180 75 L 300 135 L 300 150 L 270 150 L 150 90 L 30 150 L 0 150 L 0 135 L 120 75 L 0 15 Z'}, 'correctColor': 'gold'},
    ],
    'palette': [colors[c] for c in ['gold', 'green', 'black', 'red', 'white']],
    'trivia': "Jamaica's flag is the ONLY sovereign flag in the world that does not contain red, white, or blue!",
    'colorMeaning': [{'color': 'Gold', 'meaning': 'Natural wealth and golden sunshine'}, {'color': 'Green', 'meaning': 'Agricultural abundance'}, {'color': 'Black', 'meaning': 'Strength and creativity'}]
})

flags_data.append({
    'id': 'color-bs',
    'countryCode': 'bs',
    'name': 'Bahamas',
    'difficulty': 2,
    'viewBox': '0 0 300 150',
    'segments': [
        {'id': 'top', 'name': 'Top Stripe (Caribbean Sea)', 'shape': 'polygon', 'props': {'points': '0,0 300,0 300,50 86,50'}, 'correctColor': 'light-blue'},
        {'id': 'middle', 'name': 'Middle Stripe (Golden Sand)', 'shape': 'polygon', 'props': {'points': '86,50 300,50 300,100 86,100'}, 'correctColor': 'gold'},
        {'id': 'bottom', 'name': 'Bottom Stripe (Atlantic Ocean)', 'shape': 'polygon', 'props': {'points': '86,100 300,100 300,150 0,150'}, 'correctColor': 'light-blue'},
        {'id': 'chevron', 'name': 'Black Hoist Triangle', 'shape': 'polygon', 'props': {'points': '0,0 130,75 0,150'}, 'correctColor': 'black'},
    ],
    'palette': [colors[c] for c in ['light-blue', 'gold', 'black', 'white', 'red']],
    'trivia': "Symbolizes golden shores surrounded by shimmering aquamarine waters.",
    'colorMeaning': [{'color': 'Light Blue', 'meaning': 'The Caribbean Sea & Atlantic Ocean'}, {'color': 'Gold', 'meaning': 'Sun and sandy beaches'}, {'color': 'Black', 'meaning': 'Determination of the people'}]
})

flags_data.append({
    'id': 'color-ar',
    'countryCode': 'ar',
    'name': 'Argentina',
    'difficulty': 2,
    'viewBox': '0 0 300 200',
    'segments': [
        {'id': 'top', 'name': 'Top Stripe', 'shape': 'rect', 'props': {'x': 0, 'y': 0, 'width': 300, 'height': 66.67}, 'correctColor': 'light-blue'},
        {'id': 'middle', 'name': 'Middle White Stripe', 'shape': 'rect', 'props': {'x': 0, 'y': 66.67, 'width': 300, 'height': 66.67}, 'correctColor': 'white'},
        {'id': 'bottom', 'name': 'Bottom Stripe', 'shape': 'rect', 'props': {'x': 0, 'y': 133.34, 'width': 300, 'height': 66.67}, 'correctColor': 'light-blue'},
        {'id': 'sun', 'name': 'Sun of May (Sol de Mayo)', 'shape': 'circle', 'props': {'cx': 150, 'cy': 100, 'r': 22}, 'correctColor': 'gold'},
    ],
    'palette': [colors[c] for c in ['light-blue', 'white', 'gold', 'red', 'dark-blue']],
    'trivia': "The 'Sun of May' commemorates the sun bursting through clouds during the 1810 May Revolution.",
    'colorMeaning': [{'color': 'Light Blue', 'meaning': 'Clear skies'}, {'color': 'White', 'meaning': 'Silver of the Río de la Plata'}, {'color': 'Gold', 'meaning': 'The radiant Sun of May'}]
})

flags_data.append({
    'id': 'color-br',
    'countryCode': 'br',
    'name': 'Brazil',
    'difficulty': 3,
    'viewBox': '0 0 300 210',
    'segments': [
        {'id': 'field', 'name': 'Green Flag Field', 'shape': 'rect', 'props': {'x': 0, 'y': 0, 'width': 300, 'height': 210}, 'correctColor': 'green'},
        {'id': 'rhombus', 'name': 'Yellow Rhombus (Losango)', 'shape': 'polygon', 'props': {'points': '150,18 276,105 150,192 24,105'}, 'correctColor': 'yellow'},
        {'id': 'globe', 'name': 'Blue Celestial Globe', 'shape': 'circle', 'props': {'cx': 150, 'cy': 105, 'r': 52}, 'correctColor': 'blue'},
        {'id': 'band', 'name': 'White Equator Band', 'shape': 'path', 'props': {'d': 'M 99 110 Q 150 82 201 110 L 200 119 Q 150 91 100 119 Z'}, 'correctColor': 'white'},
    ],
    'palette': [colors[c] for c in ['green', 'yellow', 'blue', 'white', 'red']],
    'trivia': "Features the southern starry sky over Rio de Janeiro on 15 November 1889 with the motto 'Ordem e Progresso'.",
    'colorMeaning': [{'color': 'Green', 'meaning': 'The lush Amazon rainforest'}, {'color': 'Yellow', 'meaning': 'Mineral wealth & gold'}, {'color': 'Blue', 'meaning': 'The celestial globe'}]
})

flags_data.append(vert_tricolor('pe', 'Peru', 1, 'red', 'white', 'red', ['gold', 'blue', 'green'],
    "General José de San Martín saw red-and-white parihuanas (flamingos) taking flight upon arriving in Peru in 1820.",
    [{'color': 'Red', 'meaning': 'Blood spilled for independence'}, {'color': 'White', 'meaning': 'Purity and peace'}]))

# Africa
flags_data.append(vert_tricolor('ng', 'Nigeria', 1, 'green', 'white', 'green', ['black', 'yellow', 'red'],
    "Designed in 1959 by Taiwo Akinkunmi, representing rich agricultural wealth flanking peace.",
    [{'color': 'Green', 'meaning': 'Abundant forests and agriculture'}, {'color': 'White', 'meaning': 'Unity and peace'}]))

flags_data.append(vert_tricolor('ml', 'Mali', 1, 'green', 'yellow', 'red', ['white', 'blue', 'black'],
    "Uses Pan-African colors: green for nature, gold for mineral wealth, and red for sacrifices.",
    [{'color': 'Green', 'meaning': 'Fertility of the land'}, {'color': 'Yellow', 'meaning': 'Mineral purity & gold'}, {'color': 'Red', 'meaning': 'Courage and sacrifice'}]))

flags_data.append(vert_tricolor('ci', 'Côte d’Ivoire', 1, 'orange', 'white', 'green', ['red', 'blue', 'gold'],
    "Orange for the northern savannahs, white for peace, and green for the southern coastal forests.",
    [{'color': 'Orange', 'meaning': 'Savannah grasslands'}, {'color': 'White', 'meaning': 'Peace & unity'}, {'color': 'Green', 'meaning': 'Southern coastal forests'}]))

flags_data.append(vert_tricolor('td', 'Chad', 1, 'dark-blue', 'yellow', 'red', ['green', 'white', 'black'],
    "Chad replaces the French blue with dark indigo, symbolizing sky, hope, and the waters of Lake Chad.",
    [{'color': 'Dark Blue', 'meaning': 'The sky & Lake Chad'}, {'color': 'Yellow', 'meaning': 'The sun and Sahara Desert'}, {'color': 'Red', 'meaning': 'Sacrifice and unity'}]))

flags_data.append(horiz_tricolor('ga', 'Gabon', 1, 'green', 'yellow', 'blue', ['red', 'white', 'black'],
    "Rainforest (green), the equator line and sun (yellow), and the Atlantic Ocean (blue).",
    [{'color': 'Green', 'meaning': 'Vast forests'}, {'color': 'Yellow', 'meaning': 'The sun and Equator'}, {'color': 'Blue', 'meaning': 'The South Atlantic coast'}]))

flags_data.append({
    'id': 'color-so',
    'countryCode': 'so',
    'name': 'Somalia',
    'difficulty': 1,
    'viewBox': '0 0 300 200',
    'segments': [
        {'id': 'field', 'name': 'Sky Blue Field', 'shape': 'rect', 'props': {'x': 0, 'y': 0, 'width': 300, 'height': 200}, 'correctColor': 'light-blue'},
        {'id': 'star', 'name': 'White 5-Pointed Star of Unity', 'shape': 'path', 'props': {'d': 'M 150 55 L 160 85 L 192 85 L 166 104 L 176 135 L 150 116 L 124 135 L 134 104 L 108 85 L 140 85 Z'}, 'correctColor': 'white'},
    ],
    'palette': [colors[c] for c in ['light-blue', 'white', 'dark-blue', 'red', 'green']],
    'trivia': "The 5 points represent the five historical Somali territories.",
    'colorMeaning': [{'color': 'Light Blue', 'meaning': 'The blue sky and Indian Ocean'}, {'color': 'White', 'meaning': 'Peace and unity'}]
})

flags_data.append({
    'id': 'color-za',
    'countryCode': 'za',
    'name': 'South Africa',
    'difficulty': 3,
    'viewBox': '0 0 300 200',
    'segments': [
        {'id': 'top-red', 'name': 'Upper Red Stripe', 'shape': 'polygon', 'props': {'points': '100,0 300,0 300,60 160,60'}, 'correctColor': 'red'},
        {'id': 'bottom-blue', 'name': 'Lower Blue Stripe', 'shape': 'polygon', 'props': {'points': '160,140 300,140 300,200 100,200'}, 'correctColor': 'blue'},
        {'id': 'triangle-black', 'name': 'Hoist Black Triangle', 'shape': 'polygon', 'props': {'points': '0,25 75,100 0,175'}, 'correctColor': 'black'},
        {'id': 'gold-v', 'name': 'Gold V-Fimbriations', 'shape': 'path', 'props': {'d': 'M 0 10 L 90 100 L 0 190 L 0 175 L 75 100 L 0 25 Z'}, 'correctColor': 'gold'},
        {'id': 'white-top-border', 'name': 'White Top Stripe Border', 'shape': 'polygon', 'props': {'points': '95,0 110,0 170,60 300,60 300,70 160,70'}, 'correctColor': 'white'},
        {'id': 'white-bottom-border', 'name': 'White Bottom Stripe Border', 'shape': 'polygon', 'props': {'points': '160,130 300,130 300,140 170,140 110,200 95,200'}, 'correctColor': 'white'},
        {'id': 'green-y', 'name': 'Central Green Pall (Y-Shape)', 'shape': 'path', 'props': {'d': 'M 0 0 L 100 100 L 0 200 L 18 200 L 110 108 L 300 108 L 300 92 L 110 92 L 18 0 Z'}, 'correctColor': 'green'},
    ],
    'palette': [colors[c] for c in ['green', 'black', 'gold', 'red', 'blue', 'white']],
    'trivia': "The Y-shape symbolizes the convergence of diverse paths into one united rainbow nation.",
    'colorMeaning': [{'color': 'Black, Green & Gold', 'meaning': 'The African National Congress'}, {'color': 'Red, White & Blue', 'meaning': 'Boer Republics & British heritage'}]
})

flags_data.append({
    'id': 'color-sc',
    'countryCode': 'sc',
    'name': 'Seychelles',
    'difficulty': 3,
    'viewBox': '0 0 300 150',
    'segments': [
        {'id': 'ray1', 'name': '1st Ray (Sky & Sea)', 'shape': 'polygon', 'props': {'points': '0,150 0,0 100,0'}, 'correctColor': 'blue'},
        {'id': 'ray2', 'name': '2nd Ray (Golden Sun)', 'shape': 'polygon', 'props': {'points': '0,150 100,0 200,0'}, 'correctColor': 'yellow'},
        {'id': 'ray3', 'name': '3rd Ray (The People)', 'shape': 'polygon', 'props': {'points': '0,150 200,0 300,0 300,50'}, 'correctColor': 'red'},
        {'id': 'ray4', 'name': '4th Ray (Social Justice)', 'shape': 'polygon', 'props': {'points': '0,150 300,50 300,100'}, 'correctColor': 'white'},
        {'id': 'ray5', 'name': '5th Ray (The Land)', 'shape': 'polygon', 'props': {'points': '0,150 300,100 300,150'}, 'correctColor': 'green'},
    ],
    'palette': [colors[c] for c in ['blue', 'yellow', 'red', 'white', 'green', 'black']],
    'trivia': "The 5 colorful rays radiate from the bottom-left corner like energy beams striding boldly into the future.",
    'colorMeaning': [{'color': 'Blue', 'meaning': 'The Indian Ocean & sky'}, {'color': 'Yellow', 'meaning': 'Light & life'}, {'color': 'Red', 'meaning': 'United people'}, {'color': 'White', 'meaning': 'Harmony'}, {'color': 'Green', 'meaning': 'Lush vegetation'}]
})

# Iconic World Cities
flags_data.append({
    'id': 'color-chi',
    'countryCode': 'CHI',
    'name': 'Chicago',
    'difficulty': 2,
    'viewBox': '0 0 300 200',
    'segments': [
        {'id': 'top-white', 'name': 'Top White Stripe (North Side)', 'shape': 'rect', 'props': {'x': 0, 'y': 0, 'width': 300, 'height': 33.3}, 'correctColor': 'white'},
        {'id': 'top-blue', 'name': 'Top Blue Stripe (Lake Michigan & North Branch)', 'shape': 'rect', 'props': {'x': 0, 'y': 33.3, 'width': 300, 'height': 33.3}, 'correctColor': 'light-blue'},
        {'id': 'middle-white', 'name': 'Middle White Stripe (West Side)', 'shape': 'rect', 'props': {'x': 0, 'y': 66.6, 'width': 300, 'height': 66.6}, 'correctColor': 'white'},
        {'id': 'bottom-blue', 'name': 'Bottom Blue Stripe (South Branch & Sanitary Canal)', 'shape': 'rect', 'props': {'x': 0, 'y': 133.2, 'width': 300, 'height': 33.3}, 'correctColor': 'light-blue'},
        {'id': 'bottom-white', 'name': 'Bottom White Stripe (South Side)', 'shape': 'rect', 'props': {'x': 0, 'y': 166.5, 'width': 300, 'height': 33.5}, 'correctColor': 'white'},
        {'id': 'stars', 'name': 'Four Red Six-Pointed Stars', 'shape': 'path', 'props': {'d': 'M 60 90 L 64 96 L 72 96 L 66 100 L 69 108 L 60 103 L 51 108 L 54 100 L 48 96 L 56 96 Z M 120 90 L 124 96 L 132 96 L 126 100 L 129 108 L 120 103 L 111 108 L 114 100 L 108 96 L 116 96 Z M 180 90 L 184 96 L 192 96 L 186 100 L 189 108 L 180 103 L 171 108 L 174 100 L 168 96 L 176 96 Z M 240 90 L 244 96 L 252 96 L 246 100 L 249 108 L 240 103 L 231 108 L 234 100 L 228 96 L 236 96 Z'}, 'correctColor': 'red'},
    ],
    'palette': [colors[c] for c in ['white', 'light-blue', 'red', 'dark-blue', 'gold']],
    'trivia': "Often voted the best city flag in America! The four 6-pointed red stars represent Fort Dearborn, the Great Chicago Fire, the World's Columbian Exposition, and the Century of Progress.",
    'colorMeaning': [{'color': 'Light Blue', 'meaning': 'Lake Michigan & the Chicago River branches'}, {'color': 'White', 'meaning': 'North, West, and South sides of Chicago'}, {'color': 'Red', 'meaning': 'Historical milestones and fiery resilience'}]
})

flags_data.append({
    'id': 'color-ams',
    'countryCode': 'AMS',
    'name': 'Amsterdam',
    'difficulty': 2,
    'viewBox': '0 0 300 200',
    'segments': [
        {'id': 'top-red', 'name': 'Top Red Stripe', 'shape': 'rect', 'props': {'x': 0, 'y': 0, 'width': 300, 'height': 66.67}, 'correctColor': 'red'},
        {'id': 'middle-black', 'name': 'Middle Black Stripe with Three Saltires', 'shape': 'rect', 'props': {'x': 0, 'y': 66.67, 'width': 300, 'height': 66.67}, 'correctColor': 'black'},
        {'id': 'bottom-red', 'name': 'Bottom Red Stripe', 'shape': 'rect', 'props': {'x': 0, 'y': 133.34, 'width': 300, 'height': 66.67}, 'correctColor': 'red'},
        {'id': 'crosses', 'name': 'Three White St. Andrew\'s Crosses (Andreaskruisen)', 'shape': 'path', 'props': {'d': 'M 65 80 L 73 80 L 85 96 L 97 80 L 105 80 L 91 100 L 105 120 L 97 120 L 85 104 L 73 120 L 65 120 L 79 100 Z M 130 80 L 138 80 L 150 96 L 162 80 L 170 80 L 156 100 L 170 120 L 162 120 L 150 104 L 138 120 L 130 120 L 144 100 Z M 195 80 L 203 80 L 215 96 L 227 80 L 235 80 L 221 100 L 235 120 L 227 120 L 215 104 L 203 120 L 195 120 L 209 100 Z'}, 'correctColor': 'white'},
    ],
    'palette': [colors[c] for c in ['red', 'black', 'white', 'blue', 'gold']],
    'trivia': "Based on the Persijn heraldic shield, popular folklore suggests the three saltires guard against Amsterdam's historical perils: flood, fire, and the black plague.",
    'colorMeaning': [{'color': 'Red & Black', 'meaning': 'The heraldic shield of the Persijn family'}, {'color': 'White', 'meaning': 'Saint Andrew’s crosses of civic fortitude'}]
})

flags_data.append({
    'id': 'color-wdc',
    'countryCode': 'WDC',
    'name': 'Washington, D.C.',
    'difficulty': 2,
    'viewBox': '0 0 300 150',
    'segments': [
        {'id': 'field', 'name': 'White Field Background', 'shape': 'rect', 'props': {'x': 0, 'y': 0, 'width': 300, 'height': 150}, 'correctColor': 'white'},
        {'id': 'top-bar', 'name': 'Top Red Horizontal Bar', 'shape': 'rect', 'props': {'x': 0, 'y': 60, 'width': 300, 'height': 22.5}, 'correctColor': 'red'},
        {'id': 'bottom-bar', 'name': 'Bottom Red Horizontal Bar', 'shape': 'rect', 'props': {'x': 0, 'y': 105, 'width': 300, 'height': 22.5}, 'correctColor': 'red'},
        {'id': 'three-stars', 'name': 'Three Red 5-Pointed Mullets (Stars)', 'shape': 'path', 'props': {'d': 'M 50 15 L 53 25 L 63 25 L 55 31 L 58 41 L 50 35 L 42 41 L 45 31 L 37 25 L 47 25 Z M 150 15 L 153 25 L 163 25 L 155 31 L 158 41 L 150 35 L 142 41 L 145 31 L 137 25 L 147 25 Z M 250 15 L 253 25 L 263 25 L 255 31 L 258 41 L 250 35 L 242 41 L 245 31 L 237 25 L 247 25 Z'}, 'correctColor': 'red'},
    ],
    'palette': [colors[c] for c in ['white', 'red', 'blue', 'gold', 'black']],
    'trivia': "Based on the 12th-century ancestral coat of arms of George Washington’s family from Sulgrave Manor in Northamptonshire, England.",
    'colorMeaning': [{'color': 'White', 'meaning': 'The spotless field of peace and civic law'}, {'color': 'Red', 'meaning': 'The two bars and three stars (mullets) of the Washington family arms'}]
})

# Historical Flags
flags_data.append({
    'id': 'color-ussr',
    'countryCode': 'USSR',
    'name': 'Soviet Union (USSR)',
    'difficulty': 2,
    'viewBox': '0 0 300 150',
    'segments': [
        {'id': 'field', 'name': 'Red Revolutionary Field', 'shape': 'rect', 'props': {'x': 0, 'y': 0, 'width': 300, 'height': 150}, 'correctColor': 'red'},
        {'id': 'hammer-sickle', 'name': 'Golden Hammer and Sickle', 'shape': 'path', 'props': {'d': 'M 40 45 A 25 25 0 0 1 72 38 L 75 42 A 20 20 0 0 0 45 48 Z M 48 35 L 56 43 L 52 47 L 44 39 Z M 55 50 L 70 65 L 65 70 L 50 55 Z'}, 'correctColor': 'gold'},
        {'id': 'star', 'name': 'Gold-Bordered Red Star', 'shape': 'path', 'props': {'d': 'M 50 15 L 53 23 L 61 23 L 55 28 L 57 36 L 50 31 L 43 36 L 45 28 L 39 23 L 47 23 Z'}, 'correctColor': 'gold'},
    ],
    'palette': [colors[c] for c in ['red', 'gold', 'yellow', 'white', 'black']],
    'trivia': "The red flag with gold hammer (workers) and sickle (peasants) was the iconic state symbol of the Soviet Union from 1923 until its dissolution in 1991.",
    'colorMeaning': [{'color': 'Red', 'meaning': 'The blood shed by working-class revolutionaries'}, {'color': 'Gold', 'meaning': 'The unity of industrial workers (hammer) and agricultural peasants (sickle)'}]
})

out_path = 'src/data/colorFlags.ts'
content = """// Curated interactive flags for the Flag Painter / Colour-In mode
// Each flag contains precision SVG vector segments ready to be painted!

export interface ColorSegment {
  id: string;
  name: string;
  shape: 'rect' | 'circle' | 'polygon' | 'path';
  props: Record<string, any>;
  correctColor: string;
}

export interface ColorOption {
  id: string;
  name: string;
  hex: string;
}

export interface ColorMeaning {
  color: string;
  meaning: string;
}

export interface ColorFlag {
  id: string;
  countryCode: string;
  name: string;
  difficulty: 1 | 2 | 3;
  viewBox: string;
  segments: ColorSegment[];
  palette: ColorOption[];
  trivia: string;
  colorMeaning: ColorMeaning[];
}

export const COLOR_FLAGS: ColorFlag[] = """ + json.dumps(flags_data, indent=2) + ";\n"

with open(out_path, 'w', encoding='utf-8') as f:
    f.write(content)

print(f"Generated {len(flags_data)} color flags in {out_path} successfully!")
