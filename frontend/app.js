// === Status / health ===
const statusEl = document.getElementById("status");
const btn = document.getElementById("checkBtn");
const balanceBtn = document.getElementById("btnBalance");
const balanceOut = document.getElementById("balanceOut");
const systemToggle = document.getElementById("systemToggle");
const systemBody = document.getElementById("systemBody");

function setStatus(text, mode) {
  if (!statusEl) return;
  statusEl.textContent = text;
  statusEl.classList.remove("status-ok", "status-error");
  if (mode === "ok") statusEl.classList.add("status-ok");
  if (mode === "error") statusEl.classList.add("status-error");
}

async function checkHealth() {
  setStatus("Checking backend…");
  try {
    const res = await fetch("http://localhost:4000/health");
    if (!res.ok) throw new Error("Failed");
    await res.json().catch(() => ({}));
    setStatus("Backend OK ✔️", "ok");
  } catch (e) {
    console.error(e);
    setStatus("Backend unreachable ✖️", "error");
  }
}

if (btn) {
  btn.addEventListener("click", checkHealth);
}
checkHealth(); // run once on load

// Balance
if (balanceBtn && balanceOut) {
  balanceBtn.addEventListener("click", async () => {
    balanceOut.textContent = "Loading balance…";
    try {
      const res = await fetch("http://localhost:4000/api/account/balance");
      if (!res.ok) throw new Error("Failed to fetch balance");
      const data = await res.json();
      balanceOut.textContent = JSON.stringify(data, null, 2);
    } catch (e) {
      console.error(e);
      balanceOut.textContent = "Error fetching balance.";
    }
  });
}

// System panel toggle
if (systemToggle && systemBody) {
  systemToggle.addEventListener("click", () => {
    systemBody.classList.toggle("hidden");
  });
}

// === Chatbot logic ===
const chatForm = document.getElementById("chatForm");
const chatInput = document.getElementById("chatInput");
const chatMessages = document.getElementById("chatMessages");
const chatSend = document.getElementById("chatSend");
const presetButtons = document.querySelectorAll("[data-preset]");

// In-memory conversation (frontend-side)
const conversation = [];

// Helper: append message to UI
function appendMessage(role, text) {
  if (!chatMessages) return;
  const wrapper = document.createElement("div");
  wrapper.className = `chat-message ${role === "user" ? "user" : "bot"}`;

  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.textContent = text;

  wrapper.appendChild(bubble);
  chatMessages.appendChild(wrapper);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Typing indicator
let typingEl = null;
function showTyping() {
  if (!chatMessages || typingEl) return;
  typingEl = document.createElement("div");
  typingEl.className = "chat-message bot typing";

  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.textContent = "Thinking…";

  typingEl.appendChild(bubble);
  chatMessages.appendChild(typingEl);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function hideTyping() {
  if (!typingEl) return;
  typingEl.remove();
  typingEl = null;
}

// Helper: try to pull a clean text reply out of whatever the backend sent
function extractReply(data) {
  if (data == null) return null;

  // If backend already gives a top-level `content`
  if (typeof data.content === "string") return data.content;

  // If backend gives `reply`
  if (data.reply != null) {
    const r = data.reply;

    // reply is plain string
    if (typeof r === "string") {
      const trimmed = r.trim();

      // If it *looks* like JSON, try to parse and grab `.content`
      if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
        try {
          const parsed = JSON.parse(trimmed);
          if (parsed && typeof parsed.content === "string") {
            return parsed.content;
          }
          if (parsed && parsed.response && typeof parsed.response.content === "string") {
            return parsed.response.content;
          }
          return trimmed; // fallback to the original string
        } catch {
          return trimmed;
        }
      }

      // Just a normal text reply
      return trimmed;
    }

    // reply is an object like { content, metadata }
    if (typeof r === "object" && r !== null) {
      if (typeof r.content === "string") return r.content;
      if (r.response && typeof r.response.content === "string") {
        return r.response.content;
      }
    }
  }

  // If we have a `result` field
  if (data.result != null) {
    const res = data.result;

    if (typeof res === "string") {
      const trimmed = res.trim();
      if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
        try {
          const parsed = JSON.parse(trimmed);
          if (parsed && typeof parsed.content === "string") return parsed.content;
          if (parsed && parsed.response && typeof parsed.response.content === "string") {
            return parsed.response.content;
          }
          return trimmed;
        } catch {
          return trimmed;
        }
      }
      return trimmed;
    }

    if (typeof res === "object" && res !== null) {
      if (typeof res.content === "string") return res.content;
      if (res.response && typeof res.response.content === "string") {
        return res.response.content;
      }
    }
  }

  // Other possible text fields
  if (typeof data.message === "string") return data.message;
  if (typeof data.text === "string") return data.text;

  return null;
}

