"""
Helper script to train and export the Elastic Net Churn Model and Preprocessor
locally from the Telco Customer Churn Excel dataset.
Replicates the exact training logic from notebook cells 75 - 102.
"""

import sys
import argparse
from pathlib import Path
import pandas as pd
import numpy as np
import joblib
from sklearn.model_selection import train_test_split
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score

def train_and_export(dataset_path: str, output_dir: str):
    print(f"Loading dataset from: {dataset_path}...")
    if dataset_path.endswith(".xlsx") or dataset_path.endswith(".xls"):
        df = pd.read_excel(dataset_path)
    else:
        df = pd.read_csv(dataset_path)

    print(f"Original dataset shape: {df.shape}")

    # Data cleaning from notebook: drop rows with missing Total Charges
    df["Total Charges"] = pd.to_numeric(df["Total Charges"], errors="coerce")
    df = df.dropna(subset=["Total Charges"])
    print(f"Shape after cleaning Total Charges: {df.shape}")

    # Target
    y = df["Churn Label"]
    X = df.drop(columns=["Churn Label"])

    # Features to drop as defined in notebook Cell 76
    columns_to_remove = [
        "CustomerID", "Count", "Country", "State", "City",
        "Zip Code", "Lat Long", "Latitude", "Longitude",
        "Churn Score", "Churn Reason", "Churn Value"
    ]
    X = X.drop(columns=[col for col in columns_to_remove if col in X.columns])

    print("Final training features (20 features):")
    print(X.columns.tolist())

    y_encoded = y.map({"No": 0, "Yes": 1})

    # Train-test split (Cell 77)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y_encoded, test_size=0.20, random_state=42, stratify=y_encoded
    )

    numeric_features = X_train.select_dtypes(include=np.number).columns.tolist()
    categorical_features = X_train.select_dtypes(include="object").columns.tolist()

    # Preprocessing pipeline (Cell 78)
    preprocessor = ColumnTransformer(
        transformers=[
            ("num", StandardScaler(), numeric_features),
            ("cat", OneHotEncoder(handle_unknown="ignore"), categorical_features)
        ]
    )

    X_train_processed = preprocessor.fit_transform(X_train)
    X_test_processed = preprocessor.transform(X_test)

    # Elastic Net model (Cell 79)
    best_model = LogisticRegression(
        penalty="elasticnet",
        solver="saga",
        C=1.0,
        l1_ratio=0.5,
        max_iter=1000,
        random_state=42
    )

    print("Fitting Elastic Net Logistic Regression model...")
    best_model.fit(X_train_processed, y_train)

    # Evaluation (Cell 90)
    y_pred = best_model.predict(X_test_processed)
    y_prob = best_model.predict_proba(X_test_processed)[:, 1]

    acc = accuracy_score(y_test, y_pred)
    prec = precision_score(y_test, y_pred)
    rec = recall_score(y_test, y_pred)
    f1 = f1_score(y_test, y_pred)
    auc = roc_auc_score(y_test, y_prob)

    print("\n===== MODEL EVALUATION RESULTS =====")
    print(f"Accuracy : {acc:.4f}")
    print(f"Precision: {prec:.4f}")
    print(f"Recall   : {rec:.4f}")
    print(f"F1-Score : {f1:.4f}")
    print(f"ROC-AUC  : {auc:.4f}")
    print("=====================================\n")

    out_path = Path(output_dir)
    out_path.mkdir(parents=True, exist_ok=True)

    model_file = out_path / "elastic_net_churn_model.pkl"
    preproc_file = out_path / "churn_preprocessor.pkl"

    joblib.dump(best_model, model_file)
    joblib.dump(preprocessor, preproc_file)

    print(f"Successfully saved model to: {model_file}")
    print(f"Successfully saved preprocessor to: {preproc_file}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train and save Elastic Net model")
    parser.add_argument("--dataset", type=str, default="Telco_customer_churn.xlsx", help="Path to Excel/CSV dataset")
    parser.add_argument("--output", type=str, default="../ml_model", help="Directory to save pickled models")
    args = parser.parse_args()

    train_and_export(args.dataset, args.output)
