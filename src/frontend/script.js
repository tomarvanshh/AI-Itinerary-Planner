let sourceCity = null;
let destinationCity = null;

const budgetSlider = document.getElementById("budget");
const budgetValue = document.getElementById("budgetValue");

budgetSlider.value = 50000;
budgetValue.innerText = `₹${budgetSlider.value}`;

let selectedTransport = null;
let lockedTransport = null;

budgetSlider.addEventListener("input", () => {
  budgetValue.innerText = `₹${budgetSlider.value}`;
});

document.getElementById("tripForm").addEventListener("submit", function (e) {
  e.preventDefault();

  if (!sourceCity || !destinationCity) {
    alert("Please select valid source and destination cities.");
    return;
  }

  const payload = {
    source: {
      lat: sourceCity.lat,
      lon: sourceCity.lon,
    },
    destination: {
      lat: destinationCity.lat,
      lon: destinationCity.lon,
    },
  };

  fetch("http://127.0.0.1:5000/api/distance", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
    .then((res) => res.json())
    .then((data) => {
      const distance = data.distance_km;

      console.log("Distance (km):", distance);

      // Now call transport API
      return fetch("http://127.0.0.1:5000/api/transport", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          distance_km: distance,
          days: document.getElementById("days").value,
          budget: budgetSlider.value,
        }),
      })
        .then((res) => res.json())
        .then((result) => {
          console.log("Transport Recommendation:", result);

          // 🔥 THIS LINE MAKES UI VISIBLE
          showTransportOptions(result);
        });
    })
    .catch((err) => {
      console.error("API error:", err);
    });
});

const tagInput = document.getElementById("tagInput");
const tagContainer = document.getElementById("tagContainer");

let tags = [];

tagInput.addEventListener("keydown", function (e) {
  if (e.key === "Enter") {
    e.preventDefault();

    const value = tagInput.value.trim().toLowerCase();
    if (value === "" || tags.includes(value)) return;

    addTag(value);
    tagInput.value = "";
  }
});

function addTag(text) {
  tags.push(text);

  const tag = document.createElement("div");
  tag.classList.add("tag");
  tag.innerHTML = `${text} <span>&times;</span>`;

  tag.querySelector("span").addEventListener("click", () => {
    tagContainer.removeChild(tag);
    tags = tags.filter((t) => t !== text);
  });

  tagContainer.insertBefore(tag, tagInput);
}

function debounce(fn, delay = 800) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

setupCityAutocomplete("source", "sourceSuggestions");
setupCityAutocomplete("destination", "destinationSuggestions");

function setupCityAutocomplete(inputId, suggestionBoxId) {
  const input = document.getElementById(inputId);
  const box = document.getElementById(suggestionBoxId);

  let currentIndex = -1;
  let currentItems = [];

  const debouncedSearch = debounce(searchCity, 500);

  input.addEventListener("input", () => {
    const query = input.value.trim();

    // 🔓 UNLOCK city on manual typing
    if (inputId === "source") sourceCity = null;
    if (inputId === "destination") destinationCity = null;

    input.classList.remove("valid");
    input.classList.remove("invalid");

    currentIndex = -1;
    currentItems = [];

    if (query.length < 2) {
      box.style.display = "none";
      return;
    }

    debouncedSearch(query, box, input, (items) => {
      currentItems = items;
    });
  });

  input.addEventListener("keydown", (e) => {
    if (!currentItems.length) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      currentIndex = (currentIndex + 1) % currentItems.length;
      updateActiveItem(currentItems, currentIndex);
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      currentIndex =
        (currentIndex - 1 + currentItems.length) % currentItems.length;
      updateActiveItem(currentItems, currentIndex);
    }

    if (e.key === "Enter") {
      e.preventDefault();
      if (currentIndex >= 0) {
        currentItems[currentIndex].click();
      }
    }
  });

  document.addEventListener("click", (e) => {
    if (!e.target.closest(".autocomplete")) {
      box.style.display = "none";
    }
  });
}

function searchCity(query, box, input, onRendered) {
  const url = `http://127.0.0.1:5000/api/search-city?q=${encodeURIComponent(
    query
  )}`;

  fetch(url)
    .then((res) => res.json())
    .then((data) => {
      const items = renderCitySuggestions(data, box, input);
      onRendered(items);
    })
    .catch((err) => {
      console.error("City search error:", err);
    });
}

function renderCitySuggestions(results, box, input) {
  box.innerHTML = "";

  if (!results.length) {
    box.style.display = "none";
    return [];
  }

  const items = [];

  results.forEach((place) => {
    const city = place.text;
    const fullName = place.place_name;
    const [lon, lat] = place.center;

    const cityObject = {
      name: city,
      fullName,
      lat,
      lon,
    };

    const div = document.createElement("div");
    div.className = "suggestion-item";
    div.innerText = fullName;

    div.addEventListener("click", () => {
      input.value = city;
      box.style.display = "none";

      if (input.id === "source") sourceCity = cityObject;
      if (input.id === "destination") destinationCity = cityObject;

      input.classList.add("valid");
      input.classList.remove("invalid");

      console.log("Locked city:", cityObject);
    });

    box.appendChild(div);
    items.push(div);
  });

  box.style.display = "block";
  return items;
}

function updateActiveItem(items, index) {
  items.forEach((item) => item.classList.remove("active"));
  if (items[index]) {
    items[index].classList.add("active");
    items[index].scrollIntoView({ block: "nearest" });
  }
}

function showTransportOptions(data) {
  const section = document.getElementById("transportSection");
  const container = document.getElementById("transportCards");
  const lockBtn = document.getElementById("lockTransportBtn");

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
      selectedTransport = option;
      // Unlock if user is changing selection
      lockedTransport = null;

      lockBtn.disabled = false;
      lockBtn.innerText = "Continue with selected transport";
    });

    container.appendChild(card);
  });
}

const lockBtn = document.getElementById("lockTransportBtn");

lockBtn.addEventListener("click", () => {
  if (!selectedTransport) return;

  // lockedTransport = selectedTransport;
  const lockedTransport = {
    mode: selectedTransport.mode, // REQUIRED
    price: selectedTransport.price,
    duration: selectedTransport.time,
    source: sourceCity.name,
    destination: destinationCity.name,
  };

  // Remove old locks
  document
    .querySelectorAll(".transport-card")
    .forEach((card) => card.classList.remove("locked"));

  // Lock selected card
  const selectedCard = document.querySelector(".transport-card.selected");
  if (selectedCard) {
    selectedCard.classList.add("locked");
  }

  // Change button text
  lockBtn.innerText = "Change transport";

  console.log("Transport locked:", lockedTransport);
});

fetch("http://127.0.0.1:5000/api/lock-transport", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(lockedTransport),
})
  .then((res) => res.json())
  .then((data) => {
    if (data.error) {
      alert("Please Select transport option properly");
      return;
    }
    console.log("Backend lock:", data);
    showHotelSection(); // 👈 move to hotels
  });

function showHotelSection() {
  fetch("http://127.0.0.1:5000/api/hotels", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      city: destinationCity.name,
      adults: document.getElementById("adults").value,
      days: document.getElementById("days").value,
      budget: budgetSlider.value,
    }),
  })
    .then((res) => res.json())
    .then((data) => renderHotels(data.hotels));
}

function lockHotel(hotel) {
  fetch("http://127.0.0.1:5000/api/lock-hotel", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(hotel),
  });
}
