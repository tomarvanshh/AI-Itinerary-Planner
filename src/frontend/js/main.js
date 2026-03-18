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

  if (isNaN(budgetVal) || budgetVal <= 0) {
    alert("Please enter a valid budget.");
    return;
  }

  try {
    // 3. Calculate Geospatial Distance
    const distanceRes = await fetchDistance({
      source: sourceCity,
      destination: destinationCity
    });

    // 4. Fetch Real-time Transport (Flights/Trains)
    const transportRes = await fetchTransport({
      distance_km: distanceRes.distance_km,
      days: daysVal,
      budget: budgetVal,
      source: sourceCity,      // Passed as object {name, lat, lon}
      destination: destinationCity,
      date: "2026-03-15"      // Using fixed date for project testing
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

  try {
    // Show a basic loading indicator if needed
    console.log("Generating personalized itinerary...");

    // Fetch the final refined itinerary from LLM
    const itinerary = await fetchItinerary({
      places: tripContext.places,
      days: tripContext.days,
      preferences: getPreferences(),
      selected_hotel: getSelectedHotel() // Coordinates used for daily clustering
    });

    // Render results to the UI
    renderItinerary(itinerary);
    renderPlacesDebug(tripContext.places);

  } catch (err) {
    console.error("Itinerary error after hotel confirmation:", err);
    alert("Failed to generate itinerary. Check backend logs for LLM errors.");
  }
});