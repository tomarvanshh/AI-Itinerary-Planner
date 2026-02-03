import { fetchCities } from "./api.js";
import {
  setSourceCity,
  setDestinationCity
} from "./state.js";



function debounce(fn, delay = 200) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

function setupCityAutocomplete(inputId, suggestionBoxId) {
  const input = document.getElementById(inputId);
  const box = document.getElementById(suggestionBoxId);

  let currentIndex = -1;
  let currentItems = [];

  const debouncedSearch = debounce(searchCity, 200);

  input.addEventListener("input", () => {
    const query = input.value.trim();

  if (inputId === "source") setSourceCity(null);
  if (inputId === "destination") setDestinationCity(null);


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

async function searchCity(query, box, input, onRendered) {
  try {
    const data = await fetchCities(query);
    const items = renderCitySuggestions(data, box, input);
    console.log("data inside searchCity() in searchCity.js: ",data)
    onRendered(items);
  } catch (err) {
    console.error("City search error:", err);
  }
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

      if (input.id === "source") setSourceCity(cityObject);
      if (input.id === "destination") setDestinationCity(cityObject);



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

setupCityAutocomplete("source", "sourceSuggestions");
setupCityAutocomplete("destination", "destinationSuggestions");
