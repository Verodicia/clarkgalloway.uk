import json, re

# Japanese numerals map
num_map = {
    '一': 1, '二': 2, '三': 3, '四': 4, '五': 5, '六': 6, '七': 7, '八': 8, '九': 9, '十': 10,
    '十一': 11, '十二': 12, '十三': 13, '十四': 14, '十五': 15, '十六': 16, '十七': 17, '十八': 18, '十九': 19, '二十': 20,
    '二十一': 21, '二十二': 22, '二十三': 23, '二十四': 24, '二十五': 25, '二十六': 26, '二十七': 27, '二十八': 28
}

lesson_meta = {
    1: {
        "title": "First Encounters & Languages",
        "subtitle": "日本語が分かりますか？",
        "stage": 1,
        "category": "Foundations",
        "grammar": "Particle が marks the object of ability/understanding (e.g. 英語が分かります). Particle は marks the topic (日本語は分かりますか). Polite negation: 分かりません.",
        "culture": "Opening conversations politely with 'Sumimasen' (Excuse me) is fundamental Japanese etiquette."
    },
    2: {
        "title": "Greetings, Weather & Humility",
        "subtitle": "いいお天気ですね",
        "stage": 1,
        "category": "Foundations",
        "grammar": "Sentence-ending particle ね seeks agreement ('isn't it?'). Polite negative for adjectives/nouns: じゃありません (Jōzu ja arimasen).",
        "culture": "Modesty is prized: when someone compliments your Japanese with 'Jōzu desu ne', the customary polite response is humility: 'Mada jōzu ja arimasen' (Not yet skilled)."
    },
    3: {
        "title": "Conversational Connectors & Greetings",
        "subtitle": "よく・でも・まだ",
        "stage": 1,
        "category": "Foundations",
        "grammar": "Adverbs: よく (well/often), まだ (not yet/still), でも (but/however). 'Dōmo' is a versatile polite acknowledgement.",
        "culture": "'Konnichiwa' is primarily used during daylight hours among acquaintances, whereas 'Dōmo' serves as a friendly, all-purpose acknowledgement."
    },
    4: {
        "title": "Locations: Shinjuku & Ueno",
        "subtitle": "新宿駅はどこですか？",
        "stage": 1,
        "category": "Navigation",
        "grammar": "Location demonstratives: ここ (here), そこ (there), あそこ (over there). Asking where something is: [Place] は どこ ですか？",
        "culture": "Shinjuku Station is the busiest transport hub in the world. Learning to ask 'Doko desu ka' is a traveler's lifeline."
    },
    5: {
        "title": "Offers to Eat & Drink",
        "subtitle": "何か食べませんか？",
        "stage": 1,
        "category": "Dining",
        "grammar": "Invitational negative-question form 〜ませんか (Won't you...?): 食べませんか (Won't you eat?), 飲みませんか (Won't you drink?). 何か (Nanika) = something.",
        "culture": "Politely declining an offer is done with 'Kekkō desu' (No thank you, I am fine) rather than a blunt 'No'."
    },
    6: {
        "title": "Where & When: Eating Together",
        "subtitle": "どこで食べますか？",
        "stage": 1,
        "category": "Dining",
        "grammar": "Particle で marks the location of an action (どこで食べますか). Particle も indicates 'also/too' (私も = me too). Time words: 今 (ima = now), 後で (ato de = later).",
        "culture": "'Tokoro' means place. 'Anata no tokoro' (your place) or 'Watashi no tokoro' (my place) is common casual phrasing."
    },
    7: {
        "title": "Ordering Beverages: Beer & Sake",
        "subtitle": "麦酒が欲しい・お酒を",
        "stage": 1,
        "category": "Dining",
        "grammar": "Expressing desire with 欲しい (hoshii = want): 麦酒が欲しい (I want beer). Negative: 欲しくありません (I don't want). Particle を marks direct object.",
        "culture": "'Osake' technically means alcohol in general, but often refers specifically to Japanese rice wine (nihonshu). 'Bīru' is loanword beer (kanji 麦酒)."
    },
    8: {
        "title": "Orders & Companions: Tanaka-san",
        "subtitle": "ビール二本お願いします",
        "stage": 2,
        "category": "Izakaya & Social",
        "grammar": "Counter for cylindrical items/bottles: 〜本 (hon/bon/pon) ➔ 一本 (ippon), 二本 (nihon). Particle と marks 'with': あなたと (with you), 田中さんと (with Tanaka-san).",
        "culture": "'Onegaishimasu' is essential when requesting items or service at restaurants, bars, and shops."
    },
    9: {
        "title": "Time & Scheduling in Tokyo",
        "subtitle": "何時に？一時・八時",
        "stage": 2,
        "category": "Time & Travel",
        "grammar": "Asking time: 何時に (nan-ji ni = at what time?). Suffix 〜時 (ji = o'clock): 一時 (ichi-ji), 八時 (hachi-ji), 九時 (ku-ji - notice irregular reading 'ku', not 'kyū').",
        "culture": "Tokyo runs with atomic precision; time coordination with 〜時に is taken very seriously in Japanese society."
    },
    10: {
        "title": "Desire Forms: 〜たい (Want to do)",
        "subtitle": "食べたい・飲みたい",
        "stage": 2,
        "category": "Dining & Time",
        "grammar": "Verb desire suffix: Verb stem + たいです (want to): 食べたい (want to eat), 飲みたい (want to drink). Negative: 〜たくありません (tabetaku arimasen).",
        "culture": "'Chotto...' (a little...) followed by trailing silence is the classic polite Japanese way to decline an inconvenient time without saying 'No'."
    },
    11: {
        "title": "Evening Plans: Tonight & Tomorrow",
        "subtitle": "今晩・明日の晩",
        "stage": 2,
        "category": "Scheduling",
        "grammar": "Time vocabulary: 今日 (kyō = today), 今晩 (konban = tonight), 明日 (ashita = tomorrow), 晩御飯 (bangohan = dinner). Making requests: 聞いてください (Please listen).",
        "culture": "Evening dinner invitations (晩御飯を食べませんか) are the primary way friendships and business bonds are cemented in Japan."
    },
    12: {
        "title": "Prices & Counting Thousands of Yen",
        "subtitle": "お酒はいくらですか？",
        "stage": 2,
        "category": "Shopping & Money",
        "grammar": "Asking prices: いくらですか (How much is it?). Thousands counter 千 (sen): 千円 (1,000 yen), 二千円 (2,000 yen), 三千円 (san-zen'en - sound change 'zen'), 四千円 (yon-sen'en), 七千円 (nana-sen'en).",
        "culture": "Japan is traditionally a cash-revering society. Being fluid with 'sen-en' (thousands of yen) makes shopping effortless."
    },
    13: {
        "title": "Carrying Money & Payment",
        "subtitle": "今日はお金を持っています",
        "stage": 2,
        "category": "Shopping & Money",
        "grammar": "Verb 持っています (motte imasu = have/possess/carrying). Note: No particle needed directly after currency value: 三千円持っています.",
        "culture": "'Dōzo' (Here you go / Please) is polite etiquette when handing currency or drinks across the counter."
    },
    14: {
        "title": "Yen, Dollars & Polite Requests",
        "subtitle": "円をください・ありますか",
        "stage": 2,
        "category": "Shopping & Money",
        "grammar": "Requesting: [Noun] を ください (Please give me...). Existence of inanimate objects: ありますか (Do you have...?). Quantity: たくさん (a lot), 少し (a little).",
        "culture": "Numbers 11-19: 十九 (jū-kyū = 19). Combining counters with polite requests forms the backbone of market interactions."
    },
    15: {
        "title": "Departures & Potential Form",
        "subtitle": "いってきます・食べられ",
        "stage": 3,
        "category": "Daily Life",
        "grammar": "Potential form (ability): 食べられます (can eat), 買えます (can buy). Adverb 全然 (zenzen = not at all, used with negative). Daily greeting: いってきます (I'm leaving / off I go).",
        "culture": "'Ittekimasu' (literally 'I'll go and come back') is shouted whenever leaving home or office, answered with 'Itterasshai'!"
    },
    16: {
        "title": "Telephone Dialogues & Decisions",
        "subtitle": "電話での会話・十分",
        "stage": 3,
        "category": "Communication",
        "grammar": "Sufix 〜すぎます (too much/excessive): 多すぎます (too much). Adverb 十分 (jūbun = enough/sufficient). Response: どういたしまして (You're welcome).",
        "culture": "Phone etiquette in Japan is exceptionally refined. 'Moshi moshi' is standard when answering phone calls."
    },
    17: {
        "title": "Shopping & Expressing Excess",
        "subtitle": "高すぎます・ゆっくり",
        "stage": 3,
        "category": "Shopping",
        "grammar": "Adjective excess: 高すぎます (too expensive), 早すぎます (too fast/early). Requesting pace: ゆっくり (slowly). Desiring action: 買い物をしたい (want to do shopping).",
        "culture": "Asking someone to speak slower ('Yukkuri hanashite kudasai') is celebrated by native speakers as earnest effort."
    },
    18: {
        "title": "Spouses, Possessions & Wants",
        "subtitle": "日本の本・ご主人・家内",
        "stage": 3,
        "category": "Family & Society",
        "grammar": "Modifying nouns with の: 日本の本 (Japanese book). Third-person desires with 〜たがっている: 飲みたがっている (wants to drink).",
        "culture": "Humility in family references: My husband = 主人 (shujin) / My wife = 家内 (kanai); Someone else's husband = ご主人 (goshujin) / Someone else's wife = 奥さん (okusan)."
    },
    19: {
        "title": "Welcoming Guests & Introductions",
        "subtitle": "いらっしゃいませ・お入りください",
        "stage": 3,
        "category": "Hospitality",
        "grammar": "Honorific invitations: お入りください (Please come in). Introducing oneself: 初めまして、どうぞよろしく (Nice to meet you, pleased to make your acquaintance).",
        "culture": "'Irasshaimase' greets you in every Japanese business; in a home, guests are warmly invited with 'Dōzo ohairi kudasai'."
    },
    20: {
        "title": "Talking About Children & Quantities",
        "subtitle": "男の子・女の子・子供さん",
        "stage": 3,
        "category": "Family & Counters",
        "grammar": "Counters for people: 三人 (san-nin = 3 people), 四人 (yo-nin - notice irregular 'yo', not 'yon'). 男の子 (boy), 女の子 (girl). Adjectives: 大きい (big), 小さい (small).",
        "culture": "Polite suffix 〜さん added to another person's child: 子供さん (kodomo-san), while referring to one's own children simply as 子供 (kodomo)."
    },
    21: {
        "title": "People Counters & Amenities",
        "subtitle": "一人・二人・お手洗い",
        "stage": 3,
        "category": "Counters & Locations",
        "grammar": "Irregular native people counters: 一人 (hitori = 1 person), 二人 (futari = 2 people). Restroom inquiries: お手洗い (otearai) / トイレ (toire).",
        "culture": "'Otearai' (literally 'hand-wash') is the more polite, elegant term for the restroom, though 'toire' is universally understood."
    },
    22: {
        "title": "Quoting Speech & Vehicles",
        "subtitle": "〜と言って・日本の車",
        "stage": 4,
        "category": "Complex Conversation",
        "grammar": "Quoting particle と + 言う (say): 〜と言って (saying that...), と答えました (answered that...). Counter for volume: リッター (liters).",
        "culture": "Japan is world-renowned for precision automobiles (日本の車); gas stations often offer full service (full-tank refueling)."
    },
    23: {
        "title": "Asking Inquiries & Fueling Up",
        "subtitle": "尋ね・満タン・ちょっと待って",
        "stage": 4,
        "category": "Travel & Driving",
        "grammar": "Fill it up: 満タン (mantan). Please wait: ちょっと待ってください (chotto matte kudasai). Distances: 遠い (tōi = far), まっすぐ (straight ahead).",
        "culture": "'Mantan de onegaishimasu' is the universal phrase at Japanese gas stations to fill the gas tank completely."
    },
    24: {
        "title": "Navigating Tokyo: Street Directions",
        "subtitle": "東京へ行く道・右・左",
        "stage": 4,
        "category": "Navigation",
        "grammar": "Directional particle へ / に (towards): 東京へ行く道 (road heading to Tokyo). Directions: 右 (migi = right), 左 (hidari = left), まっすぐ (straight), それから (and then...).",
        "culture": "Tokyo's street naming system is based on blocks rather than road names, making landmark and directional guidance (migi/hidari) essential."
    },
    25: {
        "title": "Store Hours & Explaining Reasons",
        "subtitle": "どうして・お店閉まって・遅い",
        "stage": 4,
        "category": "Daily Life",
        "grammar": "Asking reasons: どうして (dōshite = why?). Giving reasons with から (because): 遅いから (because it is late). State of being: 閉まっています (closed), 開いています (open).",
        "culture": "Department stores (depāto) in Japan usually close around 8:00 PM, while convenience stores (konbini) remain open 24/7."
    },
    26: {
        "title": "Meeting Friends in Yokohama",
        "subtitle": "友達に会います・横浜",
        "stage": 4,
        "category": "Social & Travel",
        "grammar": "Meeting someone takes particle に: 友達に会います (meet a friend). Multiple approximate people: 二三人 (ni-san-nin = 2 or 3 people). Probability: 多分 (tabun = probably).",
        "culture": "Yokohama, just south of Tokyo, is Japan's second-largest city and a scenic harbor destination full of international history."
    },
    27: {
        "title": "Counting Days & Extended Stays",
        "subtitle": "何日？一日・二日・三日",
        "stage": 4,
        "category": "Calendar & Travel",
        "grammar": "Calendar days: 一日 (tsuitachi / ichinichi), 二日 (futsuka), 三日 (mikka). Reason with 〜から: ここにいたいですから (Because I want to stay here). Returning: 帰ります (kaerimasu).",
        "culture": "Day counters in Japanese have deeply ancient native readings (futsuka, mikka, yokka) that differ completely from standard numbers."
    },
    28: {
        "title": "Duration of Stay & Asking Meaning",
        "subtitle": "過ごしたい・どういう意味ですか",
        "stage": 4,
        "category": "Advanced Expression",
        "grammar": "Spending time: 過ごしたい (sugoshitai = want to spend/pass time). Four days: 四日 (yokka). Asking definitions: 〜はどういう意味ですか (What does that mean?).",
        "culture": "Asking 'Dō iu imi desu ka?' unlocks limitless learning by letting native speakers explain Japanese phrases in Japanese!"
    }
}

print('Configured metadata for all 28 lessons.')
