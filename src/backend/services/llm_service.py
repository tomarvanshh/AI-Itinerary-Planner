import os
import json
from google import genai

def get_client():
    api_key = os.getenv("GEMINI_API_KEY")

    if not api_key:
        raise ValueError("GEMINI_API_KEY not found in environment variables")

    return genai.Client(api_key=api_key)


def refine_itinerary(raw_itinerary, preferences):
    client = get_client()
    prompt = f"""
You are a professional travel planner.

Improve the following itinerary.

Rules:
- Keep same places
- Do NOT add new places
- Do NOT remove places
- Keep 8 hour per day limit
- Improve flow & sequencing
- Return ONLY valid JSON

User Preferences: {preferences}

Raw Itinerary:
{json.dumps(raw_itinerary, indent=2)}
"""

    response = client.models.generate_content(
        model="models/gemini-2.5-flash",
        contents=prompt
    )

    try:
        refined = json.loads(response.text)
        return refined
    except Exception:
        return raw_itinerary
