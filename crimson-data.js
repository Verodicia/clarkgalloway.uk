/**
 * The Crimson Sacrament — Worldbuilding, Mechanics & Character Data
 * Grounded in the original campaign lore by Clark Galloway.
 */

const CRIMSON_DATA = {
  campaign: {
    title: "The Crimson Sacrament",
    tagline: "Blood remembers what the stones have forgotten.",
    premise: "For one thousand years, the Kingdom of Aethelgard has stood impregnable while all surrounding empires crumbled to ruin. The secret of its unbroken reign is a legendary relic hidden within the royal vault: a ruby blade capable of slaying any target in existence—demanding only the bearer's own soul in return. As the kingdom prepares for the Millennial Jubilee, an inter-kingdom security guild arrives at the capital, unaware that a court archivist and shadowy conspirators are about to unearth the realm's darkest sacrament.",
    startingVillage: {
      name: "Faylight",
      region: "Verdant Expanse Borderlands",
      summary: "A rustic border hamlet nestled between ancient willow-groves and the paved King's Road. It serves as the final waystation for travelers journeying between Aethelgard, the Sundered Marches, and the Ashen Wastes. The party convenes at the 'Clover & Lantern' inn under official contract to escort dignitaries to the Millennial Jubilee."
    }
  },

  realms: [
    {
      id: "aethelgard",
      name: "The Noble Kingdom of Aethelgard",
      territory: "The Verdant Expanse",
      capital: "Aethelgard City",
      status: "Sovereign Monarchy (1,000-Year Stability)",
      bannerColor: "#8b1828",
      accent: "hsl(348, 80%, 45%)",
      summary: "A sprawling, prosperous land of emerald river-valleys, marble cathedrals, and soaring gothic spires. Behind its facade of cultural splendor lies ruthless state censorship and a silent dread: the crown has eliminated any existential threat for a millennium using the secret Ruby Blade.",
      history: "Founded a millennium ago under the first Sanguine Concordat. While surrounding nations drowned in civil wars and arcane apocalypses, Aethelgard remained untouchable. Historians celebrate its divine favor; whisperers know every hostile monarch or warlord met a sudden, inexplicable death at the hands of fanatical martyrs.",
      landmark: "The Obsidian Cloister & The Sovereign Vault",
      landmarkDesc: "Deep beneath the high palace of Aethelgard lies the most heavily fortified vault in the known world. Guarded by mute paladins of the Silent Vigil and warded with anti-divination glyphs, it houses the ruby blade.",
      currentEvents: "Preparations are at fever pitch for the Millennial Jubilee—a multi-week festival of knightly jousts, grand aristocratic masquerades, and civic processions designed to project invincible royal majesty.",
      hazards: ["Royal Censor Inquisitors", "Obsidian Ward-Traps", "High Court Intrigue", "Lunar Eclipse Omen-Pulse"],
      coordinates: { x: 50, y: 35 } // % on map
    },
    {
      id: "sundered-marches",
      name: "The Sundered Marches",
      territory: "Formerly The Kingdom of Valoria",
      capital: "Talon's Rest",
      status: "Fractured Warlord Enclaves",
      bannerColor: "#57606f",
      accent: "hsl(215, 25%, 55%)",
      summary: "A jagged, blood-soaked expanse of ruined fortresses, scarred battlefields, and fortified trade outposts. Valoria was once the martial jewel of the continent before a succession war tore it apart.",
      history: "Sundered 250 years ago. When the high king died without a clear heir, rival ducal houses unleashed mercenary armies in a 40-year bloodbath that starved the countryside and burned its libraries. The crown dissolved, leaving only mercenary companies and iron-barons.",
      landmark: "Talon's Rest",
      landmarkDesc: "A bustling frontier boomtown built inside the ribcage of an ancient mountain citadel. It is the premier gathering ground for sellswords, illicit antiquities dealers, and refugees fleeing feudal tyranny.",
      currentEvents: "Rival warbands are gathering near the Aethelgard border, eager to use the distraction of the Millennial Jubilee to smuggle contraband or offer their blades to dissident nobles.",
      hazards: ["Free Company Brigands", "Unexploded Siege-Runes", "Blood-Feud Skirmishes", "Iron Toll-Forts"],
      coordinates: { x: 20, y: 42 }
    },
    {
      id: "ashen-wastes",
      name: "The Ashen Wastes",
      territory: "Formerly The Kingdom of Elysia",
      capital: "Cinderfall",
      status: "Desolate Ash Plains & Scavenger Clans",
      bannerColor: "#d35400",
      accent: "hsl(24, 85%, 50%)",
      summary: "A bleak, fog-shrouded wilderness choked with volcanic ash and calcified forests. What was once the breadbasket of the continent is now a scorched graveyard of arcane hubris.",
      history: "Destroyed 150 years ago in 'The Great Cataclysm of Elysia'. A cabal of royal thaumaturges attempted to tap into a primal subterranean ley-nexus to grant their kingdom eternal harvest. The ritual fractured the earth, discharging catastrophic pyroclastic waves that calcified crops, cities, and civilians in minutes.",
      landmark: "Cinderfall",
      landmarkDesc: "A stark city constructed entirely from the obsidian basalt ruins of the former Elysian capital. Inhabitants wear brass respirators and trade in fire-glass and dredged pre-cataclysm relics.",
      currentEvents: "Ash-Weavers have detected seismic resonance coming from Aethelgard—matching the frequency of the cataclysmic energy they have studied for generations.",
      hazards: ["Cinder Storms (Respiration checks)", "Molten Glass Fissures", "Ash-Husk Revenants", "Unstable Ley-Bleed"],
      coordinates: { x: 82, y: 38 }
    },
    {
      id: "broken-isles",
      name: "The Broken Isles",
      territory: "Formerly The Archipelago of Solara",
      capital: "Shattered Point",
      status: "Pirate Confederation & Sunken Ruins",
      bannerColor: "#1e3799",
      accent: "hsl(220, 75%, 55%)",
      summary: "A labyrinth of shattered sea-stacks, coral-crusted shipwrecks, and tempestuous channels. Formerly the maritime empire of Solara, it was fractured into thousands of fragments by a cataclysmic maelstrom.",
      history: "Shattered 100 years ago when a supernatural vortex—speculated to be the wrath of a drowned elemental god or a misfired celestial weapon—pulled whole island cities to the ocean floor within three tidal cycles.",
      landmark: "Shattered Point & The Maelstrom Eye",
      landmarkDesc: "A sprawling harbor village tethered together with floating docks, sunken galleon hulks, and rope bridges. It is governed by a loose council of Corsair Captains.",
      currentEvents: "Deep sea divers have brought up ancient seafloor tablets that depict a twin to the Ruby Blade: a relic crafted from oceanic sapphire, thought to have caused the great drown.",
      hazards: ["Ghost-Riptides", "Maelstrom Gale Squalls", "Corsair Ambushers", "Deep-Trench Leviathans"],
      coordinates: { x: 55, y: 78 }
    },
    {
      id: "faylight",
      name: "The Border Village of Faylight",
      territory: "Verdant Expanse Border Outpost",
      capital: "Village Council / Guild Lodge",
      status: "Crossroads Sanctuary (Player Starting Node)",
      bannerColor: "#27ae60",
      accent: "hsl(145, 60%, 45%)",
      summary: "A peaceful sanctuary of thatched cottages, watermills, and lantern-lit stone roads. It is the designated rendezvous for the player security unit prior to departing for the capital.",
      history: "Established six centuries ago as a demilitarized border haven where travelers from all kingdoms could take rest, repair carts, and trade without fear of arrest by royal inquisitors.",
      landmark: "The Clover & Lantern Inn",
      landmarkDesc: "A three-story roadside tavern built around the stump of a giant petrified ironwood tree. Its taproom is filled with merchants, bards rehearsing for the Jubilee, and nervous security officers.",
      currentEvents: "A courier bearing Lord Alden Vance's personal seal has just arrived with a classified dispatch marked for the Aegis Security Guild.",
      hazards: ["Infiltrating Inquisitor Informants", "Marches Cutpurses", "Crowded Road Delays"],
      coordinates: { x: 37, y: 55 }
    }
  ],

  relic: {
    name: "The Ruby Blade (The Crimson Sacrament)",
    altNames: ["The Tyrant's Bane", "The Sovereign's Cost", "The Soul-Glass Stiletto"],
    appearance: "A dagger forged with an impossibly flawless crimson-ruby crystalline blade that emits a low resonant hum in the dark. Its handle is carved from deep black lacquered bone wrapped in braided silver wire. When lunar eclipses occur, it bleeds a luminous scarlet vapor.",
    properties: [
      {
        title: "The Soul-for-Soul Covenant",
        rule: "The blade possesses the supernatural power to kill any living creature or planar entity chosen by the bearer, regardless of armor, wards, or divine protections.",
        cost: "In the exact instant the victim expires, the wielder's own soul and life-force are completely consumed. Both bodies disintegrate into fine crimson ash."
      },
      {
        title: "The Purity of Will (Anti-Coercion)",
        rule: "The sacrament will ONLY trigger if the bearer acts with absolute, unfettered personal desire to see the target dead. If the wielder is coerced, enchanted, blackmailed, or hired, the blade acts as an inert glass dagger.",
        historyNote: "The Crown tested this centuries ago by sending expendable thralls and convicts; every attempt failed until royal family members themselves were forced to make the ultimate sacrifice to save their dynasty."
      },
      {
        title: "Lunar Resonance",
        rule: "During every lunar eclipse, the blade vibrates at the resonant frequency of the vault, casting an eerie crimson luminescence throughout the highest towers of Aethelgard Palace."
      }
    ]
  },

  factions: [
    {
      id: "aegis-guild",
      name: "The Aegis Cohort (The Security Guild)",
      type: "Hereditary Security & Tactical Guild",
      reputation: "Renowned across all realms for unbreakable discipline and tactical cohesion.",
      description: "Unlike common mercenary bands who fight for the highest purse, the Aegis Cohort is a hereditary martial order. Guild membership is passed down through generations. Children are trained from age seven in squad coordination, shield-wall maneuvers, crisis triage, and confrontation psychology.",
      crest: "A silver kite shield crossed by a twin-linked chain on a field of navy.",
      playerRelation: "The players are active officers / vanguards of this guild, recently dispatched on high-paying contract to bolster capital security for the Millennial Jubilee.",
      motto: "One Wall. One Breath. One Duty."
    },
    {
      id: "court-archivists",
      name: "The Order of the Quill & Vault (Court Archivists)",
      type: "Royal Scholars & Clandestine Dissidents",
      reputation: "Intellectual elites of Aethelgard; ostensibly loyal scribes, secretly questioning the crown's millennium of blood.",
      description: "Headed by Lord Alden Vance, these scholars hold the keys to Aethelgard's deepest libraries and genealogies. Having pieced together redacted royal annals, several archivists realize the kingdom's peaceful history was built upon cold-blooded ritual murder.",
      crest: "An open book illuminated by a single silver quill.",
      playerRelation: "Lord Vance approaches the players during the festivities, seeking dependable outside operatives untainted by palace corruption.",
      motto: "The ink outlives the empire."
    },
    {
      id: "sanguine-crown",
      name: "The Sanguine Crown & Royal Inquisitors",
      type: "The Monarchy & Secret Police",
      reputation: "Authoritarian protectors of the 1,000-year peace.",
      description: "Led by King Aldous IV and Grand Inquisitor Morgana Vane. They manage the royal vault, enforce extreme censorship regarding the Ruby Blade, and purge any dissident who speaks of 'the red glow in the palace'.",
      crest: "A crowned golden stag over an obsidian background.",
      playerRelation: "The Crown pays the guild's contract, but watches all armed outsiders with severe suspicion.",
      motto: "Order at all costs."
    },
    {
      id: "hollow-hand",
      name: "The Syndicate of the Hollow Hand",
      type: "Underground Relic Thieves & Marches Spies",
      reputation: "Whispered syndicate operating in Talon's Rest and capital sewers.",
      description: "A coalition of exiled Valorian duelists, alchemists, and master burglars. Having caught wind of the vault's existence, they plan to use the Millennial Jubilee fireworks and masquerade as cover to pull off the greatest heist in history.",
      crest: "A severed gauntlet holding an empty keyhole.",
      playerRelation: "Dangerous rivals or desperate temporary allies depending on player choices.",
      motto: "No cage holds what is already stolen."
    }
  ],

  notableCharacters: [
    {
      id: "alden-vance",
      name: "Lord Alden Vance",
      title: "Chief Court Archivist & Keeper of the Imperial Annals",
      affiliation: "Court Archivists / Aethelgard Nobility",
      role: "Campaign Patron & Moral Catalyst",
      image: "projects/alden-vance.jpg",
      quote: "A peace bought with forced silence is not peace—it is merely a cage with golden bars.",
      appearance: "A handsome, brooding aristocrat in his late 40s with silver-streaked dark hair, perceptive grey eyes, and regal midnight-blue velvet robes stitched with astronomical charts.",
      publicInfo: "A respected scholar beloved by the aristocracy for his historical knowledge and eloquent speeches. He is in charge of curating the historical exhibits for the Millennial Jubilee.",
      dmSecret: "Vance discovered his own great-uncle was secretly sacrificed using the Ruby Blade two centuries ago to assassinate an invading Valorian general. He knows a secret conduit into the Royal Vault and intends to either destroy the blade or expose it to the world.",
      personality: "Soft-spoken, razor-sharp intellect, deeply empathetic, haunted by survivor's guilt.",
      statsPreview: "CR 5 (Aristocrat Tactician) · Spellcasting (Abjuration/Divination) · High INT & CHA"
    },
    {
      id: "king-aldous",
      name: "King Aldous IV",
      title: "Sovereign of the Verdant Expanse",
      affiliation: "The Sanguine Crown",
      role: "The Reluctant Tyrant",
      image: "projects/crimsonsac.jpg",
      quote: "You look upon my thousand years and call it cruelty. I look upon the ash and sundered ruins of our neighbors and call it salvation.",
      appearance: "An elderly ruler with weary emerald eyes, bearing the heavy gold-and-obsidian Crown of Concordat. His hands tremble slightly, but his gaze is unyielding.",
      publicInfo: "Regarded as a wise, benevolent patriarch who has successfully guided Aethelgard through three decades of abundant harvests and fair trade treaties.",
      dmSecret: "Aldous knows his own terminally ill daughter, Princess Vivienne, is being groomed to be the next sacrificial bearer should war break out. He is quietly torn between the love for his child and his sworn duty to the realm.",
      personality: "Pragmatic, stoic, burdened, paternal.",
      statsPreview: "CR 8 (Sovereign) · Royal Command Auras · Legendary Resistance"
    },
    {
      id: "inquisitor-morgana",
      name: "Grand Inquisitor Morgana Vane",
      title: "High Censor of the Obsidian Cloister",
      affiliation: "Royal Inquisition",
      role: "Primary Antagonist / Suspicion Enforcer",
      image: null,
      quote: "Treason does not begin with an unsheathed sword. It begins with an unpoliced question.",
      appearance: "Tall, sharp-featured woman clad in matte-black breastplate over crimson silk, carrying a twin-headed censor's rod and wearing a blindfolded falcon pin.",
      publicInfo: "Responsible for palace security and the censorship of seditious literature. Known for ruthlessness and zero tolerance for foreign mercenaries.",
      dmSecret: "She has suspected Lord Vance for months. She intends to let his conspiracy proceed just far enough to catch all conspirators—including the players' guild unit—in the act and execute them publicly at the Jubilee's climax.",
      personality: "Cold, calculating, unflinching devotion to order, hyper-observant.",
      statsPreview: "CR 7 (Inquisitor Knight) · Zone of Truth · Counterspell · Disarming Strikes"
    },
    {
      id: "cassian-ward",
      name: "Shield-Marshal Cassian Ward",
      title: "Commander of the Aegis 4th Company",
      affiliation: "The Aegis Cohort (Security Guild)",
      role: "Player Mentor & Guild Officer",
      image: null,
      quote: "Remember your childhood oath: We do not fight for lords or gold. We fight so that the person next to us walks home.",
      appearance: "A scarred, barrel-chested veteran in battered steel plate, sporting a braided grey beard and carrying the guild's heraldic battle-standard.",
      publicInfo: "The direct superior officer who assigned the player characters to the Jubilee contract. Has commanded security detachments in all four kingdoms.",
      dmSecret: "Cassian is nearing retirement and took this contract because the crown offered a massive bounty. If he discovers the true nature of the vault, his loyalty will be tested between guild contract law and moral conscience.",
      personality: "Gruff, fiercely protective of his squad, superstitious, speaks in military cadence.",
      statsPreview: "CR 6 (Shield-Commander) · Tactical Rally · Interception Stance"
    },
    {
      id: "lady-selyse",
      name: "Lady Selyse de Montfort",
      title: "Exiled Baroness of Talon's Rest",
      affiliation: "Sundered Marches Diplomatic Delegation",
      role: "Wildcard Socialite & Fence",
      image: null,
      quote: "In the Marches we fight with axes; in Aethelgard you fight with smiles. I find the smiles cut twice as deep.",
      appearance: "A striking woman wearing gowns woven from dark Valorian wool and gold filigree, wearing an obsidian masquerade mask even during daytime receptions.",
      publicInfo: "Represents the free merchant leagues of Talon's Rest at the Jubilee court, negotiating grain subsidies.",
      dmSecret: "She is the principal financial backer of the Syndicate of the Hollow Hand. She wants the Ruby Blade not to use it, but to break Aethelgard's monopoly on fear and force the Crown to cede land to the Marches.",
      personality: "Charismatic, daring, quick-witted, master of masquerade gossip.",
      statsPreview: "CR 4 (Mastermind Rogue) · Silver Tongue · Hidden Daggers"
    },
    {
      id: "elder-martha",
      name: "Elder Martha of Faylight",
      title: "Keeper of the Clover & Lantern",
      affiliation: "Faylight Village Council",
      role: "Starting Quest-Giver & Tavern Hostess",
      image: null,
      quote: "Eat your barley stew while it is hot, children. Once you cross the White River bridge, warmth is hard to come by.",
      appearance: "A plump, rosy-cheeked grandmother with flour on her apron and a pipe filled with sweet pipe-weed.",
      publicInfo: "Warm maternal figure who has sheltered thousands of weary travelers and guild recruits over four decades.",
      dmSecret: "She secretly harbors refugees fleeing royal inquisitors in her root cellars. She gives the players a seemingly innocent sealed letter to deliver in the capital that turns out to be from an undercover archivist.",
      personality: "Warm, witty, surprisingly observant of travelers' true motives.",
      statsPreview: "CR 1/2 (Commoner Folk-Healer) · Herbalist Kit · Village Lore"
    }
  ],

  gameMechanics: {
    overview: "Special 5e-compatible dark fantasy mechanics created specifically for 'The Crimson Sacrament' campaign setting.",
    systems: [
      {
        id: "ruby-sacrament",
        title: "The Ruby Sacrament (Artifact Rules)",
        tag: "Artifact / Lethal Rite",
        description: "Rules governing the mythical Ruby Blade if a character or NPC ever holds or attempts to invoke it.",
        mechanics: [
          {
            name: "True Will Attunement",
            detail: "The blade cannot be attuned to or wielded through compulsion, charm, geas, or monetary transaction. The wielder must possess a burning, uncoerced hatred or existential determination to destroy their target. If an unwilling or coerced creature attempts the rite, the dagger deals 10d10 psychic damage to the wielder and the target remains unharmed."
          },
          {
            name: "The Soul-for-Soul Strike",
            detail: "As an action, the attuned wielder plunges the dagger into their own heart while naming their chosen target anywhere on the same plane of existence. The named target instantly suffers 1,000 force and necrotic damage (bypassing damage immunities and resistances). Simultaneously, the wielder's soul is consumed; their body collapses into crimson crystal dust. No spell short of a true Wish granted by a supreme deity can resurrect either soul."
          },
          {
            name: "The Vault's Eclipse Bleed",
            detail: "When the party is within 500 feet of the blade during a lunar eclipse, all spellcasters feel a pulse of necrotic resonance. Once per short rest, any roll of a natural 1 on an arcane spell causes the caster to take 1d8 necrotic damage as their blood responds to the relic's call."
          }
        ]
      },
      {
        id: "guild-tactics",
        title: "Aegis Guild Squad Tactics (Unit Synergy)",
        tag: "Class & Combat Option",
        description: "Because all player characters were raised within the Aegis Security Guild, they possess unique squad synergy maneuvers reflecting their childhood conditioning.",
        mechanics: [
          {
            name: "Shield-Lock Interception (Reaction)",
            detail: "When an ally within 5 feet of you is hit by an attack, you can use your reaction to interpose your weapon or shield, adding +2 to that ally's AC against the triggering attack. If you are wielding a shield, the bonus increases to +3."
          },
          {
            name: "Breaching Cadence (Bonus Action)",
            detail: "Once per combat encounter, a guild member can call out tactical cadence. For the next round, all guild allies who start their turn within 15 feet gain +10 feet of movement speed and advantage on their first Athletics or Acrobatics check."
          },
          {
            name: "Vanguard Focus (Passive)",
            detail: "Guild training emphasizes awareness under pressure. Members have advantage on saving throws against being surprised or frightened while standing within 10 feet of at least one conscious guild squad-mate."
          }
        ]
      },
      {
        id: "jubilee-heist",
        title: "The Jubilee Masquerade & Infiltration Gauge",
        tag: "Exploration & Social Stealth",
        description: "During the Millennial Jubilee, the party must navigate aristocratic social spaces and high-security palace corridors.",
        mechanics: [
          {
            name: "Suspicion Gauge (Scale 0 to 10)",
            detail: "The party tracks a shared Suspicion score. 0 = Unremarkable guests. 3 = Inquisitor whispers. 6 = Tail on the party. 8 = Palace lockdown protocol. 10 = Open arrest warrant. Suspicion increases when failed Deception or Stealth checks occur; decreases through successful bribes, flawless social mingling, or framing rival factions."
          },
          {
            name: "Masquerade Persona",
            detail: "Each player selects a Masquerade guise (e.g. Foreign Emissary, Wine Connoisseur, Guild Bodyguard, Troubadour). While acting within their guise, they gain advantage on Charisma checks to deflect inquisitive nobles."
          }
        ]
      },
      {
        id: "blood-tithe",
        title: "Blood Tithes & Sanguine Vows",
        tag: "Optional High-Stakes Boons",
        description: "Minor ancient rites practiced along the borderlands that foreshadow the grand sacrifice of the Ruby Blade.",
        mechanics: [
          {
            name: "Sanguine Vow (Hit Dice Gamble)",
            detail: "A player can voluntarily expend and roll a Hit Die during a crucial check or attack roll, suffering that much damage immediately, but adding the rolled number to their d20 check as a desperate sacrifice."
          }
        ]
      }
    ]
  },

  characterCreator: {
    origins: [
      {
        id: "verdant-expanse",
        name: "Verdant Expanse (Aethelgard Native)",
        realm: "Aethelgard",
        trait: "Educated in courtly etiquette and formal military discipline. You are familiar with the high towers of the capital.",
        bonus: "+1 Charisma or +1 Intelligence; Proficiency in History or Persuasion",
        equipmentOption: "Fine guild signet ring, silk neck-scarf, ceremonial brass dagger"
      },
      {
        id: "sundered-marches",
        name: "Sundered Marches (Valorian Lineage)",
        realm: "Sundered Marches",
        trait: "Hardened by generations of civil skirmishes. You know how to read danger in a crowd and spot an ambush before it springs.",
        bonus: "+1 Strength or +1 Dexterity; Proficiency in Athletics or Survival",
        equipmentOption: "Whetstone, iron belt buckle bearing a defaced ducal crest, scarred leather gloves"
      },
      {
        id: "ashen-wastes",
        name: "Ashen Wastes (Elysian Scavenger Blood)",
        realm: "Ashen Wastes",
        trait: "Accustomed to toxic cinders and survival in ruins. You have resistance to environmental smoke and a keen eye for relics.",
        bonus: "+1 Constitution or +1 Wisdom; Proficiency in Investigation or Insight",
        equipmentOption: "Brass cinder-respirator mask, vial of soot-glass, fire-starter kit"
      },
      {
        id: "broken-isles",
        name: "Broken Isles (Solaran Tide-Born)",
        realm: "Broken Isles",
        trait: "Raised on wave-swept deck plates and rope rigging. Unshakable balance and intuitive weather sense.",
        bonus: "+1 Dexterity or +1 Wisdom; Proficiency in Acrobatics or Perception",
        equipmentOption: "Polished sea-glass talisman, compass in tarnished silver case, knotted mariner's rope"
      }
    ],

    guildCastes: [
      {
        id: "aegis-bulwark",
        name: "The Aegis Bulwark",
        archetype: "Heavy Frontliner / Shield-Marshal",
        description: "Trained to hold the line no matter the onslaught. Masters of interlocking shields and defensive positioning.",
        favoredStats: ["Strength", "Constitution"],
        signatureManeuver: "Bastion Stance: Grants half-cover to adjacent allies.",
        startingGear: "Guild Kite Shield, Heavy Ringmail or Scale Armor, Warpick or Longsword"
      },
      {
        id: "shadow-infiltrator",
        name: "The Tactical Infiltrator",
        archetype: "Scout / Saboteur / Point Man",
        description: "Specialized in advance perimeter sweeps, lock bypasses, and silent takedowns in urban corridors.",
        favoredStats: ["Dexterity", "Intelligence"],
        signatureManeuver: "Ghost Traverse: Ignore difficult terrain in urban corridors and silence footsteps.",
        startingGear: "Thieves' tools, suppressed light crossbow, dark wool guild cloak, dual daggers"
      },
      {
        id: "arcane-sentinel",
        name: "The Arcane Sentinel",
        archetype: "Combat Warder / Counter-Mage",
        description: "Conditioned to detect forbidden occult frequencies, identify magical wards, and disrupt enemy incantations.",
        favoredStats: ["Intelligence", "Wisdom"],
        signatureManeuver: "Null-Grasp: Can attempt to unravel a magical lock or ward with advantage.",
        startingGear: "Arcane focus carved from petrified ironwood, glyph-inscribed buckler, component pouch"
      },
      {
        id: "field-chirurgeon",
        name: "The Field Chirurgeon",
        archetype: "Combat Medic / Tactical Support",
        description: "Trained in battlefield triage, alchemy, and keeping the squad on their feet under fire.",
        favoredStats: ["Wisdom", "Constitution"],
        signatureManeuver: "Triage Surge: Stabilize a dying ally as a bonus action and grant them temporary HP.",
        startingGear: "Healer's kit with silver scalpel, bandolier of antidotes, stout quarterstaff"
      },
      {
        id: "herald-tactician",
        name: "The Herald Tactician",
        archetype: "Squad Leader / Negotiator",
        description: "The diplomatic face and battlefield brain of the unit. Reads intentions and directs team volleys.",
        favoredStats: ["Charisma", "Intelligence"],
        signatureManeuver: "Squad Command: Direct an ally to use their reaction to take an immediate attack or dash.",
        startingGear: "Guild charter with wax seal, polished breastplate, signal horn, rapier"
      }
    ],

    hereditaryBonds: [
      "My father died holding the line at Talon's Rest; I wear his silver badge into every fight.",
      "I was raised in the guild barracks alongside my squad-mate; I would take an arrow for them without hesitation.",
      "My grandmother was an archivist in Aethelgard who secretly left the order; she warned me never to trust the royal seal.",
      "I owe my guild induction to a veteran mentor who took the blame for my childhood mistake.",
      "The guild paid off my family's debts in the Ashen Wastes; my loyalty is absolute until that contract is fulfilled."
    ],

    personalSecrets: [
      "I have had recurring nightmares since childhood of a glowing ruby dagger plunging into a burning crown.",
      "I owe a discreet gambling debt to the Syndicate of the Hollow Hand, and an agent in the capital holds my marker.",
      "I secretly harbor deep sympathy for the Valorian rebels and believe Aethelgard's peace is built on deceit.",
      "I witnessed a royal inquisitor execute an innocent scholar in Faylight and did not speak up; guilt eats at me.",
      "I suspect Lord Alden Vance knows who my true biological parents are."
    ]
  },

  dmOracle: {
    tavernRumors: [
      "The guards around the palace vault were replaced last moon with mute warriors who never remove their obsidian helms.",
      "A merchant from Cinderfall claims he saw the northern sky glow blood-crimson during the last eclipse—just above Aethelgard.",
      "Lord Vance has been seen pacing the high library balcony until dawn, burning parchment after parchment in a bronze brazier.",
      "They say the King's physicians have forbidden him from drinking wine, yet every morning a cask of fresh lamb's blood is delivered to the royal chapel.",
      "A smuggler in Talon's Rest was found dead in an alley with no wounds, but his heart had turned entirely into red crystal.",
      "The masquerade masks for the Jubilee were crafted by an artisan who vanished the day the shipment was delivered."
    ],
    festivalEncounters: [
      "A runaway festival chariot decorated with gilded stags careens toward a crowd of peasant children in the Jubilee plaza.",
      "A masked noblewoman slips a sealed wax cylinder into the player's coat pocket before vanishing into a procession of dancers.",
      "An inquisitor stops the party at the city gate, claiming their guild charter lacks an updated lunar watermark.",
      "A street performer's fire-eating trick unexpectedly summons a phantom hound made of glowing red embers that stalks the party.",
      "A pickpocket from the Marches tries to lift an heirloom from a squad member, begging for mercy when caught because their sister is held hostage by the crown."
    ],
    vaultObstacles: [
      "The Hall of Mirrors: Obsidian glass mirrors that cast reflections with slight delays; stepping on an unsynced tile triggers guillotine blades.",
      "The Blood-Seal Threshold: A bronze portcullis that will only lift if 1 Hit Die worth of blood is poured into an ornate basin.",
      "The Silent Vigil: Four petrified ironwood statues that animate if any sound louder than a whisper is produced.",
      "The Chrono-Lock: A celestial puzzle dial that requires aligning the star charts to the exact night the first Sanguine Concordat was struck 1,000 years ago."
    ],
    campaignHooks: [
      "Lord Vance invites the squad to an intimate midnight meeting in the royal archives, offering a fortune in gold if they can retrieve a ledger before the High Inquisitor burns it.",
      "During the Jubilee Tournament, a foreign champion is slain in the lists—not by a lance, but by a sudden cardiac collapse identical to the legend of the Ruby Blade.",
      "The party discovers that the security route assigned to their guild company leaves the rear entrance of the Obsidian Vault completely unguarded for 15 critical minutes.",
      "Princess Vivienne approaches a player character in disguise at the masquerade, pleading for help to escape the capital before the final night of the festival."
    ]
  }
};

// Export for browser
if (typeof window !== "undefined") {
  window.CRIMSON_DATA = CRIMSON_DATA;
}
