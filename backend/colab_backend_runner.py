"""
==============================================================================
GOOGLE COLAB BACKEND RUNNER FOR CUSTOMER CHURN PREDICTION
==============================================================================
Instructions:
1. Make sure you have executed Cell 102 in your Google Colab notebook
   (which saves 'elastic_net_churn_model.pkl' and 'churn_preprocessor.pkl').
2. Paste this entire cell code at the bottom of your Colab notebook.
3. Run this cell!
4. Copy the generated public HTTPS URL (e.g. https://xxxx.trycloudflare.com).
5. Open your Frontend web app (http://localhost:5173), click 'API Settings',
   paste the URL, and click 'Save & Apply'!
==============================================================================
"""

import os
import sys
import json
import sqlite3
import datetime
import threading
import time
import subprocess
from pathlib import Path

PORT = 5000

# Step 0: Free port 5000 and kill any old tunnels from previous cell runs
print("[1/5] Freeing network port and cleaning up previous processes...")
os.system(f"fuser -k {PORT}/tcp 2>/dev/null")
os.system("pkill -f cloudflared 2>/dev/null")
time.sleep(1)

# Step 1: Install required dependencies
print("[2/5] Checking and installing required packages (flask, flask-cors, pyngrok)...")
subprocess.check_call([sys.executable, "-m", "pip", "install", "-q", "flask", "flask-cors", "pyngrok"])

from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import numpy as np
import joblib

# Initialize Flask application
app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