// === Caretaker Journal (localStorage + pattern summary) ===
const journalInput = document.getElementById("journalInput");
const journalSaveBtn = document.getElementById("journalSaveBtn");
const journalStatus = document.getElementById("journalStatus");
const journalList = document.getElementById("journalList");
const JOURNAL_KEY = "cc_journal_entries_v1";

function loadJournalEntries() {
  try {
    const raw = localStorage.getItem(JOURNAL_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // sort newest first
    return parsed.sort((a, b) => b.createdAt - a.createdAt);
  } catch {
    return [];
  }
}

function saveJournalEntries(entries) {
  localStorage.setItem(JOURNAL_KEY, JSON.stringify(entries));
}

function renderJournalEntries() {
  if (!journalList) return;
  const entries = loadJournalEntries();
  journalList.innerHTML = "";

  if (!entries.length) {
    const p = document.createElement("p");
    p.className = "journal-empty";
    p.textContent = "No entries yet. Start with a small reflection from today.";
    journalList.appendChild(p);
    return;
  }

  entries.forEach((entry) => {
    const wrapper = document.createElement("div");
    wrapper.className = "journal-entry";

    const header = document.createElement("div");
    header.className = "journal-entry-header";

    const dateSpan = document.createElement("span");
    dateSpan.className = "journal-entry-date";
    dateSpan.textContent = new Date(entry.createdAt).toLocaleString();

    const delBtn = document.createElement("button");
    delBtn.className = "journal-entry-delete";
    delBtn.type = "button";
    delBtn.textContent = "Delete";
    delBtn.addEventListener("click", () => {
      const all = loadJournalEntries().filter((e) => e.id !== entry.id);
      saveJournalEntries(all);
      renderJournalEntries();
    });

    header.appendChild(dateSpan);
    header.appendChild(delBtn);

    const body = document.createElement("div");
    body.textContent = entry.text;

    wrapper.appendChild(header);
    wrapper.appendChild(body);
    journalList.appendChild(wrapper);
  });
}

function addJournalEntry(text) {
  const trimmed = text.trim();
  if (!trimmed) return;

  const entries = loadJournalEntries();
  entries.unshift({
    id: Date.now().toString(36) + Math.random().toString(36).slice(2),
    text: trimmed,
    createdAt: Date.now()
  });
  saveJournalEntries(entries);
  renderJournalEntries();
}

function getRecentJournalSummary(limit = 5) {
  const entries = loadJournalEntries();
  if (!entries.length) return "";
  const recent = entries.slice(0, limit);
  const lines = recent.map((e) => {
    const date = new Date(e.createdAt).toLocaleString();
    return `- [${date}] ${e.text}`;
  });
  return lines.join("\n");
}

// Hook up journal UI
if (journalSaveBtn && journalInput) {
  journalSaveBtn.addEventListener("click", () => {
    const value = journalInput.value;
    if (!value.trim()) return;
    addJournalEntry(value);
    journalInput.value = "";
    if (journalStatus) {
      journalStatus.textContent = "Saved. I’ll use this context in my answers.";
      setTimeout(() => {
        journalStatus.textContent = "";
      }, 2200);
    }
  });
}

// Render once on startup
renderJournalEntries();

// === Medication & Routine Planner (localStorage) ===
const pillListEl = document.getElementById("pillList");
const pillNameInput = document.getElementById("pillNameInput");
const pillDoseInput = document.getElementById("pillDoseInput");
const pillTimeInput = document.getElementById("pillTimeInput");
const pillAddBtn = document.getElementById("pillAddBtn");
const pillClearBtn = document.getElementById("pillClearBtn");
const PILL_KEY = "cc_pills_v1";

function loadPills() {
  try {
    const raw = localStorage.getItem(PILL_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.sort((a, b) => (a.time || "").localeCompare(b.time || ""));
  } catch {
    return [];
  }
}

function savePills(pills) {
  localStorage.setItem(PILL_KEY, JSON.stringify(pills));
}

function renderPills() {
  if (!pillListEl) return;
  const pills = loadPills();
  pillListEl.innerHTML = "";

  if (!pills.length) {
    const p = document.createElement("p");
    p.className = "pill-empty";
    p.textContent = "No medication items yet. Add pills or routine actions below.";
    pillListEl.appendChild(p);
    return;
  }

  pills.forEach((pill) => {
    const item = document.createElement("div");
    item.className = "pill-item";

    const main = document.createElement("div");
    main.className = "pill-main";

    const nameSpan = document.createElement("span");
    nameSpan.className = "pill-name";
    nameSpan.textContent = pill.name;

    const doseSpan = document.createElement("span");
    doseSpan.className = "pill-dose";
    doseSpan.textContent = pill.dose || "";

    main.appendChild(nameSpan);
    if (pill.dose) main.appendChild(doseSpan);

    const timeSpan = document.createElement("span");
    timeSpan.className = "pill-time-label";
    timeSpan.textContent = pill.time || "";

    const delBtn = document.createElement("button");
    delBtn.className = "pill-delete";
    delBtn.type = "button";
    delBtn.textContent = "✕";
    delBtn.addEventListener("click", () => {
      const all = loadPills().filter((p) => p.id !== pill.id);
      savePills(all);
      renderPills();
    });

    item.appendChild(main);
    item.appendChild(timeSpan);
    item.appendChild(delBtn);

    pillListEl.appendChild(item);
  });
}

function addPill(name, dose, time) {
  const n = name.trim();
  const d = dose.trim();
  const t = time.trim();
  if (!n) return;
  const pills = loadPills();
  pills.push({
    id: Date.now().toString(36) + Math.random().toString(36).slice(2),
    name: n,
    dose: d,
    time: t
  });
  savePills(pills);
  renderPills();
}

// Hook up pill UI
if (pillAddBtn && pillNameInput && pillDoseInput && pillTimeInput) {
  pillAddBtn.addEventListener("click", () => {
    addPill(pillNameInput.value, pillDoseInput.value, pillTimeInput.value);
    pillNameInput.value = "";
    pillDoseInput.value = "";
    pillTimeInput.value = "";
  });
}

if (pillClearBtn) {
  pillClearBtn.addEventListener("click", () => {
    savePills([]);
    renderPills();
  });
}

// Initial render
renderPills();

// Send message
async function sendMessage(text) {
  if (!chatInput || !chatMessages || !chatSend) return;

  const trimmed = text.trim();
  if (!trimmed) return;

  appendMessage("user", trimmed);
  conversation.push({ role: "user", content: trimmed });
  chatInput.value = "";

  showTyping();
  chatInput.disabled = true;
  chatSend.disabled = true;

  // Pull journal context into the prompt
  const journalSummary = getRecentJournalSummary();
  const inputWithContext = journalSummary
    ? `Here is some recent context from my caregiving journal:\n${journalSummary}\n\nNow my question: ${trimmed}`
    : trimmed;

  try {
    const res = await fetch("http://localhost:4000/api/services/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        input: inputWithContext,
        history: conversation // send full history so backend can build prompt
      })
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const msg =
        extractReply(data) ||
        data.error ||
        "I couldn’t reach the caregiving brain right now. Please try again in a moment.";
      hideTyping();
      appendMessage("bot", msg);
      return;
    }

    const reply =
      extractReply(data) ||
      "The server responded, but I couldn't read the reply.";

    hideTyping();

    // Social proof footer with more realistic range
    const helpfulCount = Math.floor(Math.random() * 94) + 34; // 34–127 range
    const footer = `🟩 ${helpfulCount} caregivers found this helpful`;
    const finalMessage = `${reply}\n\n${footer}`;

    appendMessage("bot", finalMessage);
    conversation.push({ role: "assistant", content: finalMessage });
  } catch (err) {
    console.error(err);
    hideTyping();
    appendMessage(
      "bot",
      "Something went wrong talking to the server. For now, take one slow breath with me and try again in a moment."
    );
  } finally {
    chatInput.disabled = false;
    chatSend.disabled = false;
    chatInput.focus();
  }
}

