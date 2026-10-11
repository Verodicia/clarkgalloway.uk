import json, re

with open('Japanese/extracted_content.txt', 'r', encoding='utf-8') as f:
    text = f.read()

from build_lessons import lesson_meta, num_map
from translation_map import translations

pattern = r'レッスン\s*([一二三四五六七八九十]+)\s*\n(.*?)(?=(?:レッスン\s*[一二三四五六七八九十]+)|\Z)'
matches = re.findall(pattern, text, re.DOTALL)

all_lessons = []

for idx, (k_num, body) in enumerate(matches):
    num = num_map.get(k_num, idx + 1)
    meta = lesson_meta.get(num, {
        "title": f"Lesson {num}",
        "subtitle": f"レッスン {k_num}",
        "stage": 1 if num <= 7 else (2 if num <= 14 else (3 if num <= 21 else 4)),
        "category": "Communication",
        "grammar": "Focus on natural conversational fluency and sentence patterns.",
        "culture": "Observing polite forms and cultural context."
    })
    
    raw_lines = [l.strip() for l in body.strip().split('\n') if l.strip()]
    
    phrases = []
    vocab_list = []
    
    for line in raw_lines:
        clean_line = re.sub(r'\s+', ' ', line).strip()
        if not clean_line:
            continue
            
        # Check if line is in translations dictionary
        found = False
        for k_t, (romaji, en) in translations.items():
            if k_t == clean_line or (len(k_t) > 3 and k_t in clean_line):
                phrases.append({
                    "ja": clean_line,
                    "romaji": romaji,
                    "en": en
                })
                found = True
                break
                
        if not found:
            # Fallback for short vocabulary or furigana lines
            phrases.append({
                "ja": clean_line,
                "romaji": "",
                "en": ""
            })
            
    # Deduplicate and refine phrases
    refined_phrases = []
    seen = set()
    for p in phrases:
        if p["ja"] not in seen:
            seen.add(p["ja"])
            # Auto-assign romaji/en if missing
            if not p["romaji"]:
                p["romaji"] = p["ja"]
                p["en"] = "Vocabulary focus"
            refined_phrases.append(p)
            
    # Create interactive bite-sized reinforcement quiz
    # 3 questions per lesson
    # Question 1: Japanese to English comprehension
    # Question 2: English to Japanese recall
    # Question 3: Grammar or cultural usage
    quiz = []
    
    # Pick a key phrase from the lesson
    key_phrase = refined_phrases[0] if refined_phrases else {"ja": "すみません", "romaji": "Sumimasen", "en": "Excuse me"}
    second_phrase = refined_phrases[1] if len(refined_phrases) > 1 else key_phrase
    
    q1 = {
        "question": f"What does 「{key_phrase['ja']}」 ({key_phrase['romaji']}) mean in English?",
        "options": [
            key_phrase['en'],
            "See you tomorrow",
            "Where is the hotel?",
            "It is too expensive"
        ],
        "answer": 0,
        "explanation": f"「{key_phrase['ja']}」 translates directly to \"{key_phrase['en']}\"."
    }
    
    q2 = {
        "question": f"How do you say \"{second_phrase['en']}\" in polite Japanese?",
        "options": [
            "結構です (Kekkō desu)",
            second_phrase['ja'] + f" ({second_phrase['romaji']})",
            "分かりません (Wakarimasen)",
            "こんにちは (Konnichiwa)"
        ],
        "answer": 1,
        "explanation": f"To say \"{second_phrase['en']}\", say 「{second_phrase['ja']}」."
    }
    
    # Question 3: Grammar or Culture
    q3 = {
        "question": f"Grammar Insight for Lesson {num}: {meta['title']}",
        "options": [
            meta['grammar'][:55] + "...",
            "Always use blunt imperative forms with strangers",
            "Numbers never change pronunciation in Japanese",
            "Pronouns like 'watashi' must be repeated in every clause"
        ],
        "answer": 0,
        "explanation": meta['grammar']
    }
    
    quiz = [q1, q2, q3]
    
    lesson_obj = {
        "id": num,
        "number": num,
        "kanjiNumber": k_num,
        "title": meta["title"],
        "subtitle": meta["subtitle"],
        "stage": meta["stage"],
        "category": meta["category"],
        "grammar": meta["grammar"],
        "culture": meta["culture"],
        "phrases": refined_phrases,
        "quiz": quiz
    }
    
    all_lessons.append(lesson_obj)

all_lessons.sort(key=lambda x: x["id"])

print(f"Generated {len(all_lessons)} lessons successfully.")

# Write to javascript file
js_content = "/* Auto-generated Japanese Lessons Data for Clark Galloway */\n"
js_content += "const JAPANESE_LESSONS = " + json.dumps(all_lessons, ensure_ascii=False, indent=2) + ";\n"

with open("japanese-data.js", "w", encoding="utf-8") as f:
    f.write(js_content)

print("Saved to japanese-data.js (bytes: " + str(len(js_content)) + ")")
