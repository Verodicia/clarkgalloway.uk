# Clark Galloway's Vexillum

A rich, web-based vexillology game and interactive flag encyclopedia. Features **500 scalable vector (SVG)
flags** spanning sovereign nations, territories, and subdivisions (US states,
Canadian provinces, Australian states, German Bundesländer, Spanish autonomous
communities, UK nations, Mexican states, and Colombian departments).

---

## 🎮 Game Modes

1. **🎯 Flag Quiz (Multiple Choice & Reverse)**
   - **Flag ➔ Name**: Given a crisp scalable SVG flag, identify the country or
     province from 4 plausible choices.
   - **Name ➔ Flag**: Reverse mode! Given a nation or state name, pick the
     correct flag among 4 high-res flag cards.
   - Keyboard hotkeys `1`, `2`, `3`, `4` supported.
   - Combo streak counter and vexillological trivia cards after each question.

2. **🔤 Flag Typist (Spelling & Knowledge Bee)**
   - Type the name of the country or state with diacritic-tolerant fuzzy
     matching and aliases.
   - Tiered hint system:
     - Hint 1: Region / Continent
     - Hint 2: Capital city
     - Hint 3: First letter & length
   - Smart autocomplete suggestions as you type.

3. **⚡ 60-Second Blitz Rush**
   - High-energy timed challenge against the clock.
   - Combo multipliers:
     - 3+ streak = **2x Multiplier**
     - 6+ streak = **3x Multiplier**
     - 10+ streak = **4x Multiplier!**
   - End-of-round rank titles from _Vexillology Novice_ up to _Grand
     Vexillologist (Sheldon Tier)_.

4. **🧩 Memory Match**
   - Interactive card-matching game (12 cards / 6 pairs or 16 cards / 8 pairs).
   - Match flag cards with their corresponding country/state names.
   - Timer, move counter, and audio feedback.

5. **🔍 Detective Zoom (Canton & Emblem Guess)**
   - Flags start zoomed in 400% on a specific emblem, canton, or crest.
   - The flag progressively reveals itself over 15 seconds.
   - Early guesses yield maximum points (up to 1,000 pts per round).

6. **💖 Survival Streak (Sudden Death)**
   - Start with 3 hearts.
   - Every mistake costs a life; consecutive 5-streaks restore a shield/heart.
   - How deep into the 500 flag library can you survive?

7. **📚 Flag Library & Flashcard Study Center**
   - Full explorer across all **500 flags**.
   - Search by name, capital, country, region, or trivia keywords.
   - Category filters: World Countries, US States, Canadian Provinces, German
     States, Australian States, Spanish Regions, UK Nations, and Favorites.
   - **Interactive Flashcard Mode**: Flip cards to study flags, capitals, and
     vexillology history.
   - **Drill / Practice Button**: Jump directly into a custom quiz drilled on
     any specific flag.
   - LocalStorage bookmark / favorite system.

---

## 🎨 Visuals & Scalability

- **100% Vector SVG**: All flags are stored locally as SVG files in
  `public/flags/` for crisp, infinite scalability across retina displays and
  smartphones.
- **Audio Synthesizer**: Built-in zero-dependency Web Audio API sound effects
  (correct chimes, buzzers, clock ticks, and victory arpeggios).
- **Celebrations**: Canvas-confetti effects on high scores and combo streaks.
- **Progress Tracking**: Tracks games played, accuracy percentage, best streaks,
  mode high scores, and achievement badges stored in browser `localStorage`.

---

## 🚀 Running the App

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build production bundle
npm run build
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 📱 Mobile App (iOS & Android)

**Clark Galloway's Vexillum** is configured as a native mobile application using
[Capacitor](https://capacitorjs.com/):

### Features for Mobile

- **Haptic Feedback**: Native tactile vibrations on correct/wrong answers,
  clicks, streaks, and victories via `@capacitor/haptics`.
- **Status Bar & Theming**: Integrated dark status bar and edge-to-edge support
  via `@capacitor/status-bar`.
- **Safe Area Support**: CSS environment safe area insets configured for modern
  iPhone notches, Dynamic Island, and Android gesture bars.
- **Offline First**: All 500 vector SVG flag assets and synthetic Web Audio
  sound effects are bundled locally into the native app package.

### Syncing Web Assets to Native Platforms

Whenever you make updates to the web app:

```bash
npm run cap:sync
```

### Running on iOS

To open the Xcode project:

```bash
npm run cap:ios
```

_Requires a Mac with Xcode installed. You can test directly on the iOS Simulator
or deploy to your iPhone._

### Running on Android

To open the Android Studio project:

```bash
npm run cap:android
```

_Requires Android Studio and Java Runtime. You can test directly on the Android
Emulator or deploy to your Android device via USB debugging._
