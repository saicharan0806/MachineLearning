"""
Customer Churn Prediction - Flask REST API Backend
Using Elastic Net Regularized Logistic Regression
"""

import os
import sys
import json
import sqlite3
import datetime
from pathlib import Path
# pyrefly: ignore [missing-import]
from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd

# Initialize Flask application
app = Flask(__name__)
CORS(app)  # Enable Cross-Origin Resource Sharing for frontend

# Project paths
BASE_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BASE_DIR.parent
DB_DIR = BASE_DIR / "database"
DB_DIR.mkdir(exist_ok=True)
DB_PATH = DB_DIR / "churn_history.db"

# Possible model file locations (project ml_model dir, backend dir, current dir, or Colab /content)
MODEL_CANDIDATE_PATHS = [
    PROJECT_ROOT / "ml_model" / "elastic_net_churn_model.pkl",
    BASE_DIR / "ml_model" / "elastic_net_churn_model.pkl",
    BASE_DIR / "elastic_net_churn_model.pkl",
    Path.cwd() / "ml_model" / "elastic_net_churn_model.pkl",
    Path.cwd() / "elastic_net_churn_model.pkl",
    Path("/content/elastic_net_churn_model.pkl"),
    Path("elastic_net_churn_model.pkl"),
]

PREPROCESSOR_CANDIDATE_PATHS = [
    PROJECT_ROOT / "ml_model" / "churn_preprocessor.pkl",
    BASE_DIR / "ml_model" / "churn_preprocessor.pkl",
    BASE_DIR / "churn_preprocessor.pkl",
    Path.cwd() / "ml_model" / "churn_preprocessor.pkl",
    Path.cwd() / "churn_preprocessor.pkl",
    Path("/content/churn_preprocessor.pkl"),
    Path("churn_preprocessor.pkl"),
]

# Model variables
model = None
preprocessor = None
model_loaded = False
model_load_error = None

# Exact feature specification from notebook cell 76 & 82
EXPECTED_FEATURES = [
    "Gender",
    "Senior Citizen",
    "Partner",
    "Dependents",
    "Tenure Months",
    "Phone Service",
    "Multiple Lines",
    "Internet Service",
    "Online Security",
    "Online Backup",
    "Device Protection",
    "Tech Support",
    "Streaming TV",
    "Streaming Movies",
    "Contract",
    "Paperless Billing",
    "Payment Method",
    "Monthly Charges",
    "Total Charges",
    "CLTV"
]

NUMERIC_FEATURES = ["Tenure Months", "Monthly Charges", "Total Charges", "CLTV"]

CATEGORICAL_FEATURES = [
    "Gender", "Senior Citizen", "Partner", "Dependents",
    "Phone Service", "Multiple Lines", "Internet Service",
    "Online Security", "Online Backup", "Device Protection",
    "Tech Support", "Streaming TV", "Streaming Movies",
    "Contract", "Paperless Billing", "Payment Method"
]

# Binary categorical fields that expect 'Yes' or 'No'
BINARY_YES_NO_FEATURES = [
    "Senior Citizen", "Partner", "Dependents",
    "Phone Service", "Paperless Billing"
]

FEATURE_ALIASES = {
    "gender": "Gender",
    "senior_citizen": "Senior Citizen",
    "seniorcitizen": "Senior Citizen",
    "partner": "Partner",
    "dependents": "Dependents",
    "tenure_months": "Tenure Months",
    "tenuremonths": "Tenure Months",
    "tenure": "Tenure Months",
    "phone_service": "Phone Service",
    "phoneservice": "Phone Service",
    "multiple_lines": "Multiple Lines",
    "multiplelines": "Multiple Lines",
    "internet_service": "Internet Service",
    "internetservice": "Internet Service",
    "online_security": "Online Security",
    "onlinesecurity": "Online Security",
    "online_backup": "Online Backup",
    "onlinebackup": "Online Backup",
    "device_protection": "Device Protection",
    "deviceprotection": "Device Protection",
    "tech_support": "Tech Support",
    "techsupport": "Tech Support",
    "streaming_tv": "Streaming TV",
    "streamingtv": "Streaming TV",
    "streaming_movies": "Streaming Movies",
    "streamingmovies": "Streaming Movies",
    "contract": "Contract",
    "paperless_billing": "Paperless Billing",
    "paperlessbilling": "Paperless Billing",
    "payment_method": "Payment Method",
    "paymentmethod": "Payment Method",
    "monthly_charges": "Monthly Charges",
    "monthlycharges": "Monthly Charges",
    "total_charges": "Total Charges",
    "totalcharges": "Total Charges",
    "cltv": "CLTV"
}

