import BASE_URL from "./config.js";
 
export function renderItinerary(itinerary) {
  const section = document.getElementById("itinerarySection");
  const container = document.getElementById("itineraryContainer");
 
  container.innerHTML = "";
  section.style.display = "block";
 
  function getPlaceImage(photoRef) {
    if (!photoRef) return "https://as1.ftcdn.net/v2/jpg/00/82/47/38/1000_F_82473837_DRNJnLCFYuSUsObj3EgBY0h7is2BApgD.jpg";
    return `${BASE_URL}/api/hotel/photo?photoreference=${photoRef}`;
  }
 
  itinerary.forEach((day) => {
    const dayCard = document.createElement("div");
    dayCard.className = "day-card";
 
    let placesHTML = "";
 
    day.places.forEach((place) => {
      let place_details = "";
      if (place.generative_summary) place_details += place.generative_summary + "<br/>";
      if (place.review_summary) place_details += place.review_summary;
 
      const imageUrl = getPlaceImage(place.photo_ref);
 
      if (place.type === "meal") {
        placesHTML += `
          <div class="meal-card">
            ${place.name}
            <div class="meal-link">
              <a href="${place.website}" target="_blank">View Restaurant</a>
            </div>
          </div>`;
      } else {
        placesHTML += `
          <div class="place-card">
            <div class="place-left">
              <div class="place-title">${place.name}</div>
              <div class="place-details">${place_details || "Less explored place, Discover and Enjoy!"}</div>
            </div>
            <div class="place-right">
              <img src="${imageUrl}" class="place-img"/>
            </div>
          </div>`;
      }
    });
 
    dayCard.innerHTML = `
      <div class="day-header">
        <h3>Day ${day.day}</h3>
        <span>${day.total_hours} hrs</span>
      </div>
      <div class="day-places">
        ${placesHTML}
      </div>
    `;
 
    container.appendChild(dayCard);
  });
}