from typing import List
from fastapi import FastAPI
from pydantic import BaseModel
from model.predict import predict_failure_and_rul, predict_failures_in_period, predict_all_failures_and_ruls
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Or specify your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class PredictionRequest(BaseModel):
    voltage: float
    current: float
    temp_battery: float
    soh: float
    vibration: float
    motor_temp: float
    inverter_temp: float
    charging_cycles: float
    odometer_km: float
    ambient_temp: float
    road_condition: int  # Should be encoded as in training

class BatchPredictionRequest(BaseModel):
    components: List[dict]  # Each dict is sensor readings for a component
    time_period_days: int

class MultiFailurePredictionRequest(BaseModel):
    voltage: float
    current: float
    temp_battery: float
    soh: float
    vibration: float
    motor_temp: float
    inverter_temp: float
    charging_cycles: float
    odometer_km: float
    ambient_temp: float
    road_condition: int
    time_period_days: int

@app.post("/predict")
def predict(request: PredictionRequest):
    input_data = request.dict()
    print("Received input data:", input_data)
    result = predict_failure_and_rul(input_data)
    print("Prediction result:", result)
    return result

@app.post("/predict-failures-in-period")
def predict_failures_in_period_api(request: BatchPredictionRequest):
    return predict_failures_in_period(request.components, request.time_period_days)

@app.post("/predict-all-failures-and-ruls")
def predict_all_failures_and_ruls_api(request: MultiFailurePredictionRequest):
    input_data = request.dict()
    time_period_days = input_data.pop("time_period_days")
    return predict_all_failures_and_ruls(input_data, time_period_days)