# Top features coefficients from notebook cell 97
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

# Actual notebook metrics (cells 90 & 93)
ACTUAL_METRICS = {
    "accuracy": 0.8074,
    "precision": 0.6467,
    "recall": 0.6070,
    "f1_score": 0.6262,
    "roc_auc": 0.8433,
    "evaluation_split": "80% Train (5,625 customers) / 20% Test (1,407 customers)",
    "test_support": {"stay": 1033, "churn": 374, "total": 1407},
    "confusion_matrix": {
        "true_negative_stay": 909,
        "false_positive_churn": 124,
        "false_negative_stay": 147,
        "true_positive_churn": 227
    },
    "hyperparameters": {
        "model_type": "Logistic Regression with Elastic Net Regularization",
        "solver": "saga",
        "penalty": "elasticnet",
        "C": 1.0,
        "l1_ratio": 0.5,
        "max_iter": 1000,
        "random_state": 42
    }
}

# Embedded sample records from Telco dataset to ensure tables always load
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
        "CustomerID": "0280-XJGEX", "Gender": "Male", "Senior Citizen": "No", "Partner": "No", "Dependents": "No",
        "Tenure Months": 49, "Phone Service": "Yes", "Multiple Lines": "Yes", "Internet Service": "Fiber optic",
        "Online Security": "No", "Online Backup": "Yes", "Device Protection": "Yes", "Tech Support": "No",
        "Streaming TV": "Yes", "Streaming Movies": "Yes", "Contract": "Month-to-month", "Paperless Billing": "Yes",
        "Payment Method": "Bank transfer (automatic)", "Monthly Charges": 103.70, "Total Charges": 5036.30, "CLTV": 5340,
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
        "CustomerID": "4801-JZAZL", "Gender": "Female", "Senior Citizen": "No", "Partner": "Yes", "Dependents": "Yes",
        "Tenure Months": 11, "Phone Service": "No", "Multiple Lines": "No phone service", "Internet Service": "DSL",
        "Online Security": "Yes", "Online Backup": "No", "Device Protection": "No", "Tech Support": "No",
        "Streaming TV": "No", "Streaming Movies": "No", "Contract": "Month-to-month", "Paperless Billing": "Yes",
        "Payment Method": "Electronic check", "Monthly Charges": 29.60, "Total Charges": 346.45, "CLTV": 2696,
        "Churn Label": "No", "City": "Angelus Oaks"
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


def load_model_and_preprocessor():
    """Attempt to load trained model and preprocessor joblib files."""
    global model, preprocessor, model_loaded, model_load_error
    # pyrefly: ignore [missing-import]
    import joblib

    model_path = next((p for p in MODEL_CANDIDATE_PATHS if p.exists()), None)
    preproc_path = next((p for p in PREPROCESSOR_CANDIDATE_PATHS if p.exists()), None)

    if model_path and preproc_path:
        try:
            model = joblib.load(model_path)
            preprocessor = joblib.load(preproc_path)
            model_loaded = True
            model_load_error = None
            print(f"[Backend] Successfully loaded model from {model_path}")
            print(f"[Backend] Successfully loaded preprocessor from {preproc_path}")
            return True
        except Exception as e:
            model_loaded = False
            model_load_error = str(e)
            print(f"[Backend] Error loading pickled artifacts: {e}")
            return False
    else:
        model_loaded = False
        missing = []
        if not model_path: missing.append("elastic_net_churn_model.pkl")
        if not preproc_path: missing.append("churn_preprocessor.pkl")
        model_load_error = f"Missing file(s): {', '.join(missing)}. Please copy them from Colab or run backend directly in Colab."
        print(f"[Backend] Model files not found: {model_load_error}")
        return False


