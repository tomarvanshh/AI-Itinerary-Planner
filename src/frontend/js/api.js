import BASE_URL from "./config.js";
 
export async function fetchDistance(payload) {
  const res = await fetch(`${BASE_URL}/api/distance`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Distance API failed");
  return res.json();
}
 
export async function fetchTransport(data) {
  const res = await fetch(`${BASE_URL}/api/transport`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Transport API failed");
  return res.json();
}
 
export async function fetchCities(query) {
  const res = await fetch(`${BASE_URL}/api/search-city?q=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error("City API failed");
  return res.json();
}
 
export async function fetchItinerary(data) {
  const res = await fetch(`${BASE_URL}/api/generate-itinerary`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to generate itinerary");
  return res.json();
}
 
export async function fetchHotels(payload) {
  const res = await fetch(`${BASE_URL}/api/hotels`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Hotels API failed");
  return res.json();
}
 
export async function fetchRestaurants(payload) {
  const res = await fetch(`${BASE_URL}/api/restaurants`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.json();
}