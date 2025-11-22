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
