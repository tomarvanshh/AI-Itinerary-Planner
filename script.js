const API_MODEL = "gemini-2.5-flash-preview-09-2025";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${API_MODEL}:generateContent`;
let API_KEY = null;
const MAX_RETRIES = 5;

// Load API key from config.json (for GitHub Pages deployment)
async function loadConfig() {
  try {
    const response = await fetch("config.json");
    const config = await response.json();
    API_KEY = config.apiKey;
  } catch (error) {
    console.error("Failed to load config:", error);
    displayError("Configuration error: Unable to load API configuration.");
  }
}

// DOM Elements
const form = document.getElementById("itineraryForm");
const outputContainer = document.getElementById("outputContainer");
const loading = document.getElementById("loading");
const summaryCard = document.getElementById("summaryCard");
const summaryText = document.getElementById("summaryText");
const budgetText = document.getElementById("budgetText");
const dailyPlanContainer = document.getElementById("dailyPlanContainer");
const generateButton = document.getElementById("generateButton");
const errorBox = document.getElementById("errorBox");
const errorMessage = document.getElementById("errorMessage");

// JSON Schema for Structured Output
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
                  description: "Name of the place or activity.",
                },
                details: {
                  type: "STRING",
                  description:
                    "Short description of the activity and budget advice (e.g., 'Entry fee is $20. Book in advance.').",
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
        "A final estimation of the total per-person budget for the specified number of days, considering the user's budget level. Must include currency.",
    },
  },
  required: ["tripSummary", "dailyPlan", "budgetEstimate"],
};

// --- Utility Functions ---

async function fetchWithExponentialBackoff(fn) {
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === MAX_RETRIES - 1) throw error;
      const delay = Math.pow(2, attempt) * 1000;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

function startLoading() {
  outputContainer.classList.remove("hidden");
  dailyPlanContainer.innerHTML = "";
  summaryCard.classList.add("hidden");
  errorBox.classList.add("hidden");
  loading.classList.remove("hidden");
  generateButton.disabled = true;
  generateButton.innerHTML = "Planning...";
}

function stopLoading() {
  loading.classList.add("hidden");
  generateButton.disabled = false;
  generateButton.innerHTML = "Generate Itinerary";
}

function displayError(message) {
  errorBox.classList.remove("hidden");
  errorMessage.textContent = message;
  summaryCard.classList.add("hidden");
}

function renderItinerary(itineraryData) {
  dailyPlanContainer.innerHTML = "";

  // Summary
  summaryText.textContent = itineraryData.tripSummary;
  budgetText.textContent = `Estimated Budget: ${itineraryData.budgetEstimate}`;
  summaryCard.classList.remove("hidden");

  // Daily Plans
  itineraryData.dailyPlan.forEach((dayPlan) => {
    const dayCard = document.createElement("div");
    dayCard.className =
      "bg-white p-6 rounded-xl shadow-lg border-t-4 border-primary-blue/70 transition duration-300 hover:shadow-xl";

    const activitiesHtml = dayPlan.activities
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

// --- Main AI Logic ---

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  // Ensure API key is loaded
  if (!API_KEY) {
    displayError("API key not configured. Please check your config.json file.");
    return;
  }

  startLoading();

  const destination = document.getElementById("destination").value;
  const days = document.getElementById("days").value;
  const budget = document.getElementById("budget").value;
  const preferences = document.getElementById("preferences").value;

  const systemPrompt = `
You are an expert, world-class travel planner AI agent.
Generate a detailed, day-by-day itinerary in a strictly structured JSON format.

User inputs:
- Destination: ${destination}
- Days: ${days}
- Budget level: ${budget}
- Preferences: ${preferences}

Strict rules:
1. The response MUST be valid JSON conforming exactly to the provided JSON Schema. Do not include any text, markdown, or commentary outside the JSON object.
2. The itinerary must cover exactly ${days} days.
3. Tailor activities, food, and accommodation style to the "${budget}" budget level.
4. Incorporate the user's specific interests ("${preferences}").

Generate the itinerary now.
`.trim();

  const payload = {
    contents: [
      {
        role: "user",
        parts: [{ text: systemPrompt }],
      },
    ],
    generationConfig: {
      // ✅ Correct field names for REST API
      responseMimeType: "application/json",
      responseSchema: ITINERARY_SCHEMA,
    },
  };

  try {
    const finalApiUrl = `${API_URL}?key=${API_KEY}`;

    const response = await fetchWithExponentialBackoff(() =>
      fetch(finalApiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })
    );

    const result = await response.json();
    console.log("Gemini raw result:", result);

    if (!response.ok) {
      throw new Error(
        result.error?.message ||
          `API call failed with status: ${response.status}`
      );
    }

    const candidate = result.candidates?.[0];
    const jsonString = candidate?.content?.parts?.[0]?.text;

    if (!jsonString) {
      console.error("Missing JSON string in response:", result);
      throw new Error(
        "AI failed to generate a complete itinerary (JSON output missing)."
      );
    }

    let itineraryData;
    try {
      itineraryData = JSON.parse(jsonString);
    } catch (err) {
      console.error("JSON parsing failed. Raw model text:", jsonString);
      throw new Error(
        "Model returned invalid JSON. Check the console to see the raw response."
      );
    }

    renderItinerary(itineraryData);
  } catch (error) {
    console.error("Itinerary Generation Failed:", error);
    displayError(
      `Itinerary generation failed: ${error.message}. Open DevTools → Console to see more details.`
    );
  } finally {
    stopLoading();
  }
});