# Force CORS on every response
@app.after_request
def add_cors_headers(response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, Accept"
    return response

# Step 2: Locate and load trained model and preprocessor
MODEL_CANDIDATE_PATHS = [
    Path("elastic_net_churn_model.pkl"),
    Path("/content/elastic_net_churn_model.pkl"),
    Path("ml_model/elastic_net_churn_model.pkl"),
    Path("../ml_model/elastic_net_churn_model.pkl"),
]

PREPROC_CANDIDATE_PATHS = [
    Path("churn_preprocessor.pkl"),
    Path("/content/churn_preprocessor.pkl"),
    Path("ml_model/churn_preprocessor.pkl"),
    Path("../ml_model/churn_preprocessor.pkl"),
]

model_path = next((p for p in MODEL_CANDIDATE_PATHS if p.exists()), None)
preproc_path = next((p for p in PREPROC_CANDIDATE_PATHS if p.exists()), None)

if not model_path or not preproc_path:
    print("\n❌ ERROR: Model or preprocessor files not found!")
    print("Please make sure you have executed Cell 102 in your Colab notebook first:")
    print("   joblib.dump(best_model, 'elastic_net_churn_model.pkl')")
    print("   joblib.dump(preprocessor, 'churn_preprocessor.pkl')")
    raise FileNotFoundError("Run Cell 102 to create the model artifacts before launching the backend.")

model = joblib.load(model_path)
preprocessor = joblib.load(preproc_path)
print(f"[3/5] Successfully loaded model from '{model_path}' and preprocessor from '{preproc_path}'!")

# SQLite Database for Colab persistence
DB_PATH = Path("churn_history_colab.db")
conn = sqlite3.connect(DB_PATH)
conn.execute("""
    CREATE TABLE IF NOT EXISTS prediction_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_id TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        tenure_months REAL,
        monthly_charges REAL,
        total_charges REAL,
        cltv REAL,
        contract TEXT,
        internet_service TEXT,
        payment_method TEXT,
        prediction INTEGER NOT NULL,
        outcome_label TEXT NOT NULL,
        churn_probability REAL NOT NULL,
        stay_probability REAL NOT NULL,
        risk_level TEXT NOT NULL,
        input_json TEXT NOT NULL
    )
""")
conn.commit()
conn.close()

# Feature definitions
EXPECTED_FEATURES = [
    "Gender", "Senior Citizen", "Partner", "Dependents", "Tenure Months",
    "Phone Service", "Multiple Lines", "Internet Service", "Online Security",
    "Online Backup", "Device Protection", "Tech Support", "Streaming TV",
    "Streaming Movies", "Contract", "Paperless Billing", "Payment Method",
    "Monthly Charges", "Total Charges", "CLTV"
]

NUMERIC_FEATURES = ["Tenure Months", "Monthly Charges", "Total Charges", "CLTV"]
BINARY_YES_NO_FEATURES = ["Senior Citizen", "Partner", "Dependents", "Phone Service", "Paperless Billing"]

FEATURE_ALIASES = {
    "gender": "Gender", "senior_citizen": "Senior Citizen", "seniorcitizen": "Senior Citizen",
    "partner": "Partner", "dependents": "Dependents", "tenure_months": "Tenure Months",
    "tenuremonths": "Tenure Months", "tenure": "Tenure Months", "phone_service": "Phone Service",
    "phoneservice": "Phone Service", "multiple_lines": "Multiple Lines", "multiplelines": "Multiple Lines",
    "internet_service": "Internet Service", "internetservice": "Internet Service",
    "online_security": "Online Security", "onlinesecurity": "Online Security",
    "online_backup": "Online Backup", "onlinebackup": "Online Backup",
    "device_protection": "Device Protection", "deviceprotection": "Device Protection",
    "tech_support": "Tech Support", "techsupport": "Tech Support",
    "streaming_tv": "Streaming TV", "streamingtv": "Streaming TV",
    "streaming_movies": "Streaming Movies", "streamingmovies": "Streaming Movies",
    "contract": "Contract", "paperless_billing": "Paperless Billing",
    "paperlessbilling": "Paperless Billing", "payment_method": "Payment Method",
    "paymentmethod": "Payment Method", "monthly_charges": "Monthly Charges",
    "monthlycharges": "Monthly Charges", "total_charges": "Total Charges",
    "totalcharges": "Total Charges", "cltv": "CLTV"
}

FEATURE_WEIGHTS = [
    {"feature": "Tenure Months", "coefficient": -1.365494, "impact": "Strong Retention Factor", "category": "tenure"},
    {"feature": "Dependents (Yes)", "coefficient": -0.829567, "impact": "High Retention Factor", "category": "demographic"},
    {"feature": "Contract: Month-to-month", "coefficient": 0.801526, "impact": "Major Churn Driver", "category": "contract"},
    {"feature": "Dependents (No)", "coefficient": 0.800923, "impact": "High Churn Risk", "category": "demographic"},
    {"feature": "Internet Service: Fiber optic", "coefficient": 0.667669, "impact": "High Churn Driver", "category": "service"},
    {"feature": "Total Charges", "coefficient": 0.625984, "impact": "Moderate Churn Driver", "category": "billing"},
    {"feature": "Online Security (No)", "coefficient": 0.403995, "impact": "Lack of Security Boosts Churn", "category": "service"},
    {"feature": "Tech Support (No)", "coefficient": 0.388184, "impact": "Lack of Support Boosts Churn", "category": "service"},
    {"feature": "Payment: Electronic check", "coefficient": 0.305230, "impact": "Higher Churn Propensity", "category": "billing"},
    {"feature": "Streaming TV (Yes)", "coefficient": 0.278390, "impact": "Mild Churn Propensity", "category": "service"},
    {"feature": "Contract: Two year", "coefficient": -0.710000, "impact": "Very Strong Retention Anchor", "category": "contract"},
    {"feature": "Contract: One year", "coefficient": -0.450000, "impact": "Moderate Retention Anchor", "category": "contract"},
    {"feature": "Online Security (Yes)", "coefficient": -0.380000, "impact": "Retention Enhancer", "category": "service"},
    {"feature": "Tech Support (Yes)", "coefficient": -0.360000, "impact": "Retention Enhancer", "category": "service"}
]

ACTUAL_METRICS = {
    "accuracy": 0.8074, "precision": 0.6467, "recall": 0.6070, "f1_score": 0.6262, "roc_auc": 0.8433,
    "evaluation_split": "80% Train (5,625 customers) / 20% Test (1,407 customers)",
    "test_support": {"stay": 1033, "churn": 374, "total": 1407},
    "confusion_matrix": {
        "true_negative_stay": 909, "false_positive_churn": 124,
        "false_negative_stay": 147, "true_positive_churn": 227
    },
    "hyperparameters": {
        "model_type": "Logistic Regression with Elastic Net Regularization",
        "solver": "saga", "penalty": "elasticnet", "C": 1.0, "l1_ratio": 0.5,
        "max_iter": 1000, "random_state": 42
    }
}

EMBEDDED_SAMPLE_CUSTOMERS = [
    {
        "CustomerID": "3668-QPYBK", "Gender": "Male", "Senior Citizen": "No", "Partner": "No", "Dependents": "No",
        "Tenure Months": 2, "Phone Service": "Yes", "Multiple Lines": "No", "Internet Service": "DSL",
        "Online Security": "Yes", "Online Backup": "Yes", "Device Protection": "No", "Tech Support": "No",
        "Streaming TV": "No", "Streaming Movies": "No", "Contract": "Month-to-month", "Paperless Billing": "Yes",
        "Payment Method": "Mailed check", "Monthly Charges": 53.85, "Total Charges": 108.15, "CLTV": 3239,
        "Churn Label": "Yes", "City": "Los Angeles"
    },
    {
        "CustomerID": "9237-HQITU", "Gender": "Female", "Senior Citizen": "No", "Partner": "No", "Dependents": "No",
        "Tenure Months": 2, "Phone Service": "Yes", "Multiple Lines": "No", "Internet Service": "Fiber optic",
        "Online Security": "No", "Online Backup": "No", "Device Protection": "No", "Tech Support": "No",
        "Streaming TV": "No", "Streaming Movies": "No", "Contract": "Month-to-month", "Paperless Billing": "Yes",
        "Payment Method": "Electronic check", "Monthly Charges": 70.70, "Total Charges": 151.65, "CLTV": 2701,
        "Churn Label": "Yes", "City": "Los Angeles"
    },
    {
        "CustomerID": "9305-CDSKC", "Gender": "Female", "Senior Citizen": "No", "Partner": "No", "Dependents": "No",
        "Tenure Months": 8, "Phone Service": "Yes", "Multiple Lines": "Yes", "Internet Service": "Fiber optic",
        "Online Security": "No", "Online Backup": "No", "Device Protection": "Yes", "Tech Support": "No",
        "Streaming TV": "Yes", "Streaming Movies": "Yes", "Contract": "Month-to-month", "Paperless Billing": "Yes",
        "Payment Method": "Electronic check", "Monthly Charges": 99.65, "Total Charges": 820.50, "CLTV": 5372,
        "Churn Label": "Yes", "City": "Los Angeles"
    },
    {
        "CustomerID": "7892-POOKP", "Gender": "Female", "Senior Citizen": "No", "Partner": "Yes", "Dependents": "No",
        "Tenure Months": 28, "Phone Service": "Yes", "Multiple Lines": "Yes", "Internet Service": "Fiber optic",
        "Online Security": "No", "Online Backup": "No", "Device Protection": "Yes", "Tech Support": "Yes",
        "Streaming TV": "Yes", "Streaming Movies": "Yes", "Contract": "Month-to-month", "Paperless Billing": "Yes",
        "Payment Method": "Electronic check", "Monthly Charges": 104.80, "Total Charges": 3046.05, "CLTV": 5003,
        "Churn Label": "Yes", "City": "Los Angeles"
    },
    {
        "CustomerID": "2569-WGERO", "Gender": "Female", "Senior Citizen": "No", "Partner": "No", "Dependents": "No",
        "Tenure Months": 72, "Phone Service": "Yes", "Multiple Lines": "Yes", "Internet Service": "No",
        "Online Security": "No internet service", "Online Backup": "No internet service", "Device Protection": "No internet service",
        "Tech Support": "No internet service", "Streaming TV": "No internet service", "Streaming Movies": "No internet service",
        "Contract": "Two year", "Paperless Billing": "Yes", "Payment Method": "Bank transfer (automatic)",
        "Monthly Charges": 21.15, "Total Charges": 1419.40, "CLTV": 5319, "Churn Label": "No", "City": "Landers"
    },
    {
        "CustomerID": "6840-RESVB", "Gender": "Male", "Senior Citizen": "No", "Partner": "Yes", "Dependents": "Yes",
        "Tenure Months": 24, "Phone Service": "Yes", "Multiple Lines": "Yes", "Internet Service": "DSL",
        "Online Security": "Yes", "Online Backup": "No", "Device Protection": "Yes", "Tech Support": "Yes",
        "Streaming TV": "Yes", "Streaming Movies": "Yes", "Contract": "One year", "Paperless Billing": "Yes",
        "Payment Method": "Mailed check", "Monthly Charges": 84.80, "Total Charges": 1990.50, "CLTV": 4361,
        "Churn Label": "No", "City": "Adelanto"
    },
    {
        "CustomerID": "2234-XADUH", "Gender": "Female", "Senior Citizen": "No", "Partner": "Yes", "Dependents": "Yes",
        "Tenure Months": 72, "Phone Service": "Yes", "Multiple Lines": "Yes", "Internet Service": "Fiber optic",
        "Online Security": "No", "Online Backup": "Yes", "Device Protection": "Yes", "Tech Support": "No",
        "Streaming TV": "Yes", "Streaming Movies": "Yes", "Contract": "One year", "Paperless Billing": "Yes",
        "Payment Method": "Credit card (automatic)", "Monthly Charges": 103.20, "Total Charges": 7362.90, "CLTV": 3760,
        "Churn Label": "No", "City": "Amboy"
    },
    {
        "CustomerID": "3186-AJIEK", "Gender": "Male", "Senior Citizen": "No", "Partner": "No", "Dependents": "No",
        "Tenure Months": 66, "Phone Service": "Yes", "Multiple Lines": "No", "Internet Service": "Fiber optic",
        "Online Security": "Yes", "Online Backup": "No", "Device Protection": "Yes", "Tech Support": "Yes",
        "Streaming TV": "Yes", "Streaming Movies": "Yes", "Contract": "Two year", "Paperless Billing": "Yes",
        "Payment Method": "Bank transfer (automatic)", "Monthly Charges": 105.65, "Total Charges": 6844.50, "CLTV": 5566,
        "Churn Label": "No", "City": "Apple Valley"
    }
]

def normalize_input_data(raw_data):
    normalized = {}
    for key, val in raw_data.items():
        clean_key = str(key).strip()
        matched_key = FEATURE_ALIASES.get(clean_key.lower(), clean_key)
        normalized[matched_key] = val

    missing_fields = []
    final_dict = {}

    for feature in EXPECTED_FEATURES:
        if feature in normalized and normalized[feature] is not None and str(normalized[feature]).strip() != "":
            val = normalized[feature]
            if feature in NUMERIC_FEATURES:
                try:
                    final_dict[feature] = float(val)
                except (ValueError, TypeError):
                    raise ValueError(f"Feature '{feature}' must be a valid number, received '{val}'.")
            else:
                str_val = str(val).strip()
                if feature in BINARY_YES_NO_FEATURES:
                    if str_val in ["1", "true", "True", "yes", "YES"]:
                        str_val = "Yes"
                    elif str_val in ["0", "false", "False", "no", "NO"]:
                        str_val = "No"
                final_dict[feature] = str_val
        else:
            missing_fields.append(feature)

    if missing_fields:
        raise ValueError(f"Missing required customer features: {', '.join(missing_fields)}")

    return final_dict

def get_top_factors(customer_dict):
    factors = []
    contract = customer_dict.get("Contract", "")
    tenure = float(customer_dict.get("Tenure Months", 0))
    internet = customer_dict.get("Internet Service", "")
    dependents = customer_dict.get("Dependents", "")
    sec = customer_dict.get("Online Security", "")
    tech = customer_dict.get("Tech Support", "")
    payment = customer_dict.get("Payment Method", "")

    if contract == "Month-to-month":
        factors.append({"factor": "Month-to-month Contract", "type": "risk", "weight": "+0.802", "text": "Month-to-month flexibility is the single largest structural churn trigger."})
    elif contract in ["One year", "Two year"]:
        factors.append({"factor": f"Long-term Contract ({contract})", "type": "retention", "weight": "-0.710", "text": "Annual agreements significantly anchor customer retention."})

    if tenure <= 12:
        factors.append({"factor": f"Low Tenure ({int(tenure)} months)", "type": "risk", "weight": "+1.365 effect", "text": "Customers in their first year exhibit peak vulnerability to competitor offers."})
    elif tenure >= 48:
        factors.append({"factor": f"High Tenure ({int(tenure)} months)", "type": "retention", "weight": "-1.365 effect", "text": "Established account tenure is the strongest statistical buffer against churn."})

    if internet == "Fiber optic":
        factors.append({"factor": "Fiber Optic Service", "type": "risk", "weight": "+0.668", "text": "Fiber optic subscribers show elevated churn, typically due to higher monthly pricing."})
    if sec == "No":
        factors.append({"factor": "No Online Security", "type": "risk", "weight": "+0.404", "text": "Lack of security services correlates with reduced stickiness."})
    elif sec == "Yes":
        factors.append({"factor": "Online Security Enabled", "type": "retention", "weight": "-0.380", "text": "Active security add-ons foster product engagement."})
    if tech == "No":
        factors.append({"factor": "No Tech Support", "type": "risk", "weight": "+0.388", "text": "Unassisted technical friction increases service abandonment."})
    if dependents == "Yes":
        factors.append({"factor": "Family / Dependents", "type": "retention", "weight": "-0.830", "text": "Household accounts have substantially lower turnover rates."})
    if payment == "Electronic check":
        factors.append({"factor": "Electronic Check Payment", "type": "risk", "weight": "+0.305", "text": "Electronic check payments correlate with higher churn than autopay."})

    return factors

# Routes
@app.route("/", methods=["GET"])
def root():
    return jsonify({
        "status": "online",
        "project": "Customer Churn Prediction API",
        "model_loaded": True,
        "health": "/api/health"
    })

@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({
        "status": "healthy",
        "environment": "Google Colab",
        "model_loaded": True,
        "model_name": "Elastic Net Regularized Logistic Regression",
        "expected_features_count": 20,
        "server_time": datetime.datetime.now().isoformat()
    })

@app.route("/api/model-info", methods=["GET"])
def model_info():
    return jsonify({
        "model_title": "Elastic Net Regularized Logistic Regression",
        "dataset": "IBM Telco Customer Churn (California telecommunications)",
        "cleaned_records": 7032,
        "input_features": EXPECTED_FEATURES,
        "metrics": ACTUAL_METRICS,
        "top_features": FEATURE_WEIGHTS
    })

@app.route("/api/predict", methods=["POST"])
def predict():
    try:
        raw_data = request.get_json(force=True)
        if not raw_data:
            return jsonify({"status": "error", "message": "No JSON payload provided in request."}), 400

        customer_id = raw_data.get("CustomerID") or raw_data.get("customer_id") or f"CUST-{datetime.datetime.now().strftime('%M%S%f')[:7]}"
        customer_dict = normalize_input_data(raw_data)

        customer_df = pd.DataFrame([customer_dict])[EXPECTED_FEATURES]
        customer_processed = preprocessor.transform(customer_df)

        prediction_val = int(model.predict(customer_processed)[0])
        probabilities = model.predict_proba(customer_processed)[0]
        churn_prob = float(probabilities[1])
        stay_prob = float(probabilities[0])

        outcome_label = "Churn" if prediction_val == 1 else "Stay"
        risk_level = "High" if churn_prob >= 0.60 else ("Moderate" if churn_prob >= 0.35 else "Low")
        factors = get_top_factors(customer_dict)

        timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        try:
            c = sqlite3.connect(DB_PATH)
            cur = c.cursor()
            cur.execute("""
                INSERT INTO prediction_history (
                    customer_id, timestamp, tenure_months, monthly_charges,
                    total_charges, cltv, contract, internet_service, payment_method,
                    prediction, outcome_label, churn_probability, stay_probability,
                    risk_level, input_json
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                customer_id, timestamp,
                customer_dict["Tenure Months"], customer_dict["Monthly Charges"],
                customer_dict["Total Charges"], customer_dict["CLTV"],
                customer_dict["Contract"], customer_dict["Internet Service"],
                customer_dict["Payment Method"],
                prediction_val, outcome_label, churn_prob, stay_prob,
                risk_level, json.dumps(customer_dict)
            ))
            c.commit()
            record_id = cur.lastrowid
            c.close()
        except Exception:
            record_id = None

        return jsonify({
            "status": "success",
            "customer_id": customer_id,
            "prediction": prediction_val,
            "outcome": outcome_label,
            "churn_probability": round(churn_prob, 4),
            "stay_probability": round(stay_prob, 4),
            "churn_percentage": round(churn_prob * 100, 2),
            "stay_percentage": round(stay_prob * 100, 2),
            "risk_level": risk_level,
            "factors": factors,
            "timestamp": timestamp,
            "record_id": record_id
        })
    except ValueError as e:
        return jsonify({"status": "error", "message": str(e)}), 422
    except Exception as e:
        return jsonify({"status": "error", "message": f"Inference error: {str(e)}"}), 500

@app.route("/api/history", methods=["GET"])
def history():
    try:
        limit = request.args.get("limit", default=100, type=int)
        c = sqlite3.connect(DB_PATH)
        c.row_factory = sqlite3.Row
        rows = c.execute("SELECT * FROM prediction_history ORDER BY id DESC LIMIT ?", (limit,)).fetchall()
        c.close()
        history_list = []
        for r in rows:
            history_list.append({
                "id": r["id"],
                "customer_id": r["customer_id"],
                "timestamp": r["timestamp"],
                "tenure_months": r["tenure_months"],
                "monthly_charges": r["monthly_charges"],
                "total_charges": r["total_charges"],
                "cltv": r["cltv"],
                "contract": r["contract"],
                "internet_service": r["internet_service"],
                "payment_method": r["payment_method"],
                "prediction": r["prediction"],
                "outcome_label": r["outcome_label"],
                "churn_probability": r["churn_probability"],
                "stay_probability": r["stay_probability"],
                "risk_level": r["risk_level"],
                "input_data": json.loads(r["input_json"]) if r["input_json"] else {}
            })
        return jsonify({"status": "success", "total_records": len(history_list), "history": history_list})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route("/api/history", methods=["DELETE"])
def clear_history():
    try:
        c = sqlite3.connect(DB_PATH)
        c.execute("DELETE FROM prediction_history")
        c.commit()
        c.close()
        return jsonify({"status": "success", "message": "Prediction history cleared."})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route("/api/analytics", methods=["GET"])
def analytics():
    return jsonify({
        "overall_distribution": {
            "total_customers": 7032,
            "retained_count": 5163,
            "churned_count": 1869,
            "churn_rate_percent": 26.58,
            "retention_rate_percent": 73.42
        },
        "churn_by_contract": [
            {"contract": "Month-to-month", "total": 3875, "churned": 1655, "retained": 2220, "churn_rate": 42.71},
            {"contract": "One year", "total": 1472, "churned": 166, "retained": 1306, "churn_rate": 11.28},
            {"contract": "Two year", "total": 1685, "churned": 48, "retained": 1637, "churn_rate": 2.85}
        ],
        "churn_by_tenure_group": [
            {"cohort": "0-12 Months", "total": 2175, "churned": 1031, "retained": 1144, "churn_rate": 47.40},
            {"cohort": "13-24 Months", "total": 1024, "churned": 294, "retained": 730, "churn_rate": 28.71},
            {"cohort": "25-48 Months", "total": 1594, "churned": 326, "retained": 1268, "churn_rate": 20.45},
            {"cohort": "49-72 Months", "total": 2239, "churned": 218, "retained": 2021, "churn_rate": 9.74}
        ],
        "churn_by_internet_service": [
            {"service": "Fiber optic", "total": 3096, "churned": 1297, "retained": 1799, "churn_rate": 41.89},
            {"service": "DSL", "total": 2416, "churned": 459, "retained": 1957, "churn_rate": 19.00},
            {"service": "No Internet", "total": 1520, "churned": 113, "retained": 1407, "churn_rate": 7.43}
        ],
        "monthly_charges_bands": [
            {"range": "$18 - $35 (Basic)", "total": 1500, "churn_rate": 8.9},
            {"range": "$36 - $65 (Mid)", "total": 1380, "churn_rate": 22.4},
            {"range": "$66 - $90 (Standard)", "total": 2200, "churn_rate": 34.6},
            {"range": "$91 - $119 (Premium)", "total": 1952, "churn_rate": 38.5}
        ],
        "feature_importance": FEATURE_WEIGHTS
    })

@app.route("/api/sample-customers", methods=["GET"])
def sample_customers():
    return jsonify(EMBEDDED_SAMPLE_CUSTOMERS)

# Step 3: Run Flask in background daemon thread
print(f"[4/5] Starting Flask API on port {PORT}...")
def run_flask():
    app.run(host="0.0.0.0", port=PORT, debug=False, use_reloader=False)

flask_thread = threading.Thread(target=run_flask, daemon=True)
flask_thread.start()
time.sleep(2)

# Step 4: Tunnel Configuration (supports Ngrok and Cloudflare Tunnel)
print("[5/5] Establishing secure HTTPS public tunnel...")

NGROK_AUTHTOKEN = os.environ.get("NGROK_AUTHTOKEN", "YOUR_NGROK_AUTHTOKEN_HERE")
tunnel_url = None

from pyngrok import ngrok
try:
    ngrok.kill()
except Exception:
    pass

if NGROK_AUTHTOKEN != "YOUR_NGROK_AUTHTOKEN_HERE" and NGROK_AUTHTOKEN.strip():
    try:
        ngrok.set_auth_token(NGROK_AUTHTOKEN)
        tunnel = ngrok.connect(PORT)
        tunnel_url = tunnel.public_url
        print("✅ Connected via pyngrok!")
    except Exception as err:
        print(f"⚠️ Ngrok connection issue: {err}")

# Cloudflare Tunnel fallback (requires NO token or signup)
if not tunnel_url:
    print("ℹ️ Setting up Cloudflare Tunnel (instant, free, zero-config)...")
    try:
        if not os.path.exists("cloudflared"):
            subprocess.run(["curl", "-s", "-L", "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64", "-o", "cloudflared"], check=True)
            subprocess.run(["chmod", "+x", "cloudflared"], check=True)

        cf_proc = subprocess.Popen(
            ["./cloudflared", "tunnel", "--url", f"http://localhost:{PORT}"],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )

        import re
        for _ in range(35):
            time.sleep(1)
            line = cf_proc.stderr.readline()
            match = re.search(r"https://[a-zA-Z0-9-]+\.trycloudflare\.com", line)
            if match:
                tunnel_url = match.group(0)
                break
    except Exception as cf_err:
        print(f"Cloudflare tunnel error: {cf_err}")

# Final Status
print("\n" + "=" * 70)
if tunnel_url:
    print("🚀 GOOGLE COLAB BACKEND IS LIVE & CONNECTED!")
    print(f"PUBLIC API URL: {tunnel_url}")
    print("=" * 70)
    print("\nNext Steps:")
    print("1. Copy the PUBLIC API URL above.")
    print("2. Open your React Frontend (http://localhost:5173).")
    print("3. Click 'API Settings' in the top navbar.")
    print("4. Paste the URL and click 'Save & Apply'!")
else:
    print("⚠️ Tunnel could not be established automatically.")
    print("You can use ngrok by setting NGROK_AUTHTOKEN = 'your_token' in this cell.")
print("=" * 70 + "\n")
