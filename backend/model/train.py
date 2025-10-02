import pandas as pd
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.neural_network import MLPClassifier, MLPRegressor
import joblib
import os

# Load your dataset
df = pd.read_csv('C:\\Users\\PATAN ARIF\\Downloads\\project-bolt-sb1-qafiysuz\\backend\\data\\training-data.csv')  # Adjust path if needed

# Encode categorical features
le = LabelEncoder()
df["road_condition"] = le.fit_transform(df["road_condition"])
df["failure_type"] = le.fit_transform(df["failure_type"])

# === Classification ===
X_class = df.drop(['failure_type', 'rul'], axis=1)
y_class = df['failure_type']
X_class = pd.get_dummies(X_class)
X_train_cls, X_test_cls, y_train_cls, y_test_cls = train_test_split(X_class, y_class, test_size=0.2, random_state=42)
scaler_cls = StandardScaler()
X_train_cls = scaler_cls.fit_transform(X_train_cls)

mlp_clf = MLPClassifier(hidden_layer_sizes=(128, 64), activation='relu', max_iter=1000, random_state=42)
mlp_clf.fit(X_train_cls, y_train_cls)

# === Regression (Only for Failures) ===
df["failure_type_label"] = le.inverse_transform(df["failure_type"])
df_failures = df[df["failure_type_label"] != "No_Failure"].drop(columns=["failure_type_label"])
X_reg = df_failures.drop(columns=["failure_type", "rul"])
y_reg = df_failures["rul"]
X_reg = pd.get_dummies(X_reg)
X_train_reg, X_test_reg, y_train_reg, y_test_reg = train_test_split(X_reg, y_reg, test_size=0.2, random_state=42)
scaler_reg = StandardScaler()
X_train_reg = scaler_reg.fit_transform(X_train_reg)

mlp_reg = MLPRegressor(hidden_layer_sizes=(128, 64), activation='relu', max_iter=2000, random_state=42)
mlp_reg.fit(X_train_reg, y_train_reg)

# Save models and preprocessors
os.makedirs('.', exist_ok=True)
joblib.dump(mlp_clf, 'mlp_classifier_model.pkl')
joblib.dump(mlp_reg, 'mlp_regressor_model.pkl')
joblib.dump(scaler_cls, 'scaler_cls.pkl')
joblib.dump(scaler_reg, 'scaler_reg.pkl')
joblib.dump(le, 'label_encoder.pkl')
print("Models and preprocessors saved!")