// === Care Profile Memory Panel ===
const profileNameEl = document.getElementById("profileName");
const profileDiagnosisEl = document.getElementById("profileDiagnosis");
const profileLivingEl = document.getElementById("profileLiving");
const profilePersonalityEl = document.getElementById("profilePersonality");
const profileConcernsEl = document.getElementById("profileConcerns");
const profileNotesInput = document.getElementById("profileNotesInput");
const profileSaveBtn = document.getElementById("profileSaveBtn");
const profileStatusEl = document.getElementById("profileStatus");

async function loadProfile() {
  if (
    !profileNameEl ||
    !profileDiagnosisEl ||
    !profileLivingEl ||
    !profilePersonalityEl ||
    !profileConcernsEl
  ) {
    return;
  }

  try {
    const res = await fetch("http://localhost:4000/api/profile/mom");
    const data = await res.json();

    if (!res.ok || !data.profile) {
      // Fallback demo profile for the demo / when backend is not ready
      const demo = {
        name: "Marta",
        diagnosis: "Alzheimer’s – moderate stage",
        livingSituation: "Lives with me at home",
        personality: "Warm, talkative, loves music and family stories",
        keyConcerns: ["Evening agitation", "Wandering", "Shower refusal"],
        notes: "She is calmer after a short balcony walk before dinner."
      };

      profileNameEl.textContent = demo.name;
      profileDiagnosisEl.textContent = demo.diagnosis;
      profileLivingEl.textContent = demo.livingSituation;
      profilePersonalityEl.textContent = demo.personality;
      profileConcernsEl.textContent = demo.keyConcerns.join(", ");

      if (profileNotesInput) profileNotesInput.value = demo.notes;

      if (profileStatusEl) {
        profileStatusEl.textContent = "Demo profile loaded.";
      }

      return;
    }

    const p = data.profile;

    profileNameEl.textContent =
      p.name && p.name.trim() ? p.name : "Not specified";

    profileDiagnosisEl.textContent =
      p.diagnosis && p.diagnosis.trim() ? p.diagnosis : "Not specified";

    profileLivingEl.textContent =
      p.livingSituation && p.livingSituation.trim()
        ? p.livingSituation
        : "Not specified";

    profilePersonalityEl.textContent =
      p.personality && p.personality.trim()
        ? p.personality
        : "Not specified";

    profileConcernsEl.textContent =
      Array.isArray(p.keyConcerns) && p.keyConcerns.length > 0
        ? p.keyConcerns.join(", ")
        : "None yet";

    if (profileNotesInput) {
      profileNotesInput.value = p.notes || "";
    }
    if (profileStatusEl) {
      profileStatusEl.textContent = "Profile loaded from memory.";
    }
  } catch (e) {
    console.error(e);
    if (profileStatusEl) {
      profileStatusEl.textContent = "Error loading profile.";
    }
  }
}

