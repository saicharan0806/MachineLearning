# Flask Backend Service

This directory contains the Python Flask REST API for the Customer Churn Prediction system powered by an Elastic Net Regularized Logistic Regression model.

## Features

- **RESTful Endpoints**: Predict customer churn, query SQLite prediction logs, check health, and fetch dataset analytics.
- **Model Ingestion**: Seamlessly ingests `elastic_net_churn_model.pkl` and `churn_preprocessor.pkl`.
- **Validation**: Enforces the 20 features expected by the trained pipeline.
- **Persistent Audit Log**: Automatically writes predictions, customer attributes, probability metrics, and timestamps to SQLite.
- **CORS Enabled**: Configured for both local web servers and remote Google Colab tunnels.

---

## Local Setup

### 1. Install Dependencies
```bash
cd backend
pip install -r requirements.txt
```

### 2. Ensure Model Files are Present
Copy `elastic_net_churn_model.pkl` and `churn_preprocessor.pkl` into the `ml_model/` folder (or keep in `backend/`).

### 3. Run the Backend
```bash
python app.py
```
By default, the server runs on `http://127.0.0.1:5000`.

---

## Google Colab Execution

To run this backend directly from your Google Colab notebook environment alongside your trained model:

1. Copy the code from `colab_backend_runner.py` into a new Colab notebook cell.
2. Provide your free [ngrok](https://ngrok.com/) authentication token (or use `localtunnel`).
3. Run the cell. Colab will generate a public HTTPS URL (e.g., `https://abcdef.ngrok-free.app`).
4. Paste this URL into the **API Settings** modal in the frontend web application to connect.
