 export function renderItinerary(itinerary) {
  const section = document.getElementById("itinerarySection");
  const container = document.getElementById("itineraryContainer");

  container.innerHTML = "";
  section.style.display = "block";

  itinerary.forEach(day => {
    const dayCard = document.createElement("div");
    dayCard.className = "day-card";

    let placesHTML = "";

    day.places.forEach(place => {
      placesHTML += `
        <div class="place-row">
          <div class="place-name">${place.name}</div>
          <div class="place-time">
            Sightseeing: ${place.sightseeing_hr}h |
            Travel: ${place.travel_hr}h
          </div>
        </div>
      `;
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