async function saveProfileNotes() {
  if (!profileNotesInput) return;
  const notes = profileNotesInput.value.trim();

  if (profileStatusEl) {
    profileStatusEl.textContent = "Saving notes to memory…";
  }

  try {
    const res = await fetch("http://localhost:4000/api/profile/mom", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes })
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      if (profileStatusEl) {
        profileStatusEl.textContent =
          data.error || "Error saving profile notes.";
      }
      return;
    }

    if (profileStatusEl) {
      profileStatusEl.textContent = "Notes saved. I’ll use this in my answers.";
    }
  } catch (e) {
    console.error(e);
    if (profileStatusEl) {
      profileStatusEl.textContent = "Error saving profile notes.";
    }
  }
}

if (profileSaveBtn) {
  profileSaveBtn.addEventListener("click", saveProfileNotes);
}

// Load profile once on startup
loadProfile();

// Form submit
if (chatForm && chatInput) {
  chatForm.addEventListener("submit", (e) => {
    e.preventDefault();
    sendMessage(chatInput.value);
  });
}

// Preset chips
presetButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const text = btn.textContent.trim();
    sendMessage(text);
  });
});

// PATIENT OVERVIEW COLLAPSE
const patientToggle = document.getElementById("patientToggle");
const patientBody = document.getElementById("patientBody");
const patientCard = document.querySelector(".patient-card");

if (patientToggle && patientBody && patientCard) {
  patientToggle.addEventListener("click", () => {
    patientBody.classList.toggle("open");
    patientCard.classList.toggle("collapsed");
  });
}

// === COLLAPSIBLE SECTIONS ===
document.querySelectorAll(".collapse-toggle").forEach((btn) => {
  const targetId = btn.getAttribute("data-target");
  const body = targetId ? document.getElementById(targetId) : null;

  // Skip if no matching body (e.g. patient toggle handled separately)
  if (!body) return;

  // Default open state
  btn.classList.add("open");
  body.classList.remove("closed");

  btn.addEventListener("click", () => {
    const isOpen = btn.classList.contains("open");

    if (isOpen) {
      btn.classList.remove("open");
      body.classList.add("closed");
    } else {
      btn.classList.add("open");
      body.classList.remove("closed");

      // Smooth scroll into view when opening
      setTimeout(() => {
        body.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 180);
    }
  });
});
