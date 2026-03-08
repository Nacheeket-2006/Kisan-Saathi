import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import pickle
import json
import requests
import numpy as np

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "crop_recommender.pkl")
SOIL_DB_PATH = os.path.join(BASE_DIR, "data", "soil_db.json")

# 1. Load the re-saved model
try:
    with open(MODEL_PATH, "rb") as f:
        model = pickle.load(f)
except Exception as e:
    print(f"CRITICAL ERROR: Could not load model. Error: {e}")

# 2. Load the Soil Database with the fixed path
try:
    with open(SOIL_DB_PATH, "r") as f:
        SOIL_DB = json.load(f)
except FileNotFoundError:
    print(f"ERROR: soil_db.json not found at {SOIL_DB_PATH}. Create a 'data' folder!")

@app.get("/")
async def root():
    return {
        "status": "online",
        "message": "Kisan Sathi API is running",
        "version": "1.0.0"
    }

@app.post("/recommend")
async def get_recommendation(district: str, lat: float, lon: float):
    # FALLBACK WEATHER: Use this if OpenWeather is slow or key is new
    temp, hum, rain = 28.0, 60.0, 100.0
    
    # Try fetching real weather
    API_KEY = "YOUR_KEY_HERE"
    weather_url = f"https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={API_KEY}&units=metric"
    try:
        w_res = requests.get(weather_url, timeout=5).json()
        temp = w_res['main']['temp']
        hum = w_res['main']['humidity']
    except:
        pass # Use the fallback values above

    # LOOKUP: Pull district values automatically
    soil = SOIL_DB.get(district, {"N": 100, "P": 40, "K": 40, "ph": 6.5})
    
    # PREDICT: Top 4 Crops
    features = np.array([[soil['N'], soil['P'], soil['K'], temp, hum, soil['ph'], rain]])
    probs = model.predict_proba(features)[0]
    classes = model.classes_
    
    top_4_idx = np.argsort(probs)[-4:][::-1]
    results = [
        {"crop": str(classes[i]), "confidence": f"{round(probs[i]*100, 2)}%"} 
        for i in top_4_idx
    ]
    
    return {
        "district": district,
        "recommendations": results,
        "weather_used": {"temp": temp, "humidity": hum}
    }