// --- API Endpoints ---
const PYTHON_ML_API_URL = "http://localhost:5000/api/rank_pois";
const PYTHON_CITIES_API_URL = "http://localhost:5000/api/cities"; // NEW: Endpoint to get city list

// Gemini API endpoint (for final generation)
const GEMINI_MODEL = "gemini-2.5-flash-preview-09-2025";
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
// FIX: For local testing, insert your actual API Key here.
const API_KEY = "AIzaSyA7Vf7deMNvcKBcqvNQ4XySdnWHoJKcHzU"; // Replace with your actual key for local testing. Leave empty for Canvas environment.

// --- Global State ---
let VALID_CITIES = []; // Stores the list of valid cities fetched from Python

// --- DOM Elements ---
const form = document.getElementById("itineraryForm");
const destinationInput = document.getElementById("destination");
const outputContainer = document.getElementById("outputContainer");
const loading = document.getElementById("loading");
const loadingStage = document.getElementById("loadingStage");
const summaryCard = document.getElementById("summaryCard");
const summaryText = document.getElementById("summaryText");
const budgetText = document.getElementById("budgetText");
const dailyPlanContainer = document.getElementById("dailyPlanContainer");
const generateButton = document.getElementById("generateButton");
const errorBox = document.getElementById("errorBox");
const errorMessage = document.getElementById("errorMessage");

// Custom element for validation feedback
const cityError = document.createElement("div");
cityError.className = "text-red-600 text-sm mt-1 font-medium hidden";
cityError.id = "cityError";
// Insert the error element right below the destination input
destinationInput.parentNode.appendChild(cityError);

// JSON Schema for Structured Output (Crucial for the AI integration)
const ITINERARY_SCHEMA = {
  type: "OBJECT",
  properties: {
    tripSummary: {
      type: "STRING",
      description:
        "A 1-2 sentence compelling summary of the recommended trip plan and theme based on the user's inputs.",
    },
    dailyPlan: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          day: {
            type: "STRING",
            description:
              "The title of the day, e.g., Day 1: Arrival and City Center Exploration",
          },
          theme: {
            type: "STRING",
            description:
              "The theme of the day, e.g., History and Architecture or Nature Hike.",
          },
          activities: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                time: {
                  type: "STRING",
                  description: "Time slot, e.g., 9:00 AM or Morning",
                },
                name: {
                  type: "STRING",
                  description:
                    "Name of the place or activity. MUST be one of the provided POIs.",
                },
                details: {
                  type: "STRING",
                  description:
                    "Short description of the activity, budget advice, and relevance to the Uttarakhand dataset.",
                },
              },
              required: ["time", "name", "details"],
            },
          },
        },
        required: ["day", "theme", "activities"],
      },
    },
    budgetEstimate: {
      type: "STRING",
      description:
        "A final estimation of the total per-person budget for the specified number of days, considering the user's budget level. Must include INR currency.",
    },
  },
  required: ["tripSummary", "dailyPlan", "budgetEstimate"],
};

// --- Autocomplete and Validation Logic ---

async function fetchCitiesAndSetupAutocomplete() {
  try {
    const response = await fetch(PYTHON_CITIES_API_URL);
    if (!response.ok) {
      throw new Error("Could not connect to backend to load city list.");
    }
    const data = await response.json();
    VALID_CITIES = data.cities || [];
    console.log(`Loaded ${VALID_CITIES.length} unique cities for validation.`);
    setupAutocomplete(VALID_CITIES);
  } catch (error) {
    console.error("Critical: Could not fetch city list.", error);
    destinationInput.placeholder = "Error: City list unavailable.";
    cityError.textContent = `CRITICAL: City validation failed. Please ensure 'api.py' is running.`;
    cityError.classList.remove("hidden");
  }
}

function setupAutocomplete(cities) {
  const list = document.createElement("datalist");
  list.id = "citySuggestions";
  cities.forEach((city) => {
    const option = document.createElement("option");
    option.value = city;
    list.appendChild(option);
  });
  // Link the datalist to the destination input
  destinationInput.setAttribute("list", "citySuggestions");
  document.body.appendChild(list);

  // Initial validation check setup
  destinationInput.addEventListener("input", validateCityInput);
  destinationInput.addEventListener("blur", validateCityInput);
}

function validateCityInput() {
  const value = destinationInput.value.trim();
  if (value === "") {
    cityError.classList.add("hidden");
    destinationInput.setCustomValidity("");
    return true;
  }

  // Check if the input exactly matches one of the valid cities (case-insensitive)
  const isValid = VALID_CITIES.some(
    (city) => city.toLowerCase() === value.toLowerCase()
  );

  if (isValid) {
    destinationInput.setCustomValidity("");
    cityError.classList.add("hidden");
    return true;
  } else {
    destinationInput.setCustomValidity(
      `Please select a valid city from the list.`
    );
    cityError.textContent = `Invalid city. Please enter a valid city in Uttarakhand from the suggestions.`;
    cityError.classList.remove("hidden");
    return false;
  }
}

// --- Utility Functions (Standard) ---

function startLoading(stageMessage) {
  outputContainer.classList.remove("hidden");
  dailyPlanContainer.innerHTML = "";
  summaryCard.classList.add("hidden");
  errorBox.classList.add("hidden");
  loading.classList.remove("hidden");
  generateButton.disabled = true;
  generateButton.innerHTML = "Planning...";
  loadingStage.textContent = stageMessage;
}

function stopLoading() {
  loading.classList.add("hidden");
  generateButton.disabled = false;
  generateButton.innerHTML = "Start Hybrid Planning";
}

function displayError(message) {
  errorBox.classList.remove("hidden");
  errorMessage.textContent = message;
  summaryCard.classList.add("hidden");
  loading.classList.add("hidden");
}

