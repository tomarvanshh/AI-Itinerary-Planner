# import time
# import json
# import os
# from google import genai


# def get_client():
#     api_key = os.getenv("GEMINI_API_KEY")
#     return genai.Client(api_key=api_key)


# def refine_itinerary(raw_itinerary, preferences):
#     client = get_client()

#     prompt = f"""
# You are a professional travel planner.

# Improve the following itinerary.

# Rules:
# - Keep same places
# - Do NOT add/remove places
# - Keep 8 hour/day limit
# - Return ONLY valid JSON

# User Preferences: {preferences}

# Raw Itinerary:
# {json.dumps(raw_itinerary)}
# """

#     retries = 3

#     for attempt in range(retries):
#         try:
#             response = client.models.generate_content(
#                 model="models/gemini-2.5-flash",
#                 contents=prompt
#             )

#             return json.loads(response.text)

#         except Exception as e:
#             print(f"Gemini error (attempt {attempt+1}):", e)

#             if attempt < retries - 1:
#                 time.sleep(1)  # sleep for 1 second before retrying
#             else:
#                 print("Fallback: returning raw itinerary")
#                 return raw_itinerary
import time
import json
import os
from google import genai
from google.genai import errors # Import for specific error handling

def get_client():
    # It's better to initialize the client once outside the function 
    # to avoid repeated connection overhead
    api_key = os.getenv("GEMINI_API_KEY")
    return genai.Client(api_key=api_key)

def refine_itinerary(raw_itinerary, preferences):
    """
    For now this function is blank later we will add a gemini AI service to enhance the itinerary with generative summaries and review summaries for each place.
    """


    # client = get_client()
    
    # # Pro-tip: Use System Instructions for better JSON reliability
    # prompt = f"""
    # Improve the following travel itinerary based on these preferences: {preferences}.
    # Rules:
    # - Keep the same places.
    # - Do NOT add/remove places.
    # - Maintain an 8-hour per day limit.
    # - Return ONLY valid JSON matching the input structure.
    
    # Raw Itinerary: {json.dumps(raw_itinerary)}
    # """

   
    # try:
    #     # Added config to enforce JSON output if the model supports it
    #     response = client.models.generate_content(
    #     model="gemini-2.5-flash", 
    #     contents=prompt,
    #     config={'response_mime_type': 'application/json'} # Forces JSON mode
    #     )

    #     # Use response.parsed if using the newest SDK, 
    #     # otherwise handle text cleaning
    #     return json.loads(response.text)

    # except Exception as e:
    #     # Check for 503 or 429 specifically
    #     print(f"Gemini error {e}")
    #     print("Falling back to raw itinerary.")
    return raw_itinerary