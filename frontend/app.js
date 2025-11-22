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
        data.reply ||
        data.error ||
        data.message ||
        `Server error (status ${res.status})`;
      hideTyping();
      appendMessage("bot", msg);
      return;
    }

    // 🔧 Clean reply selection: prefer plain text fields, never dump full JSON
    const reply =
      // 1) Our explicit reply field (from backend)
      (data && data.reply) ??
      // 2) Direct 0G-style shape: { content, metadata }
      (data && data.content) ??
      // 3) Nested 0G result: { result: { response: { content } } }
      (data &&
      data.result &&
      data.result.response &&
      typeof data.result.response.content === "string"
        ? data.result.response.content
        : null) ??
      // 4) Other possible simple text fields
      (data && data.result) ??
      (data && data.message) ??
      (data && data.text) ??
      // 5) Fallback
      "The server responded, but I couldn't read the reply.";

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