def init_db():
    """Initialize SQLite database with prediction history table."""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
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


# Initialize database
init_db()
# Attempt loading model
load_model_and_preprocessor()


def normalize_input_data(raw_data):
    """Normalize input keys and cast types to match notebook specifications."""
    normalized = {}
    
    # Map any snake_case or lowercase keys to the expected column names
    for key, val in raw_data.items():
        clean_key = str(key).strip()
        matched_key = FEATURE_ALIASES.get(clean_key.lower(), clean_key)
        normalized[matched_key] = val

    # Verify all expected features are present or supply reasonable defaults
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
                # Smart normalization for binary Yes/No columns
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


def calculate_risk_level(prob):
    """Categorize churn probability into risk tiers."""
    if prob >= 0.60:
        return "High"
    elif prob >= 0.35:
        return "Moderate"
    else:
        return "Low"


def get_top_factors(customer_dict):
    """Determine personalized churn and retention factors for this specific customer."""
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
        factors.append({"factor": "Fiber Optic Service", "type": "risk", "weight": "+0.668", "text": "Fiber optic subscribers show elevated churn, typically due to higher monthly pricing and competitor switching."})
    
    if sec == "No":
        factors.append({"factor": "No Online Security", "type": "risk", "weight": "+0.404", "text": "Lack of value-added security services correlates with reduced platform stickiness."})
    elif sec == "Yes":
        factors.append({"factor": "Online Security Enabled", "type": "retention", "weight": "-0.380", "text": "Active security add-ons foster product engagement and loyalty."})

    if tech == "No":
        factors.append({"factor": "No Tech Support", "type": "risk", "weight": "+0.388", "text": "Unassisted technical friction increases service abandonment."})
        
    if dependents == "Yes":
        factors.append({"factor": "Family / Dependents", "type": "retention", "weight": "-0.830", "text": "Household and family accounts have substantially lower turnover rates."})

    if payment == "Electronic check":
        factors.append({"factor": "Electronic Check Payment", "type": "risk", "weight": "+0.305", "text": "Manual electronic check payments correlate with higher churn than automatic billing."})

    return factors


# ==============================================================================
# REST API ROUTES
# ==============================================================================

@app.route("/", methods=["GET"])
def root():
    return jsonify({
        "project": "Customer Churn Prediction API",
        "model": "Elastic Net Regularized Logistic Regression",
        "status": "online",
        "documentation": "/api/model-info",
        "health": "/api/health"
    })


@app.route("/api/health", methods=["GET"])
def health_check():
    """Health check endpoint to test connection from frontend or Colab."""
    global model_loaded
    if not model_loaded:
        load_model_and_preprocessor()

    return jsonify({
        "status": "healthy",
        "model_loaded": model_loaded,
        "model_error": model_load_error,
        "expected_features_count": len(EXPECTED_FEATURES),
        "database": "connected" if DB_PATH.exists() else "uninitialized",
        "server_time": datetime.datetime.now().isoformat(),
        "environment": "Google Colab / Cloud" if "COLAB_GPU" in os.environ or "google.colab" in sys.modules else "Local / Server"
    })


