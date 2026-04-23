import "./city.js";
import "./transport.js";
import { showTransportOptions } from "./transport.js";
import "./preferences.js";
import { fetchDistance, fetchTransport, fetchItinerary } from "./api.js";
import { sourceCity, destinationCity } from "./state.js";
import { fetchDestinationPlaces, renderPlacesDebug } from "./itinerary.js";
import { getPreferences } from "./preferences.js";
import { renderItinerary } from "./itinerary-ui.js";
import { showHotelOptions, onHotelConfirmed, getSelectedHotel } from "./hotel.js";

// State to hold data captured during form submission for the final itinerary generation
let tripContext = {
  places: null,
  days: null,
  budget: null
};
// main.js helper functions
const loadingOverlay = document.getElementById("loadingOverlay");
const loadingText = document.getElementById("loadingText");

function showLoading(text) {
    loadingText.innerText = text;
    loadingOverlay.style.display = "flex";
}

function hideLoading() {
    loadingOverlay.style.display = "none";
}

/**
 * Main Form Submission Handler
 * Triggers distance calculation, real-time transport fetching, 
 * and hotel option display.
 */
document.getElementById("tripForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  // 1. Validation: Ensure cities are selected via Mapbox
  if (!sourceCity || !destinationCity) {
    alert("Please select valid source and destination cities.");
    return;
  }

  // 2. Capture Input Values
  const budgetVal = parseFloat(document.getElementById("budget").value);
  const daysVal = document.getElementById("days").value;
  const adultsVal = parseInt(document.getElementById("adults").value) || 1;

  if (isNaN(budgetVal) || budgetVal <= 0) {
    alert("Please enter a valid budget.");
    return;
  }
  showLoading("Fetching Transport & Hotels..."); // Start Loading
  try {
    // 3. Calculate Geospatial Distance
    const distanceRes = await fetchDistance({
      source: sourceCity,
      destination: destinationCity
    });

    const formattedDate = new Date().toISOString().split('T')[0];
    console.log(formattedDate); // "2026-03-20"


    // 4. Fetch Real-time Transport (Flights/Trains)
    const transportRes = await fetchTransport({
      distance_km: distanceRes.distance_km,
      days: daysVal,
      budget: budgetVal,
      adults: adultsVal,
      source: sourceCity,      // Passed as object {name, lat, lon}
      destination: destinationCity,
      date: formattedDate      // Using current date for project testing, date is in "YYYY-MM-DD" format(string), backend can handle date parsing and validation
    });

    // 5. Fetch Potential Attractions at Destination
    const places = await fetchDestinationPlaces();

    // 6. Update UI Components
    showTransportOptions(transportRes);
    showHotelOptions(budgetVal, daysVal); // Centers daily travel around selected hotel
    
    // 7. Store Context for Itinerary Generation
    tripContext.places = places;
    tripContext.days = daysVal;
    tripContext.budget = budgetVal;

  } catch (err) {
    console.error("Trip generation error:", err);
    alert("Something went wrong while fetching travel options. Please try again.");
  }
  finally {
        hideLoading(); // Stop Loading regardless of success/fail
    }
});

/**
 * Itinerary Generation Handler
 * Triggered only after a user confirms their hotel selection.
 */
onHotelConfirmed(async () => {
  // Check if initial form was submitted
  if (!tripContext.places) { 
    alert("Please search for a destination before confirming a hotel.");  
    return; 
  }

  showLoading("Generating your personalized itinerary with AI..."); // Start Loading

  try {
    // Show a basic loading indicator if needed
    console.log("Generating personalized itinerary...");

    // Fetch the final refined itinerary from LLM
    const itinerary = await fetchItinerary({
      places: tripContext.places,
      days: tripContext.days,
      budget: tripContext.budget,
      preferences: getPreferences(),
      selected_hotel: getSelectedHotel() // Coordinates used for daily clustering
    });

    // Render results to the UI
    renderItinerary(itinerary);
    // renderPlacesDebug(tripContext.places);

  } catch (err) {
    console.error("Itinerary error after hotel confirmation:", err);
    alert("Failed to generate itinerary. Check backend logs for LLM errors.");
  }
  finally {
        hideLoading(); // Stop Loading
    }
});