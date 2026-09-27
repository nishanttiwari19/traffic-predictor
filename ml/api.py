from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import joblib

app = FastAPI()

try:
    model = joblib.load('model/traffic_model.pkl')
    encoders = joblib.load('model/encoders.pkl')
except Exception as e:
    print("Warning: Model not found. Run train_model.py first.")
    model = None
    encoders = None

class PredictionRequest(BaseModel):
    road: str
    hour: int
    day_of_week: str
    vehicle_count: int
    average_speed: float
    weather: str
    temperature: float
    rainfall: float

def get_traffic_level(score):
    if score >= 75:
        return "SEVERE"
    elif score >= 50:
        return "HIGH"
    elif score >= 25:
        return "MODERATE"
    return "LOW"

@app.post("/predict")
def predict_traffic(req: PredictionRequest):
    if model is None:
        raise HTTPException(status_code=503, detail="Prediction service unavailable (model missing)")
        
    try:
        # Encode categorical inputs
        road_encoded = encoders['road'].transform([req.road])[0]
        day_encoded = encoders['day_of_week'].transform([req.day_of_week])[0]
        weather_encoded = encoders['weather'].transform([req.weather])[0]
        
        # Prepare feature array maintaining exact order from training
        features = [[
            road_encoded, 
            req.vehicle_count, 
            req.average_speed, 
            day_encoded, 
            req.hour, 
            weather_encoded, 
            req.temperature, 
            req.rainfall
        ]]
        
        # Predict
        score = float(model.predict(features)[0])
        score = max(0.0, min(100.0, score))
        level = get_traffic_level(score)
        
        return {
            "success": True,
            "traffic_score": round(score, 1),
            "traffic_level": level
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid input or unsupported feature value: {str(e)}")
