import random
from backend.services.distance_service import calculate_haversine


def kmeans_cluster_places(places, k):
    """
    Simple K-means clustering using lat/lon
    Returns list of clusters (each cluster is list of places)
    """

    if not places:
        return []

    # Randomly initialize centroids
    centroids = random.sample(places, min(k, len(places)))

    for _ in range(8):  # few iterations is enough
        clusters = [[] for _ in centroids]

        # Assign places to nearest centroid
        for place in places:
            distances = [
                calculate_haversine(
                    place["lat"], place["lon"],
                    centroid["lat"], centroid["lon"]
                )
                for centroid in centroids
            ]
            ## Find index(cluster) with minimum distance to the place
            min_index = distances.index(min(distances))
            clusters[min_index].append(place)

        # Update centroids
        new_centroids = []
        for cluster in clusters:
            if not cluster:
                continue

            avg_lat = sum(p["lat"] for p in cluster) / len(cluster)
            avg_lon = sum(p["lon"] for p in cluster) / len(cluster)

            new_centroids.append({
                "lat": avg_lat,
                "lon": avg_lon
            })

        centroids = new_centroids

    print("K-means clusters:", clusters)

    return clusters
