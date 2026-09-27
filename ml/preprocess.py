import pandas as pd
import os

def preprocess():
    print("Starting preprocessing...")
    df = pd.read_csv('data/traffic.csv')
    initial_rows = len(df)
    
    # Handle missing values
    df = df.dropna()
    
    # Remove invalid rows
    df = df[df['average_speed'] > 0]
    df = df[df['vehicle_count'] >= 0]
    df = df[(df['traffic_score'] >= 0) & (df['traffic_score'] <= 100)]
    
    valid_rows = len(df)
    
    # Feature engineering
    df['timestamp'] = pd.to_datetime(df['timestamp'])
    df['is_weekend'] = df['timestamp'].dt.weekday >= 5
    
    # Select features
    features = ['road', 'vehicle_count', 'average_speed', 'day_of_week', 'hour', 'weather', 'temperature', 'rainfall', 'traffic_score']
    df_processed = df[features].copy()
    
    df_processed.to_csv('data/processed_traffic.csv', index=False)
    
    print(f"Rows loaded: {initial_rows}")
    print(f"Invalid rows removed: {initial_rows - valid_rows}")
    print(f"Rows saved for training: {valid_rows}")

if __name__ == "__main__":
    os.makedirs('model', exist_ok=True)
    preprocess()
