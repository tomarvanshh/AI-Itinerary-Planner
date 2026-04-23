import {
  sourceCity,
  destinationCity,
  setSelectedTransport,
  setLockedTransport
} from "./state.js";

const lockBtn = document.getElementById("lockTransportBtn");
const transportGrid = document.getElementById("transportCards"); // Ensure this ID matches your HTML

export function showTransportOptions(options) {

  document.getElementById("budget-warning").style.display = "none";

  if (!sourceCity || !destinationCity) return;

  const section = document.getElementById("transportSection");
  
  // Clear existing cards
  transportGrid.innerHTML = ""; 
  section.style.display = "block";
  lockBtn.disabled = true;

  if (!options || options.length === 0) {
    transportGrid.innerHTML = "<p class='error-text'>No real-time transport options found.</p>";
    return;
  }


  if (options.error) {
    document.getElementById("budget-warning").style.display = "block";
    document.getElementById("budget-warning").innerText = options.error;
    options = options.options; // Still show the options even if budget is insufficient
  }

  options.forEach((option) => {
    const card = document.createElement("div");
    
    // 1. Define the boolean check for reuse
    const isFlight = option.type.toLowerCase().includes('flight');
    const isTrain = option.type.toLowerCase().includes('train');
    const isBus = option.type.toLowerCase().includes('bus');
    // const isCab = option.type.toLowerCase().includes('cab');


    // 2. Normalize the type for CSS classes (e.g., "Flight (Estimated)" -> "flight")
    let typeClass = "other";
    if (isFlight) typeClass = "flight";
    else if (isTrain) typeClass = "train";
    else if (isBus) typeClass = "bus";

    // Add the base 'transport-card' and the specific type class for CSS
    card.className = `transport-card ${typeClass}`;

    // 3. Generate dynamic titles and badges
    const title = isFlight ? `Flight: ${option.provider}` : `Train: ${option.name}`;
    const subTitle = isFlight ? `Carrier Code: ${option.provider}` : `Train No: ${option.number}`;
    const estimateBadge = option.is_estimate ? "<span class='badge-estimate'>Estimated</span>" : "";

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
  // Access the currently selected transport from state
  const { selectedTransport } = await import("./state.js"); 
  if (!selectedTransport) return;

  const payload = {
    type: selectedTransport.type,
    price: selectedTransport.price,
    duration: selectedTransport.duration,
    provider: selectedTransport.provider || selectedTransport.name,
    source: sourceCity.name,
    destination: destinationCity.name
  };

  try {
    const res = await fetch("http://127.0.0.1:5000/api/lock-transport", {
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

    // Update UI to show locked state
    document.querySelectorAll(".transport-card").forEach((card) => card.classList.remove("locked"));
    const selectedCard = document.querySelector(".transport-card.selected");
    if (selectedCard) selectedCard.classList.add("locked");

    lockBtn.innerText = "Change Selection";

  } catch (err) {
    console.error("Transport lock error:", err);
  }
};