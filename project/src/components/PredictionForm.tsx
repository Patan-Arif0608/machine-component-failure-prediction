import React, { useState } from 'react';
import { Activity, AlertTriangle, CheckCircle, Loader2, Zap } from 'lucide-react';

interface FormData {
  voltage: string;
  current: string;
  temp_battery: string;
  soh: string;
  vibration: string;
  motor_temp: string;
  inverter_temp: string;
  charging_cycles: string;
  odometer_km: string;
  ambient_temp: string;
  road_condition: string;
}

interface PredictionResult {
  failureType: string;
  rul: number | null;
}

const PredictionForm: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    voltage: '',
    current: '',
    temp_battery: '',
    soh: '',
    vibration: '',
    motor_temp: '',
    inverter_temp: '',
    charging_cycles: '',
    odometer_km: '',
    ambient_temp: '',
    road_condition: '',
  });

  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [timePeriod, setTimePeriod] = useState(30); // default 1 month
  const [batchResults, setBatchResults] = useState<{ failures: string[]; rul: number } | null>(null);

  const fieldLabels = {
    voltage: { label: 'Voltage (V)', min: 0, max: 500, unit: 'V' },
    current: { label: 'Current (A)', min: 0, max: 200, unit: 'A' },
    temp_battery: { label: 'Battery Temperature (°C)', min: -20, max: 80, unit: '°C' },
    soh: { label: 'State of Health (%)', min: 0, max: 100, unit: '%' },
    vibration: { label: 'Vibration Level', min: 0, max: 10, unit: '' },
    motor_temp: { label: 'Motor Temperature (°C)', min: -20, max: 150, unit: '°C' },
    inverter_temp: { label: 'Inverter Temperature (°C)', min: -20, max: 120, unit: '°C' },
    charging_cycles: { label: 'Charging Cycles', min: 0, max: 10000, unit: '' },
    odometer_km: { label: 'Odometer (km)', min: 0, max: 500000, unit: 'km' },
    ambient_temp: { label: 'Ambient Temperature (°C)', min: -40, max: 50, unit: '°C' },
    road_condition: { label: 'Road Condition', min: 0, max: 0, unit: '' },
  };

  const roadConditionOptions = [
    { value: '', label: 'Select Road Condition' },
    { value: 'Smooth', label: 'Smooth' },
    { value: 'Rough', label: 'Rough' },
    { value: 'Extreme', label: 'Extreme' },
  ];

  const validateField = (name: keyof FormData, value: string): string => {
    if (!value.trim()) {
      return `${fieldLabels[name].label} is required`;
    }

    if (name === 'road_condition') {
      return '';
    }

    const numValue = parseFloat(value);
    if (isNaN(numValue)) {
      return `${fieldLabels[name].label} must be a valid number`;
    }

    const { min, max } = fieldLabels[name];
    if (numValue < min || numValue > max) {
      return `${fieldLabels[name].label} must be between ${min} and ${max}`;
    }

    return '';
  };

  const handleInputChange = (name: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Helper to encode road_condition as integer (must match your training)
  function roadConditionToInt(condition: string): number {
    if (condition === "Smooth") return 0;
    if (condition === "Rough") return 1;
    if (condition === "Extreme") return 2;
    return 0; // default/fallback
  }

  // Update this function:
  async function predictComponentFailure(inputData: FormData): Promise<PredictionResult> {
    // Convert string inputs to numbers as required by backend
    const payload = {
      voltage: parseFloat(inputData.voltage),
      current: parseFloat(inputData.current),
      temp_battery: parseFloat(inputData.temp_battery),
      soh: parseFloat(inputData.soh),
      vibration: parseFloat(inputData.vibration),
      motor_temp: parseFloat(inputData.motor_temp),
      inverter_temp: parseFloat(inputData.inverter_temp),
      charging_cycles: parseFloat(inputData.charging_cycles),
      odometer_km: parseFloat(inputData.odometer_km),
      ambient_temp: parseFloat(inputData.ambient_temp),
      road_condition: roadConditionToInt(inputData.road_condition),
    };
    const response = await fetch('http://localhost:8000/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const result = await response.json();
    // Map backend snake_case to frontend camelCase
    return {
      failureType: result.failure_type,
      rul: result.rul,
    };
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all fields
    const newErrors: Partial<FormData> = {};
    Object.keys(formData).forEach(key => {
      const error = validateField(key as keyof FormData, formData[key as keyof FormData]);
      if (error) {
        newErrors[key as keyof FormData] = error;
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    setResult(null);
    
    try {
      const prediction = await predictComponentFailure(formData);
      setResult(prediction);
    } catch (error) {
      console.error('Prediction error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  async function handleBatchPredict() {
    setIsLoading(true);
    setBatchResults(null);
    try {
      const payload = {
        voltage: parseFloat(formData.voltage),
        current: parseFloat(formData.current),
        temp_battery: parseFloat(formData.temp_battery),
        soh: parseFloat(formData.soh),
        vibration: parseFloat(formData.vibration),
        motor_temp: parseFloat(formData.motor_temp),
        inverter_temp: parseFloat(formData.inverter_temp),
        charging_cycles: parseFloat(formData.charging_cycles),
        odometer_km: parseFloat(formData.odometer_km),
        ambient_temp: parseFloat(formData.ambient_temp),
        road_condition: roadConditionToInt(formData.road_condition),
        time_period_days: timePeriod,
      };
      const response = await fetch('http://localhost:8000/predict-all-failures-and-ruls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      setBatchResults(result); // result is { failures: [...], rul: ... }
    } catch (error) {
      console.error('Batch prediction error:', error);
    } finally {
      setIsLoading(false);
    }
  }

  const resetForm = () => {
    setFormData({
      voltage: '',
      current: '',
      temp_battery: '',
      soh: '',
      vibration: '',
      motor_temp: '',
      inverter_temp: '',
      charging_cycles: '',
      odometer_km: '',
      ambient_temp: '',
      road_condition: '',
    });
    setErrors({});
    setResult(null);
    setBatchResults(null);
  };

  const getFailureTypeColor = (failureType: string) => {
    if (failureType === 'No_Failure') return 'text-green-600 bg-green-50 border-green-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getFailureIcon = (failureType: string) => {
    if (failureType === 'No_Failure') return <CheckCircle className="w-6 h-6" />;
    return <AlertTriangle className="w-6 h-6" />;
  };

  const timePeriodOptions = [
    { value: 30, label: '1 Month' },
    { value: 90, label: '3 Months' },
    { value: 180, label: '6 Months' },
    { value: 365, label: '1 Year' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Zap className="w-8 h-8 text-blue-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">EV Component Failure Prediction</h1>
          </div>
          <p className="text-gray-600">Advanced ML-powered diagnostics for electric vehicle components</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Input Form */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-6 flex items-center">
              <Activity className="w-5 h-5 mr-2 text-blue-600" />
              Sensor Readings
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                {Object.entries(fieldLabels).map(([key, config]) => (
                  <div key={key}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {config.label}
                    </label>
                    {key === 'road_condition' ? (
                      <select
                        value={formData[key as keyof FormData]}
                        onChange={(e) => handleInputChange(key as keyof FormData, e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                          errors[key as keyof FormData] ? 'border-red-300' : 'border-gray-300'
                        }`}
                      >
                        {roadConditionOptions.map(option => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="relative">
                        <input
                          type="number"
                          value={formData[key as keyof FormData]}
                          onChange={(e) => handleInputChange(key as keyof FormData, e.target.value)}
                          step="0.1"
                          min={config.min}
                          max={config.max}
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                            errors[key as keyof FormData] ? 'border-red-300' : 'border-gray-300'
                          }`}
                          placeholder={`Enter ${config.label.toLowerCase()}`}
                        />
                        {config.unit && (
                          <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">
                            {config.unit}
                          </span>
                        )}
                      </div>
                    )}
                    {errors[key as keyof FormData] && (
                      <p className="text-red-500 text-xs mt-1">{errors[key as keyof FormData]}</p>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    'Predict Failure'
                  )}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                >
                  Reset
                </button>
              </div>
            </form>

            {/* Time Period Selection for Batch Prediction */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Predictive Maintenance Time Period
              </label>
              <select
                value={timePeriod}
                onChange={e => setTimePeriod(Number(e.target.value))}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                {timePeriodOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={handleBatchPredict}
                disabled={isLoading}
                className="flex-1 bg-green-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Predict Failures in Period'
                )}
              </button>
            </div>
          </div>

          {/* Results */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">Prediction Results</h2>
            
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                <Loader2 className="w-12 h-12 animate-spin mb-4" />
                <p className="text-lg">Processing sensor data...</p>
                <p className="text-sm">Running MLP models for prediction</p>
              </div>
            ) : batchResults && batchResults.failures && batchResults.failures.length > 0 ? (
              <div className="mt-8">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  {timePeriodOptions.find(opt => opt.value === timePeriod)?.label} Prediction
                </h3>
                <div>
                  <span className="font-semibold">Possible Failures:</span>
                  <ul className="list-disc ml-6">
                    {batchResults.failures.map((failure: string, idx: number) => (
                      <li key={idx}>{failure.replace('_', ' ')}</li>
                    ))}
                  </ul>
                </div>
                <div className="mt-4">
                  <span className="font-semibold">RUL:</span> {Number(batchResults.rul).toFixed(2)} days
                </div>
              </div>
            ) : result ? (
              <div className="space-y-6">
                {/* Failure Type Result */}
                <div className={`border-2 rounded-xl p-6 ${getFailureTypeColor(result.failureType)}`}>
                  <div className="flex items-center mb-3">
                    {getFailureIcon(result.failureType)}
                    <h3 className="text-lg font-semibold ml-2">Failure Type Prediction</h3>
                  </div>
                  <p className="text-2xl font-bold mb-2">
                    {result.failureType.replace('_', ' ')}
                  </p>
                  <p className="text-sm opacity-75">MLP Classifier Result</p>
                </div>

                {/* RUL Result */}
                {result.failureType !== 'No_Failure' && result.rul && (
                  <div className="border-2 border-amber-200 bg-amber-50 text-amber-800 rounded-xl p-6">
                    <div className="flex items-center mb-3">
                      <Activity className="w-6 h-6" />
                      <h3 className="text-lg font-semibold ml-2">Remaining Useful Life</h3>
                    </div>
                    <p className="text-3xl font-bold mb-2">
                      {result.rul} days
                    </p>
                    <p className="text-sm opacity-75">MLP Regressor Result</p>
                    <div className="mt-4 p-3 bg-amber-100 rounded-lg">
                      <p className="text-sm font-medium">⚠️ Maintenance Recommendation</p>
                      <p className="text-xs mt-1">
                        Schedule inspection within {Math.max(1, Math.floor(result.rul * 0.7))} days
                      </p>
                    </div>
                  </div>
                )}

                {result.failureType === 'No_Failure' && (
                  <div className="border-2 border-green-200 bg-green-50 text-green-800 rounded-xl p-6">
                    <div className="flex items-center mb-3">
                      <CheckCircle className="w-6 h-6" />
                      <h3 className="text-lg font-semibold ml-2">System Status</h3>
                    </div>
                    <p className="text-lg mb-2">All systems operating normally</p>
                    <p className="text-sm opacity-75">No immediate maintenance required</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                <Activity className="w-16 h-16 mb-4" />
                <p className="text-lg">Enter sensor readings to get predictions</p>
                <p className="text-sm">Fill out the form and click any prediction button</p>
              </div>
            )}
          </div>
        </div>

        {/* Info Section */}
        <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Model Information</h3>
          <div className="grid md:grid-cols-2 gap-6 text-sm text-gray-600">
            <div>
              <h4 className="font-medium text-gray-800 mb-2">MLP Classifier</h4>
              <p>Predicts failure types including Battery, Motor, Thermal, and Electrical failures</p>
              <p className="mt-1"><strong>Architecture:</strong> 128-64 hidden layers with ReLU activation</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-800 mb-2">MLP Regressor</h4>
              <p>Estimates Remaining Useful Life (RUL) when failure is predicted</p>
              <p className="mt-1"><strong>Output:</strong> Days until component replacement needed</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PredictionForm;