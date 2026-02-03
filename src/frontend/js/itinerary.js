import { destinationCity } from "./state.js";

export async function fetchDestinationPlaces() {
  if (!destinationCity) {
    console.warn("Destination city not set yet");
    return [];
  }

  const res = await fetch("http://127.0.0.1:5000/api/places", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      lat: destinationCity.lat,
      lon: destinationCity.lon,
      days: document.getElementById("days").value
    })
  });

  if (!res.ok) {
    console.error("Places API failed");
    return [];
  }

  const data = await res.json();
  console.log("📍 Places fetched:", data.places);

  return data.places;
}

export function renderPlacesDebug(places) {
  const debugSection = document.getElementById("placesDebug");
  const list = document.getElementById("placesList");

  list.innerHTML = "";
  debugSection.style.display = "block";

  places.forEach((p, index) => {
    const div = document.createElement("div");
    div.style.background = "rgba(255,255,255,0.95)";
    div.style.marginBottom = "12px";
    div.style.padding = "14px";
    div.style.borderRadius = "12px";
    div.style.color = "#0a3d91";

    div.innerHTML = `
      <strong>${index + 1}. ${p.name}</strong><br/>
      Tags: ${(p.tags || []).join(", ")}<br/>
      Avg Time: ${p.avg_time_hr} hrs<br/>
      Priority: ${p.priority}
    `;

    list.appendChild(div);
  });
}
