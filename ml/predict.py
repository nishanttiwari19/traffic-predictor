import sys
import joblib
import pandas as pd

def predict(road, hour, day_of_week, vehicle_count, average_speed, weather, temperature, rainfall):
    try:
        model = joblib.load('model/traffic_model.pkl')
        encoders = joblib.load('model/encoders.pkl')
    except Exception as e:
        print("Error: Model not found. Run train_model.py first.")
        return
        
    road_enc = encoders['road'].transform([road])[0]
    day_enc = encoders['day_of_week'].transform([day_of_week])[0]
    weather_enc = encoders['weather'].transform([weather])[0]
    
    features = [[
        road_enc, int(vehicle_count), float(average_speed), 
        day_enc, int(hour), weather_enc, 
        float(temperature), float(rainfall)
    ]]
    
    score = float(model.predict(features)[0])
    score = max(0.0, min(100.0, score))
    
    if score >= 75:
        level = "SEVERE"
    elif score >= 50:
        level = "HIGH"
    elif score >= 25:
        level = "MODERATE"
    else:
        level = "LOW"
        
    print(f"\n--- Prediction Result ---")
    print(f"Road: {road}")
    print(f"Conditions: {weather}, {temperature}°C")
    print(f"Traffic Score: {score:.1f}")
    print(f"Traffic Level: {level}")

if __name__ == "__main__":
    if len(sys.argv) < 9:
        print("Usage: python predict.py <road> <hour> <day_of_week> <vehicle_count> <average_speed> <weather> <temperature> <rainfall>")
        print("Example: python predict.py 'MP Nagar' 18 Monday 1200 17 Clear 28 0")
    else:
        predict(*sys.argv[1:9])
