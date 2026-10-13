# Customer Churn Prediction Using Elastic Net Regularized Logistic Regression

A college machine learning project featuring an end-to-end web application for predicting customer churn in telecommunications. Built with a React + Vite frontend, a Python Flask REST API backend, and an Elastic Net Logistic Regression pipeline trained in Google Colab on the IBM Telco Customer Churn dataset.

---

## Project Structure

```text
ML_Project/
│
├── frontend/                     # React + Vite Web Application
│   ├── public/                   # Static public assets
│   ├── src/
│   │   ├── components/           # Navigation, StatCards, Charts, Modals
│   │   ├── pages/                # 6 Complete Pages (Dashboard, Predict, Records, Analytics, History, About)
│   │   ├── services/             # API service client with configurable endpoints
│   │   ├── assets/               # Stylesheets and visual assets
│   │   ├── App.jsx               # Application routing and state management
│   │   └── main.jsx              # React DOM entrypoint
│   ├── index.html                # Single-page HTML shell
│   ├── package.json              # NPM dependencies & scripts
│   └── vite.config.js            # Vite build configuration
│
├── backend/                      # Python Flask REST API
│   ├── app.py                    # Flask server with REST endpoints & inference logic
│   ├── colab_backend_runner.py   # Dedicated runner script for executing backend directly in Google Colab
│   ├── train_or_export.py        # Local script to train and export model from Excel dataset
│   ├── requirements.txt          # Python package requirements
│   ├── database/                 # SQLite database directory & schema notes
│   │   └── README.md
│   └── README.md
│
├── ml_model/                     # Model artifacts directory
│   ├── README.md                 # Instructions for placing pickled model artifacts
│   ├── elastic_net_churn_model.pkl  # (Copied from Colab Cell 102)
│   └── churn_preprocessor.pkl       # (Copied from Colab Cell 102)
│
├── data/                         # Dataset assets and specifications
│   ├── README.md                 # Dataset dictionary & cleaning documentation
│   └── sample_customers.json     # Curated real Telco customer records
│
├── docs/                         # Detailed academic & technical documentation
│   ├── PROJECT_OVERVIEW.md       # Comprehensive ML project report
│   ├── SETUP_GUIDE.md            # Step-by-step local & Google Colab running guide
│   └── API_DOCUMENTATION.md      # Full REST API endpoint reference
│
├── ML final project1.ipynb       # Original Google Colab notebook (kept unchanged)
├── .gitignore                    # Git ignore file
└── README.md                     # Root project documentation
```

---

## Key Features

1. **Dashboard**: High-level KPI summary cards (7,032 total customers, 26.58% churn rate, 73.42% retention rate), recent predictions log, and quick distribution visualizers.
2. **Customer Prediction**: Interactive form validating the exact 20 input features required by the pipeline, with quick-fill presets, real-time probability outputs, risk classification (Low / Moderate / High), and personal risk factor explanations.
3. **Customer Records**: Searchable and filterable data table loaded with authentic Telco records, with pagination, contract filtering, and detailed customer inspection.
4. **Analytics**: Data visualizations covering Churn by Contract Type, Churn by Tenure Cohorts, Churn by Internet Service, Monthly Charges bands, and Top 15 Feature Importances from model coefficients.
5. **Prediction History**: Persistent SQLite audit table logging all predictions generated via the UI or API with timestamps, probabilities, and full customer payloads.
6. **About Project**: In-depth academic documentation outlining the project background, data cleaning, mathematical formulation of the Elastic Net penalty, actual test metrics, and confusion matrix.

---

## Design System & Human-Designed Palette

The interface adheres to a curated, professional color scheme:

- **Main Background**: `#F7F6F2` (Warm neutral)
- **Sidebar & Primary Headings**: `#253247` (Deep slate navy)
- **Primary Accent**: `#397A78` (Subtle teal/mineral cyan)
- **Cards & Surfaces**: `#FFFFFF` (Clean card background)
- **Borders & Dividers**: `#DDE2E5` (Light neutral border)
- **Churn Indicators**: `#B96752` (Terracotta red)
- **Retention Indicators**: `#56816A` (Sage green)

---

## Machine Learning Results (From Notebook Cell 90)

Evaluated on 1,407 test customer records ($20\%$ hold-out split):

| Metric | Score |
|---|---|
| **Accuracy** | **80.74%** |
| **ROC-AUC** | **84.33%** |
| **Precision** | **64.67%** |
| **Recall** | **60.70%** |
| **F1-Score** | **62.62%** |

---

## Quick Start

### 1. Run the Flask Backend
```bash
cd backend
pip install -r requirements.txt
python app.py
```

### 2. Run the React Frontend
```bash
cd frontend
npm install
npm run dev
```

### 3. Connect to Google Colab
If your backend is running in Google Colab:
1. Paste `backend/colab_backend_runner.py` into Colab and execute.
2. Copy your public ngrok tunnel URL (e.g. `https://xxxx.ngrok-free.app`).
3. Click **API Settings** in the frontend top navigation bar and paste the URL.
