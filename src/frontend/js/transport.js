import {
  sourceCity,
  destinationCity,
  setSelectedTransport,
  setLockedTransport,
} from "./state.js";
import BASE_URL from "./config.js";
 
const lockBtn = document.getElementById("lockTransportBtn");
const transportGrid = document.getElementById("transportCards");
 
export function showTransportOptions(options) {
  document.getElementById("budget-warning").style.display = "none";
 
  if (!sourceCity || !destinationCity) return;
 
  const section = document.getElementById("transportSection");
  transportGrid.innerHTML = "";
  section.style.display = "block";
  lockBtn.disabled = true;
 
  if (!options || options.length === 0) {
    transportGrid.innerHTML = "<p class='error-text'>No transport options found.</p>";
    return;
  }
 
  if (options.error) {
    document.getElementById("budget-warning").style.display = "block";
    document.getElementById("budget-warning").innerText = options.error;
    options = options.options;
  }
 
  options.forEach((option) => {
    const card = document.createElement("div");
 
    const isFlight = option.type.toLowerCase().includes("flight");
    const isTrain = option.type.toLowerCase().includes("train");
    const isBus = option.type.toLowerCase().includes("bus");
 
    let typeClass = "other";
    if (isFlight) typeClass = "flight";
    else if (isTrain) typeClass = "train";
    else if (isBus) typeClass = "bus";
 
    card.className = `transport-card ${typeClass}`;
 
    const recommendationBadge = option.recommended
      ? "<span class='badge-recommended'>⭐ Recommended</span>"
      : "";
 
    card.innerHTML = `
      <div class="transport-overlay">
        <div class="transport-top">
          ${recommendationBadge}
          <div class="transport-name">${option.type}</div>
        </div>
        <div class="transport-middle">
          <p>${sourceCity.name} → ${destinationCity.name}</p>
        </div>
        <div class="transport-bottom">
          <div>Per Head: ₹${option.price_per_head}</div>
          <div>Total: ₹${option.total_price}</div>
          <div>${option.duration}</div>
        </div>
      </div>
    `;
 
    card.addEventListener("click", () => {
      document.querySelectorAll(".transport-card").forEach((c) => c.classList.remove("selected"));
      card.classList.add("selected");
      setSelectedTransport(option);
      setLockedTransport(null);
      lockBtn.disabled = false;
      lockBtn.innerText = `Continue with ${option.type}`;
    });
 
    transportGrid.appendChild(card);
  });
}
 
lockBtn.onclick = async () => {
  const { selectedTransport } = await import("./state.js");
  if (!selectedTransport) return;
 
  const payload = {
    type: selectedTransport.type,
    price: selectedTransport.price,
    duration: selectedTransport.duration,
    provider: selectedTransport.provider || selectedTransport.name,
    source: sourceCity.name,
    destination: destinationCity.name,
  };
 
  try {
    const res = await fetch(`${BASE_URL}/api/lock-transport`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
 
    const data = await res.json();
 
    if (data.error) {
      alert("Transport lock failed");
      return;
    }
 
    setLockedTransport(payload);
 
    document.querySelectorAll(".transport-card").forEach((c) => c.classList.remove("locked"));
    const selectedCard = document.querySelector(".transport-card.selected");
    if (selectedCard) selectedCard.classList.add("locked");
 
    lockBtn.innerText = "Change Selection";
  } catch (err) {
    console.error("Transport lock error:", err);
  }
};