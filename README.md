# EV Component Failure Prediction

This project is an end-to-end predictive maintenance solution for electric vehicle (EV) components. It uses machine learning (MLP Classifier and Regressor) to predict possible component failures and estimate their Remaining Useful Life (RUL) based on sensor readings.

---

## Features

- **Single Failure Prediction:** Predicts the most likely failure type and its RUL for given sensor readings.
- **Batch/Period Prediction:** For a given time period, lists all possible failure types (with probability > 0.5) that may fail within that period, along with a single RUL value.
- **Modern Frontend:** Built with React, TypeScript, and Tailwind CSS.
- **FastAPI Backend:** Serves ML predictions via REST API.

---

## Algorithms Used

- **MLP Classifier:** Multi-layer Perceptron for classifying failure types.
- **MLP Regressor:** Multi-layer Perceptron for predicting Remaining Useful Life (RUL).
- **LabelEncoder:** For encoding categorical failure types.
- **StandardScaler:** For feature scaling.

---

## Directory Structure

```
project-bolt-sb1-qafiysuz/
│
├── backend/
│   ├── app.py
│   ├── data/
│   ├── model/
│   │   ├── mlp_classifier_model.pkl
│   │   ├── mlp_regressor_model.pkl
│   │   ├── scaler_cls.pkl
│   │   ├── scaler_reg.pkl
│   │   ├── label_encoder.pkl
│   │   └── predict.py
│   └── requirements.txt
│
├── project/
│   ├── src/
│   │   ├── components/
│   │   │   └── PredictionForm.tsx
│   │   ├── App.tsx
│   │   └── ...
│   ├── package.json
│   └── ...
│
└── README.md
```

---

## How to Run

### 1. Backend (FastAPI + ML)

```bash
cd backend
pip install -r requirements.txt
python -m uvicorn app:app --reload
```

- The backend will be available at [http://127.0.0.1:8000](http://127.0.0.1:8000)
- API docs: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

### 2. Frontend (React + Vite)

```bash
cd project
npm install
npm run dev
```

- The frontend will be available at [http://localhost:5173](http://localhost:5173)

---

## API Input & Output Format

### **Single Prediction (`/predict`)**

**Input JSON:**
```json
{
  "voltage": 430,
  "current": 104,
  "temp_battery": 29,
  "soh": 92,
  "vibration": 7,
  "motor_temp": 80,
  "inverter_temp": 55,
  "charging_cycles": 1500,
  "odometer_km": 116330,
  "ambient_temp": 25,
  "road_condition": 0
}
```

**Output JSON:**
```json
{
  "failure_type": "Motor_Bearing_Wear",
  "rul": 90.45
}
```

---

### **Batch/Period Prediction (`/predict-all-failures-and-ruls`)**

**Input JSON:**
```json
{
  "voltage": 430,
  "current": 104,
  "temp_battery": 29,
  "soh": 92,
  "vibration": 7,
  "motor_temp": 80,
  "inverter_temp": 55,
  "charging_cycles": 1500,
  "odometer_km": 116330,
  "ambient_temp": 25,
  "road_condition": 0,
  "time_period_days": 365
}
```

**Output JSON:**
```json
{
  "failures": [
    "Motor_Bearing_Wear",
    "Battery_Failure"
  ],
  "rul": 90.45
}
```
- `failures`: List of possible failure types with probability > 0.5 and RUL within the selected period.
- `rul`: The predicted RUL (minimum 1 day).

---

## Input Field Descriptions

| Field            | Type    | Description                        |
|------------------|---------|------------------------------------|
| voltage          | float   | Voltage (V)                        |
| current          | float   | Current (A)                        |
| temp_battery     | float   | Battery Temperature (°C)           |
| soh              | float   | State of Health (%)                |
| vibration        | float   | Vibration Level                    |
| motor_temp       | float   | Motor Temperature (°C)             |
| inverter_temp    | float   | Inverter Temperature (°C)          |
| charging_cycles  | float   | Charging Cycles                    |
| odometer_km      | float   | Odometer (km)                      |
| ambient_temp     | float   | Ambient Temperature (°C)           |
| road_condition   | int     | 0: Smooth, 1: Rough, 2: Extreme    |
| time_period_days | int     | (Batch only) Time period in days   |

---

## Notes

- RUL is always clamped to a minimum of 1 day.
- Only failure types with probability > 0.5 and RUL within the selected period are returned in batch prediction.
- For true multi-failure prediction, a multi-label classifier is recommended.

---

## License

This project is for educational and