function renderItinerary(itineraryData) {
  dailyPlanContainer.innerHTML = "";
  summaryText.textContent = itineraryData.tripSummary;
  budgetText.textContent = `Estimated Budget: ${itineraryData.budgetEstimate}`;
  summaryCard.classList.remove("hidden");

  itineraryData.dailyPlan.forEach((dayPlan) => {
    const dayCard = document.createElement("div");
    dayCard.className =
      "bg-white p-6 rounded-xl shadow-lg border-t-4 border-primary-blue/70 transition duration-300 hover:shadow-xl";

    let activitiesHtml = dayPlan.activities
      .map(
        (activity) => `
            <li class="flex items-start space-x-3 py-2 border-b last:border-b-0">
                <span class="text-primary-blue font-semibold w-20 flex-shrink-0">${activity.time}</span>
                <div>
                    <p class="font-medium text-gray-900">${activity.name}</p>
                    <p class="text-sm text-gray-600">${activity.details}</p>
                </div>
            </li>
        `
      )
      .join("");

    dayCard.innerHTML = `
            <h3 class="text-2xl font-bold mb-2 text-primary-blue">${dayPlan.day}</h3>
            <p class="text-sm text-gray-500 italic mb-4">Theme: ${dayPlan.theme}</p>
            <ul class="divide-y divide-gray-100">
                ${activitiesHtml}
            </ul>
        `;
    dailyPlanContainer.appendChild(dayCard);
  });
}

// --- Main Hybrid Generation Logic ---

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  // 1. Frontend Validation Check
  if (!validateCityInput()) {
    return;
  }

  const destination = destinationInput.value;
  const days = document.getElementById("days").value;
  const budget = document.getElementById("budget").value;
  const preferences = document.getElementById("preferences").value;

  let contextForGemini = "";

  try {
    // ===========================================
    // STAGE 1: Custom Python ML/NLP (Preference Matching)
    // ===========================================
    startLoading("Stage 1: Running NLP/ML Preference Matcher...");

    const mlPayload = {
      preferences: preferences,
      destination: destination,
      days: days,
    };

    // Fetch call to your Python Flask server
    const mlResponse = await fetch(PYTHON_ML_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(mlPayload),
    });

    if (!mlResponse.ok) {
      const errorBody = await mlResponse.json().catch(() => ({}));

      // FIX 1: Check for the specific 400 status error message from Python
      if (mlResponse.status === 400 && errorBody.error) {
        // If Python returns a specific validation error (e.g., "Invalid Destination: ..."), show that error directly.
        throw new Error(`[Backend Validation] ${errorBody.error}`);
      }

      // Fallback for general Python server errors
      throw new Error(
        `ML Backend failed. Status ${mlResponse.status}. Details: ${
          errorBody.error || "Check Python server console."
        }`
      );
    }

    const mlResult = await mlResponse.json();
    contextForGemini = mlResult.context_for_gemini;

    if (!contextForGemini) {
      throw new Error(
        "ML model returned empty context. Check dataset or preference input."
      );
    }

    // ===========================================
    // STAGE 2: Generative AI (Structuring and Formatting)
    // ===========================================
    startLoading("Stage 2: Calling Gemini for Itinerary Structuring...");

    const systemPrompt = `You are an expert travel planner specializing in Uttarakhand, India. Your task is to generate a detailed, day-by-day itinerary strictly adhering to the user's constraints and the provided POI data.

        **Instructions:**
        1. The plan must be for ${days} days in ${destination}.
        2. The plan must align with the "${budget}" budget style.
        3. **CRITICAL:** Use ONLY the Points of Interest (POIs) provided in the context below. Do not suggest places outside this list.
        4. **CRITICAL NAME FIX:** For the 'name' field in the final JSON, you MUST replace the dataset's generic names (e.g., 'River Spot 145', 'City Spot 12') with a plausible, descriptive, and realistic name for a location in Uttarakhand (e.g., 'Triveni Ghat', 'Mall Road, Nainital'). The category (river, city, etc.) and city must match the POI details.
        5. The final output MUST be valid JSON conforming exactly to the provided JSON Schema.
        
        **POI Context:**
        ${contextForGemini}`;

    const geminiPayload = {
      contents: [{ parts: [{ text: systemPrompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: ITINERARY_SCHEMA,
      },
    };

    // Determine the final API URL
    const finalApiUrl = API_KEY
      ? `${GEMINI_API_URL}?key=${API_KEY}`
      : GEMINI_API_URL;

    const geminiResponse = await fetch(finalApiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(geminiPayload),
    });

    const geminiResult = await geminiResponse.json();

    if (!geminiResponse.ok) {
      throw new Error(
        geminiResult.error?.message ||
          `Gemini API call failed with status: ${geminiResponse.status}`
      );
    }

    const jsonString = geminiResult.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!jsonString) {
      throw new Error(
        "AI failed to generate a complete itinerary (JSON output missing)."
      );
    }

    // Parse and Render
    const itineraryData = JSON.parse(jsonString);
    renderItinerary(itineraryData);
  } catch (error) {
    console.error("Itinerary Generation Failed:", error);
    // FIX 2: Better error message handling
    let userErrorMessage = `Planning failed: ${error.message}`;

    if (error.message.includes("[Backend Validation]")) {
      userErrorMessage = error.message.replace(
        "[Backend Validation]",
        "Validation Failed:"
      );
    } else if (error.message.includes("ML Backend failed")) {
      userErrorMessage = `ML Backend (Python Server) connection failed. Please ensure 'python api.py' is running and accessible.`;
    }

    displayError(userErrorMessage);
  } finally {
    stopLoading();
  }
});

// Call initialization on page load
window.addEventListener("load", fetchCitiesAndSetupAutocomplete);
