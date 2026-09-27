import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.preprocessing import LabelEncoder
import joblib
import json
import os
from datetime import datetime

def train():
    print("Loading processed data...")
    df = pd.read_csv('data/processed_traffic.csv')
    
    # Encode categorical features
    encoders = {}
    for col in ['road', 'day_of_week', 'weather']:
        le = LabelEncoder()
        df[col] = le.fit_transform(df[col])
        encoders[col] = le
        
    X = df.drop('traffic_score', axis=1)
    y = df['traffic_score']
    
    # Splitting data
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    print("Training RandomForestRegressor...")
    model = RandomForestRegressor(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)
    
    # Evaluate
    predictions = model.predict(X_test)
    mae = mean_absolute_error(y_test, predictions)
    rmse = np.sqrt(mean_squared_error(y_test, predictions))
    r2 = r2_score(y_test, predictions)
    
    print("\nModel Evaluation")
    print(f"MAE: {mae:.2f}")
    print(f"RMSE: {rmse:.2f}")
    print(f"R²: {r2:.2f}")
    
    # Save model and artifacts
    os.makedirs('model', exist_ok=True)
    joblib.dump(model, 'model/traffic_model.pkl')
    joblib.dump(encoders, 'model/encoders.pkl')
    
    # Save metadata
    metadata = {
        "model_name": "RandomForestRegressor",
        "training_date": datetime.now().isoformat(),
        "feature_names": list(X.columns),
        "dataset_version": "1.0",
        "training_samples": len(X_train),
        "test_samples": len(X_test),
        "mae": round(mae, 2),
        "rmse": round(rmse, 2),
        "r2": round(r2, 2)
    }
    
    with open('model/model_metadata.json', 'w') as f:
        json.dump(metadata, f, indent=4)
        
    print("\nModel and metadata saved successfully.")

if __name__ == "__main__":
    train()
