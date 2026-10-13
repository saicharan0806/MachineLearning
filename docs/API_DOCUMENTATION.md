# REST API Documentation

This document describes the REST API endpoints provided by the Flask backend for the Customer Churn Prediction system.

Base URL (Local): `http://127.0.0.1:5000`  
Base URL (Colab Tunnel): `https://<your-subdomain>.ngrok-free.app`

---

## 1. System Endpoints

### `GET /api/health`
Checks the backend status, database availability, and model loading state.

#### Response Example
```json
{
  "status": "healthy",
  "model_loaded": true,
  "model_error": null,
  "expected_features_count": 20,
  "database": "connected",
  "server_time": "2026-10-13T10:15:00.123456",
  "environment": "Google Colab / Cloud"
}
```

---

### `GET /api/model-info`
Returns model metadata, hyperparameter configuration, and test evaluation metrics.

#### Response Example
```json
{
  "model_title": "Elastic Net Regularized Logistic Regression",
  "dataset": "IBM Telco Customer Churn (California telecommunications)",
  "cleaned_records": 7032,
  "metrics": {
    "accuracy": 0.8074,
    "precision": 0.6467,
    "recall": 0.6070,
    "f1_score": 0.6262,
    "roc_auc": 0.8433,
    "confusion_matrix": {
      "true_negative_stay": 909,
      "false_positive_churn": 124,
      "false_negative_stay": 147,
      "true_positive_churn": 227
    }
  }
}
```

---

## 2. Prediction Endpoints

### `POST /api/predict`
Calculates churn probability for a given customer profile, evaluates primary risk factors, and logs the outcome to SQLite.

#### Request Headers
`Content-Type: application/json`

#### Request Body
```json
{
  "CustomerID": "CUST-98214",
  "Gender": "Male",
  "Senior Citizen": "No",
  "Partner": "No",
  "Dependents": "No",
  "Tenure Months": 6,
  "Phone Service": "Yes",
  "Multiple Lines": "No",
  "Internet Service": "Fiber optic",
  "Online Security": "No",
  "Online Backup": "No",
  "Device Protection": "No",
  "Tech Support": "No",
  "Streaming TV": "Yes",
  "Streaming Movies": "Yes",
  "Contract": "Month-to-month",
  "Paperless Billing": "Yes",
  "Payment Method": "Electronic check",
  "Monthly Charges": 89.50,
  "Total Charges": 537.00,
  "CLTV": 3100
}
```

#### Response Example (200 OK)
```json
{
  "status": "success",
  "customer_id": "CUST-98214",
  "prediction": 1,
  "outcome": "Churn",
  "churn_probability": 0.7241,
  "stay_probability": 0.2759,
  "churn_percentage": 72.41,
  "stay_percentage": 27.59,
  "risk_level": "High",
  "factors": [
    {
      "factor": "Month-to-month Contract",
      "type": "risk",
      "weight": "+0.802",
      "text": "Month-to-month flexibility is the single largest structural churn trigger."
    },
    {
      "factor": "Low Tenure (6 months)",
      "type": "risk",
      "weight": "+1.365 effect",
      "text": "Customers in their first year exhibit peak vulnerability to competitor offers."
    }
  ],
  "timestamp": "2026-10-13 10:15:32",
  "record_id": 14
}
```

---

## 3. History Endpoints

### `GET /api/history`
Retrieves past prediction records stored in SQLite.

#### Query Parameters
- `limit` *(optional, integer, default: 100)*: Maximum records to return.

#### Response Example
```json
{
  "status": "success",
  "total_records": 1,
  "history": [
    {
      "id": 14,
      "customer_id": "CUST-98214",
      "timestamp": "2026-10-13 10:15:32",
      "tenure_months": 6.0,
      "monthly_charges": 89.50,
      "total_charges": 537.00,
      "contract": "Month-to-month",
      "internet_service": "Fiber optic",
      "prediction": 1,
      "outcome_label": "Churn",
      "churn_probability": 0.7241,
      "stay_probability": 0.2759,
      "risk_level": "High"
    }
  ]
}
```

### `DELETE /api/history`
Clears the SQLite prediction history table.

---

## 4. Analytics & Sample Data Endpoints

### `GET /api/analytics`
Returns aggregate statistics derived from the 7,032 Telco dataset records (churn by contract, tenure group, internet service, and feature coefficients).

### `GET /api/sample-customers`
Returns realistic customer profiles from the dataset for testing and table searches.
