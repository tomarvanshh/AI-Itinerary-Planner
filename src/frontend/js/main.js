import "./city.js";
import "./transport.js";
import { showTransportOptions } from "./transport.js";
import "./preferences.js";
import { fetchDistance, fetchTransport } from "./api.js";
import { sourceCity, destinationCity } from "./state.js";
import {
  fetchDestinationPlaces,
  renderPlacesDebug
} from "./itinerary.js";
import { fetchItinerary } from "./api.js";
import { getPreferences } from "./preferences.js";
import { renderItinerary } from "./itinerary-ui.js";



const budgetSlider = document.getElementById("budget");
const budgetValue = document.getElementById("budgetValue");

budgetSlider.value = 50000;
budgetValue.innerText = `₹${budgetSlider.value}`;

budgetSlider.addEventListener("input", () => {
  budgetValue.innerText = `₹${budgetSlider.value}`;
});

document.getElementById("tripForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  if (!sourceCity || !destinationCity) {
    alert("Please select valid cities");
    return;
  }

  try {
    const payload = {
      source: sourceCity,
      destination: destinationCity
    };

    const distanceRes = await fetchDistance(payload);

    const transportRes = await fetchTransport({
      distance_km: distanceRes.distance_km,
      days: document.getElementById("days").value,
      budget: budgetSlider.value
    });

    const places = await fetchDestinationPlaces();

    const itinerary = await fetchItinerary({
    places: places,  
    days: document.getElementById("days").value,
    preferences: getPreferences()
    });



    renderItinerary(itinerary);

    showTransportOptions(transportRes);

    renderPlacesDebug(places);

  } catch (err) {
    console.error("Trip generation error:", err);
    alert("Something went wrong. Please try again.");
  }
});

