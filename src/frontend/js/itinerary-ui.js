// js/itinerary-ui.js
// ─────────────────────────────────────────────────────────────────────────────
// Renders the full travel plan:
//   1. Day-by-day itinerary cards  → inside #itineraryDays  (screenshotted for PDF)
//   2. Download PDF button         → between days and overview
//   3. AI destination overview     → inside #itineraryOverview (NOT in PDF)
// ─────────────────────────────────────────────────────────────────────────────

import BASE_URL from "./config.js";
import { downloadItineraryAsPDF } from "./pdf.js";

/**
 * renderItinerary(data)
 *
 * @param {Object} data - Response from backend:
 *   data.itinerary → Array of day objects
 *   data.overview  → AI-generated city overview string (optional)
 */
export function renderItinerary(data) {
  const section   = document.getElementById("itinerarySection");
  const container = document.getElementById("itineraryContainer");

  // Destructure — overview is optional (Gemini may not always return it)
  const { itinerary, overview } = data;

  // Clear any previous render
  container.innerHTML   = "";
  section.style.display = "block";

  // Extract days count for PDF filename
  const days = itinerary?.length || 1;

  // ── Helper: resolve photo ref → full image URL via Flask proxy ────────────
  function getPlaceImage(photoRef) {
    if (!photoRef) {
      return "https://as1.ftcdn.net/v2/jpg/00/82/47/38/1000_F_82473837_DRNJnLCFYuSUsObj3EgBY0h7is2BApgD.jpg";
    }
    // Routes through Flask proxy to avoid exposing Google API key on frontend
    return `${BASE_URL}/api/hotel/photo?photoreference=${photoRef}`;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // PART 1 — Day Cards Container
  //
  // We wrap all day cards in a dedicated <div id="itineraryDays">.
  // pdf.js screenshots THIS element only — so the AI overview below is
  // excluded from the PDF automatically.
  // ─────────────────────────────────────────────────────────────────────────
  const daysWrapper = document.createElement("div");
  daysWrapper.id = "itineraryDays";   // ← pdf.js targets this ID

  itinerary.forEach((day) => {
    const dayCard = document.createElement("div");
    dayCard.className = "day-card";

    let itemsHTML = "";

    day.places.forEach((item) => {
      const isLogistics = item.is_transport === true;
      const imageUrl    = getPlaceImage(item.photo_ref);

      if (isLogistics) {
        // ── Logistics row (arrival, check-in, departure) ──────────────────
        itemsHTML += `
          <div class="place-row transport-highlight">
            <div class="place-time">
              <i class="far fa-clock"></i> ${item.time || "Scheduled"}
            </div>
            <div class="place-info">
              <div class="place-name">${item.activity || item.name}</div>
              ${item.location
                ? `<div class="place-loc"><i class="fas fa-map-marker-alt"></i> ${item.location}</div>`
                : ""}
            </div>
          </div>`;

      } else if (item.type === "meal") {
        // ── Meal card (lunch / dinner) ────────────────────────────────────
        itemsHTML += `
          <div class="meal-card">
            <div class="meal-info">
              <i class="fas fa-utensils"></i>
              <strong>${item.name}</strong>
            </div>
            <div class="meal-link">
              <a href="${item.website || "#"}" target="_blank" rel="noopener noreferrer">
                View Menu &amp; Location
              </a>
            </div>
          </div>`;

      } else {
        // ── Tourist attraction card ───────────────────────────────────────
        let place_details = "";
        if (item.generative_summary) place_details += item.generative_summary + "<br/>";
        if (item.review_summary)     place_details += item.review_summary;

        itemsHTML += `
          <div class="place-card">
            <div class="place-left">
              <div class="place-title">${item.name}</div>
              <div class="place-details">
                ${place_details || "A beautiful spot to explore and enjoy!"}
              </div>
            </div>
            <div class="place-right">
              <img
                src="${imageUrl}"
                class="place-img"
                alt="${item.name}"
                onerror="this.src='https://as1.ftcdn.net/v2/jpg/00/82/47/38/1000_F_82473837_DRNJnLCFYuSUsObj3EgBY0h7is2BApgD.jpg'"
              />
            </div>
          </div>`;
      }
    });

    dayCard.innerHTML = `
      <div class="day-header">
        <h3>Day ${day.day}</h3>
        <span><i class="fas fa-hourglass-half"></i> ${day.total_hours} hrs</span>
      </div>
      <div class="day-body">
        ${itemsHTML}
      </div>
    `;

    daysWrapper.appendChild(dayCard);
  });

  container.appendChild(daysWrapper);

  // ─────────────────────────────────────────────────────────────────────────
  // PART 2 — Download PDF Button
  //
  // Positioned AFTER the day cards and BEFORE the AI overview.
  // Clicking it screenshots #itineraryDays only (see pdf.js).
  // ─────────────────────────────────────────────────────────────────────────
  const downloadBtn     = document.createElement("button");
  downloadBtn.id        = "downloadPdfBtn";
  downloadBtn.className = "cta-btn download-pdf-btn";
  downloadBtn.innerHTML = "⬇️ Download Itinerary as PDF";
  downloadBtn.style.cssText = `
    display: block;
    margin: 32px auto;
    padding: 14px 40px;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    letter-spacing: 0.4px;
  `;

  // Pass btn reference (for state management) and days (for PDF filename)
  downloadBtn.addEventListener("click", () => {
    downloadItineraryAsPDF(downloadBtn, days);
  });

  container.appendChild(downloadBtn);

  // ─────────────────────────────────────────────────────────────────────────
  // PART 3 — AI Destination Overview Card
  //
  // Rendered BELOW the download button.
  // Excluded from PDF automatically since pdf.js targets #itineraryDays only.
  // ─────────────────────────────────────────────────────────────────────────
  if (overview) {
    const summaryCard = document.createElement("div");
    summaryCard.className = "final-overview-card";

    // Auto-bold section headers and convert newlines to <br>
    const stylizedText = overview
      .replace(
        /(Exploring:|Famous For:|Best Time to Visit:)/g,
        "<strong>$1</strong>"
      )
      .replace(/\n/g, "<br/>");

    summaryCard.innerHTML = `
      <div class="summary-header">
        <div class="summary-icon-box">
          <i class="fas fa-sparkles"></i>
        </div>
        <h3>PlanMySafar Insights</h3>
      </div>
      <div class="summary-content">
        ${stylizedText}
      </div>
    `;

    container.appendChild(summaryCard);
  }
}