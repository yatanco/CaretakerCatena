const statusEl = document.getElementById("status");
const btn = document.getElementById("checkBtn");

async function checkHealth() {
  statusEl.textContent = "Checking backend...";
  try {
    const res = await fetch("http://localhost:4000/health");
    if (!res.ok) throw new Error("Failed");
    const data = await res.json();
    statusEl.textContent = "Backend OK ✔️";
  } catch (e) {
    statusEl.textContent = "Backend unreachable ✖️";
  }
}

checkHealth();
btn.addEventListener("click", checkHealth);

const balanceBtn = document.getElementById("btnBalance");
const balanceOut = document.getElementById("balanceOut");

balanceBtn.addEventListener("click", async () => {
  balanceOut.textContent = "Loading...";
  try {
    const res = await fetch("http://localhost:4000/api/account/balance");
    const data = await res.json();
    balanceOut.textContent = JSON.stringify(data, null, 2);
  } catch (e) {
    balanceOut.textContent = "Error fetching balance";
  }
});

const serviceBtn = document.getElementById("btnService");
const serviceOut = document.getElementById("serviceOut");

serviceBtn.addEventListener("click", async () => {
  serviceOut.textContent = "Running service...";
  try {
    const res = await fetch("http://localhost:4000/api/services/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input: "test" })
    });
    const data = await res.json();
    serviceOut.textContent = JSON.stringify(data, null, 2);
  } catch (e) {
    serviceOut.textContent = "Error running service";
  }
});
