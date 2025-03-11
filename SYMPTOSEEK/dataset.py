import pandas as pd
from geopy.geocoders import Nominatim
from geopy.exc import GeocoderTimedOut
import time

# Load dataset
df = pd.read_excel("doctor_details.xlsx")  # Ensure the filename matches

# Initialize geolocator
geolocator = Nominatim(user_agent="symptoseek")

# Function to get latitude and longitude
def get_lat_lon(address):
    try:
        location = geolocator.geocode(address, timeout=10)
        if location:
            return location.latitude, location.longitude
        else:
            return None, None
    except GeocoderTimedOut:
        return None, None

# Apply geocoding
df["Latitude"], df["Longitude"] = zip(*df["Address"].apply(get_lat_lon))

# Save updated dataset
df.to_excel("doctor_details_with_coordinates.xlsx", index=False)

print("Geocoding complete! Saved as doctor_details_with_coordinates.xlsx")
