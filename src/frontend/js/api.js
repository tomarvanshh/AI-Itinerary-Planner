// js/api.js

export async function fetchDistance(payload) {
  const res = await fetch("http://127.0.0.1:5000/api/distance", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error("Distance API failed");
  }

  return res.json();
}

export async function fetchTransport(data) {
  const res = await fetch("http://127.0.0.1:5000/api/transport", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    throw new Error("Transport API failed");
  }

  return res.json();
}

export async function fetchCities(query) {
  const res = await fetch(
    `http://127.0.0.1:5000/api/search-city?q=${encodeURIComponent(query)}`
  );

  if (!res.ok) {
    throw new Error("City API failed");
  }

  return res.json();
}
export async function fetchItinerary(data) {
  const res = await fetch("http://127.0.0.1:5000/api/generate-itinerary", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    throw new Error("Failed to generate itinerary");
  }

  return res.json();
}

