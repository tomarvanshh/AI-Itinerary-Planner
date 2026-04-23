import { fetchHotels } from "./api.js";
import { destinationCity } from "./state.js";

const hotelSection = document.getElementById("hotelSection");
const hotelGrid = document.getElementById("hotelGrid");
const confirmBtn = document.getElementById("confirmHotelBtn");

export let selectedHotel = null;

function getGooglePhotoUrl(photoRef) {
  if (!photoRef) return 'https://cf.bstatic.com/xdata/images/hotel/max1024x768/640278495.jpg?k=d01b304a29089108ae381173be12460b5524ea2ce71cf3203fa2dcea36d370a8&o=';
  // Matches Flask blueprint: /api (prefix) + /places (blueprint) + /hotel/photo (route)
 return `http://127.0.0.1:5000/api/hotel/photo?photoreference=${photoRef}`;
}
// Change the function to accept budget and days
export async function showHotelOptions(budget, days) {
  if (!destinationCity) return;

  hotelSection.style.display = "block";
  hotelGrid.innerHTML = "<p class='loading-text'>Finding nearby accommodations matching your budget...</p>";

  try {
    // Pass the actual budget and days to the fetchHotels call
    const data = await fetchHotels({
      lat: destinationCity.lat,
      lon: destinationCity.lon,
      budget: budget,
      days: days
    });

    renderHotelCards(data.hotels);
  } catch (err) {
    console.error("Hotel Error:", err);
    hotelGrid.innerHTML = "<p class='error-text'>Could not load hotels. Check your budget or connection.</p>";
  }
}

function renderHotelCards(hotels) {
  hotelGrid.innerHTML = ""; // Clear loading text

  hotels.forEach(hotel => {
    const photoUrl = getGooglePhotoUrl(hotel.photo_ref);
    const card = document.createElement("div");
    card.className = "hotel-card";

    
    // Using simple logic: show name, rating, and a mock price
    card.innerHTML = `
    <div class="hotel-image" style="background-image: url('${photoUrl}')"></div>
    <div class="hotel-content hotel-info">
    <h3>${hotel.name}</h3>
    <p class="hotel-address"><i class="fas fa-map-marker-alt"></i> ${hotel.address}</p>
    <div class="hotel-meta">
      <span class="rating">⭐ ${hotel.rating || 'N/A'}</span>
      <span class="price-tag">Avg. ₹1200/night</span>
    </div>
  </div>
`;

    card.addEventListener("click", () => {
      // Remove selection from others
      document.querySelectorAll(".hotel-card").forEach(c => c.classList.remove("selected"));
      // Add selection to this one
      card.classList.add("selected");
      selectedHotel = hotel;
      confirmBtn.disabled = false;
      confirmBtn.innerText = `Select ${hotel.name}`;
    });

    hotelGrid.appendChild(card);
  });
}


let hotelConfirmedCallback = null;

confirmBtn.addEventListener("click", () => {
    alert(`Accommodation locked: ${selectedHotel.name}`);
    if (hotelConfirmedCallback) {
        hotelConfirmedCallback(selectedHotel);
    }
});

// allow other modules to register a callback when the user confirms a hotel
export function onHotelConfirmed(cb) {
    hotelConfirmedCallback = cb;
}

export function getSelectedHotel() {
  return selectedHotel;
}