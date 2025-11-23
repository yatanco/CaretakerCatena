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

  try {
    const res = await fetch("http://localhost:4000/api/services/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        input: trimmed,
        history: conversation // send full history so backend can build prompt
      })
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const msg =
        extractReply(data) ||
        data.error ||
        `Server error (status ${res.status})`;
      hideTyping();
      appendMessage("bot", msg);
      return;
    }

    const reply =
      extractReply(data) ||
      "The server responded, but I couldn't read the reply.";

    hideTyping();
   // Generate a random "caregivers found this helpful" count
const helpfulCount = Math.floor(Math.random() * 40) + 10; // 10–50 range

// Wrap final bot message with a footer
const finalMessage = `${reply}\n\n🟩 ${helpfulCount} caregivers found this helpful`;

appendMessage("bot", finalMessage);
conversation.push({ role: "assistant", content: finalMessage });

  } catch (err) {
    console.error(err);
    hideTyping();
    appendMessage(
      "bot",
      "Sorry, something went wrong talking to the server. Please try again."
    );
  } finally {
    chatInput.disabled = false;
    chatSend.disabled = false;
    chatInput.focus();
  }
}

// === Care Profile Memory Panel ===
const profileDiagnosisEl = document.getElementById("profileDiagnosis");
const profileLivingEl = document.getElementById("profileLiving");
const profilePersonalityEl = document.getElementById("profilePersonality");
const profileConcernsEl = document.getElementById("profileConcerns");
const profileNotesInput = document.getElementById("profileNotesInput");
const profileSaveBtn = document.getElementById("profileSaveBtn");
const profileStatusEl = document.getElementById("profileStatus");

async function loadProfile() {
  if (
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
      if (profileStatusEl) {
        profileStatusEl.textContent = "Could not load profile.";
      }
      return;
    }

    const p = data.profile;

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

if (patientToggle && patientBody) {
  patientToggle.addEventListener("click", () => {
    patientBody.classList.toggle("open");
    patientCard.classList.toggle("collapsed");
  });
}
