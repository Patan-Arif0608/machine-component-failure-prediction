import joblib
import os
import numpy as np
import pandas as pd

MODEL_DIR = os.path.join(os.path.dirname(__file__), '.')

# Load models and preprocessors
mlp_classifier = joblib.load(os.path.join(MODEL_DIR, 'mlp_classifier_model.pkl'))
mlp_regressor = joblib.load(os.path.join(MODEL_DIR, 'mlp_regressor_model.pkl'))
scaler_cls = joblib.load(os.path.join(MODEL_DIR, 'scaler_cls.pkl'))
scaler_reg = joblib.load(os.path.join(MODEL_DIR, 'scaler_reg.pkl'))
label_encoder = joblib.load(os.path.join(MODEL_DIR, 'label_encoder.pkl'))

# Define input features (must match training)
feature_names = [
    'voltage', 'current', 'temp_battery', 'soh', 'vibration',
    'motor_temp', 'inverter_temp', 'charging_cycles',
    'odometer_km', 'ambient_temp', 'road_condition'
]

def predict_failure_and_rul(input_dict):
    # Prepare input DataFrame
    input_df = pd.DataFrame([input_dict], columns=feature_names)
    # Classification
    input_scaled_cls = scaler_cls.transform(input_df)
    predicted_class_encoded = mlp_classifier.predict(input_scaled_cls)[0]
    predicted_failure_type = label_encoder.inverse_transform([predicted_class_encoded])[0]
    # Regression
    input_scaled_reg = scaler_reg.transform(input_df)
    predicted_rul = mlp_regressor.predict(input_scaled_reg)[0]
    predicted_rul = max(1, float(predicted_rul))  # Clamp RUL to at least 1 day
    return {
        "failure_type": predicted_failure_type,
        "rul": predicted_rul
    }

def predict_failures_in_period(components: list, time_period_days: int):
    results = []
    for comp in components:
        pred = predict_failure_and_rul(comp)
        # Only include if failure is predicted and RUL <= time_period_days
        if pred["failure_type"] != "No_Failure" and pred["rul"] <= time_period_days:
            results.append({
                "component": comp.get("component_name", "Unknown"),
                "failure_type": pred["failure_type"],
                "rul": pred["rul"]
            })
    return {"failures": results}

def predict_all_failures_and_ruls(input_dict, time_period_days):
    # Prepare input DataFrame
    input_df = pd.DataFrame([input_dict], columns=feature_names)
    input_scaled_cls = scaler_cls.transform(input_df)
    proba = mlp_classifier.predict_proba(input_scaled_cls)[0]
    all_failure_types = label_encoder.inverse_transform(np.arange(len(proba)))
    input_scaled_reg = scaler_reg.transform(input_df)
    predicted_rul = mlp_regressor.predict(input_scaled_reg)[0]
    predicted_rul = max(1, float(predicted_rul))  # Clamp RUL to at least 1 day

    # Only include failure types with probability > 0.5 and not "No_Failure"
    possible_failures = [
        failure_type
        for idx, failure_type in enumerate(all_failure_types)
        if failure_type != "No_Failure" and proba[idx] > 0.5 and predicted_rul <= time_period_days
    ]

    return {
        "failures": possible_failures,
        "rul": predicted_rul
    }


