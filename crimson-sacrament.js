/**
 * The Crimson Sacrament — Interactive Campaign Engine & Worldbuilder
 * Logic for Atlas, Character Forge, DM Oracle, Notable NPCs, and Audio Ambiance.
 */

document.addEventListener("DOMContentLoaded", () => {
  const DATA = window.CRIMSON_DATA;
  if (!DATA) {
    console.error("Crimson Sacrament: CRIMSON_DATA not loaded.");
    return;
  }

  // --- State ---
  let dmSecretsRevealed = false;
  let activeRealmId = "aethelgard";
  let activeFilter = "all";
  let customNpcs = JSON.parse(localStorage.getItem("crimson_custom_npcs") || "[]");

  // Character Forge State
  let forgeState = {
    name: "Caelen Thorne",
    genderDesc: "Veteran Officer",
    originId: "verdant-expanse",
    casteId: "aegis-bulwark",
    bondIdx: 0,
    secretIdx: 0,
    stats: { STR: 15, DEX: 12, CON: 14, INT: 10, WIS: 13, CHA: 8 }
  };

  // Load saved forge character if available
  const savedChar = localStorage.getItem("crimson_forge_char");
  if (savedChar) {
    try {
      forgeState = { ...forgeState, ...JSON.parse(savedChar) };
    } catch (e) {
      console.warn("Could not parse saved forge state", e);
    }
  }

  // --- Element References ---
  const tabButtons = document.querySelectorAll(".tab-btn");
  const tabPanels = document.querySelectorAll(".tab-panel");
  const toggleDmBtn = document.getElementById("hud-toggle-dm");
  const toggleAudioBtn = document.getElementById("hud-toggle-audio");
  const toastEl = document.getElementById("toast-notice");

  // Atlas Elements
  const mapPinsContainer = document.getElementById("map-pins-layer");
  const realmDetailContainer = document.getElementById("realm-detail-card");

  // Character Directory Elements
  const charsGrid = document.getElementById("chars-grid");
  const filterButtons = document.querySelectorAll(".filter-btn");
  const btnOpenAddNpc = document.getElementById("btn-open-add-npc");
  const addNpcModal = document.getElementById("add-npc-modal");
  const btnCloseModal = document.getElementById("modal-close-btn");
  const formAddNpc = document.getElementById("form-add-npc");

  // Forge Elements
  const inputCharName = document.getElementById("forge-name");
  const originsContainer = document.getElementById("forge-origins-grid");
  const castesContainer = document.getElementById("forge-castes-grid");
  const selectBond = document.getElementById("forge-bond-select");
  const selectSecret = document.getElementById("forge-secret-select");
  const statInputs = {
    STR: document.getElementById("stat-val-str"),
    DEX: document.getElementById("stat-val-dex"),
    CON: document.getElementById("stat-val-con"),
    INT: document.getElementById("stat-val-int"),
    WIS: document.getElementById("stat-val-wis"),
    CHA: document.getElementById("stat-val-cha")
  };
  const btnRollStats = document.getElementById("btn-roll-stats");
  const btnStandardArray = document.getElementById("btn-standard-array");
  const btnCopySheet = document.getElementById("btn-copy-sheet");
  const btnDownloadJson = document.getElementById("btn-download-json");
  const btnPrintSheet = document.getElementById("btn-print-sheet");

  // Live Sheet Preview Elements
  const sheetCharName = document.getElementById("sheet-name");
  const sheetCharSubtitle = document.getElementById("sheet-subtitle");
  const sheetStatBoxes = document.querySelectorAll(".sheet-stat-box");
  const sheetOriginTrait = document.getElementById("sheet-origin-trait");
  const sheetCasteManeuver = document.getElementById("sheet-caste-maneuver");
  const sheetEquipment = document.getElementById("sheet-equipment");
  const sheetBond = document.getElementById("sheet-bond");
  const sheetSecret = document.getElementById("sheet-secret");

  // Oracle Elements
  const oracleRumorBox = document.getElementById("oracle-rumor-output");
  const oracleEncounterBox = document.getElementById("oracle-encounter-output");
  const oracleVaultBox = document.getElementById("oracle-vault-output");
  const oracleHookBox = document.getElementById("oracle-hook-output");
  const btnRollRumor = document.getElementById("btn-roll-rumor");
  const btnRollEncounter = document.getElementById("btn-roll-encounter");
  const btnRollVault = document.getElementById("btn-roll-vault");
  const btnRollHook = document.getElementById("btn-roll-hook");
  const btnGenerateNpcOracle = document.getElementById("btn-generate-npc-oracle");

  // Toast Helper
  function showToast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    setTimeout(() => toastEl.classList.remove("show"), 3200);
  }

  // --- 1. TABS MANAGEMENT ---
  function switchTab(tabId) {
    tabButtons.forEach(btn => {
      const isTarget = btn.dataset.tab === tabId;
      btn.classList.toggle("active", isTarget);
      btn.setAttribute("aria-selected", isTarget);
    });

    tabPanels.forEach(panel => {
      panel.classList.toggle("active", panel.id === `tab-${tabId}`);
    });

    window.location.hash = tabId;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  tabButtons.forEach(btn => {
    btn.addEventListener("click", () => switchTab(btn.dataset.tab));
  });

  // Check URL hash on load
  const initialHash = window.location.hash.replace("#", "");
  if (initialHash && document.getElementById(`tab-${initialHash}`)) {
    switchTab(initialHash);
  }

  // --- 2. DM SECRETS TOGGLE ---
  if (toggleDmBtn) {
    toggleDmBtn.addEventListener("click", () => {
      dmSecretsRevealed = !dmSecretsRevealed;
      toggleDmBtn.classList.toggle("active", dmSecretsRevealed);
      toggleDmBtn.innerHTML = dmSecretsRevealed
        ? `<span>👁️</span> DM Secrets: <strong>REVEALED</strong>`
        : `<span>👁️</span> DM Secrets: <em>Concealed</em>`;
      renderCharacters();
      showToast(dmSecretsRevealed ? "DM Secrets & Plot Hooks revealed." : "DM Secrets concealed (Player Safe View).");
    });
  }

  // --- 3. ATLAS & REALMS ---
  function renderAtlasPins() {
    if (!mapPinsContainer) return;
    mapPinsContainer.innerHTML = "";

    DATA.realms.forEach(realm => {
      const pin = document.createElement("button");
      pin.className = `map-pin ${realm.id === activeRealmId ? "active" : ""}`;
      pin.style.left = `${realm.coordinates.x}%`;
      pin.style.top = `${realm.coordinates.y}%`;
      pin.title = realm.name;
      pin.setAttribute("aria-label", `Select realm ${realm.name}`);

      const label = document.createElement("span");
      label.className = "map-pin-label";
      label.textContent = realm.capital;
      pin.appendChild(label);

      pin.addEventListener("click", () => {
        activeRealmId = realm.id;
        renderAtlasPins();
        renderRealmDetail();
      });

      mapPinsContainer.appendChild(pin);
    });
  }

  function renderRealmDetail() {
    if (!realmDetailContainer) return;
    const realm = DATA.realms.find(r => r.id === activeRealmId) || DATA.realms[0];

    realmDetailContainer.innerHTML = `
      <div class="realm-badges">
        <span class="realm-badge" style="border-color:${realm.accent}; color:${realm.accent}">✦ ${realm.status}</span>
        <span class="realm-badge">Capital: <strong>${realm.capital}</strong></span>
      </div>
      <h3 class="realm-name font-gothic">${realm.name}</h3>
      <p class="realm-sub">${realm.territory}</p>
      
      <div class="realm-section-title">Overview & Lore</div>
      <p class="realm-text">${realm.summary}</p>

      <div class="realm-section-title">History & Downfall</div>
      <p class="realm-text">${realm.history}</p>

      <div class="realm-section-title">Key Landmark: ${realm.landmark}</div>
      <p class="realm-text">${realm.landmarkDesc}</p>

      <div class="realm-section-title">Current Jubilee Happenings</div>
      <p class="realm-text">${realm.currentEvents}</p>

      <div class="realm-section-title">Regional Hazards</div>
      <div class="realm-hazards-list">
        ${realm.hazards.map(h => `<span class="hazard-chip">⚠️ ${h}</span>`).join("")}
      </div>
    `;
  }

  renderAtlasPins();
  renderRealmDetail();

  // --- 4. NOTABLE CHARACTERS (DRAMATIS PERSONAE) ---
  function renderCharacters() {
    if (!charsGrid) return;
    charsGrid.innerHTML = "";

    const allNpcs = [...DATA.notableCharacters, ...customNpcs];
    const filtered = allNpcs.filter(npc => {
      if (activeFilter === "all") return true;
      if (activeFilter === "guild" && npc.affiliation.toLowerCase().includes("aegis")) return true;
      if (activeFilter === "archivists" && (npc.affiliation.toLowerCase().includes("archivist") || npc.affiliation.toLowerCase().includes("vance"))) return true;
      if (activeFilter === "crown" && (npc.affiliation.toLowerCase().includes("crown") || npc.affiliation.toLowerCase().includes("inquisit"))) return true;
      if (activeFilter === "outlanders" && !npc.affiliation.toLowerCase().includes("aegis") && !npc.affiliation.toLowerCase().includes("archivist") && !npc.affiliation.toLowerCase().includes("crown")) return true;
      return true;
    });

    filtered.forEach(npc => {
      const card = document.createElement("article");
      card.className = "char-card";

      const avatarHtml = npc.image
        ? `<img src="${npc.image}" alt="${npc.name} portrait" loading="lazy">`
        : `<div class="char-placeholder-avatar">👤</div>`;

      card.innerHTML = `
        <div class="char-card-top">
          <div class="char-avatar-frame">${avatarHtml}</div>
          <div class="char-meta-summary">
            <span class="char-role-badge">✦ ${npc.role}</span>
            <h3 class="char-name font-gothic">${npc.name}</h3>
            <span class="char-title">${npc.title}</span>
          </div>
        </div>
        <div class="char-card-body">
          <p class="char-quote">"${npc.quote || '...'}"</p>
          <div class="char-public-info">${npc.publicInfo}</div>
          <div class="char-dm-secret ${dmSecretsRevealed ? "" : "blurred"}" title="${dmSecretsRevealed ? "" : "Toggle DM Secrets button in header to unblur"}">
            <div class="dm-secret-header">
              <span>🔒 DM Secret / Plot Hook</span>
              <span>${dmSecretsRevealed ? "REVEALED" : "CLASSIFIED"}</span>
            </div>
            <div class="dm-secret-text">${npc.dmSecret}</div>
          </div>
          ${npc.statsPreview ? `<div class="char-public-info" style="font-size:0.75rem; color:var(--steel); margin-top:0.5rem;"><small>TACTICAL STATS:</small> ${npc.statsPreview}</div>` : ""}
        </div>
      `;

      charsGrid.appendChild(card);
    });
  }

  filterButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      filterButtons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      activeFilter = btn.dataset.filter;
      renderCharacters();
    });
  });

  renderCharacters();

  // Add Custom NPC Modal
  if (btnOpenAddNpc) {
    btnOpenAddNpc.addEventListener("click", () => addNpcModal.classList.add("open"));
  }
  if (btnCloseModal) {
    btnCloseModal.addEventListener("click", () => addNpcModal.classList.remove("open"));
  }
  if (addNpcModal) {
    addNpcModal.addEventListener("click", e => {
      if (e.target === addNpcModal) addNpcModal.classList.remove("open");
    });
  }

  if (formAddNpc) {
    formAddNpc.addEventListener("submit", e => {
      e.preventDefault();
      const newNpc = {
        id: "custom-" + Date.now(),
        name: document.getElementById("npc-input-name").value.trim(),
        title: document.getElementById("npc-input-title").value.trim(),
        role: document.getElementById("npc-input-role").value.trim() || "Notable Inhabitant",
        affiliation: document.getElementById("npc-input-affiliation").value.trim() || "Independent",
        quote: document.getElementById("npc-input-quote").value.trim() || "Fate favors those who strike first.",
        publicInfo: document.getElementById("npc-input-public").value.trim(),
        dmSecret: document.getElementById("npc-input-secret").value.trim(),
        statsPreview: "Custom 5e NPC Profile",
        image: null
      };

      customNpcs.unshift(newNpc);
      localStorage.setItem("crimson_custom_npcs", JSON.stringify(customNpcs));
      renderCharacters();
      formAddNpc.reset();
      addNpcModal.classList.remove("open");
      showToast(`Added ${newNpc.name} to Dramatis Personae!`);
    });
  }

  // --- 5. CHARACTER CREATOR (GUILD VANGUARD FORGE) ---
  function initForge() {
    // Populate Origins
    if (originsContainer) {
      originsContainer.innerHTML = "";
      DATA.characterCreator.origins.forEach(orig => {
        const card = document.createElement("div");
        card.className = `select-card-option ${orig.id === forgeState.originId ? "selected" : ""}`;
        card.innerHTML = `
          <div class="option-name">${orig.name}</div>
          <div class="option-hint">${orig.trait}</div>
          <div class="option-hint" style="color:var(--gold-bright); margin-top:0.35rem;"><small>${orig.bonus}</small></div>
        `;
        card.addEventListener("click", () => {
          forgeState.originId = orig.id;
          document.querySelectorAll("#forge-origins-grid .select-card-option").forEach(c => c.classList.remove("selected"));
          card.classList.add("selected");
          updateLiveSheet();
        });
        originsContainer.appendChild(card);
      });
    }

    // Populate Castes
    if (castesContainer) {
      castesContainer.innerHTML = "";
      DATA.characterCreator.guildCastes.forEach(caste => {
        const card = document.createElement("div");
        card.className = `select-card-option ${caste.id === forgeState.casteId ? "selected" : ""}`;
        card.innerHTML = `
          <div class="option-name">${caste.name}</div>
          <div class="option-hint">${caste.archetype} · ${caste.description}</div>
          <div class="option-hint" style="color:var(--crimson-bright); margin-top:0.35rem;"><small>⚔️ ${caste.signatureManeuver}</small></div>
        `;
        card.addEventListener("click", () => {
          forgeState.casteId = caste.id;
          document.querySelectorAll("#forge-castes-grid .select-card-option").forEach(c => c.classList.remove("selected"));
          card.classList.add("selected");
          updateLiveSheet();
        });
        castesContainer.appendChild(card);
      });
    }

    // Populate Bonds
    if (selectBond) {
      selectBond.innerHTML = "";
      DATA.characterCreator.hereditaryBonds.forEach((bond, i) => {
        const opt = document.createElement("option");
        opt.value = i;
        opt.textContent = bond;
        selectBond.appendChild(opt);
      });
      selectBond.value = forgeState.bondIdx;
      selectBond.addEventListener("change", () => {
        forgeState.bondIdx = +selectBond.value;
        updateLiveSheet();
      });
    }

    // Populate Secrets
    if (selectSecret) {
      selectSecret.innerHTML = "";
      DATA.characterCreator.personalSecrets.forEach((sec, i) => {
        const opt = document.createElement("option");
        opt.value = i;
        opt.textContent = sec;
        selectSecret.appendChild(opt);
      });
      selectSecret.value = forgeState.secretIdx;
      selectSecret.addEventListener("change", () => {
        forgeState.secretIdx = +selectSecret.value;
        updateLiveSheet();
      });
    }

    // Name input
    if (inputCharName) {
      inputCharName.value = forgeState.name;
      inputCharName.addEventListener("input", () => {
        forgeState.name = inputCharName.value.trim() || "Nameless Guard";
        updateLiveSheet();
      });
    }

    // Stat input listeners
    Object.keys(statInputs).forEach(stat => {
      const input = statInputs[stat];
      if (input) {
        input.value = forgeState.stats[stat];
        input.addEventListener("input", () => {
          forgeState.stats[stat] = Math.max(3, Math.min(20, +input.value || 10));
          updateLiveSheet();
        });
      }
    });

    // Roll 4d6 drop lowest
    if (btnRollStats) {
      btnRollStats.addEventListener("click", () => {
        playDiceRollSound();
        const roll4d6 = () => {
          const rolls = Array.from({ length: 4 }, () => Math.floor(Math.random() * 6) + 1);
          rolls.sort((a, b) => a - b);
          return rolls[1] + rolls[2] + rolls[3];
        };

        const rolled = {
          STR: roll4d6(),
          DEX: roll4d6(),
          CON: roll4d6(),
          INT: roll4d6(),
          WIS: roll4d6(),
          CHA: roll4d6()
        };

        forgeState.stats = rolled;
        Object.keys(statInputs).forEach(s => {
          if (statInputs[s]) statInputs[s].value = rolled[s];
        });
        updateLiveSheet();
        showToast("Rolled new Ability Scores using 4d6 (drop lowest)!");
      });
    }

    // Standard Array (15, 14, 13, 12, 10, 8)
    if (btnStandardArray) {
      btnStandardArray.addEventListener("click", () => {
        const caste = DATA.characterCreator.guildCastes.find(c => c.id === forgeState.casteId);
        let array = [15, 14, 13, 12, 10, 8];
        let newStats = { STR: 15, CON: 14, DEX: 13, WIS: 12, INT: 10, CHA: 8 };

        if (caste) {
          if (caste.favoredStats.includes("Dexterity")) {
            newStats = { DEX: 15, INT: 14, CON: 13, WIS: 12, STR: 10, CHA: 8 };
          } else if (caste.favoredStats.includes("Intelligence")) {
            newStats = { INT: 15, CON: 14, DEX: 13, WIS: 12, STR: 10, CHA: 8 };
          } else if (caste.favoredStats.includes("Wisdom")) {
            newStats = { WIS: 15, CON: 14, STR: 13, DEX: 12, INT: 10, CHA: 8 };
          } else if (caste.favoredStats.includes("Charisma")) {
            newStats = { CHA: 15, STR: 14, CON: 13, DEX: 12, INT: 10, WIS: 8 };
          }
        }

        forgeState.stats = newStats;
        Object.keys(statInputs).forEach(s => {
          if (statInputs[s]) statInputs[s].value = newStats[s];
        });
        updateLiveSheet();
        showToast("Assigned 5e Standard Array optimized for caste!");
      });
    }

    updateLiveSheet();
  }

  function formatMod(val) {
    const mod = Math.floor((val - 10) / 2);
    return mod >= 0 ? `+${mod}` : `${mod}`;
  }

  function updateLiveSheet() {
    const origin = DATA.characterCreator.origins.find(o => o.id === forgeState.originId) || DATA.characterCreator.origins[0];
    const caste = DATA.characterCreator.guildCastes.find(c => c.id === forgeState.casteId) || DATA.characterCreator.guildCastes[0];
    const bond = DATA.characterCreator.hereditaryBonds[forgeState.bondIdx] || "Sworn to the Aegis banner.";
    const secret = DATA.characterCreator.personalSecrets[forgeState.secretIdx] || "A dark vision of crimson glass.";

    if (sheetCharName) sheetCharName.textContent = forgeState.name;
    if (sheetCharSubtitle) sheetSubtitle.textContent = `${caste.name} · ${origin.name} · Level 1 Aegis Guard`;

    // Render Stats in Ribbon
    const statKeys = ["STR", "DEX", "CON", "INT", "WIS", "CHA"];
    statKeys.forEach(k => {
      const box = document.getElementById(`preview-stat-${k.toLowerCase()}`);
      if (box) {
        const val = forgeState.stats[k] || 10;
        box.querySelector(".stat-value").textContent = val;
        box.querySelector(".stat-mod").textContent = formatMod(val);
      }
    });

    if (sheetOriginTrait) {
      sheetOriginTrait.innerHTML = `<strong>${origin.name}:</strong> ${origin.trait} (${origin.bonus})`;
    }
    if (sheetCasteManeuver) {
      sheetCasteManeuver.innerHTML = `<strong>${caste.name}:</strong> ${caste.signatureManeuver}`;
    }
    if (sheetEquipment) {
      sheetEquipment.textContent = `${caste.startingGear}, plus ${origin.equipmentOption}, Aegis Guild signet, and traveler's rations.`;
    }
    if (sheetBond) sheetBond.textContent = bond;
    if (sheetSecret) sheetSecret.textContent = secret;

    // Save to localStorage
    localStorage.setItem("crimson_forge_char", JSON.stringify(forgeState));
  }

  initForge();

  // Export Sheet: Copy Markdown
  if (btnCopySheet) {
    btnCopySheet.addEventListener("click", () => {
      const origin = DATA.characterCreator.origins.find(o => o.id === forgeState.originId);
      const caste = DATA.characterCreator.guildCastes.find(c => c.id === forgeState.casteId);
      const bond = DATA.characterCreator.hereditaryBonds[forgeState.bondIdx];
      const secret = DATA.characterCreator.personalSecrets[forgeState.secretIdx];

      const markdown = `
# Character Dossier: ${forgeState.name}
**Campaign:** The Crimson Sacrament (5e Setting)  
**Guild Caste:** ${caste.name} (${caste.archetype})  
**Origin:** ${origin.name} (${origin.realm})  
**Rank:** Aegis Cohort Vanguard (Level 1)  

### Ability Scores
- **STR:** ${forgeState.stats.STR} (${formatMod(forgeState.stats.STR)})
- **DEX:** ${forgeState.stats.DEX} (${formatMod(forgeState.stats.DEX)})
- **CON:** ${forgeState.stats.CON} (${formatMod(forgeState.stats.CON)})
- **INT:** ${forgeState.stats.INT} (${formatMod(forgeState.stats.INT)})
- **WIS:** ${forgeState.stats.WIS} (${formatMod(forgeState.stats.WIS)})
- **CHA:** ${forgeState.stats.CHA} (${formatMod(forgeState.stats.CHA)})

### Features & Maneuvers
- **Origin Trait:** ${origin.trait}
- **Attribute Bonus:** ${origin.bonus}
- **Signature Guild Maneuver:** ${caste.signatureManeuver}
- **Squad Tactics:** Shield-Lock Interception (Reaction: +2 AC to ally within 5ft)

### Equipment
${caste.startingGear}, ${origin.equipmentOption}, Aegis signet ring.

### Roleplaying Prompts
- **Hereditary Guild Bond:** ${bond}
- **Personal Secret:** ${secret}
      `.trim();

      navigator.clipboard.writeText(markdown).then(() => {
        showToast("Character sheet copied to clipboard as Markdown!");
      }).catch(err => {
        console.error("Clipboard write error", err);
      });
    });
  }

  // Export Sheet: Download JSON
  if (btnDownloadJson) {
    btnDownloadJson.addEventListener("click", () => {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(forgeState, null, 2));
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `${forgeState.name.toLowerCase().replace(/\s+/g, "_")}_crimson_sacrament.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      showToast("Downloaded character profile as JSON!");
    });
  }

  // Print Sheet
  if (btnPrintSheet) {
    btnPrintSheet.addEventListener("click", () => {
      window.print();
    });
  }

  // --- 6. DM INSPIRATION ORACLE ---
  function rollFromList(list, boxEl) {
    if (!boxEl) return;
    playDiceRollSound();
    boxEl.style.opacity = "0.4";
    boxEl.style.transform = "scale(0.98)";
    setTimeout(() => {
      const item = list[Math.floor(Math.random() * list.length)];
      boxEl.textContent = `"${item}"`;
      boxEl.style.opacity = "1";
      boxEl.style.transform = "scale(1)";
    }, 200);
  }

  if (btnRollRumor) btnRollRumor.addEventListener("click", () => rollFromList(DATA.dmOracle.tavernRumors, oracleRumorBox));
  if (btnRollEncounter) btnRollEncounter.addEventListener("click", () => rollFromList(DATA.dmOracle.festivalEncounters, oracleEncounterBox));
  if (btnRollVault) btnRollVault.addEventListener("click", () => rollFromList(DATA.dmOracle.vaultObstacles, oracleVaultBox));
  if (btnRollHook) btnRollHook.addEventListener("click", () => rollFromList(DATA.dmOracle.campaignHooks, oracleHookBox));

  // Instant NPC Generator via Oracle
  if (btnGenerateNpcOracle) {
    btnGenerateNpcOracle.addEventListener("click", () => {
      playDiceRollSound();
      const firstNames = ["Theron", "Vespera", "Roderic", "Kaelen", "Morwenna", "Corvus", "Seraphina", "Darius", "Elysande"];
      const lastNames = ["Ashford", "Valerius", "Blackwood", "Montfort", "Sovereign", "Holloway", "Cindergard", "Vanguard"];
      const titles = ["Disgraced Vaultguard", "Hollow Hand Fence", "Aethelgard Censor Scribe", "Pilgrim of Cinderfall", "Free Corsair Captain", "Talon's Rest Sellsword"];
      const quirks = [
        "Fidgets compulsively with an empty obsidian ring setting.",
        "Refuses to look at the moon, claiming it whispers names in scarlet.",
        "Speaks in whisper, frequently checking for inquisitorial eavesdroppers.",
        "Smells of dried lavender and burnt brimstone."
      ];
      const secrets = [
        "Carries a counterfeit ruby dagger meant to bait a royal inquisitor.",
        "Is secretly sending encoded letters to Lord Alden Vance.",
        "Lost their entire squad during a recon mission into the Ashen Wastes.",
        "Knows the combination to the secondary palace scullery door."
      ];

      const name = `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
      const title = titles[Math.floor(Math.random() * titles.length)];
      const quirk = quirks[Math.floor(Math.random() * quirks.length)];
      const secret = secrets[Math.floor(Math.random() * secrets.length)];

      const generatedNpc = {
        id: "generated-" + Date.now(),
        name,
        title,
        role: "Oracle Generated NPC",
        affiliation: "Independent",
        quote: quirk,
        publicInfo: `Encountered in the markets or taverns of the capital. ${quirk}`,
        dmSecret: secret,
        statsPreview: "CR 3 · Dynamic Persona",
        image: null
      };

      customNpcs.unshift(generatedNpc);
      localStorage.setItem("crimson_custom_npcs", JSON.stringify(customNpcs));
      renderCharacters();
      showToast(`Generated NPC: ${name} (${title}) and added to Dramatis Personae!`);
    });
  }

  // --- 7. EMBER PARTICLE CANVAS ---
  const canvas = document.getElementById("ember-canvas");
  if (canvas) {
    const ctx = canvas.getContext("2d");
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    window.addEventListener("resize", () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    });

    const particles = Array.from({ length: 45 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2.5 + 0.8,
      speedY: Math.random() * 0.6 + 0.2,
      speedX: (Math.random() - 0.5) * 0.4,
      opacity: Math.random() * 0.7 + 0.2,
      color: Math.random() > 0.35 ? "#ff2a4b" : "#d4af37"
    }));

    function animateEmbers() {
      ctx.clearRect(0, 0, width, height);

      particles.forEach(p => {
        p.y -= p.speedY;
        p.x += p.speedX;

        if (p.y < -10) {
          p.y = height + 10;
          p.x = Math.random() * width;
        }

        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.opacity;
        ctx.shadowBlur = 8;
        ctx.shadowColor = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });

      requestAnimationFrame(animateEmbers);
    }
    animateEmbers();
  }

  // --- 8. SYNTHESIZED WEB AUDIO AMBIANCE & DICE SFX ---
  let audioCtx = null;
  let ambientDroneGain = null;
  let isAudioPlaying = false;

  function initAudio() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AudioContext();
    }
  }

  function playDiceRollSound() {
    try {
      initAudio();
      if (!audioCtx) return;
      if (audioCtx.state === "suspended") audioCtx.resume();

      // Quick series of wooden clacks
      for (let i = 0; i < 3; i++) {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(140 + Math.random() * 120, audioCtx.currentTime + i * 0.06);
        gain.gain.setValueAtTime(0.08, audioCtx.currentTime + i * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + i * 0.06 + 0.05);

        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(audioCtx.currentTime + i * 0.06);
        osc.stop(audioCtx.currentTime + i * 0.06 + 0.06);
      }
    } catch (e) {
      // Audio autoplay policy
    }
  }

  function toggleAmbientSound() {
    initAudio();
    if (audioCtx.state === "suspended") audioCtx.resume();

    if (isAudioPlaying) {
      if (ambientDroneGain) {
        ambientDroneGain.gain.linearRampToValueAtTime(0.0001, audioCtx.currentTime + 1);
      }
      isAudioPlaying = false;
      toggleAudioBtn.classList.remove("active");
      toggleAudioBtn.innerHTML = `<span>🕯️</span> Ambient: <em>Off</em>`;
      showToast("Ambient soundscape muted.");
    } else {
      // Create a subtle, eerie low drone
      const osc1 = audioCtx.createOscillator();
      const osc2 = audioCtx.createOscillator();
      const filter = audioCtx.createBiquadFilter();
      ambientDroneGain = audioCtx.createGain();

      osc1.type = "sawtooth";
      osc1.frequency.setValueAtTime(55, audioCtx.currentTime); // Low A

      osc2.type = "sine";
      osc2.frequency.setValueAtTime(82.4, audioCtx.currentTime); // E minor dyad

      filter.type = "lowpass";
      filter.frequency.setValueAtTime(160, audioCtx.currentTime);

      ambientDroneGain.gain.setValueAtTime(0.001, audioCtx.currentTime);
      ambientDroneGain.gain.linearRampToValueAtTime(0.05, audioCtx.currentTime + 2);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(ambientDroneGain);
      ambientDroneGain.connect(audioCtx.destination);

      osc1.start();
      osc2.start();

      isAudioPlaying = true;
      toggleAudioBtn.classList.add("active");
      toggleAudioBtn.innerHTML = `<span>🔥</span> Ambient: <strong>Active</strong>`;
      showToast("Atmospheric soundscape playing.");
    }
  }

  if (toggleAudioBtn) {
    toggleAudioBtn.addEventListener("click", toggleAmbientSound);
  }
});
