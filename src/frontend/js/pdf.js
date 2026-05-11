// js/pdf.js
// ─────────────────────────────────────────────────────────────────────────────
// Handles client-side PDF generation using:
//   • html2canvas  — screenshots the rendered itinerary DOM element
//   • jsPDF        — packages that screenshot into a downloadable PDF
//
// No backend involved. Everything happens in the user's browser.
// Libraries are loaded via <script> tags in index.html (CDN).
// ─────────────────────────────────────────────────────────────────────────────

import { destinationCity } from "./state.js";

// ── Constants ─────────────────────────────────────────────────────────────────
const A4_WIDTH_MM  = 210;   // A4 page width in millimetres
const A4_HEIGHT_MM = 297;   // A4 page height in millimetres
const CANVAS_SCALE = 2;     // 2x = retina quality, prevents blurry text in PDF

// ── Main exported function ────────────────────────────────────────────────────

/**
 * downloadItineraryAsPDF()
 *
 * Screenshots only #itineraryDays (the day cards, NOT the AI overview),
 * slices the screenshot into A4 pages, and triggers a PDF download.
 *
 * @param {HTMLButtonElement} btn  - The download button (to manage its state)
 * @param {number}            days - Number of trip days (used in filename)
 */
export async function downloadItineraryAsPDF(btn, days) {

  // ── Step 1: Guard — make sure the itinerary days container exists ─────────
  // We screenshot #itineraryDays (only the day cards) not the full container,
  // so the AI overview card is excluded from the PDF intentionally.
  const daysContainer = document.getElementById("itineraryDays");

  if (!daysContainer || daysContainer.children.length === 0) {
    showToast("Please generate an itinerary first.", "error");
    return;
  }

  // ── Step 2: Verify CDN libraries loaded successfully ──────────────────────
  // If the user is offline or CDN is blocked, fail gracefully.
  if (typeof window.jspdf === "undefined" || typeof window.html2canvas === "undefined") {
    showToast("PDF libraries failed to load. Check your internet connection.", "error");
    return;
  }

  // ── Step 3: Update button — prevent double clicks while processing ─────────
  const originalText = btn.innerHTML;
  btn.innerHTML      = "⏳ Generating PDF...";
  btn.disabled       = true;
  btn.style.opacity  = "0.7";

  try {

    // ── Step 4: Temporarily override styles for clean white PDF output ────────
    // Day cards use transparent / glassmorphism backgrounds designed for the
    // dark hero section. On a white PDF page these are invisible.
    // We force white backgrounds + dark text BEFORE screenshotting,
    // then restore AFTER. The user sees no visual flicker.
    const overrides = applyPdfStyles(daysContainer);

    // ── Step 5: Run html2canvas to screenshot the day cards container ─────────
    // useCORS: true  → allows images from Flask proxy (/api/hotel/photo)
    // scrollY        → captures full element height, not just visible viewport
    // scale: 2       → double resolution so text/images are sharp in PDF
    // logging: false → suppresses html2canvas console noise
    const canvas = await window.html2canvas(daysContainer, {
      scale          : CANVAS_SCALE,
      useCORS        : true,
      allowTaint     : false,
      scrollY        : -window.scrollY,
      scrollX        : 0,
      backgroundColor: "#ffffff",
      logging        : false,
    });

    // ── Step 6: Restore original styles immediately after screenshot ──────────
    restorePdfStyles(overrides);

    // ── Step 7: Read canvas dimensions ────────────────────────────────────────
    const canvasWidth  = canvas.width;    // pixels (already ×2 from scale)
    const canvasHeight = canvas.height;   // pixels (already ×2 from scale)

    // ── Step 8: Create jsPDF document ─────────────────────────────────────────
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({
      orientation : "portrait",
      unit        : "mm",
      format      : "a4",
    });

    // ── Step 9: Calculate scaling ratio ───────────────────────────────────────
    // ratio converts canvas pixels → PDF millimetres.
    // We want the canvas to fill the full A4 width exactly.
    const ratio          = A4_WIDTH_MM / canvasWidth;
    const pageHeightInPx = A4_HEIGHT_MM / ratio;  // how many px fit in one A4 page

    // ── Step 10: Add a title header on the first page ─────────────────────────
    // Simple text header — city name + trip duration — above the screenshot.
    const cityName = destinationCity?.name || "Trip";
    pdf.setFontSize(18);
    pdf.setTextColor(40, 40, 40);
    pdf.text(`PlanMySafar — ${cityName} (${days} Days)`, A4_WIDTH_MM / 2, 14, { align: "center" });

    pdf.setFontSize(10);
    pdf.setTextColor(120, 120, 120);
    pdf.text(`Generated on ${new Date().toLocaleDateString("en-IN")}`, A4_WIDTH_MM / 2, 20, { align: "center" });

    // Small gap below header before itinerary content starts
    const headerHeightMM = 24;

    // ── Step 11: Multi-page slicing loop ──────────────────────────────────────
    // Loop through the canvas vertically in A4-sized slices.
    // Each slice becomes one PDF page.
    let yPosition = 0;    // current Y offset in canvas pixels
    let pageIndex = 0;    // current PDF page number (0-indexed)

    while (yPosition < canvasHeight) {

      // How many pixels remain? Clamp so last slice doesn't overshoot.
      const sliceHeight = Math.min(pageHeightInPx, canvasHeight - yPosition);

      // Create an offscreen canvas for just this vertical slice
      const sliceCanvas    = document.createElement("canvas");
      sliceCanvas.width    = canvasWidth;
      sliceCanvas.height   = sliceHeight;

      const ctx = sliceCanvas.getContext("2d");

      // Copy the relevant portion of the main canvas onto the slice canvas.
      // drawImage(source, srcX, srcY, srcW, srcH, destX, destY, destW, destH)
      ctx.drawImage(
        canvas,
        0, yPosition,              // source: start at current Y offset
        canvasWidth, sliceHeight,  // source: read this many pixels
        0, 0,                      // destination: top-left of slice canvas
        canvasWidth, sliceHeight   // destination: same dimensions
      );

      // Convert slice to base64 JPEG (0.92 quality — good balance size/quality)
      const sliceImgData = sliceCanvas.toDataURL("image/jpeg", 0.92);

      // First page already exists; add a new blank page for subsequent slices
      if (pageIndex > 0) {
        pdf.addPage();
        // No header offset on continuation pages
        pdf.addImage(sliceImgData, "JPEG", 0, 0, A4_WIDTH_MM, sliceHeight * ratio);
      } else {
        // First page: offset image below the text header
        pdf.addImage(
          sliceImgData,
          "JPEG",
          0,
          headerHeightMM,           // push down below title text
          A4_WIDTH_MM,
          sliceHeight * ratio
        );
      }

      yPosition += sliceHeight;
      pageIndex++;
    }

    // ── Step 12: Add page numbers at bottom of each page ──────────────────────
    const totalPages = pdf.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      pdf.setFontSize(9);
      pdf.setTextColor(160, 160, 160);
      pdf.text(`Page ${i} of ${totalPages}`, A4_WIDTH_MM / 2, A4_HEIGHT_MM - 6, { align: "center" });
    }

    // ── Step 13: Build filename and trigger browser download ──────────────────
    // Format: "PlanMySafar_Dehradun_3Days.pdf"
    const fileCity = cityName.replace(/\s+/g, "_");
    const filename = `PlanMySafar_${fileCity}_${days}Days.pdf`;

    pdf.save(filename);
    showToast(`✅ Downloaded: ${filename}`, "success");

  } catch (err) {
    // Catches html2canvas CORS failures, jsPDF errors, canvas errors etc.
    console.error("[PDF] Generation failed:", err);
    showToast("Failed to generate PDF. Please try again.", "error");

  } finally {
    // Always reset button — runs whether PDF succeeded or failed
    btn.innerHTML    = originalText;
    btn.disabled     = false;
    btn.style.opacity = "1";
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// applyPdfStyles()
//
// Temporarily forces white background + dark text on the day cards container
// and each child card so the PDF screenshot looks clean on white paper.
//
// Returns an "overrides" object so restorePdfStyles() can undo everything.
// ─────────────────────────────────────────────────────────────────────────────
function applyPdfStyles(container) {
  // Save container original styles
  const containerOriginal = {
    background : container.style.background,
    color      : container.style.color,
    padding    : container.style.padding,
  };

  container.style.background = "#ffffff";
  container.style.color      = "#1a1a1a";
  container.style.padding    = "20px";

  // Save and override each day-card inside
  const cards = container.querySelectorAll(".day-card");
  const cardOriginals = [];

  cards.forEach((card, i) => {
    cardOriginals[i] = {
      background : card.style.background,
      color      : card.style.color,
      border     : card.style.border,
      boxShadow  : card.style.boxShadow,
    };
    card.style.background = "#f7f7f7";
    card.style.color      = "#1a1a1a";
    card.style.border     = "1px solid #e0e0e0";
    card.style.boxShadow  = "none";
  });

  // Save and override place titles and details
  const titles = container.querySelectorAll(".place-title, .day-header h3, .place-details");
  const titleOriginals = [];

  titles.forEach((el, i) => {
    titleOriginals[i] = { color: el.style.color };
    el.style.color = "#1a1a1a";
  });

  return { containerOriginal, cards, cardOriginals, titles, titleOriginals };
}

// ─────────────────────────────────────────────────────────────────────────────
// restorePdfStyles()
//
// Restores all styles changed by applyPdfStyles() after screenshot is done.
// ─────────────────────────────────────────────────────────────────────────────
function restorePdfStyles({ containerOriginal, cards, cardOriginals, titles, titleOriginals }, container) {
  // Restore container
  if (container) {
    container.style.background = containerOriginal.background;
    container.style.color      = containerOriginal.color;
    container.style.padding    = containerOriginal.padding;
  }

  // Restore each card
  cards.forEach((card, i) => {
    card.style.background = cardOriginals[i].background;
    card.style.color      = cardOriginals[i].color;
    card.style.border     = cardOriginals[i].border;
    card.style.boxShadow  = cardOriginals[i].boxShadow;
  });

  // Restore each title/detail
  titles.forEach((el, i) => {
    el.style.color = titleOriginals[i].color;
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// showToast()
//
// Lightweight toast notification — no external library needed.
// Shows a small pill at the bottom of the screen, fades out after 3 seconds.
// ─────────────────────────────────────────────────────────────────────────────
function showToast(message, type = "success") {
  // Remove any existing toast to avoid stacking
  const existing = document.getElementById("pdf-toast");
  if (existing) existing.remove();

  const toast = document.createElement("div");
  toast.id = "pdf-toast";

  toast.style.cssText = `
    position: fixed;
    bottom: 32px;
    left: 50%;
    transform: translateX(-50%);
    background: ${type === "success" ? "#1D9E75" : "#E24B4A"};
    color: #ffffff;
    padding: 12px 28px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    z-index: 99999;
    box-shadow: 0 4px 24px rgba(0,0,0,0.25);
    opacity: 1;
    transition: opacity 0.4s ease;
    white-space: nowrap;
  `;

  toast.innerText = message;
  document.body.appendChild(toast);

  // Fade out after 3s, then remove from DOM
  setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => toast.remove(), 400);
  }, 3000);
}