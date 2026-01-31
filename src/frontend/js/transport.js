import {
  sourceCity,
  destinationCity,
  selectedTransport,
  setSelectedTransport,
  setLockedTransport
} from "./state.js";

const lockBtn = document.getElementById("lockTransportBtn");

export function showTransportOptions(data) {
  if (!sourceCity || !destinationCity) return;

  const section = document.getElementById("transportSection");
  const container = document.getElementById("transportCards");

  container.innerHTML = "";
  section.style.display = "block";
  lockBtn.disabled = true;

  data.options.forEach((option) => {
    const card = document.createElement("div");
    const modeClass = option.mode.toLowerCase();

    card.className = `transport-card ${modeClass}`;

    if (option.mode === data.recommended) {
      card.classList.add("recommended");
    }

    card.innerHTML = `
      <div class="transport-overlay">
        <div class="transport-top">
          ${
            option.mode === data.recommended
              ? `<span class="badge">Recommended</span>`
              : ""
          }
          <div class="transport-name">${option.mode}</div>
        </div>

        <div class="transport-middle">
          ${sourceCity.name} → ${destinationCity.name}
        </div>

        <div class="transport-bottom">
          <div class="transport-price">₹${option.estimated_cost}</div>
          <div class="view-details">View details</div>
        </div>
      </div>
    `;

    card.addEventListener("click", () => {
      document
        .querySelectorAll(".transport-card")
        .forEach((c) => c.classList.remove("selected"));

      card.classList.add("selected");

      setSelectedTransport(option);
      setLockedTransport(null);

      lockBtn.disabled = false;
      lockBtn.innerText = "Continue with selected transport";
    });

    container.appendChild(card);
  });
}

lockBtn.onclick = async () => {
  if (!selectedTransport) return;

  const payload = {
    mode: selectedTransport.mode,
    price: selectedTransport.estimated_cost,
    duration_hr: selectedTransport.estimated_time_hr,
    source: {
      name: sourceCity.name,
      lat: sourceCity.lat,
      lon: sourceCity.lon,
    },
    destination: {
      name: destinationCity.name,
      lat: destinationCity.lat,
      lon: destinationCity.lon,
    },
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

    document
      .querySelectorAll(".transport-card")
      .forEach((card) => card.classList.remove("locked"));

    const selectedCard = document.querySelector(".transport-card.selected");
    if (selectedCard) selectedCard.classList.add("locked");

    lockBtn.innerText = "Change transport";

  } catch (err) {
    console.error("Transport lock error:", err);
  }
};
