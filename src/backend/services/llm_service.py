import time
import json
import os
import google.generativeai as genai
from flask import current_app
from dotenv import load_dotenv

load_dotenv()


def generate_city_summary(city_name):
    """
    Generates a structured overview of the destination city using Gemini.
    """
    print(f"Inside generate_city_summary for {city_name}")
    try:
        # Fetch the key directly from the environment
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            print("Gemini Error: GEMINI_API_KEY not found in environment.")
            return f"Welcome to {city_name}! Enjoy your exploration."

        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-3.1-flash-lite') # cite: README.md

        # Precise prompt to control line counts as requested
        prompt = f"""
        Provide a travel overview for {city_name}, India in exactly three sections:
        Start each section title with a relevant emoji.
        1. "Exploring": 3-4 lines about the vibe and exploration.
        2. "Famous For": 2-3 lines about unique landmarks or specialties.
        3. "Best Time to Visit": 2-3 lines about seasonal advice.
        Keep the tone professional and inviting. Do not use bold markdown.
        """

        response = model.generate_content(prompt)
        return response.text.strip() if response.text else "Overview currently unavailable."

    except Exception as e:
        print(f"Gemini Summary Error: {e}")
        # Fallback text so the app doesn't crash if the AI fails
        return f"Welcome to {city_name}! Explore the local culture and landmarks at your own pace."