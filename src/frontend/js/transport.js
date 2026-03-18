import {
  sourceCity,
  destinationCity,
  setSelectedTransport,
  setLockedTransport
} from "./state.js";

const lockBtn = document.getElementById("lockTransportBtn");
const transportGrid = document.getElementById("transportCards"); // Ensure this ID matches your HTML

export function showTransportOptions(options) {
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

  options.forEach((option) => {
    const card = document.createElement("div");
    
    // Determine card style based on transport type (Flight vs Train)
    const isFlight = option.type.toLowerCase().includes('flight');
    card.className = `transport-card ${isFlight ? 'flight-card' : 'train-card'}`;

    // Generate dynamic titles and badges
    const title = isFlight ? `Flight: ${option.provider}` : `Train: ${option.name}`;
    const subTitle = isFlight ? `Carrier Code: ${option.provider}` : `Train No: ${option.number}`;
    const estimateBadge = option.is_estimate ? "<span class='badge-estimate'>Estimated</span>" : "";

    card.innerHTML = `
      <div class="transport-overlay">
        <div class="transport-top">
          ${estimateBadge}
          <div class="transport-name">${title}</div>
        </div>

        <div class="transport-middle">
          <p>${subTitle}</p>
          <small>${sourceCity.name} → ${destinationCity.name}</small>
        </div>

        <div class="transport-bottom">
          <div class="transport-price">₹${option.price}</div>
          <div class="transport-duration"><i class="fas fa-clock"></i> ${option.duration}</div>
        </div>
      </div>
    `;

    card.addEventListener("click", () => {
      // Handle visual selection
      document.querySelectorAll(".transport-card").forEach((c) => c.classList.remove("selected"));
      card.classList.add("selected");

      // Update state
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