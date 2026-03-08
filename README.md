# Kisan Sathi - Intelligent Crop Recommender

Kisan Sathi is a "Zero-Input" agricultural advisory tool designed for Indian farmers. It eliminates the need for manual soil data entry by automating the collection of environmental parameters based on location.

## Key Features
* **Automated Soil Lookup:** Uses a district-level N-P-K database to pull average soil values "behind the scenes".
* **Live Weather Integration:** Connects to OpenWeatherMap API for real-time temperature and humidity data.
* **Top-4 Recommendation:** Instead of a single result, it provides a ranked list of the 4 most suitable crops with confidence scores.

## Tech Stack
* **Backend:** FastAPI (Python)
* **Machine Learning:** RandomForest Classifier (Scikit-Learn)
* **Database:** JSON-based District Soil Mapping
* **API:** OpenWeatherMap

## Setup Instructions
1. **Clone the repo:**
   `git checkout feature/crop-recommender`
2. **Install Dependencies:**
   `pip install -r backend/requirements.txt`
3. **Run the API:**
   `cd backend && uvicorn main:app --reload`
4. **Access Documentation:**
   Open `http://127.0.0.1:8000/docs` to test the API.

## API Endpoint
**POST** `/recommend`
* **Input:** `{"district": "Nashik", "lat": 19.99, "lon": 73.78}`
* **Output:** Ranked list of crops with confidence percentages.