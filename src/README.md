# PlanMySafar 🧭
### AI-Powered Travel Itinerary Planner for India

[![Python](https://img.shields.io/badge/Python-3.11-blue?logo=python)](https://python.org)
[![Flask](https://img.shields.io/badge/Flask-3.1.0-black?logo=flask)](https://flask.palletsprojects.com)
[![NLP](https://img.shields.io/badge/NLP-sentence--transformers-orange)](https://www.sbert.net)
[![Google Places](https://img.shields.io/badge/API-Google%20Places%20v2-green?logo=google)](https://developers.google.com/maps/documentation/places/web-service)
[![Mapbox](https://img.shields.io/badge/API-Mapbox-purple?logo=mapbox)](https://mapbox.com)

PlanMySafar is a full-stack AI travel planner that generates personalized day-by-day itineraries for any city in India. It combines **custom machine learning algorithms**, **NLP-based preference matching**, **real-time geospatial data**, and **multi-API orchestration** to produce smart, budget-aware travel plans — complete with hotels, restaurants, and transport recommendations.

---

## Table of Contents

- [Live Demo](#live-demo)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Architecture](#project-architecture)
- [Core Algorithms & Logic](#core-algorithms--logic)
- [API Integrations](#api-integrations)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [How It Works — End to End](#how-it-works--end-to-end)
- [What Makes This Project Stand Out](#what-makes-this-project-stand-out)

---

## Live Demo

> Coming soon — deployment in progress on Render + Vercel.

---

## Features

- **AI Itinerary Generation** — Personalized day-wise travel plans based on user preferences using NLP semantic similarity
- **Custom K-Means Clustering** — Groups nearby attractions geographically to minimize intra-day travel time
- **Smart Transport Recommendations** — Budget-aware flight, train, and bus suggestions with per-head pricing
- **Real Hotel Discovery** — Fetches live hotel data from Google Places API v2 with photos and ratings
- **Restaurant Insertion** — Automatically inserts the best-scored lunch and dinner options at logical midpoints in each day
- **Haversine Distance Engine** — Calculates real geographic distances between places using the Haversine formula
- **City Autocomplete** — Debounced Mapbox geocoding for fast, accurate city search across India
- **Budget Intelligence** — Allocates budget across transport (30%), food (20%), and remaining categories automatically
- **Gemini AI Integration** — Optional LLM refinement of itineraries via Google Gemini (configurable)

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Backend Framework** | Flask 3.1 (Python 3.11) |
| **NLP / Embeddings** | sentence-transformers (`all-MiniLM-L6-v2`) |
| **Similarity Scoring** | scikit-learn cosine similarity |
| **Geospatial** | Custom Haversine formula, Mapbox Geocoding API |
| **Places & Hotels** | Google Places API v2 (New) |
| **AI Refinement** | Google Gemini (`gemini-2.5-flash`) |
| **Frontend** | Vanilla JS (ES Modules), HTML5, CSS3 |
| **CORS** | flask-cors |
| **Environment** | python-dotenv |
| **Production Server** | Gunicorn |

---

## Project Architecture

```
PlanMySafar
│
├── src/
│   ├── run.py                          # App entry point
│   │
│   ├── backend/
│   │   ├── __init__.py                 # App factory, CORS, Blueprint registration
│   │   ├── config.py                   # Environment config, API key validation
│   │   │
│   │   ├── routes/                     # Flask Blueprints (API layer)
│   │   │   ├── city_routes.py          # GET  /api/search-city
│   │   │   ├── places_routes.py        # POST /api/places, /api/hotels, /api/restaurants
│   │   │   ├── transport_routes.py     # POST /api/transport, /api/distance
│   │   │   └── itinerary_routes.py     # POST /api/generate-itinerary
│   │   │
│   │   ├── services/                   # Business logic layer
│   │   │   ├── itinerary_service.py    # Core orchestration — builds day plans
│   │   │   ├── clustering_service.py   # Custom K-Means geographic clustering
│   │   │   ├── distance_service.py     # Haversine distance calculation
│   │   │   ├── semantic_service.py     # NLP embedding + cosine similarity
│   │   │   ├── places_service.py       # Google Places API integration
│   │   │   ├── hotel_service.py        # Hotel fetching + photo proxy
│   │   │   ├── restaurant_service.py   # Restaurant fetching + scoring
│   │   │   ├── transport_service.py    # Transport options + budget recommendation
│   │   │   └── llm_service.py          # Gemini AI itinerary refinement
│   │   │
│   │   └── state/
│   │       └── trip_state.py           # Server-side trip state (transport lock)
│   │
│   └── frontend/
│       ├── index.html                  # Single page application shell
│       ├── style.css                   # All styles
│       └── js/
│           ├── config.js               # BASE_URL — single place to change for deployment
│           ├── main.js                 # App orchestration, form submission handler
│           ├── state.js                # Shared frontend state (selected cities, transport)
│           ├── api.js                  # All fetch() calls to backend
│           ├── city.js                 # Mapbox autocomplete with debounce
│           ├── transport.js            # Transport card rendering + selection
│           ├── hotel.js                # Hotel grid rendering + selection
│           ├── itinerary.js            # Places fetching
│           ├── itinerary-ui.js         # Itinerary rendering
│           └── preferences.js          # Tag-based preference input
│
├── requirements.txt
└── .env.example
```

---

## Core Algorithms & Logic

### 1. Haversine Distance Formula (`distance_service.py`)

To calculate accurate geographic distances between two coordinates on Earth's curved surface, the project uses a hand-implemented Haversine formula — not a library call.

```
a = sin²(Δlat/2) + cos(lat1) × cos(lat2) × sin²(Δlon/2)
c = 2 × atan2(√a, √(1−a))
distance = R × c        (R = 6371 km)
```

This is used in three places: calculating source-to-destination distance for transport, measuring travel time between attractions within a day, and sorting fallback places by proximity.

---

### 2. NLP Semantic Preference Matching (`semantic_service.py`)

User preferences (e.g. "mountains", "temples", "street food") are matched against place names and tags using **sentence embeddings** and **cosine similarity** — not keyword matching.

```
1. User preferences → joined into a single text string
2. Encode with SentenceTransformer("all-MiniLM-L6-v2") → 384-dim embedding vector
3. Each place name + tags → encoded into embedding vector
4. Cosine similarity computed between user vector and each place vector
5. Places scored 0.0 → 1.0 and sorted by relevance
6. Places with score < 0.2 are filtered out (configurable threshold)
```

This means a user who types "adventure" will rank "Rishikesh Rafting" above "City Museum" even if neither contains the exact word — because the model understands semantic meaning.

---

### 3. Custom K-Means Geographic Clustering (`clustering_service.py`)

To group attractions by geographic proximity (so each day of travel stays in one area), the project implements K-Means clustering from scratch using latitude/longitude as feature dimensions — **no sklearn** used for this.

```
1. k = number of days requested
2. Randomly initialize k centroids from the place list
3. For 8 iterations:
   a. Assign each place to nearest centroid (Haversine distance)
   b. Recompute centroid as mean lat/lon of all places in cluster
4. Each cluster becomes one day's attraction pool
```

Why from scratch? sklearn's KMeans uses Euclidean distance which distorts at geographic scale. Using Haversine inside the custom implementation gives more accurate geographic groupings.

---

### 4. Day Plan Construction (`itinerary_service.py`)

Each day is built with a constraint-satisfaction approach:

```
For each cluster (day):
  total_time = 0
  previous_place = selected_hotel   ← travel originates from hotel

  For each place (sorted by semantic_score + rating):
    travel_time = haversine(previous, place) / 15 km/h
    place_time  = place.avg_time_hr

    IF total_time + travel_time + place_time ≤ 8 hours
    AND len(day_plan) < 6:
      Add place to day plan
      total_time += travel_time + place_time
      previous_place = place

  Insert LUNCH at midpoint of day plan
  Insert DINNER near last place of day
```

The 15 km/h speed constant accounts for Indian city traffic. The 8-hour cap prevents physically exhausting itineraries.

---

### 5. Restaurant Scoring (`restaurant_service.py`)

Restaurants are not chosen randomly — they are scored across multiple dimensions:

```
score = (rating × 2)
      + meal_suitability_bonus   (serves lunch / serves dinner: +3)
      + reservable_bonus          (+1)
      + has_website_bonus         (+1)
```

The highest-scoring restaurant within a 2km radius is selected for lunch and within 1.5km for dinner.

---

### 6. Budget Allocation Engine (`transport_service.py`)

The total budget is automatically split across categories:

```
Transport budget  = total_budget × 0.30   (30%)
Food budget       = total_budget × 0.20   (20%)
  └ Per day       = food_budget / days
  └ Per meal      = per_day / 2

Transport recommendation = option whose total_price
                           is closest to transport_budget
```

If no transport option fits within the allocated budget, the user is warned with the minimum required total budget.

---

## API Integrations

| API | Used For | Endpoint |
|---|---|---|
| **Mapbox Geocoding v5** | City search autocomplete | `GET /api/search-city` |
| **Google Places API v2** | Tourist attractions, hotels | `POST /api/places`, `/api/hotels` |
| **Google Places API v2** | Restaurants near attractions | `POST /api/restaurants` |
| **Google Gemini** | Optional LLM itinerary refinement | Internal — `llm_service.py` |

### Google Places API v2 (New)
This project uses the **new** Google Places API (`places.googleapis.com/v1/`) with the `X-Goog-FieldMask` header for efficient field selection, and pulls `generativeSummary` and `reviewSummary` — AI-generated descriptions of each place — directly from the API response.

---

## Project Structure

```
routes/          → Thin API layer. Validates input, calls services, returns JSON.
services/        → All business logic. No Flask imports except where needed.
state/           → Minimal server-side state for transport locking.
frontend/js/     → ES Module architecture. Each file has a single responsibility.
```

**Design principles followed:**
- Separation of concerns — routes never contain business logic
- Service layer is independently testable
- Single source of truth for API base URL (`config.js`)
- Environment-based configuration for all secrets and origins

---

## Getting Started

### Prerequisites

- Python 3.11 (recommended — ML packages not yet compatible with 3.14+)
- Node.js not required (pure Vanilla JS frontend)
- VS Code with Live Server extension (for frontend)
- API keys for: Google Places, Mapbox, Google Gemini

---

### Step 1 — Fork & Clone

```bash
# Fork the repo on GitHub, then clone your fork
git clone https://github.com/YOUR_USERNAME/PlanMySafar.git
cd PlanMySafar
```

---

### Step 2 — Create Virtual Environment

```bash
# Create venv with Python 3.11 explicitly
py -3.11 -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Activate (Mac/Linux)
source venv/bin/activate
```

---

### Step 3 — Install Dependencies

```bash
pip install -r requirements.txt
```

> **Note:** `sentence-transformers` will download the `all-MiniLM-L6-v2` model (~80MB) on first run. This is expected.

---

### Step 4 — Configure Environment Variables

```bash
# Copy the example env file
cp .env.example .env
```

Open `.env` and fill in your API keys:

```dotenv
GOOGLE_PLACES_API_KEY=your_google_places_key_here
GOOGLE_MAPS_RESTAURANT_API_KEY=your_google_maps_key_here
MAPBOX_TOKEN=your_mapbox_token_here
GEMINI_API_KEY=your_gemini_key_here
```

**How to get each key:**
- **Google Places** — [Google Cloud Console](https://console.cloud.google.com) → Enable "Places API (New)"
- **Mapbox** — [mapbox.com](https://mapbox.com) → Account → Access Tokens
- **Gemini** — [Google AI Studio](https://aistudio.google.com) → Get API Key

---

### Step 5 — Run the Backend

```bash
cd src
python run.py
```

You should see:
```
 * Running on http://127.0.0.1:5000
 * Debug mode: on
```

---

### Step 6 — Run the Frontend

Open `src/frontend/index.html` with **VS Code Live Server** (right-click → Open with Live Server).

The frontend will be available at `http://127.0.0.1:5500`.

---

### Step 7 — Use the App

1. Type a source city (e.g. Delhi) and select from autocomplete
2. Type a destination city (e.g. Manali) and select from autocomplete
3. Enter number of days, budget, adults, and travel preferences
4. Click **Proceed** — transport options and hotel list will appear
5. Select a transport option, then select a hotel
6. Click **Confirm Hotel** — your AI itinerary will be generated

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `GOOGLE_PLACES_API_KEY` | Yes | For fetching attractions and hotels |
| `GOOGLE_MAPS_RESTAURANT_API_KEY` | Yes | For fetching restaurants (can be same key) |
| `MAPBOX_TOKEN` | Yes | For city autocomplete search |
| `GEMINI_API_KEY` | Yes | For Gemini LLM itinerary refinement |
| `ALLOWED_ORIGINS` | No | Comma-separated frontend URLs (production only) |

> Do **not** set `ALLOWED_ORIGINS` in local development. The backend defaults to allowing `http://127.0.0.1:5500` automatically.

---

## How It Works — End to End

```
User fills form
      │
      ▼
Frontend (main.js)
      │
      ├── fetchDistance()          → POST /api/distance
      │         └── Haversine formula → returns km
      │
      ├── fetchTransport()         → POST /api/transport
      │         └── Budget allocation → scored options → recommended flag
      │
      ├── fetchDestinationPlaces() → POST /api/places
      │         └── Google Places API v2 → attractions list
      │
      └── showHotelOptions()       → POST /api/hotels
                └── Google Places API v2 → hotel list with photos

User selects hotel
      │
      ▼
fetchItinerary()                   → POST /api/generate-itinerary
      │
      ├── compute_similarity()     → NLP: rank places by user preferences
      ├── kmeans_cluster_places()  → Group places by geography (one cluster = one day)
      │
      └── For each cluster (day):
            ├── Sort by semantic_score + rating
            ├── Add places within 8hr constraint (Haversine travel time)
            ├── fetch_nearby_restaurants() → Insert lunch at midpoint
            ├── fetch_nearby_restaurants() → Insert dinner at end
            └── Return day object {day, total_hours, places[]}
      │
      ▼
refine_itinerary()                 → Gemini LLM (optional polish)
      │
      ▼
renderItinerary()                  → Frontend renders day cards with photos
```

---

## What Makes This Project Stand Out

| Feature | Why It Matters |
|---|---|
| **Custom K-Means with Haversine** | Most projects use sklearn. Implementing from scratch with geographic distance shows algorithm fundamentals. |
| **NLP Semantic Matching** | Preference matching via embeddings, not keyword search — real ML, not fake AI. |
| **Multi-API Orchestration** | 4 external APIs coordinated in a single request pipeline — real integration complexity. |
| **Budget Intelligence** | Automatic allocation across transport, food, and accommodation — product thinking, not just coding. |
| **Modular Architecture** | Clean separation of routes, services, and state — production-grade code organization. |
| **ES Module Frontend** | No framework needed — demonstrates deep JS fundamentals with proper module architecture. |

---

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

---

## License

MIT License — see `LICENSE` for details.

---

*Built with ❤️ for travelers across India*
