// === Backend health ===
const statusEl = document.getElementById("status");
const btn = document.getElementById("checkBtn");
const balanceBtn = document.getElementById("btnBalance");
const balanceOut = document.getElementById("balanceOut");

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
checkHealth();

// === Account balance ===
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

// === Caretaker chat ===
const chatForm = document.getElementById("chatForm");
const chatInput = document.getElementById("chatInput");
const chatMessages = document.getElementById("chatMessages");
const chatSend = document.getElementById("chatSend");
const presetButtons = document.querySelectorAll("[data-preset]");

// Simple in-memory history (frontend-side)
const conversation = [];

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

// "Thinking…" bubble
let typingEl = null;
function showTyping() {
  if (!chatMessages || typingEl) return;
  typingEl = document.createElement("div");
  typingEl.className = "chat-message bot";

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
        // If your backend supports it, you can also send:
        // history: conversation,
        // mode: "caretaker-chat"
      })
    });

    if (!res.ok) throw new Error("Chat request failed");
    const data = await res.json();

    // Try common fields, then fall back to raw JSON
    const reply =
      data.reply ||
      data.output ||
      data.message ||
      data.text ||
      JSON.stringify(data, null, 2);

    hideTyping();
    appendMessage("bot", reply);
    conversation.push({ role: "assistant", content: reply });
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
