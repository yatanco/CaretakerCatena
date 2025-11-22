const statusEl = document.getElementById("status");
const btn = document.getElementById("checkBtn");

const balanceBtn = document.getElementById("btnBalance");
const balanceOut = document.getElementById("balanceOut");

const serviceBtn = document.getElementById("btnService");
const serviceOut = document.getElementById("serviceOut");
const serviceInput = document.getElementById("serviceInput");

function setStatus(text, mode) {
  statusEl.textContent = text;
  statusEl.classList.remove("status-ok", "status-error");
  if (mode === "ok") statusEl.classList.add("status-ok");
  if (mode === "error") statusEl.classList.add("status-error");
}

async function checkHealth() {
  setStatus("Checking backend…", null);
  try {
    const res = await fetch("http://localhost:4000/health");
    if (!res.ok) throw new Error("Failed");
    const data = await res.json();
    // If backend sends something like { status: "ok" } you can use it here
    setStatus("Backend OK ✔️", "ok");
    console.log("Health:", data);
  } catch (e) {
    console.error(e);
    setStatus("Backend unreachable ✖️", "error");
  }
}

btn.addEventListener("click", checkHealth);
checkHealth(); // run on load

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

serviceBtn.addEventListener("click", async () => {
  const input = serviceInput?.value ?? "test";
  serviceOut.textContent = "Running service…";

  try {
    const res = await fetch("http://localhost:4000/api/services/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input })
    });
    if (!res.ok) throw new Error("Service request failed");
    const data = await res.json();
    serviceOut.textContent = JSON.stringify(data, null, 2);
  } catch (e) {
    console.error(e);
    serviceOut.textContent = "Error running service.";
  }
});
// === Chatbot logic ===
const chatForm = document.getElementById("chatForm");
const chatInput = document.getElementById("chatInput");
const chatMessages = document.getElementById("chatMessages");
const chatSend = document.getElementById("chatSend");
const presetButtons = document.querySelectorAll("[data-preset]");

// Simple in-memory history (frontend-side, optional)
const conversation = [];

// Helper: append a message to the UI
function appendMessage(role, text) {
  const wrapper = document.createElement("div");
  wrapper.className = `chat-message ${role === "user" ? "user" : "bot"}`;

  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.textContent = text;

  wrapper.appendChild(bubble);
  chatMessages.appendChild(wrapper);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Helper: show "typing..." bubble
let typingEl = null;
function showTyping() {
  if (typingEl) return;
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

// Send message to backend
async function sendMessage(text) {
  const trimmed = text.trim();
  if (!trimmed) return;

  // add to UI + history
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
        // OPTIONAL: if your backend supports history, send it:
        // history: conversation,
        // mode: "caretaker-chat"
      })
    });

    if (!res.ok) throw new Error("Chat request failed");

    const data = await res.json();

    // Adjust this depending on your backend response shape:
    const reply =
      data.reply ||
      data.output ||
      data.message ||
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

// Handle form submit
chatForm.addEventListener("submit", (e) => {
  e.preventDefault();
  sendMessage(chatInput.value);
});

// Preset chips: clicking fills + sends
presetButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const text = btn.textContent.trim();
    sendMessage(text);
  });
});
