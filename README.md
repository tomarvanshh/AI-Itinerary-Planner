# 🌍 AI Itinerary Planner

**AI Itinerary Planner** is a lightweight Flask + static frontend project that helps you explore, plan, and estimate travel between cities. It includes city search (Mapbox), distance calculation, and transport recommendations based on distance, days and budget — a great starting point for an intelligent trip planner.

## ✨ Interactive demo (local)

1. Create and activate a virtual environment:
   - Windows (PowerShell): `python -m venv venv; venv\Scripts\Activate.ps1`
2. Install dependencies:
   - `pip install -r requirements.txt`
3. Run the backend (from the `src` folder):
   - `flask run` or `python src/app.py`
4. Open the frontend UI:
   - Open `src/frontend/index.html` in your browser (or serve the `src/frontend` folder with a static server).

> Note: The backend uses Mapbox for city search. To avoid hitting limits or exposing a key, set `MAPBOX_TOKEN` as an environment variable instead of leaving it in the code.

---

## 🚀 What you can try

- Search for cities using the autocomplete (country restricted to India by default).
- Pick **source** and **destination** and set **days**, **budget**, and **preferences**.
- Click **Generate Itinerary** to get the computed distance and transport recommendations.

---

## 🧭 API reference

- **GET** `/api/search-city?q=<query>`

  - Returns Mapbox place suggestions. Example:
    - `GET http://127.0.0.1:5000/api/search-city?q=delhi`

- **POST** `/api/distance`

  - Body: `{ "source": { "lat": 12.97, "lon": 77.59 }, "destination": { "lat": 28.61, "lon": 77.20 } }`
  - Response: `{ "distance_km": 1743.21 }`

- **POST** `/api/transport`
  - Body: `{ "distance_km": 1743.21, "days": 3, "budget": 50000 }`
  - Response: `{ "recommended": "Flight", "options": [ ... ] }`

Examples (curl):

```bash
curl "http://127.0.0.1:5000/api/search-city?q=mumbai"
curl -X POST -H "Content-Type: application/json" -d '{"source":{"lat":12.97,"lon":77.59},"destination":{"lat":28.61,"lon":77.20}}' http://127.0.0.1:5000/api/distance
```

---

## ✨ Creative features & roadmap

This project is built as a solid foundation and has room to grow. Suggested and planned features:

- Day-by-day itinerary generation (AI-assisted suggestions for activities and timings)
- Multi-city trip planning and route optimization 🔁
- Smart budgeting and accommodation suggestions based on preferences 💸
- Export to PDF / shareable link / printable itinerary 📄
- Map visualizations with pins and routes (Mapbox/Leaflet) 🗺️
- User profiles, saved trips, and collaboration ✨
- Integrations: booking APIs, local events feed, and GPT-powered activity suggestions 🤖

---

## 🛠 Development notes

- The backend is a Flask app (`src/app.py`) exposing the APIs above. CORS is enabled for the static frontend.
- Mapbox token is currently set in `app.py`; consider using an environment variable named `MAPBOX_TOKEN`:

```powershell
$env:MAPBOX_TOKEN = "your_token_here"
flask run
```

- To add tests or CI, consider a basic GitHub Actions workflow that runs linting and unit tests on push.

---

## 🤝 Contributing

Contributions are welcome! Please open an issue for feature requests or bugs, then submit a pull request with a clear description of the change.

---

## 📞 Contact & Credits

Created by **tomarvanshh** — feel free to open issues or reach out on GitHub.

---

Enjoy planning smarter trips — and let me know which feature you'd like implemented next (itinerary generation, PDF export, or GPT-powered suggestions)! 🚀
