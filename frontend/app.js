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
