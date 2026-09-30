# Bhopal Traffic Predictor

A web application for analyzing routes and predicting traffic conditions in Bhopal.

## 🚀 Live Demo

👉 [Visit Bhopal Traffic Predictor](https://bhopal-traffic-predictor.web.app/)

## 🛠️ Technologies Used

- HTML
- CSS
- JavaScript
- Node.js
- Express.js
- Firebase
- Firestore
- Render
- Traffic Predictor is a modern web application designed to monitor and predict traffic conditions in Bhopal.

## Architecture

This project uses a separated architecture:
- **Frontend**: HTML5, CSS3, Vanilla JS, Leaflet.js, Chart.js.
- **Node.js Backend**: Express.js proxy for communicating securely with routing APIs and ML services.
- **Python ML Service**: FastAPI server hosting a Random Forest Regressor for forecasting traffic conditions.

## Dataset Format

The ML model is trained on historical traffic data. Note: The current dataset is **SAMPLE DATA ONLY**. Replace with verified traffic observations when available.
Format (`traffic.csv`):
```csv
timestamp,road,vehicle_count,average_speed,day_of_week,hour,weather,temperature,rainfall,traffic_score
2026-01-05 08:00:00,MP Nagar,850,18,Monday,8,Clear,22.0,0.0,76.0
```

## Setup & Installation

### 1. Node.js Backend Setup
```bash
npm install
npm start
```
Configure `.env`:
```env
PORT=3000
DEMO_MODE=true
TRAFFIC_API_KEY=YOUR_API_KEY_HERE
```

### 2. Python ML Service Setup
```bash
cd ml
pip install -r requirements.txt
```

### 3. Model Training
Clean data and train the Random Forest model:
```bash
python preprocess.py
python train_model.py
```

### 4. Start FastAPI Prediction Service
```bash
python -m uvicorn api:app --port 8000 --reload
```

## API Documentation

### Node.js Integration
- **`GET /api/route`**: Retrieves route geometry and distance.
- **`POST /api/predict`**: Proxies requests to the Python ML model for traffic forecasting.

### Python ML API (FastAPI)
- **`POST /predict`**
  **Example Request:**
  ```json
  {
    "road": "MP Nagar",
    "hour": 18,
    "day_of_week": "Monday",
    "vehicle_count": 1200,
    "average_speed": 17,
    "weather": "Clear",
    "temperature": 28,
    "rainfall": 0
  }
  ```

## Limitations
- Predictions are currently based on synthetic historical patterns.
- AI confidence scores are inherently absent; uncertainty modeling is not yet implemented.
- Requires both Node.js and Python servers running concurrently.
