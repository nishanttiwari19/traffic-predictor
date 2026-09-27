import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import os

# Create data directory
os.makedirs('data', exist_ok=True)

roads = [
    "MP Nagar", "Lalghati", "New Market", "Habibganj", 
    "Kolar Road", "Arera Colony", "Board Office", 
    "AIIMS Bhopal", "Shahpura", "Bairagarh"
]
weathers = ["Clear", "Rain", "Cloudy"]

data = []
start_date = datetime(2026, 1, 1)

# Generate approx 5000 rows
for i in range(5000):
    dt = start_date + timedelta(hours=np.random.randint(0, 24 * 60))
    road = np.random.choice(roads)
    weather = np.random.choice(weathers, p=[0.7, 0.1, 0.2])
    
    hour = dt.hour
    day_of_week = dt.strftime('%A')
    
    is_peak = (8 <= hour <= 11) or (17 <= hour <= 20)
    is_weekend = dt.weekday() >= 5
    
    base_score = 30
    if is_peak and not is_weekend:
        base_score += 40
    if weather == "Rain":
        base_score += 15
        
    if road in ["MP Nagar", "New Market", "Habibganj"]:
        base_score += 10
        
    score = np.clip(np.random.normal(base_score, 10), 0, 100)
    
    if score >= 75:
        level = "SEVERE"
    elif score >= 50:
        level = "HIGH"
    elif score >= 25:
        level = "MODERATE"
    else:
        level = "LOW"
        
    vehicle_count = int(score * 15 + np.random.normal(0, 50))
    vehicle_count = max(0, vehicle_count)
    
    avg_speed = 60 - (score * 0.45)
    avg_speed = max(5, int(avg_speed + np.random.normal(0, 5)))
    
    temp = np.random.normal(25, 5)
    rainfall = np.random.exponential(5) if weather == "Rain" else 0
    
    data.append([
        dt.strftime('%Y-%m-%d %H:%M:%S'),
        road,
        vehicle_count,
        avg_speed,
        day_of_week,
        hour,
        weather,
        round(temp, 1),
        round(rainfall, 1),
        round(score, 1),
        level
    ])

df = pd.DataFrame(data, columns=[
    'timestamp', 'road', 'vehicle_count', 'average_speed', 
    'day_of_week', 'hour', 'weather', 'temperature', 
    'rainfall', 'traffic_score', 'traffic_level'
])

# Add some invalid data for testing preprocessing pipeline
df.loc[0, 'average_speed'] = -10
df.loc[1, 'vehicle_count'] = -50
df.loc[2, 'traffic_score'] = 150

df.to_csv('data/traffic.csv', index=False)
print("Generated data/traffic.csv (SAMPLE DATA ONLY)")
