def normalize_city(city_name: str) -> str:
    return city_name.strip().lower().replace(" ", "-")


def latlon_key(lat, lon):
    return f"{round(lat, 1)}:{round(lon, 1)}"