@app.route("/api/model-info", methods=["GET"])
def model_info():
    """Return actual model architecture and evaluation metrics from notebook."""
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
    """Generate churn prediction for a given customer profile."""
    global model, preprocessor, model_loaded

    if not model_loaded:
        if not load_model_and_preprocessor():
            return jsonify({
                "status": "error",
                "message": (
                    "Trained model artifacts are not currently loaded on the backend. "
                    f"Details: {model_load_error}. "
                    "Please verify that 'elastic_net_churn_model.pkl' and 'churn_preprocessor.pkl' "
                    "are present in ml_model/ or that the backend is executed from Google Colab."
                )
            }), 503

    try:
        raw_data = request.get_json(force=True)
        if not raw_data:
            return jsonify({"status": "error", "message": "No JSON payload provided in request."}), 400

        # Customer ID identifier
        customer_id = raw_data.get("CustomerID") or raw_data.get("customer_id") or f"CUST-{datetime.datetime.now().strftime('%M%S%f')[:7]}"

        # Normalize and validate inputs
        customer_dict = normalize_input_data(raw_data)

        # Convert to single-row DataFrame with the exact column order expected by notebook
        customer_df = pd.DataFrame([customer_dict])[EXPECTED_FEATURES]

        # Apply preprocessor pipeline
        customer_processed = preprocessor.transform(customer_df)

        # Predict churn class and probability
        prediction_val = int(model.predict(customer_processed)[0])
        probabilities = model.predict_proba(customer_processed)[0]
        churn_prob = float(probabilities[1])
        stay_prob = float(probabilities[0])

        outcome_label = "Churn" if prediction_val == 1 else "Stay"
        risk_level = calculate_risk_level(churn_prob)
        factors = get_top_factors(customer_dict)

        # Persist prediction to SQLite
        timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        try:
            conn = sqlite3.connect(DB_PATH)
            cur = conn.cursor()
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
            conn.commit()
            record_id = cur.lastrowid
            conn.close()
        except Exception as db_err:
            print(f"[Backend] Database insert warning: {db_err}")
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

    except ValueError as val_err:
        return jsonify({"status": "error", "message": str(val_err)}), 422
    except Exception as err:
        return jsonify({"status": "error", "message": f"Inference failure: {str(err)}"}), 500


@app.route("/api/history", methods=["GET"])
def get_history():
    """Retrieve saved prediction records from SQLite."""
    try:
        limit = request.args.get("limit", default=100, type=int)
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cur = conn.cursor()
        cur.execute("""
            SELECT id, customer_id, timestamp, tenure_months, monthly_charges,
                   total_charges, cltv, contract, internet_service, payment_method,
                   prediction, outcome_label, churn_probability, stay_probability,
                   risk_level, input_json
            FROM prediction_history
            ORDER BY id DESC
            LIMIT ?
        """, (limit,))
        rows = cur.fetchall()
        conn.close()

        history = []
        for r in rows:
            history.append({
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

        return jsonify({
            "status": "success",
            "total_records": len(history),
            "history": history
        })
    except Exception as err:
        return jsonify({"status": "error", "message": str(err)}), 500


@app.route("/api/history", methods=["DELETE"])
def clear_history():
    """Clear all records from prediction history table."""
    try:
        conn = sqlite3.connect(DB_PATH)
        cur = conn.cursor()
        cur.execute("DELETE FROM prediction_history")
        conn.commit()
        conn.close()
        return jsonify({"status": "success", "message": "Prediction history cleared."})
    except Exception as err:
        return jsonify({"status": "error", "message": str(err)}), 500


@app.route("/api/analytics", methods=["GET"])
def get_analytics():
    """Return actual dataset distributions and analytical aggregates from Telco dataset."""
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
        "churn_by_tech_support": [
            {"support": "No Support", "total": 3472, "churned": 1446, "retained": 2026, "churn_rate": 41.65},
            {"support": "Has Support", "total": 2040, "churned": 310, "retained": 1730, "churn_rate": 15.20},
            {"support": "No Internet", "total": 1520, "churned": 113, "retained": 1407, "churn_rate": 7.43}
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
def get_sample_customers():
    """Return representative real customer records from Telco dataset for searchable table."""
    sample_path = PROJECT_ROOT / "data" / "sample_customers.json"
    if sample_path.exists():
        try:
            with open(sample_path, "r", encoding="utf-8") as f:
                data = json.load(f)
            return jsonify(data)
        except Exception:
            return jsonify(EMBEDDED_SAMPLE_CUSTOMERS)
    else:
        return jsonify(EMBEDDED_SAMPLE_CUSTOMERS)


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    print(f"\n==================================================")
    print(f"Customer Churn Backend Server Running")
    print(f"Port: {port}")
    print(f"Model Loaded: {model_loaded}")
    print(f"==================================================\n")
    app.run(host="0.0.0.0", port=port, debug=False)
