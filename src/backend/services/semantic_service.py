from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

# Load once globally (VERY IMPORTANT)
model = SentenceTransformer("all-MiniLM-L6-v2")


def embed_text(texts):
    """
    Convert list of texts to embeddings
    """
    return model.encode(texts)


def compute_similarity(user_prefs, places):
    """
    user_prefs: list[str]
    places: list[dict]

    returns filtered + scored places
    """

    if not user_prefs:
        return places

    # Combine user preferences into one text
    user_text = " ".join(user_prefs)

    user_embedding = model.encode([user_text])[0]

    place_texts = []

    for p in places:
        # Create meaningful representation of place
        combined = f"{p['name']} {' '.join(p.get('tags', []))}"
        place_texts.append(combined)

    place_embeddings = model.encode(place_texts)

    similarities = cosine_similarity(
        [user_embedding],
        place_embeddings
    )[0]

    scored_places = []

    for i, place in enumerate(places):
        place["semantic_score"] = float(similarities[i])
        scored_places.append(place)

    # Sort by semantic similarity
    scored_places.sort(
        key=lambda x: x["semantic_score"],
        reverse=True
    )
    print("scored_places: ",scored_places)
    return scored_places
