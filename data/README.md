# Telco Customer Churn Dataset Documentation

This directory contains reference documentation and sample data schemas for the IBM Telco Customer Churn dataset utilized in this project.

## Dataset Summary

- **Source**: IBM Sample Data Sets / California Telco Dataset
- **Total Initial Records**: 7,043 customers
- **Total Records After Cleaning**: 7,032 customers (11 records with whitespace/missing `Total Charges` removed)
- **Features**: 33 original attributes (demographics, services subscribed, account details, charges, and churn flags)
- **Target Variable**: `Churn Label` (`Yes` = Churned: 1,869 customers / 26.58%, `No` = Retained: 5,163 customers / 73.42%)

---

## Data Cleaning Steps Applied (Notebook Cells 13 - 17)

1. **`Total Charges` Type Casting**:
   - The original `Total Charges` column was stored as text (`object`) due to 11 empty space values corresponding to new customers with `Tenure Months = 0`.
   - Coerced to numeric via `pd.to_numeric(df["Total Charges"], errors="coerce")`.
   - Dropped the 11 rows containing resulting `NaN` values, yielding exactly 7,032 valid records.

2. **Elimination of Non-Predictive & Data Leakage Columns**:
   - To prevent target leakage and overfitting, 12 non-generalizable columns were dropped:
     - Identification/Location: `CustomerID`, `Count`, `Country`, `State`, `City`, `Zip Code`, `Lat Long`, `Latitude`, `Longitude`
     - Post-hoc outcome metrics (Direct target leakage): `Churn Value` (encoded target), `Churn Score` (correlated risk index), `Churn Reason` (recorded only after churn).

3. **Final 20 Input Features**:
   - 4 Numeric: `Tenure Months`, `Monthly Charges`, `Total Charges`, `CLTV`
   - 16 Categorical: `Gender`, `Senior Citizen`, `Partner`, `Dependents`, `Phone Service`, `Multiple Lines`, `Internet Service`, `Online Security`, `Online Backup`, `Device Protection`, `Tech Support`, `Streaming TV`, `Streaming Movies`, `Contract`, `Paperless Billing`, `Payment Method`.

---

## Storage Policy

Per project guidelines, the complete raw Excel spreadsheet (`Telco_customer_churn.xlsx`) is stored in your Google Colab runtime environment and is not duplicated here to save local storage. A curated set of representative records from the dataset is stored in `sample_customers.json` to power the interactive Customer Records table.
