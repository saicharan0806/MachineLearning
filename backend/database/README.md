# SQLite Prediction Database

This directory stores the SQLite database (`churn_history.db`) used for persisting all customer churn predictions generated through the web application or REST API.

## Database Schema: `prediction_history`

| Column | Type | Description |
|--------|------|-------------|
| `id` | INTEGER PRIMARY KEY AUTOINCREMENT | Unique record ID |
| `customer_id` | TEXT | Customer identifier (or generated format `CUST-XXXXX`) |
| `timestamp` | DATETIME | Time prediction was generated |
| `tenure_months` | REAL | Customer tenure in months |
| `monthly_charges` | REAL | Monthly charge amount ($) |
| `total_charges` | REAL | Total charges over tenure ($) |
| `cltv` | REAL | Customer Lifetime Value |
| `contract` | TEXT | Contract type (`Month-to-month`, `One year`, `Two year`) |
| `internet_service` | TEXT | Service type (`DSL`, `Fiber optic`, `No`) |
| `payment_method` | TEXT | Payment method |
| `prediction` | INTEGER | `0` = Stay, `1` = Churn |
| `outcome_label` | TEXT | Display label (`Stay` or `Churn`) |
| `churn_probability` | REAL | Predicted probability of churn (0.0 to 1.0) |
| `stay_probability` | REAL | Predicted probability of retention (0.0 to 1.0) |
| `risk_level` | TEXT | Categorical risk: `Low` (<35%), `Moderate` (35%-60%), `High` (>60%) |
| `input_json` | TEXT | Full serialized raw inputs for auditability |

The database file is created automatically on application startup if it does not exist.
