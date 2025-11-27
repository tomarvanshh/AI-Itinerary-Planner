import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import json
import csv
import io

# --- Custom Function to Load Data from CSV ---

def load_poi_data(csv_content: str) -> list:
    """
    Reads the CSV content, extracts the required fields (name, description), 
    and prepares the POI data structure for the NLP matcher.
    """
    poi_data = []
    # Use io.StringIO to treat the string content as a file
    csvfile = io.StringIO(csv_content)
    
    # Use csv.DictReader to read rows as dictionaries with header names
    reader = csv.DictReader(csvfile)
    
    for row in reader:
        try:
            poi_data.append({
                "name": row['name'],
                "description": row['description'],
                "category": row['category'],
                "city": row['city']
            })
        except KeyError as e:
            # Note: This error handling is important if the dataset headers change.
            print(f"Skipping row due to missing column: {e}")
            continue
    return poi_data

# --- The NLP Class ---

class PreferenceMatcher:
    """
    The core NLP engine using TF-IDF and Cosine Similarity to
    rank Points of Interest (POIs) based on a user's free-form preference text.
    """
    def __init__(self, poi_data: list):
        # 1. Load Data
        self.poi_data = poi_data
        self.corpus = [d['description'] for d in self.poi_data]
        
        # 2. Initialize the Vectorizer
        self.vectorizer = TfidfVectorizer(stop_words='english')
        
        # Fit and Transform the POI descriptions. This creates the "knowledge" matrix.
        self.tfidf_matrix = self.vectorizer.fit_transform(self.corpus)

    def rank_pois(self, user_preference_text: str) -> list:
        """
        Ranks POIs by calculating the cosine similarity between the 
        user preference vector and each POI description vector.
        """
        if not user_preference_text:
            return self.poi_data
            
        # 1. Vectorize the User Input (Query)
        user_vector = self.vectorizer.transform([user_preference_text])
        
        # 2. Calculate Cosine Similarity
        similarity_scores = cosine_similarity(user_vector, self.tfidf_matrix)

        # 3. Combine scores with POI data
        ranked_pois = []
        for i, score in enumerate(similarity_scores[0]):
            poi = self.poi_data[i].copy()
            poi['score'] = float(score) 
            ranked_pois.append(poi)

        # 4. Sort the list by score (highest similarity/best match first)
        ranked_pois.sort(key=lambda x: x['score'], reverse=True)

        return ranked_pois

    def get_unique_cities(self) -> list:
        """
        Returns a sorted list of all unique city names present in the dataset.
        """
        cities = {poi['city'] for poi in self.poi_data}
        return sorted(list(cities))

# --- Initialization Function for api.py ---

def initialize_model(csv_content: str):
    """
    Initializes the POI data and the PreferenceMatcher object. 
    This function is called once by the Flask application (api.py).
    """
    poi_data = load_poi_data(csv_content)
    if not poi_data:
        raise ValueError("Failed to load POI data from CSV. Check file content and headers.")
    return PreferenceMatcher(poi_data)